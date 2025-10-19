/**
 * ASTParser Tests
 */

import { ASTParser } from '../ASTParser';

describe('ASTParser', () => {
  let parser: ASTParser;

  beforeEach(() => {
    parser = new ASTParser();
  });

  describe('findSymbolAtLine', () => {
    it('should find function symbol in TypeScript', async () => {
      const source = `
function calculateTotal(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}
      `.trim();

      const result = await parser.findSymbolAtLine('test.ts', source, 1);

      expect(result).toEqual({
        name: 'calculateTotal',
        type: 'function',
        line: 1
      });
    });

    it('should find class symbol', async () => {
      const source = `
export class UserService {
  constructor() {}
}
      `.trim();

      const result = await parser.findSymbolAtLine('test.ts', source, 1);

      expect(result).toEqual({
        name: 'UserService',
        type: 'class',
        line: 1
      });
    });

    it('should find symbol above target line', async () => {
      const source = `
function foo() {
  // TODO: implement
  console.log('test');
}
      `.trim();

      const result = await parser.findSymbolAtLine('test.ts', source, 3);

      expect(result).toEqual({
        name: 'foo',
        type: 'function',
        line: 1
      });
    });

    it('should return null if no symbol found', async () => {
      const source = 'const x = 1;';
      const result = await parser.findSymbolAtLine('test.ts', source, 10);

      expect(result).toBeNull();
    });
  });

  describe('getSourceContext', () => {
    it('should get context lines around target', async () => {
      const source = `
line 1
line 2
line 3
line 4
line 5
      `.trim();

      const context = await parser.getSourceContext(source, 3, 1);

      expect(context).toBe('line 2\nline 3\nline 4');
    });

    it('should handle edges correctly', async () => {
      const source = 'line 1\nline 2\nline 3';
      const context = await parser.getSourceContext(source, 1, 5);

      // Should not go below 0 or above length
      expect(context.split('\n').length).toBeLessThanOrEqual(3);
    });
  });
});
