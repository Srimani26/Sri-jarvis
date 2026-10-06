# J.A.R.V.I.S. MARK-V — Render Cloud Deployment Guide

## 1. Service Definition
```yaml
services:
  - type: web
    name: sri-jarvis
    runtime: node
    plan: free
    region: singapore
    buildCommand: npm install && npm run build && npm run build:server
    startCommand: node server.mjs
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000
```

## 2. Environment Variables Configuration
Set the following secrets in the Render Dashboard:
- `JWT_SECRET`: Random 64-char hexadecimal string for session signing.
- `GEMINI_API_KEY`: Google AI Studio API key for free-tier Gemini 2.5 Flash.
- `GROQ_API_KEY`: Groq cloud developer API key for high-speed inference.
- `OPENROUTER_API_KEY`: (Optional) Free model router token.
- `DATABASE_URL`: (Optional) External PostgreSQL connection string for permanent multi-tenant persistence.
