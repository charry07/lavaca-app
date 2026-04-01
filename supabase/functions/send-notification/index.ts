import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const EXPO_PUSH_ENDPOINT = 'https://exp.host/--/api/v2/push/send';

serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const { userId, title, body, data } = await req.json();

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: user } = await supabaseClient
      .from('users')
      .select('push_token')
      .eq('id', userId)
      .maybeSingle();

    if (!user?.push_token) {
      return new Response(JSON.stringify({ skipped: true, reason: 'No push token' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const message = {
      to: user.push_token,
      sound: 'default',
      title,
      body,
      data: data || {},
    };

    const response = await fetch(EXPO_PUSH_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(message),
    });

    const result = await response.json();
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: unknown) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
