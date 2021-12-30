import React, {useState} from 'react';
import logo from '../../assets/img/logo.svg';
import icon from '../../assets/img/icon-128.png';
import Greeting from '../../containers/Greetings/Greeting';
import './Popup.css';
import { FormattedMessage, injectIntl} from 'react-intl';
import LanguageProvider from '../../containers/LanguageProvider/LanguageProvider';
import { AppLocaleList, DEFAULT_LOCALE } from '../../i18n';
import {popupMsg}  from '../Content';

const defaultLocale = localStorage['locale']?
  localStorage['locale'] : DEFAULT_LOCALE;

const  Popup = () => {
  const [currentLocale, setCurrentLocale] = useState(defaultLocale);

  const onChangeLanguage = (e) => {
    const  selectedLocale = e.target.value;
    setCurrentLocale(selectedLocale);
    localStorage.setItem('locale',selectedLocale);
  };

  return (
    <LanguageProvider locale={currentLocale}>
      <div className="App">
          <header className="App-header">
          </header>
          <div className="App-body">
            <select onChange={onChangeLanguage} defaultValue={currentLocale}>
              {
                  AppLocaleList.default.map((locale,index)=>(
                    <option key={index} value={locale.code}>{locale.name}</option>
                  ))
              }
            </select>
            <FormattedMessage {...popupMsg.introduction}/>
            
            <Greeting 
              message={<FormattedMessage {...popupMsg.welcome} />}
              icon={icon}
            />
          </div>
      </div>
    </LanguageProvider>
  );
};

export default Popup;
