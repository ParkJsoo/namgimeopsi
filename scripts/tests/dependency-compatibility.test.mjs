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
