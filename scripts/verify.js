#!/usr/bin/env node

/**
 * Pre-deployment verification script
 * Checks all critical aspects before deployment
 */

const fs = require('fs')
const path = require('path')

console.log('🔍 JURISAI - Pre-Deployment Verification\n')

let hasErrors = false
let hasWarnings = false

// Colors for console
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
}

function error(msg) {
  console.log(`${colors.red}❌ ${msg}${colors.reset}`)
  hasErrors = true
}

function warning(msg) {
  console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`)
  hasWarnings = true
}

function success(msg) {
  console.log(`${colors.green}✅ ${msg}${colors.reset}`)
}

function info(msg) {
  console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`)
}

// 1. Check Environment Variables
console.log('\n📁 Checking Environment...')
const envExample = fs.existsSync('.env.example')
const envLocal = fs.existsSync('.env.local')

if (!envExample) {
  error('.env.example file not found')
} else {
  success('.env.example exists')
}

if (!envLocal) {
  warning('.env.local not found (create it before deployment)')
} else {
  success('.env.local exists')
  
  // Check for dangerous values
  const envContent = fs.readFileSync('.env.local', 'utf-8')
  if (envContent.includes('your-') || envContent.includes('dummy')) {
    error('.env.local contains placeholder values!')
  }
}

// 2. Check Package.json
console.log('\n📦 Checking package.json...')
try {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'))
  
  if (!pkg.scripts.test) {
    error('No test script defined')
  } else {
    success('Test script defined')
  }
  
  if (!pkg.scripts.build) {
    error('No build script defined')
  } else {
    success('Build script defined')
  }
  
  // Check critical dependencies
  const criticalDeps = ['next', 'react', 'typescript']
  criticalDeps.forEach(dep => {
    if (pkg.dependencies[dep]) {
      success(`${dep} installed`)
    } else {
      error(`${dep} not installed`)
    }
  })
} catch (e) {
  error('Failed to parse package.json')
}

// 3. Check TypeScript Config
console.log('\n🔷 Checking TypeScript...')
if (fs.existsSync('tsconfig.json')) {
  success('tsconfig.json exists')
} else {
  error('tsconfig.json not found')
}

// 4. Check Critical Files
console.log('\n📄 Checking Critical Files...')
const criticalFiles = [
  'README.md',
  'SECURITY.md',
  'LICENSE',
  '.gitignore',
  'next.config.js',
  'middleware.ts',
]

criticalFiles.forEach(file => {
  if (fs.existsSync(file)) {
    success(`${file} exists`)
  } else {
    error(`${file} not found`)
  }
})

// 5. Check Test Files
console.log('\n🧪 Checking Tests...')
const testDirs = ['tests', 'backend/tests']
testDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    const files = fs.readdirSync(dir, { recursive: true })
    const testFiles = files.filter(f => 
      f.toString().includes('.test.') || 
      f.toString().includes('.spec.')
    )
    if (testFiles.length > 0) {
      success(`${testFiles.length} test files found in ${dir}`)
    } else {
      warning(`No test files in ${dir}`)
    }
  } else {
    warning(`${dir} directory not found`)
  }
})

// 6. Check Security
console.log('\n🔒 Checking Security...')
const securityFiles = [
  'src/lib/api-security.ts',
  'SECURITY.md',
  '.env.example',
]

securityFiles.forEach(file => {
  if (fs.existsSync(file)) {
    success(`${file} exists`)
  } else {
    warning(`${file} not found`)
  }
})

// 7. Check Git
console.log('\n📝 Checking Git...')
if (fs.existsSync('.git')) {
  success('Git initialized')
  
  // Check .gitignore
  if (fs.existsSync('.gitignore')) {
    const gitignore = fs.readFileSync('.gitignore', 'utf-8')
    if (gitignore.includes('.env.local')) {
      success('.env.local in .gitignore')
    } else {
      error('.env.local NOT in .gitignore!')
    }
  }
} else {
  warning('Git not initialized')
}

// 8. Check Documentation
console.log('\n📚 Checking Documentation...')
const docs = [
  'README.md',
  'CONTRIBUTING.md',
  'QUICK_START.md',
  'DEPLOYMENT_CHECKLIST.md',
]

let docCount = 0
docs.forEach(doc => {
  if (fs.existsSync(doc) || fs.existsSync(`docs/${doc}`)) {
    docCount++
  }
})

if (docCount >= 3) {
  success(`${docCount} documentation files found`)
} else {
  warning(`Only ${docCount} documentation files found`)
}

// Final Summary
console.log('\n' + '='.repeat(50))
console.log('📊 VERIFICATION SUMMARY')
console.log('='.repeat(50))

if (hasErrors) {
  error(`\n❌ Verification FAILED - ${hasErrors} errors found`)
  console.log('\nPlease fix errors before deploying!')
  process.exit(1)
} else if (hasWarnings) {
  warning(`\n⚠️  Verification PASSED with warnings`)
  console.log('\nConsider addressing warnings before deploying.')
  process.exit(0)
} else {
  success('\n✅ All checks PASSED - Ready for deployment!')
  console.log('\n🚀 You can now deploy JURISAI!')
  process.exit(0)
}
