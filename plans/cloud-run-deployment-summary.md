# Cloud Run Deployment Summary (LA2-P0-04)

This document summarizes the complete plan for preparing LessonArcade for Google Cloud Run deployment with Docker.

## Overview

The goal is to deploy the Next.js 16 (App Router) application to Google Cloud Run using Docker with standalone output, ensuring the container listens on PORT, uses Node runtime, and doesn't bake secrets into the image.

## Completed Documentation

1. **[cloud-run-deploy.md](./cloud-run-deploy.md)** - Complete deployment guide with:
   - Required environment variables
   - Local Docker build and run instructions
   - Cloud Run deployment considerations (min instances, CPU allocation, concurrency, cost)

2. **[docker-implementation-plan.md](./docker-implementation-plan.md)** - Detailed implementation plan including:
   - File structure changes
   - Security considerations
   - Performance optimizations

3. **[dockerfile-implementation.md](./dockerfile-implementation.md)** - Exact Dockerfile implementation with:
   - Multi-stage build configuration
   - Security best practices
   - Cloud Run compatibility

## Implementation Steps

### 1. Configuration Updates
- Update `next.config.ts` to enable `output: 'standalone'`
- Keep `proxy.ts` as-is (Next.js 16 deprecates middleware filename convention)

### 2. Docker Setup
- Create multi-stage `Dockerfile` optimized for pnpm and Next.js 16
- Use Node.js 24 Alpine (required for Next.js 16)
- Create `.dockerignore` to exclude unnecessary files

### 3. Quality Assurance
- Run `pnpm lint`, `pnpm test`, `pnpm build`
- Build Docker image locally and test all routes:
  - `/demo` (public)
  - `/demo/voice/effective-meetings` (voice lesson)
  - `/studio` (protected with Basic Auth)

### 4. Deployment
- Commit and push changes to main
- Use commit message: `chore: add Cloud Run Docker deploy scaffold (LA2-P0-04)`

## Key Technical Details

### Dockerfile Features
- Multi-stage build for minimal image size (~150MB)
- Node.js 24 Alpine base image (required for Next.js 16)
- pnpm package manager support
- Non-root user execution for security
- PORT environment variable support for Cloud Run (default 8080)

### Environment Variables
- Required: `STUDIO_BASIC_AUTH_USER`, `STUDIO_BASIC_AUTH_PASS`, `LOGGING_SALT`
- Optional: `GEMINI_API_KEY`, `ELEVENLABS_API_KEY`
- Cloud Run: `PORT` (automatically set to 8080), `HOSTNAME` (set to 0.0.0.0)

### Middleware
- Basic Authentication protection for `/studio` and `/api/studio` routes
- Configured via environment variables
- Uses `proxy.ts` (no renaming needed in Next.js 16)

### Cloud Run Configuration
- Minimum 0 instances for cost optimization
- CPU always allocated for consistent performance
- 20-40 concurrent requests recommended
- 1GiB memory recommended for AI processing

## Testing Strategy

1. **Local Testing**
   - Build Docker image: `docker build -t lessonarcade:latest .`
   - Run with test env vars: `docker run -p 9090:8080 -e PORT=8080 --env-file .env lessonarcade:latest`
   - Verify all routes work correctly

2. **Production Testing**
   - Deploy to Cloud Run with minimal configuration
   - Test authentication on `/studio` routes
   - Verify voice functionality with API keys

## Cost Considerations

| Configuration | Approx. Monthly Cost (us-central1) |
|---------------|------------------------------------|
| 0 min instances, 512MiB, CPU on-demand | $0-5 |
| 0 min instances, 1GiB, CPU always on | $5-15 |
| 1 min instance, 1GiB, CPU always on | $15-25 |

## Next Steps

The implementation is ready to be executed. The developer should:

1. Review the documentation files
2. Implement the changes as outlined
3. Test locally before deploying to Cloud Run
4. Commit changes with the specified commit message

## Files to be Created/Modified

1. **Modified**: `next.config.ts` - Add standalone output
2. **Unchanged**: `proxy.ts` - Keep as-is (Next.js 16 compatible)
3. **New**: `Dockerfile` - Multi-stage build configuration
4. **New**: `.dockerignore` - Exclude unnecessary files
5. **New**: `plans/cloud-run-deploy.md` - Deployment documentation
6. **New**: `plans/docker-implementation-plan.md` - Implementation details
7. **New**: `plans/dockerfile-implementation.md` - Dockerfile specifics
8. **New**: `plans/cloud-run-deployment-summary.md` - This summary

All documentation has been created and is ready for implementation.