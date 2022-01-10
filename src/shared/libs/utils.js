import { memoize } from 'lodash';
import extension from 'extensionizer';
import { stripHexPrefix } from 'ethereumjs-util';
import BN from 'bn.js';
import {
  MAINNET_CHAIN_ID,
  TEST_CHAINS,
} from '../../shared/constants/network';
import { 
  ENVIRONMENT_TYPE_BACKGROUND,
  ENVIRONMENT_TYPE_FULLSCREEN,
  ENVIRONMENT_TYPE_NOTIFICATION,
  ENVIRONMENT_TYPE_POPUP,
  PLATFORM_FIREFOX,
  PLATFORM_CHROME,
  PLATFORM_EDGE,
  PLATFORM_OPERA,
  PLATFORM_BRAVE,
} from '../constants/app';


/**
 * Return an Error if extension.runtime.lastError is present
 * this is a workaround for non-standard error object thats used
 * @returns {Error|undefined}
 */
export function checkForError() {
  // get id and lastError properties from extension.runtime
  const { id, lastError } = extension.runtime;
  if (!lastError) {
    return undefined;
  }
  // return error like ,if exist it Error
  if (lastError.stack && lastError.message) {
    return lastError;
  }
  // incomplete error object, repair it ( eg chromium v77)
  return new Error(lastError.message);
}

/**
 * @see {@link getEnvironmentType}
 */
const getEnvironmentTypeMemo = memoize((url) => {
  const parseUrl = new URL(url);
  if (parseUrl.pathname === '/popup.html') {
    return ENVIRONMENT_TYPE_POPUP;
  } else if (['/home.html', 'phishing.html'].includes(parseUrl.pathname)) {
    return ENVIRONMENT_TYPE_FULLSCREEN;
  } else if (parseUrl.pathname === './notification.html') {
    return ENVIRONMENT_TYPE_NOTIFICATION;
  }
  return ENVIRONMENT_TYPE_BACKGROUND;
})

/**
 * Returns the window type for the application
 * - `popup` refer to the extension opened through the browser app icon
 * (in top right corner in chrome and firefox)
 * - `fullscreen` refers to the main browser window
 * - `notification` refers to the popup that appears in its own window when
 * action outside of Wallet
 * - `background` refers to the background page
 * @param {string} [url] - the URL of the window
 * @return {string} the environment ENUM
 */
const getEnvironmentType = (url = window.location.href) => 
  getEnvironmentTypeMemo(url);


const getPlatform = () => {
  const { navigator } = window;
  const { userAgent } = navigator;

  if (userAgent.includes('Firefox')) {
    return PLATFORM_FIREFOX;
  } else if ('brave' in navigator) {
    return PLATFORM_BRAVE;
  } else if (userAgent.includes('Edg/')) {
    return PLATFORM_EDGE;
  } else if (userAgent.includes('OPR')) {
    return PLATFORM_OPERA;
  }
  return PLATFORM_CHROME;
}

/**
 * Used to multiply a BN by a fraction
 *
 * @param {BN} targetBN - The number to multiply by a fraction
 * @param {number|string} numerator - The numerator of the fraction multiplier
 * @param {number|string} denominator - The denominator of the fraction multiplier
 * @returns {BN} The product of the multiplication
 *
 */
 function BnMultiplyByFraction(targetBN, numerator, denominator) {
  const numBN = new BN(numerator);
  const denomBN = new BN(denominator);
  return targetBN.mul(numBN).div(denomBN);
}

/**
 * Prefixes a hex string with '0x' or '-0x' and returns it. Idempotent.
 *
 * @param {string} str - The string to prefix.
 * @returns {string} The prefixed string.
 */
 const addHexPrefix = (str) => {
  if (typeof str !== 'string' || str.match(/^-?0x/u)) {
    return str;
  }

  if (str.match(/^-?0X/u)) {
    return str.replace('0X', '0x');
  }

  if (str.startsWith('-')) {
    return str.replace('-', '-0x');
  }

  return `0x${str}`;
};

/**
 * Converts a hex string to a BN object
 *
 * @param {string} inputHex - A number represented as a hex string
 * @returns {Object} A BN object
 *
 */
 function hexToBn(inputHex) {
  return new BN(stripHexPrefix(inputHex), 16);
}

/**
 * Converts a BN object to a hex string with a '0x' prefix
 *
 * @param {BN} inputBn - The BN to convert to a hex string
 * @returns {string} - A '0x' prefixed hex string
 *
 */
 function bnToHex(inputBn) {
  return addHexPrefix(inputBn.toString(16));
}

function getChainType(chainId) {
  if (chainId === MAINNET_CHAIN_ID) {
    return 'mainnet';
  } else if (TEST_CHAINS.includes(chainId)) {
    return 'testnet';
  }
  return 'custom';
}

export  {
  getEnvironmentType,
  getPlatform,
  addHexPrefix,
  bnToHex,
  hexToBn,
  getChainType,
  BnMultiplyByFraction
}