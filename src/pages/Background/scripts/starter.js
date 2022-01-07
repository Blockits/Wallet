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
import Migrator from '../../../scripts/lib/migrator';
import migrations  from '../../../scripts/migrations';
import firstTimeState from './first-time-state';


let versionedData;
const inTest = process.env.IN_TEST;
const localStore = inTest ? new ReadOnlyNetworkStore() : new ExtensionStore();


export function start() {
  initialize().catch(log.error);
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
    initState
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
}

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
extension.runtime.onConnect.addListener((e) => { log.info(`new connection established: '${e}'`)});
