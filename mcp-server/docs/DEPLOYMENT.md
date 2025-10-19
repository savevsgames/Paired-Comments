# MCP Server Deployment Guide

**Version:** 0.1.0
**Status:** 📋 Planning Phase
**Last Updated:** October 19, 2025

---

## Table of Contents

1. [Overview](#overview)
2. [Docker Deployment](#docker-deployment)
3. [npm Package](#npm-package)
4. [Local Development](#local-development)
5. [Production Deployment](#production-deployment)
6. [CI/CD Pipeline](#cicd-pipeline)

---

## Overview

The MCP server can be deployed in multiple ways:

1. **npm Global Install** - Easiest for end users (Claude Desktop, VS Code)
2. **Docker Container** - Isolated, reproducible environment
3. **Local Development** - Direct execution via `npm run dev`
4. **Production Server** - Long-running process (future: HTTP/WebSocket)

---

## Docker Deployment

### Dockerfile

Create `mcp-server/Dockerfile`:

```dockerfile
# Multi-stage build for optimized production image

# Stage 1: Builder
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json tsconfig.json ./

# Install ALL dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY src/ ./src/

# Build TypeScript to JavaScript
RUN npm run build

# Stage 2: Production
FROM node:20-alpine AS runner

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install only production dependencies
RUN npm ci --omit=dev

# Copy built JavaScript from builder
COPY --from=builder /app/dist ./dist

# Create non-root user for security
RUN addgroup -g 1001 -S mcpserver && \
    adduser -S mcpserver -u 1001

USER mcpserver

# Expose port (for future HTTP mode)
EXPOSE 3001

# Default to stdio mode (for MCP protocol)
CMD ["node", "dist/server.js"]
```

### Docker Compose

Create `mcp-server/docker-compose.yml`:

```yaml
version: '3.8'

services:
  mcp-server:
    build:
      context: .
      dockerfile: Dockerfile
      target: runner
    container_name: paired-comments-mcp-server
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - WORKSPACE_PATH=/workspace
      - LOG_LEVEL=info
    volumes:
      # Mount workspace directory
      - ${WORKSPACE_PATH:-./test-workspace}:/workspace:ro
      # Mount cache directory (for search index, etc.)
      - mcp-cache:/app/.cache
    # stdin_open and tty required for stdio mode
    stdin_open: true
    tty: true
    # For future HTTP mode:
    # ports:
    #   - "3001:3001"
    healthcheck:
      test: ["CMD", "node", "-e", "process.exit(0)"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  mcp-cache:
    driver: local
```

### Build and Run

```bash
# Build Docker image
docker build -t paired-comments-mcp-server:latest .

# Run with Docker Compose
WORKSPACE_PATH=/path/to/your/code docker-compose up -d

# View logs
docker-compose logs -f mcp-server

# Stop server
docker-compose down
```

### Docker for Development

Create `docker-compose.dev.yml`:

```yaml
version: '3.8'

services:
  mcp-server-dev:
    build:
      context: .
      dockerfile: Dockerfile
      target: builder  # Use builder stage with all deps
    container_name: paired-comments-mcp-dev
    environment:
      - NODE_ENV=development
      - WORKSPACE_PATH=/workspace
      - LOG_LEVEL=debug
    volumes:
      - ./src:/app/src:ro          # Live reload source
      - ./test:/app/test:ro         # Mount tests
      - ${WORKSPACE_PATH:-./test-workspace}:/workspace
    command: npm run dev             # Run with ts-node + watch mode
    stdin_open: true
    tty: true
```

---

## npm Package

### Package Configuration

Update `mcp-server/package.json`:

```json
{
  "name": "@paired-comments/mcp-server",
  "version": "0.1.0",
  "description": "Model Context Protocol server for Paired Comments - AI-accessible code annotation",
  "main": "dist/server.js",
  "bin": {
    "paired-comments-mcp": "dist/server.js"
  },
  "scripts": {
    "build": "tsc",
    "dev": "tsx watch src/server.ts",
    "start": "node dist/server.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "lint": "eslint src --ext .ts",
    "prepublishOnly": "npm run build"
  },
  "keywords": [
    "mcp",
    "model-context-protocol",
    "paired-comments",
    "ai",
    "code-annotation",
    "claude",
    "gpt",
    "llm"
  ],
  "author": "Paired Comments Team",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/paired-comments/extension.git",
    "directory": "mcp-server"
  },
  "files": [
    "dist",
    "README.md",
    "LICENSE"
  ],
  "engines": {
    "node": ">=18.0.0"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^0.5.0",
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "typescript": "^5.3.0",
    "tsx": "^4.7.0",
    "jest": "^29.7.0",
    "@types/jest": "^29.5.0",
    "eslint": "^8.56.0",
    "@typescript-eslint/eslint-plugin": "^6.15.0",
    "@typescript-eslint/parser": "^6.15.0"
  }
}
```

### Publishing to npm

```bash
# 1. Build the package
cd mcp-server
npm run build

# 2. Test locally first
npm link
npx paired-comments-mcp

# 3. Login to npm (first time only)
npm login

# 4. Publish
npm publish --access public

# For beta releases
npm publish --tag beta
```

### Using Published Package

#### Global Installation
```bash
# Install globally
npm install -g @paired-comments/mcp-server

# Run directly
paired-comments-mcp
```

#### Claude Desktop Configuration
```json
{
  "mcpServers": {
    "paired-comments": {
      "command": "npx",
      "args": ["-y", "@paired-comments/mcp-server"],
      "env": {
        "WORKSPACE_PATH": "/Users/username/projects/my-app"
      }
    }
  }
}
```

#### VS Code Extension Integration
```typescript
const transport = new StdioClientTransport({
  command: 'npx',
  args: ['-y', '@paired-comments/mcp-server'],
  env: {
    WORKSPACE_PATH: workspaceRoot
  }
});
```

---

## Local Development

### Setup

```bash
# Clone repository
git clone https://github.com/paired-comments/extension.git
cd extension/mcp-server

# Install dependencies
npm install

# Create test workspace
mkdir test-workspace
cd test-workspace
echo "console.log('test');" > app.js
```

### Running in Development Mode

```bash
# Run with auto-reload
npm run dev

# Run with debugging
NODE_OPTIONS='--inspect' npm run dev

# Run tests in watch mode
npm run test:watch
```

### Environment Variables

Create `.env` file (for local development):

```bash
# Workspace path
WORKSPACE_PATH=/path/to/test/workspace

# Logging
LOG_LEVEL=debug
LOG_FILE=./logs/mcp-server.log

# Feature flags
ENABLE_CACHE=true
ENABLE_AST_PARSING=true

# Performance tuning
CACHE_TTL=300
MAX_SEARCH_RESULTS=1000
```

Load in `src/server.ts`:

```typescript
import dotenv from 'dotenv';
dotenv.config();

const config = {
  workspacePath: process.env.WORKSPACE_PATH || process.cwd(),
  logLevel: process.env.LOG_LEVEL || 'info',
  enableCache: process.env.ENABLE_CACHE === 'true',
};
```

### Testing with MCP Inspector

```bash
# Install MCP Inspector
npm install -g @modelcontextprotocol/inspector

# Run MCP server with inspector
npx @modelcontextprotocol/inspector node dist/server.js

# Opens web UI at http://localhost:5173
```

---

## Production Deployment

### systemd Service (Linux)

Create `/etc/systemd/system/paired-comments-mcp.service`:

```ini
[Unit]
Description=Paired Comments MCP Server
After=network.target

[Service]
Type=simple
User=mcpserver
WorkingDirectory=/opt/paired-comments-mcp
ExecStart=/usr/bin/node /opt/paired-comments-mcp/dist/server.js
Restart=on-failure
RestartSec=10
StandardInput=tty
StandardOutput=journal
StandardError=journal
Environment="NODE_ENV=production"
Environment="WORKSPACE_PATH=/var/workspaces"
Environment="LOG_LEVEL=info"

[Install]
WantedBy=multi-user.target
```

```bash
# Enable and start service
sudo systemctl enable paired-comments-mcp
sudo systemctl start paired-comments-mcp

# View logs
sudo journalctl -u paired-comments-mcp -f
```

### PM2 (Process Manager)

```bash
# Install PM2
npm install -g pm2

# Start MCP server with PM2
pm2 start dist/server.js \
  --name paired-comments-mcp \
  --interpreter node \
  --env production

# Save PM2 configuration
pm2 save

# Auto-start on system boot
pm2 startup

# Monitor
pm2 logs paired-comments-mcp
pm2 monit
```

### Docker Swarm / Kubernetes (Future)

For multi-instance deployment (when HTTP mode is added):

**docker-compose.prod.yml**
```yaml
version: '3.8'

services:
  mcp-server:
    image: paired-comments-mcp-server:latest
    deploy:
      replicas: 3
      restart_policy:
        condition: on-failure
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
    environment:
      - NODE_ENV=production
      - WORKSPACE_PATH=/workspace
    volumes:
      - workspace:/workspace:ro
```

---

## CI/CD Pipeline

### GitHub Actions Workflow

Create `.github/workflows/mcp-server.yml`:

```yaml
name: MCP Server CI/CD

on:
  push:
    branches: [main, develop]
    paths:
      - 'mcp-server/**'
  pull_request:
    branches: [main]
    paths:
      - 'mcp-server/**'

jobs:
  test:
    name: Test
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: mcp-server/package-lock.json

      - name: Install dependencies
        working-directory: mcp-server
        run: npm ci

      - name: Lint
        working-directory: mcp-server
        run: npm run lint

      - name: Build
        working-directory: mcp-server
        run: npm run build

      - name: Run tests
        working-directory: mcp-server
        run: npm test

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./mcp-server/coverage/lcov.info

  build-docker:
    name: Build Docker Image
    runs-on: ubuntu-latest
    needs: test

    steps:
      - uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to Docker Hub
        if: github.event_name != 'pull_request'
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: ./mcp-server
          push: ${{ github.event_name != 'pull_request' }}
          tags: |
            paired-comments/mcp-server:latest
            paired-comments/mcp-server:${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  publish-npm:
    name: Publish to npm
    runs-on: ubuntu-latest
    needs: test
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'

      - name: Install dependencies
        working-directory: mcp-server
        run: npm ci

      - name: Build
        working-directory: mcp-server
        run: npm run build

      - name: Publish to npm
        working-directory: mcp-server
        run: npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

### Release Workflow

Create `.github/workflows/release.yml`:

```yaml
name: Release

on:
  push:
    tags:
      - 'mcp-v*.*.*'

jobs:
  release:
    name: Create Release
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Create GitHub Release
        uses: softprops/action-gh-release@v1
        with:
          name: MCP Server ${{ github.ref_name }}
          body: |
            ## What's Changed

            See [CHANGELOG.md](./mcp-server/CHANGELOG.md) for details.

            ## Installation

            ```bash
            npm install -g @paired-comments/mcp-server@${{ github.ref_name }}
            ```

            ## Docker

            ```bash
            docker pull paired-comments/mcp-server:${{ github.ref_name }}
            ```
          draft: false
          prerelease: false
```

---

## Monitoring and Logging

### Structured Logging

```typescript
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname'
    }
  }
});

logger.info({ event: 'server:start' }, 'MCP server started');
logger.debug({ filePath: 'src/app.ts' }, 'Loading comment file');
logger.error({ error: err }, 'Failed to parse AST');
```

### Health Check Endpoint (Future HTTP Mode)

```typescript
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    version: '0.1.0',
    uptime: process.uptime(),
    workspace: config.workspacePath
  });
});
```

### Metrics (Future)

```typescript
import { Counter, Histogram } from 'prom-client';

const commentOperations = new Counter({
  name: 'mcp_comment_operations_total',
  help: 'Total comment operations',
  labelNames: ['operation']
});

const operationDuration = new Histogram({
  name: 'mcp_operation_duration_seconds',
  help: 'Duration of MCP operations',
  labelNames: ['tool']
});

// Usage
commentOperations.inc({ operation: 'add' });
const timer = operationDuration.startTimer({ tool: 'add_comment' });
// ... perform operation
timer();
```

---

## Security Considerations

### File System Sandboxing

```typescript
import path from 'path';

function validatePath(filePath: string, workspaceRoot: string): void {
  const resolved = path.resolve(workspaceRoot, filePath);

  // Prevent directory traversal
  if (!resolved.startsWith(workspaceRoot)) {
    throw new Error('Access denied: Path outside workspace');
  }

  // Block sensitive directories
  const forbidden = ['.git', 'node_modules', '.env'];
  if (forbidden.some(dir => resolved.includes(dir))) {
    throw new Error('Access denied: Forbidden path');
  }
}
```

### Environment Variable Validation

```typescript
import { z } from 'zod';

const EnvSchema = z.object({
  WORKSPACE_PATH: z.string().min(1),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  NODE_ENV: z.enum(['development', 'production']).default('production'),
});

const env = EnvSchema.parse(process.env);
```

### Rate Limiting (Future)

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: 'Too many requests, please try again later'
});

app.use('/api', limiter);
```

---

## Troubleshooting

### Common Issues

**Issue: MCP server not starting**
```bash
# Check logs
docker-compose logs mcp-server

# Verify workspace path exists
ls -la $WORKSPACE_PATH

# Test manually
docker run -it paired-comments-mcp-server node dist/server.js
```

**Issue: Permission denied errors**
```bash
# Ensure workspace is readable
chmod -R 755 /workspace

# Check Docker volume permissions
docker-compose down -v
docker-compose up -d
```

**Issue: High memory usage**
```bash
# Limit cache size
docker run -e CACHE_TTL=60 paired-comments-mcp-server

# Reduce search index size
docker run -e MAX_SEARCH_RESULTS=100 paired-comments-mcp-server
```

---

## Next Steps

1. ✅ Deployment documentation complete
2. ⏭️ Implement MCP server core (Phase 1)
3. ⏭️ Set up Docker build
4. ⏭️ Publish to npm registry
5. ⏭️ Configure GitHub Actions CI/CD

---

**Status:** Planning Complete
**Ready for:** Phase 1 Implementation (January 2026)
