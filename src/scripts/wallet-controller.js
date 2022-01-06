/**
 * @file Main Wallet Controller to handle Event from network and Action of User
 */
import EventEmitter from 'events';
import pump from 'pump';
import { MILLISECOND } from '../shared/constants/time';
import { debounce } from 'lodash';
import { Mutex } from 'await-semaphore';
import { stripHexPrefix } from 'ethereumjs-util';
import log from 'loglevel';
import ComposableObservableStore from './lib/ComposableObservableStore';
import { captureException } from '@sentry/browser';
import TrezorKeyring from 'eth-trezor-keyring';
import LedgerBridgeKeyring from '@metamask/eth-ledger-bridge-keyring';
import LatticeKeyring from 'eth-lattice-keyring';
import KeyringController from 'eth-keyring-controller';
import { SUBJECT_TYPES } from '../shared/constants/app';
import createMetaRPCHandler from './lib/createMetaRPCHandler';
import { createEngineStream } from 'json-rpc-middleware-stream';
import { storeAsStream } from '@metamask/obs-store/dist/asStream';
import { JsonRpcEngine } from 'json-rpc-engine';
import { createFilterMiddleware } from 'eth-json-rpc-filters';
import { providerAsMiddleware } from 'eth-json-rpc-middleware';
import {
  AddressBookController,
  ApprovalController,
  ControllerMessenger,
  CurrencyRateController,
  PhishingController,
  NotificationController,
  GasFeeController,
  TokenListController,
  TokensController,
  TokenRatesController,
  CollectiblesController,
  AssetsContractController,
  CollectibleDetectionController,
} from '@metamask/controllers';
import { setupMultiplex } from './lib/stream-utils';

export const WALLET_CONTROLLER_EVENTS = {
  // Fired after state changes that impact the extension badge (unapproved msg count)
  // The process of updating the badge happens in app/scripts/background.js.
  UPDATE_BADGE: 'updateBadge',
  // TODO: Add this and similar enums to @Wallet/controllers and export them
  APPROVAL_STATE_CHANGE: 'ApprovalController:stateChange',
};

export default class WalletController extends EventEmitter {
  /**
   * @constructor
   * @param {Object} opts
   */
  constructor(opts) {
    super();

    this.defaultMaxListeners = 20;

    this.sendUpdate = debounce(
      this.privateSendUpdate.bind(this),
      MILLISECOND * 200,
    );
    this.opts = opts;
    this.extension = opts.extension;
    this.platform = opts.platform;
    const initState = opts.initState || {};
    const version = this.platform.getVersion();
    this.recordFirstTimeInfo(initState);

    // this keeps track of how many "controllerStream" connections are open
    // the only thing that uses controller connections are open Wallet UI instances
    this.activeControllerConnections = 0;

    this.getRequestAccountTabIds = opts.getRequestAccountTabIds;
    this.getOpenWalletTabsIds = opts.getOpenWalletTabsIds;

    this.controllerMessenger = new ControllerMessenger();

    // observable state store
    this.store = new ComposableObservableStore({
      state: initState,
      controllerMessenger: this.controllerMessenger,
      persist: true,
    });

    // external connections by origin
    // Do not modify directly. Use the associated methods.
    this.connections = {};

    // lock to ensure only one vault created at once
    this.createVaultMutex = new Mutex();

    this.extension.runtime.onInstalled.addListener((details) => {
      if (details.reason === 'update' && version === '8.1.0') {
        this.platform.openExtensionInBrowser();
      }
    });

    // next, we will initialize the controllers
    // controller initialization order matters

    this.approvalController = new ApprovalController({
      messenger: this.controllerMessenger.getRestricted({
        name: 'ApprovalController',
      }),
      showApprovalRequest: opts.showUserConfirmation,
    });

    /*
    this.networkController = new NetworkController(initState.NetworkController);
    this.networkController.setInfuraProjectId(opts.infuraProjectId);
    */
    // now we can initialize the RPC provider, which other controllers require
    /*
    this.initializeProvider();
    this.provider =
      this.networkController.getProviderAndBlockTracker().provider;
    this.blockTracker =
      this.networkController.getProviderAndBlockTracker().blockTracker;
    */

    // preferencesController  - On Developing
    /*
    this.preferencesController = new PreferencesController({

    });
    */

    // tokenController - On Developing
    /*
    this.tokensController = new TokensController({

    });
    */

    // asset Contract Controller - On Developing
    /*
    this.assetsContractController = new AssetsContractController({
      provider: this.provider,
    });
    */

    // collectibles Controller - On Developing
    /*
    this.collectiblesController = new CollectiblesController({

    });
    */

    // metaMetricsController - On Developing
    /*
    this.metaMetricsController = new MetaMetricsController({
    
    });
    */

    // gasFee Controller
    /*
    const gasFeeMessenger = this.controllerMessenger.getRestricted({
      name: 'GasFeeController',
    });

    const gasApiBaseUrl = process.env.SWAPS_USE_DEV_APIS
      ? GAS_DEV_API_BASE_URL
      : GAS_API_BASE_URL;
    
    
    this.gasFeeController = new GasFeeController({
    
    });
    */
    // hardware Key Ring - on Developing
    /*
    this.qrHardwareKeyring = new QRHardwareKeyring();
    */

    // app State Controller - on Developing
    /*
    this.appStateController = new AppStateController({
    
    });
    */

    // Currency Rate Controller - on Developing
    /*
    const currencyRateMessenger = this.controllerMessenger.getRestricted({

    });
    this.currencyRateController = new CurrencyRateController({

    });
    */

    // Token List Controller - on Developing
    /*
    const tokenListMessenger = this.controllerMessenger.getRestricted({
      name: 'TokenListController',
    });
    this.tokenListController = new TokenListController({
    });
    */

    // token exchange rate tracker - on Developing
    /*
    this.tokenRatesController = new TokenRatesController({
    
    });
    */

    // ens Controller - on Developing
    /*
    this.ensController = new EnsController({
    
    })
    */

    // account tracker watches balances, nonces, and any code at their address
    /*
    this.accountTracker = new AccountTracker({
    
    });
    */

    // start and stop polling for balances based on activeControllerConnections - on Developing
    /*
    this.on('controllerConnectionChanged', (activeControllerConnections) => {
    
    }
    */

    // Permission Controller - On Developing
    /*
    this.permissionController = new PermissionController({
    
    });
    */

    // Permission Log Controller - On Developing
    /*
    this.permissionLogController = new PermissionLogController({
    
    });
    */

    // Subject Metadata Controller - On Developing
    /*
    this.subjectMetadataController = new SubjectMetadataController({
    
    });
    */

    // Detect Token Controller - On Developing
    /*
    this.detectTokensController = new DetectTokensController({
    
    })
    */

    // Address Book Controller - ON Developing
    /* 
    this.addressBookController = new AddressBookController(
    );
    */

    // Alert Controller - On Developing
    /*
    this.alertController = new AlertController({
    
    });
    */

    // Three Box Controller - On Developing
    /*
    this.threeBoxController = new ThreeBoxController({
    
    });
    */

    // Tx Controller - On Developing
    /*
    this.txController = new TransactionController({
    
    });
    */

    // Swap Controller - On Developing
    /*
    this.swapsController = new SwapsController({
    
    })
    */

    // keyringController
    const additionalKeyRings = [
      TrezorKeyring,
      LedgerBridgeKeyring,
      LatticeKeyring
    ];
    this.keyringController = new KeyringController({
      keyringTypes: additionalKeyRings,
      initState: initState.KeyringController,
      encryptor: opts.encryptor || undefined,
    });
    this.keyringController.memStore.subscribe((state) =>
      this._onKeyringControllerUpdate(state),
    );
    this.keyringController.on('unlock', () => this._onUnlock());
    this.keyringController.on('lock', () => this._onLock());

    // memStore
    this.memStore = new ComposableObservableStore({
      config: {},
      controllerMessenger: this.controllerMessenger,
    });


    // this.setupControllerEventSubscriptions();

    // TODO:LegacyProvider: Delete
    // this.publicConfigStore = this.createPublicConfigStore();
  }
  /**
   * Sets up BaseController V2 event subscriptions. Currently, this includes
   * the subscriptions necessary to notify permission subjects of account
   * changes.
   *
   * Some of the subscriptions in this method are ControllerMessenger selector
   * event subscriptions. See the relevant @Wallet/controllers documentation
   * for more information.
   *
   * Note that account-related notifications emitted when the extension
   * becomes unlocked are handled in WalletController._onUnlock.
   */
  //setupControllerEventSubscriptions() {}

  /**
   * Constructor helper: initialize a provider.
   */
  //initializeProvider() {}

  /**
   * TODO:LegacyProvider: Delete
   * Constructor helper: initialize a public config store.
   * This store is used to make some config info available to Dapps synchronously.
   */
  //createPublicConfigStore() {}

  /**
   * Gets relevant state for the provider of an external origin.
   *
   * @param {string} origin - The origin to get the provider state for.
   * @returns {Promise<{
   *  isUnlocked: boolean,
   *  networkVersion: string,
   *  chainId: string,
   *  accounts: string[],
   * }>} An object with relevant state properties.
   */
  //async getProviderState(origin) {}

  //=============================================================================
  // EXPOSED TO THE UI SUBSYSTEM
  //=============================================================================

  /**
   * The Wallet-state of the various controllers, made available to the UI
   *
   * @returns {Object} status
   */
  getState() {
    const { vault } = this.keyringController.store.getState();
    const isInitialized = Boolean(vault);

    return {
      isInitialized,
      ...this.memStore.getFlatState(),
    };
  }

  /**
   * Returns an Object containing API Callback Functions.
   * These functions are the interface for the UI.
   * The API object can be transmitted over a stream via JSON-RPC.
   *
   * @returns {Object} Object containing API functions.
   */
  
  getApi() {
    const {
      approvalController
    } = this;
    return {
      getState: this.getState.bind(this),
      resolvePendingApproval: approvalController.accept.bind(
        approvalController,
      ),
      rejectPendingApproval: approvalController.reject.bind(
        approvalController,
      ),
    };
  }
  

  //=============================================================================
  // VAULT / KEYRING RELATED METHODS
  //=============================================================================

  /**
   * Creates a new Vault and create a new keychain.
   *
   * A vault, or KeyringController, is a controller that contains
   * many different account strategies, currently called Keyrings.
   * Creating it new means wiping all previous keyrings.
   *
   * A keychain, or keyring, controls many accounts with a single backup and signing strategy.
   * For example, a mnemonic phrase can generate many accounts, and is a keyring.
   *
   * @param {string} password
   * @returns {Object} vault
   */
  //async createNewVaultAndKeychain(password) {}

  /**
   * Create a new Vault and restore an existent keyring.
   * @param {string} password
   * @param {string} seed
   */
  //async createNewVaultAndRestore(password, seed) {}

  /**
   * Get an account balance from the AccountTracker or request it directly from the network.
   * @param {string} address - The account address
   * @param {EthQuery} ethQuery - The EthQuery instance to use when asking the network
   */
  //getBalance(address, ethQuery) {}

  /**
   * Collects all the information that we want to share
   * with the mobile client for syncing purposes
   * @returns {Promise<Object>} Parts of the state that we want to syncx
   */
  //async fetchInfoToSync() {}

  /*
   * Submits the user's password and attempts to unlock the vault.
   * Also synchronizes the preferencesController, to ensure its schema
   * is up to date with known accounts once the vault is decrypted.
   *
   * @param {string} password - The user's password
   * @returns {Promise<object>} The keyringController update.
   */
  //async submitPassword(password) {}

  /**
   * Submits a user's password to check its validity.
   *
   * @param {string} password The user's password
   */
  //async verifyPassword(password) {}

  /**
   * @type Identity
   * @property {string} name - The account nickname.
   * @property {string} address - The account's ethereum address, in lower case.
   * @property {boolean} mayBeFauceting - Whether this account is currently
   * receiving funds from our automatic Ropsten faucet.
   */

  /**
   * Sets the first address in the state to the selected address
   */
  //selectFirstIdentity() {}

  //
  // Hardware Controller
  //
  //async getKeyringForDevice(deviceName, hdPath = null) {}

  //async attemptLedgerTransportCreation() {}

  //async establishLedgerTransportPreference() {}

  /**
   * Fetch account list from a trezor device.
   *
   * @returns [] accounts
   */
  //async connectHardware(deviceName, page, hdPath) {}

  /**
   * Check if the device is unlocked
   *
   * @returns {Promise<boolean>}
   */
  //async checkHardwareStatus(deviceName, hdPath) {}

  /**
   * Clear
   *
   * @returns {Promise<boolean>}
   */
  //async forgetDevice(deviceName) {}

  /**
   * get hardware account label
   *
   * @return string label
   */
  //getAccountLabel(name, index, hdPathDescription) {}

  /**
   * Imports an account from a Trezor or Ledger device.
   *
   * @returns {} keyState
   */
  /*
  async unlockHardwareWalletAccount(
    index,
    deviceName,
    hdPath,
    hdPathDescription
  ) {}
  */

  /**
   * Adds a new account to the default (first) HD seed phrase Keyring.
   *
   * @returns {} keyState
   */
  //async addNewAccount() {}

  /**
   * Verifies the validity of the current vault's seed phrase.
   *
   * Validity: seed phrase restores the accounts belonging to the current vault.
   *
   * Called when the first account is created and on unlocking the vault.
   *
   * @returns {Promise<string>} Seed phrase to be confirmed by the user.
   */
  //async verifySeedPhrase() {}

  /**
   * Clears the transaction history, to allow users to force-reset their nonces.
   * Mostly used in development environments, when networks are restarted with
   * the same network ID.
   *
   * @returns {Promise<string>} The current selected address.
   */
  //async resetAccount() {}

  /**
   * Gets the permitted accounts for the specified origin. Returns an empty
   * array if no accounts are permitted.
   *
   * @param {string} origin - The origin whose exposed accounts to retrieve.
   * @returns {Promise<string[]>} The origin's permitted accounts, or an empty
   * array.
   */
  //async getPermittedAccounts(origin) {}

  /**
   * Stops exposing the account with the specified address to all third parties.
   * Exposed accounts are stored in caveats of the eth_accounts permission. This
   * method uses `PermissionController.updatePermissionsByCaveat` to
   * remove the specified address from every eth_accounts permission. If a
   * permission only included this address, the permission is revoked entirely.
   *
   * @param {string} targetAccount - The address of the account to stop exposing
   * to third parties.
   */
  //removeAllAccountPermissions(targetAccount) {}

  /**
   * Removes an account from state / storage.
   *
   * @param {string[]} address - A hex address
   *
   */
  //async removeAccount(address) {}

  /**
   * Imports an account with the specified import strategy.
   * These are defined in app/scripts/account-import-strategies
   * Each strategy represents a different way of serializing an Ethereum key pair.
   *
   * @param {string} strategy - A unique identifier for an account import strategy.
   * @param {any} args - The data required by that strategy to import an account.
   * @param {Function} cb - A callback function called with a state update on success.
   */
  //async importAccountWithStrategy(strategy, args) {}

  //
  // Identity Management (signature operations)
  //

  /**
   * Called when a Dapp suggests a new tx to be signed.
   * this wrapper needs to exist so we can provide a reference to
   *  "newUnapprovedTransaction" before "txController" is instantiated
   *
   * @param {Object} msgParams - The params passed to eth_sign.
   * @param {Object} req - (optional) the original request, containing the origin
   */
  //async newUnapprovedTransaction(txParams, req) {}

  // eth_sign methods:

  /**
   * Called when a Dapp uses the eth_sign method, to request user approval.
   * eth_sign is a pure signature of arbitrary data. It is on a deprecation
   * path, since this data can be a transaction, or can leak private key
   * information.
   *
   * @param {Object} msgParams - The params passed to eth_sign.
   * @param {Function} cb - The callback function called with the signature.
   */
  //async newUnsignedMessage(msgParams, req) {}

  /**
   * Signifies user intent to complete an eth_sign method.
   *
   * @param {Object} msgParams - The params passed to eth_call.
   * @returns {Promise<Object>} Full state update.
   */
  //async signMessage(msgParams) {}

  /**
   * Used to cancel a message submitted via eth_sign.
   *
   * @param {string} msgId - The id of the message to cancel.
   */
  //cancelMessage(msgId) {}

  // personal_sign methods:

  /**
   * Called when a dapp uses the personal_sign method.
   * This is identical to the Geth eth_sign method, and may eventually replace
   * eth_sign.
   *
   * We currently define our eth_sign and personal_sign mostly for legacy Dapps.
   *
   * @param {Object} msgParams - The params of the message to sign & return to the Dapp.
   * @param {Function} cb - The callback function called with the signature.
   * Passed back to the requesting Dapp.
   */
  //async newUnsignedPersonalMessage(msgParams, req) {}

  /**
   * Signifies a user's approval to sign a personal_sign message in queue.
   * Triggers signing, and the callback function from newUnsignedPersonalMessage.
   *
   * @param {Object} msgParams - The params of the message to sign & return to the Dapp.
   * @returns {Promise<Object>} A full state update.
   */
  //async signPersonalMessage(msgParams) {}

  /**
   * Used to cancel a personal_sign type message.
   * @param {string} msgId - The ID of the message to cancel.
   */
  //cancelPersonalMessage(msgId) {}

  // eth_decrypt methods

  /**
   * Called when a dapp uses the eth_decrypt method.
   *
   * @param {Object} msgParams - The params of the message to sign & return to the Dapp.
   * @param {Object} req - (optional) the original request, containing the origin
   * Passed back to the requesting Dapp.
   */
  //async newRequestDecryptMessage(msgParams, req) {}

  /**
   * Only decrypt message and don't touch transaction state
   *
   * @param {Object} msgParams - The params of the message to decrypt.
   * @returns {Promise<Object>} A full state update.
   */
  //async decryptMessageInline(msgParams) {}

  /**
   * Signifies a user's approval to decrypt a message in queue.
   * Triggers decrypt, and the callback function from newUnsignedDecryptMessage.
   *
   * @param {Object} msgParams - The params of the message to decrypt & return to the Dapp.
   * @returns {Promise<Object>} A full state update.
   */
  //async decryptMessage(msgParams) {}

  /**
   * Used to cancel a eth_decrypt type message.
   * @param {string} msgId - The ID of the message to cancel.
   */
  //cancelDecryptMessage(msgId) {}

  // eth_getEncryptionPublicKey methods

  /**
   * Called when a dapp uses the eth_getEncryptionPublicKey method.
   *
   * @param {Object} msgParams - The params of the message to sign & return to the Dapp.
   * @param {Object} req - (optional) the original request, containing the origin
   * Passed back to the requesting Dapp.
   */
  //async newRequestEncryptionPublicKey(msgParams, req) {}

  /**
   * Signifies a user's approval to receiving encryption public key in queue.
   * Triggers receiving, and the callback function from newUnsignedEncryptionPublicKey.
   *
   * @param {Object} msgParams - The params of the message to receive & return to the Dapp.
   * @returns {Promise<Object>} A full state update.
   */
  //async encryptionPublicKey(msgParams) {}

  /**
   * Used to cancel a eth_getEncryptionPublicKey type message.
   * @param {string} msgId - The ID of the message to cancel.
   */
  //cancelEncryptionPublicKey(msgId) {}

  // eth_signTypedData methods

  /**
   * Called when a dapp uses the eth_signTypedData method, per EIP 712.
   *
   * @param {Object} msgParams - The params passed to eth_signTypedData.
   * @param {Function} cb - The callback function, called with the signature.
   */
  //newUnsignedTypedMessage(msgParams, req, version) {}

  /**
   * The method for a user approving a call to eth_signTypedData, per EIP 712.
   * Triggers the callback in newUnsignedTypedMessage.
   *
   * @param {Object} msgParams - The params passed to eth_signTypedData.
   * @returns {Object} Full state update.
   */
  //async signTypedMessage(msgParams) {}

  /**
   * Used to cancel a eth_signTypedData type message.
   * @param {string} msgId - The ID of the message to cancel.
   */
  //cancelTypedMessage(msgId) {}

  /**
   * @returns {boolean} true if the keyring type supports EIP-1559
   */
  //async getCurrentAccountEIP1559Compatibility() {}

  //=============================================================================
  // END (VAULT / KEYRING RELATED METHODS)
  //=============================================================================

  /**
   * Allows a user to attempt to cancel a previously submitted transaction
   * by creating a new transaction.
   * @param {number} originalTxId - the id of the txMeta that you want to
   *  attempt to cancel
   * @param {import(
   *  './controllers/transactions'
   * ).CustomGasSettings} [customGasSettings] - overrides to use for gas params
   *  instead of allowing this method to generate them
   * @returns {Object} Wallet state
   */
  /*
  async createCancelTransaction(
    originalTxId,
    customGasSettings,
    newTxMetaProps
  ) {}
  */

  /**
   * Allows a user to attempt to speed up a previously submitted transaction
   * by creating a new transaction.
   * @param {number} originalTxId - the id of the txMeta that you want to
   *  attempt to speed up
   * @param {import(
   *  './controllers/transactions'
   * ).CustomGasSettings} [customGasSettings] - overrides to use for gas params
   *  instead of allowing this method to generate them
   * @returns {Object} Wallet state
   */
  /*
  async createSpeedUpTransaction(
    originalTxId,
    customGasSettings,
    newTxMetaProps
  ) {}
  */

  //=============================================================================
  // PASSWORD MANAGEMENT
  //=============================================================================

  /**
   * Allows a user to begin the seed phrase recovery process.
   * @param {Function} cb - A callback function called when complete.
   */
  //markPasswordForgotten() {}

  /**
   * Allows a user to end the seed phrase recovery process.
   * @param {Function} cb - A callback function called when complete.
   */
  //unMarkPasswordForgotten() {}

  //=============================================================================
  // SETUP
  //=============================================================================

  /**
   * A runtime.MessageSender object, as provided by the browser:
   * @see https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/MessageSender
   * @typedef {Object} MessageSender
   */

  /**
   * Used to create a multiplexed stream for connecting to an untrusted context
   * like a Dapp or other extension.
   * @param {*} connectionStream - The Duplex stream to connect to.
   * @param {MessageSender} sender - The sender of the messages on this stream
   */
  setupUntrustedCommunication(connectionStream, sender) {
    // check if new connection is blocked if phishing detection is on
    // Late develop so let's test first

    // setup multiplexing
    const mux = setupMultiplex(connectionStream);

    // messages between inpage and background
    this.setupProviderConnection(mux.createStream('wallet-provider'), sender);

    // TODO: LegacyProvider: Delete
    // legacy streams
    this.setupPublicConfig(mux.createStream('publicConfig'));
  }

  /**
   * Used to create a multiplexed stream for connecting to a trusted context,
   * like our own user interfaces, which have the provider APIs, but also
   * receive the exported API from this controller, which includes trusted
   * functions, like the ability to approve transactions or sign messages.
   *
   * @param {*} connectionStream - The duplex stream to connect to.
   * @param {MessageSender} sender - The sender of the messages on this stream
   */
  setupTrustedCommunication(connectionStream, sender) {
    // setup multiplexing
    const mux = setupMultiplex(connectionStream);
    // connect features
    this.setupControllerConnection(mux.createStream('controller'));
    //this.setupProviderConnection(mux.createStream('provider'), sender, true);
  }

  /**
   * Called when we detect a suspicious domain. Requests the browser redirects
   * to our anti-phishing page.
   *
   * @private
   * @param {*} connectionStream - The duplex stream to the per-page script,
   * for sending the reload attempt to.
   * @param {string} hostname - The hostname that triggered the suspicion.
   */
  //sendPhishingWarning(connectionStream, hostname) {}

  /**
   * A method for providing our API over a stream using JSON-RPC.
   * @param {*} outStream - The stream to provide our API over.
   */
  setupControllerConnection(outStream) {
    const api = this.getApi();

    // report new active controller connection
    this.activeControllerConnections += 1;
    this.emit('controllerConnectionChanged', this.activeControllerConnections);

    // setup postStream transport
    outStream.on('data', createMetaRPCHandler(api, outStream));
    const handleUpdate = (update) => {
      if (outStream._writableState.ended) {
        return;
      }
      // send notification to client-side
      outStream.write({
        jsonrpc: '2.0',
        method: 'sendUpdate',
        params: [update]
      });
    };
    this.on('update', handleUpdate);
    outStream.on('end', () => {
      this.activeControllerConnections -= 1;
      this.emit(
        'controllerConnectionChanged',
        this.activeControllerConnections,
      );
      this.removeListener('update', handleUpdate);
    });
  }

  /**
   * A method for serving our ethereum provider over a given stream.
   * @param {*} outStream - The stream to provide over.
   * @param {MessageSender} sender - The sender of the messages on this stream
   * @param {boolean} isInternal - True if this is a connection with an internal process
   */
  setupProviderConnection(outStream, sender, isInternal) {
    const origin = isInternal ? 'wallet' : new URL(sender.url).origin;
    let subjectType = isInternal
      ? SUBJECT_TYPES.INTERNAL
      : SUBJECT_TYPES.WEBSITE;

    if(sender.id !== this.extension.runtime.id) {
      subjectType = SUBJECT_TYPES.EXTENSION;
      // more
    }

    let tabId;
    if (sender.tab && sender.tab.id) {
      tabId = sender.tab.id;
    }
    
    const engine = this.setupProviderEngine({
      origin,
      location: sender.url,
      tabId,
      subjectType,
    });

    // setup Connection
    const providerStream = createEngineStream({ engine });

    const connectionId = this.addConnection(origin, {engine});

    pump(outStream, providerStream, outStream, (err) => {
      // handle any middleware cleanup
      engine._middleware.forEach((mid) => {
        if (mid.destroy && typeof mid.destroy === 'function') {
          mid.destroy();
        }
      });
      connectionId && this.removeConnection(origin, connectionId);
      if (err) {
        log.error(err);
      }
    });
  }

  /**
   * A method for creating a provider that is safely restricted for the requesting subject.
   *
   * @param {Object} options - Provider engine options
   * @param {string} options.origin - The origin of the sender
   * @param {string} options.location - The full URL of the sender
   * @param {string} options.subjectType - The type of the sender subject.
   * @param {tabId} [options.tabId] - The tab ID of the sender - if the sender is within a tab
   **/
  setupProviderEngine({ origin, location, subjectType, tabId }) {
    // setup json rpc engine stack
    const engine = new JsonRpcEngine();
    const { provider, blockTracker } = this;

    // create filter polyfill middleware
    const filterMiddleware = createFilterMiddleware({ provider, blockTracker });

    // create subscription polyfill middleware

    // append origin to each request
    engine.push(filterMiddleware);
    engine.push(providerAsMiddleware(provider));
    return engine;

  }

  /**
   * TODO:LegacyProvider: Delete
   * A method for providing our public config info over a stream.
   * This includes info we like to be synchronous if possible, like
   * the current selected account, and network ID.
   *
   * Since synchronous methods have been deprecated in web3,
   * this is a good candidate for deprecation.
   *
   * @param {*} outStream - The stream to provide public config over.
   */
  setupPublicConfig(outStream) {
    const configStream = storeAsStream(this.publicConfigStore);

    pump(configStream, outStream, (err) => {
      configStream.destroy();
      if (err) {
        log.error(err);
      }
    });
  }

  /**
   * Adds a reference to a connection by origin. Ignores the 'Wallet' origin.
   * Caller must ensure that the returned id is stored such that the reference
   * can be deleted later.
   *
   * @param {string} origin - The connection's origin string.
   * @param {Object} options - Data associated with the connection
   * @param {Object} options.engine - The connection's JSON Rpc Engine
   * @returns {string} The connection's id (so that it can be deleted later)
   */
  //addConnection(origin, { engine }) {}

  /**
   * Deletes a reference to a connection, by origin and id.
   * Ignores unknown origins.
   *
   * @param {string} origin - The connection's origin string.
   * @param {string} id - The connection's id, as returned from addConnection.
   */
  //removeConnection(origin, id) {}

  /**
   * Causes the RPC engines associated with the connections to the given origin
   * to emit a notification event with the given payload.
   *
   * The caller is responsible for ensuring that only permitted notifications
   * are sent.
   *
   * Ignores unknown origins.
   *
   * @param {string} origin - The connection's origin string.
   * @param {unknown} payload - The event payload.
   */
  //notifyConnections(origin, payload) {}

  /**
   * Causes the RPC engines associated with all connections to emit a
   * notification event with the given payload.
   *
   * If the "payload" parameter is a function, the payload for each connection
   * will be the return value of that function called with the connection's
   * origin.
   *
   * The caller is responsible for ensuring that only permitted notifications
   * are sent.
   *
   * @param {unknown} payload - The event payload, or payload getter function.
   */
  //notifyAllConnections(payload) {}

  // handlers

  /**
   * Handle a KeyringController update
   * @param {Object} state - the KC state
   * @returns {Promise<void>}
   * @private
   */
  async _onKeyringControllerUpdate(state) {
    const { keyring } = state;
    const address = keyring.reduce(
      (acc, { accounts }) => acc.concat(accounts),
      [],
    );

    if (!address.length) {
      return;
    }

    // Ensure preferences + identifies controller know about all address
  }

  /**
   * Handle global application unlock.
   * Notifies all connections that the extension is unlocked, and which
   * account(s) are currently accessible, if any.
   */
  _onUnlock() {
    this.emit('unlock');
  }

  /**
   * Handle global application lock.
   * Notifies all connections that the extension is locked.
   */
  _onLock() {
    this.emit('lock');
  }

  /**
   * Handle memory state updates.
   * - Ensure isClientOpenAndUnlocked is updated
   * - Notifies all connections with the new provider network state
   *   - The external providers handle diffing the state
   */
  //_onStateUpdate(newState) {}

  /**
   * A method for emitting the full Wallet state to all registered listeners.
   * @private
   */
  privateSendUpdate() {
    this.emit('update', this.getState());
  }

  /**
   * @returns {boolean} Whether the extension is unlocked.
   */
  //isUnlocked() {}

  //=============================================================================
  // MISCELLANEOUS
  //=============================================================================

  /**
   * Returns the nonce that will be associated with a transaction once approved
   * @param {string} address - The hex string address for the transaction
   * @returns {Promise<number>}
   */
  //async getPendingNonce(address) {}

  /**
   * Returns the next nonce according to the nonce-tracker
   * @param {string} address - The hex string address for the transaction
   * @returns {Promise<number>}
   */
  //async getNextNonce(address) {}

  /**
   * Migrate address book state from old to new chainId.
   *
   * Address book state is keyed by the `networkStore` state from the network controller. This value is set to the
   * `networkId` for our built-in Infura networks, but it's set to the `chainId` for custom networks.
   * When this `chainId` value is changed for custom RPC endpoints, we need to migrate any contacts stored under the
   * old key to the new key.
   *
   * The `duplicate` parameter is used to specify that the contacts under the old key should not be removed. This is
   * useful in the case where two RPC endpoints shared the same set of contacts, and we're not sure which one each
   * contact belongs under. Duplicating the contacts under both keys is the only way to ensure they are not lost.
   *
   * @param {string} oldChainId - The old chainId
   * @param {string} newChainId - The new chainId
   * @param {boolean} [duplicate] - Whether to duplicate the addresses on both chainIds (default: false)
   */
  //async migrateAddressBookState(oldChainId, newChainId, duplicate = false) {}

  //=============================================================================
  // CONFIG
  //=============================================================================

  // Log blocks

  /**
   * A method for selecting a custom URL for an ethereum RPC provider and updating it
   * @param {string} rpcUrl - A URL for a valid Ethereum RPC API.
   * @param {string} chainId - The chainId of the selected network.
   * @param {string} ticker - The ticker symbol of the selected network.
   * @param {string} [nickname] - Nickname of the selected network.
   * @param {Object} [rpcPrefs] - RPC preferences.
   * @param {string} [rpcPrefs.blockExplorerUrl] - URL of block explorer for the chain.
   * @returns {Promise<String>} - The RPC Target URL confirmed.
   */
  /*
  async updateAndSetCustomRpc(
    rpcUrl,
    chainId,
    ticker = 'ETH',
    nickname,
    rpcPrefs
  ) {}
  */

  /**
   * A method for selecting a custom URL for an ethereum RPC provider.
   * @param {string} rpcUrl - A URL for a valid Ethereum RPC API.
   * @param {string} chainId - The chainId of the selected network.
   * @param {string} ticker - The ticker symbol of the selected network.
   * @param {string} nickname - Optional nickname of the selected network.
   * @returns {Promise<String>} The RPC Target URL confirmed.
   */
  /*
  async setCustomRpc(
    rpcUrl,
    chainId,
    ticker = 'ETH',
    nickname = '',
    rpcPrefs = {}
  ) {}
  */

  /**
   * A method for deleting a selected custom URL.
   * @param {string} rpcUrl - A RPC URL to delete.
   */
  //async delCustomRpc(rpcUrl) {}

  /**
   * Returns the first RPC info object that matches at least one field of the
   * provided search criteria. Returns null if no match is found
   *
   * @param {Object} rpcInfo - The RPC endpoint properties and values to check.
   * @returns {Object} rpcInfo found in the frequentRpcList
   */
  //findCustomRpcBy(rpcInfo) {}

  //async initializeThreeBox() {}

  /**
   * Sets the Ledger Live preference to use for Ledger hardware wallet support
   * @param {bool} bool - the value representing if the users wants to use Ledger Live
   */
  //async setLedgerTransportPreference(transportType) {}

  /**
   * A method for initializing storage the first time.
   * @param {Object} initState - The default state to initialize with.
   * @private
   */
  recordFirstTimeInfo(initState) {
    log.debug(initState);
  }

  // TODO: Replace isClientOpen methods with `controllerConnectionChanged` events.
  /* eslint-disable accessor-pairs */
  /**
   * A method for recording whether the Wallet user interface is open or not.
   * @param {boolean} open
   */
  set isClientOpen(open) {
    this._isClientOpen = open;
  }

  /**
   * A method that is called by the background when all instances of Wallet are closed.
   * Currently used to stop polling in the gasFeeController.
   */
  onClientClosed() {
    try {
      this.emit('onClientClosed');
    } catch (err) {
      console.log(err);
    } 
  }

  /**
   * A method that is called by the background when a particular environment type is closed (fullscreen, popup, notification).
   * Currently used to stop polling in the gasFeeController for only that environement type
   */
  onEnvironmentTypeClosed(environmentType) {
    this.emit(`onEnviromentTypeClosed:'${environmentType}'`);
  }

  /**
   * Adds a domain to the PhishingController safelist
   * @param {string} hostname - the domain to safelist
   */
  //safelistPhishingDomain(hostname) {}

  /**
   * Locks Wallet
   */
  //setLocked() {}
}
