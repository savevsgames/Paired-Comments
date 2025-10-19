'use client';

/**
 * VS Code API Type Definitions (Minimal Subset)
 * Browser-compatible shim for extension integration
 */

export class Uri {
  constructor(
    public scheme: string,
    public authority: string,
    public path: string,
    public query: string,
    public fragment: string
  ) {}

  get fsPath(): string {
    return this.path;
  }

  static file(path: string): Uri {
    return new Uri('file', '', path, '', '');
  }

  static parse(value: string): Uri {
    const url = new URL(value);
    return new Uri(url.protocol.slice(0, -1), url.hostname, url.pathname, url.search.slice(1), url.hash.slice(1));
  }

  toString(): string {
    return `${this.scheme}://${this.authority}${this.path}${this.query ? '?' + this.query : ''}${this.fragment ? '#' + this.fragment : ''}`;
  }
}

export interface Position {
  line: number;
  character: number;
}

export interface Range {
  start: Position;
  end: Position;
}

export interface TextLine {
  text: string;
  lineNumber: number;
  range: Range;
}

export interface TextDocument {
  uri: Uri;
  fileName: string;
  languageId: string;
  version: number;
  getText(): string;
  lineAt(line: number): TextLine;
  lineCount: number;
  positionAt(offset: number): Position;
  offsetAt(position: Position): number;
  save(): Promise<boolean>;
}

export interface TextEditor {
  document: TextDocument;
  selection: Range;
  selections: Range[];
  visibleRanges: Range[];
  options: {
    tabSize: number;
    insertSpaces: boolean;
  };
}

export interface FileSystemProvider {
  readFile(uri: Uri): Promise<Uint8Array>;
  writeFile(uri: Uri, content: Uint8Array): Promise<void>;
  stat(uri: Uri): Promise<{ type: number; size: number; mtime: number }>;
  delete(uri: Uri): Promise<void>;
}

export interface CodeLens {
  range: Range;
  command?: {
    title: string;
    command: string;
    arguments?: any[];
  };
  isResolved: boolean;
}

export interface CodeLensProvider {
  provideCodeLenses(document: TextDocument): CodeLens[] | Promise<CodeLens[]>;
  resolveCodeLens?(codeLens: CodeLens): CodeLens | Promise<CodeLens>;
}

export interface Hover {
  contents: string[];
  range?: Range;
}

export interface HoverProvider {
  provideHover(document: TextDocument, position: Position): Hover | Promise<Hover | null> | null;
}

export interface DecorationOptions {
  range: Range;
  hoverMessage?: string | string[];
  renderOptions?: {
    before?: {
      contentText?: string;
      color?: string;
      backgroundColor?: string;
    };
    after?: {
      contentText?: string;
      color?: string;
    };
  };
}

export interface TextEditorDecorationType {
  key: string;
  dispose(): void;
}

export enum DiagnosticSeverity {
  Error = 0,
  Warning = 1,
  Information = 2,
  Hint = 3,
}

export interface Diagnostic {
  range: Range;
  message: string;
  severity: DiagnosticSeverity;
  source?: string;
  code?: string | number;
}

export interface QuickPickItem {
  label: string;
  description?: string;
  detail?: string;
}

export interface InputBoxOptions {
  prompt?: string;
  placeHolder?: string;
  value?: string;
  valueSelection?: [number, number];
}

export interface MessageItem {
  title: string;
  isCloseAffordance?: boolean;
}

export enum FileType {
  Unknown = 0,
  File = 1,
  Directory = 2,
  SymbolicLink = 64,
}
