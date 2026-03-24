import { handleCors, json } from '../_shared/cors.ts';

const GITHUB_TOKEN = Deno.env.get('GITHUB_MODELS_TOKEN');
const MODEL = Deno.env.get('GITHUB_MODELS_MODEL') ?? 'gpt-4o-mini';
const GITHUB_MODELS_URL = 'https://models.inference.ai.azure.com/chat/completions';

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  if (!GITHUB_TOKEN) return json({ error: 'AI not configured', fallback: true }, 503);

  let body: { action: string; [key: string]: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const { action } = body;
  const systemPrompt =
    'You are a helpful assistant for La Vaca, a Colombian bill-splitting app. Respond ONLY with valid JSON.';
  let userPrompt: string;

  if (action === 'split') {
    const { totalAmount, participantCount, description, currency } = body;
    userPrompt = `Given this bill, recommend the best split mode.
Amount: ${totalAmount} ${currency}
People: ${participantCount}
Description: ${description ?? 'sin descripcion'}

Choose one:
- "equal": everyone pays the same
- "percentage": different amounts per person (best when consumption varies)
- "roulette": one random person pays all (best for informal social events)

Respond ONLY with this JSON:
{"mode": "equal" | "percentage" | "roulette", "reasoning": "brief reason in Spanish (max 80 chars)", "confidence": "high" | "medium" | "low"}`;

  } else if (action === 'reminder') {
    const { sessionDescription, pendingNames, totalAmount, currency } = body;
    const names = (pendingNames as string[]).join(', ');
    userPrompt = `Generate a short, friendly payment reminder in Spanish.
Bill: ${sessionDescription ?? 'sin descripcion'}
Amount each: ${totalAmount} ${currency}
People who haven't paid: ${names}

Respond ONLY with this JSON:
{"message": "short friendly reminder with 1-2 emoji, max 2 sentences, in Spanish"}`;

  } else {
    return json({ error: 'Unknown action' }, 400);
  }

  try {
    const response = await fetch(GITHUB_MODELS_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
        max_tokens: 256,
      }),
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('GitHub Models error:', err);
      return json({ error: 'AI service error', fallback: true }, 502);
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content;
    if (!content) return json({ error: 'Empty AI response', fallback: true }, 502);

    const parsed = JSON.parse(content);
    return json(parsed);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('AI request failed:', msg);
    return json({ error: msg, fallback: true }, 502);
  }
});
