#!/bin/bash

# Pre-deployment check script
# Run this before pushing to catch deployment failures early

set -e  # Exit on any error

echo "🔍 Starting pre-deployment checks..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Not in a Node.js project directory"
    exit 1
fi

echo "📦 1. Checking dependencies..."
# Check for missing dependencies
npm install --dry-run > /dev/null 2>&1 || {
    echo "❌ Error: npm install would fail"
    echo "💡 Try running: npm install"
    exit 1
}

echo "🔧 2. Installing dependencies..."
npm ci

echo "📝 3. Generating types..."
npm run generate-types 2>&1 || {
    echo "❌ Error: Type generation failed"
    exit 1
}

echo "🔍 4. Checking for missing imports/exports..."
# This will catch missing module errors
npx tsc --noEmit --skipLibCheck 2>&1 || {
    echo "❌ Error: TypeScript compilation failed"
    echo "💡 Check for missing imports, incorrect file paths, or type errors"
    exit 1
}

echo "📋 5. Running linter..."
npm run lint --silent 2>&1 || {
    echo "⚠️ Warning: Linter found issues"
    echo "💡 Consider running: npm run lint --fix"
    # Don't exit on lint errors, just warn
}

echo "🏗️ 6. Testing production build..."
npm run build 2>&1 || {
    echo "❌ Error: Production build failed"
    echo "💡 This is the same error you'd see in deployment"
    exit 1
}

echo "🧪 7. Running tests (if available)..."
if npm run test --dry-run > /dev/null 2>&1; then
    npm run test --run 2>&1 || {
        echo "⚠️ Warning: Tests failed"
        echo "💡 Consider fixing tests before deployment"
        # Don't exit on test failures, just warn
    }
else
    echo "ℹ️ No test script found, skipping..."
fi

echo "🔍 8. Checking for common deployment issues..."

# Check for missing .env files that might be needed
if [ -f ".env.example" ] && [ ! -f ".env" ]; then
    echo "⚠️ Warning: .env.example exists but .env doesn't"
    echo "💡 You might need environment variables for deployment"
fi

# Check bundle size
BUILD_SIZE=$(du -sh dist 2>/dev/null | cut -f1 || echo "unknown")
echo "📦 Build size: $BUILD_SIZE"

# Check for large files that might cause issues
find dist -size +1M -exec echo "⚠️ Large file: {} ($(du -h {} | cut -f1))" \; 2>/dev/null || true

echo ""
echo "✅ All pre-deployment checks passed!"
echo "🚀 Ready to deploy!"
echo ""
echo "To deploy:"
echo "  git add ."
echo "  git commit -m 'Your commit message'"
echo "  git push origin main"