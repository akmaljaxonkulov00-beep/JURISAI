-- JurisAI Manual Payment - Supabase Database Setup (Fixed Version)
-- Bu SQL ni Supabase Dashboard → SQL Editor da bajaring

-- 1. Users table (agar mavjud bo'lmasa)
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  role TEXT DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN')),
  subscription_plan VARCHAR(255) DEFAULT 'free',
  subscription_expires_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Payments table
CREATE TABLE IF NOT EXISTS payments (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  plan_id VARCHAR(255) NOT NULL,
  plan_name VARCHAR(255) NOT NULL,
  plan_price DECIMAL(10, 2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  check_image TEXT,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP NULL,
  processed_by VARCHAR(255) NULL,
  notes TEXT NULL,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. Subscription history table
CREATE TABLE IF NOT EXISTS subscription_history (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  plan_id VARCHAR(255) NOT NULL,
  plan_name VARCHAR(255) NOT NULL,
  plan_price DECIMAL(10, 2) NOT NULL,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  payment_id VARCHAR(255),
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (payment_id) REFERENCES payments(id)
);

-- 4. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_submitted_at ON payments(submitted_at);
CREATE INDEX IF NOT EXISTS idx_subscription_history_user_id ON subscription_history(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_history_expires_at ON subscription_history(expires_at);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_history ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies

-- Users can only see their own payments
CREATE POLICY "Users can view own payments" ON payments
  FOR SELECT USING (auth.uid()::text = user_id);

-- Users can only insert their own payments
CREATE POLICY "Users can insert own payments" ON payments
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Admins can view all payments
CREATE POLICY "Admins can view all payments" ON payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid()::text AND role = 'ADMIN'
    )
  );

-- Admins can update all payments
CREATE POLICY "Admins can update all payments" ON payments
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid()::text AND role = 'ADMIN'
    )
  );

-- Users can only view their own subscription history
CREATE POLICY "Users can view own subscription history" ON subscription_history
  FOR SELECT USING (auth.uid()::text = user_id);

-- Admins can view all subscription history
CREATE POLICY "Admins can view all subscription history" ON subscription_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid()::text AND role = 'ADMIN'
    )
  );

-- 7. Storage bucket for check images
INSERT INTO storage.buckets (id, name, public)
VALUES ('check-images', 'check-images', false)
ON CONFLICT (id) DO NOTHING;

-- 8. Storage policies
-- Allow public access to check images (for approved payments)
CREATE POLICY "Public check images" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'check-images' AND
    (
      -- Users can see their own approved checks
      (auth.role() = 'authenticated' AND 
       (storage.foldername(name))[1] = auth.uid()::text) OR
      -- Admins can see all checks
      EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid()::text AND role = 'ADMIN'
      )
    )
  );

-- Allow users to upload their own check images
CREATE POLICY "Users can upload own checks" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'check-images' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- 9. Sample data (optional - test uchun)
INSERT INTO users (id, name, email, role) VALUES 
('test-user-1', 'Test User', 'test@example.com', 'USER'),
('test-admin-1', 'Test Admin', 'admin@example.com', 'ADMIN')
ON CONFLICT (id) DO NOTHING;

-- 10. Functions for subscription management
CREATE OR REPLACE FUNCTION update_user_subscription()
RETURNS TRIGGER AS $$
BEGIN
  -- When payment is approved, update user subscription
  IF NEW.status = 'approved' AND OLD.status = 'pending' THEN
    UPDATE users SET 
      subscription_plan = NEW.plan_id,
      subscription_expires_at = (
        CASE 
          WHEN NEW.plan_id = 'lifetime' THEN '2099-12-31'::timestamp
          ELSE CURRENT_TIMESTAMP + INTERVAL '1 month'
        END
      )
    WHERE id = NEW.user_id;
    
    -- Add to subscription history
    INSERT INTO subscription_history (
      id, user_id, plan_id, plan_name, plan_price, 
      started_at, expires_at, payment_id
    ) VALUES (
      gen_random_uuid()::text, NEW.user_id, NEW.plan_id, NEW.plan_name, 
      NEW.plan_price, CURRENT_TIMESTAMP, 
      CASE 
        WHEN NEW.plan_id = 'lifetime' THEN '2099-12-31'::timestamp
        ELSE CURRENT_TIMESTAMP + INTERVAL '1 month'
      END,
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 11. Trigger for automatic subscription update
CREATE TRIGGER update_subscription_trigger
  AFTER UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_user_subscription();

-- 12. View for payment statistics
CREATE OR REPLACE VIEW payment_stats AS
SELECT 
  status,
  COUNT(*) as count,
  SUM(plan_price) as total_amount,
  AVG(plan_price) as avg_amount
FROM payments 
GROUP BY status;

-- 13. View for user subscription info
CREATE OR REPLACE VIEW user_subscriptions AS
SELECT 
  u.id,
  u.name,
  u.email,
  u.subscription_plan,
  u.subscription_expires_at,
  CASE 
    WHEN u.subscription_expires_at > CURRENT_TIMESTAMP THEN 'active'
    WHEN u.subscription_expires_at IS NULL THEN 'free'
    ELSE 'expired'
  END as subscription_status,
  COUNT(p.id) as total_payments,
  SUM(CASE WHEN p.status = 'approved' THEN p.plan_price ELSE 0 END) as total_spent
FROM users u
LEFT JOIN payments p ON u.id = p.user_id
GROUP BY u.id, u.name, u.email, u.subscription_plan, u.subscription_expires_at;

-- 14. Cleanup function for expired subscriptions
CREATE OR REPLACE FUNCTION cleanup_expired_subscriptions()
RETURNS void AS $$
BEGIN
  UPDATE users 
  SET subscription_plan = 'free', subscription_expires_at = NULL
  WHERE subscription_expires_at < CURRENT_TIMESTAMP 
  AND subscription_plan != 'free';
END;
$$ LANGUAGE plpgsql;

-- 15. Success notification
DO $$
BEGIN
  RAISE NOTICE 'JurisAI Payment Database Setup Complete! 🎉';
  RAISE NOTICE 'Tables: users, payments, subscription_history';
  RAISE NOTICE 'Storage: check-images bucket created';
  RAISE NOTICE 'RLS policies enabled';
  RAISE NOTICE 'Triggers and views created';
END $$;
