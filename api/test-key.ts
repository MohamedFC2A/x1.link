export const config = { runtime: 'edge' };

export default async function handler(req: Request) {
  const key = process.env.OPENROUTER_API_KEY || '';
  if (!key) {
    return new Response(JSON.stringify({ error: 'No OPENROUTER_API_KEY found in Vercel environment' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const keyInfoRes = await fetch('https://openrouter.ai/api/v1/auth/key', {
      headers: { 'Authorization': `Bearer ${key}` }
    });
    const keyInfo = await keyInfoRes.json();

    const imageTestRes = await fetch('https://openrouter.ai/api/v1/images', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'meta/muse-image',
        prompt: 'A tiny minimalist blue sphere on black, sharp'
      })
    });
    const imageTest = await imageTestRes.json();

    return new Response(JSON.stringify({
      keyPrefix: key.slice(0, 10) + '...',
      keyLength: key.length,
      keyInfo,
      imageTestStatus: imageTestRes.status,
      imageTest
    }, null, 2), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
