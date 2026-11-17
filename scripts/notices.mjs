import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
const notices = ['Cellkeep third-party notices\n\nThe following notices cover installed runtime and build dependencies. Each retains its own license.\n'];
async function walk(base) {
  for (const item of await readdir(base, { withFileTypes: true })) {
    if (!item.isDirectory() || item.name.startsWith('.')) continue;
    const folder = join(base, item.name);
    if (item.name.startsWith('@')) { await walk(folder); continue; }
    let pkg; try { pkg = JSON.parse(await readFile(join(folder, 'package.json'), 'utf8')); } catch { continue; }
    const files = (await readdir(folder)).filter(name => /^(licen[cs]e|copying|notice)(\.|$|-)/i.test(name));
    for (const file of files) {
      try { notices.push('\n' + '='.repeat(72) + '\n' + pkg.name + '@' + pkg.version + ' — ' + file + '\n\n' + await readFile(join(folder, file), 'utf8')); } catch { /* skip directories */ }
    }
    try { await walk(join(folder, 'node_modules')); } catch { /* no nested packages */ }
  }
}
await walk('node_modules');
await writeFile('dist/THIRD_PARTY_NOTICES.txt', notices.join('\n'));
console.log('Dependency notices written');
