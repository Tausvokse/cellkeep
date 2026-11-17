# Cellkeep 1.0.0

Inspect a CSV for values Excel might reinterpret, then download an XLSX workbook that stores every cell as literal text.

**[Open the web app](https://tausvokse.github.io/cellkeep/)** or download `cellkeep-v1.0.0-offline.zip`, extract the whole folder and open `index.html`. The offline release needs no installation, account, server or internet connection. `SHA256SUMS.txt` contains the offline archive checksum.

## Included

- Six categories of conversion warnings with source cell addresses and exact values.
- Local file selection, drag and drop, pasted CSV and a fictional sample export.
- Delimiter and encoding controls, category filtering, pagination and source preview.
- All-text XLSX export with optional frozen/filterable header.
- Downloadable JSON risk report; source values stay in browser memory until cleared or the page closes.
- Responsive interface, automated parsing/export tests, and GitHub Pages deployment.

## Know before using

All amounts and quantities are exported as text too. Convert specific columns when you need calculations. Warnings are heuristics; they do not cover every spreadsheet behavior. The app cannot recover source data already corrupted by another tool. JSON reports contain source values and should be handled like the source file.

Limits: 5 MiB input, 25,000 records including header, 256 columns, 250,000 rectangular cells and 32,767 UTF-16 code units per cell. Malformed quotes and unsupported characters block export; uneven rows get a warning.

See [README](https://github.com/Tausvokse/cellkeep#readme), [privacy details](https://github.com/Tausvokse/cellkeep/blob/main/SECURITY.md) and [verification notes](https://github.com/Tausvokse/cellkeep/blob/main/docs/TESTING.md).
