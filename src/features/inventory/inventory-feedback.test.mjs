import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import * as dates from './dates.ts';
const typeExports = {};
vm.runInNewContext(ts.transpileModule(readFileSync(new URL('./types.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, { exports: typeExports, require: () => dates });
const { blankDraft } = typeExports;

const code = ts.transpileModule(readFileSync(new URL('../../app/index.tsx', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
}).outputText;
function harness(inventory = {}) {
  let cursor = 0;
  const slots = [];
  const calls = { retry: 0, add: 0, update: 0, announcements: [] };
  const state = { items: [], isReady: true, syncStatus: 'error', ...inventory };
  const element = (type, props) => ({ type, props });
  const mocks = {
    '@/hooks/use-accessibility-announcement': { useAccessibilityAnnouncement: (message) => calls.announcements.push(message) },
    react: {
      useEffect: () => {},
      useMemo: (compute) => compute(),
      useState: (initial) => {
        const index = cursor++;
        if (!(index in slots)) slots[index] = typeof initial === 'function' ? initial() : initial;
        return [slots[index], (next) => { slots[index] = typeof next === 'function' ? next(slots[index]) : next; }];
      },
    },
    'react/jsx-runtime': { jsx: element, jsxs: element, Fragment: 'Fragment' },
    'react-native': {
      ...Object.fromEntries(['View', 'Text', 'TextInput', 'Pressable', 'ScrollView', 'Modal'].map((name) => [name, name])),
      StyleSheet: { create: (styles) => styles }, Alert: { alert: () => {} },
    },
    'react-native-safe-area-context': { SafeAreaView: 'SafeAreaView' },
    '@/features/inventory/dates': dates,
    '@/features/inventory/types': { blankDraft, ...dates },
    '@/features/inventory/use-inventory': { useInventory: () => ({ ...state, retrySync: () => calls.retry++, add: () => calls.add++, update: () => calls.update++ }) },
    '@/features/recipes/inventory-lots': { getCookingCandidates: () => [] },
    '@/features/recipes/recommendations': { getLiveRecipeRecommendations: () => [] },
    ...Object.fromEntries([
      ['@/components/KeyboardSheet', 'KeyboardSheet'], ['@/features/recipes/RecipeCard', 'RecipeCard'],
      ['@/features/recipes/RecipeCompletionSheet', 'RecipeCompletionSheet'], ['@/features/receipts/ReceiptEntrySheet', 'ReceiptEntrySheet'],
    ].map(([path, name]) => [path, { [name]: name }])),
  };
  const exports = {};
  vm.runInNewContext(code, { exports, require: (name) => { assert.ok(name in mocks, name); return mocks[name]; } });
  return { calls, state, render: () => { cursor = 0; return exports.default(); } };
}
function nodes(tree) {
  if (Array.isArray(tree)) return tree.flatMap(nodes);
  if (!tree || typeof tree !== 'object') return [];
  return [tree, ...nodes(tree.props?.children)];
}
function text(tree) {
  if (Array.isArray(tree)) return tree.map(text).join('');
  if (typeof tree === 'string' || typeof tree === 'number') return String(tree);
  return tree && typeof tree === 'object' ? text(tree.props?.children) : '';
}
function button(tree, label) {
  const found = nodes(tree).find((node) => node.type === 'Pressable' && text(node).includes(label));
  assert.ok(found, `Missing button: ${label}`);
  return found;
}
const loading = harness({ isReady: false });
assert.ok(text(loading.render()).includes('저장된 재고를 읽지 못했어요'));
button(loading.render(), '다시 불러오기').props.onPress();
assert.equal(loading.calls.retry, 1);
assert.ok(!nodes(loading.render()).some((node) => node.type === 'TextInput'));
console.log('✓ startup read failure exposes retry without an inventory editor');

for (const mode of ['add', 'update']) {
  const item = { ...blankDraft, id: 'tofu', name: '두부', quantity: '1모', recommendedUseByAt: '2026-09-15' };
  const app = harness({ items: mode === 'update' ? [item] : [] });
  if (mode === 'add') nodes(app.render()).find((node) => node.type === 'ReceiptEntrySheet').props.onDirectAdd();
  else {
    button(app.render(), '냉장고').props.onPress();
    button(app.render(), '두부').props.onPress();
  }
  const input = (label) => nodes(app.render()).find((node) => node.type === 'TextInput' && node.props.accessibilityLabel === label);
  input('식재료 이름').props.onChangeText('두부');
  input('남은 양').props.onChangeText('   ');
  const save = button(app.render(), mode === 'add' ? '냉장고에 담기' : '수정 완료');
  assert.equal(save.props.disabled, true);
  save.props.onPress();
  assert.equal(app.calls[mode], 0);
  assert.ok(text(app.render()).includes('남은 양을 입력해 주세요'));
  input('남은 양').props.onChangeText('반 모');
  assert.equal(button(app.render(), mode === 'add' ? '냉장고에 담기' : '수정 완료').props.disabled, false);
  console.log(`✓ ${mode} editor blocks blank quantities and accepts household units`);
}

for (const syncStatus of ['error', 'offline', 'syncing']) {
  const app = harness({ syncStatus });
  for (const tab of ['홈', '냉장고']) {
    const tabNode = nodes(app.render()).find((node) => node.props?.accessibilityRole === 'tab' && text(node).includes(tab));
    tabNode.props.onPress();
    const notice = nodes(app.render()).find((node) => node.type === 'Pressable' && text(node).includes('동기화'));
    assert.ok(notice, `${tab} must expose ${syncStatus}`);
    if (syncStatus === 'error') assert.ok(text(notice).includes('저장'));
    notice.props.onPress();
  }
  assert.equal(app.calls.retry, 2);
  app.state.syncStatus = 'synced';
  assert.ok(!nodes(app.render()).some((node) => node.type === 'Pressable' && text(node).includes('동기화')));
  console.log(`✓ home and inventory expose ${syncStatus} and clear after recovery`);
}


const accessibleApp = harness({ syncStatus: 'synced' });
const byLabel = (tree, label) => nodes(tree).find((node) => node.props?.accessibilityLabel === label);
assert.equal(byLabel(accessibleApp.render(), '홈').props.accessibilityState.selected, true);
byLabel(accessibleApp.render(), '냉장고').props.onPress();
assert.equal(byLabel(accessibleApp.render(), '냉장고').props.accessibilityState.selected, true);
assert.equal(byLabel(accessibleApp.render(), '홈').props.accessibilityState.selected, false);
byLabel(accessibleApp.render(), '재고 필터 남은 음식').props.onPress();
assert.equal(byLabel(accessibleApp.render(), '재고 필터 남은 음식').props.accessibilityState.selected, true);
assert.equal(byLabel(accessibleApp.render(), '재고 필터 전체').props.accessibilityState.selected, false);
function picker(app, name) { return nodes(app.render()).find((node) => node.type.name === name); }
let storage = picker(accessibleApp, 'StoragePicker');
assert.equal(byLabel(storage.type(storage.props), '보관 위치 냉장').props.accessibilityState.selected, true);
byLabel(storage.type(storage.props), '보관 위치 냉동').props.onPress();
storage = picker(accessibleApp, 'StoragePicker');
assert.equal(byLabel(storage.type(storage.props), '보관 위치 냉동').props.accessibilityState.selected, true);
assert.equal(byLabel(storage.type(storage.props), '보관 위치 냉장').props.accessibilityState.selected, false);
assert.equal(byLabel(accessibleApp.render(), '재고 추가').props.accessibilityRole, 'button');
byLabel(accessibleApp.render(), '재고 추가').props.onPress();
nodes(accessibleApp.render()).find((node) => node.type === 'ReceiptEntrySheet').props.onLeftoverAdd();
let kind = picker(accessibleApp, 'KindPicker');
assert.equal(button(kind.type(kind.props), '남은 음식').props.accessibilityState.selected, true);
button(kind.type(kind.props), '식재료').props.onPress();
kind = picker(accessibleApp, 'KindPicker');
assert.equal(button(kind.type(kind.props), '식재료').props.accessibilityState.selected, true);
byLabel(accessibleApp.render(), '권장 섭취일 오늘').props.onPress();
assert.equal(byLabel(accessibleApp.render(), '권장 섭취일 오늘').props.accessibilityState.selected, true);
assert.equal(byLabel(accessibleApp.render(), '권장 섭취일 내일').props.accessibilityState.selected, false);
console.log('✓ tab, filter, storage, kind and date selections expose updated states; add has a spoken label');

const errorApp = harness();
errorApp.render();
assert.ok(errorApp.calls.announcements.some((message) => message?.includes('저장 또는 동기화하지 못했어요')));
byLabel(errorApp.render(), '재고 추가').props.onPress();
errorApp.calls.announcements = [];
errorApp.render();
assert.ok(errorApp.calls.announcements.every((message) => message === null), 'Background status cannot interrupt an open sheet');
console.log('✓ visible sync errors request announcement; background errors stay silent during sheet use');
