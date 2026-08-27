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
  chatId?: string | null;
  userId?: string | null;
  deviceId?: string;
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
  chatId,
  userId,
  deviceId,
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
      const isLatestTurn = idx === messages.length - 1;
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

      const videoItem = msg.mediaAttachments?.find(m => m.type === 'video');
      const hasKeyframes = Boolean(msg.videoKeyframes && msg.videoKeyframes.length > 0);

      if (hasKeyframes) {
        if (!isLatestTurn) {
          return {
            role: msg.role,
            content: `${cleanContent}\n[ملاحظة: تم إرفاق وتحليل فيديو "${videoItem?.name || 'فيديو'}" في هذا الدور السابق]`,
            reasoning: msg.reasoning
          };
        }

        const contentParts: any[] = [
          {
            type: 'text',
            text: `${cleanContent}\n\n[إطارات ولقطات بصرية متتابعة مستخرجة من الفيديو: "${videoItem?.name || 'فيديو مرفق'}"]:\n• هذه لقطات زمنية متتابعة من الفيديو لفهم المشاهد وتتبع الأحداث وقراءة أي نصوص أو ملصقات أو أسئلة ظاهرة على الشاشة.\n• المطلوب: استيعاب موضوع وسياق حديث المتحدث في الفيديو، والإجابة عن سؤال واستفسار المستخدم بدقة وموضوعية.`
          }
        ];

        msg.videoKeyframes!.forEach((frameUrl, i) => {
          contentParts.push({
            type: 'text',
            text: `[لقطة رقم ${i + 1} من الفيديو]`
          });
          contentParts.push({
            type: 'image_url',
            image_url: {
              url: frameUrl
            }
          });
        });

        return {
          role: msg.role,
          content: contentParts,
          reasoning: msg.reasoning
        };
      }

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

        const imageCountNotice = allImages.length === 1
          ? 'المرفق في هذا الطلب الحالي: صورة واحدة فقط'
          : `عدد الصور المرفقة في هذا الطلب: (${allImages.length}) صور`;

        const contentParts: any[] = [
          { type: 'text', text: `${cleanContent}\n\n[${imageCountNotice}]` }
        ];

        allImages.forEach((imgUrl, i) => {
          contentParts.push({
            type: 'text',
            text: allImages.length === 1 ? `\n--- [الصورة المرفقة] ---` : `\n--- [صورة رقم ${i + 1} من أصل ${allImages.length}] ---`
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
        chatId: chatId || undefined,
        userId: userId || undefined,
        deviceId: deviceId || undefined,
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
      let tagStartIdx = lowerRaw.indexOf('<think>');
      let startTagLength = 7;
      let closeTag = '</think>';

      if (tagStartIdx === -1) {
        tagStartIdx = lowerRaw.indexOf('<thought>');
        if (tagStartIdx !== -1) {
          startTagLength = 9;
          closeTag = '</thought>';
        }
      }

      if (tagStartIdx === -1) {
        const fenceMatches = [
          { tag: '```thought', len: 10 },
          { tag: '```think', len: 8 },
          { tag: '```thinking', len: 11 },
          { tag: '```reasoning', len: 12 },
        ];
        for (const fm of fenceMatches) {
          const idx = lowerRaw.indexOf(fm.tag);
          if (idx !== -1 && (tagStartIdx === -1 || idx < tagStartIdx)) {
            tagStartIdx = idx;
            startTagLength = fm.len;
            closeTag = '```';
          }
        }
      }

      if (tagStartIdx !== -1) {
        const endIdx = lowerRaw.indexOf(closeTag, tagStartIdx + startTagLength);

        if (endIdx === -1) {
          // Currently inside thinking block
          isThinking = true;
          accumulatedReasoning = accumulatedRaw.substring(tagStartIdx + startTagLength).trimStart();
          accumulatedContent = accumulatedRaw.substring(0, tagStartIdx).trim();
        } else {
          // Finished thinking block
          isThinking = false;
          const closeTagLength = closeTag.length;
          accumulatedReasoning = accumulatedRaw.substring(tagStartIdx + startTagLength, endIdx).trim();
          const preThink = accumulatedRaw.substring(0, tagStartIdx).trim();
          const postThink = accumulatedRaw.substring(endIdx + closeTagLength).trimStart();
          accumulatedContent = preThink ? `${preThink}\n\n${postThink}` : postThink;
        }
      } else {
        // Check for orphan closing think tag (e.g. model emitted reasoning and closed with </think>)
        const orphanCloseIdx = lowerRaw.indexOf('</think>');
        const orphanThoughtCloseIdx = orphanCloseIdx !== -1 ? orphanCloseIdx : lowerRaw.indexOf('</thought>');
        if (orphanThoughtCloseIdx !== -1) {
          const closeTagLength = lowerRaw.startsWith('</thought>', orphanThoughtCloseIdx) ? 10 : 8;
          accumulatedReasoning = accumulatedRaw.substring(0, orphanThoughtCloseIdx).trim();
          accumulatedContent = accumulatedRaw.substring(orphanThoughtCloseIdx + closeTagLength).trimStart();
          isThinking = false;
        } else {
          // No think tags present in content stream
          accumulatedContent = accumulatedRaw;
          isThinking = false;
        }
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

    // Final stream resolution: ensure unclosed think tags or trailing content are resolved
    if (!controller.signal.aborted) {
      if (!accumulatedContent && accumulatedReasoning) {
        // If content is empty because the model omitted </think> or only sent reasoning,
        // extract the actual response cleanly
        accumulatedContent = accumulatedReasoning.trim();
        isThinking = false;
        onChunk({
          content: accumulatedContent,
          reasoning: accumulatedReasoning,
          isThinking: false
        });
      } else if (isThinking) {
        isThinking = false;
        onChunk({
          content: accumulatedContent,
          reasoning: accumulatedReasoning,
          isThinking: false
        });
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


