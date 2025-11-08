import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'
import vue from 'eslint-plugin-vue'
import vueParser from 'vue-eslint-parser'

export default defineConfig([
  globalIgnores(['dist']),
  // Lint Vue SFC files with proper parser and rules
  {
    files: ['**/*.vue'],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        parser: tseslint.parser,
      },
      globals: globals.browser,
    },
    plugins: { vue },
    rules: {
      ...vue.configs['flat/recommended'].rules,
    },
  },
  // Lint TS files
  {
    files: ['**/*.ts'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },
])
