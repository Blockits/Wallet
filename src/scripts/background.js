/**
 * @file The entry point for the web extension singleton process.
 */


import log from 'loglevel';
import extension from 'extensionizer';


const { sentry } = global;
const firstTimeState = { ...rawFirstTimeState };

log.setDefaultLevel(process.env.WALLET_DEBUG ? 'debug' : 'info');

const platform = new ExtensionPlatform();

// include notification Manager - still developing
// const notificationManager = new NotificationManager();
// global.Wallet_NOTIFIER = notificationManager;

// state persistence
const inTest = process.env.IN_TEST;
// include store - on developing
// const localStore = inTest ? new ReadOnlyNetworkStore() : new LocalStore();
let versionedData;
// uncomment if -localStore is developed
// if (inTest || process.env.WALLET_DEBUG) {
//     global.WalletGetState = localStore.get.bind(localStore);
// }

let popupIsOpen = false;
let notificationIsOpen = false;
let uiIsTriggering = false;
const openWalletTabsIDs = {};
const requestAccountTabIds = {};

// initialization flow
initialize().catch(log.error);

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

 }

/**
 * Loads any stored data, prioritizing the latest storage strategy.
 * Migrates that data schema in case it was last loaded on an older version.
 * @returns {Promise<WalletState>} Last data emitted from previous instance of Wallet.
 */
 async function loadStateFromPersistence() {

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
 function setupController(initState, initLangCode) {

 }

/**
 * Opens the browser popup for user confirmation
 */
 async function triggerUi() {
 
}

/**
 * Opens the browser popup for user confirmation of watchAsset
 * then it waits until user interact with the UI
 */
async function openPopup() {

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