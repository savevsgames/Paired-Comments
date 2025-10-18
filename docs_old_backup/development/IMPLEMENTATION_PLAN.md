# Paired Comments - Implementation Plan

**Version:** 0.1.0
**Last Updated:** October 16, 2025
**Target Completion:** 3 weeks

---

## Table of Contents

1. [Overview](#overview)
2. [Development Phases](#development-phases)
3. [Sprint Breakdown](#sprint-breakdown)
4. [Testing Strategy](#testing-strategy)
5. [Quality Gates](#quality-gates)
6. [Risk Mitigation](#risk-mitigation)

---

## Overview

This document outlines the step-by-step implementation plan for building the Paired Comments VS Code extension MVP. The plan emphasizes:

- **Incremental development** - Build and test each module independently
- **Continuous testing** - Write tests alongside implementation
- **Documentation-first** - Document APIs before implementing
- **Quality over speed** - Prioritize correctness and maintainability

---

## Development Phases

### Phase 1: Foundation (Days 1-3)
**Goal:** Set up project infrastructure and core data layer

**Deliverables:**
- [x] Project scaffolding complete
- [ ] Type definitions finalized
- [ ] File I/O working
- [ ] Basic comment CRUD operations
- [ ] Unit tests for core logic

**Success Criteria:**
- Can create, read, update, delete comments programmatically
- All tests pass
- TypeScript strict mode with zero errors

---

### Phase 2: View Layer (Days 4-7)
**Goal:** Implement dual-pane view and basic UI

**Deliverables:**
- [ ] Open paired view command working
- [ ] Comments displayed in second pane
- [ ] Basic decorations (gutter icons)
- [ ] Context menu items
- [ ] Integration tests for view layer

**Success Criteria:**
- User can open `.comments` file beside source
- Comments are visible and synchronized with source
- UI responds to user actions

---

### Phase 3: Scroll Sync (Days 8-10)
**Goal:** Implement smooth bidirectional scroll synchronization

**Deliverables:**
- [ ] Scroll sync manager implemented
- [ ] Percentage-based scroll algorithm
- [ ] Toggle sync on/off
- [ ] Performance optimizations
- [ ] Edge case handling (empty files, very long files)

**Success Criteria:**
- Scroll sync feels natural (< 50ms latency)
- No infinite scroll loops
- Works with files of vastly different lengths

---

### Phase 4: Polish & UX (Days 11-14)
**Goal:** Refine user experience and add quality-of-life features

**Deliverables:**
- [ ] Keyboard shortcuts
- [ ] Status bar integration
- [ ] Hover previews
- [ ] Error messages and user feedback
- [ ] Command palette integration

**Success Criteria:**
- All commands accessible via keyboard
- Clear feedback for all user actions
- Error messages are helpful, not cryptic

---

### Phase 5: Testing & Hardening (Days 15-18)
**Goal:** Comprehensive testing and bug fixes

**Deliverables:**
- [ ] Full test coverage (>80%)
- [ ] Manual testing checklist completed
- [ ] Performance benchmarks met
- [ ] Error handling for all edge cases
- [ ] Bug fixes

**Success Criteria:**
- No critical bugs
- Performance targets met (see Technical Architecture)
- Extension works on Windows, Mac, Linux

---

### Phase 6: Documentation & Launch Prep (Days 19-21)
**Goal:** Prepare for initial release

**Deliverables:**
- [ ] README.md with clear usage instructions
- [ ] Demo GIF/video
- [ ] CHANGELOG.md
- [ ] User guide
- [ ] Developer guide
- [ ] Package as `.vsix`

**Success Criteria:**
- 3+ external testers can use without questions
- Documentation covers all features
- Ready for internal dogfooding

---

## Sprint Breakdown

### Sprint 1: Core Infrastructure (Days 1-3)

#### Day 1: Project Setup
- [x] Create project structure
- [x] Initialize npm project
- [x] Configure TypeScript (strict mode)
- [x] Set up ESLint + Prettier
- [x] Create type definitions
- [x] Set up testing framework (Vitest)
- [ ] Write initial README

**Deliverable:** Project compiles with `npm run compile`

#### Day 2: File I/O Layer
- [ ] Implement `FileSystemManager`
  - [ ] `readCommentFile()`
  - [ ] `writeCommentFile()`
  - [ ] `commentFileExists()`
  - [ ] `getCommentFileUri()`
- [ ] Write unit tests for FileSystemManager
- [ ] Test with sample `.comments` files

**Deliverable:** Can read/write `.comments` files reliably

#### Day 3: Comment Manager
- [ ] Implement `CommentManager`
  - [ ] `loadComments()`
  - [ ] `saveComments()`
  - [ ] `addComment()`
  - [ ] `updateComment()`
  - [ ] `deleteComment()`
  - [ ] `getCommentsForLine()`
- [ ] Write unit tests for CommentManager
- [ ] Test caching logic

**Deliverable:** Full CRUD operations working

---

### Sprint 2: View Layer (Days 4-7)

#### Day 4: Extension Activation
- [ ] Implement `extension.ts` activation
- [ ] Register commands
- [ ] Set up dependency injection
- [ ] Test extension loads in VS Code

**Deliverable:** Extension activates without errors

#### Day 5: Paired View Manager
- [ ] Implement `PairedViewManager`
  - [ ] `openPairedView()`
  - [ ] Track active paired views
  - [ ] Handle editor close events
- [ ] Create "Open Paired Comments" command
- [ ] Test opening `.comments` beside source

**Deliverable:** Can open paired view manually

#### Day 6: Decoration Manager
- [ ] Implement `DecorationManager`
  - [ ] Gutter icon decorations
  - [ ] Hover preview
  - [ ] Update decorations on change
- [ ] Create comment icon SVG
- [ ] Test decorations appear correctly

**Deliverable:** Gutter icons show where comments exist

#### Day 7: Command Layer
- [ ] Implement "Add Comment" command
- [ ] Implement "Edit Comment" command
- [ ] Implement "Delete Comment" command
- [ ] Add context menu items
- [ ] Test all commands

**Deliverable:** Full user interaction flow works

---

### Sprint 3: Scroll Sync (Days 8-10)

#### Day 8: Scroll Sync Foundation
- [ ] Implement `ScrollSyncManager`
- [ ] Listen to scroll events
- [ ] Basic scroll position mirroring
- [ ] Test simple cases

**Deliverable:** Basic scroll sync working

#### Day 9: Scroll Algorithm Refinement
- [ ] Implement percentage-based scrolling
- [ ] Prevent infinite loops (ping-pong effect)
- [ ] Add debouncing/throttling
- [ ] Test with files of different lengths

**Deliverable:** Scroll sync works smoothly

#### Day 10: Edge Cases & Optimization
- [ ] Handle empty files
- [ ] Handle very long files (10,000+ lines)
- [ ] Performance profiling
- [ ] Add toggle sync command
- [ ] Test edge cases

**Deliverable:** Scroll sync is production-ready

---

### Sprint 4: Polish (Days 11-14)

#### Day 11: Keyboard Shortcuts
- [ ] Add keybindings to `package.json`
- [ ] Test on Windows/Mac
- [ ] Document shortcuts in README

**Deliverable:** Common actions have shortcuts

#### Day 12: Status Bar
- [ ] Show comment count in status bar
- [ ] Show sync status (on/off)
- [ ] Make status bar interactive
- [ ] Test status bar updates

**Deliverable:** Status bar shows useful info

#### Day 13: Error Handling
- [ ] Add error messages for all failure cases
- [ ] Handle file permission errors
- [ ] Handle corrupted `.comments` files
- [ ] Show user-friendly notifications
- [ ] Test error scenarios

**Deliverable:** Graceful error handling

#### Day 14: User Feedback
- [ ] Add loading indicators
- [ ] Add success messages
- [ ] Improve hover previews
- [ ] Test UX flow

**Deliverable:** Extension feels polished

---

### Sprint 5: Testing (Days 15-18)

#### Day 15: Unit Test Coverage
- [ ] Achieve >80% code coverage
- [ ] Test all edge cases
- [ ] Test error conditions
- [ ] Run tests in CI (if applicable)

**Deliverable:** Comprehensive unit tests

#### Day 16: Integration Tests
- [ ] Test full user workflows
- [ ] Test multi-file scenarios
- [ ] Test concurrent editing
- [ ] Test extension reload

**Deliverable:** Integration tests pass

#### Day 17: Manual Testing
- [ ] Complete manual testing checklist
- [ ] Test on different OS (Windows/Mac/Linux)
- [ ] Test with different file types
- [ ] Test performance benchmarks

**Deliverable:** Manual testing checklist complete

#### Day 18: Bug Fixes
- [ ] Fix all critical bugs
- [ ] Fix high-priority bugs
- [ ] Document known issues

**Deliverable:** No critical bugs remain

---

### Sprint 6: Documentation (Days 19-21)

#### Day 19: User Documentation
- [ ] Write comprehensive README.md
- [ ] Create usage examples
- [ ] Document keyboard shortcuts
- [ ] Add troubleshooting section

**Deliverable:** User-facing documentation complete

#### Day 20: Developer Documentation
- [ ] Document architecture
- [ ] Add code comments
- [ ] Write contributing guide
- [ ] Document build process

**Deliverable:** Developer documentation complete

#### Day 21: Launch Preparation
- [ ] Create demo GIF/video
- [ ] Package as `.vsix`
- [ ] Test installation from `.vsix`
- [ ] Get 3 external testers
- [ ] Collect feedback

**Deliverable:** Ready for internal launch

---

## Testing Strategy

### Unit Tests (Vitest)

**Target Coverage:** >80%

**Test Files:**
```
tests/unit/
├── CommentManager.test.ts
├── FileSystemManager.test.ts
├── ScrollSyncManager.test.ts
├── DecorationManager.test.ts
├── PairedViewManager.test.ts
└── utils.test.ts
```

**Key Test Cases:**
- CRUD operations work correctly
- File I/O handles errors gracefully
- Scroll sync algorithm is accurate
- Decorations update on comment changes
- Caching works as expected

**Example Test:**
```typescript
import { describe, it, expect } from 'vitest';
import { CommentManager } from '../src/core/CommentManager';

describe('CommentManager', () => {
  it('should add a comment to a file', () => {
    const manager = new CommentManager();
    const comment = manager.addComment(
      'test.ts',
      42,
      'This is a test comment',
      'Greg'
    );

    expect(comment.line).toBe(42);
    expect(comment.text).toBe('This is a test comment');
    expect(comment.author).toBe('Greg');
  });

  it('should get comments for a specific line', () => {
    const manager = new CommentManager();
    manager.addComment('test.ts', 10, 'Comment A', 'Greg');
    manager.addComment('test.ts', 10, 'Comment B', 'Greg');
    manager.addComment('test.ts', 20, 'Comment C', 'Greg');

    const comments = manager.getCommentsForLine('test.ts', 10);
    expect(comments).toHaveLength(2);
  });
});
```

---

### Integration Tests (VS Code Test Runner)

**Test Files:**
```
tests/integration/
├── commands.test.ts
├── pairedView.test.ts
├── scrollSync.test.ts
└── endToEnd.test.ts
```

**Key Test Cases:**
- Opening paired view creates `.comments` file
- Adding comment updates both file and UI
- Scrolling source file scrolls comments file
- Closing editors cleans up state
- Extension survives reload

**Example Test:**
```typescript
import * as vscode from 'vscode';
import * as assert from 'assert';

suite('Paired Comments Integration Tests', () => {
  test('Opening paired view creates .comments file', async () => {
    // Open a source file
    const doc = await vscode.workspace.openTextDocument({
      content: 'console.log("test");',
      language: 'typescript'
    });
    await vscode.window.showTextDocument(doc);

    // Execute open command
    await vscode.commands.executeCommand('pairedComments.open');

    // Verify .comments file was created
    const commentsUri = vscode.Uri.file(doc.uri.fsPath + '.comments');
    const exists = await fileExists(commentsUri);
    assert.strictEqual(exists, true);
  });
});
```

---

### Manual Testing Checklist

**User Workflows:**
- [ ] Open `.comments` for file without comments (creates new file)
- [ ] Add comment to line 10, verify it appears in both panes
- [ ] Edit comment, verify change persists after reload
- [ ] Delete comment, verify it's removed from file
- [ ] Scroll source file, verify comments pane follows
- [ ] Scroll comments pane, verify source file follows
- [ ] Toggle sync off, verify scrolling is independent
- [ ] Toggle sync on, verify scrolling resumes
- [ ] Close and reopen VS Code, verify comments still load
- [ ] Open multiple files with comments simultaneously
- [ ] Test keyboard shortcuts (Ctrl+Shift+C, Ctrl+Shift+A)
- [ ] Test context menu items

**Edge Cases:**
- [ ] Empty source file
- [ ] Very long file (10,000+ lines)
- [ ] File with no comments
- [ ] Corrupted `.comments` file
- [ ] Read-only file system
- [ ] File with special characters in path

**Performance:**
- [ ] Scroll sync latency < 50ms
- [ ] Comment file load time < 100ms for 100 comments
- [ ] No visible lag when switching files
- [ ] Extension activates in < 200ms

**Cross-Platform:**
- [ ] Test on Windows
- [ ] Test on macOS
- [ ] Test on Linux

---

## Quality Gates

### Gate 1: Phase 1 Complete
**Criteria:**
- All unit tests pass
- File I/O works reliably
- Comment CRUD operations work
- TypeScript compiles with zero errors
- Code coverage >70%

**Approval:** Self-review + code compiles

---

### Gate 2: Phase 2 Complete
**Criteria:**
- Paired view opens correctly
- Decorations appear
- Commands registered
- Integration tests pass
- No console errors

**Approval:** Manual testing successful

---

### Gate 3: Phase 3 Complete
**Criteria:**
- Scroll sync works smoothly
- Performance targets met
- Edge cases handled
- No infinite loops
- User testing feedback positive

**Approval:** 2+ people test and approve

---

### Gate 4: MVP Complete
**Criteria:**
- All manual tests pass
- Documentation complete
- 3+ external testers approve
- No critical bugs
- Performance benchmarks met
- Cross-platform tested

**Approval:** Ready for internal dogfooding

---

## Risk Mitigation

### Risk 1: Scroll Sync Performance
**Impact:** High | **Probability:** Medium

**Mitigation:**
- Profile scroll performance early (Day 8)
- Use debouncing/throttling
- Test with very large files
- Implement optimizations before polish phase

---

### Risk 2: File I/O Errors
**Impact:** High | **Probability:** Low

**Mitigation:**
- Comprehensive error handling
- Atomic file writes
- Backup before overwrite
- Test on different file systems

---

### Risk 3: Concurrent Editing
**Impact:** Medium | **Probability:** Medium

**Mitigation:**
- Accept "last write wins" for MVP
- Watch for file system changes
- Prompt user on conflict (post-MVP)
- Document limitation

---

### Risk 4: Cross-Platform Issues
**Impact:** Medium | **Probability:** Low

**Mitigation:**
- Use VS Code APIs (not OS-specific)
- Test on Windows/Mac/Linux early
- Use path.join for all paths
- Test keyboard shortcuts on each platform

---

### Risk 5: User Adoption
**Impact:** High | **Probability:** Medium

**Mitigation:**
- Focus on UX/polish
- Create compelling demo
- Get early feedback from potential users
- Iterate based on feedback

---

## Success Metrics

### Technical Metrics
- Extension activates in < 200ms
- Scroll sync latency < 50ms
- Code coverage > 80%
- Zero critical bugs
- Zero TypeScript errors

### User Experience Metrics
- Users can add first comment within 30 seconds
- Scroll sync feels "natural" (user feedback)
- 100% comment persistence (no data loss)
- Clear visual feedback for all actions

### Process Metrics
- All sprints completed on time
- All quality gates passed
- 3+ external testers provide feedback
- Documentation 100% complete

---

## Daily Standup Template

**What did I accomplish yesterday?**
- [List completed tasks]

**What will I work on today?**
- [List planned tasks]

**Any blockers or risks?**
- [List issues]

**Code quality check:**
- [ ] Tests passing
- [ ] TypeScript compiling
- [ ] No console errors

---

## Definition of Done

A task is "done" when:
- [ ] Code is written and committed
- [ ] Unit tests written and passing
- [ ] Integration tests written and passing (if applicable)
- [ ] Code reviewed (self-review)
- [ ] Documentation updated
- [ ] Manual testing completed
- [ ] No TypeScript errors
- [ ] No ESLint warnings

---

## Next Steps

1. Begin Sprint 1, Day 1: Project Setup
2. Follow implementation order strictly
3. Test continuously
4. Document as you go
5. Review this plan daily

**Let's build something great!**
