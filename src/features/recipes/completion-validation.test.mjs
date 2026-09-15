import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import ts from 'typescript';
import * as dates from '../inventory/dates.ts';
import * as lots from './inventory-lots.ts';
import { getLiveRecipeRecommendations } from './recommendations.ts';

const directory = dirname(fileURLToPath(import.meta.url));
const element = (type, props) => ({ type, props });

// Run the real sheet and ledger with host UI/hooks replaced. No storage or
// network is used, so validation cannot modify existing test inventory.
function harness(items = [
  { id: 'tofu', name: '두부', quantity: '1모' },
  { id: 'zucchini', name: '애호박', quantity: '1개' },
]) {
  items = items.map((item) => ({ storage: '냉장', createdAt: '2026-09-01T00:00:00Z', ...item }));
  const slots = [];
  let cursor = 0;
  let confirmations = 0;
  let visible = true;
  let announcement = null;
  let state = { version: 2, items, events: [] };
  const mocks = {
    '@/hooks/use-accessibility-announcement': { useAccessibilityAnnouncement: (message) => { announcement = message; } },
    '../inventory/dates': dates,
    './inventory-lots': lots,
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
    get announcement() { return announcement; },
    get confirmations() { return confirmations; },
    reopen() { visible = true; },
    render() {
      cursor = 0;
      return RecipeCompletionSheet({
        recommendation: visible ? { recipe: { id: 'test-recipe', title: '애호박 두부덮밥' } } : null,
        consumedItems: visible ? state.items.filter((item) => !state.events.some((event) => event.inventoryItemId === item.id && event.type === 'consume-all')) : [],
        referenceDate: '2026-09-14',
        onClose() { visible = false; },
        onConfirm(consumptions) {
          confirmations++;
          state = completeCookingSession(state, consumptions, { sessionId: `test-session-${confirmations}`, occurredAt: '2026-09-08T00:00:00Z' });
          visible = false;
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
  assert.equal(app.announcement, '두부 남은 양을 입력해 주세요.');
  assert.ok(nodes(tree).some((node) => node.props?.accessibilityRole === 'alert' && text(node) === '남은 양을 입력해 주세요.'));
  confirm.props.onPress();
  assert.equal(app.confirmations, 0);
  assert.equal(app.state, before, 'Invalid remaining quantity must block the entire cooking session');

  nodes(tree).find((node) => node.type === 'TextInput').props.onChangeText('반 모');
  const corrected = app.render();
  assert.equal(button(corrected, '재료 사용 완료').props.disabled, false);
  assert.equal(app.announcement, null);
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


const duplicateLots = [
  { id: 'new-tofu', name: '두부', quantity: '1모', storage: '냉동', recommendedUseByAt: '2026-09-20', createdAt: '2026-09-14T00:00:00Z' },
  { id: 'old-tofu', name: '두부', quantity: '1모', storage: '냉장', recommendedUseByAt: '2026-09-13', createdAt: '2026-09-01T00:00:00Z' },
];
{
  const candidates = lots.getCookingCandidates(duplicateLots, ['두부', ' 두부 '], '2026-09-14');
  assert.deepEqual(candidates.map((i) => i.id), ['old-tofu', 'new-tofu']);
  assert(getLiveRecipeRecommendations(duplicateLots, '2026-09-14')[0].reason.includes('기준 날짜가 지났어요'));
  const app = harness(candidates);
  const tree = app.render();
  const radios = nodes(tree).filter((node) => node.props?.accessibilityRole === 'radio');
  assert.equal(radios.length, 2);
  assert.equal(radios[0].props.accessibilityState.checked, true);
  assert(radios[0].props.accessibilityLabel.includes('냉장'));
  assert(radios[0].props.accessibilityLabel.includes('2026-09-13'));
  button(tree, '재료 사용 완료').props.onPress();
  assert.deepEqual(app.state.events.map((e) => e.inventoryItemId), ['old-tofu']);
}
console.log('✓ The recommended urgent lot is the default completion target, independent of inventory order');
{
  const app = harness(duplicateLots);
  const newer = nodes(app.render()).find((node) => node.props?.accessibilityRole === 'radio' && node.props.accessibilityLabel.includes('2026-09-20'));
  newer.props.onPress();
  remaining(app, '반 모');
  button(app.render(), '재료 사용 완료').props.onPress();
  assert.deepEqual(app.state.events.map((e) => [e.inventoryItemId, e.type]), [['new-tofu', 'consume']]);
  assert.equal(app.state.items.find((i) => i.id === 'new-tofu').quantity, '반 모');
  assert.equal(app.state.items.find((i) => i.id === 'old-tofu').quantity, '1모');
}
console.log('✓ Choosing another lot updates only its quantity and ledger');
{
  const app = harness(duplicateLots);
  nodes(app.render()).find((node) => node.props?.accessibilityRole === 'radio' && node.props.accessibilityLabel.includes('2026-09-20')).props.onPress();
  remaining(app, '');
  assert.equal(button(app.render(), '재료 사용 완료').props.disabled, true);
  button(app.render(), '아직 있어요').props.onPress();
  assert.equal(app.state.events.length, 0);
  assert.equal(app.render().props.visible, false);
  app.reopen();
  const radios = nodes(app.render()).filter((node) => node.props?.accessibilityRole === 'radio');
  assert.equal(radios[0].props.accessibilityState.checked, true);
  assert.equal(button(app.render(), '재료 사용 완료').props.disabled, false);
}
console.log('✓ Cancel leaves all lots unchanged and resets selection and invalid draft');

for (const renderWhileHidden of [true, false]) {
  const app = harness([{ id: 'tofu', name: '두부', quantity: '1모' }]);
  remaining(app, '반 모');
  button(app.render(), '재료 사용 완료').props.onPress();
  assert.equal(app.state.items[0].quantity, '반 모');
  if (renderWhileHidden) assert.equal(app.render().props.visible, false);
  app.reopen();
  button(app.render(), '남은 양').props.onPress();
  let tree = app.render();
  assert.equal(nodes(tree).find((node) => node.type === 'TextInput').props.value, '반 모');
  assert.equal(button(tree, '재료 사용 완료').props.disabled, true);
  button(tree, '재료 사용 완료').props.onPress();
  assert.equal(app.state.events.length, 1);
  assert.equal(app.state.items[0].quantity, '반 모');

  // Cancel a changed draft and reopen against the current inventory again.
  nodes(tree).find((node) => node.type === 'TextInput').props.onChangeText('조금 남음');
  button(app.render(), '아직 있어요').props.onPress();
  if (renderWhileHidden) assert.equal(app.render().props.visible, false);
  app.reopen();
  button(app.render(), '남은 양').props.onPress();
  tree = app.render();
  assert.equal(nodes(tree).find((node) => node.type === 'TextInput').props.value, '반 모');
  assert.equal(button(tree, '재료 사용 완료').props.disabled, true);

  nodes(tree).find((node) => node.type === 'TextInput').props.onChangeText('조금 남음');
  button(app.render(), '재료 사용 완료').props.onPress();
  assert.equal(app.state.items[0].quantity, '조금 남음');
  assert.deepEqual(app.state.events.map((event) => event.remainingQuantityLabel), ['반 모', '조금 남음']);
}
console.log('✓ Reopening after partial consumption uses current quantity, blocks unchanged saves and clears cancelled drafts, with or without a hidden render');
