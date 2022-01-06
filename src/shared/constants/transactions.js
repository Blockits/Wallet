import { MESSAGE_TYPE } from './app';

/**
 * Transaction Type is a Wallet contruct used internally
 * @typedef {Object} TransactionTypes
 * @property {'transfer'} TOKEN_METHOD_TRANSFER - A token transaction where the user
 * is sending tokens that they own to another address
 * @property {'transferFrom'} TOKEN_METHOD_TRANSFER_FROM - A token transaction
 * transfering tokens from an account that the sender has an allowance of.
 * For more information on allowances, see the approve type.
 * @property {'approve'} TOKEN_METHOD_APPROVE - A token transaction request an
 * allowance of the token to spend on behalf of the user
 * @property {'incoming'} INCOMING - A incoming (deposit) transaction
 * @property {'simpleSend'} SIMPLE_SEND - A transaction sending a network's native
 * asset to a receipient
 * @property {'contractInteraction'} CONTRACT_INTERACTION - A transaction that is
 * interacting with a smart contract's method that we have not treated as a special
 * @property {'contractDeployment'} DEPLOY_CONTRACT - A transaction that deployed a
 * smart contract
 * @property {'swap'} SWAP - A transaction swapping one token for another token though Wallet swaps pool
 * @property {'swapApproval'} SWAP_APPROVAL - Similar to approve type, a swap approval is a
 * special case of ERC20 approve method that requests an allowance of the token
 * to spend on behalf of the user for the Wallet swap contract. The first
 * swap for any token will have an accompanying swapApproval transaction.
 * @property {'cancel'} CANCEL - A transaction submitted with the same nonce as a
 * previous transaction , a higher gas price and a zeroed out send amount. Useful
 * for users who accidentally send to erroneous addresses or if they send too much.
 * @property {'retry'} RETRY - When a transaction is failed it can be retried by
 * resubmitting the same transaction with a higher gas fee. This type is also used
 * to speedup pending transactions. This is accomplished by createing a new tx with the
 * same nonce and higher gas fee
 */

/**
 * This type will work anywhere as expect a string that can be one of the
 * above transaction types.
 * @typedef {TransactionTypes[keyof TransactionTypes] TransactionTypeString}
 */

/**
 * @type {TransactionTypes}
 */
export const TRANSACTION_TYPES = {
  CANCEL: 'cancel',
  RETRY: 'retry',
  TOKEN_METHOD_TRANSFER: 'transfer',
  TOKEN_METHOD_TRANSFER_FROM: 'transferFrom',
  TOKEN_METHOD_APPROVE: 'approve',
  INCOMING: 'incoming',
  SIMPLE_SEND: 'simpleSend',
  CONTRACT_INTERACTION: 'contractInteraction',
  DEPLOY_CONTRACT: 'contractDeployment',
  SWAP: 'swap',
  SWAP_APPROVAL: 'swapApproval',
  SIGN: MESSAGE_TYPE.ETH_SIGN,
  SIGN_TYPED_DATA: MESSAGE_TYPE.ETH_SIGN_TYPED_DATA,
  PERSONAL_SIGN: MESSAGE_TYPE.PERSONAL_SIGN,
  ETH_DECRYPT: MESSAGE_TYPE.ETH_DECRYPT,
  ETH_GET_ENCRYPTION_PUBLIC_KEY: MESSAGE_TYPE.ETH_GET_ENCRYPTION_PUBLIC_KEY,
};

/**
 * Transaction Status is a mix Ethereum and Wallet terminology, used internally
 * for transaction processing
 * @typedef {Object} TransactionStatuses
 * @property {'unapproved'} UNAPPROVED  - A new transaction that the user has not
 * approved or rejected
 * @property {'approve'} APPROVED  - The user has approved the transaction in the
 * Wallet UI
 * @property {'rejected'} REJECTED - The user has rejected the transaction in the
 * Wallet UI
 * @property {'signed'} SIGNED - The transaction has been signed
 * @property {'submitted'} SUBMITED - The transaction has been submitted to network
 * @property {'failed'} FAILED - The transaction has failed for some reason
 * @property {'dropped'} DROPPED - The transaction was dropped due to a tx with same
 * nonce being accepted
 * @property {'confirmed'} CONFIRMED - The transaction was confirmed by the network
 *
 */

/**
 * This type will wore anywhere as expect a string that can be one of the
 * above transaction statuses
 * @typedef {TransactionStatuses[keyof TransactionStatuses]} TransactionStatusString
 */

/**
 * @type {TransactionStatuses}
 */
export const TRANSACTION_STATUSES = {
  UNAPPROVED: 'unapproved',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  SIGNED: 'signed',
  SUBMITTED: 'submitted',
  FAILED: 'failed',
  DROPPED: 'dropped',
  CONFIRMED: 'confirmed',
};

/**
 * Transaction Group Category is a Wallet construct to categorize the intent
 * of a group of transactions for purposes of displaying in the UI
 * @typedef {Object} TransactionGroupCategories
 * @property {'send'} SEND - Transaction group representing ether being sent from
 *  the user.
 * @property {'receive'} RECEIVE - Transaction group representing a deposit/incoming
 *  transaction. This category maps 1:1 with TRANSACTION_CATEGORIES.INCOMING.
 * @property {'interaction'} INTERACTION - Transaction group representing
 *  an interaction with a smart contract's methods.
 * @property {'approval'} APPROVAL - Transaction group representing a request for an
 *  allowance of a token to spend on the user's behalf.
 * @property {'signature-request'} SIGNATURE_REQUEST - Transaction group representing
 *  a signature request This currently only shows up in the UI when its pending user
 *  approval in the UI. Once the user approves or rejects it will no longer show in
 *  activity.
 * @property {'swap'} SWAP - Transaction group representing a token swap through
 *  Wallet Swaps. This transaction group's primary currency changes depending
 *  on context. If the user is viewing an asset page for a token received from a swap,
 *  the primary currency will be the received token. Otherwise the token exchanged
 *  will be shown.
 */

/**
 * @type {TransactionGroupCategories}
 */
export const TRANSACTION_GROUP_CATEGORIES = {
  SEND: 'send',
  RECEIVE: 'receive',
  INTERACTION: 'interaction',
  APPROVAL: 'approval',
  SIGNATURE_REQUEST: 'signatureRequest',
  SWAP: 'swap',
};
