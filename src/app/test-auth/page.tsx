'use client';

import React, { useState } from 'react';
import { supabaseClient, authHelpers } from '@/lib/supabase-client';

export default function TestAuthPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testAuth = async () => {
    setLoading(true);
    try {
      console.log('=== TESTING AUTH ===');
      
      // Test environment variables
      console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
      console.log('Supabase Key exists:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
      
      // Test direct Supabase call
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: 'admin@jurisai.uz',
        password: 'password123'
      });
      
      console.log('Direct Supabase result:', { data, error });
      
      // Test auth helpers
      const authResult = await authHelpers.signIn('admin@jurisai.uz', 'password123');
      console.log('Auth helpers result:', authResult);
      
      setResult({
        directSupabase: { data, error },
        authHelpers: authResult,
        envVars: {
          url: process.env.NEXT_PUBLIC_SUPABASE_URL,
          keyExists: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          keyLength: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length
        }
      });
    } catch (err) {
      console.error('Test error:', err);
      setResult({ error: String(err) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Authentication Test</h1>
        
        <button
          onClick={testAuth}
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test Authentication'}
        </button>
        
        {result && (
          <div className="mt-8 bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Results:</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
