# Security and privacy

CSV parsing and XLSX generation run on the user's device. There is no application backend, telemetry, cookie, localStorage, third-party font, CDN script or API request. The page's Content Security Policy sets `connect-src 'none'`. Hosting providers still receive normal page requests and may log network metadata. Follow source links only when you intend to leave the app.

The app renders source values with `textContent`, never as HTML. XLSX values are plain strings with text formatting, never formula or hyperlink objects. Formula-like content is preserved literally without adding apostrophes. Re-exporting the workbook to CSV and opening that CSV can reintroduce formula interpretation and conversion risks. The JSON report contains source values: treat it as sensitive as the input.

Files are held in memory only. Clear data or close the tab to release the application's references; this is not a forensic memory erasure guarantee. Downloads remain on your device until you delete them. Download the offline release and disconnect if you require processing without a network connection.

Limits: 5 MiB source text, 25,000 records including header, 256 columns, 250,000 rectangular cells, 32,767 UTF-16 code units per cell. XML-invalid controls and replacement characters are rejected rather than silently dropped. Unicode noncharacters unsupported by XLSX are also rejected. Malformed quoting blocks export. Uneven rows produce an explicit warning and retain all extra fields.

Dependencies are pinned and a lockfile is committed. `uuid` is overridden to 11.1.1 because the older version used by ExcelJS has a published advisory; ExcelJS uses its compatible `v4` export. CI checks `npm audit` alongside behavior and export tests.

Do not put confidential files in public issues. For a vulnerability, use the repository's private vulnerability reporting option if enabled. If unavailable, keep reproduction data synthetic and avoid publicly disclosing exploit details.
