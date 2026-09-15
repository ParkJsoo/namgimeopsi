import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import ts from 'typescript';

const directory = dirname(fileURLToPath(import.meta.url));
const deferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};

// Execute the real component and local receipt modules. Only the host UI/hooks
// and network boundary are substituted; no device or remote data is touched.
function harness(services, confirm = async () => 'confirmed') {
  const slots = [];
  let cursor = 0;
  let effects = [];
  const announcements = [];
  const react = {
    useState(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = typeof initial === 'function' ? initial() : initial;
      return [slots[index], (next) => { slots[index] = typeof next === 'function' ? next(slots[index]) : next; }];
    },
    useRef(initial) {
      const index = cursor++;
      return slots[index] ??= { current: initial };
    },
    useEffect(effect, dependencies) {
      const index = cursor++;
      const previous = slots[index];
      if (!previous || dependencies.some((value, i) => value !== previous.dependencies[i])) {
        effects.push(() => {
          previous?.cleanup?.();
          slots[index] = { dependencies, cleanup: effect() };
        });
      }
    },
  };
  const element = (type, props) => ({ type, props });
  const mocks = {
    react,
    '@/hooks/use-accessibility-announcement': { useAccessibilityAnnouncement: (message) => react.useEffect(() => { if (message) announcements.push(message); }, [message]) },
    'react/jsx-runtime': { jsx: element, jsxs: element, Fragment: 'Fragment' },
    'react-native': Object.assign(Object.fromEntries(['Modal', 'Pressable', 'Text', 'TextInput', 'View'].map((name) => [name, name])), { StyleSheet: { create: (styles) => styles } }),
    '@/components/KeyboardSheet': { KeyboardSheet: 'KeyboardSheet' },
    './scan-storage': services,
  };
  const modules = new Map();
  function load(path) {
    if (modules.has(path)) return modules.get(path).exports;
    const module = { exports: {} };
    modules.set(path, module);
    const output = ts.transpileModule(readFileSync(path, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
      fileName: path,
    }).outputText;
    const requireLocal = (name) => {
      if (name in mocks) return mocks[name];
      assert.ok(name.startsWith('.'), `Unexpected dependency: ${name}`);
      return load(resolve(dirname(path), name.endsWith('.ts') ? name : `${name}.ts`));
    };
    vm.runInThisContext(`(function(require, module, exports) {${output}\n})`, { filename: path })(requireLocal, module, module.exports);
    return module.exports;
  }
  const { ReceiptEntrySheet } = load(resolve(directory, 'ReceiptEntrySheet.tsx'));
  let closed = 0;
  let confirmed = 0;
  return {
    announcements,
    get closed() { return closed; },
    get confirmed() { return confirmed; },
    render(visible = true) {
      cursor = 0;
      effects = [];
      const tree = ReceiptEntrySheet({ visible, onClose: () => { closed++; }, onConfirm: async (draft) => { confirmed++; return confirm(draft); } });
      effects.forEach((effect) => effect());
      return tree;
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
  if (typeof tree === 'string' || typeof tree === 'number') return String(tree);
  return tree && typeof tree === 'object' ? text(tree.props?.children) : '';
}
function press(tree, label) {
  const button = nodes(tree).find((node) => node.type === 'Pressable' && text(node) === label);
  assert.ok(button, `Missing visible button: ${label}`);
  return button.props.onPress();
}

for (const phase of ['upload', 'analysis']) {
  for (const outcome of ['resolve', 'reject']) {
    const pending = deferred();
    let analyzed = 0;
    const app = harness({
      pickReceiptImage: async () => ({ uri: 'test://receipt', fileName: 'receipt.png' }),
      uploadReceiptImage: () => phase === 'upload' ? pending.promise : Promise.resolve({ id: 'test-scan' }),
      analyzeReceiptImage: () => { analyzed++; return pending.promise; },
    });
    const work = press(app.render(), '영수증으로 등록');
    // Allow the selected image and (for analysis) the completed upload to settle.
    await Promise.resolve();
    await Promise.resolve();
    const progress = app.render();
    assert.ok(text(progress).includes(phase === 'upload' ? '영수증 원본을 안전하게 저장하고 있어요' : '장 본 것을 정리하고 있어요'));
    press(progress, '닫기');
    assert.equal(app.closed, 1);
    app.render(false);
    assert.ok(text(app.render()).includes('빠르게 추가할까요?'));
    if (outcome === 'resolve') pending.resolve({ id: 'test-scan', status: 'ready', analysisSource: 'fixture' });
    else pending.reject(new Error('late network failure'));
    await work;
    const reopened = app.render();
    assert.ok(text(reopened).includes('빠르게 추가할까요?'));
    assert.ok(!text(reopened).includes('장 본 것 확인'));
    assert.ok(!text(reopened).includes('인터넷 연결을 확인'));
    assert.equal(app.confirmed, 0, 'Closing progress must never invoke inventory confirmation');
    assert.equal(analyzed, phase === 'upload' ? 0 : 1, 'A cancelled upload must not start analysis');
    console.log(`✓ ${phase} close ignores late ${outcome} without confirming inventory`);
  }
}


for (const outcome of ['confirmed', 'failed', 'throw']) {
  const pending = deferred();
  let submitted;
  const app = harness({
    pickReceiptImage: async () => ({ fileName: 'receipt.png' }),
    uploadReceiptImage: async () => ({ id: 'test-scan' }),
    analyzeReceiptImage: async () => ({ id: 'test-scan', status: 'ready' }),
  }, (draft) => { submitted = structuredClone(draft); return pending.promise; });
  await press(app.render(), '영수증으로 등록');
  const before = app.render();
  const confirm = nodes(before).find((node) => node.type === 'Pressable' && text(node).includes('개 냉장고에 담기'));
  const work = confirm.props.onPress();
  // Stale handlers from before the saving render must also be inert.
  void confirm.props.onPress();
  nodes(before).find((node) => node.type === 'TextInput').props.onChangeText('늦은 이름');
  press(before, '제외');
  const saving = app.render();
  assert.equal(app.confirmed, 1);
  for (const field of nodes(saving).filter((node) => node.type === 'TextInput')) assert.equal(field.props.editable, false);
  const exclude = nodes(saving).find((node) => node.type === 'Pressable' && text(node) === '제외');
  assert.equal(exclude.props.disabled, true);
  const picker = nodes(saving).find((node) => typeof node.type === 'function' && node.type.name === 'StoragePicker');
  assert.equal(picker.props.disabled, true);
  picker.props.onChange('냉동');
  saving.props.onRequestClose();
  assert.equal(app.closed, 0);
  assert.ok(text(app.render()).includes('샘플 품목 6개'));
  if (outcome === 'throw') pending.reject(new Error('storage unavailable'));
  else pending.resolve(outcome);
  await work;
  const result = app.render();
  assert.equal(submitted.items.filter((item) => item.included).length, 6);
  if (outcome === 'confirmed') {
    assert.ok(text(result).includes('6개를 냉장고에 담았어요.'));
    assert.ok(app.announcements.includes('6개를 냉장고에 담았어요.'));
    assert.equal(nodes(result).find((node) => text(node) === '6개를 냉장고에 담았어요.').props.accessibilityLiveRegion, 'polite');
  } else {
    assert.ok(text(result).includes('저장하지 못했어요'));
    assert.ok(app.announcements.some((message) => message.includes('저장하지 못했어요')));
    const field = nodes(result).find((node) => node.type === 'TextInput');
    assert.equal(field.props.editable, true);
    assert.equal(field.props.value, submitted.items[0].name);
    field.props.onChangeText('다시 수정');
    assert.equal(nodes(app.render()).find((node) => node.type === 'TextInput').props.value, '다시 수정');
  }
  console.log(`✓ pending receipt locks edits and duplicate submits, then handles ${outcome}`);
}


const reviewApp = harness({
  pickReceiptImage: async () => ({ fileName: 'receipt.png' }),
  uploadReceiptImage: async () => ({ id: 'test-scan' }),
  analyzeReceiptImage: async () => ({ id: 'test-scan', status: 'ready' }),
});
await press(reviewApp.render(), '영수증으로 등록');
let review = reviewApp.render();
const exclusion = nodes(review).find((node) => node.type === 'Pressable' && text(node) === '제외');
assert.ok(exclusion.props.accessibilityLabel.includes('계란'));
exclusion.props.onPress();
review = reviewApp.render();
assert.ok(nodes(review).some((node) => node.props?.accessibilityLabel === '계란 다시 포함'));
let storage = nodes(review).find((node) => node.type.name === 'StoragePicker');
const options = nodes(storage.type(storage.props)).filter((node) => node.type === 'Pressable');
assert.equal(options.filter((node) => node.props.accessibilityState.selected).length, 1);
assert.ok(options.every((node) => node.props.accessibilityLabel.includes('보관 위치')));
options[1].props.onPress();
storage = nodes(reviewApp.render()).find((node) => node.type.name === 'StoragePicker');
assert.equal(nodes(storage.type(storage.props)).find((node) => node.type === 'Pressable' && text(node) === '냉동').props.accessibilityState.selected, true);
const announced = reviewApp.announcements.length;
reviewApp.render(false);
assert.equal(reviewApp.announcements.length, announced, 'Hidden receipt notices must not announce');
console.log('✓ receipt exclusion identifies its item and storage exposes selection; hidden notices stay silent');
