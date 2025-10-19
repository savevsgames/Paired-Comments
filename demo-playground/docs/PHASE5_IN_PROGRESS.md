# Phase 5: Extension Integration - In Progress

**Status:** 🚧 **IN PROGRESS** (Foundation Complete)
**Date:** October 19, 2025
**Estimated Completion:** 2-3 days

---

## 🎯 Phase 5 Goal

Integrate the Paired Comments VS Code extension into the Monaco Editor in the browser, enabling:
- ✅ Gutter icons showing comment locations
- ✅ CodeLens links to jump to comments
- ✅ Hover previews showing comment content
- ✅ Add/edit/delete comment commands

---

## ✅ Completed Foundation Work

### 1. Browser Extension Framework (`src/lib/extension/browser-extension.ts`)

Created a simplified, browser-compatible version of the Paired Comments extension:

**Features Implemented:**
- `PairedCommentsExtension` class with Monaco editor integration
- Comment loading from `.comments` files
- Gutter icon decoration system
- CodeLens provider for clickable comment links
- Hover provider for comment previews
- Add comment functionality

**Key Methods:**
```typescript
initialize(editor: monaco.editor.IStandaloneCodeEditor): void
loadComments(commentFile: CommentFile): void
addComment(line, author, text, tag): void
getComments(): Comment[]
dispose(): void
```

**Comment Tags Supported:**
- `TODO` - Blue checkmark (tasks)
- `NOTE` - Yellow info icon (information)
- `FIXME` - Red warning triangle (bugs)
- `STAR` - Green star (highlights)
- `QUESTION` - Purple question mark (questions)

### 2. Extension Styles (`src/styles/extension.css`)

Created CSS for gutter icons using inline SVG data URIs:
- GitHub-themed color scheme (blue, yellow, red, green, purple)
- 16x16px icons with proper positioning
- Hover states for interactive elements
- CodeLens styling matching GitHub UI

### 3. Example Comments File (`public/examples/react-component.js.comments`)

Created example `.comments` file demonstrating:
- Version 2.1.0 format
- 3 comments with different tags (NOTE, TODO, STAR)
- Realistic author names and timestamps
- Multi-line comment text

### 4. Build Configuration (`vite.config.extension.ts`)

Created Vite configuration for future bundling needs:
- Entry point: `../src/extension-browser.ts`
- Output: `public/extension/paired-comments-extension.*.js`
- VS Code module aliasing to our shim
- Source maps for debugging

---

## 🚧 Next Steps (Remaining Work)

### Step 1: Import Extension Styles
**File:** `src/app/globals.css`
```css
@import '../styles/extension.css';
```

### Step 2: Update Monaco Editor Component
**File:** `src/components/Monaco/MonacoEditor.tsx`

Add:
1. Import extension: `import { createExtension } from '@/lib/extension/browser-extension'`
2. Create extension ref: `const extensionRef = useRef<PairedCommentsExtension>()`
3. Initialize on mount: `extensionRef.current = createExtension(); extensionRef.current.initialize(editor);`
4. Load comments from filesystem when file changes
5. Dispose on unmount

**Pseudocode:**
```typescript
const handleEditorDidMount = (editor) => {
  editorRef.current = editor;

  // Initialize extension
  extensionRef.current = createExtension();
  extensionRef.current.initialize(editor);

  editor.focus();
};

useEffect(() => {
  if (!fileName || !extensionRef.current) return;

  // Load .comments file from public/examples/{fileName}.comments
  fetch(`/examples/${fileName}.comments`)
    .then(res => res.json())
    .then(commentFile => {
      extensionRef.current.loadComments(commentFile);
    })
    .catch(() => console.log('No comments file found'));
}, [fileName]);
```

### Step 3: Pass fileName to Monaco Editor
**File:** `src/components/GitHubUI/EditorPane.tsx`

Add `fileName` prop to `<MonacoEditor>`:
```tsx
<MonacoEditor
  value={content}
  language={file.language}
  fileName={file.name}  // Add this
  readOnly={false}
/>
```

### Step 4: Create More Example .comments Files

Create comment files for each example:
- `express-api.js.comments` - API comments
- `typescript-interface.ts.comments` - Type system comments
- `async-operations.ts.comments` - Async/await patterns
- `python-class.py.comments` - Python docstring alternatives

### Step 5: Add E2E Tests

**File:** `e2e/extension-integration.spec.ts`

Tests to write:
1. **Gutter Icons Test**
   ```typescript
   test('should display gutter icons for comments', async ({ page }) => {
     await page.goto('/');
     await page.locator('text=react-component.js').click();

     // Wait for Monaco and extension
     await page.waitForSelector('.monaco-editor');
     await page.waitForTimeout(1000); // Extension initialization

     // Check for gutter icons (specific CSS classes)
     const noteIcon = page.locator('.paired-comment-gutter-note');
     const todoIcon = page.locator('.paired-comment-gutter-todo');
     const starIcon = page.locator('.paired-comment-gutter-star');

     await expect(noteIcon).toBeVisible();
     await expect(todoIcon).toBeVisible();
     await expect(starIcon).toBeVisible();
   });
   ```

2. **CodeLens Test**
   ```typescript
   test('should show CodeLens links for comments', async ({ page }) => {
     await page.goto('/');
     await page.locator('text=react-component.js').click();
     await page.waitForSelector('.monaco-editor');

     // Look for CodeLens decorations
     const codeLens = page.locator('.codelens-decoration');
     await expect(codeLens.first()).toBeVisible();
     await expect(codeLens.first()).toContainText('💬');
   });
   ```

3. **Hover Preview Test**
   ```typescript
   test('should show hover preview on gutter icon', async ({ page }) => {
     await page.goto('/');
     await page.locator('text=react-component.js').click();
     await page.waitForSelector('.monaco-editor');

     // Hover over gutter icon
     const gutterIcon = page.locator('.paired-comment-gutter-note').first();
     await gutterIcon.hover();

     // Wait for Monaco hover widget
     await page.waitForSelector('.monaco-hover', { timeout: 2000 });

     // Verify hover contains comment text
     const hover = page.locator('.monaco-hover');
     await expect(hover).toContainText('Sarah Chen'); // Author
     await expect(hover).toContainText('NOTE'); // Tag
   });
   ```

### Step 6: Test & Verify

1. Start dev server: `docker-compose up`
2. Open http://localhost:3000
3. Click on `react-component.js`
4. Verify:
   - ✅ Gutter icons appear at lines 5, 12, 20
   - ✅ Icons have correct colors (yellow NOTE, blue TODO, green STAR)
   - ✅ Hovering shows comment preview
   - ✅ CodeLens shows "💬 NOTE comment by Sarah Chen" above line 5
   - ✅ CodeLens shows "💬 TODO comment by Alex Rodriguez" above line 12
   - ✅ CodeLens shows "💬 STAR comment by Jamie Park" above line 20

5. Run tests:
   ```bash
   cd demo-playground
   npm run test        # Unit tests
   npm run test:e2e    # E2E tests
   ```

---

## 📊 Progress Metrics

| Task | Status | Est. Time |
|------|--------|-----------|
| Browser extension framework | ✅ Complete | ~2 hours |
| Extension CSS styles | ✅ Complete | ~30 min |
| Example .comments files | 🟡 1/5 complete | ~1 hour |
| Monaco integration | 🔴 Not started | ~2 hours |
| Style imports | 🔴 Not started | ~5 min |
| E2E tests | 🔴 Not started | ~3 hours |
| Testing & debugging | 🔴 Not started | ~2 hours |
| **Total Progress** | **~25%** | **~11 hours** |

---

## 🐛 Known Issues & Considerations

### Issue 1: Monaco Editor Glyph Margin
**Problem:** Monaco's glyph margin must be enabled for gutter icons to appear.
**Solution:** Already configured in `MonacoEditor.tsx`:
```typescript
options={{
  glyphMargin: true,  // ✅ Already set
  // ...
}}
```

### Issue 2: Comment File Loading
**Problem:** Need to handle missing `.comments` files gracefully.
**Solution:** Use `fetch().catch()` to silently ignore missing files:
```typescript
fetch(`/examples/${fileName}.comments`)
  .catch(() => console.log(`No comments for ${fileName}`));
```

### Issue 3: Hot Reload Conflicts
**Problem:** Docker container with volume mounts causes file modification conflicts.
**Solution:** Work with container running, changes auto-reload. Or stop container temporarily:
```bash
docker-compose down
# Make changes
docker-compose up --build
```

### Issue 4: TypeScript Module Resolution
**Problem:** `@/lib/extension/browser-extension` may not resolve in Monaco component.
**Solution:** Already configured in `tsconfig.json`:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

---

## 🎬 Demo Scenario

**User Story:** Developer opens demo playground and sees comments visualized

1. User opens http://localhost:3000
2. Sees file tree with JavaScript/TypeScript/Python folders
3. Clicks `react-component.js`
4. Monaco editor loads with syntax highlighting
5. **[NEW]** Gutter icons appear:
   - Line 5: Yellow circle (NOTE)
   - Line 12: Blue checkmark (TODO)
   - Line 20: Green star (STAR)
6. **[NEW]** User hovers over yellow circle at line 5
   - Hover widget shows: "NOTE by Sarah Chen: This component demonstrates React hooks..."
7. **[NEW]** User sees CodeLens link above line 5
   - "💬 NOTE comment by Sarah Chen"
8. **[NEW]** User clicks CodeLens link
   - Comments pane scrolls to show full comment

---

## 📝 Files Modified/Created

### Created:
1. ✅ `src/lib/extension/browser-extension.ts` (181 lines)
2. ✅ `src/styles/extension.css` (78 lines)
3. ✅ `public/examples/react-component.js.comments` (JSON)
4. ✅ `vite.config.extension.ts` (bundling config)

### To Modify:
1. 🔴 `src/app/globals.css` (add import)
2. 🔴 `src/components/Monaco/MonacoEditor.tsx` (integrate extension)
3. 🔴 `src/components/GitHubUI/EditorPane.tsx` (pass fileName)

### To Create:
1. 🔴 `e2e/extension-integration.spec.ts` (E2E tests)
2. 🔴 `public/examples/express-api.js.comments`
3. 🔴 `public/examples/typescript-interface.ts.comments`
4. 🔴 `public/examples/async-operations.ts.comments`
5. 🔴 `public/examples/python-class.py.comments`

---

## 🚀 Ready to Continue

**Current State:** Foundation in place, ready for integration

**Next Command:**
```bash
# Stop container to avoid file conflicts
cd demo-playground
docker-compose down

# Make remaining changes
# Then rebuild
docker-compose up --build
```

**Or continue with hot reload running** (files will auto-update)

---

**Estimated Time to Complete Phase 5:** 6-8 hours remaining
**Blockers:** None
**Dependencies:** None - all infrastructure in place

