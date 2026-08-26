import { ChatMessageItem, ModelType } from '../types';

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
    // Format messages for API (convert multimodal items with images if present)
    const formattedMessages = messages.map(msg => {
      const allImages = (msg.images && msg.images.length > 0)
        ? msg.images
        : (msg.image ? [msg.image] : []);

      if (allImages.length > 0) {
        const contentParts: any[] = [
          { type: 'text', text: msg.content || 'حلل هذه الصور واستخرج كافة التفاصيل والمعلومات الواردة فيها بدقة.' }
        ];

        allImages.forEach((imgUrl, idx) => {
          contentParts.push({
            type: 'text',
            text: `\n--- [صورة رقم ${idx + 1} المرفوعة من المستخدم] ---`
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
          content: contentParts
        };
      }

      return {
        role: msg.role,
        content: msg.content || 'متابعة'
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
        targetUrl,
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      let errBody = '';
      try {
        const rawText = await response.text();
        try {
          const json = JSON.parse(rawText);
          errBody = json.error || json.message || JSON.stringify(json);
        } catch {
          errBody = rawText;
        }
      } catch (readErr: any) {
        errBody = `خطأ في قراءة استجابة الخادم (${response.status}): ${readErr?.message || ''}`;
      }
      onError(errBody || `تعذر الاتصال بمحرك الذكاء الاصطناعي (رمز الاستجابة: ${response.status})`);
      onComplete();
      return () => controller.abort();
    }

    if (!response.body) {
      onError('تعذر استقبال تدفق البيانات من محرك الذكاء الاصطناعي.');
      onComplete();
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

      const thinkStartIdx = accumulatedRaw.indexOf('<think>');
      if (thinkStartIdx !== -1) {
        const thinkEndIdx = accumulatedRaw.indexOf('</think>');
        if (thinkEndIdx === -1) {
          // Currently inside thinking block
          isThinking = true;
          accumulatedReasoning = accumulatedRaw.substring(thinkStartIdx + 7).trimStart();
          accumulatedContent = accumulatedRaw.substring(0, thinkStartIdx).trim();
        } else {
          // Finished thinking block
          isThinking = false;
          accumulatedReasoning = accumulatedRaw.substring(thinkStartIdx + 7, thinkEndIdx).trim();
          const preThink = accumulatedRaw.substring(0, thinkStartIdx).trim();
          const postThink = accumulatedRaw.substring(thinkEndIdx + 8).trimStart();
          accumulatedContent = preThink ? `${preThink}\n\n${postThink}` : postThink;
        }
      } else {
        // No think tags present
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
      onError(err.message || 'انقطع الاتصال ببروتوكول الذكاء الاصطناعي.');
    }
    onComplete();
  }

  return () => controller.abort();
}
