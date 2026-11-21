import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import test from 'node:test';
import assert from 'node:assert/strict';
import * as esm from 'bharat-utils';

const require = createRequire(import.meta.url);
const cjs = require('bharat-utils');
const root = fileURLToPath(new URL('..', import.meta.url));

function declaredValues(file) {
  const types = readFileSync(new URL(file, import.meta.url), 'utf8');
  return [...types.matchAll(/^export (?:declare )?(?:function|const|let|var|class|enum) (\w+)/gm)]
    .map(([, name]) => name).sort();
}

test('CommonJS, ESM, and TypeScript value exports match', async () => {
  const keys = Object.keys(cjs).sort();
  assert.deepEqual(Object.keys(esm).filter((name) => name !== 'default').sort(), keys);
  assert.deepEqual(declaredValues('../index.d.ts'), keys);
  assert.match(readFileSync(new URL('../index.d.ts', import.meta.url), 'utf8'), /^export default bharat;/m);
  assert.equal(esm.default, cjs);
  for (const name of keys) assert.equal(esm[name], cjs[name], name);
  for (const name of ['express', 'fastify', 'koa']) {
    const adapter = require(`bharat-utils/${name}`);
    const esmAdapter = await import(`bharat-utils/${name}`);
    assert.deepEqual(Object.keys(adapter).sort(), declaredValues(`../${name}.d.ts`));
    assert.equal(esmAdapter.validateRequest, adapter.validateRequest);
  }
});

test('npm pack dry run contains exactly the intended release files', (t) => {
  const cache = mkdtempSync(join(tmpdir(), 'bharat-pack-'));
  t.after(() => rmSync(cache, { recursive: true, force: true }));
  const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const [pack] = JSON.parse(execFileSync(npm, ['pack', '--dry-run', '--json', '--cache', cache], { cwd: root, encoding: 'utf8' }));
  const intended = `CHANGELOG.md LICENSE README.md bin/cli.js express.d.ts fastify.d.ts
    index.d.ts index.mjs koa.d.ts package.json src/_num.js src/aadhaar.js src/bank.js
    src/contact.js src/currency.js src/data/tax-slabs.js src/detect.js src/express.js
    src/fastify.js src/fy.js src/gstin.js src/hindi.js src/ids.js src/index.js src/koa.js
    src/lang/_language.js src/lang/bn.js src/lang/gu.js src/lang/mr.js src/lang/ta.js
    src/mask.js src/pan.js src/pii.js src/pincode.js src/registry.js src/schema.js src/tax.js
    src/vehicle.js`.trim().split(/\s+/).sort();
  assert.deepEqual(pack.files.map(({ path }) => path).sort(), intended);
});
