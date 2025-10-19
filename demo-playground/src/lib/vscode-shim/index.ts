'use client';

/**
 * VS Code API Shim - Main Entry Point
 * Minimal browser-compatible implementation of VS Code Extension API
 * Used to run Paired Comments extension in demo playground
 */

import { workspace } from './workspace';
import { window } from './window';
import { languages } from './languages';
import { EventEmitter } from './events';

// Re-export all types
export * from './types';
export { EventEmitter };

// Main vscode namespace object (mimics VS Code API structure)
export const vscode = {
  workspace,
  window,
  languages,
  EventEmitter,

  // Enums
  DiagnosticSeverity: {
    Error: 0,
    Warning: 1,
    Information: 2,
    Hint: 3,
  },

  FileType: {
    Unknown: 0,
    File: 1,
    Directory: 2,
    SymbolicLink: 64,
  },

  // Helper to create Uri instances
  Uri: {
    file: (path: string) => {
      const { Uri } = require('./types');
      return Uri.file(path);
    },
    parse: (value: string) => {
      const { Uri } = require('./types');
      return Uri.parse(value);
    },
  },
};

// Make vscode available globally (for extension code)
if (typeof window !== 'undefined') {
  (window as any).vscode = vscode;
}

console.log('[VS Code Shim] Initialized');
