---
name: vercel
description: Manage Vercel deployments, troubleshoot build and container errors, configure vercel.json, set up SPA rewrites, serverless functions, and inspect deployment logs using the Vercel CLI and MCP server.
---

# Vercel Deployment & Management Skill

This skill provides procedures and runbooks for deploying, diagnosing, and configuring web applications and serverless APIs on Vercel.

---

## 1. Project Configuration (`vercel.json`)

For Single Page Applications (Vite, React) with serverless `/api` endpoints:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "vite",
  "buildCommand": "pnpm build",
  "outputDirectory": "dist",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### Critical Rules
- **Serverless API Precedence**: In Vercel, files located in `/api/*` automatically take precedence over catch-all rewrites (`/(.*)`).
- **Avoid Complex Negative Lookaheads**: Avoid writing regex like `/((?!api/).*)` as Vercel emits warnings regarding internal destination path handling. Use simple catch-all `/(.*)` instead.
- **Explicit Framework**: Specifying `"framework": "vite"` tells Vercel to use the optimized Vite builder instead of guessing or falling back to generic container detection.

---

## 2. Troubleshooting `[BUILD_FAILED] Container service must specify an entrypoint`

### Cause
When a repository previously had a `Dockerfile` or was imported into Vercel with Container Services enabled, Vercel's build pipeline expects a container entrypoint:
`Error: [BUILD_FAILED] Container service must specify an entrypoint: a prebuilt OCI image reference, or a Dockerfile path to build.`

### Resolution
1. **Provide a Standalone Dockerfile Entrypoint**:
   Ensure a production `Dockerfile` (and `Dockerfile.vercel`) exists with explicit `ENTRYPOINT` and `CMD`:
   ```dockerfile
   ENTRYPOINT ["node"]
   CMD ["server.mjs"]
   ```
2. **Or Switch Framework Preset in Vercel Dashboard**:
   - Go to **Vercel Dashboard > Project > Settings > General**.
   - Under **Build & Development Settings**, set **Framework Preset** to **Vite**.
   - Turn OFF Container Services if not using custom OCI images.
   - Set Build Command to `pnpm build` and Output Directory to `dist`.

---

## 3. Vercel CLI & MCP Server Integration

### Vercel MCP Server
Vercel provides an official remote MCP server at `https://mcp.vercel.com`.
Tools exposed:
- `search_documentation`: Search Vercel docs and guides.
- `list_projects`: List all projects in account/team.
- `get_deployment`: Inspect deployment status and metadata.
- `get_deployment_logs`: Fetch runtime and build error logs.

### Common CLI Commands
```bash
# Preview build simulation locally
npx vercel build

# Test local serverless functions and routing
npx vercel dev

# Deploy production build
npx vercel --prod
```
