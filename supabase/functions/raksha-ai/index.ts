import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.3"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { messages, context } = await req.json()
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')

    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'GEMINI_API_KEY not found in secrets' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    const systemPrompt = `आप रक्षा AI हैं, PashuRaksha ऐप के एक एक्सपर्ट वेटरनरी और फार्म मैनेजमेंट असिस्टेंट।
Your mission is to help Indian farmers with practical, easy-to-follow, and empathetic advice in a mix of Hindi and English (Hinglish).

Guidelines for your responses:
1. **Concise & Direct**: Keep answers short and actionable.
2. **Bilingual (Hinglish)**: Friendly mix of Hindi and English.
3. **Practical Advice**: Simple steps like "पशु को Isolate करें".
4. **Safety First**: If serious, emphasize "तुरंत डॉक्टर (Veterinarian) को दिखाएं।"
5. **MRL & Compliance**: Remind about milk withdrawal periods if medicine is mentioned.

Current Farm Status:
${context?.farmContext || 'No farm data available yet.'}

AI Guidance Informational disclaimer: "AI की सलाह केवल जानकारी के लिए है। गंभीर स्थिति में डॉक्टर से मिलें।"`;

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
    const result = await chat.sendMessageStream(`Context: ${systemPrompt}\n\nUser Question: ${lastMessage}`);

    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of result.stream) {
          const text = chunk.text();
          if (text) {
            controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ content: text })}\n\n`));
          }
        }
        controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
        controller.close();
      },
    });

    return new Response(stream, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' }, // Keep as stream to prevent frontend parse error
    })
  }
})
