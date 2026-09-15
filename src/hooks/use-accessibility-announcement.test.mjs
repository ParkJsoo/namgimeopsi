import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const code = ts.transpileModule(readFileSync(new URL('./use-accessibility-announcement.ts', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;
for (const OS of ['ios', 'android', 'web']) {
  const spoken = [];
  let previous;
  const exports = {};
  vm.runInNewContext(code, {
    exports,
    require: (name) => {
      if (name === 'react') return { useEffect: (effect, dependencies) => {
        if (!previous || dependencies[0] !== previous[0]) { previous = dependencies; effect(); }
      } };
      assert.equal(name, 'react-native');
      return { Platform: { OS }, AccessibilityInfo: { announceForAccessibility: (message) => spoken.push(message) } };
    },
  });
  for (const message of [null, '저장하지 못했어요.', '저장하지 못했어요.', null, '6개를 냉장고에 담았어요.']) {
    exports.useAccessibilityAnnouncement(message);
  }
  assert.deepEqual(spoken, OS === 'ios' ? ['저장하지 못했어요.', '6개를 냉장고에 담았어요.'] : []);
  console.log(`✓ ${OS}: changed visible notices announce on iOS only; live regions handle Android/web`);
}
