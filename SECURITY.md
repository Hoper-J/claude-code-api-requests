# Security & privacy reporting

**English** | [中文](SECURITY.zh-CN.md)

This repo's corpus (`corpus/`) goes through several sanitization passes before it lands (see [sanitize/README.md](sanitize/README.md)). If you nonetheless **spot suspected residual personal information in any published data** (email, account/device identifiers, local paths, keys, etc.):

1. **Do not paste the raw value in a public issue.**
2. Prefer GitHub's **Private vulnerability reporting** (the repo's Security tab); if that entry isn't available, open an issue describing only the **location + type** (no raw value).
3. Once confirmed, the affected data will be removed and rewritten promptly, and history cleaned if needed.

Code-level security issues (e.g. a sanitizer bypass or a broken gate) use the same channels.
