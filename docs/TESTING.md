# Verification

## Automated checks

`npm run check` runs 14 Node.js tests and produces the browser bundle. The suite covers:

- BOM handling, quoted delimiters, escaped quotes, CRLF, embedded newlines, Unicode, blank records/fields and duplicate headers.
- Delimiter detection and explicit delimiter selection; ragged-row warnings and preservation of extra fields.
- Blocking malformed quotes, empty source, XML-invalid controls, unsupported Unicode and size/row/column/cell limits.
- Six heuristic warning categories, one-per-cell totals and Excel addresses.
- Reopening generated XLSX files and comparing each source value and string type, including leading zeros, 20-digit IDs, formula-like strings, whitespace and Unicode.
- Frozen/filterable headers and headerless exports.
- Direct inspection of zipped worksheet XML: risky cells reference shared strings, with no formula or hyperlink nodes.
- Literal OOXML escape-looking strings such as `_x0041_`, carriage returns, XML punctuation and supplementary Unicode. This test caught an ExcelJS serialization edge case; the exporter explicitly encodes those values before serialization.
- Full source values and counts in the JSON report.

The tests use ExcelJS to reopen the workbook and JSZip to inspect its OOXML. They do not substitute for testing every Microsoft Excel or LibreOffice release. No claim is made that heuristic detection predicts all locales or all application versions.

## Browser checks for 1.0.0

Checked in desktop Google Chrome on Windows:

- App loads with local bundled scripts and CSS.
- Fictional sample yields 8 data rows, 4 columns and 26 flagged cells.
- Formula category shows the literal HYPERLINK-like source text and its explanation.
- Source preview retains long identifiers, quotes and edge whitespace.
- Pasted CSV is parsed; a string containing an HTML `img` tag is displayed as literal text.
- Malformed quoted CSV shows an error and removes the export controls.
- XLSX export reaches the completed-workbook state.
- Desktop and 390 × 844 mobile layouts were visually inspected; screenshots are in `docs/screenshots/`.

Browser automation's file chooser could not set a local file because the extension's file-URL permission is disabled. That permission was left unchanged. Native drag/drop and encoding selection were therefore not verified end to end through this automation. The shared parser/export path is covered by automated tests; file input is a thin File/ArrayBuffer/TextDecoder wrapper. The browser download hook did not return a saved artifact path, so binary fidelity evidence comes from the automated XLSX/OOXML tests, not an asserted downloaded-file inspection.

## Dependency check

`npm audit` reported zero known vulnerabilities after overriding ExcelJS's legacy UUID dependency to `11.1.1`. Dependencies and the override are locked. This is a point-in-time registry check, not a guarantee that no vulnerability exists.

## Release gates

The public **Checks** and **Publish app** workflow runs provide independent Linux / Node.js 22 build evidence. A release is ready only after these runs succeed and the deployed app can be loaded. The release ZIP contains only the static app and license notices; no credentials, source CSVs from users or account data.
