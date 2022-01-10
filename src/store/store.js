import { createStore, applyMiddleware } from 'redux';
import thunkMiddleware from 'redux-thunk';
import { composeWithDevTools } from 'remote-redux-devtools';
import popupReducer from '../pages/Popup/ducks';
import {WALLET_DEBUG, IN_TEST }  from '../../utils/env';

export default function configureStore(initialState) {
  let storeEnhancers = applyMiddleware(thunkMiddleware);

  
  if (WALLET_DEBUG && !IN_TEST) {
    const composeEnhancers = composeWithDevTools({
      name: 'Wallet',
      hostname: 'localhost',
      port: 3000,
      realtime: Boolean(WALLET_DEBUG),
    });
    storeEnhancers = composeEnhancers(storeEnhancers);
  }
  

  return createStore(popupReducer, initialState, storeEnhancers);
}
