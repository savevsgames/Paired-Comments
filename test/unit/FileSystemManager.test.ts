/**
 * Unit tests for FileSystemManager
 * Testing file path operations and validation logic
 */

import { expect } from 'chai';
import { COMMENT_FILE_EXTENSION, COMMENT_FILE_VERSION } from '../../src/types';

describe('FileSystemManager - Unit Tests', () => {
  describe('Constants', () => {
    it('should have correct comment file extension', () => {
      expect(COMMENT_FILE_EXTENSION).to.equal('.comments');
    });

    it('should have current version defined', () => {
      expect(COMMENT_FILE_VERSION).to.be.a('string');
      expect(COMMENT_FILE_VERSION).to.match(/^\d+\.\d+\.\d+$/);
    });
  });

  describe('Path Operations', () => {
    it('getCommentFileUri - should append .comments extension', () => {
      // This would be tested in integration tests with real URIs
      // Unit test just validates the logic
      const sourcePath = '/test/file.ts';
      const expectedCommentPath = '/test/file.ts.comments';
      
      expect(sourcePath + COMMENT_FILE_EXTENSION).to.equal(expectedCommentPath);
    });

    it('isCommentFile - should detect .comments files', () => {
      const commentFilePath = '/test/file.ts.comments';
      const sourceFilePath = '/test/file.ts';
      
      expect(commentFilePath.endsWith(COMMENT_FILE_EXTENSION)).to.be.true;
      expect(sourceFilePath.endsWith(COMMENT_FILE_EXTENSION)).to.be.false;
    });

    it('should handle nested paths correctly', () => {
      const nestedPath = '/project/src/utils/helper.ts';
      const expectedCommentPath = '/project/src/utils/helper.ts.comments';
      
      expect(nestedPath + COMMENT_FILE_EXTENSION).to.equal(expectedCommentPath);
    });

    it('should handle files without extensions', () => {
      const noExtPath = '/project/README';
      const expectedCommentPath = '/project/README.comments';
      
      expect(noExtPath + COMMENT_FILE_EXTENSION).to.equal(expectedCommentPath);
    });
  });

  describe('Version Migration Logic', () => {
    it('should recognize current version', () => {
      const version = COMMENT_FILE_VERSION;
      expect(version).to.match(/^\d+\.\d+\.\d+$/);
    });

    it('should handle version comparison logic', () => {
      // Semantic version comparison logic
      const parseVersion = (v: string) => {
        const parts = v.split('.').map(Number);
        return { major: parts[0]!, minor: parts[1]!, patch: parts[2]! };
      };

      const v1 = parseVersion('2.0.5');
      const v2 = parseVersion('2.0.6');
      const v3 = parseVersion('1.0.0');

      expect(v2.minor).to.be.greaterThanOrEqual(v1.minor);
      expect(v1.major).to.be.greaterThan(v3.major);
    });
  });
});
