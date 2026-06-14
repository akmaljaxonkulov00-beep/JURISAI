# JurisAI Environment Variables

## Required Environment Variables

### Supabase Configuration
```bash
# Supabase URL
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co

# Supabase Anonymous Key
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Supabase Service Role Key (for server-side operations)
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

### Groq AI Configuration
```bash
# Groq API Key
GROQ_API_KEY=gsk_your-groq-api-key-here
```

### Authentication Configuration
```bash
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-here
```

### Optional Environment Variables
```bash
# Development/Production
NODE_ENV=development

# App Configuration
APP_NAME=JurisAI
APP_URL=http://localhost:3000

# Email Configuration (for password reset, etc.)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL=noreply@jurisai.uz

# Analytics (optional)
GOOGLE_ANALYTICS_ID=your-ga-id

# Feature Flags
ENABLE_AI_FEATURES=true
ENABLE_DOCUMENT_ANALYSIS=true
ENABLE_IRAC_ANALYSIS=true
```

## Setup Instructions

### 1. Supabase Setup
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Create a new project or use existing one
3. Go to Settings > API to get URL and keys
4. Copy the URL and anon key to your environment variables
5. Run the SQL migration file: `supabase/migrations/20240511_create_real_tables.sql`

### 2. Groq AI Setup
1. Go to [Groq Console](https://console.groq.com/)
2. Create an account and get your API key
3. Add the API key to your environment variables

### 3. Environment Files

#### For Development (.env.local)
```bash
# Copy this to .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
GROQ_API_KEY=gsk_your-groq-api-key-here
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-here
```

#### For Production (.env)
```bash
# Copy this to .env for production
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
GROQ_API_KEY=gsk_your-groq-api-key-here
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-nextauth-secret-here
NODE_ENV=production
```

## Database Tables Created

After running the migration, the following tables will be created:

### Core Tables
- **users** - User profiles and authentication data
- **ai_chat_conversations** - Chat conversation history
- **ai_chat_messages** - Individual chat messages
- **user_settings** - User preferences and settings

### AI & Analysis Tables
- **document_analyses** - Document analysis history
- **irac_analyses** - IRAC legal analysis results
- **generated_documents** - AI-generated documents
- **legal_documents** - Legal documents database for RAG

### Supporting Tables
- **usage_tracking** - Feature usage analytics
- **user_bookmarks** - User favorites/bookmarks
- **user_api_keys** - User's custom API keys
- **user_feedback** - User feedback and ratings

## Security Features

### Row Level Security (RLS)
- All tables have RLS enabled
- Users can only access their own data
- Admins can access all data
- Automatic user ID filtering

### Authentication Flow
1. User registers/logs in via Supabase Auth
2. Profile created/updated in users table
3. Session managed by Supabase
4. Middleware protects routes
5. Client-side auth state synchronized

## Migration Steps

1. **Backup existing data** (if any)
2. **Run SQL migration** in Supabase SQL editor
3. **Update environment variables** in your project
4. **Restart development server**
5. **Test authentication** and AI features

## Testing Checklist

- [ ] User registration works
- [ ] User login/logout works
- [ ] Protected routes redirect to login
- [ ] AI chat saves to database
- [ ] Chat history loads correctly
- [ ] Document analysis saves results
- [ ] All mock data replaced with real data

## Troubleshooting

### Common Issues

1. **Supabase Connection Error**
   - Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
   - Ensure URL format is correct (no trailing slash)

2. **Authentication Not Working**
   - Verify middleware.ts is properly configured
   - Check auth service imports

3. **AI Features Not Working**
   - Verify GROQ_API_KEY is set
   - Check google-ai.ts imports

4. **Database Errors**
   - Run SQL migration manually in Supabase
   - Check RLS policies are applied

### Debug Mode

Enable debug logging by setting:
```bash
DEBUG=true
```

This will provide detailed console logs for troubleshooting.
