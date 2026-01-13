# Security Policy

## Reporting a Vulnerability

We take security issues seriously. If you discover a security vulnerability in Sculptor AI, please report it responsibly.

### How to Report

**Please do NOT report security vulnerabilities through public GitHub issues.**

Instead, please send an email to the maintainers with the following information:

- A description of the vulnerability
- Steps to reproduce the issue
- Potential impact of the vulnerability
- Any suggested fixes (optional)

### What to Expect

- **Acknowledgment**: We will acknowledge receipt of your report within 48 hours.
- **Assessment**: We will investigate and validate the issue within 7 days.
- **Resolution**: We aim to release a fix within 30 days, depending on complexity.
- **Credit**: We will credit you in the release notes (unless you prefer to remain anonymous).

---

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| Latest  | :white_check_mark: |
| < 1.0   | :x:                |

We recommend always using the latest version of Sculptor AI for the most up-to-date security patches.

---

## Security Best Practices

### API Key Management

Sculptor AI integrates with multiple AI providers. Follow these guidelines to protect your API keys:

1. **Never commit API keys** to version control
2. **Use environment variables** for all sensitive credentials
3. **Rotate keys regularly** and immediately if you suspect compromise
4. **Use separate keys** for development and production environments
5. **Set spending limits** on your AI provider accounts

```bash
# Example .env configuration (never commit this file)
VITE_OPENAI_API_KEY=sk-...
VITE_ANTHROPIC_API_KEY=sk-ant-...
VITE_GOOGLE_API_KEY=AIzaSy...
```

### Deployment Security

When deploying Sculptor AI:

- **Enable HTTPS** on all endpoints (enforced by default on Cloudflare Pages)
- **Configure CORS** properly to restrict allowed origins
- **Set secure headers** including CSP, X-Frame-Options, and X-Content-Type-Options
- **Keep dependencies updated** to patch known vulnerabilities
- **Use Cloudflare's** built-in DDoS protection and WAF when available

### Authentication

- User authentication is optional but recommended for production deployments
- Passwords are hashed using industry-standard algorithms
- Session tokens are securely generated and stored
- Admin access requires additional authentication

### Data Privacy

Sculptor AI is designed with privacy in mind:

- **Local Storage**: Chat history is stored locally in the browser by default
- **Encrypted Storage**: Sensitive data is encrypted at rest
- **No Tracking**: We do not track users or collect analytics by default
- **Data Portability**: Users can export and delete their data at any time

---

## Known Security Considerations

### Third-Party AI Providers

When using Sculptor AI, your prompts and data are sent to third-party AI providers (OpenAI, Anthropic, Google, etc.). Be aware of:

- Each provider has their own privacy policy and data retention practices
- Do not send sensitive personal information, credentials, or proprietary data to AI models
- Review each provider's terms of service and data handling practices

### File Uploads

- Uploaded files (images, PDFs) are processed client-side when possible
- Large files may be sent to the backend for processing
- File size limits are enforced to prevent abuse

### Browser Security

- The PWA runs in a sandboxed browser environment
- Service workers are scoped to the application origin
- Local storage is isolated per origin

---

## Dependency Security

We use the following tools to maintain dependency security:

- **npm audit**: Regular audits of npm dependencies
- **Dependabot**: Automated dependency updates (when enabled)
- **Lock files**: `package-lock.json` ensures reproducible builds

To check for vulnerabilities locally:

```bash
npm audit
npm audit fix
```

---

## Security Headers

The application implements the following security headers:

| Header | Purpose |
| ------ | ------- |
| `Content-Security-Policy` | Prevents XSS and injection attacks |
| `X-Content-Type-Options` | Prevents MIME sniffing |
| `X-Frame-Options` | Prevents clickjacking |
| `Strict-Transport-Security` | Enforces HTTPS |
| `Referrer-Policy` | Controls referrer information |

---

## Incident Response

In the event of a security incident:

1. **Identify**: Determine the scope and impact
2. **Contain**: Isolate affected systems
3. **Notify**: Alert affected users if data was compromised
4. **Remediate**: Apply fixes and patches
5. **Review**: Conduct post-incident analysis

---

## Contact

For security concerns, please contact the Sculptor AI team through the appropriate private channels.

For general questions and support, visit our [GitHub repository](https://github.com/Sculptor-AI/aiportal).

---

*Last updated: January 2026*

