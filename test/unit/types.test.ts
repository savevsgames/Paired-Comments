/**
 * Unit tests for type utilities and helper functions
 * Tests detectTag, constants, and other pure functions
 */

import { expect } from 'chai';
import { 
  detectTag, 
  CommentTag, 
  TAG_COLORS,
  COMMENT_FILE_VERSION,
  COMMENT_FILE_EXTENSION,
  ErrorType,
  PairedCommentsError
} from '../../src/types';

describe('Type Utilities', () => {
  describe('detectTag', () => {
    it('should detect TODO tag', () => {
      expect(detectTag('TODO: Fix this')).to.equal('TODO');
      expect(detectTag('TODO Fix this')).to.equal('TODO');
      expect(detectTag('  TODO: Something')).to.equal('TODO');
      expect(detectTag('todo: lowercase')).to.equal('TODO');
    });

    it('should detect FIXME tag', () => {
      expect(detectTag('FIXME: Broken logic')).to.equal('FIXME');
      expect(detectTag('FIXME Fix this bug')).to.equal('FIXME');
      expect(detectTag('fixme: lowercase')).to.equal('FIXME');
    });

    it('should detect NOTE tag', () => {
      expect(detectTag('NOTE: Important info')).to.equal('NOTE');
      expect(detectTag('NOTE Remember this')).to.equal('NOTE');
      expect(detectTag('note: lowercase')).to.equal('NOTE');
    });

    it('should detect QUESTION tag', () => {
      expect(detectTag('QUESTION: Why does this work?')).to.equal('QUESTION');
      expect(detectTag('QUESTION Is this right?')).to.equal('QUESTION');
      expect(detectTag('? What is this?')).to.equal('QUESTION');
    });

    it('should detect HACK tag', () => {
      expect(detectTag('HACK: Temporary solution')).to.equal('HACK');
      expect(detectTag('HACK Quick fix')).to.equal('HACK');
      expect(detectTag('hack: lowercase')).to.equal('HACK');
    });

    it('should detect WARNING tag', () => {
      expect(detectTag('WARNING: Be careful')).to.equal('WARNING');
      expect(detectTag('WARNING Dangerous')).to.equal('WARNING');
      expect(detectTag('WARN: Short version')).to.equal('WARNING');
    });

    it('should detect STAR tag', () => {
      expect(detectTag('STAR: Important')).to.equal('STAR');
      expect(detectTag('STAR Bookmarked')).to.equal('STAR');
      expect(detectTag('⭐ Star emoji')).to.equal('STAR');
    });

    it('should return null for no tag', () => {
      expect(detectTag('Just a normal comment')).to.be.null;
      expect(detectTag('This mentions TODO but not at start')).to.be.null;
      expect(detectTag('')).to.be.null;
    });

    it('should handle whitespace', () => {
      expect(detectTag('   TODO: Lots of leading space')).to.equal('TODO');
      expect(detectTag('\t\tTODO: Tabs')).to.equal('TODO');
      expect(detectTag(' \n TODO: Newlines')).to.equal('TODO');
    });

    it('should be case-insensitive', () => {
      expect(detectTag('todo: lower')).to.equal('TODO');
      expect(detectTag('Todo: Mixed')).to.equal('TODO');
      expect(detectTag('ToDo: Weird')).to.equal('TODO');
    });

    it('should prioritize first tag if multiple present', () => {
      // detectTag only looks at the start
      expect(detectTag('TODO: Also FIXME this')).to.equal('TODO');
      expect(detectTag('FIXME: TODO later')).to.equal('FIXME');
    });
  });

  describe('TAG_COLORS', () => {
    it('should have colors for all non-null tags', () => {
      expect(TAG_COLORS.TODO).to.be.a('string');
      expect(TAG_COLORS.FIXME).to.be.a('string');
      expect(TAG_COLORS.NOTE).to.be.a('string');
      expect(TAG_COLORS.QUESTION).to.be.a('string');
      expect(TAG_COLORS.HACK).to.be.a('string');
      expect(TAG_COLORS.WARNING).to.be.a('string');
      expect(TAG_COLORS.STAR).to.be.a('string');
    });

    it('should have valid hex colors', () => {
      const hexColorRegex = /^#[0-9A-F]{6}$/i;
      
      Object.values(TAG_COLORS).forEach(color => {
        expect(color).to.match(hexColorRegex, `Color ${color} should be a valid hex color`);
      });
    });

    it('should have distinct colors', () => {
      const colors = Object.values(TAG_COLORS);
      const uniqueColors = new Set(colors);
      
      expect(uniqueColors.size).to.equal(colors.length, 'All tag colors should be distinct');
    });
  });

  describe('Constants', () => {
    it('COMMENT_FILE_VERSION should be semantic version', () => {
      expect(COMMENT_FILE_VERSION).to.match(/^\d+\.\d+\.\d+$/);
      expect(COMMENT_FILE_VERSION).to.match(/^2\./); // Should be v2.x
    });

    it('COMMENT_FILE_EXTENSION should be .comments', () => {
      expect(COMMENT_FILE_EXTENSION).to.equal('.comments');
    });
  });

  describe('ErrorType enum', () => {
    it('should have all expected error types', () => {
      expect(ErrorType.FILE_NOT_FOUND).to.equal('FILE_NOT_FOUND');
      expect(ErrorType.FILE_READ_ERROR).to.equal('FILE_READ_ERROR');
      expect(ErrorType.FILE_WRITE_ERROR).to.equal('FILE_WRITE_ERROR');
      expect(ErrorType.INVALID_JSON).to.equal('INVALID_JSON');
      expect(ErrorType.INVALID_SCHEMA).to.equal('INVALID_SCHEMA');
      expect(ErrorType.COMMENT_NOT_FOUND).to.equal('COMMENT_NOT_FOUND');
      expect(ErrorType.INVALID_LINE_NUMBER).to.equal('INVALID_LINE_NUMBER');
      expect(ErrorType.PERMISSION_DENIED).to.equal('PERMISSION_DENIED');
      expect(ErrorType.UNKNOWN_ERROR).to.equal('UNKNOWN_ERROR');
    });
  });

  describe('PairedCommentsError', () => {
    it('should create error with type and message', () => {
      const error = new PairedCommentsError(
        ErrorType.FILE_NOT_FOUND,
        'File not found: test.ts'
      );

      expect(error.type).to.equal(ErrorType.FILE_NOT_FOUND);
      expect(error.message).to.equal('File not found: test.ts');
      expect(error.name).to.equal('PairedCommentsError');
    });

    it('should include cause error if provided', () => {
      const causeError = new Error('Original error');
      const error = new PairedCommentsError(
        ErrorType.FILE_READ_ERROR,
        'Failed to read file',
        causeError
      );

      expect(error.cause).to.equal(causeError);
    });

    it('should be instance of Error', () => {
      const error = new PairedCommentsError(
        ErrorType.UNKNOWN_ERROR,
        'Something went wrong'
      );

      expect(error).to.be.instanceOf(Error);
      expect(error).to.be.instanceOf(PairedCommentsError);
    });

    it('should have stack trace', () => {
      const error = new PairedCommentsError(
        ErrorType.INVALID_JSON,
        'Invalid JSON format'
      );

      expect(error.stack).to.be.a('string');
      expect(error.stack).to.include('PairedCommentsError');
    });
  });

  describe('CommentTag type', () => {
    it('should allow all valid tag values', () => {
      const validTags: CommentTag[] = [
        'TODO',
        'FIXME',
        'NOTE',
        'QUESTION',
        'HACK',
        'WARNING',
        'STAR',
        null
      ];

      // TypeScript compile-time check (no runtime assertion needed)
      expect(validTags).to.have.lengthOf(8);
    });
  });
});
