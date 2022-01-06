/**
 * @file actions of UI
 */
import pify from 'pify';
import log from 'loglevel';


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