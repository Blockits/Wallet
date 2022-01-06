import { memoize } from 'lodash';
import extension from 'extensionizer';
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
} from '../../shared/constants/app';


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

export  {
  getEnvironmentType,
  getPlatform,
}