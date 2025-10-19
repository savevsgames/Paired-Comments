/**
 * Core type definitions for Paired Comments
 * Shared types between extension and MCP server
 */

export type CommentTag = 'TODO' | 'FIXME' | 'NOTE' | 'STAR' | 'QUESTION';

export type AnchorType =
  | 'function'
  | 'class'
  | 'method'
  | 'variable'
  | 'interface'
  | 'type'
  | 'import';

export interface AIMetadata {
  model: string;
  confidence: number;
  reasoning?: string;
  enrichedAt: string;
}

export interface ParamMetadata {
  name: string;
  type?: string;
  description?: string;
  example?: string;
}

export interface Comment {
  id: string;
  text: string;
  tag: CommentTag;
  author: string;
  created: string;
  updated: string;
  aiMeta?: AIMetadata;
  params?: ParamMetadata[];
}

export interface GhostMarker {
  id: string;
  commentId: string;
  line: number;
  anchor?: string;
  anchorType?: AnchorType;
  originalLine: number;
  isOrphaned?: boolean;
}

export interface FileMetadata {
  language?: string;
  lastSync?: string;
  totalComments?: number;
}

export interface CommentFile {
  version: string;
  filePath: string;
  comments: Comment[];
  ghostMarkers: GhostMarker[];
  metadata?: FileMetadata;
}

export interface AddCommentParams {
  filePath: string;
  line: number;
  text: string;
  tag: CommentTag;
  author?: string;
  aiMeta?: AIMetadata;
}

export interface AddCommentResult {
  commentId: string;
  ghostMarkerId: string;
  message: string;
}

export interface EditCommentParams {
  filePath: string;
  commentId: string;
  text: string;
}

export interface DeleteCommentParams {
  filePath: string;
  commentId: string;
}

export interface SearchFilters {
  tag?: CommentTag;
  author?: string;
  filePath?: string;
  hasAIMetadata?: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface SearchCommentParams {
  query: string;
  filters?: SearchFilters;
  limit?: number;
}

export interface SearchResult {
  comment: Comment;
  ghostMarker: GhostMarker;
  filePath: string;
  score: number;
}

export interface MoveCommentParams {
  sourceFile: string;
  targetFile: string;
  commentId: string;
  targetLine: number;
}

export interface ExportOptions {
  includeSourceContext?: boolean;
  contextLines?: number;
}

export interface ExportCommentsParams {
  format: 'json' | 'markdown' | 'jsonl' | 'parquet';
  filePath?: string;
  options?: ExportOptions;
}
