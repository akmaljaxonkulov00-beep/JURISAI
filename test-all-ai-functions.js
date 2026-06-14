// Test barcha AI funksiyalarni - Node.js environment
const GROQ_API_KEY = 'YOUR_GROQ_API_KEY_HERE';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Color codes for terminal
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function callGroqAPI(prompt, systemPrompt = '') {
  const messages = [];
  
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  
  messages.push({ role: 'user', content: prompt });

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages,
      temperature: 0.7,
      max_tokens: 500,
    }),
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }

  const data = await response.json();
  return {
    text: data.choices[0]?.message?.content || '',
    usage: data.usage
  };
}

async function testIRACAnalysis() {
  log('\n=== TEST 1: IRAC TAHLIL ===', 'cyan');
  
  const caseData = `
Ish: Shartnoma nizosi
Holat: Ali va Vali o'rtasida 10 million so'm qiymatidagi uy-joy sotish shartnomasi tuzilgan. 
Ali shartnoma bo'yicha pul to'lagan, lekin Vali uyni topshirmagan.
Masala: Ali sudga murojaat qilishi mumkinmi?
`;

  try {
    const result = await callGroqAPI(
      caseData,
      'Sen professional yurist assistantisan. IRAC metodidan foydalanib huquqiy tahlil qil.'
    );
    
    log('✓ IRAC tahlil muvaffaqiyatli', 'green');
    log(`Natija: ${result.text.substring(0, 200)}...`, 'blue');
    log(`Token: ${result.usage.total_tokens}`, 'yellow');
    return true;
  } catch (error) {
    log(`✗ Xatolik: ${error.message}`, 'red');
    return false;
  }
}

async function testWeaknessDetection() {
  log('\n=== TEST 2: ZAIFLIK ANIQLASH ===', 'cyan');
  
  const argument = `
Sudga bergan argumentim: 
Shartnoma tuzilgan, pul to'langan, lekin uy topshirilmagan.
Shuning uchun Vali javobgar.
`;

  try {
    const result = await callGroqAPI(
      argument,
      'Sen professional yurist assistantisan. Argumentdagi zaif tomonlarni va kuchli tomonlarni aniqlang.'
    );
    
    log('✓ Zaiflik aniqlash muvaffaqiyatli', 'green');
    log(`Natija: ${result.text.substring(0, 200)}...`, 'blue');
    log(`Token: ${result.usage.total_tokens}`, 'yellow');
    return true;
  } catch (error) {
    log(`✗ Xatolik: ${error.message}`, 'red');
    return false;
  }
}

async function testScenarioGeneration() {
  log('\n=== TEST 3: STSENARIY YARATISH ===', 'cyan');
  
  const topic = 'Mehnat shartnomasi buzilishi';

  try {
    const result = await callGroqAPI(
      `"${topic}" mavzusida yuridik stsenariy yarating. Vaziyat, ishtirokchilar va masalalarni kiriting.`,
      'Sen professional yurist assistantisan. Real yuridik stsenariylar yarating.'
    );
    
    log('✓ Stsenariy yaratish muvaffaqiyatli', 'green');
    log(`Natija: ${result.text.substring(0, 200)}...`, 'blue');
    log(`Token: ${result.usage.total_tokens}`, 'yellow');
    return true;
  } catch (error) {
    log(`✗ Xatolik: ${error.message}`, 'red');
    return false;
  }
}

async function testDocumentGeneration() {
  log('\n=== TEST 4: HUJJAT YARATISH ===', 'cyan');
  
  const docData = {
    type: 'shartnoma',
    data: 'Tomonlar: Ali va Vali. Predmet: Uy-joy sotish. Narx: 10 million.'
  };

  try {
    const result = await callGroqAPI(
      `${docData.type} turida hujjat yarating. Ma'lumotlar: ${docData.data}`,
      'Sen professional yurist assistantisan. Rasmiy yuridik hujjat yarating.'
    );
    
    log('✓ Hujjat yaratish muvaffaqiyatli', 'green');
    log(`Natija: ${result.text.substring(0, 200)}...`, 'blue');
    log(`Token: ${result.usage.total_tokens}`, 'yellow');
    return true;
  } catch (error) {
    log(`✗ Xatolik: ${error.message}`, 'red');
    return false;
  }
}

async function testCourtSimulation() {
  log('\n=== TEST 5: SUD SIMULYATSIYASI ===', 'cyan');
  
  const caseDetails = 'O\'g\'irlik holati bo\'yicha jinoyat ishi. Mening rolim: Himoyachi.';

  try {
    const result = await callGroqAPI(
      `Sud simulyatsiyasini boshlang: ${caseDetails}`,
      'Sen professional sud majlisini simulyatsiya qilish uchun AI assistantisan.'
    );
    
    log('✓ Sud simulyatsiyasi muvaffaqiyatli', 'green');
    log(`Natija: ${result.text.substring(0, 200)}...`, 'blue');
    log(`Token: ${result.usage.total_tokens}`, 'yellow');
    return true;
  } catch (error) {
    log(`✗ Xatolik: ${error.message}`, 'red');
    return false;
  }
}

async function testDecisionTree() {
  log('\n=== TEST 6: QAROR DARAXTI ===', 'cyan');
  
  const scenario = 'Shartnoma nizosi - tomonlar kelisha olmayapti';

  try {
    const result = await callGroqAPI(
      `"${scenario}" uchun qaror daraxti yarating. 3-4 ta qaror tugunlarini yarating.`,
      'Sen professional yurist assistantisan. Qaror daraxti yaratuvchisisan.'
    );
    
    log('✓ Qaror daraxti muvaffaqiyatli', 'green');
    log(`Natija: ${result.text.substring(0, 200)}...`, 'blue');
    log(`Token: ${result.usage.total_tokens}`, 'yellow');
    return true;
  } catch (error) {
    log(`✗ Xatolik: ${error.message}`, 'red');
    return false;
  }
}

async function runAllTests() {
  log('\n╔════════════════════════════════════════╗', 'cyan');
  log('║  JURISAI - AI FUNKSIYALAR TEST SUITE  ║', 'cyan');
  log('╚════════════════════════════════════════╝', 'cyan');
  
  const results = [];
  
  results.push(await testIRACAnalysis());
  await new Promise(r => setTimeout(r, 1000)); // Rate limit
  
  results.push(await testWeaknessDetection());
  await new Promise(r => setTimeout(r, 1000));
  
  results.push(await testScenarioGeneration());
  await new Promise(r => setTimeout(r, 1000));
  
  results.push(await testDocumentGeneration());
  await new Promise(r => setTimeout(r, 1000));
  
  results.push(await testCourtSimulation());
  await new Promise(r => setTimeout(r, 1000));
  
  results.push(await testDecisionTree());
  
  // Summary
  log('\n╔════════════════════════════════════════╗', 'cyan');
  log('║            TEST NATIJASI               ║', 'cyan');
  log('╚════════════════════════════════════════╝', 'cyan');
  
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  log(`\nJami testlar: ${total}`, 'blue');
  log(`O'tdi: ${passed}`, 'green');
  log(`Muvaffaqiyatsiz: ${total - passed}`, 'red');
  log(`Foiz: ${((passed / total) * 100).toFixed(1)}%`, 'yellow');
  
  if (passed === total) {
    log('\n✓ Barcha testlar muvaffaqiyatli o\'tdi! 🎉', 'green');
  } else {
    log('\n✗ Ba\'zi testlar muvaffaqiyatsiz tugadi.', 'red');
  }
}

// Run all tests
runAllTests().catch(error => {
  log(`Fatal error: ${error.message}`, 'red');
  process.exit(1);
});

