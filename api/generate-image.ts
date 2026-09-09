export const config = { runtime: 'edge' };
export const maxDuration = 60;

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const { prompt, aspectRatio } = await req.json();

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return new Response(JSON.stringify({ error: 'Prompt is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const openRouterKey = process.env.OPENROUTER_API_KEY || '';
    if (!openRouterKey) {
      return new Response(JSON.stringify({ error: 'OPENROUTER_API_KEY is not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const response = await fetch('https://openrouter.ai/api/v1/images', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://matany.one',
        'X-Title': 'Matany AI'
      },
      body: JSON.stringify({
        model: 'meta/muse-image',
        prompt: prompt.trim()
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      return new Response(JSON.stringify({ error: 'OpenRouter generation failed', details: errText }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const data = await response.json();
    const item = data?.data?.[0];

    if (!item) {
      return new Response(JSON.stringify({ error: 'No image data returned from OpenRouter' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    let imageUrl = '';
    if (item.b64_json) {
      const mediaType = item.media_type || 'image/png';
      imageUrl = `data:${mediaType};base64,${item.b64_json}`;
    } else if (item.url) {
      imageUrl = item.url;
    }

    return new Response(JSON.stringify({
      imageUrl,
      model: 'Fathom QP3',
      provider: 'openrouter'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600'
      }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || 'Internal error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
