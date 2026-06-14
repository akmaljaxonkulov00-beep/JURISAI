# 🗄️ DATABASE MIGRATION GUIDE

## SQLite → PostgreSQL Migration

### 1. Install PostgreSQL

#### Local (Development)
```bash
# Windows (using Docker)
docker run -d \
  --name jurisai-postgres \
  -e POSTGRES_DB=jurisai \
  -e POSTGRES_USER=jurisai_user \
  -e POSTGRES_PASSWORD=your_password \
  -p 5432:5432 \
  postgres:15-alpine

# Or install from postgresql.org
```

#### Production (Supabase)
- Supabase already includes PostgreSQL
- Database URL: Already in your .env.local

---

### 2. Install Dependencies

```bash
cd backend
pip install alembic psycopg2-binary
```

---

### 3. Configure Database URL

```bash
# .env (backend)
# Development
DATABASE_URL=postgresql://jurisai_user:your_password@localhost:5432/jurisai

# Production (Supabase)
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
```

---

### 4. Initialize Alembic

```bash
cd backend

# Already configured! But if needed:
# alembic init migrations

# Create first migration
alembic revision --autogenerate -m "Initial schema"

# Apply migrations
alembic upgrade head
```

---

### 5. Data Migration Script

Create `backend/scripts/migrate_data.py`:

```python
"""
Migrate data from SQLite to PostgreSQL
"""

import sqlite3
import asyncpg
import asyncio
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Source (SQLite)
SQLITE_PATH = "./jurisai.db"

# Destination (PostgreSQL)
POSTGRES_URL = "postgresql://user:pass@localhost:5432/jurisai"

async def migrate_users():
    # Connect to SQLite
    sqlite_conn = sqlite3.connect(SQLITE_PATH)
    sqlite_cursor = sqlite_conn.cursor()
    
    # Connect to PostgreSQL
    pg_conn = await asyncpg.connect(POSTGRES_URL)
    
    # Get users from SQLite
    users = sqlite_cursor.execute("SELECT * FROM users").fetchall()
    
    # Insert into PostgreSQL
    for user in users:
        await pg_conn.execute("""
            INSERT INTO users (id, email, name, role, created_at)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (id) DO NOTHING
        """, *user)
    
    print(f"Migrated {len(users)} users")
    
    await pg_conn.close()
    sqlite_conn.close()

async def main():
    await migrate_users()
    # Add more tables...
    print("Migration complete!")

if __name__ == "__main__":
    asyncio.run(main())
```

Run:
```bash
python backend/scripts/migrate_data.py
```

---

### 6. Alembic Commands

```bash
# Create migration
alembic revision --autogenerate -m "Add new table"

# Apply migrations
alembic upgrade head

# Rollback one migration
alembic downgrade -1

# Show current version
alembic current

# Show migration history
alembic history

# Rollback to specific version
alembic downgrade <revision_id>
```

---

### 7. Update Backend Configuration

`backend/core/database.py`:

```python
from sqlalchemy import create_engine
from core.config import settings

# PostgreSQL configuration
engine = create_engine(
    settings.DATABASE_URL,
    pool_size=settings.DB_POOL_SIZE,
    max_overflow=settings.DB_MAX_OVERFLOW,
    pool_pre_ping=True,  # Check connection health
    echo=settings.DB_ECHO,
)
```

---

### 8. Backup Strategy

#### Automated Backups
```bash
# Add to crontab (daily at 2 AM)
0 2 * * * pg_dump -h localhost -U jurisai_user jurisai > /backups/jurisai_$(date +\%Y\%m\%d).sql
```

#### Manual Backup
```bash
# Backup
pg_dump -h localhost -U jurisai_user jurisai > backup.sql

# Restore
psql -h localhost -U jurisai_user jurisai < backup.sql
```

---

### 9. Performance Optimization

```sql
-- Add indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_irac_user_id ON irac_analyses(user_id);
CREATE INDEX idx_irac_created ON irac_analyses(created_at DESC);

-- Analyze tables
ANALYZE users;
ANALYZE irac_analyses;

-- Vacuum (cleanup)
VACUUM ANALYZE;
```

---

### 10. Testing

```bash
# Test connection
python -c "from backend.core.database import engine; print(engine.execute('SELECT 1').scalar())"

# Run tests
pytest backend/tests/

# Check migration status
alembic current
```

---

## ✅ Migration Checklist

- [ ] PostgreSQL installed/configured
- [ ] Alembic initialized
- [ ] First migration created
- [ ] Migration applied successfully
- [ ] Data migrated from SQLite
- [ ] Indexes created
- [ ] Backup strategy configured
- [ ] Tests passing
- [ ] Application works with PostgreSQL

---

## 🚨 Common Issues

### Issue: "relation does not exist"
```bash
# Solution: Run migrations
alembic upgrade head
```

### Issue: "password authentication failed"
```bash
# Solution: Check DATABASE_URL in .env
```

### Issue: Migration conflicts
```bash
# Solution: Rollback and recreate
alembic downgrade -1
alembic revision --autogenerate -m "Fix schema"
alembic upgrade head
```

---

## 📚 Resources

- [Alembic Documentation](https://alembic.sqlalchemy.org/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Supabase Database](https://supabase.com/docs/guides/database)
