'use strict';

const { readFileSync } = require('node:fs');
const { spawnSync } = require('node:child_process');
const { join } = require('node:path');
const assert = require('node:assert/strict');
const test = require('node:test');

const cwd = join(__dirname, '..');
const readme = readFileSync(join(cwd, 'README.md'), 'utf8');

for (const [index, [, language, code]] of Array.from(readme.matchAll(/^```(js|sh)\n([\s\S]*?)^```$/gm)).entries()) {
  test(`README example ${index + 1} (${language})`, () => {
    const expected = [...code.matchAll(/^\s*(?:\/\/|#) => (.*)$/gm)].map(([, line]) => line);
    assert.ok(expected.length, 'each executable example declares its output');

    let args = ['-e', code];
    if (language === 'sh') {
      const commands = code.replace(/^#.*$/gm, '').trim().replace(/^bharat-utils /gm, 'node ./bin/cli.js ');
      args = ['-e', `require('node:child_process').execFileSync('sh', ['-e', '-c', ${JSON.stringify(commands)}], { stdio: 'inherit' })`];
    }
    const child = spawnSync(process.execPath, args, { cwd, encoding: 'utf8', timeout: 5000 });
    assert.equal(child.status, 0, child.stderr);
    assert.equal(child.stderr, '');
    assert.equal(child.stdout, expected.join('\n') + '\n');
  });
}

test('README documents every public runtime export', () => {
  for (const name of Object.keys(require('bharat-utils'))) {
    assert.match(readme, new RegExp('^\\| `' + name + '[( :]', 'm'), name);
  }
});
