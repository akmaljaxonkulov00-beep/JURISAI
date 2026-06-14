-- Create lawyers table
CREATE TABLE IF NOT EXISTS lawyers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20) NOT NULL,
  license_number VARCHAR(50) UNIQUE NOT NULL,
  specialization TEXT[] NOT NULL,
  experience INTEGER DEFAULT 0,
  office_address TEXT NOT NULL,
  education TEXT NOT NULL,
  bar_association VARCHAR(100) NOT NULL,
  bio TEXT NOT NULL,
  website VARCHAR(255),
  linkedin VARCHAR(255),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE
);

-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lawyer_id UUID REFERENCES lawyers(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  address TEXT,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create client_cases table
CREATE TABLE IF NOT EXISTS client_cases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  lawyer_id UUID REFERENCES lawyers(id) ON DELETE CASCADE,
  case_type VARCHAR(100) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
  revenue DECIMAL(12, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create client_requests table
CREATE TABLE IF NOT EXISTS client_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lawyer_id UUID REFERENCES lawyers(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  subject VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  urgency VARCHAR(10) DEFAULT 'medium' CHECK (urgency IN ('low', 'medium', 'high')),
  category VARCHAR(100) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'rejected')),
  lawyer_response TEXT,
  estimated_time VARCHAR(100),
  estimated_cost DECIMAL(12, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create document_analyses table
CREATE TABLE IF NOT EXISTS document_analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lawyer_id UUID REFERENCES lawyers(id) ON DELETE CASCADE,
  document_name VARCHAR(255) NOT NULL,
  document_type VARCHAR(100) NOT NULL,
  file_path VARCHAR(500),
  analysis_result JSONB NOT NULL,
  confidence INTEGER DEFAULT 0 CHECK (confidence >= 0 AND confidence <= 100),
  status VARCHAR(20) DEFAULT 'analyzing' CHECK (status IN ('analyzing', 'completed', 'error')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_lawyers_user_id ON lawyers(user_id);
CREATE INDEX IF NOT EXISTS idx_lawyers_email ON lawyers(email);
CREATE INDEX IF NOT EXISTS idx_lawyers_status ON lawyers(status);

CREATE INDEX IF NOT EXISTS idx_clients_lawyer_id ON clients(lawyer_id);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);

CREATE INDEX IF NOT EXISTS idx_client_cases_client_id ON client_cases(client_id);
CREATE INDEX IF NOT EXISTS idx_client_cases_lawyer_id ON client_cases(lawyer_id);
CREATE INDEX IF NOT EXISTS idx_client_cases_status ON client_cases(status);

CREATE INDEX IF NOT EXISTS idx_client_requests_lawyer_id ON client_requests(lawyer_id);
CREATE INDEX IF NOT EXISTS idx_client_requests_client_id ON client_requests(client_id);
CREATE INDEX IF NOT EXISTS idx_client_requests_status ON client_requests(status);
CREATE INDEX IF NOT EXISTS idx_client_requests_urgency ON client_requests(urgency);

CREATE INDEX IF NOT EXISTS idx_document_analyses_lawyer_id ON document_analyses(lawyer_id);
CREATE INDEX IF NOT EXISTS idx_document_analyses_status ON document_analyses(status);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_lawyers_updated_at BEFORE UPDATE ON lawyers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_client_cases_updated_at BEFORE UPDATE ON client_cases
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_client_requests_updated_at BEFORE UPDATE ON client_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_document_analyses_updated_at BEFORE UPDATE ON document_analyses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE lawyers ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_analyses ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Lawyers can only access their own data
CREATE POLICY "Lawyers can view own profile" ON lawyers
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Lawyers can update own profile" ON lawyers
    FOR UPDATE USING (auth.uid() = user_id);

-- Clients can only be accessed by their lawyer
CREATE POLICY "Lawyers can view their clients" ON clients
    FOR SELECT USING (auth.uid() IN (SELECT user_id FROM lawyers WHERE id = lawyer_id));

CREATE POLICY "Lawyers can manage their clients" ON clients
    FOR ALL USING (auth.uid() IN (SELECT user_id FROM lawyers WHERE id = lawyer_id));

-- Client cases can only be accessed by the lawyer
CREATE POLICY "Lawyers can view their cases" ON client_cases
    FOR SELECT USING (auth.uid() IN (SELECT user_id FROM lawyers WHERE id = lawyer_id));

CREATE POLICY "Lawyers can manage their cases" ON client_cases
    FOR ALL USING (auth.uid() IN (SELECT user_id FROM lawyers WHERE id = lawyer_id));

-- Client requests can only be accessed by the lawyer
CREATE POLICY "Lawyers can view their requests" ON client_requests
    FOR SELECT USING (auth.uid() IN (SELECT user_id FROM lawyers WHERE id = lawyer_id));

CREATE POLICY "Lawyers can manage their requests" ON client_requests
    FOR ALL USING (auth.uid() IN (SELECT user_id FROM lawyers WHERE id = lawyer_id));

-- Document analyses can only be accessed by the lawyer
CREATE POLICY "Lawyers can view their document analyses" ON document_analyses
    FOR SELECT USING (auth.uid() IN (SELECT user_id FROM lawyers WHERE id = lawyer_id));

CREATE POLICY "Lawyers can manage their document analyses" ON document_analyses
    FOR ALL USING (auth.uid() IN (SELECT user_id FROM lawyers WHERE id = lawyer_id));
