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
    // Format messages for the API (convert multimodal items with images if present)
    const formattedMessages = messages.map(msg => {
      if (msg.image && (model === 'deepseek-v4-flash-vision-exp' || model.includes('vision'))) {
        return {
          role: msg.role,
          content: [
            { type: 'text', text: msg.content },
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
        content: msg.content
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
      const errBody = await response.text();
      onError(`[SERVER ERROR ${response.status}]: ${errBody || 'Failed to connect to AI engine.'}`);
      onComplete();
      return () => controller.abort();
    }

    if (!response.body) {
      onError('[ERROR]: No streaming body returned from AI engine.');
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
              onError(parsed.error || parsed.message || 'Stream processing error from API');
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
      onError(err.message || 'Network connection lost to AI protocol.');
    }
    onComplete();
  }

  return () => controller.abort();
}
