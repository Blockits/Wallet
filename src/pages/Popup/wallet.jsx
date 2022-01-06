/**
 * @file main application defination
 */

import { ENVIRONMENT_TYPE_POPUP } from '../../shared/constants/app';
import { SENTRY_ENTRY } from '../../scripts/lib/setupSentry';
import * as actions from '../../store/actions';
import { clone } from 'lodash';
import configureStore from '../../store/store';
import Popup from './Popup';
import './index.css';
import React from 'react';
import { render } from 'react-dom';

export default function launchWalletUi(opts, cb) {
  const { backgroundConnection } = opts;
  actions._setBackgroundConnection(backgroundConnection);

  // check if we are unlocked first
  backgroundConnection.getState(function (err, walletState) { 
    if(err) {
      cb(err);
      return;
    }
    startApp(walletState, backgroundConnection, opts).then((store) => {
      setupDebuggingHelpers(store);
      cb(null, store);
    });
  });
}

async function startApp(walletState, backgroundConnection, opts) {
  // parse opts
  if (!walletState.featureFlags) {
    walletState.featureFlags = {};
  }

  const draftInitialState = {
    activeTab: opts.activeTab,

    // walletState represents the cross-tab state
    wallet: walletState,

    // appState represents the current tab's popup state
    appState: {},

  };

  const store = configureStore(draftInitialState);

  backgroundConnection.onNotification((data) => {
    if (data.method === 'sendUpdate') {
      store.dispatch(actions.updateWalletState(data.params[0]));
    } else {
      throw new Error(
        `Internal JSON-RPC Notification Not Handled:\n\n ${JSON.stringify(
          data,
        )}`,
      );
    }
  });

  // start app
  render(<Popup store={store} />, window.document.querySelector('#app-container'));

  return store;
}

/**
 * Return a "masked" copy of the given object.
 *
 * The returned object includes only the properties present in the mask. The
 * mask is an object that mirrors the structure of the given object, except
 * the only values are `true` or a sub-mask. `true` implies the property
 * should be included, and a sub-mask implies the property should be further
 * masked according to that sub-mask.
 *
 * @param {Object} object - The object to mask
 * @param {Object<Object|boolean>} mask - The mask to apply to the object
 */
 function maskObject(object, mask) {
  return Object.keys(object).reduce((state, key) => {
    if (mask[key] === true) {
      state[key] = object[key];
    } else if (mask[key]) {
      state[key] = maskObject(object[key], mask[key]);
    }
    return state;
  }, {});
}

function setupDebuggingHelpers(store) {
  window.getCleanAppState = function () {
    const state = clone(store.getState());
    state.version = global.platform.getVersion();
    state.browser = window.navigator.userAgent;
    return state;
  };
  window.getSentryState = function () {
    const fullState = store.getState();
    const debugState = maskObject(fullState, SENTRY_ENTRY);
    return {
      browser: window.navigator.userAgent,
      store: debugState,
      version: global.platform.getVersion(),
    };
  };
}