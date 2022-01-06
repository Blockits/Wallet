/**
 * @file The entry point for the web extension singleton process.
 */
// import stream-browserify

import log from 'loglevel';
import extension from 'extensionizer';
import Migrator from './lib/migrator';
import migrations from './migrations';
import ExtensionPlatform from './platforms/extension';
import rawFirstTimeState from './first-time-state';
import ReadOnlyNetworkStore from './lib/network-store';
import LocalStore from './lib/local-store';
import { storeAsStream, storeTransformStream } from '@metamask/obs-store';
import createStreamSink from './lib/createStreamSink';
import PortStream from 'extension-port-stream';
import endOfStream from 'end-of-stream';
import 
  NotificationManager, {
  NOTIFICATION_MANAGER_EVENTS
} from './lib/notification-manager';
import WalletController, {
  WALLET_CONTROLLER_EVENTS,
} from './wallet-controller';
import { SECOND } from '../shared/constants/time';
import {
  ENVIRONMENT_TYPE_FULLSCREEN,
  ENVIRONMENT_TYPE_POPUP,
  ENVIRONMENT_TYPE_NOTIFICATION
} from '../shared/constants/app';
import {
  REJECT_NOTFICIATION_CLOSE,
  REJECT_NOTFICIATION_CLOSE_SIG
} from '../shared/constants/metametrics';
import pump from 'pump';
import debounce from 'debounce-stream';

const { sentry } = global;
const firstTimeState = { ...rawFirstTimeState };

log.setDefaultLevel(process.env.WALLET_DEBUG ? 'debug' : 'info');

const platform = new ExtensionPlatform();

// include notification Manager - still developing
const notificationManager = new NotificationManager();
global.WALLET_NOTIFIER = notificationManager;

// state persistence
const inTest = process.env.IN_TEST;
// include store - on developing
const localStore = inTest ? new ReadOnlyNetworkStore() : new LocalStore();
let versionedData;
// uncomment if -localStore is developed
if (inTest || process.env.WALLET_DEBUG) {
  global.WalletGetState = localStore.get.bind(localStore);
}

let popupIsOpen = false;
let notificationIsOpen = false;
let uiIsTriggering = false;
const openWalletTabsIDs = {};
const requestAccountTabIds = {};

// initialization flow
// initialize().catch(log.error);
export default function background_start() {
  initialize().catch(log.error);
}

/**
 * @typedef {import('../../shared/constants/transaction').TransactionMeta} TransactionMeta
 */

/**
 * The data emitted from the WalletController.store EventEmitter, also used to initialize the WalletController. Available in UI on React state as state.Wallet.
 * @typedef WalletState
 * @property {boolean} isInitialized - Whether the first vault has been created.
 * @property {boolean} isUnlocked - Whether the vault is currently decrypted and accounts are available for selection.
 * @property {boolean} isAccountMenuOpen - Represents whether the main account selection UI is currently displayed.
 * @property {Object} identities - An object matching lower-case hex addresses to Identity objects with "address" and "name" (nickname) keys.
 * @property {Object} unapprovedTxs - An object mapping transaction hashes to unapproved transactions.
 * @property {Array} frequentRpcList - A list of frequently used RPCs, including custom user-provided ones.
 * @property {Array} addressBook - A list of previously sent to addresses.
 * @property {Object} contractExchangeRates - Info about current token prices.
 * @property {Array} tokens - Tokens held by the current user, including their balances.
 * @property {Object} send - TODO: Document
 * @property {boolean} useBlockie - Indicates preferred user identicon format. True for blockie, false for Jazzicon.
 * @property {Object} featureFlags - An object for optional feature flags.
 * @property {boolean} welcomeScreen - True if welcome screen should be shown.
 * @property {string} currentLocale - A locale string matching the user's preferred display language.
 * @property {Object} provider - The current selected network provider.
 * @property {string} provider.rpcUrl - The address for the RPC API, if using an RPC API.
 * @property {string} provider.type - An identifier for the type of network selected, allows Wallet to use custom provider strategies for known networks.
 * @property {string} network - A stringified number of the current network ID.
 * @property {Object} accounts - An object mapping lower-case hex addresses to objects with "balance" and "address" keys, both storing hex string values.
 * @property {hex} currentBlockGasLimit - The most recently seen block gas limit, in a lower case hex prefixed string.
 * @property {TransactionMeta[]} currentNetworkTxList - An array of transactions associated with the currently selected network.
 * @property {Object} unapprovedMsgs - An object of messages pending approval, mapping a unique ID to the options.
 * @property {number} unapprovedMsgCount - The number of messages in unapprovedMsgs.
 * @property {Object} unapprovedPersonalMsgs - An object of messages pending approval, mapping a unique ID to the options.
 * @property {number} unapprovedPersonalMsgCount - The number of messages in unapprovedPersonalMsgs.
 * @property {Object} unapprovedEncryptionPublicKeyMsgs - An object of messages pending approval, mapping a unique ID to the options.
 * @property {number} unapprovedEncryptionPublicKeyMsgCount - The number of messages in EncryptionPublicKeyMsgs.
 * @property {Object} unapprovedDecryptMsgs - An object of messages pending approval, mapping a unique ID to the options.
 * @property {number} unapprovedDecryptMsgCount - The number of messages in unapprovedDecryptMsgs.
 * @property {Object} unapprovedTypedMsgs - An object of messages pending approval, mapping a unique ID to the options.
 * @property {number} unapprovedTypedMsgCount - The number of messages in unapprovedTypedMsgs.
 * @property {number} pendingApprovalCount - The number of pending request in the approval controller.
 * @property {string[]} keyringTypes - An array of unique keyring identifying strings, representing available strategies for creating accounts.
 * @property {Keyring[]} keyrings - An array of keyring descriptions, summarizing the accounts that are available for use, and what keyrings they belong to.
 * @property {string} selectedAddress - A lower case hex string of the currently selected address.
 * @property {string} currentCurrency - A string identifying the user's preferred display currency, for use in showing conversion rates.
 * @property {number} conversionRate - A number representing the current exchange rate from the user's preferred currency to Ether.
 * @property {number} conversionDate - A unix epoch date (ms) for the time the current conversion rate was last retrieved.
 * @property {boolean} forgottenPassword - Returns true if the user has initiated the password recovery screen, is recovering from seed phrase.
 */

/**
 * @typedef VersionedData
 * @property {WalletState} data - The data emitted from Wallet controller, or used to initialize it.
 * @property {Number} version - The latest migration version that has been run.
 */

/**
 * Initializes the Wallet controller, and sets up all platform configuration.
 * @returns {Promise} Setup complete.
 */
async function initialize() {
  const initState = await loadStateFromPersistence();
  await setupController(initState);
  console.log('Wallet initialization complete');
}

/**
 * Loads any stored data, prioritizing the latest storage strategy.
 * Migrates that data schema in case it was last loaded on an older version.
 * @returns {Promise<WalletState>} Last data emitted from previous instance of Wallet.
 */
async function loadStateFromPersistence() {
  // migrations
  const migrator = new Migrator({ migrations });
  migrator.on('error', console.warn);

  // read from disk
  // first from prefered , async API:
  versionedData = 
    (await localStore.get()) || migrator.generateInitialState(firstTimeState);

  // check if someshow state is empty
  // this should never happen but new error reporting suggests that it has
  // for a small number of users
  if (versionedData && !versionedData.data) {
    versionedData = migrator.generateInitialState(firstTimeState);
    sentry.captureMessage('Wallet - Empty vault found - unable to recover');
  }

  // report migration errors to sentry - just log error only, do it later
  migrator.on('error', (err) => {
    log.error(err);
  });

  // migrate data
  versionedData = await migrator.migrateData(versionedData);
  if (!versionedData) {
    throw new Error('Wallet - migrator return undefined');
  }
  // write to disk
  if (localStore.isSupported) {
    localStore.set(versionedData);
  } else {
    // throw in setTimeout so as to not block boot
    setTimeout(() => {
      throw new Error('Wallet - LocalStore not supported');
    });
  }

  // return just the data
  return versionedData.data;
}

/**
 * Initializes the Wallet Controller with any initial state and default language.
 * Configures platform-specific error reporting strategy.
 * Streams emitted state updates to platform-specific storage strategy.
 * Creates platform listeners for new Dapps/Contexts, and sets up their data connections to the controller.
 *
 * @param {Object} initState - The initial state to start the controller with, matches the state that is emitted from the controller.
 * @param {string} initLangCode - The region code for the language preferred by the current user.
 * @returns {Promise} After setup is complete.
 */
function setupController(initState) {
  //
  // Wallet Controller
  //

  const controller = new WalletController({
    //infuraProjectId: process.env.INFURA_PROJECT_ID,
    // User confirmation callbacks:
    //showUserConfirmation: triggerUi,
    // openPopup,
    // initial state
    initState,
    // platform specific api
    platform,
    extension,
    
    getRequestAccountTabIds: () => {
      return requestAccountTabIds;
    },
    getOpenMetamaskTabsIds: () => {
      return openWalletTabsIDs;
    },
    
  });

  // setup state persistence
  pump(
    storeAsStream(controller.store),
    debounce(1000),
    storeTransformStream(versionifyData),
    createStreamSink(persitData),
    (error) => {
      log.error('Wallet - Persistence pipeline failed', error);
    },
  );

  function versionifyData(state) {
    versionedData.data = state;
    return versionedData;
  }
  
  let dataPersistenceFailing = false;

  async function persitData(state) {
    if(!state) {
      throw new Error('Wallet - updated state is missing');
    }
    if(!state.data) {
      throw new Error('Wallet - updated state does not have data');
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
        log.error('error setting state in local store:', err);
      }
    }
  }

  //
  // Connect to other contexts
  //
  extension.runtime.onConnect.addListener(connectRemote);
  extension.runtime.onConnectExternal.addListener(connectExternal);

  const walletInternalProcessHash = {
    [ENVIRONMENT_TYPE_POPUP]: true,
    [ENVIRONMENT_TYPE_NOTIFICATION]: true,
    [ENVIRONMENT_TYPE_FULLSCREEN]: true,
  };

  const walletBlockedPorts = ['trezor-connect'];

  const isClientOpenStatus = () => {
    return (
      popupIsOpen ||
      Boolean(Object.keys(openWalletTabsIDs).length) ||
      notificationIsOpen
    );
  };

  const onCloseEnvironmentInstances = (isClientOpen, environmentType) => {
    // if all instances of metamask are closed we call a method on the controller to stop gasFeeController polling
    if (isClientOpen === false) {
      controller.onClientClosed();
      // otherwise we want to only remove the polling tokens for the environment type that has closed
    } else {
      // in the case of fullscreen environment a user might have multiple tabs open so we don't want to disconnect all of
      // its corresponding polling tokens unless all tabs are closed.
      if (
        environmentType === ENVIRONMENT_TYPE_FULLSCREEN &&
        Boolean(Object.keys(openWalletTabsIDs).length)
      ) {
        return;
      }
      controller.onEnvironmentTypeClosed(environmentType);
    }
  };


  function connectRemote(remotePort) {
    log.info('connectRemote');
    const processName = remotePort.name;
    const isWalletInternalProcess = walletInternalProcessHash[processName];
    if(walletBlockedPorts.includes(remotePort.name)) {
      return;
    }
    if (isWalletInternalProcess) {
      const portStream = new PortStream(remotePort);
      // communication with popup
      controller.isClientOpen = true;
      controller.setupTrustedCommunication(portStream, remotePort.sender);

      if (processName === ENVIRONMENT_TYPE_POPUP) {
        popupIsOpen = true;
        endOfStream(portStream, () => {
          popupIsOpen = false;
          const isClientOpen = isClientOpenStatus();
          controller.isClientOpen = isClientOpen;
          onCloseEnvironmentInstances(isClientOpen, ENVIRONMENT_TYPE_POPUP);
        });
      }

      if (processName === ENVIRONMENT_TYPE_NOTIFICATION) {
        notificationIsOpen = true;

        endOfStream(portStream, () => {
          notificationIsOpen = false;
          const isClientOpen = isClientOpenStatus();
          controller.isClientOpen  = isClientOpen;
          onCloseEnvironmentInstances(
            isClientOpen,
            ENVIRONMENT_TYPE_NOTIFICATION,
          );
        });
      }

      if (processName === ENVIRONMENT_TYPE_FULLSCREEN) {
        const tabId = remotePort.sender.tab.id;
        openWalletTabsIDs[tabId] = true;

        endOfStream(portStream, () => {
          delete openWalletTabsIDs[tabId];
          const isClientOpen = isClientOpenStatus();
          controller.isClientOpen = isClientOpen;
          onCloseEnvironmentInstances(
            isClientOpen,
            ENVIRONMENT_TYPE_FULLSCREEN,
          );
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
      connectExternal(remotePort);
    }
  }

  function connectExternal(remotePort) {
    log.info(`connectExternal: '${remotePort.name}'`);
    const portStream = new PortStream(remotePort);
    controller.setupUntrustedCommunication(portStream, remotePort.sender);    
  }

}



/**
 * Opens the browser popup for user confirmation
 */
async function triggerUi() {
  const tabs = await platform.getActiveTabs();
  const currentActiveWalletTab = Boolean(
    tabs.find((tab) => openWalletTabsIDs[tab.id]),
  );
  // Vivaldi is not closing port connection on popup close, so popupIsOpen doest not work correctly
  // To be reviewed in the future if this behavior is fixed - also the way determine isValid variable might change at some point
  const isVivaldi = 
    tabs.length > 0 &&
    tabs[0].extData &&
    tabs[0].extData.indexOf('vivaldi_tab') > -1;
  if (
    !uiIsTriggering &&
    (isVivaldi || !popupIsOpen) &&
    !currentActiveWalletTab
  ) {
    uiIsTriggering = true;
    try {
      await notificationManager.showPopup();
    } finally {
      uiIsTriggering = false;
    }
  }
}

/**
 * Opens the browser popup for user confirmation of watchAsset
 * then it waits until user interact with the UI
 */
async function openPopup() {
  await triggerUi();
  await new Promise((resolve) => {
    const interval = setInterval(() => {
      if (!notificationIsOpen) {
        clearInterval(interval);
        resolve();
      }
    }, SECOND);
  });
}

// On first install, open a new tab with Wallet
extension.runtime.onInstalled.addListener(({ reason }) => {
  if (
    reason === 'install' &&
    !(process.env.WALLET_DEBUG || process.env.IN_TEST)
  ) {
    platform.openExtensionInBrowser();
  }
});
