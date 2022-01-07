import React from 'react';
import { render } from 'react-dom';
import BackGround from './Background';
import './index.css';
// import background_start from '../../scripts/background';
// start scripts
// background_start();
import { start } from './scripts';
start();
// render Page
render(<BackGround />, window.document.querySelector('#app-container'));

if (module.hot) module.hot.accept();
