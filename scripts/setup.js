#!/usr/bin/env node

/**
 * Setup script for JURISAI
 * Initializes project for first-time use
 */

const fs = require('fs')
const { execSync } = require('child_process')

console.log('🚀 JURISAI Setup Script\n')

function run(command, description) {
  console.log(`\n📦 ${description}...`)
  try {
    execSync(command, { stdio: 'inherit' })
    console.log(`✅ ${description} completed`)
  } catch (error) {
    console.error(`❌ ${description} failed`)
    process.exit(1)
  }
}

// 1. Check Node version
console.log('🔍 Checking Node.js version...')
const nodeVersion = process.version
console.log(`Node.js version: ${nodeVersion}`)

const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0])
if (majorVersion < 18) {
  console.error('❌ Node.js 18 or higher required')
  process.exit(1)
}
console.log('✅ Node.js version is compatible')

// 2. Check if .env.local exists
console.log('\n📁 Checking environment file...')
if (!fs.existsSync('.env.local')) {
  if (fs.existsSync('.env.example')) {
    console.log('📋 Creating .env.local from .env.example...')
    fs.copyFileSync('.env.example', '.env.local')
    console.log('✅ .env.local created')
    console.log('⚠️  Please update .env.local with your actual API keys!')
  } else {
    console.log('⚠️  .env.example not found')
  }
} else {
  console.log('✅ .env.local already exists')
}

// 3. Install dependencies
run('npm install', 'Installing frontend dependencies')

// 4. Setup Husky
if (fs.existsSync('.husky')) {
  console.log('\n🐕 Husky already initialized')
} else {
  run('npx husky install', 'Initializing Husky')
  console.log('✅ Git hooks configured')
}

// 5. Backend setup (if exists)
if (fs.existsSync('backend')) {
  console.log('\n🐍 Backend detected')
  console.log('📦 To setup backend, run:')
  console.log('   cd backend')
  console.log('   pip install -r requirements.txt')
}

// 6. Final instructions
console.log('\n' + '='.repeat(50))
console.log('✅ SETUP COMPLETE!')
console.log('='.repeat(50))
console.log('\n📝 Next steps:')
console.log('1. Update .env.local with your API keys')
console.log('2. Run: npm run dev')
console.log('3. Open: http://localhost:3000')
console.log('\n🚀 Happy coding!')
