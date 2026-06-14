// Quick test for Groq API
const GROQ_API_KEY = 'YOUR_GROQ_API_KEY_HERE';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

async function testGroqAPI() {
  console.log('Testing Groq API...');
  console.log('API Key:', GROQ_API_KEY.substring(0, 10) + '...');

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'user',
            content: 'Salom! Qanday yordam bera olaman?'
          }
        ],
        temperature: 0.7,
        max_tokens: 100,
      }),
    });

    console.log('Status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      return;
    }

    const data = await response.json();
    console.log('Success! Response:', data.choices[0]?.message?.content);
    console.log('Tokens used:', data.usage);
  } catch (error) {
    console.error('Error:', error);
  }
}

testGroqAPI();

