//import ui_start from '../../scripts/ui';
//ui_start();
import { UI } from './scripts';
import React from 'react';
import { render } from 'react-dom';
import 'globalthis';

import Popup from './Popup';
import './index.css';

const ui = new UI({});
//console.log(ui.activeTab);
//console.log(ui.connStream);
//console.log(ui.connection);
//console.log(ui.extensionPort);
//console.log(ui.windowType);
console.log(ui.store);

render(<Popup />, window.document.querySelector('#app-container'));

if (module.hot) module.hot.accept();
