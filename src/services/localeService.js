const en = require('../../locales/en.json');
const fr = require('../../locales/fr.json');
const { DEFAULT_LANGUAGE } = require('../constants');

const locales = { en, fr };

function resolveLanguage(requested) {
  const supported = typeof requested === 'string' && Object.hasOwn(locales, requested);
  return supported ? requested : DEFAULT_LANGUAGE;
}

function getLocale(language) {
  return locales[language];
}

function listLanguages() {
  return Object.entries(locales).map(([code, locale]) => ({ code, name: locale.nativeName }));
}

module.exports = { resolveLanguage, getLocale, listLanguages };