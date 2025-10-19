# Feature: Cross-File Comment Movement

**Version:** v2.1.5+
**Priority:** Medium
**Estimated Effort:** 2-3 days
**Status:** Design Phase

---

## 📋 Overview

Enable comments to be moved/copied between source files while maintaining their integrity, ghost markers, and AI metadata. Currently, if a user refactors code and moves a function to a different file, comments don't follow - they need to be manually recreated.

---

## 🎯 Goals

### Primary
- **Move comments with code** - When function/class moves to new file, comments can follow
- **Copy comments** - Duplicate comments to multiple files (useful for shared patterns)
- **Preserve metadata** - Ghost markers, AI metadata, and parameters stay intact
- **Safe operation** - Prevent orphaning, validate target file exists

### Secondary
- **Bulk move** - Move multiple comments at once
- **Git integration** - Detect file renames and offer to move comments
- **Cross-project** - Move comments between workspaces (export/import)

---

## ✨ User Stories

### Story 1: Function Refactoring
```
As a developer,
When I move calculateTotal() from utils.js to math.js,
I want to move its 3 comments with it,
So they remain associated with the correct code.
```

### Story 2: Code Duplication
```
As a developer,
When I copy a validated pattern from file A to file B,
I want to copy its documentation comments too,
So the duplicated code is equally well-documented.
```

### Story 3: File Rename
```
As a developer,
When Git detects I renamed UserService.ts to AccountService.ts,
I want the extension to automatically update the .comments file reference,
So comments aren't orphaned by the rename.
```

---

## 🛠️ Implementation Design

### 1. Move Comment Command

**Command:** `pairedComments.moveComment`

**Workflow:**
1. User selects comment in source file
2. Invokes "Move Comment to Another File"
3. Extension shows file picker (only .js/.ts files)
4. User selects destination file
5. User selects destination line (or symbol)
6. Extension validates destination
7. Extension performs move:
   - Remove comment from source .comments file
   - Create new ghost marker in destination file
   - Update AST anchor if needed
   - Add comment to destination .comments file
   - Save both files
8. Show confirmation

**Code Structure:**
```typescript
// src/commands/crossFileOperations.ts

export interface MoveCommentOptions {
  commentId: string;
  sourceUri: vscode.Uri;
  targetUri: vscode.Uri;
  targetLine: number;
  preserveMetadata: boolean;  // Keep AI metadata, params
}

export async function moveComment(options: MoveCommentOptions): Promise<void> {
  // Step 1: Load source .comments file
  const sourceComments = await commentManager.loadComments(options.sourceUri);

  // Step 2: Find comment to move
  const comment = sourceComments.comments.find(c => c.id === options.commentId);
  if (!comment) {
    throw new Error('Comment not found');
  }

  // Step 3: Load target .comments file (create if doesn't exist)
  let targetComments = await commentManager.loadComments(options.targetUri);
  if (!targetComments) {
    targetComments = await fileSystemManager.createEmptyCommentFile(options.targetUri);
  }

  // Step 4: Create new ghost marker in target file
  const targetDoc = await vscode.workspace.openTextDocument(options.targetUri);
  const newMarker = await ghostMarkerManager.createMarker(
    targetDoc,
    options.targetLine,
    [comment.id]  // Reuse same comment ID
  );

  // Step 5: Update comment to reference new location
  comment.line = options.targetLine;
  comment.startLine = options.targetLine;
  comment.ghostMarkerId = newMarker.id;
  comment.updated = new Date().toISOString();

  // Step 6: Remove from source, add to target
  sourceComments.comments = sourceComments.comments.filter(c => c.id !== options.commentId);
  targetComments.comments.push(comment);

  // Step 7: Remove old ghost marker from source
  if (comment.ghostMarkerId) {
    const oldMarker = ghostMarkerManager.getMarkerById(options.sourceUri, comment.ghostMarkerId);
    if (oldMarker) {
      ghostMarkerManager.removeMarker(options.sourceUri, oldMarker.id);
    }
  }

  // Step 8: Save both files
  await Promise.all([
    commentManager.saveComments(options.sourceUri, sourceComments),
    commentManager.saveComments(options.targetUri, targetComments)
  ]);

  // Step 9: Update decorations
  await Promise.all([
    decorationManager.refreshDecorations(options.sourceUri),
    decorationManager.refreshDecorations(options.targetUri)
  ]);

  vscode.window.showInformationMessage(`Comment moved to ${options.targetUri.fsPath}:${options.targetLine}`);
}
```

---

### 2. Copy Comment Command

**Command:** `pairedComments.copyComment`

**Similar to move, but:**
- Generates new UUID for copied comment
- Creates new ghost marker
- Leaves original comment intact
- Updates `author` field: "john (copied from utils.js)"

```typescript
export async function copyComment(options: MoveCommentOptions): Promise<void> {
  // Similar to moveComment, but:

  // Generate new ID for copied comment
  const copiedComment = {
    ...comment,
    id: generateId(),
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    author: `${comment.author} (copied from ${path.basename(options.sourceUri.fsPath)})`
  };

  // Create new marker
  const newMarker = await ghostMarkerManager.createMarker(
    targetDoc,
    options.targetLine,
    [copiedComment.id]
  );

  // Add to target (don't remove from source)
  targetComments.comments.push(copiedComment);

  // Save only target file
  await commentManager.saveComments(options.targetUri, targetComments);
}
```

---

### 3. Bulk Move

**Command:** `pairedComments.bulkMoveComments`

**Use Case:** Moving an entire class with 10 comments from `UserService.ts` to `AccountService.ts`

```typescript
export interface BulkMoveOptions {
  commentIds: string[];         // Array of comment IDs to move
  sourceUri: vscode.Uri;
  targetUri: vscode.Uri;
  targetStartLine: number;      // Where to start placing comments
  offsetFromOriginal: number;   // Preserve relative line positions
}

export async function bulkMoveComments(options: BulkMoveOptions): Promise<void> {
  // Calculate target lines for each comment (preserve relative spacing)
  const moves: MoveCommentOptions[] = options.commentIds.map((id, index) => {
    const comment = findComment(id);
    const originalOffset = comment.line - options.commentIds[0].line;

    return {
      commentId: id,
      sourceUri: options.sourceUri,
      targetUri: options.targetUri,
      targetLine: options.targetStartLine + originalOffset,
      preserveMetadata: true
    };
  });

  // Perform all moves in transaction
  await Promise.all(moves.map(moveComment));

  vscode.window.showInformationMessage(`Moved ${options.commentIds.length} comments`);
}
```

---

### 4. Git Rename Detection

**Auto-detect file renames and prompt to update .comments files**

```typescript
// src/integrations/GitIntegration.ts

export class GitIntegration {
  /**
   * Watch for Git file renames and update .comments file references
   */
  async watchFileRenames(): Promise<void> {
    // Use Git extension API or file system watcher
    vscode.workspace.onDidRenameFiles(async (event) => {
      for (const file of event.files) {
        const oldPath = file.oldUri.fsPath;
        const newPath = file.newUri.fsPath;

        // Check if old .comments file exists
        const oldCommentsPath = `${oldPath}.comments`;
        const oldCommentsUri = vscode.Uri.file(oldCommentsPath);

        try {
          await vscode.workspace.fs.stat(oldCommentsUri);

          // .comments file exists - offer to rename
          const answer = await vscode.window.showInformationMessage(
            `File renamed. Update comment file reference?`,
            'Yes',
            'No'
          );

          if (answer === 'Yes') {
            await this.renameCommentFile(file.oldUri, file.newUri);
          }
        } catch {
          // No .comments file - nothing to do
        }
      }
    });
  }

  private async renameCommentFile(
    oldSourceUri: vscode.Uri,
    newSourceUri: vscode.Uri
  ): Promise<void> {
    const oldCommentsUri = vscode.Uri.file(`${oldSourceUri.fsPath}.comments`);
    const newCommentsUri = vscode.Uri.file(`${newSourceUri.fsPath}.comments`);

    // Rename .comments file
    await vscode.workspace.fs.rename(oldCommentsUri, newCommentsUri);

    // Update internal "file" reference in .comments file
    const commentFile = await fileSystemManager.readCommentFile(newSourceUri);
    if (commentFile) {
      commentFile.file = path.relative(
        vscode.workspace.workspaceFolders![0].uri.fsPath,
        newSourceUri.fsPath
      );
      await fileSystemManager.writeCommentFile(newSourceUri, commentFile);
    }

    vscode.window.showInformationMessage('Comment file updated');
  }
}
```

---

### 5. Export/Import Between Workspaces

**Command:** `pairedComments.exportComments`

**Export Format (JSON):**
```json
{
  "version": "2.1.0",
  "sourceFile": "src/core/CommentManager.ts",
  "exportedAt": "2025-10-19T01:23:00Z",
  "comments": [
    {
      "id": "uuid",
      "line": 145,
      "text": "TODO: Refactor this method",
      "author": "john",
      "created": "2025-10-15T10:30:00Z",
      "tag": "TODO",
      "aiMetadata": { ... },
      "params": { ... }
    }
  ]
}
```

**Import:**
- Read exported JSON
- Prompt user to select target file
- Prompt for line number or symbol
- Create comments with new ghost markers
- Preserve AI metadata and params
- Update author: "john (imported from UserService.ts)"

---

## 🧪 Testing Strategy

### Unit Tests
```typescript
// test/unit/CrossFileOperations.test.ts
describe('moveComment', () => {
  it('should move comment from source to target', async () => {
    // Create comment in file A
    // Move to file B line 50
    // Verify removed from A
    // Verify added to B with new ghost marker
  });

  it('should preserve AI metadata during move', async () => {
    // Create comment with AI metadata
    // Move to new file
    // Verify AI metadata intact
  });

  it('should update ghost marker in target file', async () => {
    // Move comment
    // Verify new ghost marker created at target line
    // Verify old marker removed from source
  });
});
```

### Integration Tests
```typescript
// test/integration/CrossFileWorkflow.test.ts
it('should move all comments when refactoring function to new file', async () => {
  // Create function with 3 comments in file A
  // Move function to file B
  // Move all 3 comments to file B
  // Verify all tracking correctly
});

it('should detect Git file rename and update .comments', async () => {
  // Create file with comments
  // Rename file using Git
  // Verify .comments file renamed
  // Verify internal reference updated
});
```

---

## 📊 Success Metrics

- [ ] Move comment succeeds 100% of time for valid targets
- [ ] Ghost markers track correctly after move
- [ ] AI metadata and params preserved
- [ ] Bulk move handles 50+ comments without errors
- [ ] Git rename detection works for 95%+ of renames
- [ ] Export/Import preserves all metadata

---

## ⚠️ Edge Cases

### 1. Target File Doesn't Exist
**Solution:** Create empty .comments file first

### 2. Target Line Out of Bounds
**Solution:** Prompt user to select valid line or symbol

### 3. Comment ID Collision
**Solution:** Generate new ID on import/copy

### 4. Cross-Language Move
**Example:** Move comment from .js to .py
**Solution:** Warn user that AST anchor may break, offer plain text anchor

### 5. Moving Range Comment
**Solution:** Preserve `startLine` and `endLine` offsets relative to target

---

## 🔗 Dependencies

**Required:**
- Ghost Marker system
- CommentManager CRUD operations
- File system write permissions

**Optional:**
- Git extension API (for rename detection)
- Advanced Search (to find comments to move)

---

## 📝 Documentation Needs

- [ ] Add "Moving Comments" section to README
- [ ] Add GIF demo of move operation
- [ ] Document Git rename integration
- [ ] Add export/import guide
- [ ] Update CHANGELOG.md

---

## 🚀 Future Enhancements

- **Drag & Drop:** Drag comment from one file to another in Explorer
- **Smart Destination:** Suggest destination based on symbol name match
- **Undo Move:** Revert move operation with Ctrl+Z
- **Move History:** Track where comments have been moved
- **Cross-Workspace:** Move between different VS Code workspaces
- **Team Sync:** Broadcast moves to team via Git hook

---

## 💡 UI Mockups

### Move Comment Dialog
```
┌────────────────────────────────────────────┐
│ 🔀 Move Comment                            │
├────────────────────────────────────────────┤
│ Comment: "TODO: Refactor this method"      │
│ From: src/core/CommentManager.ts:145       │
│                                            │
│ To: [src/utils/Helpers.ts          ▼]     │
│ Line: [67                            ]     │
│                                            │
│ Or select symbol:                          │
│ ○ calculateTotal (line 67)                 │
│ ○ processData (line 120)                   │
│ ○ validateInput (line 180)                 │
│                                            │
│ ☑ Preserve AI metadata                    │
│ ☑ Update decorations                      │
│                                            │
│ [Move]  [Cancel]                           │
└────────────────────────────────────────────┘
```

---

**Status:** Design complete, ready for implementation after v2.1.4
**Next Step:** Implement `moveComment()` and `copyComment()` commands
