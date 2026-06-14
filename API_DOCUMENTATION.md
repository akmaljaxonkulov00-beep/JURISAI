# 📚 JURISAI - API DOCUMENTATION

> Complete API reference for all endpoints and AI functions

## 📋 TABLE OF CONTENTS

1. [AI Client API](#ai-client-api)
2. [REST API Endpoints](#rest-api-endpoints)
3. [Data Structures](#data-structures)
4. [Error Handling](#error-handling)
5. [Rate Limiting](#rate-limiting)

---

## 🤖 AI CLIENT API

### Base Import

```typescript
import { aiClient } from '@/lib/ai-client';
```

### Available Models

```typescript
const MODELS = {
  LLAMA_8B: 'llama-3.1-8b-instant',      // Fast, general use
  LLAMA_70B: 'llama-3.3-70b-versatile',  // Complex tasks
  MIXTRAL: 'mixtral-8x7b-32768'          // Long context
};
```

---

## 📖 AI FUNCTIONS

### 1. analyzeIRAC()

Analyze legal cases using IRAC methodology.

**Signature:**
```typescript
analyzeIRAC(caseData: string): Promise<AIResponse>
```

**Parameters:**
- `caseData` (string, required): Case description (min 50 characters)

**Returns:**
```typescript
{
  text: string;      // IRAC formatted analysis
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  }
}
```

**Example:**
```typescript
const result = await aiClient.analyzeIRAC(
  `Shartnoma nizosi: Ali va Vali o'rtasida 10 million so'm 
   qiymatidagi uy-joy sotish shartnomasi tuzilgan. 
   Ali pul to'lagan, lekin Vali uyni topshirmagan.`
);

console.log(result.text);
```

**Response Format:**
```
ISSUE (Masala):
[Issue tavsifi]

RULE (Qoida):
[Tegishli qonun va me'yorlar]

APPLICATION (Qo'llash):
[Qonunni holatga qo'llash]

CONCLUSION (Xulosa):
[Yakuniy xulosa]
```

**Errors:**
- `InputValidationError`: Input 50 belgidan kam
- `AIServiceError`: API xatosi

---

### 2. generateDocument()

Generate legal documents.

**Signature:**
```typescript
generateDocument(
  documentType: string,
  documentData: string
): Promise<AIResponse>
```

**Parameters:**
- `documentType` (string, required): Document type
- `documentData` (string, required): Document data (min 20 characters)

**Document Types:**
```typescript
type DocumentType = 
  | 'shartnoma'       // Contract
  | 'ariza'           // Application
  | 'davo'            // Lawsuit
  | 'shikoyat'        // Complaint
  | 'bayonnoma'       // Statement
  | 'ishonchnoma';    // Power of Attorney
```

**Example:**
```typescript
const result = await aiClient.generateDocument(
  'shartnoma',
  `Tomonlar: Ali Valiyev va Vali Karimov
   Predmet: Uy-joy sotish
   Narx: 10 million so'm
   Manzil: Toshkent shahar, Chilonzor tumani`
);
```

**Response Format:**
```
[DOCUMENT TYPE]

[Document content in professional format]

Sana: [Date]
Imzo: [Signature lines]
```

---

### 3. detectWeaknesses()

Detect weaknesses in legal arguments.

**Signature:**
```typescript
detectWeaknesses(argument: string): Promise<AIResponse>
```

**Parameters:**
- `argument` (string, required): Legal argument (min 30 characters)

**Example:**
```typescript
const result = await aiClient.detectWeaknesses(
  `Mening argumentim: Shartnoma tuzilgan, pul to'langan, 
   lekin uy topshirilmagan. Shuning uchun Vali javobgar.`
);
```

**Response Format:**
```
ZAIF TOMONLAR:
1. [Weakness 1]
2. [Weakness 2]

KUCHLI TOMONLAR:
1. [Strength 1]
2. [Strength 2]

TAVSIYALAR:
- [Recommendation 1]
- [Recommendation 2]
```

---

### 4. generateScenario()

Generate legal scenarios for education.

**Signature:**
```typescript
generateScenario(
  topic: string,
  difficulty?: 'oson' | 'orta' | 'qiyin'
): Promise<AIResponse>
```

**Parameters:**
- `topic` (string, required): Scenario topic (min 5 characters)
- `difficulty` (string, optional): Difficulty level (default: 'orta')

**Example:**
```typescript
const result = await aiClient.generateScenario(
  'Mehnat shartnomasi buzilishi',
  'orta'
);
```

**Response Format:**
```
SARLAVHA:
[Title]

VAZIYAT:
[Situation description]

ISHTIROKCHILAR:
- [Participant 1]
- [Participant 2]

MASALALAR:
1. [Issue 1]
2. [Issue 2]

SAVOLLAR:
- [Question 1]
- [Question 2]
```

---

### 5. simulateCourt()

Simulate court proceedings.

**Signature:**
```typescript
simulateCourt(caseDetails: string): Promise<AIResponse>
```

**Parameters:**
- `caseDetails` (string, required): Case details (min 50 characters)

**Example:**
```typescript
const result = await aiClient.simulateCourt(
  `O'g'irlik holati bo'yicha jinoyat ishi. 
   Mening rolim: Himoyachi. 
   Ayblov: 1 million so'm qiymatidagi telefon o'g'irlangan.`
);
```

**Response Format:**
```
SUD MAJLISI BOSHLANDI

Sudya: [Opening statement]

Da'vogar: [Plaintiff statement]

Javobgar: [Defendant statement]

[Proceedings continue...]

QAROR:
[Decision]
```

---

### 6. chatMessage()

General legal consultation chat.

**Signature:**
```typescript
chatMessage(
  message: string,
  context?: string
): Promise<AIResponse>
```

**Parameters:**
- `message` (string, required): User message (min 3 characters)
- `context` (string, optional): Conversation context

**Example:**
```typescript
const result = await aiClient.chatMessage(
  'Shartnoma qanday tuziladi?',
  'O\'zbekiston huquq tizimi'
);
```

---

## 🌐 REST API ENDPOINTS

### Base URL

```
http://localhost:3000/api
```

---

### POST /api/ai/chat

AI chat endpoint.

**Request:**
```typescript
{
  message: string;
  context?: string;
}
```

**Response:**
```typescript
{
  text: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  }
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Shartnoma qanday tuziladi?",
    "context": "O\'zbekiston huquq tizimi"
  }'
```

---

### POST /api/court-simulator

Court simulation endpoint.

**Actions:**
- `start` - Start simulation
- `submit_argument` - Submit argument
- `get_verdict` - Get final verdict

**Request (start):**
```typescript
{
  action: 'start';
  caseDetails: string;
}
```

**Response:**
```typescript
{
  simulation_id: string;
  status: 'active';
  current_phase: string;
  transcript: Array<{
    id: string;
    speaker: string;
    content: string;
    timestamp: string;
  }>;
  evidence: Array<{
    id: string;
    type: string;
    title: string;
    description: string;
    credibility_score: number;
  }>;
}
```

**Request (submit_argument):**
```typescript
{
  action: 'submit_argument';
  simulationId: string;
  argument: string;
}
```

**Request (get_verdict):**
```typescript
{
  action: 'get_verdict';
  simulationId: string;
}
```

**Response (verdict):**
```typescript
{
  verdict: string;
  score: number;
  outcome: string;
  feedback: {
    argument_quality: string;
    legal_knowledge: string;
    presentation: string;
  }
}
```

---

### GET /api/legal-database

Legal database search.

**Query Parameters:**
- `action` (required): 'categories' | 'popular' | 'search'
- `query` (optional): Search query

**Response (categories):**
```typescript
{
  categories: Array<{
    id: string;
    name: string;
    icon: string;
    count: number;
    description: string;
  }>
}
```

**Response (search):**
```typescript
{
  articles: Array<{
    id: string;
    title: string;
    category: string;
    description: string;
    content: string;
    article_number: string;
    last_updated: string;
    relevance_score: number;
    view_count: number;
  }>;
  total: number;
  query: string;
  search_time: number;
  suggestions: string[];
}
```

**Example:**
```bash
curl "http://localhost:3000/api/legal-database?action=search&query=shartnoma"
```

---

### POST /api/decision-tree

Decision tree generation.

**Actions:**
- `create` - Create new tree
- `update` - Update tree node
- `get_trees` - Get all trees

**Request (create):**
```typescript
{
  action: 'create';
  scenario_title: string;
  scenario_description: string;
  case_type: string;
}
```

**Response:**
```typescript
{
  id: string;
  scenario_title: string;
  scenario_description: string;
  tree_data: {
    nodes: Array<{
      id: string;
      title: string;
      description: string;
      type: string;
      options: Array<{
        id: string;
        text: string;
        next: string;
      }>;
      risk_level: string;
    }>;
    edges: Array<{
      from: string;
      to: string;
      condition: string;
    }>;
  };
  risk_assessment: {
    overall_risk: string;
    legal_risks: string[];
    financial_risks: string[];
  };
  ai_recommendations: string[];
}
```

---

## 📊 DATA STRUCTURES

### AIResponse

```typescript
interface AIResponse {
  text: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}
```

### CourtSimulation

```typescript
interface CourtSimulation {
  simulation_id: string;
  status: 'active' | 'paused' | 'completed';
  current_phase: string;
  elapsed_time: number;
  remaining_time?: number;
  transcript: TranscriptEntry[];
  evidence: EvidenceItem[];
}
```

### DecisionTree

```typescript
interface DecisionTree {
  id: string;
  scenario_title: string;
  scenario_description: string;
  tree_data: {
    nodes: DecisionNode[];
    edges: DecisionEdge[];
  };
  current_node: string;
  path_taken: string[];
  confidence_score: number;
  risk_assessment: RiskAssessment;
}
```

---

## ❌ ERROR HANDLING

### Error Response Format

```typescript
{
  error: string;
  status: number;
  details?: any;
}
```

### Common Errors

**401 Unauthorized:**
```json
{
  "error": "API key xato yoki yaroqsiz",
  "status": 401
}
```

**400 Bad Request:**
```json
{
  "error": "So'rov formatida xatolik",
  "status": 400
}
```

**429 Too Many Requests:**
```json
{
  "error": "Juda ko'p so'rov yuborildi",
  "status": 429
}
```

**500 Internal Server Error:**
```json
{
  "error": "AI bilan bog'lanishda xatolik",
  "status": 500
}
```

### Error Handling Example

```typescript
try {
  const result = await aiClient.analyzeIRAC(caseData);
  console.log(result.text);
} catch (error: any) {
  if (error.status === 401) {
    alert('API key xato');
  } else if (error.status === 429) {
    alert('Juda ko\'p so\'rov. Biroz kuting.');
  } else {
    alert('Xatolik: ' + error.message);
  }
}
```

---

## ⏱️ RATE LIMITING

### Groq API Limits

- **Requests per minute:** 30
- **Tokens per minute:** 6,000
- **Tokens per day:** 14,400

### Best Practices

1. **Cache responses** when possible
2. **Debounce user input** (500ms)
3. **Show loading indicators**
4. **Handle rate limit errors gracefully**
5. **Implement retry logic** with exponential backoff

### Retry Logic Example

```typescript
async function callWithRetry(
  fn: () => Promise<any>,
  maxRetries = 3,
  delay = 1000
) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      if (error.status === 429 && i < maxRetries - 1) {
        await new Promise(r => setTimeout(r, delay * Math.pow(2, i)));
        continue;
      }
      throw error;
    }
  }
}

// Usage
const result = await callWithRetry(() => 
  aiClient.analyzeIRAC(caseData)
);
```

---

## 🔐 AUTHENTICATION

API endpoints are public in development. For production:

```typescript
// Add API key validation
export async function POST(request: NextRequest) {
  const apiKey = request.headers.get('X-API-Key');
  
  if (apiKey !== process.env.API_SECRET_KEY) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  // Process request...
}
```

---

## 📝 CHANGELOG

### Version 4.0.0 (2024-06-14)

- ✅ Added 6 AI functions
- ✅ Added 3 API endpoints
- ✅ Improved error handling
- ✅ Added O'zbek error messages
- ✅ Removed all demo data

---

## 🆘 SUPPORT

- **Documentation:** [README_UZBEK.md](./README_UZBEK.md)
- **Email:** support@jurisai.uz
- **Telegram:** @jurisai_support

---

**Version:** 4.0.0  
**Last Updated:** 2024-06-14  
**API Status:** ✅ Production Ready
