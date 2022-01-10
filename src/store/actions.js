/**
 * @file actions of UI
 */
import pify from 'pify';
import log from 'loglevel';
import * as actionConstants from './actionConstants';
import {
  ENVIRONMENT_TYPE_NOTIFICATION,
  POLLING_TOKEN_ENVIRONMENT_TYPES,
} from '../shared/constants/app';
import { getEnvironmentType, addHexPrefix } from '../shared/libs';


let background = null;
let promisifiedBackground = null;
export function _setBackgroundConnection(backgroundConnection) {
  background = backgroundConnection;
  promisifiedBackground = pify(background);
}

export function updateWalletState(newState) {
  return (dispatch, getState) => {
    const { wallet: currentState} = getState();
  }
}

export function updateTransaction(txData, dontShowLoadingIndicator) {
  return async (dispatch) => {
    console.log('updateTransactionCall');
  }
}

export function showConfTxPage({ id } = {}) {
  return {
    type: actionConstants.SHOW_CONF_TX_PAGE,
    id,
  };
}

export function displayWarning(text) {
  return {
    type: actionConstants.DISPLAY_WARNING,
    value: text,
  };
}

export function hideLoadingIndication() {
  return {
    type: actionConstants.HIDE_LOADING,
  };
}

export async function updateTokenType(tokenAddress) {
  let token = {};
  try {
    token = await promisifiedBackground.updateTokenType(tokenAddress);
  } catch (error) {
    log.error(error);
  }
  return token;
}

export function showLoadingIndication(message) {
  return {
    type: actionConstants.SHOW_LOADING,
    value: message,
  };
}

export async function removePollingTokenFromAppState(pollingToken) {
  return promisifiedBackground.removePollingTokenFromAppState(
    pollingToken,
    POLLING_TOKEN_ENVIRONMENT_TYPES[getEnvironmentType()],
  );
}

/**
 * Informs the GasFeeController that a specific token is no longer requiring
 * gas fee estimates. If all tokens unsubscribe the controller stops polling.
 *
 * @param {string} pollToken - Poll token received from calling
 *  `getGasFeeEstimatesAndStartPolling`.
 * @returns {void}
 */
 export function disconnectGasFeeEstimatePoller(pollToken) {
  return promisifiedBackground.disconnectGasFeeEstimatePoller(pollToken);
}

export async function addPollingTokenToAppState(pollingToken) {
  return promisifiedBackground.addPollingTokenToAppState(
    pollingToken,
    POLLING_TOKEN_ENVIRONMENT_TYPES[getEnvironmentType()],
  );
}

/**
 * initiates polling for gas fee estimates.
 *
 * @returns {string} a unique identify of the polling request that can be used
 *  to remove that request from consideration of whether polling needs to
 *  continue.
 */
 export function getGasFeeEstimatesAndStartPolling() {
  return promisifiedBackground.getGasFeeEstimatesAndStartPolling();
}

// Wrappers around promisifedBackground
/**
 * The "actions" below are not actions nor action creators. They cannot use
 * dispatch nor should they be dispatched when used. Instead they can be
 * called directly. These wrappers will be moved into their location at some
 * point in the future.
 */

 export function estimateGas(params) {
  return promisifiedBackground.estimateGas(params);
}