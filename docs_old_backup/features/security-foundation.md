# Security Foundation (v2.1)

**Status:** Design Phase
**Target:** v2.1 (Q1 2026)
**Philosophy:** Simple by default, enterprise-ready architecture

---

## Overview

The Security Foundation provides **architectural readiness** for enterprise security requirements without compromising the simplicity that makes Paired Comments easy to adopt. Our approach:

- ✅ **Simple by default** - No security overhead for individual developers
- ✅ **Enterprise-ready** - Architecture ready for Azure Key Vault, AWS KMS, etc.
- ✅ **Scalable** - Plugin architecture for future security providers
- ✅ **Privacy-first** - Builds on v2.1 privacy controls

**Key Principle**: "Make it work, make it safe, make it scalable" - we're at the "make it safe" stage.

---

## Goals

### v2.1 Goals (Foundation)
1. **Sensitive Data Detection** - Warn users when capturing credentials/secrets
2. **Encryption Interface** - Stub architecture for future providers
3. **Export Safety** - Ensure sensitive data doesn't leak in exports
4. **Configuration** - `.commentsrc` security section

### Future Goals (Not in v2.1)
- Full Azure Key Vault integration
- AWS KMS support
- Field-level encryption at rest
- Audit logging
- Role-based access control (RBAC)

---

## Architecture

### 1. Encryption Provider Interface

**Purpose**: Standardized interface for encryption, allowing future providers without breaking changes.

```typescript
// src/security/EncryptionProvider.ts

/**
 * Encryption provider interface
 * All encryption providers must implement this
 */
export interface EncryptionProvider {
  /**
   * Encrypt a value
   * @param data - Plain text to encrypt
   * @returns Encrypted string (base64 or provider-specific format)
   */
  encrypt(data: string): Promise<string>;

  /**
   * Decrypt a value
   * @param data - Encrypted string
   * @returns Plain text
   */
  decrypt(data: string): Promise<string>;

  /**
   * Check if provider is available and configured
   */
  isAvailable(): Promise<boolean>;

  /**
   * Provider name (for logging/debugging)
   */
  readonly name: string;
}

/**
 * Built-in provider using VS Code secrets API
 * Simple encryption for local development
 */
export class LocalEncryptionProvider implements EncryptionProvider {
  readonly name = 'local';

  constructor(private secretStorage: vscode.SecretStorage) {}

  async encrypt(data: string): Promise<string> {
    // Use VS Code's built-in secret storage
    const key = this.generateKey();
    await this.secretStorage.store(key, data);
    return `local:${key}`; // Prefix indicates provider
  }

  async decrypt(data: string): Promise<string> {
    const key = data.replace('local:', '');
    const value = await this.secretStorage.get(key);
    if (!value) {
      throw new Error('Failed to decrypt: key not found');
    }
    return value;
  }

  async isAvailable(): Promise<boolean> {
    return true; // Always available in VS Code
  }

  private generateKey(): string {
    return `paired-comments-${Date.now()}-${Math.random()}`;
  }
}

/**
 * STUB: Azure Key Vault provider (v3.0+)
 * Architecture is ready, implementation comes when requested
 */
export class AzureKeyVaultProvider implements EncryptionProvider {
  readonly name = 'azure-keyvault';

  async encrypt(data: string): Promise<string> {
    throw new Error('Azure Key Vault provider not yet implemented. Coming in v3.0.');
    // TODO v3.0:
    // - Authenticate with Azure
    // - Use Azure Key Vault SDK
    // - Store encrypted value in Key Vault
    // - Return vault reference (e.g., "azure:vault-name/secret-name")
  }

  async decrypt(data: string): Promise<string> {
    throw new Error('Azure Key Vault provider not yet implemented. Coming in v3.0.');
  }

  async isAvailable(): Promise<boolean> {
    return false; // Not implemented yet
  }
}

/**
 * STUB: AWS KMS provider (v3.0+)
 */
export class AWSKMSProvider implements EncryptionProvider {
  readonly name = 'aws-kms';

  async encrypt(data: string): Promise<string> {
    throw new Error('AWS KMS provider not yet implemented. Coming in v3.0.');
  }

  async decrypt(data: string): Promise<string> {
    throw new Error('AWS KMS provider not yet implemented. Coming in v3.0.');
  }

  async isAvailable(): Promise<boolean> {
    return false;
  }
}
```

### 2. Security Manager

**Purpose**: Centralized security logic (detection, encryption, validation).

```typescript
// src/security/SecurityManager.ts

export interface SensitivePattern {
  pattern: RegExp;
  name: string;
  severity: 'warning' | 'error';
}

export class SecurityManager {
  private encryptionProvider: EncryptionProvider;
  private sensitivePatterns: SensitivePattern[];

  constructor(
    provider: EncryptionProvider,
    customPatterns?: SensitivePattern[]
  ) {
    this.encryptionProvider = provider;
    this.sensitivePatterns = [
      ...this.getDefaultPatterns(),
      ...(customPatterns || [])
    ];
  }

  /**
   * Detect sensitive data in text
   * Returns matches with severity
   */
  detectSensitiveData(text: string): Array<{
    pattern: string;
    match: string;
    severity: 'warning' | 'error';
  }> {
    const matches: Array<{
      pattern: string;
      match: string;
      severity: 'warning' | 'error';
    }> = [];

    for (const { pattern, name, severity } of this.sensitivePatterns) {
      const found = text.match(pattern);
      if (found) {
        matches.push({
          pattern: name,
          match: found[0],
          severity
        });
      }
    }

    return matches;
  }

  /**
   * Encrypt a field value
   */
  async encryptField(value: string): Promise<string> {
    return this.encryptionProvider.encrypt(value);
  }

  /**
   * Decrypt a field value
   */
  async decryptField(value: string): Promise<string> {
    return this.encryptionProvider.decrypt(value);
  }

  /**
   * Check if encryption is enabled and available
   */
  async isEncryptionAvailable(): Promise<boolean> {
    return this.encryptionProvider.isAvailable();
  }

  /**
   * Default sensitive data patterns
   */
  private getDefaultPatterns(): SensitivePattern[] {
    return [
      {
        pattern: /password\s*[:=]\s*['"]?[\w\d@#$%^&*]+['"]?/gi,
        name: 'password',
        severity: 'error'
      },
      {
        pattern: /api[_-]?key\s*[:=]\s*['"]?[\w\d-]+['"]?/gi,
        name: 'api-key',
        severity: 'error'
      },
      {
        pattern: /secret\s*[:=]\s*['"]?[\w\d-]+['"]?/gi,
        name: 'secret',
        severity: 'error'
      },
      {
        pattern: /token\s*[:=]\s*['"]?[\w\d.-]+['"]?/gi,
        name: 'token',
        severity: 'error'
      },
      {
        pattern: /bearer\s+[\w\d.-]+/gi,
        name: 'bearer-token',
        severity: 'error'
      },
      {
        pattern: /aws_access_key_id\s*[:=]\s*['"]?[A-Z0-9]{20}['"]?/gi,
        name: 'aws-access-key',
        severity: 'error'
      },
      {
        pattern: /private[_-]?key/gi,
        name: 'private-key',
        severity: 'warning'
      },
      {
        pattern: /credential/gi,
        name: 'credential',
        severity: 'warning'
      }
    ];
  }
}
```

### 3. .commentsrc Configuration

**Purpose**: Simple, declarative configuration for security settings.

```json
{
  "privacy": {
    "excludeFields": ["author", "aiMeta.embeddings"],
    "excludeOutputs": false
  },
  "security": {
    "encryption": {
      "enabled": false,
      "provider": "local",
      "fields": []
    },
    "sensitivePatterns": [
      "password",
      "api[_-]?key",
      "secret",
      "token",
      "credential"
    ],
    "warnOnSensitiveData": true,
    "blockExportWithSensitiveData": false
  }
}
```

**Fields Explained:**
- `encryption.enabled` - Enable field-level encryption (default: false)
- `encryption.provider` - Which provider to use: `local`, `azure-keyvault`, `aws-kms`
- `encryption.fields` - Which comment fields to encrypt (e.g., `["text", "output.value"]`)
- `sensitivePatterns` - Regex patterns to detect (extend default list)
- `warnOnSensitiveData` - Show warning when sensitive data detected (default: true)
- `blockExportWithSensitiveData` - Prevent export if sensitive data found (default: false)

### 4. User Experience Flow

#### Scenario 1: User Captures Output with API Key

1. User runs `Ctrl+Alt+P Ctrl+Alt+O` to capture output
2. Output contains: `{ "apiKey": "sk-abc123..." }`
3. SecurityManager detects "api-key" pattern
4. **Warning shown**:
   ```
   ⚠️ This output appears to contain sensitive data (api-key).

   Options:
   [ ] Exclude 'output' field from exports (recommended)
   [ ] Continue anyway
   [ ] Cancel
   ```
5. If user selects "Exclude from exports", update `.commentsrc`:
   ```json
   {
     "privacy": {
       "excludeFields": ["output"]
     }
   }
   ```

#### Scenario 2: Enterprise Asks "Can You Encrypt Sensitive Data?"

**Current Answer (without v2.1):**
> "Not yet, but we can add it if you need it."

**Answer with v2.1:**
> "Yes! We support encryption via Azure Key Vault, AWS KMS, or local encryption. Here's how to enable it..."

Even though Azure/AWS providers are stubs in v2.1, the **architecture is ready**. When enterprise customer requests it, we can implement in v2.5/v3.0 without breaking changes.

---

## Implementation Plan

### Week 5.5 (1 day of work)

**Day 1: Core Security Infrastructure**
1. Create `src/security/` folder
2. Implement `EncryptionProvider` interface
3. Implement `LocalEncryptionProvider` (functional)
4. Stub out `AzureKeyVaultProvider` and `AWSKMSProvider` (throw errors)
5. Implement `SecurityManager` with sensitive pattern detection
6. Add security section to `.commentsrc` schema
7. Unit tests for detection logic

**Day 2: Integration & UX**
1. Integrate `SecurityManager` into `CommentManager`
2. Add warnings when capturing sensitive data
3. Add "Exclude from exports" quick action
4. Update privacy filtering to respect security config
5. Integration tests for security workflows

**Day 3: Documentation**
1. Update this document with final implementation details
2. Add security section to README.md
3. Create enterprise security FAQ
4. Add examples to `.commentsrc` template

---

## Security Considerations

### What We're Protecting
- API keys, tokens, passwords in captured outputs
- Sensitive data in comment text (rare, but possible)
- Privacy leaks when exporting .comments files

### What We're NOT Protecting (Yet)
- Encryption at rest (files are JSON on disk)
- Network transport (no network features yet)
- Access control (single-user tool)
- Audit logging (future enterprise feature)

### Threat Model
- **Threat**: Developer accidentally captures API key in output
  - **Mitigation**: Pattern detection + warning + auto-exclude from exports
- **Threat**: .comments file shared/committed with sensitive data
  - **Mitigation**: Privacy filters + optional export blocking
- **Threat**: Enterprise requires encrypted storage
  - **Mitigation**: Architecture ready, implement when requested

### Future Enhancements (v3.0+)
1. **Azure Key Vault Integration**
   - Full implementation of `AzureKeyVaultProvider`
   - OAuth authentication with Azure
   - Centralized key management

2. **AWS KMS Integration**
   - Full implementation of `AWSKMSProvider`
   - IAM-based access control

3. **Encryption at Rest**
   - Encrypt entire .comments files on disk
   - Transparent decryption in VS Code

4. **Audit Logging**
   - Track who added/modified comments
   - Export audit logs for compliance

5. **Role-Based Access Control**
   - Define roles (viewer, editor, admin)
   - Restrict sensitive comment access

---

## Testing

### Unit Tests
```typescript
// SecurityManager.test.ts
describe('SecurityManager', () => {
  it('detects API keys in text', () => {
    const manager = new SecurityManager(mockProvider);
    const result = manager.detectSensitiveData('apiKey: sk-abc123');
    expect(result).toHaveLength(1);
    expect(result[0].pattern).toBe('api-key');
  });

  it('detects passwords', () => {
    const manager = new SecurityManager(mockProvider);
    const result = manager.detectSensitiveData('password = "secret123"');
    expect(result).toHaveLength(1);
  });

  it('handles custom patterns', () => {
    const customPattern = {
      pattern: /social-security-number/gi,
      name: 'ssn',
      severity: 'error' as const
    };
    const manager = new SecurityManager(mockProvider, [customPattern]);
    const result = manager.detectSensitiveData('social-security-number: 123-45-6789');
    expect(result[0].pattern).toBe('ssn');
  });
});
```

### Integration Tests
1. Capture output with API key → warning shown
2. Exclude field from exports → not included in export
3. Enable encryption → fields encrypted in .comments file
4. Switch provider → encryption still works

---

## FAQ

### Q: Why stub out Azure/AWS providers instead of implementing them?
**A**: We want to ship v2.1 without external dependencies (Azure SDK is huge). When an enterprise customer requests it, we can implement quickly without architectural changes.

### Q: Is local encryption secure?
**A**: It uses VS Code's built-in secret storage (OS keychain on macOS, Windows Credential Manager, etc.). Good enough for development, but enterprises should use Key Vault/KMS.

### Q: What happens if I enable encryption but the provider isn't available?
**A**: `SecurityManager.isEncryptionAvailable()` returns false, and we fall back to plain text with a warning.

### Q: Can I use my own encryption library?
**A**: Yes! Implement the `EncryptionProvider` interface and configure it in `.commentsrc`. We'll add a plugin system in v3.0.

### Q: What about GDPR/CCPA compliance?
**A**: Privacy controls (field exclusion) handle most requirements. Audit logging (v3.0+) will complete compliance.

---

## Success Metrics

- ✅ No new dependencies in v2.1 (stubs only)
- ✅ <50ms overhead for sensitive data detection
- ✅ Enterprise customers can say "yes" when asked about encryption
- ✅ Zero security incidents reported in first 6 months
- ✅ >80% of users with sensitive data use exclude filters

---

## Conclusion

The Security Foundation in v2.1 is about **architectural readiness**, not heavy implementation. By defining clear interfaces and providing sensible defaults, we make Paired Comments enterprise-friendly without sacrificing the simplicity that makes it great.

**Philosophy**: Start simple, grow as needed. Security is a journey, not a destination.

---

**Next Steps:**
1. Review this design with team
2. Implement in Week 5.5 of v2.1 (1 day)
3. Test with sample sensitive data
4. Document for enterprise customers

**Future Work:**
- v2.5: Full Azure Key Vault implementation
- v3.0: AWS KMS, audit logging, RBAC
- v3.5: Compliance certifications (SOC2, ISO 27001)
