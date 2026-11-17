import { test } from 'node:test';
import assert from 'node:assert/strict';
import ExcelJS from 'exceljs';
import JSZip from 'jszip';
import { parseCSV, classify, analyze, createWorkbook, createReport, columnName, LIMITS } from '../src/core.js';

test('CSV preserves quotes, embedded delimiter, CRLF, multiline text, Unicode and blank fields', () => {
  const data = parseCSV('\uFEFFid,note,empty\r\n001,"line 1\r\nline 2, ""quoted"" Київ",\r\n');
  assert.deepEqual(data.rows, [['id', 'note', 'empty'], ['001', 'line 1\r\nline 2, "quoted" Київ', '']]);
  assert.equal(data.delimiter, ',');
});
test('detects semicolon and tab, allows explicit pipe and single-column CSV', () => {
  assert.equal(parseCSV('id;name\n001;Test').delimiter, ';');
  assert.equal(parseCSV('id\tname\n001\tTest').delimiter, '\t');
  assert.deepEqual(parseCSV('id|name\n001|Test', '|').rows[1], ['001', 'Test']);
  assert.deepEqual(parseCSV('001\n002').rows, [['001'], ['002']]);
});
test('retains internal blank records, whitespace, trailing blank fields and duplicate headers', () => {
  const result = parseCSV('id,id,\n001,  hi  ,\n\n002,,\n', ',');
  assert.deepEqual(result.rows, [['id','id',''], ['001','  hi  ',''], [''], ['002','','']]);
  assert.deepEqual(result.ragged, [3]);
});
test('rejects malformed quotes without silently repairing source data', () => {
  assert.throws(() => parseCSV('a,b\n1,"unterminated'), /could not be parsed/);
  assert.throws(() => parseCSV('a,b\n1,"bad"trailing'), /could not be parsed/);
});
test('classifies source risks without rewriting values or claiming ordinary negatives are formulas', () => {
  assert.ok(classify('0049182').includes('zeros'));
  assert.ok(classify('92748901234567890123').includes('precision'));
  for (const value of ['03-04','2026-11-16','SEPT2','1-Mar-26']) assert.ok(classify(value).includes('date'), value);
  assert.ok(classify('1E10').includes('scientific'));
  for (const value of ['=1+1','+SUM(A1)','@SUM(A1)','\t=1+1','-cmd']) assert.ok(classify(value).includes('formula'), value);
  assert.deepEqual(classify('-12.50'), []);
  assert.deepEqual(classify('03-04'), ['date']);
  assert.ok(classify(' hi ').includes('whitespace'));
});
test('counts cells once even when multiple risks apply, includes header risks and correct Excel addresses', () => {
  const audit = analyze(parseCSV('001,note\n0000000000000000001,=1+1'));
  assert.equal(audit.flaggedCells, 3);
  assert.equal(audit.counts.zeros, 2); assert.equal(audit.counts.precision, 1);
  assert.equal(audit.findings[0].header, true); assert.equal(audit.findings[2].address, 'B2');
  assert.equal(columnName(26), 'Z'); assert.equal(columnName(27), 'AA'); assert.equal(columnName(256), 'IV');
});
test('XLSX round trip retains exact string values and stores no formula objects or hyperlinks', async () => {
  const data = parseCSV('id,long,date,formula,spaces,unicode,empty\n0049182,92748901234567890123,03-04,"=HYPERLINK(""https://example.com"",""click"")",  hi  ,Київ,\n00012,1E10,SEPT2,+SUM(A1),\ttext,日本語,', ',');
  const bytes = await createWorkbook(data);
  const book = new ExcelJS.Workbook(); await book.xlsx.load(bytes);
  const sheet = book.getWorksheet('Data');
  for (let r = 0; r < data.rows.length; r++) for (let c = 0; c < data.rows[r].length; c++) {
    const cell = sheet.getCell(r + 1, c + 1);
    assert.equal(cell.value, data.rows[r][c], `${r + 1}:${c + 1}`);
    assert.equal(cell.type, ExcelJS.ValueType.String);
    assert.equal(cell.numFmt, '@'); assert.equal(cell.formula, undefined); assert.equal(cell.hyperlink, undefined);
  }
  assert.equal(sheet.views[0].state, 'frozen'); assert.equal(sheet.views[0].ySplit, 1);
  assert.ok(sheet.autoFilter);
});
test('headerless workbook exports first record as data without filters or frozen header', async () => {
  const book = new ExcelJS.Workbook(); await book.xlsx.load(await createWorkbook(parseCSV('001,002\n003,004'), false));
  const sheet = book.getWorksheet('Data'); assert.equal(sheet.getCell('A1').value, '001');
  assert.equal(sheet.autoFilter, undefined); assert.equal(sheet.views?.length ?? 0, 0);
});
test('uneven records retain extra values and create empty missing positions', async () => {
  const data = parseCSV('a,b\nx\ny,z,extra', ',');
  assert.deepEqual(data.ragged, [2,3]);
  const book = new ExcelJS.Workbook(); await book.xlsx.load(await createWorkbook(data));
  assert.equal(book.getWorksheet('Data').getCell('C3').value, 'extra');
  assert.equal(book.getWorksheet('Data').getCell('B2').value, null);
});
test('rejects empty, invalid XML controls, replacement chars and oversized cells/files', () => {
  assert.throws(() => parseCSV(''), /empty/); assert.throws(() => parseCSV('  \n'), /empty/);
  assert.throws(() => parseCSV('a\u0000'), /control characters/);
  assert.throws(() => parseCSV('a\uFFFF'), /Unicode characters/);
  assert.throws(() => parseCSV('a\uD800'), /Unicode characters/);
  assert.equal(parseCSV('😀').rows[0][0], '😀');
  assert.throws(() => parseCSV('a\uFFFD'), /replacement characters/);
  assert.throws(() => parseCSV('x'.repeat(LIMITS.cellLength + 1)), /32,767/);
  assert.throws(() => parseCSV('x'.repeat(LIMITS.bytes + 1)), /5 MB/);
});
test('enforces row/column/cell limits before export', () => {
  assert.throws(() => parseCSV('a\n'.repeat(25001)), /25,000/);
  assert.throws(() => parseCSV(Array(257).fill('x').join(',')), /256/);
  assert.throws(() => parseCSV((Array(101).fill('x').join(',') + '\n').repeat(2500)), /250,000/);
});
test('report matches source and contains full values even when UI truncates', () => {
  const data = parseCSV('id\n001'); const report = JSON.parse(createReport(data, analyze(data), 'sample.csv', true));
  assert.equal(report.source, 'sample.csv'); assert.equal(report.findings[0].value, '001');
  assert.equal(report.flaggedCells, 1); assert.equal(report.version, '1.0.0');
});

test('OOXML stores risky values as shared strings, with no formula or hyperlink nodes', async () => {
  const zip = await JSZip.loadAsync(await createWorkbook(parseCSV('id,formula\n001,=1+1\n92748901234567890123,+SUM(A1)')));
  const xml = await zip.file('xl/worksheets/sheet1.xml').async('string');
  const strings = await zip.file('xl/sharedStrings.xml').async('string');
  assert.doesNotMatch(xml, /<f(?:\s|>)/); assert.doesNotMatch(xml, /<hyperlinks(?:\s|>)/);
  assert.match(xml, /r="A2"[^>]*t="s"/); assert.match(xml, /r="B2"[^>]*t="s"/);
  assert.match(strings, /001/); assert.match(strings, /92748901234567890123/); assert.match(strings, /=1\+1/);
});

test('XLSX preserves XML-like strings, literal escape-looking text, CR and supplementary Unicode', async () => {
  const values = ['_x0041_', '_X0041_', '_x005f_', '_x005F_x0041_', '_x000D_', '_x0000_', '&<>', 'a\rb', '😀', 'line\nnext', '\ttext\t'];
  const data = { rows: [values], width: values.length };
  const book = new ExcelJS.Workbook(); await book.xlsx.load(await createWorkbook(data, false));
  assert.deepEqual(book.getWorksheet('Data').getRow(1).values.slice(1), values);
});
