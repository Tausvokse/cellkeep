# Release process

1. Use Node.js 22+ and run `npm ci`, `npm run check` and `npm audit --audit-level=moderate`.
2. Serve `dist/` with `npm start`. Check file input, paste, sample, filters, pagination, preview, header toggle, download and clear. Check a mobile breakpoint. Verify exact source text after reopening the XLSX.
3. Inspect screenshots and remove real user data; the repository sample is fictional. Confirm `package.json`, interface, report and release notes carry the same version.
4. Commit only source, lockfile, tests, docs and screenshots. Do not commit `node_modules`, credentials, exported user files or built `dist/`.
5. Push `main`. Both **Checks** and **Publish app** must succeed. GitHub Pages must be configured to use Actions. Verify the live page, not only the workflow status.
6. Package all files in `dist/` together. Include the license and notices. The offline ZIP must contain `index.html`, `app.js`, `styles.css` and `icon.svg` at the root. Test opening `index.html` directly before publishing.
7. Tag the verified source commit, upload the offline ZIP and its SHA-256 checksum to a GitHub Release, and check the asset URLs.

Example commands after verification:

```sh
git tag -a v1.0.0 -m "Cellkeep 1.0.0"
git push origin v1.0.0
gh release create v1.0.0 /absolute/path/cellkeep-v1.0.0-offline.zip /absolute/path/SHA256SUMS.txt --verify-tag --title "Cellkeep 1.0.0 — Your CSV, kept intact" --notes-file docs/RELEASE_NOTES.md
```

The GitHub release is the binary distribution channel; the repo contains reproducible source. Do not present a publication as evidence of revenue or customer demand.
