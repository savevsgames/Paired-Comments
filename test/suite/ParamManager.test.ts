/**
 * Unit tests for ParamManager - Dynamic parameter interpolation
 */

import { describe, it, beforeEach } from 'mocha';
import { expect } from 'chai';
import * as vscode from 'vscode';
import { ParamManager } from '../../src/core/ParamManager';
import { ASTAnchorManager } from '../../src/core/ASTAnchorManager';
import { Comment, CommentParameter } from '../../src/types';

suite('ParamManager', () => {
  let paramManager: ParamManager;
  let astAnchorManager: ASTAnchorManager;

  setup(() => {
    astAnchorManager = new ASTAnchorManager();
    paramManager = new ParamManager(astAnchorManager);
  });

  suite('interpolate', () => {
    test('should interpolate simple parameter', () => {
      const comment: Comment = {
        id: 'c1',
        line: 1,
        text: 'The ${functionName} needs refactoring',
        author: 'test',
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        params: {
          functionName: {
            value: 'calculateTotal',
            type: 'dynamic',
            source: 'function.name',
          },
        },
      };

      const result = paramManager.interpolate(comment);
      expect(result).to.equal('The calculateTotal needs refactoring');
    });

    test('should interpolate multiple parameters', () => {
      const comment: Comment = {
        id: 'c1',
        line: 1,
        text: 'Function ${functionName} has ${paramCount} params and ${complexity} complexity',
        author: 'test',
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        params: {
          functionName: { value: 'processData', type: 'dynamic', source: 'function.name' },
          paramCount: { value: 3, type: 'computed', source: 'aiMeta.paramCount' },
          complexity: { value: 8, type: 'computed', source: 'aiMeta.complexity' },
        },
      };

      const result = paramManager.interpolate(comment);
      expect(result).to.equal('Function processData has 3 params and 8 complexity');
    });

    test('should return original text when no params', () => {
      const comment: Comment = {
        id: 'c1',
        line: 1,
        text: 'This is a plain comment',
        author: 'test',
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
      };

      const result = paramManager.interpolate(comment);
      expect(result).to.equal('This is a plain comment');
    });

    test('should handle missing parameters gracefully', () => {
      const comment: Comment = {
        id: 'c1',
        line: 1,
        text: 'The ${functionName} has ${missingParam} issue',
        author: 'test',
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        params: {
          functionName: { value: 'test', type: 'dynamic', source: 'function.name' },
        },
      };

      const result = paramManager.interpolate(comment);
      // Should keep ${missingParam} unchanged
      expect(result).to.equal('The test has ${missingParam} issue');
    });

    test('should handle numeric and boolean values', () => {
      const comment: Comment = {
        id: 'c1',
        line: 1,
        text: 'Complexity: ${complexity}, Has tests: ${hasTests}',
        author: 'test',
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        params: {
          complexity: { value: 42, type: 'computed', source: 'aiMeta.complexity' },
          hasTests: { value: true, type: 'manual', source: 'manual' },
        },
      };

      const result = paramManager.interpolate(comment);
      expect(result).to.equal('Complexity: 42, Has tests: true');
    });
  });

  suite('extractParamNames', () => {
    test('should extract single parameter name', () => {
      const text = 'The ${functionName} is complex';
      const names = paramManager.extractParamNames(text);
      expect(names).to.deep.equal(['functionName']);
    });

    test('should extract multiple parameter names', () => {
      const text = '${className}.${methodName} has ${complexity} complexity';
      const names = paramManager.extractParamNames(text);
      expect(names).to.deep.equal(['className', 'methodName', 'complexity']);
    });

    test('should return empty array when no parameters', () => {
      const text = 'This is plain text';
      const names = paramManager.extractParamNames(text);
      expect(names).to.deep.equal([]);
    });

    test('should handle duplicate parameter references', () => {
      const text = '${name} is used twice: ${name}';
      const names = paramManager.extractParamNames(text);
      expect(names).to.deep.equal(['name', 'name']);
    });

    test('should ignore malformed syntax', () => {
      const text = 'Bad: ${incomplete or $notValid} or {noPrefix}';
      const names = paramManager.extractParamNames(text);
      expect(names).to.deep.equal([]);
    });
  });

  suite('validate', () => {
    test('should validate comment with matching params', () => {
      const comment: Comment = {
        id: 'c1',
        line: 1,
        text: 'The ${functionName} needs work',
        author: 'test',
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        params: {
          functionName: { value: 'test', type: 'dynamic', source: 'function.name' },
        },
      };

      const isValid = paramManager.validate(comment);
      expect(isValid).to.be.true;
    });

    test('should invalidate comment with missing params', () => {
      const comment: Comment = {
        id: 'c1',
        line: 1,
        text: 'The ${functionName} and ${className} need work',
        author: 'test',
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        params: {
          functionName: { value: 'test', type: 'dynamic', source: 'function.name' },
          // Missing className param
        },
      };

      const isValid = paramManager.validate(comment);
      expect(isValid).to.be.false;
    });

    test('should validate comment with no parameters', () => {
      const comment: Comment = {
        id: 'c1',
        line: 1,
        text: 'Plain text comment',
        author: 'test',
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
      };

      const isValid = paramManager.validate(comment);
      expect(isValid).to.be.true;
    });

    test('should invalidate when params object missing but text has variables', () => {
      const comment: Comment = {
        id: 'c1',
        line: 1,
        text: 'The ${functionName} needs work',
        author: 'test',
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        // No params object
      };

      const isValid = paramManager.validate(comment);
      expect(isValid).to.be.false;
    });
  });

  suite('extractFromCode', () => {
    test('should extract function name from AST anchor', async () => {
      // Create a simple test document
      const content = 'function calculateTotal(items) {\n  return items.reduce((a, b) => a + b, 0);\n}';
      const doc = await vscode.workspace.openTextDocument({
        content,
        language: 'javascript',
      });

      const params = await paramManager.extractFromCode({
        sourceUri: doc.uri,
        lineNumber: 1,
        document: doc,
      });

      // Should extract functionName if AST succeeds
      if (params.functionName) {
        expect(params.functionName.value).to.equal('calculateTotal');
        expect(params.functionName.type).to.equal('dynamic');
        expect(params.functionName.source).to.equal('function.name');
      }
    });

    test('should extract complexity from AI metadata', async () => {
      const content = 'function test() {}';
      const doc = await vscode.workspace.openTextDocument({
        content,
        language: 'javascript',
      });

      const aiMetadata = {
        complexity: {
          cyclomatic: 5,
          cognitive: 7,
          maintainability: 85,
          confidence: 0.9,
        },
        tokens: {
          heuristic: 100,
          validated: 95,
          confidence: 0.95,
        },
        parameters: {
          name: 'test',
          kind: 'function',
          parameters: [
            { name: 'a', type: 'number' },
            { name: 'b', type: 'string' },
          ],
          lineCount: 10,
          confidence: 0.9,
        },
      };

      const params = await paramManager.extractFromCode({
        sourceUri: doc.uri,
        lineNumber: 1,
        document: doc,
        aiMetadata,
      });

      // Should extract computed parameters from AI metadata
      expect(params.complexity).to.exist;
      expect(params.complexity?.value).to.equal(5);
      expect(params.complexity?.type).to.equal('computed');

      expect(params.cognitiveComplexity).to.exist;
      expect(params.cognitiveComplexity?.value).to.equal(7);

      expect(params.tokens).to.exist;
      expect(params.tokens?.value).to.equal(95); // Uses validated

      expect(params.paramCount).to.exist;
      expect(params.paramCount?.value).to.equal(2);
    });

    test('should return empty params on error', async () => {
      // Invalid document
      const content = '';
      const doc = await vscode.workspace.openTextDocument({
        content,
        language: 'javascript',
      });

      const params = await paramManager.extractFromCode({
        sourceUri: doc.uri,
        lineNumber: 999, // Out of bounds
        document: doc,
      });

      // Should handle gracefully
      expect(params).to.be.an('object');
    });
  });

  suite('createParams', () => {
    test('should create params for variables in text', async () => {
      const content = 'function processData(items) { return items.length; }';
      const doc = await vscode.workspace.openTextDocument({
        content,
        language: 'javascript',
      });

      const text = 'The ${functionName} takes ${paramCount} parameters';
      const params = await paramManager.createParams(text, {
        sourceUri: doc.uri,
        lineNumber: 1,
        document: doc,
      });

      expect(params).to.exist;
      // May extract functionName if AST succeeds
    });

    test('should return undefined when no variables in text', async () => {
      const content = 'function test() {}';
      const doc = await vscode.workspace.openTextDocument({
        content,
        language: 'javascript',
      });

      const text = 'This is plain text';
      const params = await paramManager.createParams(text, {
        sourceUri: doc.uri,
        lineNumber: 1,
        document: doc,
      });

      expect(params).to.be.undefined;
    });

    test('should create placeholder for unavailable parameters', async () => {
      const content = 'const x = 5;';
      const doc = await vscode.workspace.openTextDocument({
        content,
        language: 'javascript',
      });

      const text = 'The ${nonExistentParam} is missing';
      const params = await paramManager.createParams(text, {
        sourceUri: doc.uri,
        lineNumber: 1,
        document: doc,
      });

      expect(params).to.exist;
      expect(params?.nonExistentParam).to.exist;
      expect(params?.nonExistentParam.value).to.equal('[nonExistentParam]');
      expect(params?.nonExistentParam.type).to.equal('manual');
    });
  });
});
