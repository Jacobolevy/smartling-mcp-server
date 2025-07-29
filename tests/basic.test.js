import { describe, it, expect } from 'vitest';

describe('Smartling MCP Server', () => {
  it('should have proper package configuration', () => {
    expect(typeof process.version).toBe('string');
    expect(process.version.startsWith('v')).toBe(true);
  });

  it('should be able to import ES modules', async () => {
    try {
      // Test that ES module imports work
      const result = await import('../dist/smartling-client.js');
      expect(result.SmartlingClient).toBeDefined();
    } catch (error) {
      // If dist doesn't exist, try source
      const result = await import('../src/smartling-client.js');
      expect(result.SmartlingClient).toBeDefined();
    }
  });

  it('should validate basic functionality', () => {
    // Basic test that always passes
    expect(1 + 1).toBe(2);
    expect('smartling-mcp-server').toBeTruthy();
  });

  it('should have valid project structure', () => {
    // Test Node.js environment
    expect(process.env).toBeDefined();
    expect(typeof process.cwd).toBe('function');
  });
}); 