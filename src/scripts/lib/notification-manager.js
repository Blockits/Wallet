import EventEmitter from 'safe-event-emitter';
import ExtensionPlatform from '../platforms/extension';

const NOTIFICATION_HEIGHT = 620;
const NOTIFICATION_WIDTH = 360;

export const NOTIFICATION_MANAGER_EVENTS = {
  POPUP_CLOSED: 'onPopupClosed',
};

export default class NotificationManager extends EventEmitter {
  /**
   * A collection of methods for controlling the showing and hiding of Notification
   * @typedef {Object} NotificationManager
   */

  constructor() {
    super();
    this.platform = new ExtensionPlatform();
    this.platform.addOnRemovedListener(this._onWindowClosed.bind(this));
  }

  async showPopup() {
    const popup = await this._getPopup();
    // Bring focus to chrome popup
    if (popup) {
      await this.platform.focusWindow(popup.id);
    } else {
      let left = 0;
      let top = 0;
      try {
        const lastFocused = await this.platform.getLastFocusedWindow();
        // Position window in top right corner of lastFocused window.
        top = lastFocused.top;
        left = lastFocused.left + (lastFocused.width - NOTIFICATION_WIDTH);
      } catch (_) {
        // The following properties are more than likely 0, due to being
        // opened from the background chrome process for the extension that
        // has no physical dimensions
        const { screenX, screenY, outerWidth } = window;
        top = Math.max(screenY, 0);
        left = Math.max(screenX + (outerWidth - NOTIFICATION_WIDTH), 0);
      }

      // create a new notification popup
      const popupWindow = await this.platform.openWindow({
        url: 'notification.html',
        type: 'popup',
        width: NOTIFICATION_WIDTH,
        hieght: NOTIFICATION_HEIGHT,
        left,
        top,
      });

      // Firefox currently ignores lef/top for create , but it works for update
      if (popupWindow.left !== left && popupWindow.state !== 'fullscreen') {
        await this.platform.updateWindowPosition(popupWindow.id, left, top);
      }
      this._popupId = popupWindow.id;
    }
  }

  /**
   * reset popupId and emit notificaiton POPUP CLOSED
   * @param {number} windowId 
   */
  _onWindowClosed(windowId) {
    if(windowId === this._popupId) {
      this._popupId = undefined;
      this.emit(NOTIFICATION_MANAGER_EVENTS.POPUP_CLOSED);
    }
  }
  
  /**
   * Checks all open Wallet windows , and returns the first one if it
   * notification Window (i.e. has type `popup`)
   * @returns an array of Windows is openned
   */
  async _getPopup() {
    const windows = await this.platform.getAllWindows();
    return this._getPopupIn(windows);
  }

  /**
   * Given an array of Window object and return Window with type popup
   * @param {Array} windows - An arrays of Window objects data 
   * @returns Window object is popup
   */
  _getPopupIn(windows) {
    return windows ?
      windows.find((win) => {
        return win && win.type === 'popup' && win.id === this._popupId;
      }):
      null;
  }
}
