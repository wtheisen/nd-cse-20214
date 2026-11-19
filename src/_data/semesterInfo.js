const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const fetchCsv = require('../../lib/fetchCsv.js');

/**
 * Load semester info from CSV URL or local YAML file
 * Fetches instructor, TAs, and course info from Google Sheets
 */

// Helper functions
function normalizeHeaders(headers) {
  return headers.map(h => h.trim().toLowerCase().replace(/ /g, '_'));
}

function bestOf(row, ...candidates) {
  for (const c of candidates) {
    if (row[c] && row[c].trim()) {
      return row[c].trim();
    }
  }
  return '';
}

function parseOfficeHours(ohStr, location = '') {
  if (!ohStr) return {};
  const result = {};

  // Split by commas or semicolons
  const entries = ohStr.includes(',') ? ohStr.split(',') : ohStr.replace(/\n/g, ';').split(';');

  for (let entry of entries) {
    entry = entry.trim();
    if (!entry) continue;

    // Check format: "Day: Time | Location" or "Day Time"
    const firstSpaceIdx = entry.indexOf(' ');
    const firstColonIdx = entry.indexOf(':');

    if (firstColonIdx !== -1 && (firstSpaceIdx === -1 || firstColonIdx < firstSpaceIdx)) {
      // Colon-separated: "Monday: 9:00 AM - 11:00 AM | Location"
      const parts = entry.split(':', 1);
      const day = parts[0].trim();
      const rest = entry.substring(entry.indexOf(':') + 1).trim();

      if (rest.includes('|')) {
        const [time, loc] = rest.split('|', 2);
        result[day] = `${time.trim()} | ${loc.trim()}`;
      } else {
        result[day] = location ? `${rest} | ${location}` : rest;
      }
    } else {
      // Space-separated: "Monday 9:00 AM - 11:00 AM"
      const parts = entry.split(' ', 1);
      if (parts.length >= 1) {
        const day = parts[0].trim();
        const time = entry.substring(entry.indexOf(' ') + 1).trim();
        result[day] = location ? `${time} | ${location}` : time;
      }
    }
  }
  return result;
}

// "Monday 11:30 AM - 12:20 PM, Wednesday ..." -> { Monday: "11:30 AM - 12:20 PM", ... }
function parseDayTimes(str) {
  const result = {};
  if (!str) return result;
  const entries = str.includes(',') ? str.split(',') : str.replace(/\n/g, ';').split(';');
  for (let entry of entries) {
    entry = entry.trim();
    if (!entry) continue;
    const firstSpaceIdx = entry.indexOf(' ');
    const firstColonIdx = entry.indexOf(':');
    if (firstColonIdx !== -1 && (firstSpaceIdx === -1 || firstColonIdx < firstSpaceIdx)) {
      result[entry.split(':')[0].trim()] = entry.substring(entry.indexOf(':') + 1).trim();
    } else {
      result[entry.split(' ', 1)[0].trim()] = entry.substring(entry.indexOf(' ') + 1).trim();
    }
  }
  return result;
}

function loadSemesterInfoFromCSV(text) {
  const records = parse(text, {
    columns: (headers) => normalizeHeaders(headers),
    skip_empty_lines: true,
    trim: true
  });

  let instructor = null;
  const tasDict = {};
  let courseInfoRow = null;
  let labRow = null;

  for (const row of records) {
    const infoType = bestOf(row, 'info_type', 'type', 'role', 'row_type');
    const hasTerm = !!bestOf(row, 'term');
    const hasNetid = !!bestOf(row, 'netid', 'id');
    const hasName = !!bestOf(row, 'name');

    // Identify row type
    if (['class', 'course', 'course_info', 'info'].includes(infoType.toLowerCase())) {
      courseInfoRow = row;
    } else if (infoType.toLowerCase() === 'lab') {
      labRow = row;
    } else if (['person', 'people', 'staff'].includes(infoType.toLowerCase()) || (!hasTerm && (hasNetid || hasName))) {
      // Person row
      const netid = bestOf(row, 'netid', 'id');
      const name = bestOf(row, 'name');
      const level = bestOf(row, 'level');
      const location = bestOf(row, 'location');
      const times = bestOf(row, 'times', 'office_hours', 'oh');
      const github = bestOf(row, 'github');

      if (!netid) continue;

      const personData = {
        name,
        netid,
        level,
        office_hours: times ? parseOfficeHours(times, location) : {}
      };
      if (github) personData.github = github;

      if (!instructor) {
        instructor = personData;
      } else {
        tasDict[netid] = personData;
      }
    } else if (hasTerm) {
      courseInfoRow = row;
    }
  }

  // Class and lab meeting times
  const classTimes = parseDayTimes(courseInfoRow ? bestOf(courseInfoRow, 'class_times', 'times', 'time') : '');
  const labTimes = parseDayTimes(labRow ? bestOf(labRow, 'times', 'time') : '');

  const courseInfo = {
    Term: courseInfoRow ? bestOf(courseInfoRow, 'term') : '',
    Year: courseInfoRow ? bestOf(courseInfoRow, 'year') : '',
    class_location: courseInfoRow ? bestOf(courseInfoRow, 'class_location', 'location') : '',
    class_times: classTimes,
    lab_location: labRow ? bestOf(labRow, 'location') : '',
    lab_times: labTimes
  };

  const ghHomeworkLink = courseInfoRow ? bestOf(courseInfoRow, 'gh_homework_link', 'github_homework_link', 'homework_link') : '';
  if (ghHomeworkLink) {
    courseInfo.gh_homework_link = ghHomeworkLink;
  }

  return {
    Instructor: instructor,
    TAs: tasDict,
    ...courseInfo
  };
}

module.exports = async function() {
  // Read config.json for CSV URLs and settings
  const configPath = path.join(process.cwd(), 'config.json');

  let csvUrls = {};
  let cancelledDays = [];

  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    csvUrls = config.csv_urls || {};
    cancelledDays = config.cancelled_days || [];
  } catch (err) {
    console.error('Warning: Could not read config.json:', err.message);
  }

  let semesterInfo = {
    Instructor: null,
    TAs: {},
    Term: '',
    Year: '',
    class_location: '',
    class_times: {},
    cancelled_days: cancelledDays
  };

  // Fetch from CSV if URL available
  if (csvUrls.info) {
    const csvText = await fetchCsv(csvUrls.info);
    semesterInfo = loadSemesterInfoFromCSV(csvText);
    semesterInfo.cancelled_days = cancelledDays;
  }

  // Add CSV URLs for reference
  semesterInfo.csv_urls = csvUrls;

  return semesterInfo;
};
