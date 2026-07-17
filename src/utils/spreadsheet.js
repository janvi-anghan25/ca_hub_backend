import xlsx from 'xlsx';
import AppError from './AppError.js';

/**
 * Parse an uploaded .xlsx/.xls/.csv file buffer into an array of row objects
 * keyed by the header row. Values are returned as trimmed strings so callers
 * can coerce them explicitly. The first worksheet is used.
 */
export const parseSpreadsheet = (buffer) => {
  let workbook;
  try {
    workbook = xlsx.read(buffer, { type: 'buffer' });
  } catch {
    throw new AppError('Could not read the file. Upload a valid .xlsx or .csv file.', 400, 'INVALID_FILE');
  }

  const sheetName = workbook.SheetNames[0];
  if (!sheetName) throw new AppError('The file has no sheets.', 400, 'EMPTY_FILE');

  const rows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], {
    defval: '',
    raw: false,
    blankrows: false,
  });

  return rows.map((row) => {
    const normalized = {};
    Object.entries(row).forEach(([key, value]) => {
      normalized[String(key).trim()] = typeof value === 'string' ? value.trim() : value;
    });
    return normalized;
  });
};

/** Case-insensitive header lookup with trimming. Returns '' when absent. */
export const pick = (row, ...keys) => {
  const lowerMap = {};
  Object.keys(row).forEach((k) => { lowerMap[k.toLowerCase().trim()] = row[k]; });
  for (const key of keys) {
    const val = lowerMap[key.toLowerCase().trim()];
    if (val !== undefined && val !== null && String(val).trim() !== '') return String(val).trim();
  }
  return '';
};

/** Coerce a spreadsheet cell to a non-negative number, or undefined when blank. */
export const toNumber = (value) => {
  if (value === '' || value === null || value === undefined) return undefined;
  const n = Number(String(value).replace(/,/g, ''));
  return Number.isFinite(n) ? n : NaN;
};

/**
 * Parse a date cell. Accepts ISO (YYYY-MM-DD), DD/MM/YYYY and DD-MM-YYYY.
 * Returns a Date or null when unparseable/blank.
 */
export const parseDate = (value) => {
  if (!value) return null;
  const s = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const m = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (m) {
    const [, dd, mm, yyyy] = m;
    const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
};
