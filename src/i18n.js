/**
 * i18n.js
 * 
 * This contains react-intl initializaion
 * 
 * exports AppLocaleList, translatedMessages, DEFAULT_LOCALE
 */

const AppLocaleList = require('./_locales/index'); 

// Deprecated when upgrade to react-int >= v3
/*
const addLocaleData = require('react-intl').addLocaleData; 

const en = require('react-intl/locale-data/en');
const vi = require('react-intl/locale-data/vi');
const zh = require('react-intl/locale-data/zh');

addLocaleData(en);
addLocaleData(vi);
addLocaleData(zh);

*/

const enTranslationMessages = require('./_locales/en/messages.json');
const viTranslationMessages = require('./_locales/vi/messages.json');
const zhTranslationMessages = require('./_locales/zh/messages.json');

const translatedMessages = {
    en: enTranslationMessages,
    vi: viTranslationMessages,
    zh: zhTranslationMessages,
};

const DEFAULT_LOCALE = navigator.language.match(/^[A-Za-z]{2}/)[0];

export { AppLocaleList, translatedMessages, DEFAULT_LOCALE };