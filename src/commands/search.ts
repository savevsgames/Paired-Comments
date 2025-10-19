/**
 * Search Commands - Command handlers for comment search functionality
 */

import * as vscode from 'vscode';
import { SearchPanel } from '../ui/SearchPanel';
import { CommentSearchEngine } from '../features/CommentSearchEngine';
import { CommentManager } from '../core/CommentManager';

export function registerSearchCommands(
  context: vscode.ExtensionContext,
  searchEngine: CommentSearchEngine,
  commentManager: CommentManager
): void {
  // Command: pairedComments.search
  const searchCommand = vscode.commands.registerCommand(
    'pairedComments.search',
    () => {
      SearchPanel.createOrShow(context.extensionUri, searchEngine, commentManager);
    }
  );

  context.subscriptions.push(searchCommand);
}
