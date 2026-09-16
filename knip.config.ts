import type { KnipConfig } from 'knip';

const config: KnipConfig = {
  project: ['src/**/*.ts', 'tests/**/*.ts', 'create.ts'],
  ignoreDependencies: [],
};

export default config;
