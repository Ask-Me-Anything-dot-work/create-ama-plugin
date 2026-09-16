import { expect, test, describe } from 'bun:test';
import { validateConfig, interpolateTemplate } from '../../src/scaffold/config';

describe('scaffoldConfigSchema', () => {
  test('accepts valid kebab-case plugin ID', () => {
    const config = validateConfig({
      pluginId: 'my-plugin',
      provides: 'generic',
      consolePanel: false,
      migrations: false,
    });
    expect(config.pluginId).toBe('my-plugin');
    expect(config.provides).toBe('generic');
    expect(config.consolePanel).toBe(false);
    expect(config.migrations).toBe(false);
  });

  test('rejects empty plugin ID', () => {
    expect(() => validateConfig({ pluginId: '' })).toThrow();
  });

  test('rejects non-kebab-case plugin ID', () => {
    expect(() => validateConfig({ pluginId: 'MyPlugin' })).toThrow();
    expect(() => validateConfig({ pluginId: 'my_plugin' })).toThrow();
    expect(() => validateConfig({ pluginId: 'my plugin' })).toThrow();
  });

  test('accepts plugin ID with numbers', () => {
    const config = validateConfig({ pluginId: 'plugin-v2-test' });
    expect(config.pluginId).toBe('plugin-v2-test');
  });

  test('defaults provides to generic', () => {
    const config = validateConfig({ pluginId: 'test' });
    expect(config.provides).toBe('generic');
  });

  test('defaults consolePanel and migrations to false', () => {
    const config = validateConfig({ pluginId: 'test' });
    expect(config.consolePanel).toBe(false);
    expect(config.migrations).toBe(false);
  });
});

describe('interpolateTemplate', () => {
  test('replaces PLUGIN_ID placeholder', () => {
    const result = interpolateTemplate(
      '{"name": "{{PLUGIN_ID}}"}',
      { pluginId: 'cool-plugin', provides: 'generic', consolePanel: false, migrations: false },
    );
    expect(result).toBe('{"name": "cool-plugin"}');
  });

  test('replaces PROVIDES_TYPE placeholder', () => {
    const result = interpolateTemplate(
      'provides: {{PROVIDES_TYPE}}',
      { pluginId: 'test', provides: 'workflow', consolePanel: false, migrations: false },
    );
    expect(result).toBe('provides: workflow');
  });

  test('replaces both placeholders', () => {
    const result = interpolateTemplate(
      '{{PLUGIN_ID}} provides {{PROVIDES_TYPE}}',
      { pluginId: 'my-plug', provides: 'hook', consolePanel: false, migrations: false },
    );
    expect(result).toBe('my-plug provides hook');
  });

  test('leaves unrelated content unchanged', () => {
    const input = 'no placeholders here';
    const result = interpolateTemplate(
      input,
      { pluginId: 'x', provides: 'y', consolePanel: false, migrations: false },
    );
    expect(result).toBe(input);
  });
});
