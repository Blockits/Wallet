import EventEmitter from 'events';
import extension from 'extensionizer';
import ExtensionPlatform from '../../../scripts/platforms/extension';
import log from 'loglevel';
import { getEnvironmentType } from '../../../shared/libs';
import PortStream from 'extension-port-stream';
import { 
  ENVIRONMENT_TYPE_POPUP,
  ENVIRONMENT_TYPE_FULLSCREEN,
  ENVIRONMENT_TYPE_BACKGROUND,
  ENVIRONMENT_TYPE_NOTIFICATION
} from '../../../shared/constants/app';
import { metaRPCClientFactory } from '../../../shared/libs';
import { setupMultiplexer } from '../../../shared/libs';
import configureStore from '../../../store/store';



// create platform global
global.platform = new ExtensionPlatform();

export class UI extends EventEmitter {

  /**
   * constructor
   * @param {Object} opts - configuration by platform and previous store
   */
  constructor(opts) {
    super();
    this.store = {};
    // identify window type (popup, notification)
    this.windowType = getEnvironmentType();
    // setup stream to background
    this.extensionPort = extension.runtime.connect({ name: this.windowType });
    this.connStream = new PortStream(this.extensionPort);
    this.activeTab = this._queryCurrentActiveTab(this.windowType).then((obs) => { return obs; });
    this.connection = this._initializeUiWithTab(this.activeTab);
  }

  _initializeUiWithTab(tab) {
    const container = document.getElementById('app-container');
    this._initializeUi(tab, container, this.connStream, (err, store) => {
      if(err) {
        console.log(container, err);
      }

      const state = store.getState();
      const { wallet: { completedOnboarding } = {} } = state;
      
      if (!completedOnboarding && this.windowType !== ENVIRONMENT_TYPE_FULLSCREEN) {
        global.platform.openExtensionInBrowser();
      }
    });
  }


  async _queryCurrentActiveTab(windowType) {
    return new Promise((resolve) => {
      if (windowType !== ENVIRONMENT_TYPE_POPUP) {
        return resolve({});
      }

      extension.tabs.query({active: true, currentWindow: true}, (tabs) => {
        const [activeTab] = tabs;
        const { id, title, url } = activeTab;
        const { origin , protocol } = url ? new URL(url) : {};

        if (!origin || origin === 'null') {
          return resolve({});
        }

        return resolve({ id, title, origin, protocol, url});
      });
    });
  }

  _initializeUi(activeTab, container, connStream, cb) {
    this._connectToAccountManager(connStream, (err, streamConn) => {
      if(err) {
        cb(err);
        return;
      }

      this._launchWalletUi(
        {
          activeTab,
          container,
          streamConn,
        },
        cb,
      );
    });
  }

  _connectToAccountManager(connStream, cb) {
    const mx = setupMultiplexer(connStream);
    this._setupStreamConnection(mx.createStream('controller'), cb);
  }

  _setupStreamConnection(connStream, cb) {
    const streamRpc = metaRPCClientFactory(connStream);
    cb(null, streamRpc);
  }

  _launchWalletUi(opts, cb) {
    const { streamConn } = opts;
    streamConn.getState((err, walletState) => {
      if(err) {
        cb(err);
        return;
      }
      this._startApp(walletState, streamConn, opts).then((store) => {
        cb(null, store);
      });
    });
  }

  async _startApp(walletState, streamConn, opts) {
    // parse opts
    if (!walletState.featureFlags) {
      walletState.featureFlags = {};
    }

    const draftInitialState = {
      activeTab: opts.activeTab,
      wallet: walletState,
      appState: {},
    };

    const store = configureStore(draftInitialState);

    return store;
  }

}