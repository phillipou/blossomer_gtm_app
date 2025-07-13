// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";

import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'


export default tseslint.config([
  { ignores: ['dist'] },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // Prevent direct use of raw OpenAPI types in components
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '../types/generated-api',
              message: 'Import UI types from lib/mappers instead of raw API types. Use mappers for API boundary transformations.'
            },
            {
              name: './types/generated-api', 
              message: 'Import UI types from lib/mappers instead of raw API types. Use mappers for API boundary transformations.'
            },
            {
              name: '../../types/generated-api',
              message: 'Import UI types from lib/mappers instead of raw API types. Use mappers for API boundary transformations.'
            }
          ],
          patterns: [
            {
              group: ['**/types/generated-api*'],
              message: 'Import UI types from lib/mappers instead of raw API types. Use mappers for API boundary transformations.'
            }
          ]
        }
      ]
    }
  },
  // Allow mappers and service layer to import raw API types
  {
    files: ['**/lib/mappers/**/*.{ts,tsx}', '**/lib/*Service.ts'],
    rules: {
      'no-restricted-imports': 'off'
    }
  }
], storybook.configs["flat/recommended"]);
