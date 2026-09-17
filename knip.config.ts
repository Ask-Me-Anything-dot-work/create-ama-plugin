import type { KnipConfig } from 'knip';

const config: KnipConfig = {
  project: ['src/**/*.ts', 'tests/**/*.ts'],
  ignoreDependencies: [
    '@eslint/eslintrc',
    '@semantic-release/commit-analyzer',
    '@semantic-release/github',
    '@semantic-release/npm',
    '@semantic-release/release-notes-generator',
    'conventional-changelog-conventionalcommits',
  ],
};

export default config;
