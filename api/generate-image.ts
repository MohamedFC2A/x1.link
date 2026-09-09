import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://gyxlvreqwikpujzpyegm.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5eGx2cmVxd2lrcHVqenB5ZWdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1NDkwNzMsImV4cCI6MjEwMzEyNTA3M30.vMnY9PcDrB627Tv8Aumy6BKlMfbzg4LX1B_EUigNL2s';
const serverSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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

    const prompt = body?.prompt;
    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return sendResponse(400, { error: 'Prompt is required' });
    }

    let finalPrompt = prompt.trim();
    // Defensive Typography Enhancement: If prompt requests text, letters, numbers, or vehicle license plates, ensure OCR & human readability
    const hasTextOrPlateRequest = /(?:plate|license|sign|text|letters?|numbers?|logo|billboard|label|typography|words?|لوحة|نمرة|كتابة|نص|حروف|أرقام)/i.test(finalPrompt);
    if (hasTextOrPlateRequest && !finalPrompt.includes('readable by OCR')) {
      finalPrompt = `${finalPrompt}, crisp legible typography, authentic official vehicle plate format, perfectly formed characters, razor-sharp edges, high contrast, zero gibberish, zero scrambled letters, fully legible by optical character recognition (OCR) and humans`;
    }

    const openRouterKey = process.env.OPENROUTER_API_KEY || '';
    if (!openRouterKey) {
      return sendResponse(500, { error: 'OPENROUTER_API_KEY is not configured' });
    }

    // Parse and normalize visual reference images for Meta: Muse Image agentic conditioning
    let formattedReferences: any[] = [];
    const rawRefs = body?.input_references || body?.referenceImages || (body?.originalImage ? [body.originalImage] : []);
    if (Array.isArray(rawRefs)) {
      for (const item of rawRefs) {
        if (typeof item === 'string' && item.trim()) {
          formattedReferences.push({
            type: 'image_url',
            image_url: { url: item.trim() }
          });
        } else if (item && typeof item === 'object') {
          if (item.type === 'image_url' && item.image_url?.url) {
            formattedReferences.push(item);
          } else if (item.url) {
            formattedReferences.push({
              type: 'image_url',
              image_url: { url: item.url }
            });
          }
        }
      }
    }

    const fetchImage = async (attempt = 1, includeRefs = true): Promise<any> => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 55000);
      try {
        const payload: any = {
          model: 'meta/muse-image',
          prompt: finalPrompt
        };

        if (includeRefs && formattedReferences.length > 0) {
          payload.input_references = formattedReferences.slice(0, 5);
        }

        const response = await fetch('https://openrouter.ai/api/v1/images', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openRouterKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://matany.one',
            'X-Title': 'Matany AI'
          },
          body: JSON.stringify(payload),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errText = await response.text();
          // If 400 occurred with input_references (e.g. unreachable image or format error), fallback immediately without refs
          if (response.status === 400 && includeRefs && formattedReferences.length > 0) {
            console.warn('[generate-image] Retrying without input_references due to 400 error:', errText.slice(0, 150));
            return fetchImage(attempt, false);
          }
          if (attempt < 2 && (response.status >= 500 || response.status === 429)) {
            await new Promise((r) => setTimeout(r, 1500));
            return fetchImage(attempt + 1, includeRefs);
          }
          return { error: 'OpenRouter generation failed', status: response.status, details: errText };
        }

        const data = await response.json();
        return { data };
      } catch (err: any) {
        clearTimeout(timeoutId);
        if (attempt < 2 && err.name !== 'AbortError') {
          await new Promise((r) => setTimeout(r, 1500));
          return fetchImage(attempt + 1, includeRefs);
        }
        return { error: err.message || 'Fetch error', status: 500 };
      }
    };

    const result = await fetchImage(1);
    if (result.error) {
      return sendResponse(result.status || 500, { error: result.error, details: result.details });
    }

    const item = result.data?.data?.[0];
    if (!item) {
      return sendResponse(502, { error: 'No image data returned from OpenRouter' });
    }

    let imageUrl = '';
    if (item.b64_json) {
      const mediaType = item.media_type || 'image/png';
      imageUrl = `data:${mediaType};base64,${item.b64_json}`;
    } else if (item.url) {
      imageUrl = item.url;
    }

    // Direct Server-Side Supabase Persistence: Permanently preserve image on the message row
    const messageId = body?.messageId;
    if (messageId && imageUrl) {
      try {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(messageId);
        let targetRow: { id: string; content?: string } | null = null;
        if (isUuid) {
          const { data: row } = await serverSupabase
            .from('x1_messages')
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
            .from('x1_messages')
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
