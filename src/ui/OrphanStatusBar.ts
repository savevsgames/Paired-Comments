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
  private localCount: number = 0;
  private globalCount: number = 0;

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
   * @param localCount - Orphans in current file
   * @param globalCount - Optional total orphans across all files (defaults to localCount if not provided)
   */
  updateCount(localCount: number, globalCount?: number): void {
    this.localCount = localCount;
    this.globalCount = globalCount ?? localCount;

    const totalCount = this.globalCount;

    if (totalCount > 0) {
      // Show context-aware messaging based on whether we have global data
      if (globalCount !== undefined && globalCount !== localCount) {
        // We have both global and local counts, and they differ
        this.statusBarItem.text = `$(warning) Orphans: ${globalCount} global / ${localCount} local`;
        this.statusBarItem.tooltip = `${globalCount} orphaned comment${globalCount === 1 ? '' : 's'} across workspace, ${localCount} in current file\nClick to view report`;
      } else {
        // Only showing local count (legacy behavior)
        this.statusBarItem.text = `$(warning) ${totalCount} orphaned comment${totalCount === 1 ? '' : 's'}`;
        this.statusBarItem.tooltip = `${totalCount} orphaned comment${totalCount === 1 ? '' : 's'} in current file\nClick to view report`;
      }
      this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
      this.statusBarItem.show();
    } else {
      this.statusBarItem.hide();
    }
  }

  /**
   * Get current local orphan count (current file)
   */
  getLocalCount(): number {
    return this.localCount;
  }

  /**
   * Get current global orphan count (all files)
   */
  getGlobalCount(): number {
    return this.globalCount;
  }

  /**
   * Get current orphan count (legacy - returns global count)
   */
  getCount(): number {
    return this.globalCount;
  }

  /**
   * Dispose of the status bar item
   */
  dispose(): void {
    this.statusBarItem.dispose();
  }
}
