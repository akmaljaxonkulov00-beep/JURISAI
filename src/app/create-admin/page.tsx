'use client'

import { useState } from 'react'
import { createAdminUser, createTestUsers } from '@/lib/create-admin-user'

export default function CreateAdminPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<any>(null)

  const createAdmin = async () => {
    setIsLoading(true)
    try {
      const result = await createAdminUser()
      setResults(result)
    } catch (error) {
      console.error('Create admin error:', error)
      setResults({ success: false, error: String(error) })
    }
    setIsLoading(false)
  }

  const createAllUsers = async () => {
    setIsLoading(true)
    try {
      const adminResult = await createAdminUser()
      const testUsersResult = await createTestUsers()
      
      setResults({
        admin: adminResult,
        testUsers: testUsersResult
      })
    } catch (error) {
      console.error('Create users error:', error)
      setResults({ success: false, error: String(error) })
    }
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Create Admin User</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Admin Credentials</h2>
          <div className="space-y-2 text-sm mb-6">
            <p><strong>Email:</strong> admin@jurisai.uz</p>
            <p><strong>Password:</strong> password123</p>
            <p><strong>Name:</strong> Admin User</p>
            <p><strong>Role:</strong> ADMIN</p>
          </div>
          
          <div className="flex gap-4">
            <button
              onClick={createAdmin}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Creating...' : 'Create Admin User'}
            </button>
            <button
              onClick={createAllUsers}
              disabled={isLoading}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {isLoading ? 'Creating...' : 'Create All Test Users'}
            </button>
          </div>
        </div>

        {results && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Results</h2>
            <pre className="bg-gray-100 p-4 rounded-md overflow-auto text-sm">
              {JSON.stringify(results, null, 2)}
            </pre>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4">Test Users</h2>
          <div className="space-y-2 text-sm">
            <p><strong>User:</strong> user@jurisai.uz / password123</p>
            <p><strong>Demo:</strong> demo@jurisai.uz / password123</p>
            <p><strong>Test:</strong> test@jurisai.uz / password123</p>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
          <h3 className="text-yellow-800 font-semibold mb-2">Important Notes:</h3>
          <ul className="text-yellow-700 text-sm space-y-1">
            <li>• This will create users in Supabase Auth</li>
            <li>• Admin user will have ADMIN role</li>
            <li>• Test users will have USER role</li>
            <li>• If users already exist, it will show "exists" status</li>
            <li>• After creation, try login at /signin</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
