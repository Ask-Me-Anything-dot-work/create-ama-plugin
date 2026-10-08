import type { KnipConfig } from 'knip';

const config: KnipConfig = {
  project: ['src/**/*.ts', 'tests/**/*.ts'],
  // Scaffold seed file: Zod env-validation example. Deliberately not imported
  // (it runs process.exit on invalid env), so knip would flag it as unused.
  ignore: ['src/config/env.ts'],
  ignoreDependencies: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/github',
    '@semantic-release/npm',
    '@semantic-release/release-notes-generator',
    'conventional-changelog-conventionalcommits',
  ],
};

export default config;
