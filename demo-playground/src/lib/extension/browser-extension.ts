/**
 * Paired Comments Extension - Browser Entry Point
 *
 * Simplified browser-compatible version of the extension
 * Contains only core features needed for demo playground:
 * - Gutter icons (decorations)
 * - CodeLens links
 * - Ghost marker tracking
 * - Comment management
 */

import * as monaco from 'monaco-editor';

/**
 * Comment data structure
 */
export interface Comment {
  id: string;
  line: number;
  endLine?: number;
  author: string;
  text: string;
  tag: 'TODO' | 'NOTE' | 'FIXME' | 'STAR' | 'QUESTION';
  timestamp: string;
}

/**
 * Comment file structure
 */
export interface CommentFile {
  version: string;
  fileName: string;
  comments: Comment[];
}

/**
 * Browser-compatible Paired Comments Extension
 */
export class PairedCommentsExtension {
  private editor: monaco.editor.IStandaloneCodeEditor | null = null;
  private comments: Comment[] = [];
  private decorations: string[] = [];
  private codeLensProvider: monaco.IDisposable | null = null;

  /**
   * Initialize extension with Monaco editor instance
   */
  initialize(editor: monaco.editor.IStandaloneCodeEditor): void {
    console.log('[PairedComments] Initializing extension...');
    this.editor = editor;

    // Register providers
    this.registerCodeLensProvider();
    this.registerHoverProvider();

    console.log('[PairedComments] Extension initialized successfully');
  }

  /**
   * Load comments from comment file
   */
  loadComments(commentFile: CommentFile): void {
    console.log(`[PairedComments] Loading ${commentFile.comments.length} comments`);
    this.comments = commentFile.comments;
    this.updateDecorations();
  }

  /**
   * Update gutter icon decorations
   */
  private updateDecorations(): void {
    if (!this.editor) {
      return;
    }

    const model = this.editor.getModel();
    if (!model) {
      return;
    }

    const decorationOptions: monaco.editor.IModelDeltaDecoration[] = this.comments.map((comment) => ({
      range: new monaco.Range(comment.line, 1, comment.line, 1),
      options: {
        isWholeLine: false,
        glyphMarginClassName: this.getGutterIconClass(comment.tag),
        glyphMarginHoverMessage: { value: this.getHoverText(comment) },
        stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
      },
    }));

    this.decorations = this.editor.deltaDecorations(this.decorations, decorationOptions);

    console.log(`[PairedComments] Applied ${this.decorations.length} decorations`);
  }

  /**
   * Get CSS class for gutter icon based on tag
   */
  private getGutterIconClass(tag: string): string {
    const tagMap: Record<string, string> = {
      TODO: 'paired-comment-gutter-todo',
      NOTE: 'paired-comment-gutter-note',
      FIXME: 'paired-comment-gutter-fixme',
      STAR: 'paired-comment-gutter-star',
      QUESTION: 'paired-comment-gutter-question',
    };
    return tagMap[tag] || 'paired-comment-gutter-default';
  }

  /**
   * Get hover text for comment
   */
  private getHoverText(comment: Comment): string {
    return `**${comment.tag}** by ${comment.author}\n\n${comment.text}`;
  }

  /**
   * Register CodeLens provider for clickable comment links
   */
  private registerCodeLensProvider(): void {
    if (this.codeLensProvider) {
      this.codeLensProvider.dispose();
    }

    this.codeLensProvider = monaco.languages.registerCodeLensProvider('*', {
      provideCodeLenses: (model) => {
        const lenses: monaco.languages.CodeLens[] = this.comments.map((comment) => ({
          range: new monaco.Range(comment.line, 1, comment.line, 1),
          command: {
            id: 'pairedComments.showComment',
            title: `💬 ${comment.tag} comment by ${comment.author}`,
            arguments: [comment.id],
          },
        }));

        return { lenses, dispose: () => {} };
      },
    });

    console.log('[PairedComments] CodeLens provider registered');
  }

  /**
   * Register hover provider for comment previews
   */
  private registerHoverProvider(): void {
    monaco.languages.registerHoverProvider('*', {
      provideHover: (model, position) => {
        const comment = this.comments.find((c) => c.line === position.lineNumber);

        if (!comment) {
          return null;
        }

        return {
          range: new monaco.Range(position.lineNumber, 1, position.lineNumber, 1),
          contents: [
            { value: `**${comment.tag}** by ${comment.author}` },
            { value: comment.text },
            { value: `_${new Date(comment.timestamp).toLocaleString()}_` },
          ],
        };
      },
    });

    console.log('[PairedComments] Hover provider registered');
  }

  /**
   * Add a new comment
   */
  addComment(line: number, author: string, text: string, tag: Comment['tag']): void {
    const comment: Comment = {
      id: `comment-${Date.now()}`,
      line,
      author,
      text,
      tag,
      timestamp: new Date().toISOString(),
    };

    this.comments.push(comment);
    this.updateDecorations();

    console.log(`[PairedComments] Added comment at line ${line}`);
  }

  /**
   * Get all comments
   */
  getComments(): Comment[] {
    return [...this.comments];
  }

  /**
   * Dispose extension
   */
  dispose(): void {
    if (this.codeLensProvider) {
      this.codeLensProvider.dispose();
    }
    if (this.editor) {
      this.editor.deltaDecorations(this.decorations, []);
    }
    console.log('[PairedComments] Extension disposed');
  }
}

/**
 * Create and return extension instance
 */
export function createExtension(): PairedCommentsExtension {
  return new PairedCommentsExtension();
}
