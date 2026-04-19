require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname, '')));

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

app.post('/api/chat', async (req, res) => {
  try {
    const { messages, context } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured.' });
    }

    // Set up SSE headers for streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const systemPrompt = `आप रक्षा AI हैं, PashuRaksha ऐप के एक एक्सपर्ट वेटरनरी और फार्म मैनेजमेंट असिस्टेंट।
Your mission is to help Indian farmers with practical, easy-to-follow, and empathetic advice in a mix of Hindi and English (Hinglish).

Guidelines for your responses:
1. **Concise & Direct**: Keep answers short and actionable. Farmers are busy; don't use long paragraphs.
2. **Bilingual (Hinglish)**: Always use a friendly mix of Hindi and English. Use Hindi for core advice and English for technical terms (e.g., "पशु का Temperature चेक करें").
3. **Practical Advice**: Give simple steps (e.g., "पशु को बाकी झुंड से अलग (Isolate) करें").
4. **Empathy**: Sound like a helpful neighbor/expert who understands the value of their livestock.
5. **Safety First**: If you see signs of serious illness (तेज़ बुखार, खाना छोड़ना, खून बहना), emphasize: "तुरंत डॉक्टर (Veterinarian) को दिखाएं।"
6. **MRL & Compliance**: Always remind about milk withdrawal periods if a medicine is mentioned.

Current Farm Status:
${context?.farmContext || 'No farm data available yet.'}

AI Guidance Informational disclaimer: "AI की सलाह केवल जानकारी के लिए है। गंभीर स्थिति में डॉक्टर से मिलें।"`;

    // Gemini expects a different format: history of { role: 'user'|'model', parts: [{ text: '...' }] }
    // The system prompt can be passed as the first message or via System Instruction (if supported by SDK version)
    // For simplicity with this SDK version, we'll prepend the system prompt to the first user message or as a user message.
    
    let chatHistory = [];
    
    // Add system instruction as part of the context or first message
    // Note: Gemini 1.5 Flash supports system instructions, but let's stick to a robust history-based approach if needed.
    // Actually, genAI.getGenerativeModel({ model: "...", systemInstruction: "..." }) is better.
    
    const chat = model.startChat({
      history: messages.slice(0, -1).map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }],
      })),
      generationConfig: {
        maxOutputTokens: 500,
      },
    });

    const lastMessage = messages[messages.length - 1].content;
    const promptWithContext = `Context: ${systemPrompt}\n\nUser Question: ${lastMessage}`;

    const result = await chat.sendMessageStream(promptWithContext);

    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      if (chunkText) {
        res.write(`data: ${JSON.stringify({ content: chunkText })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();

  } catch (error) {
    console.error('Gemini API Error:', error);
    res.write(`data: ${JSON.stringify({ error: 'Failed to generate response. Please try again.' })}\n\n`);
    res.end();
  }
});

// Fallback route for SPA - Express 5 compatibility
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`PashuRaksha backend running on http://localhost:${PORT}`);
});
