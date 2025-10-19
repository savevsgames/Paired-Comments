/**
 * MCP protocol-specific type definitions
 */

export interface MCPError {
  code: number;
  message: string;
  data?: unknown;
}

export enum ErrorCode {
  ParseError = -32700,
  InvalidRequest = -32600,
  MethodNotFound = -32601,
  InvalidParams = -32602,
  InternalError = -32603,

  // Custom error codes
  FileNotFound = -32001,
  CommentNotFound = -32002,
  InvalidFilePath = -32003,
  FileAccessDenied = -32004,
  InvalidLineNumber = -32005,
  ASTParseError = -32006,
  CommentFileCorrupted = -32007,
}

// Using the SDK's expected response format directly
export type ToolResponse = {
  content: Array<{
    type: 'text' | 'resource';
    text?: string;
    resource?: {
      uri: string;
      mimeType: string;
      text: string;
    };
  }>;
  _meta?: Record<string, unknown>;
  isError?: boolean;
};

export interface ResourceContents {
  uri: string;
  mimeType: string;
  text: string;
}
