
import { combineReducers } from 'redux';
import appStateReducer from './app/app';
import walletReducer from '../ducks/wallet/wallet'

export default combineReducers({
  activeTab: (s) => (s === undefined ? null : s),
  appState: appStateReducer,
  wallet: walletReducer,
});