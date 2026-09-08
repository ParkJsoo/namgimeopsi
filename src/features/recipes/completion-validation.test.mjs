import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import ts from 'typescript';

const directory = dirname(fileURLToPath(import.meta.url));
const element = (type, props) => ({ type, props });

// Run the real sheet and ledger with host UI/hooks replaced. No storage or
// network is used, so validation cannot modify existing test inventory.
function harness(items = [
  { id: 'tofu', name: '두부', quantity: '1모' },
  { id: 'zucchini', name: '애호박', quantity: '1개' },
]) {
  const slots = [];
  let cursor = 0;
  let confirmations = 0;
  let state = { version: 2, items, events: [] };
  const mocks = {
    react: {
      useState(initial) {
        const index = cursor++;
        if (!(index in slots)) slots[index] = typeof initial === 'function' ? initial() : initial;
        return [slots[index], (next) => { slots[index] = typeof next === 'function' ? next(slots[index]) : next; }];
      },
    },
    'react/jsx-runtime': { jsx: element, jsxs: element },
    'react-native': Object.assign(Object.fromEntries(['Modal', 'Pressable', 'Text', 'TextInput', 'View'].map((name) => [name, name])), { StyleSheet: { create: (styles) => styles } }),
    '@/components/KeyboardSheet': { KeyboardSheet: 'KeyboardSheet' },
  };
  function load(relativePath) {
    const path = resolve(directory, relativePath);
    const module = { exports: {} };
    const output = ts.transpileModule(readFileSync(path, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
      fileName: path,
    }).outputText;
    const requireMock = (name) => {
      assert.ok(name in mocks, `Unexpected dependency: ${name}`);
      return mocks[name];
    };
    vm.runInThisContext(`(function(require, module, exports) {${output}\n})`, { filename: path })(requireMock, module, module.exports);
    return module.exports;
  }
  const { RecipeCompletionSheet } = load('RecipeCompletionSheet.tsx');
  const { completeCookingSession } = load('../inventory/ledger.ts');
  return {
    get state() { return state; },
    get confirmations() { return confirmations; },
    render() {
      cursor = 0;
      return RecipeCompletionSheet({
        recommendation: { recipe: { id: 'test-recipe', title: '애호박 두부덮밥' } },
        consumedItems: items,
        onClose() {},
        onConfirm(consumptions) {
          confirmations++;
          state = completeCookingSession(state, consumptions, { sessionId: 'test-session', occurredAt: '2026-09-08T00:00:00Z' });
        },
      });
    },
  };
}

function nodes(tree) {
  if (Array.isArray(tree)) return tree.flatMap(nodes);
  if (!tree || typeof tree !== 'object') return [];
  return [tree, ...nodes(tree.props?.children)];
}
function text(tree) {
  if (Array.isArray(tree)) return tree.map(text).join('');
  if (typeof tree === 'string') return tree;
  return tree && typeof tree === 'object' ? text(tree.props?.children) : '';
}
function button(tree, label) {
  const found = nodes(tree).find((node) => node.type === 'Pressable' && text(node) === label);
  assert.ok(found, `Missing button: ${label}`);
  return found;
}
function remaining(app, value) {
  button(app.render(), '남은 양').props.onPress();
  const input = nodes(app.render()).find((node) => node.type === 'TextInput');
  input.props.onChangeText(value);
}

for (const blank of ['', '   ']) {
  const app = harness();
  const before = app.state;
  remaining(app, blank);
  const tree = app.render();
  const confirm = button(tree, '재료 사용 완료');
  assert.equal(confirm.props.disabled, true);
  assert.ok(nodes(tree).some((node) => node.props?.accessibilityRole === 'alert' && text(node) === '남은 양을 입력해 주세요.'));
  confirm.props.onPress();
  assert.equal(app.confirmations, 0);
  assert.equal(app.state, before, 'Invalid remaining quantity must block the entire cooking session');

  nodes(tree).find((node) => node.type === 'TextInput').props.onChangeText('반 모');
  const corrected = app.render();
  assert.equal(button(corrected, '재료 사용 완료').props.disabled, false);
  assert.ok(!text(corrected).includes('남은 양을 입력해 주세요.'));
  button(corrected, '재료 사용 완료').props.onPress();
  assert.equal(app.confirmations, 1);
  assert.equal(app.state.items.find((item) => item.id === 'tofu').quantity, '반 모');
  assert.deepEqual(app.state.events.map((event) => [event.inventoryItemId, event.type]), [['tofu', 'consume'], ['zucchini', 'consume-all']]);
  assert.equal(app.state.events[0].remainingQuantityLabel, '반 모');
}
console.log('✓ Empty/whitespace remaining quantity blocks all consumption; corrected input commits both lots');

{
  const app = harness();
  remaining(app, '1모');
  const confirm = button(app.render(), '재료 사용 완료');
  assert.equal(confirm.props.disabled, false);
  confirm.props.onPress();
  assert.equal(app.state.items.find((item) => item.id === 'tofu').quantity, '1모');
  assert.deepEqual(app.state.events.map((event) => [event.inventoryItemId, event.type]), [['zucchini', 'consume-all']]);
}
console.log('✓ Keeping one lot unchanged still permits consumption of another lot');

{
  const app = harness([{ id: 'tofu', name: '두부', quantity: '1모' }]);
  remaining(app, ' 1모 ');
  const confirm = button(app.render(), '재료 사용 완료');
  assert.equal(confirm.props.disabled, true);
  confirm.props.onPress();
  assert.equal(app.confirmations, 0);
  assert.equal(app.state.events.length, 0);
}
console.log('✓ Whitespace-only differences do not enable an unchanged single-lot session');
