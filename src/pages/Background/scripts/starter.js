/**
 * @file the entrypoint for the web extension singleton process background.
 */
import { 
  ExtensionStore,
  ReadOnlyNetworkStore,
  createStreamSink,
  getObjStructure,
} from '../../../shared/libs';
import { StreamService } from '../shared/libs';
import { storeAsStream, storeTransformStream } from '@blockits/obs-store';
import log from 'loglevel';
import pump from 'pump';
import debounce from 'debounce-stream';
import extension from 'extensionizer';
import PortStream from 'extension-port-stream';
import ExtensionPlatform from '../../../scripts/platforms/extension';
import Migrator from '../../../scripts/lib/migrator';
import migrations  from '../../../scripts/migrations';
import firstTimeState from './first-time-state';
import endOfStream from 'end-of-stream';
import { IN_TEST, WALLET_DEBUG } from '../../../../utils/env';
import NotificationManager, {
  NOTIFICATION_MANAGER_EVENTS
} from '../../../scripts/lib/notification-manager';
import { 
  ENVIRONMENT_TYPE_FULLSCREEN,
  ENVIRONMENT_TYPE_NOTIFICATION,
  ENVIRONMENT_TYPE_POPUP } 
from '../../../shared/constants/app';

log.setDefaultLevel(WALLET_DEBUG ? 'debug' : 'info');

const platform = new ExtensionPlatform();

const notificationManager = new NotificationManager();
global.WALLET_NOTIFIER =  notificationManager;

let popupIsOpen = false;
let notificationIsOpen = false;
let uiIsTriggering = false;
const openWalletTabsIds = {};
const requestAccountTabIds = {};

let versionedData;
const localStore = IN_TEST ? new ReadOnlyNetworkStore() : new ExtensionStore();

if (IN_TEST || WALLET_DEBUG) {
  global.walletState = localStore.get.bind(localStore);
}

export function start() {
  initialize().catch(console.error);
}

async function initialize() {
  const initState = await loadStateFromPersistence();
  await setupController(initState);
  console.log('Wallet initialization completed.');
}

/**
 * Load form disk first if not exist ( firsttime) migrate new empty state
 * @returns {Promise<WalletState} Last data emitted from previous instance of Wallet
 */
async function loadStateFromPersistence() {
  // migrations
  const migrator = new Migrator({migrations});
  migrator.on('error', console.warn);

  // read from disk
  // first from prefereed , async API:
  versionedData = 
  (await localStore.get()) || migrator.generateInitialState(firstTimeState);

  if (versionedData && !versionedData.data) {
    versionedData = migrator.generateInitialState(firstTimeState);
  }
  
  // hook on migration error
  migrator.on('error', (err) => {
    const vaultStructure = getObjStructure(versionedData);
    console.error(`vaultStructure failed: ${vaultStructure}`);
  })

  // migrate data
  versionedData = await migrator.migrateData(versionedData);
  if(!versionedData) {
    throw new Error('Wallet - migrator return undefiend');
  }

  // write to disk
  if (localStore.isSupported) {
    localStore.set(versionedData);
  } else {
    // throw in setTimeout so as to not block boot
    setTimeout(() => {
      throw new Error('Wallet - LocalStorage not supported');
    });
  }

  // return just the data
  return versionedData.data;
}

async function setupController(initState) {
  const controller = new StreamService({
    initState,
    platform,
    extension,
  });
  
  pump(
    storeAsStream(controller.store),
    debounce(1000),
    storeTransformStream(versionifyData),
    createStreamSink(persistData),
    (err) => {
      log.error('Wallet - Persistence pipeline failed', err);
    },
  );

  function versionifyData(state) {
    versionedData.data = state;
    return versionedData;
  }
  
  let dataPersistenceFailing = false;
  
  async function persistData(state) {
    if(!state) {
      throw new Error('Wallet - updated state is missing.');
    }
    if(!state.data) {
      throw new Error('Wallet - updated state does not have data.');
    }
    if(localStore.isSupported) {
      try {
        await localStore.set(state);
        if (dataPersistenceFailing) {
          dataPersistenceFailing = false;
        }
        
      } catch (err) {
        if (!dataPersistenceFailing) {
          dataPersistenceFailing = true;
        }
        log.error('error setting state in local store: ', err);
      }
    }
  }

  //
  // connect to other contexts
  //
  extension.runtime.onConnect.addListener((e) => { 
  console.log(`new connection established: '${e}'`);
  connectRemote(e);

  });

  const walletInternalProcessHash = {
    [ENVIRONMENT_TYPE_POPUP]: true,
    [ENVIRONMENT_TYPE_NOTIFICATION]: true,
    [ENVIRONMENT_TYPE_FULLSCREEN]: true,
  };  

  function connectRemote(remotePort) {
    const processName = remotePort.name;
    const isInternalProcess = walletInternalProcessHash[processName];
  
    if (isInternalProcess) {
      const portStream = new PortStream(remotePort);
      // communication with popup
      controller.setupCommunicationBySender(portStream, remotePort.sender);
    
      if (processName === ENVIRONMENT_TYPE_POPUP) {
        popupIsOpen = true;
        
        endOfStream(portStream, () => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          popupIsOpen = false;
          console.log('end Stream of Popup');
        });
      }

      if (processName === ENVIRONMENT_TYPE_NOTIFICATION) {
        notificationIsOpen = true;

        endOfStream(portStream, () => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          notificationIsOpen = false;
          console.log('end Stream to Notification');
        });
      }

      if (processName === ENVIRONMENT_TYPE_FULLSCREEN) {
        const tabId = remotePort.sender.tab.id;
        openWalletTabsIds[tabId] = true;

        endOfStream(portStream, () => {
          delete openWalletTabsIds[tabId];
          console.log('end Stream to Fullscreen');
        });
      }
    } else {
      if (remotePort.sender && remotePort.sender.tab && remotePort.sender.url) {
        const tabId = remotePort.sender.tab.id;
        const url = new URL(remotePort.sender.url);
        const { origin } = url;

        remotePort.onMessage.addListener((msg) => {
          if (msg.data && msg.data.method === 'eth_requestAccounts') {
            requestAccountTabIds[origin] = tabId;
          }
        });
      }
      console.log('need to call connectExternal maybe some from other app or wallet');
    }
  }

  notificationManager.on(
    NOTIFICATION_MANAGER_EVENTS.POPUP_CLOSED,
    console.log,
  );

  return Promise.resolve();
}


