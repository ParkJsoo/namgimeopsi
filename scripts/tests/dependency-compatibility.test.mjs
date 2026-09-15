import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
const xcodeRequire = createRequire(require.resolve('xcode'));
const uuid = xcodeRequire('uuid');
const xcode = require('xcode');

// Keep the scoped xcode override compatible with its CommonJS v4 call site.
test('Xcode generates unique 24-character IDs and round-trips a new group', () => {
  const project = xcode.project('dependency-compatibility.pbxproj');
  project.hash = { project: { objects: { PBXGroup: {} } } };
  const ids = new Set();
  for (let i = 0; i < 100; i++) {
    const group = project.addPbxGroup([], `Group${i}`, `Group${i}`);
    assert.match(group.uuid, /^[A-F0-9]{24}$/);
    assert.equal(ids.has(group.uuid), false);
    ids.add(group.uuid);
  }
  const parsed = xcodeRequire('./lib/parser/pbxproj').parse(project.writeSync());
  for (const id of ids) {
    assert.deepEqual({ ...parsed.project.objects.PBXGroup[id] }, project.hash.project.objects.PBXGroup[id]);
  }
});

// GHSA-w5hq-g745-h8pq: an invalid destination must fail before any writes.
for (const version of ['v3', 'v5']) {
  test(`Xcode's resolved uuid ${version} rejects invalid buffer bounds without mutation`, () => {
    for (const [size, offset] of [[15, 0], [16, -1], [16, 1]]) {
      const buffer = new Uint8Array(size).fill(0x5a);
      const before = buffer.slice();
      assert.throws(() => uuid[version]('namgimeopsi', uuid[version].DNS, buffer, offset), RangeError);
      assert.deepEqual(buffer, before);
    }
    const buffer = new Uint8Array(18).fill(0x5a);
    assert.equal(uuid[version]('namgimeopsi', uuid[version].DNS, buffer, 1), buffer);
    assert.equal(buffer[0], 0x5a);
    assert.equal(buffer[17], 0x5a);
  });
}

const queryRequire = createRequire(require.resolve('query-string'));
const queryString = queryRequire('query-string');
const { getStateFromPath } = require('expo-router/build/react-navigation/core/getStateFromPath');

test('query-string keeps Korean, literal plus, repeated values, and empty values', () => {
  assert.deepEqual({ ...queryString.parse('name=%EB%91%90%EB%B6%80&note=1%2B1+%EB%AA%A8&tag=a&tag=b&empty=&flag') }, {
    name: '두부', note: '1+1 모', tag: ['a', 'b'], empty: '', flag: null,
  });
  const values = { name: '남은 카레', quantity: '반 봉지', tag: ['냉장', '오늘'], literal: '+' };
  assert.deepEqual({ ...queryString.parse(queryString.stringify(values)) }, values);
});

test('Expo Router still resolves encoded query parameters to the home route', () => {
  const state = getStateFromPath('/?name=%EB%91%90%EB%B6%80&quantity=%EB%B0%98+%EB%AA%A8', { screens: { index: '' } });
  assert.equal(state.routes[0].name, 'index');
  assert.deepEqual(state.routes[0].params, { name: '두부', quantity: '반 모' });
});

test('decoder handles malformed UTF-8 without dropping adjacent valid text', () => {
  const decode = queryRequire('decode-uri-component');
  assert.equal(typeof decode, 'function');
  assert.equal(decode('%FF%41%EB%91%90%EB%B6%80%'), '%FFA두부%');
  assert.equal(decode('%FE%FF'), '\uFFFD\uFFFD');
  assert.throws(() => decode(null), TypeError);
});

test('malformed query decoding completes inside a bounded child process', async () => {
  // Run untrusted-shaped input in a child so a vulnerable decoder cannot hang the test runner.
  const { spawnSync } = await import('node:child_process');
  const child = spawnSync(process.execPath, ['-e', `
    const assert = require('node:assert/strict');
    const {getStateFromPath} = require('expo-router/build/react-navigation/core/getStateFromPath');
    const value = '%FF'.repeat(10000);
    const state = getStateFromPath('/?name=' + value, {screens: {index: ''}});
    assert.equal(state.routes[0].params.name, value);
  `], { cwd: new URL('../../', import.meta.url), timeout: 3000, encoding: 'utf8' });
  assert.ifError(child.error);
  assert.equal(child.status, 0, child.stderr);
});
