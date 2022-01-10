import React from 'react';
import { render } from 'react-dom';

import './index.css';

render(
  <p>
    Hello , Wallet !
  </p>, 
  window.document.querySelector('#app-container'));

if (module.hot) module.hot.accept();
