# Docker Implementation Plan for LessonArcade

This document outlines the specific implementation details for creating a production-ready Docker setup for LessonArcade to deploy on Google Cloud Run.

## 1. next.config.ts Updates

The current next.config.ts needs to be updated to enable standalone output:

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for Docker deployment
  output: 'standalone',
  
  // Optional: Configure for Cloud Run
  experimental: {
    // Optional: Enable turbotrace for faster builds
    turbotrace: {
      logLevel: 'error',
    },
  },
};

export default nextConfig;
```

## 2. Dockerfile Implementation

The Dockerfile will use a multi-stage build approach optimized for pnpm and Next.js 16:

### Stage 1: Base
- Use Node.js 18 Alpine image
- Install pnpm globally

### Stage 2: Dependencies
- Copy package.json and pnpm-lock.yaml
- Install dependencies with pnpm
- Cache node_modules for faster builds

### Stage 3: Builder
- Copy source code
- Build the application with `next build`
- This will create the standalone output in .next/standalone

### Stage 4: Runner
- Use minimal Node.js Alpine image
- Copy only necessary files from builder stage:
  - .next/standalone
  - .next/static
  - public folder
- Set PORT environment variable
- Create non-root user for security
- Expose port 3000 (will be overridden by Cloud Run)

## 3. .dockerignore File

Create a .dockerignore file to exclude unnecessary files from the Docker context:

```
# Dependencies
node_modules
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Testing
coverage
.nyc_output

# Next.js
.next/
out/

# Misc
.DS_Store
*.pem

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Local env files
.env*.local
.env

# Vercel
.vercel

# TypeScript
*.tsbuildinfo
next-env.d.ts

# Git
.git
.gitignore

# Documentation
README.md
plans/
screenshots/

# IDE
.vscode
.idea

# OS
Thumbs.db
```

## 4. Middleware Integration

The proxy.ts file needs to be properly integrated with Next.js middleware:

1. Rename proxy.ts to middleware.ts (Next.js convention)
2. Ensure the middleware exports the correct functions
3. Verify the matcher configuration is correct

## 5. Environment Variables Handling

The application will need to handle these environment variables:

### Required for Production:
- PORT (automatically set by Cloud Run)
- HOSTNAME (set to 0.0.0.0 for Cloud Run)
- STUDIO_BASIC_AUTH_USER
- STUDIO_BASIC_AUTH_PASS
- LOGGING_SALT

### Optional:
- GEMINI_API_KEY
- ELEVENLABS_API_KEY
- ELEVENLABS_VOICE_ID_EN
- ELEVENLABS_VOICE_ID_ZH
- ELEVENLABS_MODEL_ID

## 6. Security Considerations

1. Run as non-root user in Docker container
2. Do not bake secrets into the image
3. Use .dockerignore to exclude sensitive files
4. Ensure Basic Auth is properly configured

## 7. Performance Optimizations

1. Use Next.js standalone output to minimize image size
2. Leverage Docker layer caching for faster builds
3. Use Alpine Linux for smaller base images
4. Copy only necessary files between stages

## 8. Testing Strategy

After implementation:

1. Build the Docker image locally
2. Run the container with test environment variables
3. Verify all routes work:
   - /demo (public)
   - /demo/voice/effective-meetings (voice lesson)
   - /studio (protected with Basic Auth)
4. Check that the container listens on the correct PORT
5. Verify no secrets are baked into the image

## 9. Cloud Run Compatibility

The Docker container must:

1. Listen on the PORT environment variable (not hardcoded)
2. Accept requests from 0.0.0.0 (not just localhost)
3. Handle graceful shutdown (SIGTERM)
4. Log to stdout/stderr for Cloud Logging integration

## 10. File Structure After Implementation

```
/
├── .dockerignore
├── Dockerfile
├── middleware.ts (renamed from proxy.ts)
├── next.config.ts (updated)
├── package.json
├── pnpm-lock.yaml
├── plans/
│   ├── cloud-run-deploy.md
│   └── docker-implementation-plan.md
├── app/
├── components/
├── lib/
├── public/
└── ...
```

## Implementation Order

1. Update next.config.ts to enable standalone output
2. Rename proxy.ts to middleware.ts (if needed)
3. Create .dockerignore file
4. Create multi-stage Dockerfile
5. Run quality gate tests (lint, test, build)
6. Build and test Docker image locally
7. Commit and push changes

## Expected Docker Image Size

With standalone output:
- Without optimizations: ~500MB
- With optimizations: ~150-200MB

This is significantly smaller than a full Next.js deployment with all node_modules.