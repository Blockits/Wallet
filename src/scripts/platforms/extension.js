/**
 * @file handler actionable option cross flatform to web browser
 */
import extension from 'extensionizer';
import { getEnvironmentType, checkForError } from '../lib/utils';
import { ENVIRONMENT_TYPE_BACKGROUND } from '../../shared/constants/app';
import { TRANSACTION_STATUSES } from '../../shared/constants/transactions';

export default class ExtensionPlatform {
  //
  // Public
  //
  reload() {
    extension.runtime.reload();
  }

  /**
   * open a new tab on current browser windows
   * @ref https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/tabs/
   * @param {
   * active?,
   * cookieStoreId?,
   * discarded?,
   * index?,
   * openerTabId?,
   * openInReaderMode?,
   * pinned?,
   * selected?,
   * title?,
   * url?,
   * windowId?
   * } options  is an object of param
   * @returns Promise of Tab object contain detail about created tab
   */
  openTab(options) {
    return new Promise((resolve, reject) => {
      extension.tabs.create(options, (newTab) => {
        const err = checkForError();
        if (err) {
          return reject(err);
        }
        return resolve(newTab);
      });
    });
  }

  /**
   * open a new windows
   * @ref https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/windows/create
   * @param {
   * allowScriptsToClose?,
   * cookieStoreId?,
   * focused?,
   * height?,
   * incognito?,
   * left?,
   * state?,
   * tabId?,
   * titlePreface?,
   * top?,
   * type?,
   * width?
   * } options is an object of param
   * @returns  Promise of Window object contain detail about created window
   */
  openWindow(options) {
    return new Promise((resolve, reject) => {
      extension.windows.create(options, (newWindow) => {
        const err = checkForError();
        if (err) {
          return reject(err);
        }
        return resolve(newWindow);
      });
    });
  }

  /**
   * focus on a opened window
   * @ref https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/windows/update
   * @param windowId integer, id of created windows
   * @returns Promise of Window object
   */
  focusWindow(windowId) {
    return new Promise((resolve, reject) => {
      extension.windows.update(windowId, { focused: true }, () => {
        const err = checkForError();
        if (err) {
          return reject(err);
        }
        return resolve();
      });
    });
  }

  /**
   * Change opened window position
   * @ref https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/windows/update
   * @param windowId integer - id of created windows
   * @param left integer, - offset from the left edge of the screen
   * @param top integer, - offset from the top edge of the screen
   * @returns Promise of Window object
   */
  updateWindowPosition(windowId, left, top) {
    return new Promise((resolve, reject) => {
      extension.windows.update(windowId, { left, top }, () => {
        const err = checkForError();
        if (err) {
          return reject(err);
        }
        return resolve();
      });
    });
  }

  /**
   * get current focused opened window
   * @ref https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/windows/getLastFocused
   * @returns Promise of Window object
   */
  getLastFocusedWindow() {
    return new Promise((resolve, reject) => {
      extension.windows.getLastFocused((windowObject) => {
        const err = checkForError();
        if (err) {
          return reject(err);
        }
        return resolve(windowObject);
      });
    });
  }

  /**
   * close current opned window
   * @returns Promise of no argument and err if occurs
   */
  closeCurrentWindow() {
    return extension.windows.getCurrent((windowCurrent) => {
      return extension.windows.remove(windowCurrent.id);
    });
  }

  /**
   * load and transform version then return version of extension
   * @returns version of extensions with remodified if prerelease
   */
  getVersion() {
    const { version, version_name: versionName } =
      extension.runtime.getManifest();

    const versionParts = version.split('.');
    if (versionName) {
      // Chrome: the build type is store as `version_name` in the manifest
      const buildType = versionName;
      if (versionParts.length < 4) {
        throw new Error(`Version missing build number: '${version}'`);
      }
      const [major, minor, patch, buildVersion] = versionParts;

      return `${major}.${minor}.${patch}-${buildType}.${buildVersion}`;
    } else if (versionParts.length === 4) {
      // On Firefox, the build type and build version are in the fourth part of version
      const [major, minor, patch, prerelease] = versionParts;
      const matches = prerelease.match(/^(\w+)(\d)+$/u);
      if (matches === null) {
        throw new Error(`Version contains invalid prerelease: ${version}`);
      }
      const [, buildType, buildVersion] = matches;
      return `${major}.${minor}.${patch}-${buildType}.${buildVersion}`;
    }

    // If there no `version_name` and there are only 3 version parts, then
    // this is not a prerelease and the version requires no modification.
    return version;
  }

  openExtensionInBrowser(
    route = null,
    queryString = null,
    keepWindowOpen = false
  ) {
    let extensionUrl = extension.runtime.getURL('home.html');

    if (route) {
      extensionUrl += `#${route}`;
    }

    if (queryString) {
      extensionUrl += `?${queryString}`;
    }

    this.openTab({ url: extensionUrl });
    if (getEnvironmentType() !== ENVIRONMENT_TYPE_BACKGROUND && !keepWindowOpen) {
      window.close();
    }
  }

  /**
   * with platform info will do callback function
   * @param {'callback'} cb - a callback function will be called
   * @returns void
   */
  getPlatformInfo(cb) {
    try {
      extension.runtime.PlatformInfo((platform) => {
        cb(null, platform);
      });
    } catch (e) {
      cb(e);
      return;
    }
  }

  /**
   * display transaction result in case of error of confirmed
   * @param {'tx'} txMeta - tx data of transaction
   * @param {'rpcPrefs'} rpcPrefs - Configuration for rpc endpoint
   */
  showTransactionNotification(txMeta, rpcPrefs) {}

  /**
   * Add an function as callback when windows has onRemoved event happen
   * @param {'listenser'} listener - a event subcriptions function will be called
   */
  addOnRemovedListener(listener) {
    extension.windows.onRemoved.addListener(listener);
  }

  /**
   * get information about all windows openned pass them in callback
   * @ref https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/windows/getAll
   * @returns Promise of an array of Window object
   */
  getAllWindows() {
    return new Promise((resolve, reject) => {
      extension.windows.getAll((windows) => {
        const err = checkForError();
        if (err) {
          return reject(err);
        }
        return resolve(windows);
      });
    });
  }

  /**
   * get current Active Tab
   * @ref https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/tabs/query
   * @returns a Promise of array of Tab
   */
  getActiveTab() {
    return new Promise((resolve, reject) => {
      extension.tabs.query({ active: true }, (tabs) => {
        const err = checkForError();
        if (err) {
          return reject(err);
        }
        return resolve(tabs);
      });
    });
  }

  /**
   * get Current using Tab
   * @returns a Promise of Tab
   */
  currentTab() {
    return new Promise((resolve, reject) => {
      extension.tabs.getCurrent((tab) => {
        const err = checkForError();
        if (err) {
          return reject(err);
        }
        return resolve(tab);
      });
    });
  }

  /**
   * switch view to Tab with tabId
   * @param {'tabId'} tabId - is a Tab id
   * @returns a Promise of Tab
   */
  switchToTab(tabId) {
    return new Promise((resolve, reject) => {
      extension.tabs.update(tabId, { highlighted: true }, (tab) => {
        const err = checkForError();
        if (err) {
          return reject(err);
        }
        return resolve(err);
      });
    });
  }

  /**
   * close the tab by tabId
   * @param {tabid} tabId - is a Tab id
   * @returns null in case of successful and err if occured
   */
  closeTab(tabId) {
    return new Promise((resolve, reject) => {
      extension.tabs.remove(tabId, () => {
        const err = checkForError();
        if (err) {
          return reject(err);
        }
        return resolve();
      });
    });
  }

  _showConfirmedTransaction(txMeta, rpcPrefs) {}

  _showFailedTransaction(txMeta, errorMessage) {}

  _showNotification(title, message, url) {}

  _subcribeToNotificationClicked() {}

  _viewOnEtherscan(url) {}
}
