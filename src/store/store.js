import { createStore, applyMiddleware } from 'redux';
import thunkMiddleware from 'redux-thunk';
// import { composeWithDevTools } from 'remote-redux-devtools';
import popupReducer from '../pages/Popup/ducks';

export default function configureStore(initialState) {
  let storeEnhancers = applyMiddleware(thunkMiddleware);

  /*
  if (process.env.WALELT_DEBUG && !process.env.IN_TEST) {
    const composeEnhancers = composeWithDevTools({
      name: 'Wallet',
      hostname: 'localhost',
      port: 8000,
      realtime: Boolean(process.env.WALLET_DEBUG),
    });
    storeEnhancers = composeEnhancers(storeEnhancers);
  }
  */

  return createStore(popupReducer, initialState, storeEnhancers);
}
