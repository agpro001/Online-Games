import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';
export default tseslint.config({ignores:['dist/**','node_modules/**','backups/**','public/**','app.js']},js.configs.recommended,...tseslint.configs.recommended,{files:['**/*.ts'],languageOptions:{globals:{...globals.browser,...globals.node}},rules:{'@typescript-eslint/no-explicit-any':'error'}});
