import { parseCSV, analyze, classify, createWorkbook, createReport, RISKS, LIMITS, columnName } from './core.js';
const $ = id => document.getElementById(id);
const sample = 'sku,tracking_id,date_code,description\r\n0049182,92748901234567890123,03-04,"Linen notebook, A5"\r\n0073201,92748901234567890124,06-07,Graphite pencil set\r\n0012804,92748901234567890125,SEPT2,Paper sample pack\r\n0094500,1E10,08-09,"=HYPERLINK(""https://example.com"",""Reference"")"\r\n0023140,92748901234567890127,2026-11-16,"  Preserve these spaces  "\r\n0068210,92748901234567890128,12-01,Cotton tote\r\n0037190,92748901234567890129,10-11,Desk calendar\r\n0081600,92748901234567890130,01-02,Index tabs\r\n';
let state = null, raw = '', source = '', file = null, page = 0, generation = 0;
const pageSize = 5;
const num = n => n.toLocaleString('en-US');
function el(tag, text, className) { const node = document.createElement(tag); if (text !== undefined) node.textContent = text; if (className) node.className = className; return node; }
function message(text = '', kind = '') { $('message').textContent = text; $('message').className = 'message ' + kind; $('message').hidden = !text; }
function invalidate() { state = null; $('results').hidden = true; $('empty').hidden = false; }
function inspect() {
  generation++;
  try {
    const delimiter = $('delimiter').value === 'tab' ? '\t' : $('delimiter').value;
    const data = parseCSV(raw, delimiter), header = $('header').checked;
    state = { data, audit: analyze(data, header), header };
    page = 0;
    $('filter').value = 'all';
    $('empty').hidden = true; $('results').hidden = false;
    $('filename').textContent = source;
    $('source-label').textContent = file ? 'Local file · never uploaded' : source.startsWith('Sample') ? 'Sample data · fictional export' : 'Pasted text · stays on this device';
    $('row-count').textContent = num(Math.max(0, data.rows.length - (header ? 1 : 0)));
    $('column-count').textContent = num(data.width);
    $('risk-count').textContent = num(state.audit.flaggedCells);
    $('risk-tab-count').textContent = num(state.audit.flaggedCells);
    $('delimiter-note').textContent = 'Delimiter: ' + ({ ',': 'comma', ';': 'semicolon', '\t': 'tab', '|': 'pipe' }[data.delimiter] || JSON.stringify(data.delimiter));
    renderFindings(); renderPreview();
    $('export').disabled = false; $('export').textContent = 'Download .xlsx ↓';
    if (data.ragged.length) message('Uneven rows detected: ' + data.ragged.slice(0, 8).join(', ') + (data.ragged.length > 8 ? '…' : '') + '. Check the delimiter and preview. Missing fields export as blank cells; extra fields are retained.', 'warning');
    else message();
  } catch (error) { invalidate(); message(error.message, 'error'); }
}
function renderFindings() {
  if (!state) return;
  const { audit } = state, filter = $('filter').value;
  const findings = audit.findings.filter(f => filter === 'all' || f.flags.includes(filter));
  const pages = Math.max(1, Math.ceil(findings.length / pageSize)); page = Math.min(page, pages - 1);
  $('findings').replaceChildren();
  const start = page * pageSize;
  $('finding-summary').textContent = findings.length ? `${num(start + 1)}–${num(Math.min(start + pageSize, findings.length))} of ${num(findings.length)} cells` : '0 cells';
  if (!findings.length) {
    const empty = el('div', undefined, 'no-findings');
    empty.append(el('strong', audit.flaggedCells ? 'No cells in this category' : 'No common risks detected'), el('span', 'All values will still be exported as literal text.'));
    $('findings').append(empty);
  }
  findings.slice(start, start + pageSize).forEach(finding => {
    const row = el('div', undefined, 'finding');
    const value = el('code', finding.value.length > 300 ? finding.value.slice(0, 300) + '…' : finding.value, 'finding-value');
    value.title = finding.value;
    const body = el('div');
    body.append(value, el('p', finding.flags.map(flag => RISKS[flag].explanation).join(' ') + (finding.header ? ' This is a header cell.' : ''), 'finding-description'));
    row.append(el('span', finding.address, 'finding-address'), body, el('span', RISKS[finding.flags[0]].label, 'risk-tag'));
    $('findings').append(row);
  });
  $('page-label').textContent = 'Page ' + (page + 1) + ' of ' + num(pages);
  $('previous').disabled = page === 0; $('next').disabled = page >= pages - 1;
}
function renderPreview() {
  const { data, header } = state, table = $('preview-table'); table.replaceChildren();
  const cols = Math.min(data.width, 12), rows = data.rows.slice(0, 20);
  $('preview-note').textContent = `Showing ${rows.length} of ${num(data.rows.length)} records and ${cols} of ${num(data.width)} columns. Highlighted values are flagged; export includes everything.`;
  const thead = el('thead'), head = el('tr'); head.append(el('th', '#', 'rownum'));
  for (let c = 0; c < cols; c++) { const th = el('th', columnName(c + 1)); th.scope = 'col'; head.append(th); }
  thead.append(head); table.append(thead);
  const tbody = el('tbody');
  rows.forEach((row, r) => {
    const tr = el('tr'); tr.append(el('td', String(r + 1), 'rownum'));
    for (let c = 0; c < cols; c++) {
      const value = row[c] ?? '', tag = header && r === 0 ? 'th' : 'td';
      const cell = el(tag, value.length > 200 ? value.slice(0, 200) + '…' : value, classify(value).length ? 'flagged' : '');
      cell.title = value; tr.append(cell);
    }
    tbody.append(tr);
  });
  table.append(tbody);
}
function tab(selected, focus = false) {
  for (const name of ['risks', 'preview']) { const active = selected === name; $(name + '-tab').setAttribute('aria-selected', String(active)); $(name + '-tab').tabIndex = active ? 0 : -1; $(name + '-panel').hidden = !active; }
  if (focus) $(selected + '-tab').focus();
}
for (const name of ['risks', 'preview']) {
  $(name + '-tab').addEventListener('click', () => tab(name));
  $(name + '-tab').addEventListener('keydown', event => { if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) { event.preventDefault(); tab(event.key === 'Home' ? 'risks' : event.key === 'End' ? 'preview' : name === 'risks' ? 'preview' : 'risks', true); } });
}
async function loadFile(selected) {
  file = selected; source = selected.name;
  const current = ++generation;
  invalidate(); message('Reading local file…');
  try {
    if (selected.size > LIMITS.bytes) throw new Error('File is too large. The limit is 5 MB.');
    const bytes = await selected.arrayBuffer();
    if (current !== generation) return;
    raw = new TextDecoder($('encoding').value, { fatal: true }).decode(bytes);
    inspect();
  } catch (error) { if (current === generation) { invalidate(); message(error instanceof TypeError ? 'Could not decode this file. Choose the correct file encoding and try again.' : error.message, 'error'); } }
}
$('file').addEventListener('change', event => { if (event.target.files[0]) loadFile(event.target.files[0]); event.target.value = ''; });
$('file').addEventListener('focus', () => $('dropzone').classList.add('drag-over'));
$('file').addEventListener('blur', () => $('dropzone').classList.remove('drag-over'));
$('demo').addEventListener('click', () => { file = null; source = 'Sample · fulfillment-export.csv'; raw = sample; $('delimiter').value = ''; $('header').checked = true; inspect(); tab('risks'); });
$('inspect-paste').addEventListener('click', () => { file = null; source = 'Pasted CSV'; raw = $('paste').value; inspect(); });
$('delimiter').addEventListener('change', () => { if (raw) inspect(); });
$('header').addEventListener('change', () => { if (raw) inspect(); });
$('encoding').addEventListener('change', () => { if (file) loadFile(file); });
$('filter').addEventListener('change', () => { page = 0; renderFindings(); });
$('previous').addEventListener('click', () => { page--; renderFindings(); });
$('next').addEventListener('click', () => { page++; renderFindings(); });
$('clear').addEventListener('click', () => { generation++; file = null; raw = ''; source = ''; $('paste').value = ''; $('file').value = ''; invalidate(); message('Data cleared from this page. Your original file is unchanged.'); $('demo').focus(); });
const zone = $('dropzone');
zone.addEventListener('dragover', event => { event.preventDefault(); zone.classList.add('drag-over'); });
zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
zone.addEventListener('drop', event => { event.preventDefault(); zone.classList.remove('drag-over'); if (event.dataTransfer.files.length !== 1) message('Choose one file at a time.', 'error'); else loadFile(event.dataTransfer.files[0]); });
// Prevent a missed drop from navigating away with source data.
window.addEventListener('dragover', event => event.preventDefault());
window.addEventListener('drop', event => event.preventDefault());
function basename() { return source.replace(/^Sample · /, '').replace(/\.[^.]+$/, '').replace(/[^\p{L}\p{N}._-]+/gu, '-').slice(0, 100) || 'cellkeep'; }
function download(content, type, filename) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = el('a'); a.href = url; a.download = filename; document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
$('export').addEventListener('click', async () => {
  if (!state) return;
  const snapshot = state, name = basename(), current = generation;
  $('export').disabled = true; $('export').textContent = 'Creating workbook…';
  try {
    await new Promise(resolve => setTimeout(resolve, 20));
    const bytes = await createWorkbook(snapshot.data, snapshot.header);
    if (generation !== current) return;
    download(bytes, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', name + '-kept.xlsx');
    message('Workbook created. Every source value is stored as text. Check your browser downloads.');
  } catch (error) { if (current === generation) message('Export failed: ' + error.message, 'error'); }
  finally { if (generation === current) { $('export').disabled = false; $('export').textContent = 'Download .xlsx ↓'; } }
});
$('report').addEventListener('click', () => { if (state) download(createReport(state.data, state.audit, source, state.header), 'application/json', basename() + '-risk-report.json'); });
