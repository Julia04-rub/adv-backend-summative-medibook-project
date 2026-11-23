const { resolveLanguage, getLocale, listLanguages } = require('../services/localeService');
const { renderFeedbackPage, renderThanksPage } = require('../views/feedbackPage');

exports.show = (req, res) => {
  const language = resolveLanguage(req.query.lang);
  res.type('html').send(renderFeedbackPage(language, getLocale(language), listLanguages()));
};

exports.submit = (req, res) => {
  const language = resolveLanguage(req.query.lang);
  res.type('html').send(renderThanksPage(language, getLocale(language)));
};