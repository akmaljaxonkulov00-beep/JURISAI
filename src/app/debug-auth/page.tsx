'use client'

import { useState } from 'react'
import { runAllTests, testLogin, testAuthHelper } from '@/lib/test-auth'
import { createAdminUser, createTestUsers } from '@/lib/create-admin-user'
import { checkEnvironmentVariables, checkSupabaseAccess } from '@/lib/check-env'
import { checkEnvLocalFile, checkRuntimeEnvironment, validateSupabaseConfig } from '@/lib/check-env-local'

export default function DebugAuthPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [testEmail, setTestEmail] = useState('admin@jurisai.uz')
  const [testPassword, setTestPassword] = useState('password123')

  const runTests = async () => {
    setIsLoading(true)
    try {
      const testResults = await runAllTests()
      setResults(testResults)
    } catch (error) {
      console.error('Test error:', error)
      setResults({ error: error.toString() })
    }
    setIsLoading(false)
  }

  const testSpecificLogin = async () => {
    setIsLoading(true)
    try {
      const directResult = await testLogin(testEmail, testPassword)
      const helperResult = await testAuthHelper(testEmail, testPassword)
      
      setResults({
        directLogin: directResult,
        authHelper: helperResult,
      })
    } catch (error) {
      console.error('Specific test error:', error)
      setResults({ error: String(error) })
    }
    setIsLoading(false)
  }

  const checkEnvironment = async () => {
    setIsLoading(true)
    try {
      const envCheck = checkEnvironmentVariables()
      const accessCheck = await checkSupabaseAccess()
      const envLocalCheck = checkEnvLocalFile()
      const runtimeCheck = checkRuntimeEnvironment()
      const validationCheck = validateSupabaseConfig()
      
      setResults({
        environment: envCheck,
        access: accessCheck,
        envLocalFile: envLocalCheck,
        runtimeEnvironment: runtimeCheck,
        supabaseValidation: validationCheck,
      })
    } catch (error) {
      console.error('Environment check error:', error)
      setResults({ error: String(error) })
    }
    setIsLoading(false)
  }

  const createAdmin = async () => {
    setIsLoading(true)
    try {
      const adminResult = await createAdminUser()
      setResults({
        adminCreation: adminResult,
      })
    } catch (error) {
      console.error('Create admin error:', error)
      setResults({ error: String(error) })
    }
    setIsLoading(false)
  }

  const createAllUsers = async () => {
    setIsLoading(true)
    try {
      const adminResult = await createAdminUser()
      const testUsersResult = await createTestUsers()
      
      setResults({
        adminCreation: adminResult,
        testUsersCreation: testUsersResult,
      })
    } catch (error) {
      console.error('Create users error:', error)
      setResults({ error: String(error) })
    }
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Auth Debug Page</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Credentials</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Email:</label>
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Password:</label>
              <input
                type="password"
                value={testPassword}
                onChange={(e) => setTestPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-6">
            <button
              onClick={runTests}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Testing...' : 'Run All Tests'}
            </button>
            <button
              onClick={testSpecificLogin}
              disabled={isLoading}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {isLoading ? 'Testing...' : 'Test Login Only'}
            </button>
            <button
              onClick={checkEnvironment}
              disabled={isLoading}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
            >
              {isLoading ? 'Checking...' : 'Check Environment'}
            </button>
            <button
              onClick={createAdmin}
              disabled={isLoading}
              className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50"
            >
              {isLoading ? 'Creating...' : 'Create Admin User'}
            </button>
            <button
              onClick={createAllUsers}
              disabled={isLoading}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 col-span-2"
            >
              {isLoading ? 'Creating...' : 'Create All Test Users'}
            </button>
          </div>
        </div>

        {results && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Test Results</h2>
            <pre className="bg-gray-100 p-4 rounded-md overflow-auto text-sm">
              {JSON.stringify(results, null, 2)}
            </pre>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4">Test Accounts</h2>
          <div className="space-y-2 text-sm">
            <p><strong>Admin:</strong> admin@jurisai.uz / password123</p>
            <p><strong>User:</strong> user@jurisai.uz / password123</p>
            <p><strong>Demo:</strong> demo@jurisai.uz / password123</p>
          </div>
        </div>
      </div>
    </div>
  )
}
