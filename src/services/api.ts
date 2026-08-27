import { ChatMessageItem, ModelType, ResolvedLinkInfo, DownloadDetectResult } from '../types';

export interface StreamChunkData {
  content: string;
  reasoning: string;
  isThinking: boolean;
}

export interface SendMessageOptions {
  messages: ChatMessageItem[];
  model: ModelType;
  isX1Mode: boolean;
  deepSearch?: boolean;
  memoryPrompt?: string;
  targetUrl?: string;
  targetUrls?: string[];
  signal?: AbortSignal;
  onChunk: (data: StreamChunkData) => void;
  onError: (errorMsg: string) => void;
  onComplete: () => void;
}

export async function streamChatCompletion({
  messages,
  model,
  isX1Mode,
  deepSearch = false,
  memoryPrompt = '',
  targetUrl = '',
  targetUrls = [],
  signal,
  onChunk,
  onError,
  onComplete,
}: SendMessageOptions): Promise<() => void> {
  const controller = new AbortController();
  if (signal) {
    if (signal.aborted) {
      controller.abort();
    } else {
      signal.addEventListener('abort', () => controller.abort(), { once: true });
    }
  }

  try {
    let effectiveTargetUrl = targetUrl;

    // Format messages for API (convert multimodal items with images if present)
    const formattedMessages = messages.map((msg, idx) => {
      const isLatestTurn = idx >= messages.length - 2;
      let cleanContent = msg.content || '';
      
      // Auto-substitute any cached unshortened URLs directly in message content
      linkResolveCache.forEach((resolved, shortUrl) => {
        if (resolved?.originalUrl && shortUrl && cleanContent.includes(shortUrl)) {
          cleanContent = cleanContent.split(shortUrl).join(resolved.originalUrl);
          if (!effectiveTargetUrl) {
            effectiveTargetUrl = resolved.originalUrl;
          }
        }
      });

      const allImages = (msg.images && msg.images.length > 0)
        ? msg.images
        : (msg.image ? [msg.image] : []);

      if (allImages.length > 0) {
        // If it is an older turn, avoid sending massive duplicate base64 payloads to preserve Vercel limit
        if (!isLatestTurn) {
          return {
            role: msg.role,
            content: `${cleanContent}\n[ملاحظة: تم إرفاق وتحليل (${allImages.length}) صور في هذا الدور السابق]`,
            reasoning: msg.reasoning
          };
        }

        const contentParts: any[] = [
          { type: 'text', text: cleanContent || 'حلل هذه الصور واستخرج كافة التفاصيل والمعلومات الواردة فيها بدقة.' }
        ];

        allImages.forEach((imgUrl, i) => {
          contentParts.push({
            type: 'text',
            text: `\n--- [صورة رقم ${i + 1} المرفوعة من المستخدم] ---`
          });
          contentParts.push({
            type: 'image_url',
            image_url: {
              url: imgUrl
            }
          });
        });

        return {
          role: msg.role,
          content: contentParts,
          reasoning: msg.reasoning
        };
      }

      return {
        role: msg.role,
        content: cleanContent || 'متابعة',
        reasoning: msg.reasoning
      };
    });

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: formattedMessages,
        model,
        isX1Mode,
        deepSearch,
        memoryPrompt,
        targetUrl: effectiveTargetUrl,
        targetUrls: targetUrls && targetUrls.length > 0 ? targetUrls : undefined,
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      let errBody = '';
      try {
        const rawText = await response.text();
        try {
          const parsed = JSON.parse(rawText);
          errBody = parsed.error || parsed.message || rawText;
        } catch {
          errBody = rawText;
        }
      } catch {}
      onError(errBody || `خطأ في الاتصال بالخادم (${response.status})`);
      return () => controller.abort();
    }

    if (!response.body) {
      onError('استجابة الخادم فارغة تماماً.');
      return () => controller.abort();
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    let accumulatedRaw = '';
    let accumulatedReasoning = '';
    let accumulatedContent = '';
    let isThinking = false;

    const processDelta = (deltaContent: string, deltaReasoning?: string) => {
      if (deltaReasoning) {
        accumulatedReasoning += deltaReasoning;
        isThinking = true;
        onChunk({
          content: accumulatedContent,
          reasoning: accumulatedReasoning,
          isThinking: true
        });
        return;
      }

      if (!deltaContent) return;
      accumulatedRaw += deltaContent;

      const lowerRaw = accumulatedRaw.toLowerCase();
      const thinkStartIdx = lowerRaw.indexOf('<think>');
      const thoughtStartIdx = thinkStartIdx !== -1 ? thinkStartIdx : lowerRaw.indexOf('<thought>');

      if (thoughtStartIdx !== -1) {
        const tagLength = lowerRaw.startsWith('<thought>', thoughtStartIdx) ? 9 : 7;
        const thinkEndIdx = lowerRaw.indexOf('</think>', thoughtStartIdx);
        const thoughtEndIdx = thinkEndIdx !== -1 ? thinkEndIdx : lowerRaw.indexOf('</thought>', thoughtStartIdx);

        if (thoughtEndIdx === -1) {
          // Currently inside thinking block
          isThinking = true;
          accumulatedReasoning = accumulatedRaw.substring(thoughtStartIdx + tagLength).trimStart();
          accumulatedContent = accumulatedRaw.substring(0, thoughtStartIdx).trim();
        } else {
          // Finished thinking block
          isThinking = false;
          const closeTagLength = lowerRaw.startsWith('</thought>', thoughtEndIdx) ? 10 : 8;
          accumulatedReasoning = accumulatedRaw.substring(thoughtStartIdx + tagLength, thoughtEndIdx).trim();
          const preThink = accumulatedRaw.substring(0, thoughtStartIdx).trim();
          const postThink = accumulatedRaw.substring(thoughtEndIdx + closeTagLength).trimStart();
          accumulatedContent = preThink ? `${preThink}\n\n${postThink}` : postThink;
        }
      } else {
        // No think tags present in content stream
        accumulatedContent = accumulatedRaw;
        isThinking = false;
      }

      onChunk({
        content: accumulatedContent,
        reasoning: accumulatedReasoning,
        isThinking
      });
    };

    while (true) {
      if (controller.signal.aborted) {
        try {
          await reader.cancel();
        } catch {}
        break;
      }

      const { done, value } = await reader.read();
      if (done || controller.signal.aborted) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (controller.signal.aborted) break;
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith(':')) continue;

        if (trimmed === 'data: [DONE]' || trimmed === '[DONE]') {
          onComplete();
          return () => controller.abort();
        }

        if (trimmed.startsWith('data:')) {
          const payload = trimmed.replace(/^data:\s*/, '');
          if (payload === '[DONE]') {
            onComplete();
            return () => controller.abort();
          }

          try {
            const parsed = JSON.parse(payload);
            if (parsed.error) {
              const errMsg = typeof parsed.error === 'object'
                ? parsed.error.message || JSON.stringify(parsed.error)
                : parsed.error;
              onError(errMsg || 'حدث خطأ في استجابة الذكاء الاصطناعي');
              continue;
            }

            const content = parsed.choices?.[0]?.delta?.content ?? parsed.content ?? '';
            const reasoning = parsed.choices?.[0]?.delta?.reasoning_content ?? parsed.choices?.[0]?.delta?.reasoning ?? '';
            if (content || reasoning) {
              processDelta(content, reasoning);
            }
          } catch {
            // Non-JSON plain text SSE fallback
            if (payload && payload !== '[DONE]') {
              processDelta(payload);
            }
          }
        }
      }
    }

    // Flush any remaining buffer text if not aborted
    if (!controller.signal.aborted && buffer.trim()) {
      const trimmed = buffer.trim();
      if (trimmed.startsWith('data:')) {
        const payload = trimmed.replace(/^data:\s*/, '');
        if (payload && payload !== '[DONE]') {
          try {
            const parsed = JSON.parse(payload);
            const content = parsed.choices?.[0]?.delta?.content ?? parsed.content ?? '';
            const reasoning = parsed.choices?.[0]?.delta?.reasoning_content ?? parsed.choices?.[0]?.delta?.reasoning ?? '';
            if (content || reasoning) processDelta(content, reasoning);
          } catch {
            processDelta(payload);
          }
        }
      }
    }

    onComplete();
  } catch (err: any) {
    if (err.name === 'AbortError' || controller.signal.aborted) {
      console.log('[Stream Aborted by User]');
    } else {
      const isFailedFetch = err?.message === 'Failed to fetch' || err?.name === 'TypeError' || err?.message?.includes('NetworkError');
      const errorMsg = isFailedFetch
        ? 'تعذر الاتصال بالخادم الخلفي (Failed to fetch). يرجى التأكد من تشغيل خادم التطبيق عبر أمر: npm run dev'
        : (err?.message || 'انقطع الاتصال ببروتوكول الذكاء الاصطناعي.');
      onError(errorMsg);
    }
    onComplete();
  }

  return () => controller.abort();
}

const linkResolveCache = new Map<string, ResolvedLinkInfo>();

/**
 * Resolves, unshortens, and profiles a target URL with instant in-memory caching.
 */
export async function resolveLinkTarget(rawUrl: string, signal?: AbortSignal): Promise<ResolvedLinkInfo | null> {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  const cleanUrl = rawUrl.trim();
  if (linkResolveCache.has(cleanUrl)) {
    return linkResolveCache.get(cleanUrl)!;
  }

  try {
    const res = await fetch('/api/resolve-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: cleanUrl }),
      signal,
    });
    if (!res.ok) return null;
    const data: ResolvedLinkInfo = await res.json();
    if (data && data.originalUrl) {
      linkResolveCache.set(cleanUrl, data);
      return data;
    }
  } catch (err) {
    console.warn('[API resolveLinkTarget Notice]:', err);
  }
  return null;
}

const downloadDetectCache = new Map<string, DownloadDetectResult>();

/**
 * Universal Media Extraction & Format Resolver for Download Detect
 */
export async function fetchDownloadDetect(rawUrl: string, signal?: AbortSignal): Promise<DownloadDetectResult | null> {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  const cleanUrl = rawUrl.trim();
  if (downloadDetectCache.has(cleanUrl)) {
    return downloadDetectCache.get(cleanUrl)!;
  }

  try {
    const res = await fetch('/api/download-detect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: cleanUrl }),
      signal,
    });
    if (!res.ok) return null;
    const data: DownloadDetectResult = await res.json();
    if (data && data.success) {
      downloadDetectCache.set(cleanUrl, data);
      return data;
    }
  } catch (err) {
    console.warn('[API fetchDownloadDetect Notice]:', err);
  }
  return null;
}

/**
 * Generates direct download proxy stream URL for instant 1-click file saving
 */
export function getDownloadStreamUrl(mediaUrl: string, filename = 'download_detect_media.mp4', mime = 'video/mp4'): string {
  if (!mediaUrl) return '';
  return `/api/download-stream?url=${encodeURIComponent(mediaUrl)}&filename=${encodeURIComponent(filename)}&mime=${encodeURIComponent(mime)}`;
}


