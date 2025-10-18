/**
 * GhostMarkerManager - Manages ghost markers for automatic line tracking
 *
 * Ghost markers are invisible decorations that track comment positions
 * and automatically move with code edits. They use AST-based anchoring
 * (v2.0.5+) with line-based fallback for unsupported languages.
 */

import * as vscode from 'vscode';
import { GhostMarker, ReconciliationResult } from '../types';
import { hashLine, getLineText } from '../utils/contentAnchor';
import { ASTAnchorManager } from './ASTAnchorManager';

/**
 * Ghost marker with runtime decoration state
 */
interface GhostMarkerState extends GhostMarker {
  /** VS Code decoration type for this marker */
  decoration: vscode.TextEditorDecorationType;
  /** Current range in the editor */
  range?: vscode.Range;
}

export class GhostMarkerManager {
  /** Map of file URI → ghost markers */
  private markers: Map<string, GhostMarkerState[]> = new Map();

  /** Debounce timer for verification */
  private verificationTimer: NodeJS.Timeout | null = null;

  /** Verification debounce delay (ms) */
  private readonly verificationDelay = 500;

  /** AST anchor manager for semantic tracking */
  private astManager: ASTAnchorManager | null = null;

  constructor() {
    // Listen for document changes
    vscode.workspace.onDidChangeTextDocument(this.onDocumentChange, this);
  }

  /**
   * Set the AST anchor manager (called after initialization)
   */
  setASTManager(astManager: ASTAnchorManager): void {
    this.astManager = astManager;
  }

  /**
   * Create a new ghost marker for a line or range
   * Now with AST anchor support (v2.0.5+) and range support (v2.0.6+)
   */
  async createMarker(
    document: vscode.TextDocument,
    line: number,
    commentIds: string[],
    endLine?: number
  ): Promise<GhostMarker> {
    // Get line text and context
    const lineText = getLineText(document, line);
    const prevLineText = line > 1 ? getLineText(document, line - 1) : '';
    const nextLineText = line < document.lineCount ? getLineText(document, line + 1) : '';

    if (lineText === null) {
      throw new Error(`Invalid line number: ${line}`);
    }

    // For blank lines, use a placeholder (empty string is valid)
    const effectiveLineText = lineText || '[blank line]';

    // Try to create AST anchor if manager is available
    let astAnchor = null;
    if (this.astManager) {
      try {
        astAnchor = await this.astManager.createAnchor(document, line);
        if (astAnchor) {
          console.log(`[GhostMarker] Created AST anchor for line ${line}: ${astAnchor.symbolPath.join('.')}`);
        } else {
          console.log(`[GhostMarker] No symbol found at line ${line}, using line-based fallback`);
        }
      } catch (error) {
        console.error(`[GhostMarker] Failed to create AST anchor for line ${line}:`, error);
      }
    }

    // Create ghost marker
    const marker: GhostMarker = {
      id: this.generateId(),
      line,
      commentIds,
      endLine: endLine, // Range support (v2.0.6+) - undefined for single-line comments
      astAnchor: astAnchor, // May be null for non-symbolic lines or unsupported languages
      lineHash: hashLine(effectiveLineText),
      lineText: effectiveLineText.trim(),
      prevLineText: prevLineText?.trim() || '',
      nextLineText: nextLineText?.trim() || '',
      lastVerified: new Date().toISOString(),
    };

    // Log range creation if applicable
    if (endLine && endLine > line) {
      console.log(`[GhostMarker] Created range marker for lines ${line}-${endLine}`);
    }

    return marker;
  }

  /**
   * Add a ghost marker to tracking
   */
  addMarker(
    document: vscode.TextDocument,
    marker: GhostMarker,
    editor?: vscode.TextEditor
  ): void {
    const key = document.uri.toString();

    // Check for duplicate marker ID (prevent double-loading from file)
    if (!this.markers.has(key)) {
      this.markers.set(key, []);
    }

    const existingMarkers = this.markers.get(key)!;
    const isDuplicate = existingMarkers.some(m => m.id === marker.id);
    if (isDuplicate) {
      console.log(`[GhostMarkerManager] ⚠️ Skipping duplicate marker: ${marker.id} at line ${marker.line}`);
      return;
    }

    // Create decoration type (invisible, whole line)
    const decoration = vscode.window.createTextEditorDecorationType({
      isWholeLine: true,
      rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed,
      // Make it invisible but trackable
      before: {
        contentText: '',
        margin: '0',
      },
    });

    // Create marker state
    const markerState: GhostMarkerState = {
      ...marker,
      decoration,
    };

    // Add to map
    existingMarkers.push(markerState);

    // Apply decoration if editor is open
    if (editor) {
      this.applyDecoration(editor, markerState);
    }
  }

  /**
   * Apply decoration to editor
   */
  private applyDecoration(editor: vscode.TextEditor, marker: GhostMarkerState): void {
    const lineIndex = marker.line - 1; // Convert to 0-indexed
    const range = new vscode.Range(
      new vscode.Position(lineIndex, 0),
      new vscode.Position(lineIndex, 0)
    );

    marker.range = range;
    editor.setDecorations(marker.decoration, [range]);
  }

  /**
   * Get all ghost markers for a document
   */
  getMarkers(uri: vscode.Uri): GhostMarker[] {
    const key = uri.toString();
    const states = this.markers.get(key) || [];

    // Return plain markers without decoration state
    return states.map(({ decoration, range, ...marker }) => marker);
  }

  /**
   * Get ghost marker by ID
   */
  getMarkerById(uri: vscode.Uri, markerId: string): GhostMarker | undefined {
    const markers = this.getMarkers(uri);
    return markers.find(m => m.id === markerId);
  }

  /**
   * Get ghost marker at a specific line
   * For range markers, checks if line is within the range (start to end)
   */
  getMarkerAtLine(uri: vscode.Uri, line: number): GhostMarker | undefined {
    const markers = this.getMarkers(uri);
    return markers.find(m => {
      // Single-line marker: exact match
      if (!m.endLine) {
        return m.line === line;
      }
      // Range marker: check if line is within range (inclusive)
      return line >= m.line && line <= m.endLine;
    });
  }

  /**
   * Update ghost marker line position
   * For range markers, also update the end line
   */
  updateMarkerLine(
    document: vscode.TextDocument,
    markerId: string,
    newLine: number,
    editor?: vscode.TextEditor,
    newEndLine?: number
  ): void {
    const key = document.uri.toString();
    const states = this.markers.get(key);
    if (!states) return;

    const markerState = states.find(m => m.id === markerId);
    if (!markerState) {
      return;
    }

    // Update line number(s)
    markerState.line = newLine;
    if (newEndLine !== undefined) {
      markerState.endLine = newEndLine;
    }

    // Update hash and context
    const lineText = getLineText(document, newLine);
    const prevLineText = newLine > 1 ? getLineText(document, newLine - 1) : '';
    const nextLineText = newLine < document.lineCount ? getLineText(document, newLine + 1) : '';

    if (lineText) {
      markerState.lineHash = hashLine(lineText);
      markerState.lineText = lineText.trim();
      markerState.prevLineText = prevLineText?.trim() || '';
      markerState.nextLineText = nextLineText?.trim() || '';
      markerState.lastVerified = new Date().toISOString();
    }

    // Re-apply decoration
    if (editor) {
      this.applyDecoration(editor, markerState);
    }
  }

  /**
   * Remove a ghost marker
   */
  removeMarker(uri: vscode.Uri, markerId: string): void {
    const key = uri.toString();
    const states = this.markers.get(key);
    if (!states) return;

    const index = states.findIndex(m => m.id === markerId);
    if (index === -1) return;

    // Dispose decoration
    const markerState = states[index];
    if (markerState) {
      markerState.decoration.dispose();
    }

    // Remove from array
    states.splice(index, 1);
  }

  /**
   * Clear all ghost markers for a document
   */
  clearMarkers(uri: vscode.Uri): void {
    const key = uri.toString();
    const states = this.markers.get(key);
    if (!states) return;

    // Dispose all decorations
    for (const state of states) {
      state.decoration.dispose();
    }

    // Clear array
    this.markers.delete(key);
  }

  /**
   * Verify all ghost markers in a document
   */
  async verifyMarkers(document: vscode.TextDocument): Promise<ReconciliationResult[]> {
    const key = document.uri.toString();
    const states = this.markers.get(key);
    if (!states) return [];

    console.log(`[GhostMarkerManager] Verifying ${states.length} markers...`);

    const results: ReconciliationResult[] = [];

    for (const markerState of states) {
      console.log(`[GhostMarkerManager] Verifying marker at line ${markerState.line}...`);
      const result = await this.verifyMarker(document, markerState);
      console.log(`[GhostMarkerManager] Result: ${result.status} - ${result.reason}`);
      if (result.oldLine && result.newLine) {
        console.log(`[GhostMarkerManager] Marker moved: ${result.oldLine} → ${result.newLine}`);
      }
      results.push(result);
    }

    console.log(`[GhostMarkerManager] Verification complete. Results:`, results.map(r => r.status));

    return results;
  }

  /**
   * Verify a single ghost marker
   * Uses AST resolution if available, falls back to line-based
   */
  private async verifyMarker(
    document: vscode.TextDocument,
    markerState: GhostMarkerState
  ): Promise<ReconciliationResult> {
    // Try AST-based resolution first (v2.0.5+)
    if (markerState.astAnchor && this.astManager) {
      const astResult = await this.verifyMarkerWithAST(document, markerState);
      if (astResult) {
        return astResult;
      }
      // AST failed, fall through to line-based verification
      console.log(`[GhostMarker] AST verification failed for marker ${markerState.id}, falling back to line-based`);
    }

    // Line-based verification (v2.0 fallback)
    return await this.verifyMarkerWithLine(document, markerState);
  }

  /**
   * Verify marker using AST anchor resolution
   */
  private async verifyMarkerWithAST(
    document: vscode.TextDocument,
    markerState: GhostMarkerState
  ): Promise<ReconciliationResult | null> {
    if (!markerState.astAnchor || !this.astManager) {
      return null;
    }

    try {
      const resolution = await this.astManager.resolveAnchor(document, markerState.astAnchor);

      if (resolution.confidence === 'exact' && resolution.line) {
        // Symbol found at exact location
        const oldLine = markerState.line;
        const newLine = resolution.line;

        if (oldLine === newLine) {
          // Still at same line - verify hash
          const currentLineText = getLineText(document, newLine);
          if (currentLineText) {
            const currentHash = hashLine(currentLineText);
            if (currentHash === markerState.lineHash) {
              markerState.lastVerified = new Date().toISOString();
              return {
                status: 'valid',
                reason: 'ast-exact-match',
              };
            } else {
              // Line moved or content changed slightly - update
              markerState.lineHash = currentHash;
              markerState.lineText = currentLineText.trim();
              markerState.lastVerified = new Date().toISOString();
              return {
                status: 'auto-fixed',
                reason: 'ast-content-updated',
              };
            }
          }
        } else {
          // Symbol moved to different line - update marker
          console.log(`[GhostMarker] AST resolved: marker moved from line ${oldLine} → ${newLine}`);
          markerState.line = newLine;

          // Update hash and context
          const lineText = getLineText(document, newLine);
          const prevLineText = newLine > 1 ? getLineText(document, newLine - 1) : '';
          const nextLineText = getLineText(document, newLine + 1);

          if (lineText) {
            markerState.lineHash = hashLine(lineText);
            markerState.lineText = lineText.trim();
            markerState.prevLineText = prevLineText?.trim() || '';
            markerState.nextLineText = nextLineText?.trim() || '';
            markerState.lastVerified = new Date().toISOString();
          }

          // CRITICAL: Refresh the decoration at the new location!
          const editor = vscode.window.activeTextEditor;
          if (editor && editor.document === document) {
            console.log(`[GhostMarker] Refreshing decoration at new location (line ${newLine})`);
            this.applyDecoration(editor, markerState);
          }

          return {
            status: 'auto-fixed',
            reason: 'ast-symbol-moved',
            oldLine: oldLine,
            newLine: newLine,
          };
        }
      } else if (resolution.confidence === 'moved' && resolution.line) {
        // Symbol found but at different location (less confident)
        return {
          status: 'needs-review',
          reason: 'ast-ambiguous-move',
          suggestedLine: resolution.line,
          marker: markerState,
        };
      } else if (resolution.confidence === 'ambiguous' && resolution.line) {
        // Multiple symbols match - needs review
        return {
          status: 'needs-review',
          reason: 'ast-multiple-matches',
          suggestedLine: resolution.line,
          marker: markerState,
        };
      } else {
        // Symbol not found - may have been deleted or renamed
        return {
          status: 'needs-manual-fix',
          reason: 'ast-symbol-not-found',
          marker: markerState,
        };
      }
    } catch (error) {
      console.error(`[GhostMarker] AST verification error:`, error);
      return null; // Fall back to line-based
    }

    return null;
  }

  /**
   * Verify marker using line-based hash comparison (v2.0 fallback)
   */
  private async verifyMarkerWithLine(
    document: vscode.TextDocument,
    markerState: GhostMarkerState
  ): Promise<ReconciliationResult> {
    // Check if line number is still valid
    if (markerState.line < 1 || markerState.line > document.lineCount) {
      return {
        status: 'needs-manual-fix',
        reason: 'line-out-of-bounds',
        marker: markerState,
      };
    }

    // Get current line text
    const currentLineText = getLineText(document, markerState.line);
    if (!currentLineText) {
      return {
        status: 'needs-manual-fix',
        reason: 'line-not-found',
        marker: markerState,
      };
    }

    // Verify hash
    const currentHash = hashLine(currentLineText);
    if (currentHash === markerState.lineHash) {
      // ✅ Hash matches - all good!
      markerState.lastVerified = new Date().toISOString();
      return {
        status: 'valid',
        reason: 'hash-match',
      };
    }

    // Hash mismatch - check if just whitespace changed
    if (currentLineText.trim() === markerState.lineText.trim()) {
      // ✅ Just whitespace changed - update hash
      markerState.lineHash = currentHash;
      markerState.lineText = currentLineText.trim();
      markerState.lastVerified = new Date().toISOString();

      return {
        status: 'auto-fixed',
        reason: 'whitespace-change',
      };
    }

    // Content changed - try to reconcile
    return await this.reconcileMarker(document, markerState);
  }

  /**
   * Reconcile a drifted ghost marker
   */
  private async reconcileMarker(
    document: vscode.TextDocument,
    markerState: GhostMarkerState
  ): Promise<ReconciliationResult> {
    const searchRadius = 10;
    const originalLine = markerState.line;

    // Search nearby lines for 3-line fingerprint match
    const startLine = Math.max(1, originalLine - searchRadius);
    const endLine = Math.min(document.lineCount, originalLine + searchRadius);

    for (let i = startLine; i <= endLine; i++) {
      const currText = getLineText(document, i);
      const prevText = i > 1 ? getLineText(document, i - 1) : '';
      const nextText = i < document.lineCount ? getLineText(document, i + 1) : '';

      if (!currText) continue;

      // Check 3-line fingerprint match
      if (
        currText.trim() === markerState.lineText &&
        (prevText?.trim() || '') === markerState.prevLineText &&
        (nextText?.trim() || '') === markerState.nextLineText
      ) {
        // ✅ Found exact 3-line match!
        const newLine = i;
        markerState.line = newLine;
        markerState.lineHash = hashLine(currText);
        markerState.lastVerified = new Date().toISOString();

        return {
          status: 'auto-fixed',
          reason: 'found-drift',
          oldLine: originalLine,
          newLine: newLine,
        };
      }
    }

    // Try 1-line match as fallback
    for (let i = startLine; i <= endLine; i++) {
      const currText = getLineText(document, i);
      if (currText && currText.trim() === markerState.lineText) {
        // ⚠️ Found 1-line match (less confident)
        return {
          status: 'needs-review',
          reason: 'partial-match',
          suggestedLine: i,
          marker: markerState,
        };
      }
    }

    // No match found
    return {
      status: 'needs-manual-fix',
      reason: 'no-match-found',
      marker: markerState,
    };
  }

  /**
   * Handle document change events
   */
  private onDocumentChange(event: vscode.TextDocumentChangeEvent): void {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('[GhostMarkerManager] Document changed:', event.document.uri.fsPath);
    console.log('[GhostMarkerManager] Changes:', event.contentChanges.length);

    // Log current marker positions BEFORE update
    const key = event.document.uri.toString();
    const states = this.markers.get(key);
    if (states && states.length > 0) {
      console.log('[GhostMarkerManager] Markers BEFORE update:');
      states.forEach(m => {
        console.log(`  - Marker ${m.id}: line ${m.line}, text: "${m.lineText}"`);
      });
    }

    // Update ghost marker line numbers based on text changes
    this.updateMarkerPositions(event);

    // Log marker positions AFTER update
    if (states && states.length > 0) {
      console.log('[GhostMarkerManager] Markers AFTER update:');
      states.forEach(m => {
        console.log(`  - Marker ${m.id}: line ${m.line}, text: "${m.lineText}"`);
      });
    }

    // Debounce verification
    if (this.verificationTimer) {
      clearTimeout(this.verificationTimer);
    }

    this.verificationTimer = setTimeout(() => {
      console.log('[GhostMarkerManager] Running verification...');
      void this.verifyMarkers(event.document);
    }, this.verificationDelay);
  }

  /**
   * Update ghost marker positions based on document changes
   */
  private updateMarkerPositions(event: vscode.TextDocumentChangeEvent): void {
    const key = event.document.uri.toString();
    const states = this.markers.get(key);
    if (!states || states.length === 0) {
      console.log('[GhostMarkerManager] No markers to update');
      return;
    }

    console.log('[GhostMarkerManager] Processing changes...');

    // Process each change
    for (let i = 0; i < event.contentChanges.length; i++) {
      const change = event.contentChanges[i];
      if (!change) continue;

      const startLine = change.range.start.line + 1; // Convert to 1-indexed
      const endLine = change.range.end.line + 1;
      const newText = change.text;

      // Count lines added/removed
      const linesRemoved = endLine - startLine + 1;
      const linesAdded = newText.split('\n').length;
      const lineDelta = linesAdded - linesRemoved;

      console.log(`[GhostMarkerManager] Change #${i + 1}:`);
      console.log(`  Range: line ${startLine}-${endLine} (${linesRemoved} lines)`);
      console.log(`  New text: ${linesAdded} lines`);
      console.log(`  Delta: ${lineDelta > 0 ? '+' : ''}${lineDelta}`);
      console.log(`  Text preview: "${newText.substring(0, 50)}${newText.length > 50 ? '...' : ''}"`);

      // Detect copy/paste of code with ghost markers
      // Check if lines were added (not just replaced) and the text is substantial
      if (lineDelta > 0 && newText.trim().length > 20) {
        console.log(`  📋 Potential paste detected (${lineDelta} lines added), checking for copied markers...`);
        this.detectAndHandleCopiedMarkers(event.document, startLine, newText);
      }

      // Update markers that come after this change
      let markersShifted = 0;
      let markersNeedingVerification = false;

      for (const markerState of states) {
        if (markerState.line > endLine) {
          // Marker is after the change - shift it (and shift endLine if it's a range)
          const oldLine = markerState.line;
          markerState.line += lineDelta;
          if (markerState.endLine) {
            markerState.endLine += lineDelta;
          }
          console.log(`  ✓ Shifted marker "${markerState.lineText.substring(0, 30)}..." from line ${oldLine} → ${markerState.line}${markerState.endLine ? ` (range to ${markerState.endLine})` : ''}`);
          markersShifted++;
        } else if (markerState.line >= startLine && markerState.line <= endLine) {
          // Marker is INSIDE the changed range - this is the problem case!
          console.log(`  ⚠️ WARNING: Marker at line ${markerState.line} is INSIDE change range ${startLine}-${endLine}!`);
          console.log(`     Marker text: "${markerState.lineText}"`);
          console.log(`     This marker needs IMMEDIATE AST resolution!`);
          markersNeedingVerification = true;
        }
      }

      if (markersShifted === 0) {
        console.log(`  No markers shifted (all before line ${endLine})`);
      }

      // If markers are in the change range, trigger priority verification
      if (markersNeedingVerification) {
        console.log('[GhostMarkerManager] 🚨 Markers in deleted range - triggering PRIORITY verification!');
        void vscode.window.showInformationMessage('🚨 Ghost marker in deleted range - running AST verification...');
        // Clear any pending verification
        if (this.verificationTimer) {
          clearTimeout(this.verificationTimer);
        }
        // Run verification after a short delay (100ms) to let document settle, but faster than normal debounce
        this.verificationTimer = setTimeout(() => {
          console.log('[GhostMarkerManager] Running priority verification after document settled...');
          void this.verifyMarkers(event.document);
        }, 100);
        return; // Skip the normal debounced verification
      }
    }

    // Refresh decorations
    const editor = vscode.window.activeTextEditor;
    if (editor && editor.document.uri.toString() === key) {
      console.log('[GhostMarkerManager] Refreshing decorations...');
      this.refreshDecorations(editor);
    }
  }

  /**
   * Refresh decorations for a document
   */
  refreshDecorations(editor: vscode.TextEditor): void {
    const key = editor.document.uri.toString();
    const states = this.markers.get(key);
    if (!states) return;

    for (const markerState of states) {
      this.applyDecoration(editor, markerState);
    }
  }

  /**
   * Detect and handle copied ghost markers (copy/paste detection)
   * When code is copied (not cut), we need to create new ghost markers for the pasted code
   */
  private detectAndHandleCopiedMarkers(
    document: vscode.TextDocument,
    pasteStartLine: number,
    pastedText: string
  ): void {
    console.log(`[GhostMarkerManager] 📋 Checking for copied ghost markers at line ${pasteStartLine}...`);

    const key = document.uri.toString();
    const states = this.markers.get(key);
    if (!states) return;

    const pastedLines = pastedText.split('\n');
    const duplicates: Array<{ originalMarker: GhostMarkerState; newLine: number }> = [];

    // Check each pasted line against existing markers
    for (let i = 0; i < pastedLines.length; i++) {
      const pastedLine = pastedLines[i];
      if (!pastedLine) continue;

      const pastedLineNumber = pasteStartLine + i;
      const pastedHash = hashLine(pastedLine);

      // Check if this line matches an existing marker's hash
      for (const markerState of states) {
        // Skip if this is the same line (not a copy)
        if (markerState.line === pastedLineNumber) {
          continue;
        }

        // Check if the pasted line matches the marker's line hash
        if (pastedHash === markerState.lineHash) {
          console.log(`[GhostMarkerManager] 🔍 Found copied marker! Line ${markerState.line} → ${pastedLineNumber}`);
          console.log(`  Original text: "${markerState.lineText}"`);
          console.log(`  Pasted text: "${pastedLine.trim()}"`);

          duplicates.push({
            originalMarker: markerState,
            newLine: pastedLineNumber
          });
        }
      }
    }

    // If we found duplicates, create new ghost markers for the pasted code
    if (duplicates.length > 0) {
      console.log(`[GhostMarkerManager] ⚠️ Detected ${duplicates.length} copied ghost marker(s)!`);
      console.log(`[GhostMarkerManager] Creating NEW ghost markers for pasted code...`);

      // We can't create comments here (that's CommentManager's job)
      // But we CAN create the ghost markers and associate them with the same comment IDs
      // This will make the gutter icon appear on BOTH locations
      for (const { originalMarker, newLine } of duplicates) {
        console.log(`[GhostMarkerManager] Creating duplicate marker at line ${newLine} (original at ${originalMarker.line})`);

        // Create a NEW ghost marker with a NEW ID but same comment IDs
        const newMarker: GhostMarker = {
          id: this.generateId(), // NEW ID
          line: newLine,
          commentIds: [...originalMarker.commentIds], // Same comments
          astAnchor: originalMarker.astAnchor ? {
            ...originalMarker.astAnchor,
            // Keep same AST anchor - both instances are the same symbol
          } : null,
          lineHash: originalMarker.lineHash,
          lineText: originalMarker.lineText,
          prevLineText: '', // Context will be different
          nextLineText: '',
          lastVerified: new Date().toISOString(),
        };

        // Add to tracking
        const key = document.uri.toString();
        const states = this.markers.get(key);
        if (states) {
          const decoration = vscode.window.createTextEditorDecorationType({
            isWholeLine: true,
            rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed,
            before: {
              contentText: '',
              margin: '0',
            },
          });

          const markerState: GhostMarkerState = {
            ...newMarker,
            decoration,
          };

          states.push(markerState);

          // Apply decoration if editor is open
          const editor = vscode.window.activeTextEditor;
          if (editor && editor.document === document) {
            this.applyDecoration(editor, markerState);
          }

          console.log(`[GhostMarkerManager] ✅ Created duplicate marker ${newMarker.id} at line ${newLine}`);
        }
      }

      // Show info notification
      void vscode.window.showInformationMessage(
        `📋 Copied code with ${duplicates.length} comment(s). New ghost markers created at pasted location.`,
        'OK'
      );

      // Trigger decoration refresh
      const editor = vscode.window.activeTextEditor;
      if (editor && editor.document === document) {
        console.log('[GhostMarkerManager] Refreshing decorations after copy...');
        this.refreshDecorations(editor);
      }
    }
  }

  /**
   * Generate unique ID for ghost marker
   */
  private generateId(): string {
    return 'gm-' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
  }

  /**
   * Dispose all resources
   */
  dispose(): void {
    // Clear all markers
    for (const [_, states] of this.markers) {
      for (const state of states) {
        state.decoration.dispose();
      }
    }
    this.markers.clear();

    // Clear timer
    if (this.verificationTimer) {
      clearTimeout(this.verificationTimer);
    }
  }
}
