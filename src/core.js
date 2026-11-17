import Papa from 'papaparse';
import ExcelJS from 'exceljs';

export const LIMITS = Object.freeze({ bytes: 5 * 1024 * 1024, rows: 25000, columns: 256, cells: 250000, cellLength: 32767 });
export const RISKS = {
  zeros: { label: 'Leading zeros', explanation: 'Opening CSV directly can remove the zeros at the start.' },
  precision: { label: 'Long number', explanation: 'Excel numbers retain only 15 significant digits.' },
  date: { label: 'Date-like text', explanation: 'Spreadsheet apps may interpret this as a date, depending on locale.' },
  scientific: { label: 'Scientific notation', explanation: 'This text can be interpreted as an exponential number.' },
  formula: { label: 'Formula-like text', explanation: 'A spreadsheet may treat this prefix as a formula. XLSX export keeps it literal.' },
  whitespace: { label: 'Edge whitespace', explanation: 'Spaces and tabs at the edges are intentional and will be preserved.' }
};

export function classify(value) {
  const flags = [];
  const t = value.trim();
  if (/^[+-]?0\d+(?:\.\d*)?$/.test(t)) flags.push('zeros');
  if (/^[+-]?\d{16,}(?:\.\d*)?$/.test(t)) flags.push('precision');
  if (/^[+-]?(?:\d+\.?\d*|\.\d+)[eE][+-]?\d+$/.test(t)) flags.push('scientific');
  if (/^(?:\d{1,4}[-/]\d{1,2}(?:[-/]\d{1,4})?(?:[ T].*)?|\d{1,2}[- ](?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*(?:[- ]\d{2,4})?|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[- ]?\d{1,2})$/i.test(t)) flags.push('date');
  if (/^[=+@-]/.test(t) && !/^-\d+(?:\.\d+)?$/.test(t)) flags.push('formula');
  if (value !== t) flags.push('whitespace');
  return flags;
}

export function parseCSV(text, delimiter = '') {
  if (new TextEncoder().encode(text).length > LIMITS.bytes) throw new Error('File is too large. The limit is 5 MB.');
  if (!text.length || !text.replace(/^\uFEFF/, '').trim()) throw new Error('The file is empty. Choose a CSV with at least one value.');
  if (text.includes('\uFFFD')) throw new Error('The file contains replacement characters. Choose the correct encoding or export the source again.');
  if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(text)) throw new Error('The file contains control characters that XLSX cannot preserve. Use a plain-text CSV.');
  if (/[\uFFFE\uFFFF]|\p{Surrogate}/u.test(text)) throw new Error('The file contains Unicode characters that XLSX cannot preserve. Check the source encoding.');
  const result = Papa.parse(text, { delimiter, dynamicTyping: false, header: false, skipEmptyLines: false });
  const errors = result.errors.filter(e => e.code !== 'UndetectableDelimiter');
  if (errors.length) throw new Error('CSV could not be parsed: ' + errors[0].message);
  const rows = result.data;
  // A final record separator is not an additional empty data record. Internal blank rows stay.
  if (/(?:\r\n|\r|\n)$/.test(text) && rows.at(-1)?.length === 1 && rows.at(-1)[0] === '') rows.pop();
  if (rows.length > LIMITS.rows) throw new Error('Too many rows. The limit is 25,000 including the header.');
  const width = rows.reduce((max, row) => Math.max(max, row.length), 0);
  if (width > LIMITS.columns) throw new Error('Too many columns. The limit is 256.');
  if (rows.length * width > LIMITS.cells) throw new Error('Too many cells. The limit is 250,000 including empty cells.');
  const ragged = [];
  rows.forEach((row, i) => {
    if (row.length !== rows[0].length) ragged.push(i + 1);
    row.forEach(value => {
      if (value.length > LIMITS.cellLength) throw new Error('A cell exceeds the XLSX limit of 32,767 characters. No export was created.');
    });
  });
  return { rows, width, delimiter: result.meta.delimiter || delimiter || ',', ragged };
}

export function analyze(data, header = true) {
  const findings = [];
  const counts = Object.fromEntries(Object.keys(RISKS).map(key => [key, 0]));
  // Include headers in the audit: they are also exported as literal cells.
  data.rows.forEach((row, r) => row.forEach((value, c) => {
    const flags = classify(value);
    if (!flags.length) return;
    flags.forEach(flag => counts[flag]++);
    findings.push({ row: r + 1, column: c + 1, address: columnName(c + 1) + (r + 1), value, flags, header: header && r === 0 });
  }));
  return { findings, counts, flaggedCells: findings.length };
}

export function columnName(index) {
  let name = '';
  while (index > 0) { index--; name = String.fromCharCode(65 + index % 26) + name; index = Math.floor(index / 26); }
  return name;
}

export async function createWorkbook(data, header = true) {
  const book = new ExcelJS.Workbook();
  book.creator = 'Cellkeep';
  const sheet = book.addWorksheet('Data');
  data.rows.forEach(row => {
    // OOXML reserves _xHHHH_ escapes and XML normalizes raw CR characters.
    // Escape source underscores first, then encode CR, so Excel reads the original text.
    const added = sheet.addRow(row.map(value => String(value)
      .replace(/_x[0-9a-f]{4}_/gi, match => '_x005F_' + match.slice(1))
      .replace(/\r/g, '_x000D_')));
    added.eachCell(cell => { cell.numFmt = '@'; });
  });
  for (let c = 1; c <= data.width; c++) {
    const lengths = data.rows.slice(0, 100).map(row => String(row[c - 1] || '').length);
    sheet.getColumn(c).width = Math.min(44, Math.max(14, ...lengths) + 2);
  }
  if (header) {
    sheet.views = [{ state: 'frozen', ySplit: 1 }];
    sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: data.rows.length, column: data.width } };
    sheet.getRow(1).height = 26;
    sheet.getRow(1).eachCell(cell => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, name: 'Calibri', size: 11 };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF225E4A' } };
    });
  }
  return book.xlsx.writeBuffer();
}

export function createReport(data, audit, name, header) {
  return JSON.stringify({ tool: 'Cellkeep', version: '1.0.0', source: name, records: data.rows.length, columns: data.width, firstRowIsHeader: header, delimiter: data.delimiter, raggedRows: data.ragged, flaggedCells: audit.flaggedCells, counts: audit.counts, findings: audit.findings, note: 'Heuristic warnings, not a prediction of every spreadsheet version. Values in findings contain source data. XLSX exports all cells as text.' }, null, 2);
}
