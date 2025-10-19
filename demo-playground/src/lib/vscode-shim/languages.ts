'use client';

import { CodeLensProvider, HoverProvider, TextDocument, CodeLens, Hover, Position } from './types';

/**
 * VS Code Languages API Shim
 * Handles language features like CodeLens and Hover providers
 */

class Languages {
  private codeLensProviders: Array<{
    provider: CodeLensProvider;
    selector: string | string[];
  }> = [];

  private hoverProviders: Array<{
    provider: HoverProvider;
    selector: string | string[];
  }> = [];

  /**
   * Register a CodeLens provider
   */
  registerCodeLensProvider(
    selector: string | string[],
    provider: CodeLensProvider
  ): { dispose(): void } {
    this.codeLensProviders.push({ provider, selector });
    console.log('[VS Code] CodeLens provider registered:', selector);

    return {
      dispose: () => {
        const index = this.codeLensProviders.findIndex((p) => p.provider === provider);
        if (index !== -1) {
          this.codeLensProviders.splice(index, 1);
        }
      },
    };
  }

  /**
   * Register a Hover provider
   */
  registerHoverProvider(
    selector: string | string[],
    provider: HoverProvider
  ): { dispose(): void } {
    this.hoverProviders.push({ provider, selector });
    console.log('[VS Code] Hover provider registered:', selector);

    return {
      dispose: () => {
        const index = this.hoverProviders.findIndex((p) => p.provider === provider);
        if (index !== -1) {
          this.hoverProviders.splice(index, 1);
        }
      },
    };
  }

  /**
   * Get CodeLens items for a document
   * Called by Monaco editor integration
   */
  async getCodeLenses(document: TextDocument): Promise<CodeLens[]> {
    const allLenses: CodeLens[] = [];

    for (const { provider, selector } of this.codeLensProviders) {
      // Check if provider matches document language
      const selectors = Array.isArray(selector) ? selector : [selector];
      const matches = selectors.some((s) => {
        if (typeof s === 'string') {
          return s === '*' || s === document.languageId;
        }
        return false;
      });

      if (matches) {
        try {
          const lenses = await provider.provideCodeLenses(document);
          if (lenses) {
            allLenses.push(...lenses);
          }
        } catch (error) {
          console.error('[VS Code] Error in CodeLens provider:', error);
        }
      }
    }

    return allLenses;
  }

  /**
   * Get Hover information for a position
   * Called by Monaco editor integration
   */
  async getHover(document: TextDocument, position: Position): Promise<Hover | null> {
    for (const { provider, selector } of this.hoverProviders) {
      // Check if provider matches document language
      const selectors = Array.isArray(selector) ? selector : [selector];
      const matches = selectors.some((s) => {
        if (typeof s === 'string') {
          return s === '*' || s === document.languageId;
        }
        return false;
      });

      if (matches) {
        try {
          const hover = await provider.provideHover(document, position);
          if (hover) {
            return hover;
          }
        } catch (error) {
          console.error('[VS Code] Error in Hover provider:', error);
        }
      }
    }

    return null;
  }
}

export const languages = new Languages();
