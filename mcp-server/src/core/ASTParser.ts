/**
 * AST Parser
 * Simple symbol resolution for anchoring comments
 * Note: For v0.1.0, using basic regex-based parsing
 * Future: Use proper parsers (typescript, @babel/parser, tree-sitter)
 */

import { AnchorType } from '../types/comments.js';

export interface SymbolAnchor {
  name: string;
  type: AnchorType;
  line: number;
}

export class ASTParser {
  /**
   * Find symbol at specific line in source code
   * Uses simple regex patterns for common languages
   */
  async findSymbolAtLine(filePath: string, source: string, line: number): Promise<SymbolAnchor | null> {
    const lines = source.split('\n');
    if (line < 1 || line > lines.length) {
      return null;
    }

    const language = this.detectLanguage(filePath);

    // Try to find symbol on target line or nearby lines
    for (let offset = 0; offset <= 5; offset++) {
      const checkLine = line - 1 - offset;
      if (checkLine < 0) break;

      const symbol = this.parseSymbol(lines[checkLine], language);
      if (symbol) {
        return {
          ...symbol,
          line: checkLine + 1
        };
      }
    }

    return null;
  }

  /**
   * Detect programming language from file extension
   */
  private detectLanguage(filePath: string): string {
    const ext = filePath.split('.').pop()?.toLowerCase() || '';
    const languageMap: Record<string, string> = {
      'ts': 'typescript',
      'tsx': 'typescript',
      'js': 'javascript',
      'jsx': 'javascript',
      'py': 'python',
      'go': 'go',
      'rs': 'rust',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
      'cs': 'csharp',
      'rb': 'ruby',
      'php': 'php',
    };
    return languageMap[ext] || 'unknown';
  }

  /**
   * Parse symbol from line using regex patterns
   */
  private parseSymbol(line: string, _language: string): Omit<SymbolAnchor, 'line'> | null {
    const trimmed = line.trim();

    // Function patterns
    const functionPatterns = [
      // TypeScript/JavaScript: function foo(), const foo = (), async function foo()
      /(?:export\s+)?(?:async\s+)?function\s+(\w+)/,
      /(?:export\s+)?const\s+(\w+)\s*=\s*(?:async\s+)?\(/,
      /(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?\(/,

      // Python: def foo():
      /def\s+(\w+)\s*\(/,

      // Go: func foo()
      /func\s+(?:\([^)]*\)\s+)?(\w+)\s*\(/,

      // Java/C#: public void foo()
      /(?:public|private|protected)?\s*(?:static\s+)?(?:async\s+)?(?:\w+\s+)+(\w+)\s*\(/,
    ];

    for (const pattern of functionPatterns) {
      const match = trimmed.match(pattern);
      if (match) {
        return { name: match[1], type: 'function' };
      }
    }

    // Class patterns
    const classPatterns = [
      // TypeScript/JavaScript: class Foo, export class Foo
      /(?:export\s+)?(?:abstract\s+)?class\s+(\w+)/,

      // Python: class Foo:
      /class\s+(\w+)\s*(?:\(|:)/,

      // Go: type Foo struct
      /type\s+(\w+)\s+struct/,

      // Java/C#: public class Foo
      /(?:public|private|protected)?\s*(?:abstract\s+)?class\s+(\w+)/,
    ];

    for (const pattern of classPatterns) {
      const match = trimmed.match(pattern);
      if (match) {
        return { name: match[1], type: 'class' };
      }
    }

    // Interface/Type patterns
    const typePatterns = [
      // TypeScript: interface Foo, type Foo =
      /(?:export\s+)?interface\s+(\w+)/,
      /(?:export\s+)?type\s+(\w+)\s*=/,

      // Go: type Foo interface
      /type\s+(\w+)\s+interface/,
    ];

    for (const pattern of typePatterns) {
      const match = trimmed.match(pattern);
      if (match) {
        return { name: match[1], type: 'interface' };
      }
    }

    // Variable patterns
    const variablePatterns = [
      // TypeScript/JavaScript: const foo =, let foo =, var foo =
      /(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=/,

      // Python: foo = (module level)
      /^(\w+)\s*=/,

      // Go: var foo
      /var\s+(\w+)\s+/,
    ];

    for (const pattern of variablePatterns) {
      const match = trimmed.match(pattern);
      if (match) {
        return { name: match[1], type: 'variable' };
      }
    }

    // Import patterns
    const importPatterns = [
      // TypeScript/JavaScript: import ... from 'foo'
      /import.*from\s+['"]([^'"]+)['"]/,

      // Python: import foo, from foo import
      /(?:from\s+(\w+)\s+)?import\s+(\w+)/,

      // Go: import "foo"
      /import\s+"([^"]+)"/,
    ];

    for (const pattern of importPatterns) {
      const match = trimmed.match(pattern);
      if (match) {
        return { name: match[1] || match[2], type: 'import' };
      }
    }

    return null;
  }

  /**
   * Get context lines around a specific line
   */
  async getSourceContext(
    source: string,
    line: number,
    contextLines: number = 3
  ): Promise<string> {
    const lines = source.split('\n');
    const start = Math.max(0, line - 1 - contextLines);
    const end = Math.min(lines.length, line + contextLines);

    return lines.slice(start, end).join('\n');
  }
}
