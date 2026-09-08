export async function translateText(
  inputText: string,
  sourceLangName: string,
  targetLangName: string
): Promise<string> {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("API key not found. Please create a .env.local file and add your NEXT_PUBLIC_GEMINI_API_KEY.");
  }

  const prompt = `Translate the following ${sourceLangName} text to ${targetLangName}. Only provide the translation, without any additional explanations or context.\n\n${sourceLangName} Text:\n"""\n${inputText}\n"""\n\n${targetLangName} Translation:`;

  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.3,
      topK: 1,
      topP: 1,
      maxOutputTokens: 2048,
    },
  };

  let response;
  let success = false;
  
  for (let i = 0; i < 5; i++) { // Retry up to 5 times
    try {
      response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        success = true;
        break;
      }
      if (response.status === 429) {
        const delay = Math.pow(2, i) * 1000 + Math.random() * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorData.error?.message || ''}`);
      }
    } catch (err) {
      console.error("Fetch attempt failed:", err);
    }
  }

  if (!success || !response) {
    throw new Error('Translation failed after multiple retries. Please check your connection or try again later.');
  }

  const result = await response.json();
  const candidate = result.candidates?.[0];
  if (candidate && candidate.content?.parts?.[0]?.text) {
    return candidate.content.parts[0].text.trim();
  } else {
    console.error('Unexpected API response structure:', result);
    throw new Error(result.error?.message || 'Failed to get a valid translation. The response might be blocked or empty.');
  }
}
