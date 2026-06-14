'use client';

import React, { useState } from 'react';

export default function SetupSupabasePage() {
  const [envVars, setEnvVars] = useState({
    NEXT_PUBLIC_SUPABASE_URL: '',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: '',
    SUPABASE_SERVICE_ROLE_KEY: ''
  });

  const [saved, setSaved] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEnvVars({
      ...envVars,
      [e.target.name]: e.target.value
    });
  };

  const handleSave = () => {
    // Save to localStorage for development
    Object.entries(envVars).forEach(([key, value]) => {
      if (value) {
        localStorage.setItem(key, value);
      }
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleLoad = () => {
    setEnvVars({
      NEXT_PUBLIC_SUPABASE_URL: localStorage.getItem('NEXT_PUBLIC_SUPABASE_URL') || '',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: localStorage.getItem('NEXT_PUBLIC_SUPABASE_ANON_KEY') || '',
      SUPABASE_SERVICE_ROLE_KEY: localStorage.getItem('SUPABASE_SERVICE_ROLE_KEY') || ''
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Supabase Setup</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Environment Variables</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Supabase URL
              </label>
              <input
                type="text"
                name="NEXT_PUBLIC_SUPABASE_URL"
                value={envVars.NEXT_PUBLIC_SUPABASE_URL}
                onChange={handleChange}
                placeholder="https://your-project.supabase.co"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Supabase Anon Key
              </label>
              <input
                type="text"
                name="NEXT_PUBLIC_SUPABASE_ANON_KEY"
                value={envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY}
                onChange={handleChange}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Supabase Service Role Key
              </label>
              <input
                type="text"
                name="SUPABASE_SERVICE_ROLE_KEY"
                value={envVars.SUPABASE_SERVICE_ROLE_KEY}
                onChange={handleChange}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="mt-6 flex gap-4">
            <button
              onClick={handleSave}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Save to LocalStorage
            </button>
            
            <button
              onClick={handleLoad}
              className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700"
            >
              Load from LocalStorage
            </button>
          </div>
          
          {saved && (
            <div className="mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
              Environment variables saved to localStorage!
            </div>
          )}
        </div>
        
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">How to get Supabase credentials:</h3>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>Go to <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">supabase.com</a></li>
            <li>Create a new project or select existing one</li>
            <li>Go to Project Settings → API</li>
            <li>Copy the Project URL (NEXT_PUBLIC_SUPABASE_URL)</li>
            <li>Copy the anon public key (NEXT_PUBLIC_SUPABASE_ANON_KEY)</li>
            <li>Copy the service_role key (SUPABASE_SERVICE_ROLE_KEY)</li>
            <li>Paste them here and click "Save to LocalStorage"</li>
          </ol>
        </div>
        
        <div className="mt-8 bg-yellow-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Important Notes:</h3>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>These credentials are stored in localStorage for development only</li>
            <li>In production, use proper .env.local file</li>
            <li>Never expose service role key in client-side code</li>
            <li>Make sure your Supabase project has authentication enabled</li>
            <li>Check that email confirmation is disabled or users are confirmed</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
