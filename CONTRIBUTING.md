# 🤝 Contributing to JURISAI

Birinchi navbatda, JURISAI'ga hissa qo'shish uchun vaqt ajratganingiz uchun rahmat!

## 📋 Jarayon

### 1. Fork va Clone
```bash
# Fork qiling GitHub'da
# Keyin clone qiling
git clone https://github.com/YOUR_USERNAME/jurisai.git
cd jurisai
```

### 2. Branch yarating
```bash
git checkout -b feature/amazing-feature
# yoki
git checkout -b fix/bug-fix
```

### 3. Development Setup
```bash
# Dependencies o'rnating
npm install
cd backend && pip install -r requirements.txt

# Environment sozlang
cp .env.example .env.local
```

### 4. O'zgarishlar kiriting
```bash
# Kodingizni yozing
# Testlar qo'shing
# Dokumentatsiya yangilang
```

### 5. Testlar
```bash
# Barcha testlarni run qiling
npm run test
npm run test:coverage

# Backend testlar
cd backend
pytest
```

### 6. Commit
```bash
# Conventional commits format
git commit -m "feat: add new feature"
git commit -m "fix: resolve bug"
git commit -m "docs: update documentation"
```

### 7. Push va PR
```bash
git push origin feature/amazing-feature
# GitHub'da Pull Request oching
```

## 📝 Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types:
- `feat`: Yangi feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting, missing semi colons, etc
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance

### Examples:
```
feat(irac): add confidence score calculation
fix(auth): resolve login redirect issue
docs(readme): update installation instructions
test(security): add XSS prevention tests
```

## 🧪 Testing Guidelines

### Frontend Tests
```typescript
// Use descriptive test names
describe('AccessibleButton', () => {
  it('should render with correct variant', () => {
    // Test code
  })
  
  it('should be keyboard accessible', () => {
    // Test code
  })
})
```

### Backend Tests
```python
# Use pytest fixtures
@pytest.fixture
def sample_data():
    return {"key": "value"}

def test_function(sample_data):
    assert sample_data["key"] == "value"
```

## 📚 Code Style

### TypeScript/React
```typescript
// Use functional components
export function MyComponent({ prop }: Props) {
  return <div>{prop}</div>
}

// Use TypeScript types
interface Props {
  prop: string
}

// Use descriptive names
const handleUserLogin = () => {}
```

### Python
```python
# Follow PEP 8
def calculate_confidence_score(text: str) -> float:
    """Calculate confidence score for text.
    
    Args:
        text: Input text to analyze
        
    Returns:
        Confidence score between 0 and 1
    """
    return 0.8
```

## 🔍 Pull Request Checklist

- [ ] Tests qo'shilgan
- [ ] Documentation yangilangan
- [ ] Commit messages to'g'ri formatda
- [ ] Barcha testlar o'tgan
- [ ] Code review uchun tayyor
- [ ] No merge conflicts

## 🐛 Bug Report

Issues ochishda quyidagilarni kiriting:

1. **Bug tavsifi**: Qisqa va aniq
2. **Qayta ishlatish qadamlari**:
   - Qadam 1
   - Qadam 2
   - Qadam 3
3. **Kutilgan natija**: Nima bo'lishi kerak edi
4. **Haqiqiy natija**: Nima bo'ldi
5. **Screenshot**: Agar kerak bo'lsa
6. **Muhit**:
   - OS: [e.g. Windows 11]
   - Browser: [e.g. Chrome 120]
   - Node version: [e.g. 18.0.0]

## 💡 Feature Request

1. **Feature tavsifi**: Qanday feature kerak
2. **Muammo**: Qanday muammoni hal qiladi
3. **Taklif qilingan yechim**: Qanday ishlashi kerak
4. **Alternativalar**: Boshqa variantlar

## 📞 Yordam

- GitHub Issues: [Link]
- Telegram: @jurisai
- Email: dev@jurisai.uz

## 🙏 Rahmat

Har bir hissa muhim! Katta yoki kichik bo'lishidan qat'i nazar, barcha contributorlar'ga rahmat!
