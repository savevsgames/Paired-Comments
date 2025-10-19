/**
 * Orphan Status Bar Item
 *
 * Displays count of orphaned comments in the status bar
 * Click to open orphan report
 *
 * v2.1.3
 */

import * as vscode from 'vscode';

export class OrphanStatusBar {
  private statusBarItem: vscode.StatusBarItem;
  private orphanCount: number = 0;

  constructor() {
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      100
    );
    this.statusBarItem.command = 'pairedComments.showOrphanReport';
    this.statusBarItem.tooltip = 'Click to view orphaned comments';
    this.statusBarItem.hide(); // Hidden until orphans are detected
  }

  /**
   * Update the orphan count and visibility
   */
  updateCount(count: number): void {
    this.orphanCount = count;

    if (count > 0) {
      this.statusBarItem.text = `$(warning) ${count} orphaned comment${count === 1 ? '' : 's'}`;
      this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
      this.statusBarItem.show();
    } else {
      this.statusBarItem.hide();
    }
  }

  /**
   * Get current orphan count
   */
  getCount(): number {
    return this.orphanCount;
  }

  /**
   * Dispose of the status bar item
   */
  dispose(): void {
    this.statusBarItem.dispose();
  }
}
