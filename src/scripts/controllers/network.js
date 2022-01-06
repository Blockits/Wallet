/**
 * @file network controller 
 */
import { SECOND } from "../../shared/constants/time";
import getFetchWithTimeout from "../../shared/modules/fetch-with-timeout";
import {
  RINKEBY,
  RINKEBY_CHAIN_ID,
  MAINNET,
  MAINNET_CHAIN_ID,
  NETWORK_TYPE_RPC,
  NETWORK_TYPE_TO_ID_MAP
} from '../../shared/constants/network';
import { EventEmitter } from "stream";
import { ComposedStore, ObservableStore } from '@metamask/obs-store';

const env = process.env.WALLET_ENV;
const fetchWithTimeout = getFetchWithTimeout(SECOND * 30);

let defaultProviderConfigOpts;
if (process.env.IN_TEST) {
  defaultProviderConfigOpts = {
    type: NETWORK_TYPE_RPC,
    rpcUrl: 'http://localhost:8545',
    chainId: '0x539',
    nickname: 'Localhost 8545',
  };
} else if ( process.env.WALLET_ENV || env === 'test') {
  defaultProviderConfigOpts = { type: RINKEBY, chainId: RINKEBY_CHAIN_ID };
} else {
  defaultProviderConfigOpts = { type: MAINNET, chainId: MAINNET_CHAIN_ID };
}

const defaultProviderConfig = {
  ticker: 'ETH',
  ...defaultProviderConfigOpts,
};

const defaultNetworkDetailState = {
  EIPS: { 1559: undefined },
};

export const NETWORK_EVENTS = {
  // Fired after the actively selected network is changed
  NETWORK_DID_CHANGE: 'networkDidChange',
  // Fired when the actively selected network will* change
  NETWORK_WILL_CHANGE: 'networkWillChange',
  // Fired when Infura returns an error indicating no support
  NETWORK_IS_BLOCKED: 'infuraIsBlocked',
  // Fired when not using an Infura network or when Infura returns no error, indicating support
  NETWORK_IS_UNBLOCKED: 'infuraIsUnBlocked'
}

export default class NetworkController extends EventEmitter {
  constructor(opts = {}) {
    super();
  
  // create stores
  this.providerStore = new ObservableStore(
    opts.provider || { ...defaultProviderConfig },
  );
  this.previousProviderStore = new ObservableStore(
    this.providerStore.getState(),
  );
  this.networkStore = new ObservableStore('loading');

  this.networkDefails = new ObservableStore(
    opts.networkDefails || {
      ...defaultNetworkDetailState,
    },
  );
  this.store = new ComposedStore({
    provider: this.providerStore,
    previousProviderStore: this.previousProviderStore,
    network: this.networkStore,
    networkDetails: this.networkDefails,
  });

  // provider and block tracker
  this._provider = null;
  this._blockTracker = null;

  // provider and block tracker proxies - because the network changes
  this._proxy = null;
  this._blockTrackerProxy = null;

  this.on(NETWORK_EVENTS.NETWORK_DID_CHANGE, this.lookupNetwork);
  }

  /**
   * Sets the Infura project ID
   * @param {string} projectId - The Infura project ID
   * @throws {Error} if the project ID is not a valid string
   * @returns {void}
   */
  //setInfuraProjectId(projectId) {}

  //initializeProvider(providerParams) {}

  // return the proxies so the references will always be good
  //getProviderAndBlockTracker() {}

  /**
   * Method to return the latest block for the current network
   * @returns {Object} Block header
   */
  //getLatestBlock() {}

  /**
   * Method to check if the block header contains fields that indicate EIP 1559
   * support (baseFeePerGas).
   * @returns {Promise<boolean>}  true if current network support EIP 1559
   */
  //async getEIP1559Compatibility() {}

  //verifyNetwork() {}

  //getNetworkState() {}

  //setNetworkState() {}

  /**
   * Set EIP support indication in the network Details store
   * @param {number} EIPNumber - the number of the EIP to mark support for
   * @param {boolean} isSupported - True if the EIP is supported
   */
  //setNetworkEIPSupport(EIPNumber, isSupported) {}

  /**
   * Reset EIP support to default ( no support)
   */
  //clearNetworkDetails() {}

  //isNetworkLoading() {}

  //lookupNetwork() {}

  //getCurrentChainId() {}

  //setRpcTarget(rpcUrl, chainId, ticket = 'ETH', nickname = '', rpcPrefs) {}

  //async setProviderType(type) {}

  //resetConnection() {}

  //setProviderConfig(config) {}

  //rollbackToPreviousProvider() {}

  //getProviderConfig() {}

  //getNetworkIdentifier() {}

  //
  // Private
  //
  //async _checkInfuraAvailability(network) {}

  //_switchNetwork(opts) {}

  //_configureProvider({type, rpcUrl, chainId}) {}

  //_configureInfuraProvider(type, projectId) {}

  //_configureStandardProvider(rpcUrl, chainId) {}

  //_setNetworkClient({ networkMiddleware, blockTracker}) {}

  //_setProviderAndBlockTracker({ provider, blockTracker}) {}
  
}