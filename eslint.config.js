// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
    // TypeScript 6과 Expo 57의 import resolver 조합은 alias resolver를 초기화하지 못한다.
    // 실제 모듈 해석은 `tsc --noEmit`에서 계속 검증한다.
    rules: {
      "import/namespace": "off",
      "import/no-duplicates": "off",
      "import/no-unresolved": "off",
    },
  }
]);
