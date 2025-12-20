# Dockerfile Implementation Details

This document provides the exact Dockerfile implementation for deploying LessonArcade on Google Cloud Run.

## 1. Dockerfile

```dockerfile
# Use Node.js 24 Alpine as base image (Next.js 16 requires Node 20.9+)
FROM node:24-alpine AS base
# Install pnpm globally
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
FROM base AS deps
RUN pnpm install --frozen-lockfile

# Build the application
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment variables for build
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Build the application
RUN pnpm build

# Production image
FROM node:24-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy the standalone output
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Set ownership
USER nextjs

# Expose port (Cloud Run will override with PORT env var)
EXPOSE 8080

ENV PORT=8080
ENV HOSTNAME=0.0.0.0

# Start the application
CMD ["node", "server.js"]
```

## 2. .dockerignore

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

## 3. next.config.ts Updates

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

## 4. Proxy Configuration

The proxy.ts file remains as-is (no renaming needed). Next.js 16 deprecates the middleware filename convention, and proxy.ts is the recommended approach. The file is already properly configured for Basic Authentication on /studio routes.

## 5. Key Implementation Details

### Multi-stage Build Strategy
1. **Base**: Sets up Node.js 24 Alpine with pnpm
2. **Deps**: Installs all dependencies
3. **Builder**: Builds the Next.js application with standalone output
4. **Runner**: Creates minimal runtime image with only necessary files

### Security Best Practices
- Runs as non-root user (nextjs)
- Uses Alpine Linux for smaller attack surface
- Excludes sensitive files via .dockerignore

### Cloud Run Compatibility
- Listens on PORT environment variable (default 8080 for Cloud Run)
- Binds to 0.0.0.0 (not localhost)
- Uses standalone output for minimal image size (~150MB)

### Performance Optimizations
- Leverages Docker layer caching
- Copies only necessary files between stages
- Uses pnpm for efficient dependency management

## 6. Expected Image Size

With this implementation:
- Base image: ~50MB (Node.js 24 Alpine)
- Dependencies: ~80MB
- Application code: ~20MB
- Total: ~150MB (vs ~500MB without standalone)

## 7. Testing Commands

```bash
# Build the image
docker build -t lessonarcade:latest .

# Run locally mimicking Cloud Run contract (listen on 0.0.0.0:8080)
docker run -p 9090:8080 \
  -e PORT=8080 \
  -e STUDIO_BASIC_AUTH_USER=admin \
  -e STUDIO_BASIC_AUTH_PASS=test123 \
  -e LOGGING_SALT=random-salt \
  lessonarcade:latest

# Test with .env file
docker run -p 9090:8080 -e PORT=8080 --env-file .env lessonarcade:latest
```

## 8. Deployment to Cloud Run

```bash
# Tag for Google Artifact Registry
docker tag lessonarcade:latest gcr.io/PROJECT-ID/lessonarcade:latest

# Push to registry
docker push gcr.io/PROJECT-ID/lessonarcade:latest

# Deploy to Cloud Run
gcloud run deploy lessonarcade \
  --image gcr.io/PROJECT-ID/lessonarcade:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars STUDIO_BASIC_AUTH_USER=admin \
  --set-env-vars STUDIO_BASIC_AUTH_PASS=secure-password \
  --set-env-vars LOGGING_SALT=random-salt-string
```

## 9. Troubleshooting

### Port Issues
If container doesn't start, ensure:
- PORT environment variable is set to 8080 (Cloud Run sets this automatically)
- The application binds to 0.0.0.0, not localhost
- Local testing uses -p 9090:8080 to avoid port conflicts

### Build Issues
If build fails:
- Check that pnpm-lock.yaml exists
- Verify Node.js version compatibility (24+)
- Ensure all dependencies are properly declared

### Runtime Issues
If routes don't work:
- Verify proxy.ts is properly configured
- Check that Basic Auth credentials are set
- Ensure static files are properly copied