/**
 * @file first-time initial Wallet state
 */

/**
 * @typedef {Object} FirstTimeState
 * @property {Object} config Initial configuration parameters
 * @property {Object} NetworkController Network controller state
 */

/**
 * @type {FirstTimeState}
 */
const initialState = {
  config: {},
  PreferencesController: {
    frequentRpcListDetail: [
      {
        rpcUrl: 'http://localhost:8545',
        chainId:'0x539',
        ticket: 'ETH',
        nickname: 'Localhost 8545',
        rpcPrefs: {},
      }, 
    ],
  },
};

export default initialState;