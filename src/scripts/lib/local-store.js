import extension from 'extensionizer';
import log from 'loglevel';
import { checkForError } from './utils';


export default class ExtensionStore {
  /**
   * @construtor
   */
  constructor() {
    this.isSupported = Boolean(extension.storage.local);
    if (!this.isSupported) {
      log.error('Storage local API not available');
    }
  }

  async get() {
    if (!this.isSupported) {
      return undefined;
    }
    const result = await this._get();
    // extension.storage.local always returns an obj
    // if the object is empty , treat it as undefined
    if (isEmpty(result)) {
      return undefined;
    }
    return result;
  }

  /**
   * Returns all of keys currently saved
   * @private
   * @returns {Object} the key-value map from local storage 
   */
  _get() {
    const { local } = extension.storage;
    return new Promise((resolve, reject) => {
      local.get(null, (/**@type {any} */ result) => {
        const err = checkForError();
        if(err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }

  /**
   * Sets the key in local state
   * @param {Object} state - The state to set 
   * @returns {Promise<void>}
   */
  async set(state) {
    return this._set(state);
  }

  _set(state) {
    const { local } = extension.storage;
    return new Promise((resolve, reject) => {
      local.set(state, () => {
        const err = checkForError();
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
}

/**
 * Return whether or not the given object contain no keys
 * @param {Object} obj - The object to check
 * @returns {boolean}
 */
function isEmpty(obj) {
  return Object.keys(obj).length === 0;
}