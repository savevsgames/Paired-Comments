'use client';

import {
  TextEditor,
  TextEditorDecorationType,
  DecorationOptions,
  QuickPickItem,
  InputBoxOptions,
  MessageItem,
} from './types';

/**
 * VS Code Window API Shim
 * Minimal browser implementation for notifications and UI interactions
 */

class Window {
  private activeTextEditor: TextEditor | undefined;
  private decorationTypes = new Map<string, TextEditorDecorationType>();
  private decorationCounter = 0;

  /**
   * Show information message (uses browser alert/console for now)
   */
  showInformationMessage(message: string, ...items: string[]): Promise<string | undefined>;
  showInformationMessage<T extends MessageItem>(message: string, ...items: T[]): Promise<T | undefined>;
  async showInformationMessage(message: string, ...items: any[]): Promise<any> {
    console.log('[VS Code] INFO:', message);

    // Simple browser-based dialog for demo
    if (items.length > 0) {
      const choice = confirm(`${message}\n\nOptions: ${items.map((i) => (typeof i === 'string' ? i : i.title)).join(', ')}`);
      return choice ? items[0] : undefined;
    }

    return undefined;
  }

  /**
   * Show warning message
   */
  showWarningMessage(message: string, ...items: string[]): Promise<string | undefined>;
  showWarningMessage<T extends MessageItem>(message: string, ...items: T[]): Promise<T | undefined>;
  async showWarningMessage(message: string, ...items: any[]): Promise<any> {
    console.warn('[VS Code] WARNING:', message);

    if (items.length > 0) {
      const choice = confirm(`⚠️ ${message}\n\nOptions: ${items.map((i) => (typeof i === 'string' ? i : i.title)).join(', ')}`);
      return choice ? items[0] : undefined;
    }

    return undefined;
  }

  /**
   * Show error message
   */
  showErrorMessage(message: string, ...items: string[]): Promise<string | undefined>;
  showErrorMessage<T extends MessageItem>(message: string, ...items: T[]): Promise<T | undefined>;
  async showErrorMessage(message: string, ...items: any[]): Promise<any> {
    console.error('[VS Code] ERROR:', message);

    if (items.length > 0) {
      const choice = confirm(`❌ ${message}\n\nOptions: ${items.map((i) => (typeof i === 'string' ? i : i.title)).join(', ')}`);
      return choice ? items[0] : undefined;
    }

    return undefined;
  }

  /**
   * Show quick pick (simple dropdown for now)
   */
  async showQuickPick(items: string[] | QuickPickItem[], options?: { placeHolder?: string }): Promise<string | QuickPickItem | undefined> {
    console.log('[VS Code] QuickPick:', items);

    const labels = items.map((item) => (typeof item === 'string' ? item : item.label));
    const choice = prompt(`${options?.placeHolder || 'Select an option'}\n\n${labels.map((label, i) => `${i + 1}. ${label}`).join('\n')}`);

    if (choice) {
      const index = parseInt(choice) - 1;
      if (index >= 0 && index < items.length) {
        return items[index];
      }
    }

    return undefined;
  }

  /**
   * Show input box
   */
  async showInputBox(options?: InputBoxOptions): Promise<string | undefined> {
    console.log('[VS Code] InputBox:', options);

    const result = prompt(options?.prompt || 'Enter value', options?.value || '');
    return result || undefined;
  }

  /**
   * Create text editor decoration type
   */
  createTextEditorDecorationType(options: {
    backgroundColor?: string;
    color?: string;
    gutterIconPath?: string;
    gutterIconSize?: string;
    overviewRulerColor?: string;
    before?: {
      contentText?: string;
      color?: string;
    };
    after?: {
      contentText?: string;
      color?: string;
    };
  }): TextEditorDecorationType {
    const key = `decoration-${this.decorationCounter++}`;
    const decorationType: TextEditorDecorationType = {
      key,
      dispose: () => {
        this.decorationTypes.delete(key);
      },
    };

    this.decorationTypes.set(key, decorationType);
    return decorationType;
  }

  /**
   * Get active text editor (Monaco editor integration point)
   */
  get activeEditor(): TextEditor | undefined {
    return this.activeTextEditor;
  }

  /**
   * Set active text editor (called by Monaco wrapper)
   */
  setActiveEditor(editor: TextEditor | undefined): void {
    this.activeTextEditor = editor;
  }

  /**
   * Set decorations on editor (gutter icons, highlights)
   */
  setDecorations(decorationType: TextEditorDecorationType, decorations: DecorationOptions[]): void {
    console.log('[VS Code] SetDecorations:', decorationType.key, decorations.length);
    // This will be wired to Monaco editor's decoration API
    // For now, just log it
  }
}

export const window = new Window();
