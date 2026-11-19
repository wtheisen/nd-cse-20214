// The one rule for turning a schedule topic into the Resources sheet's lecture id ("lec-<slug>").
// It matches the Resources sheet's Exports formula (each run of non-alphanumerics becomes "-"), plus
// aliases for schedule topics whose wording differs from their Resources tab name.
// Used by the schedule table (.eleventy.js filters) and the missing-resources build warning.

// Add an entry when a schedule topic's wording differs from its Resources tab name:
//   'schedule topic, lowercased': 'resources-tab-slug',
const LECTURE_ALIASES = {
};

function lectureIdFor(topic) {
  if (!topic) return '';
  const key = String(topic).trim().toLowerCase();
  const slug = LECTURE_ALIASES[key] || key
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return slug ? `lec-${slug}` : '';
}

module.exports = { lectureIdFor, LECTURE_ALIASES };
