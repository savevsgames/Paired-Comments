/**
 * GhostMarkerManager - Manages ghost markers for automatic line tracking
 *
 * Ghost markers are invisible decorations that track comment positions
 * and automatically move with code edits. They use content anchoring
 * (hash-based verification) to detect drift and auto-reconcile.
 */

import * as vscode from 'vscode';
import { GhostMarker, ReconciliationResult } from '../types';
import { hashLine, getLineText } from '../utils/contentAnchor';

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

  constructor() {
    // Listen for document changes
    vscode.workspace.onDidChangeTextDocument(this.onDocumentChange, this);
  }

  /**
   * Create a new ghost marker for a line
   */
  createMarker(
    document: vscode.TextDocument,
    line: number,
    commentIds: string[]
  ): GhostMarker {
    // Get line text and context
    const lineText = getLineText(document, line);
    const prevLineText = line > 1 ? getLineText(document, line - 1) : '';
    const nextLineText = line < document.lineCount ? getLineText(document, line + 1) : '';

    if (!lineText) {
      throw new Error(`Invalid line number: ${line}`);
    }

    // Create ghost marker
    const marker: GhostMarker = {
      id: this.generateId(),
      line,
      commentIds,
      lineHash: hashLine(lineText),
      lineText: lineText.trim(),
      prevLineText: prevLineText?.trim() || '',
      nextLineText: nextLineText?.trim() || '',
      lastVerified: new Date().toISOString(),
    };

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
    if (!this.markers.has(key)) {
      this.markers.set(key, []);
    }
    this.markers.get(key)!.push(markerState);

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
   */
  getMarkerAtLine(uri: vscode.Uri, line: number): GhostMarker | undefined {
    const markers = this.getMarkers(uri);
    return markers.find(m => m.line === line);
  }

  /**
   * Update ghost marker line position
   */
  updateMarkerLine(
    document: vscode.TextDocument,
    markerId: string,
    newLine: number,
    editor?: vscode.TextEditor
  ): void {
    const key = document.uri.toString();
    const states = this.markers.get(key);
    if (!states) return;

    const markerState = states.find(m => m.id === markerId);
    if (!markerState) {
      return;
    }

    // Update line number
    markerState.line = newLine;

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

    const results: ReconciliationResult[] = [];

    for (const markerState of states) {
      const result = await this.verifyMarker(document, markerState);
      results.push(result);
    }

    return results;
  }

  /**
   * Verify a single ghost marker
   */
  private async verifyMarker(
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
    // Debounce verification
    if (this.verificationTimer) {
      clearTimeout(this.verificationTimer);
    }

    this.verificationTimer = setTimeout(() => {
      void this.verifyMarkers(event.document);
    }, this.verificationDelay);
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
