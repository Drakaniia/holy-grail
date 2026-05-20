import { defineConfig, globalIgnores } from 'eslint/config'
import globals from 'globals'
import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import pluginOxlint from 'eslint-plugin-oxlint'
import skipFormatting from 'eslint-config-prettier/flat'
import tsPlugin from 'typescript-eslint'

export default defineConfig([
  {
    name: 'app/files-to-lint',
    files: ['**/*.{vue,js,mjs,jsx,cjs,ts,mts}'],
  },

  globalIgnores([
    '**/.vercel/**',
    '**/dist/**',
    '**/dist-ssr/**',
    '**/coverage/**',
    'supabase/functions/**',
    'parse*.js',
    'parse*.cjs',
  ]),

  {
    name: 'app/browser-globals',
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
  },

  {
    name: 'app/node-globals',
    files: ['*.config.js', '**/*.cjs', 'scripts/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },

  js.configs.recommended,

  ...tsPlugin.configs.recommended,

  ...pluginVue.configs['flat/essential'],

  {
    name: 'app/vue-ts',
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: {
        parser: tsPlugin.parser,
      },
    },
  },

  {
    name: 'app/vue-rules',
    files: ['**/*.vue'],
    rules: {
      'vue/multi-word-component-names': 'off',
    },
  },

  {
    name: 'app/disable-ts-empty',
    rules: {
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      'no-empty': 'off',
    },
  },

  ...pluginOxlint.buildFromOxlintConfigFile('.oxlintrc.json'),

  skipFormatting,
])
