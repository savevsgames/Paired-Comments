/**
 * Unit tests for Range Comments functionality (v2.0.6+)
 */

import { expect } from 'chai';
import { GhostMarker, Comment, isRangeMarker, getRangeGutterCode, getSingleGutterCode } from '../../src/types';

suite('Range Comments', () => {
  suite('isRangeMarker', () => {
    test('should identify range markers', () => {
      const rangeMarker: GhostMarker = {
        id: 'm1',
        line: 10,
        endLine: 15,
        commentIds: ['c1'],
        lineHash: 'abc123',
        lineText: 'function test() {',
        prevLineText: '',
        nextLineText: '  const x = 5;',
        lastVerified: new Date().toISOString(),
      };

      expect(isRangeMarker(rangeMarker)).to.be.true;
    });

    test('should identify single-line markers', () => {
      const singleMarker: GhostMarker = {
        id: 'm1',
        line: 10,
        commentIds: ['c1'],
        lineHash: 'abc123',
        lineText: 'const x = 5;',
        prevLineText: '',
        nextLineText: '',
        lastVerified: new Date().toISOString(),
      };

      expect(isRangeMarker(singleMarker)).to.be.false;
    });

    test('should handle undefined endLine', () => {
      const marker: GhostMarker = {
        id: 'm1',
        line: 10,
        endLine: undefined,
        commentIds: ['c1'],
        lineHash: 'abc123',
        lineText: 'const x = 5;',
        prevLineText: '',
        nextLineText: '',
        lastVerified: new Date().toISOString(),
      };

      expect(isRangeMarker(marker)).to.be.false;
    });
  });

  suite('getRangeGutterCode', () => {
    test('should return start code for range start', () => {
      const code = getRangeGutterCode('TODO', 'start');
      expect(code).to.equal('TS');
    });

    test('should return end code for range end', () => {
      const code = getRangeGutterCode('TODO', 'end');
      expect(code).to.equal('TE');
    });

    test('should handle NOTE tag', () => {
      expect(getRangeGutterCode('NOTE', 'start')).to.equal('NS');
      expect(getRangeGutterCode('NOTE', 'end')).to.equal('NE');
    });

    test('should handle FIXME tag', () => {
      expect(getRangeGutterCode('FIXME', 'start')).to.equal('FS');
      expect(getRangeGutterCode('FIXME', 'end')).to.equal('FE');
    });

    test('should handle QUESTION tag', () => {
      expect(getRangeGutterCode('QUESTION', 'start')).to.equal('QS');
      expect(getRangeGutterCode('QUESTION', 'end')).to.equal('QE');
    });

    test('should handle HACK tag', () => {
      expect(getRangeGutterCode('HACK', 'start')).to.equal('HS');
      expect(getRangeGutterCode('HACK', 'end')).to.equal('HE');
    });

    test('should handle WARNING tag', () => {
      expect(getRangeGutterCode('WARNING', 'start')).to.equal('WS');
      expect(getRangeGutterCode('WARNING', 'end')).to.equal('WE');
    });

    test('should handle STAR tag', () => {
      expect(getRangeGutterCode('STAR', 'start')).to.equal('SS');
      expect(getRangeGutterCode('STAR', 'end')).to.equal('SE');
    });

    test('should handle null tag', () => {
      expect(getRangeGutterCode(null, 'start')).to.equal('CS');
      expect(getRangeGutterCode(null, 'end')).to.equal('CE');
    });

    test('should handle undefined tag', () => {
      expect(getRangeGutterCode(undefined, 'start')).to.equal('CS');
      expect(getRangeGutterCode(undefined, 'end')).to.equal('CE');
    });
  });

  suite('getSingleGutterCode', () => {
    test('should return single-letter code for TODO', () => {
      expect(getSingleGutterCode('TODO')).to.equal('T');
    });

    test('should return single-letter code for NOTE', () => {
      expect(getSingleGutterCode('NOTE')).to.equal('N');
    });

    test('should return single-letter code for FIXME', () => {
      expect(getSingleGutterCode('FIXME')).to.equal('F');
    });

    test('should return single-letter code for QUESTION', () => {
      expect(getSingleGutterCode('QUESTION')).to.equal('Q');
    });

    test('should return single-letter code for HACK', () => {
      expect(getSingleGutterCode('HACK')).to.equal('H');
    });

    test('should return single-letter code for WARNING', () => {
      expect(getSingleGutterCode('WARNING')).to.equal('W');
    });

    test('should return single-letter code for STAR', () => {
      expect(getSingleGutterCode('STAR')).to.equal('S');
    });

    test('should return C for null tag', () => {
      expect(getSingleGutterCode(null)).to.equal('C');
    });

    test('should return C for undefined tag', () => {
      expect(getSingleGutterCode(undefined)).to.equal('C');
    });
  });

  suite('Range Comment Schema', () => {
    test('should create valid range comment', () => {
      const comment: Comment = {
        id: 'c1',
        line: 10,
        startLine: 10,
        endLine: 20,
        text: 'This is a range comment',
        author: 'test',
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        tag: 'TODO',
      };

      expect(comment.startLine).to.equal(10);
      expect(comment.endLine).to.equal(20);
      expect(comment.line).to.equal(10); // Backward compat
    });

    test('should create valid single-line comment', () => {
      const comment: Comment = {
        id: 'c1',
        line: 10,
        text: 'This is a single-line comment',
        author: 'test',
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        tag: 'NOTE',
      };

      expect(comment.startLine).to.be.undefined;
      expect(comment.endLine).to.be.undefined;
    });

    test('should validate range spans multiple lines', () => {
      const comment: Comment = {
        id: 'c1',
        line: 10,
        startLine: 10,
        endLine: 10, // Same line - technically not a range
        text: 'This is not really a range',
        author: 'test',
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
      };

      // Schema allows this, but UI should handle it as single-line
      expect(comment.startLine).to.equal(comment.endLine);
    });

    test('should handle range with AI metadata', () => {
      const comment: Comment = {
        id: 'c1',
        line: 10,
        startLine: 10,
        endLine: 30,
        text: 'Complex function with ${complexity} complexity',
        author: 'test',
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        tag: 'TODO',
        params: {
          complexity: {
            value: 15,
            type: 'computed',
            source: 'aiMeta.complexity',
          },
        },
        aiMetadata: {
          complexity: {
            cyclomatic: 15,
            cognitive: 20,
            maintainability: 60,
            confidence: 0.9,
          },
          tokens: {
            heuristic: 200,
            validated: 195,
            confidence: 0.95,
          },
        },
      };

      expect(comment.endLine).to.equal(30);
      expect(comment.aiMetadata).to.exist;
      expect(comment.params).to.exist;
    });
  });

  suite('Range Marker Schema', () => {
    test('should create valid range marker', () => {
      const marker: GhostMarker = {
        id: 'm1',
        line: 10,
        endLine: 20,
        commentIds: ['c1'],
        lineHash: 'abc123',
        lineText: 'function processData() {',
        prevLineText: '',
        nextLineText: '  const result = [];',
        lastVerified: new Date().toISOString(),
      };

      expect(marker.line).to.equal(10);
      expect(marker.endLine).to.equal(20);
    });

    test('should support multiple comments on range', () => {
      const marker: GhostMarker = {
        id: 'm1',
        line: 10,
        endLine: 20,
        commentIds: ['c1', 'c2', 'c3'],
        lineHash: 'abc123',
        lineText: 'function test() {',
        prevLineText: '',
        nextLineText: '',
        lastVerified: new Date().toISOString(),
      };

      expect(marker.commentIds).to.have.lengthOf(3);
    });

    test('should include AST anchor for range markers', () => {
      const marker: GhostMarker = {
        id: 'm1',
        line: 10,
        endLine: 20,
        commentIds: ['c1'],
        lineHash: 'abc123',
        lineText: 'function processData() {',
        prevLineText: '',
        nextLineText: '',
        lastVerified: new Date().toISOString(),
        astAnchor: {
          symbolPath: ['processData'],
          symbolKind: '6', // SymbolKind.Function (stored as string)
          containerName: null,
          offset: 0,
        },
      };

      expect(marker.astAnchor).to.exist;
      expect(marker.astAnchor?.symbolPath).to.deep.equal(['processData']);
    });
  });

  suite('Edge Cases', () => {
    test('should handle range where endLine < startLine', () => {
      // Invalid range (should be prevented by UI, but schema allows it)
      const comment: Comment = {
        id: 'c1',
        line: 20,
        startLine: 20,
        endLine: 10, // Invalid: end before start
        text: 'This is invalid',
        author: 'test',
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
      };

      // Schema doesn't validate this - application logic should
      expect(comment.startLine).to.be.greaterThan(comment.endLine!);
    });

    test('should handle very large ranges', () => {
      const comment: Comment = {
        id: 'c1',
        line: 1,
        startLine: 1,
        endLine: 1000, // Very large range
        text: 'This entire file needs refactoring',
        author: 'test',
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
      };

      const rangeSize = comment.endLine! - comment.startLine! + 1;
      expect(rangeSize).to.equal(1000);
    });

    test('should handle range with dynamic parameters', () => {
      const comment: Comment = {
        id: 'c1',
        line: 10,
        startLine: 10,
        endLine: 50,
        text: 'Range spans ${lineCount} lines with ${tokens} tokens',
        author: 'test',
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        params: {
          lineCount: {
            value: 41,
            type: 'computed',
            source: 'aiMeta.paramCount',
          },
          tokens: {
            value: 500,
            type: 'computed',
            source: 'aiMeta.tokens',
          },
        },
      };

      expect(comment.params?.['lineCount']?.value).to.equal(41);
      expect(comment.params?.['tokens']?.value).to.equal(500);
    });
  });

  suite('Backward Compatibility', () => {
    test('should handle legacy comments without range fields', () => {
      const legacyComment: Comment = {
        id: 'c1',
        line: 10,
        text: 'Legacy comment',
        author: 'test',
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
      };

      // No startLine or endLine - should be treated as single-line
      expect(legacyComment.startLine).to.be.undefined;
      expect(legacyComment.endLine).to.be.undefined;
    });

    test('should handle legacy markers without endLine', () => {
      const legacyMarker: GhostMarker = {
        id: 'm1',
        line: 10,
        commentIds: ['c1'],
        lineHash: 'abc123',
        lineText: 'const x = 5;',
        prevLineText: '',
        nextLineText: '',
        lastVerified: new Date().toISOString(),
      };

      expect(legacyMarker.endLine).to.be.undefined;
      expect(isRangeMarker(legacyMarker)).to.be.false;
    });
  });
});
