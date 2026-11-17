<p align="left"><img src="public/icon.svg" width="56" alt="Cellkeep"></p>

# Cellkeep

**Your CSV, kept intact.** Inspect conversion risks, then export an Excel workbook with every value stored as literal text. Built for people handling product codes, shipping references and database exports.

[Open the app](https://tausvokse.github.io/cellkeep/) · [Download offline release](https://github.com/Tausvokse/cellkeep/releases/latest) · [Product overview](docs/OVERVIEW.md) · [Українською](docs/README.uk.md)

[![Checks](https://github.com/Tausvokse/cellkeep/actions/workflows/ci.yml/badge.svg)](https://github.com/Tausvokse/cellkeep/actions/workflows/ci.yml) [![Publish app](https://github.com/Tausvokse/cellkeep/actions/workflows/pages.yml/badge.svg)](https://github.com/Tausvokse/cellkeep/actions/workflows/pages.yml) [![License: MIT](https://img.shields.io/badge/license-MIT-225e4a)](LICENSE)

![Cellkeep reviewing a fictional fulfillment CSV](docs/screenshots/desktop.jpg)

## The problem

CSV stores values, not cell types. Opening one directly in a spreadsheet can change meaningful text:

| Original text | Possible interpretation | Cellkeep XLSX |
| --- | --- | --- |
| `0049182` | A number without its leading zeros | Text `0049182` |
| `92748901234567890123` | A number with precision lost after 15 digits | All 20 digits, as text |
| `03-04` | A date, depending on locale | Text `03-04` |
| `1E10` | An exponential number | Text `1E10` |
| `=1+1` | A formula | Literal text `=1+1` |

Microsoft documents these conversions and ways to disable them in Excel: [Keeping leading zeros and large numbers](https://support.microsoft.com/en-us/excel/keeping-leading-zeros-and-large-numbers). Cellkeep provides a portable file that does not depend on the recipient's CSV import settings. It cannot restore information already lost in the source.

## Use it

1. Open the [web app](https://tausvokse.github.io/cellkeep/) or extract the offline release and open `index.html`.
2. Choose a CSV/TSV, drop one onto the import area, paste text, or try the fictional sample.
3. Check delimiter, encoding and whether the first row is a header. Review flagged cells or inspect the data preview.
4. Download `.xlsx`. Optionally download a JSON risk report, which includes source values.

No account or upload is required. No tracking scripts, external fonts, runtime CDN dependencies or application API requests. The offline folder works without a server or internet connection. The hosted version still makes normal page requests to GitHub Pages.

## What ships

- Warnings for leading zeros, long integers, date-like text, scientific notation, formula-like prefixes and edge whitespace.
- Cell addresses, category filters, paginated findings and a preview of the first 20 records / 12 columns.
- Comma, semicolon, tab and pipe separators; quoted delimiters, escaped quotes and multiline fields.
- UTF-8, UTF-16 LE/BE, Windows-1252 and Windows-1251 input decoding.
- Exact literal-text XLSX export for **all** cells, with no apostrophe prefixes, formula objects or hyperlink objects.
- Optional frozen header and filter; duplicate header names remain unchanged.
- Explicit errors for malformed quoting, undecodable files and unsupported characters. Uneven rows get a warning and preserve extra fields.
- Responsive layout, keyboard controls, focus states and reduced-motion support.

## Deliberate limits

This is a text-preservation tool. Amounts and quantities also export as text, so convert selected columns in Excel when you need calculations. Risk detection is heuristic, not a simulation of every spreadsheet version or locale. It does not edit, clean, repair, merge or deduplicate values.

| Limit | Maximum |
| --- | --- |
| Source | 5 MiB (decoded text must also fit as UTF-8) |
| Records | 25,000, including optional header |
| Columns | 256 |
| Rectangular cells | 250,000, including missing positions |
| Cell length | 32,767 UTF-16 code units |

Internal blank rows and spaces are retained. A final record separator does not create an extra row. A missing field in a ragged row becomes a blank XLSX cell. A leading Unicode BOM is consumed as an encoding marker. CSV syntax and original byte encoding are not retained in XLSX; the parsed cell text is.

## Develop

Node.js 22 or newer:

```sh
npm ci
npm run check
npm start
```

Open `http://127.0.0.1:4173`. `npm run check` runs the Node test suite and builds the static app into `dist/`. `npm run build` bundles every runtime dependency locally with esbuild. `npm audit --audit-level=moderate` checks known dependency advisories. See [verification notes](docs/TESTING.md).

The runtime uses [Papa Parse](https://www.papaparse.com/) and [ExcelJS](https://github.com/exceljs/exceljs). There is no backend. The core is isolated in `src/core.js` so parsing, warnings and workbook export can be tested independently of the UI.

## Publish your fork

The included GitHub Actions run tests, audit dependencies, build and deploy `dist/`. Enable **Settings → Pages → Source → GitHub Actions**. Set repository Actions permissions to permit the supplied `pages: write` and OIDC deployment workflow. Update the repository and app URLs when renaming a fork. See [release instructions](docs/RELEASING.md).

## Screenshots

The screenshots show fictional sample data. [Desktop review](docs/screenshots/desktop.jpg) · [Mobile layout](docs/screenshots/mobile.jpg).

## License and credits

[MIT](LICENSE). Dependency notices ship with the offline release. Design process guided by [unslop](https://heydamir.design/unslop) by [Damir Sokolovsky](https://x.com/heydamir), CC BY 4.0. See [NOTICE.md](NOTICE.md).
