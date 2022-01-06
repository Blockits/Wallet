
import { combineReducers } from 'redux';
import appStateReducer from './app/app';

export default combineReducers({
  activeTab: (s) => (s === undefined ? null : s),
  appState: appStateReducer,
});