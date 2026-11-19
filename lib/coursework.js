// Shared helpers for homework and lab pages.
const fs = require('fs');
const path = require('path');

// Colab and Drive notebook links open a student copy in Colab (#copy=true); anything else is left as is.
function studentCopyLink(link) {
  if (!link) return { link: '', opensCopy: false };
  const driveNotebook = link.match(/^https:\/\/drive\.google\.com\/file\/d\/([A-Za-z0-9_-]+)/);
  if (driveNotebook) link = `https://colab.research.google.com/drive/${driveNotebook[1]}`;
  if (!link.startsWith('https://colab.research.google.com/')) return { link, opensCopy: false };
  const url = new URL(link);
  const fragment = new URLSearchParams(url.hash.slice(1));
  fragment.set('copy', 'true');
  url.hash = fragment.toString();
  return { link: url.href, opensCopy: true };
}

// A notebook preview is used once its light and dark HTML are committed, e.g.
// static/labs/lab01/lab01-light.html (made with scripts/render_notebook_preview.py).
function previewBaseFor(kind, name) {
  const base = `static/${kind}/${name}/${name}`;
  const light = path.join(process.cwd(), `${base}-light.html`);
  const dark = path.join(process.cwd(), `${base}-dark.html`);
  return fs.existsSync(light) && fs.existsSync(dark) ? base : '';
}

// Every "<Kind> NN" the schedule names (as a topic or in the assignments cell), with the
// text after "Lab NN - " as its title. Returns Map(number -> title).
function scheduledNumbers(schedule, kind) {
  const found = new Map();
  const pattern = new RegExp(`^${kind}\\s+(\\d+)(?:\\s*[-:]\\s*(.+))?$`, 'i');
  for (const section of schedule) {
    for (const day of section.days || []) {
      for (const item of [day.topics, ...(day.assignments || [])]) {
        const match = String(item || '').trim().match(pattern);
        if (!match) continue;
        const num = parseInt(match[1], 10);
        if (!found.has(num) || (!found.get(num) && match[2])) found.set(num, (match[2] || '').trim());
      }
    }
  }
  return found;
}

function assignmentByNumber(assignments, kind) {
  const out = new Map();
  const pattern = new RegExp(`^${kind}\\s+(\\d+)$`, 'i');
  for (const a of assignments) {
    const match = String(a.name || '').trim().match(pattern);
    if (match) out.set(parseInt(match[1], 10), a);
  }
  return out;
}

module.exports = { studentCopyLink, previewBaseFor, scheduledNumbers, assignmentByNumber };
