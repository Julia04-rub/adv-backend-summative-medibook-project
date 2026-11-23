const HTML_ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => HTML_ESCAPES[char]);

const formatToday = (language) => new Intl.DateTimeFormat(language, { dateStyle: 'full' }).format(new Date());

const STYLES = `
  body { font-family: system-ui, sans-serif; max-width: 720px; margin: 2rem auto; padding: 0 1rem; line-height: 1.5; }
  label { display: block; margin-top: 1.25rem; font-weight: 600; }
  textarea { width: 100%; box-sizing: border-box; margin-top: 0.4rem; padding: 0.5rem; font: inherit; }
  button { margin-top: 1.5rem; padding: 0.6rem 1.2rem; font: inherit; cursor: pointer; }
  .meta { color: #555; }
`;

function layout(language, title, body) {
  return `<!DOCTYPE html>
<html lang="${escapeHtml(language)}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <style>${STYLES}</style>
</head>
<body>
${body}
</body>
</html>`;
}

function renderLanguageLinks(language, locale, languages) {
  const links = languages
    .map(({ code, name }) => (code === language
      ? `<strong>${escapeHtml(name)}</strong>`
      : `<a href="/feedback?lang=${escapeHtml(code)}">${escapeHtml(name)}</a>`))
    .join(' | ');
  return `<p class="meta">${escapeHtml(locale.languageLabel)}: ${links}</p>`;
}

function renderFeedbackPage(language, locale, languages) {
  const questions = locale.questions
    .map((question, index) => `
    <label for="q${index + 1}">${index + 1}. ${escapeHtml(question)}</label>
    <textarea id="q${index + 1}" name="q${index + 1}" rows="4" required></textarea>`)
    .join('');

  const body = `
  <h1>${escapeHtml(locale.title)}</h1>
  <p class="meta">${escapeHtml(locale.dateLabel)}: ${escapeHtml(formatToday(language))}</p>
  ${renderLanguageLinks(language, locale, languages)}
  <p>${escapeHtml(locale.instructions)}</p>
  <form method="post" action="/feedback?lang=${escapeHtml(language)}">${questions}
    <button type="submit">${escapeHtml(locale.submit)}</button>
  </form>`;
  return layout(language, locale.title, body);
}

function renderThanksPage(language, locale) {
  const body = `
  <h1>${escapeHtml(locale.thanks)}</h1>
  <p><a href="/feedback?lang=${escapeHtml(language)}">${escapeHtml(locale.back)}</a></p>`;
  return layout(language, locale.title, body);
}

module.exports = { renderFeedbackPage, renderThanksPage };