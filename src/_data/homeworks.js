/**
 * Homework pages: one for every "Homework NN" the schedule or the Assignments tab names.
 * The notebook link comes from the Assignments tab row (opened as a Colab copy); a homework
 * without a link yet shows "Notebook link not yet available".
 * Preview: commit static/homeworks/homeworkNN/homeworkNN-{light,dark}.html (scripts/render_notebook_preview.py).
 */
const { studentCopyLink, previewBaseFor, scheduledNumbers, assignmentByNumber } = require('../../lib/coursework.js');

module.exports = async function() {
  const [assignments, schedule] = await Promise.all([
    require('./assignments.js')(),
    require('./schedule.js')()
  ]);
  const rows = assignmentByNumber(assignments, 'Homework');
  const numbers = new Set([...scheduledNumbers(schedule, 'Homework').keys(), ...rows.keys()]);

  const homeworks = [...numbers].sort((a, b) => a - b).map(num => {
    const numberStr = String(num).padStart(2, '0');
    const assignmentName = `homework${numberStr}`;
    const { link, opensCopy } = studentCopyLink(rows.get(num)?.link || '');
    return {
      number: num,
      numberStr,
      assignmentName,
      assignmentDisplay: `Homework ${numberStr}`,
      link,
      opensCopy,
      canvasLink: '',
      previewBase: previewBaseFor('homeworks', assignmentName)
    };
  });

  console.log(`[11ty] Found ${homeworks.length} homeworks: ${homeworks.map(h => h.number).join(', ')}`);
  return homeworks;
};
