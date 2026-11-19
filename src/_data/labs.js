/**
 * Lab pages (as in CSE 10124): one for every "Lab NN - Title" the schedule names.
 * The notebook link comes from the Assignments tab row "Lab NN" (opened as a Colab copy);
 * a lab without a link yet shows "Notebook link not yet available".
 * Preview: commit static/labs/labNN/labNN-{light,dark}.html (scripts/render_notebook_preview.py).
 */
const { studentCopyLink, previewBaseFor, scheduledNumbers, assignmentByNumber } = require('../../lib/coursework.js');

module.exports = async function() {
  const [assignments, schedule] = await Promise.all([
    require('./assignments.js')(),
    require('./schedule.js')()
  ]);
  const titles = scheduledNumbers(schedule, 'Lab');
  const rows = assignmentByNumber(assignments, 'Lab');
  const numbers = new Set([...titles.keys(), ...rows.keys()]);

  const labs = [...numbers].sort((a, b) => a - b).map(num => {
    const numberStr = String(num).padStart(2, '0');
    const assignmentName = `lab${numberStr}`;
    const { link, opensCopy } = studentCopyLink(rows.get(num)?.link || '');
    return {
      number: num,
      numberStr,
      assignmentName,
      assignmentDisplay: `Lab ${numberStr}`,
      title: titles.get(num) || '',
      link,
      opensCopy,
      previewBase: previewBaseFor('labs', assignmentName)
    };
  });

  console.log(`[11ty] Found ${labs.length} labs: ${labs.map(l => l.number).join(', ')}`);
  return labs;
};
