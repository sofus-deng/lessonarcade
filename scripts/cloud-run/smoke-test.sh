#!/bin/bash

# Post-deployment smoke tests for Cloud Run
# This script verifies that the deployed service is responding correctly

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
SERVICE_URL="${SERVICE_URL:-$1}"

# Validate input
if [ -z "$SERVICE_URL" ]; then
    echo -e "${RED}[ERROR]${NC} SERVICE_URL must be provided as environment variable or first argument"
    exit 1
fi

# Helper functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Assert HTTP status code
assert_status() {
    local url="$1"
    local expected_status="$2"
    local auth_header="$3"
    local description="$4"
    
    local curl_args="--silent --show-error --output /dev/null --write-out '%{http_code}'"
    
    if [ -n "$auth_header" ]; then
        curl_args="$curl_args --header '$auth_header'"
    fi
    
    log_info "Testing $description: $url"
    
    local actual_status
    if [ -n "$auth_header" ]; then
        actual_status=$(eval "curl $curl_args '$url'")
    else
        actual_status=$(eval "curl $curl_args '$url'")
    fi
    
    if [ "$actual_status" = "$expected_status" ]; then
        log_info "✓ Expected status $expected_status, got $actual_status"
        return 0
    else
        log_error "✗ Expected status $expected_status, got $actual_status"
        return 1
    fi
}

# Main test execution
main() {
    log_info "Starting smoke tests for $SERVICE_URL"
    
    local test_failed=0
    
    # Test 1: GET /demo returns 200
    if ! assert_status "$SERVICE_URL/demo" "200" "" "Public demo page"; then
        test_failed=1
    fi
    
    # Test 2: GET /demo/voice/effective-meetings returns 200
    if ! assert_status "$SERVICE_URL/demo/voice/effective-meetings" "200" "" "Demo voice lesson"; then
        test_failed=1
    fi

    # Test 3: GET /demo/voice-chat/effective-meetings returns 200
    if ! assert_status "$SERVICE_URL/demo/voice-chat/effective-meetings" "200" "" "Demo voice chat lesson"; then
        test_failed=1
    fi
    
    # Test 4: GET /studio returns 401 without auth
    if ! assert_status "$SERVICE_URL/studio" "401" "" "Studio without auth"; then
        test_failed=1
    fi
    
    # Test 5: GET /studio/voice-analytics returns 401 without auth
    if ! assert_status "$SERVICE_URL/studio/voice-analytics" "401" "" "Studio voice-analytics without auth"; then
        test_failed=1
    fi
    
    # Test 6: GET /studio returns 200 with Basic Auth (optional)
    if [ -n "$STUDIO_BASIC_AUTH_USER" ] && [ -n "$STUDIO_BASIC_AUTH_PASS" ]; then
        log_info "Auth credentials provided; testing authenticated access"
        
        # Create Basic Auth header safely (without echoing credentials)
        local auth_header
        auth_header=$(printf "%s:%s" "$STUDIO_BASIC_AUTH_USER" "$STUDIO_BASIC_AUTH_PASS" | base64 | tr -d '\n')
        auth_header="Authorization: Basic $auth_header"
        
        if ! assert_status "$SERVICE_URL/studio" "200" "$auth_header" "Studio with auth"; then
            test_failed=1
        fi
    else
        log_warn "Auth credentials not provided; skipping auth-200 check"
    fi
    
    # Final result
    if [ $test_failed -eq 0 ]; then
        log_info "All smoke tests passed! ✓"
        exit 0
    else
        log_error "Smoke tests failed! ✗"
        exit 1
    fi
}

# Run main function
main "$@"
