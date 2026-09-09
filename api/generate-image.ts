import { serverSupabase, uploadImageToSupabaseStorage, normalizeReferenceImages } from '../server/storageService';

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

    let finalPrompt = prompt.trim();

    const openRouterKey = process.env.OPENROUTER_API_KEY || '';
    if (!openRouterKey) {
      return sendResponse(500, { error: 'OPENROUTER_API_KEY is not configured' });
    }

    // Autonomous Translation & Photorealistic Expansion for non-English prompts (e.g. Arabic)
    const hasArabicCharacters = /[\u0600-\u06FF]/.test(finalPrompt);
    if (hasArabicCharacters) {
      try {
        const transRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openRouterKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://matany.one',
            'X-Title': 'Matany AI'
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              {
                role: 'system',
                content: 'You are an elite visual prompt engineer for photorealistic image generation (Meta Muse / FLUX). Translate and expand the following user image description or modification instruction into a single, detailed, photorealistic visual prompt in English. Output ONLY the raw English prompt, nothing else.'
              },
              {
                role: 'user',
                content: finalPrompt
              }
            ],
            max_tokens: 300,
            temperature: 0.2
          }),
          signal: AbortSignal.timeout(6000)
        });

        if (transRes.ok) {
          const transData = await transRes.json();
          const translatedText = transData?.choices?.[0]?.message?.content?.trim();
          if (translatedText && !/[\u0600-\u06FF]/.test(translatedText)) {
            console.log(`[generate-image] Translated Arabic prompt: "${finalPrompt}" -> "${translatedText.slice(0, 100)}..."`);
            finalPrompt = translatedText;
          }
        }
      } catch (transErr) {
        console.warn('[generate-image] Arabic translation fallback bypassed:', transErr);
      }
    }

    // Defensive Typography Enhancement: If prompt requests text, letters, numbers, or vehicle license plates, ensure OCR & human readability
    const hasTextOrPlateRequest = /(?:plate|license|sign|text|letters?|numbers?|logo|billboard|label|typography|words?|لوحة|نمرة|كتابة|نص|حروف|أرقام)/i.test(finalPrompt);
    if (hasTextOrPlateRequest && !finalPrompt.includes('readable by OCR')) {
      finalPrompt = `${finalPrompt}, crisp legible typography, authentic official vehicle plate format, perfectly formed characters, razor-sharp edges, high contrast, zero gibberish, zero scrambled letters, fully legible by optical character recognition (OCR) and humans`;
    }

    // Parse and normalize visual reference images for Meta: Muse Image agentic conditioning (uploading base64 to Supabase CDN if needed)
    const rawRefs = body?.input_references || body?.referenceImages || (body?.originalImage ? [body.originalImage] : []);
    const formattedReferences = await normalizeReferenceImages(rawRefs);

    const fetchImage = async (attempt = 1, includeRefs = true): Promise<any> => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 55000);
      try {
        const payload: any = {
          model: 'meta/muse-image',
          prompt: finalPrompt
        };

        const targetRatio = body?.aspectRatio || body?.aspect_ratio;
        if (targetRatio && ['1:1', '16:9', '9:16', '4:3'].includes(targetRatio)) {
          payload.aspect_ratio = targetRatio;
        }

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
      // Upload directly to Supabase Storage CDN to prevent megabyte payloads in chat history & database
      const cdnUrl = await uploadImageToSupabaseStorage(item.b64_json, 'generated');
      if (cdnUrl && cdnUrl.startsWith('http')) {
        imageUrl = cdnUrl;
      } else {
        const mediaType = item.media_type || 'image/png';
        imageUrl = `data:${mediaType};base64,${item.b64_json}`;
      }
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
