/**
 * @file ui initialization for Wallet
 */
// polyfills
import '@formatjs/intl-relativetimeformat/polyfill';
// dev only, "react-devtools" import is skipped in prod builds
// import 'react-devtools';
// extension-port-stream from Metamask create a Stream of Runtime.Port
import PortStream from 'extension-port-stream';
// extensionizer from MetaMask used to build multi browser extension application
import extension from 'extensionizer';

import Eth from 'ethjs';
import EthQuery from 'eth-query';
// web3-stream-provider from Metamask - used to create Ethereum Web3 Provider forward payload though stream
import StreamProvider from 'web3-stream-provider';
import log from 'loglevel';

import launchWalletUi from '../pages/Popup/wallet';
import ExtensionPlatform from './platforms/extension';
import { getEnvironmentType } from './lib/utils';
import { 
  ENVIRONMENT_TYPE_POPUP,
  ENVIRONMENT_TYPE_FULLSCREEN
} from '../shared/constants/app';
import { setupMultiplex } from './lib/stream-utils';
import metaRPCClientFactory from './lib/metaRPCClientFactory';

// start script
// start().catch(log.error);
export default function ui_start() {
  initialize().catch(log.error);
}

/**
 * start() will init Wallet
 */
async function initialize() {
  //create platform global
  global.platform = new ExtensionPlatform();

  // indentify window type (popup , notification)
  const windowType = getEnvironmentType();
 
  // setup stream to background
  const extensionPort = extension.runtime.connect({name: windowType});
  console.log(`extensionPort is : '${extensionPort}'`);
  const connectionStream = new PortStream(extensionPort);

  // activeTab hook to current open Tab on Window
  const activeTab = await queryCurrentActiveTab(windowType);
  initializeUiWithTab(activeTab);

  // display in case of Error
  function displayCriticalError(container, err) {
    container.innerHTML = 
      '<div class="critical-error">The Wallet app failed to load: please open and close Wallet again to restart.</div>';
    container.style.height = '80px';
    log.error(err.stack);
    throw err;
  }
  // Init UI on Tab 
  function initializeUiWithTab(tab) {
    const container = document.getElementById('app-container');
    initializeUi(tab, container, connectionStream, (err, store) => {
      if(err) {
        displayCriticalError(container, err);
        return;
      }
      // fetch state from store , default as first initialization
      const state = store.getState();
      const { wallet: { completeOnBoarding } = {} } = state;

      if (!completeOnBoarding && windowType !== ENVIRONMENT_TYPE_FULLSCREEN ) {
        global.platform.openExtensionInBrowser();
      }
    });
  }
}


async function queryCurrentActiveTab(windowType) {
  return new Promise((resolve) => {
    // At the time of writing we only have `activeTab` permission which means
    // that this query will only succeed in the popup context (i.e. after a browser Action)
    if(windowType !== ENVIRONMENT_TYPE_POPUP) {
      resolve();
      return;
    }
    
    extension.tabs.query({active: true, currentWindow: true}, (tabs)=> {
      const [activeTab] = tabs;
      const { id, title ,url } = activeTab;
      const { origin, protocol } = url ? new URL(url) : {};

      if(!origin || origin === 'null') {
        resolve();
        return;
      }
      resolve({id, title, origin, protocol, url });
    });
  });
}


function initializeUi(activeTab, container, connectionStream, cb) {
  connectToAccountManager(connectionStream, (err , backgroundConnection) => {
    if(err) {
      cb(err);
      return;
    }
    
    launchWalletUi(
      {
        activeTab,
        container,
        backgroundConnection,
      },
      cb,
    );
  });
}

/**
 * Establishes a connection to the background and a web3 provider
 * @param {PortDuplexStream} connectionStream - PortStream instance establishing a background connection
 * @param {Function} cb - Called when controller connection is established 
 */
function connectToAccountManager(connectionStream, cb) {
  const mx = setupMultiplex(connectionStream);
  setupControllerConnection(mx.createStream('controller'), cb);
  setupWeb3Connection(mx.createStream('provider'));
}

/**
 * 
 * @param {PortDuplexStream} connectionStream - PortStream instance establishing a background connection
 */
function setupWeb3Connection(connectionStream) {
  const providerStream = new StreamProvider();
  providerStream.pipe(connectionStream).pipe(providerStream);
  connectionStream.on('error', console.error.bind(console));
  providerStream.on('error', console.error.bind(console));
  global.ethereumProvider = providerStream;
  global.ethQuery = new EthQuery(providerStream);
  global.eth = new Eth(providerStream);
}

/**
 * 
 * @param {PortDuplexStream} connectionStream - PortStream instance establishing a background connection
 * @param {Function} cb - Called when the remote account manager connection is established 
 */
function setupControllerConnection(connectionStream, cb) {
  const backgroundRPC = metaRPCClientFactory(connectionStream);
  cb(null, backgroundRPC);
}