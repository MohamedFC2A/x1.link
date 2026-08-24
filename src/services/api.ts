import { ChatMessageItem, ModelType } from '../types';

export interface SendMessageOptions {
  messages: ChatMessageItem[];
  model: ModelType;
  isX1Mode: boolean;
  memoryPrompt?: string;
  onChunk: (chunk: string) => void;
  onError: (errorMsg: string) => void;
  onComplete: () => void;
}

export async function streamChatCompletion({
  messages,
  model,
  isX1Mode,
  memoryPrompt = '',
  onChunk,
  onError,
  onComplete,
}: SendMessageOptions): Promise<() => void> {
  const controller = new AbortController();

  try {
    // Format messages for API (convert multimodal items with images if present)
    const formattedMessages = messages.map(msg => {
      if (msg.image) {
        return {
          role: msg.role,
          content: [
            { type: 'text', text: msg.content || 'حلل هذه الصورة واستخرج كافة التفاصيل والمعلومات الواردة فيها بدقة.' },
            {
              type: 'image_url',
              image_url: {
                url: msg.image
              }
            }
          ]
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
        memoryPrompt,
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      let errBody = '';
      try {
        const json = await response.json();
        errBody = json.error || json.message || JSON.stringify(json);
      } catch {
        errBody = await response.text();
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

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith(':')) continue;

        if (trimmed === 'data: [DONE]') {
          onComplete();
          return () => controller.abort();
        }

        if (trimmed.startsWith('data: ')) {
          const jsonStr = trimmed.slice(6);
          try {
            const parsed = JSON.parse(jsonStr);
            if (parsed.error) {
              onError(parsed.error || parsed.message || 'حدث خطأ أثناء معالجة الرد');
              continue;
            }
            const content = parsed.content !== undefined 
              ? parsed.content 
              : parsed.choices?.[0]?.delta?.content;
            if (content) {
              onChunk(content);
            }
          } catch {
            // Raw text fallback if not JSON
            if (jsonStr && jsonStr !== '[DONE]') {
              onChunk(jsonStr);
            }
          }
        }
      }
    }

    onComplete();
  } catch (err: any) {
    if (err.name === 'AbortError') {
      console.log('[Stream Aborted by User]');
    } else {
      onError(err.message || 'انقطع الاتصال ببروتوكول الذكاء الاصطناعي.');
    }
    onComplete();
  }

  return () => controller.abort();
}
