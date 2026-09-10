import { serverSupabase, executeResilientImageGeneration } from '../server/storageService';

export const config = {
  maxDuration: 60,
};

export const maxDuration = 60;

export default async function handler(req: any, res?: any) {
  const isNode = Boolean(res && typeof res.status === 'function');

  const sendResponse = (status: number, data: any) => {
    if (isNode) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      return res.status(status).json(data);
    }
    return new Response(JSON.stringify(data), {
      status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Cache-Control': status === 200 ? 'public, max-age=3600' : 'no-store'
      }
    });
  };

  if (req.method === 'OPTIONS') {
    if (isNode) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      return res.status(200).end();
    }
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  }

  if (req.method !== 'POST') {
    return sendResponse(405, { error: 'Method not allowed' });
  }

  try {
    let body: any = req.body;
    if (!body && typeof req.json === 'function') {
      try {
        body = await req.json();
      } catch {}
    }
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {}
    }

    let rawPrompt = body?.prompt;
    if (Array.isArray(rawPrompt)) {
      rawPrompt = rawPrompt
        .filter((p: any) => p && (typeof p === 'string' || p.type === 'text'))
        .map((p: any) => (typeof p === 'string' ? p : p.text || ''))
        .join(' ')
        .trim();
    } else if (typeof rawPrompt === 'object' && rawPrompt !== null) {
      rawPrompt = rawPrompt.text || rawPrompt.prompt || '';
    }
    const prompt = typeof rawPrompt === 'string' ? rawPrompt.trim() : '';
    if (!prompt) {
      return sendResponse(400, { error: 'Prompt is required' });
    }

    const openRouterKey = process.env.OPENROUTER_API_KEY || '';
    if (!openRouterKey) {
      return sendResponse(500, { error: 'OPENROUTER_API_KEY is not configured' });
    }

    const rawRefs = body?.input_references || body?.referenceImages || (body?.originalImage ? [body.originalImage] : []);
    const targetRatio = body?.aspectRatio || body?.aspect_ratio;

    const result = await executeResilientImageGeneration({
      prompt,
      aspectRatio: targetRatio,
      inputReferences: rawRefs,
      openRouterApiKey: openRouterKey,
      openRouterBaseUrl: 'https://openrouter.ai/api/v1'
    });

    if (result.error || !result.imageUrl) {
      return sendResponse(result.status || 500, {
        error: result.error || 'Failed to generate image',
        details: result.details
      });
    }

    const imageUrl = result.imageUrl;

    // Direct Server-Side Supabase Persistence: Permanently preserve image on the message row
    const messageId = body?.messageId;
    if (messageId && imageUrl) {
      try {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(messageId);
        let targetRow: { id: string; content?: string } | null = null;
        if (isUuid) {
          const { data: row } = await serverSupabase
            .from('matany_messages')
            .select('id, content')
            .eq('id', messageId)
            .maybeSingle();
          if (row) targetRow = row;
        }

        if (targetRow) {
          let updatedContent = targetRow.content || '';
          const neuralMatch = /```(?:neural-image|neural_image|image-studio|image_studio)?\s*(\{[\s\S]*?\})\s*```/i.exec(updatedContent);
          if (neuralMatch) {
            try {
              const parsed = JSON.parse(neuralMatch[1]);
              parsed.imageUrl = imageUrl;
              parsed.processedImage = imageUrl;
              updatedContent = updatedContent.replace(
                neuralMatch[0],
                `\`\`\`neural-image\n${JSON.stringify(parsed, null, 2)}\n\`\`\``
              );
            } catch {}
          }
          await serverSupabase
            .from('matany_messages')
            .update({ image_url: imageUrl, content: updatedContent })
            .eq('id', targetRow.id);
        }
      } catch (dbErr) {
        console.warn('[generate-image Supabase persistence warning]:', dbErr);
      }
    }

    return sendResponse(200, {
      imageUrl,
      model: 'Fathom QP3',
      provider: 'openrouter'
    });
  } catch (error: any) {
    return sendResponse(500, { error: error.message || 'Internal error' });
  }
}
