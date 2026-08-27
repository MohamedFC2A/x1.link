/**
 * Universal Media & File Extraction Engine
 * Supports all video formats (mp4, webm, mov, mkv, avi, m4v, flv, 3gp, ts, ogv),
 * audio formats (mp3, wav, m4a, ogg, aac, flac, opus, wma, amr),
 * and documents/code (pdf, docx, txt, md, csv, json, py, js, ts, etc.).
 */

import JSZip from 'jszip';
import { MediaType, MediaAttachmentItem } from '../types';

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function formatMediaDuration(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '00:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  const h = Math.floor(m / 60);
  if (h > 0) {
    const remM = m % 60;
    return `${h.toString().padStart(2, '0')}:${remM.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function classifyFileType(file: File): MediaType {
  const mime = (file.type || '').toLowerCase();
  const name = (file.name || '').toLowerCase();

  // 1. Videos
  if (
    mime.startsWith('video/') ||
    /\.(mp4|webm|mov|mkv|avi|m4v|flv|3gp|wmv|ts|ogv|vob|m2ts|f4v)$/i.test(name)
  ) {
    return 'video';
  }

  // 2. Audio
  if (
    mime.startsWith('audio/') ||
    /\.(mp3|wav|m4a|ogg|aac|flac|opus|wma|amr|aiff|alac|pcm|oga|mid|midi)$/i.test(name)
  ) {
    return 'audio';
  }

  // 3. Images
  if (
    mime.startsWith('image/') ||
    /\.(jpg|jpeg|png|webp|gif|svg|bmp|tiff|tif|heic|heif|avif|ico|raw|cr2|nef)$/i.test(name)
  ) {
    return 'image';
  }

  // 4. Documents, Code & Archives
  if (
    mime.startsWith('text/') ||
    mime.includes('pdf') ||
    mime.includes('json') ||
    mime.includes('xml') ||
    mime.includes('document') ||
    mime.includes('spreadsheet') ||
    mime.includes('zip') ||
    mime.includes('tar') ||
    mime.includes('archive') ||
    /\.(pdf|doc|docx|txt|md|csv|json|xml|log|py|js|ts|tsx|jsx|html|css|scss|java|c|cpp|cs|go|rs|php|rb|sql|sh|yaml|yml|toml|ini|env|zip|tar|gz|7z|rar)$/i.test(name)
  ) {
    return 'document';
  }

  return 'other';
}

/**
 * Extracts real duration, resolution and thumbnail for video files in browser
 */
export async function extractVideoClientMetadata(file: File): Promise<{
  duration: number;
  width: number;
  height: number;
  thumbnailUrl: string;
}> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;

    const objectUrl = URL.createObjectURL(file);
    video.src = objectUrl;

    const cleanup = () => {
      URL.revokeObjectURL(objectUrl);
    };

    video.onloadedmetadata = () => {
      const seekTime = Math.min(1.0, video.duration / 2);
      video.currentTime = seekTime;
    };

    video.onseeked = () => {
      const width = video.videoWidth || 640;
      const height = video.videoHeight || 360;
      const duration = video.duration || 0;

      const canvas = document.createElement('canvas');
      canvas.width = Math.min(width, 480);
      canvas.height = Math.round((height * canvas.width) / width) || 270;
      const ctx = canvas.getContext('2d');
      let thumbnailUrl = '';
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        thumbnailUrl = canvas.toDataURL('image/jpeg', 0.8);
      }
      cleanup();
      resolve({ duration, width, height, thumbnailUrl });
    };

    video.onerror = () => {
      cleanup();
      resolve({ duration: 0, width: 0, height: 0, thumbnailUrl: '' });
    };

    setTimeout(() => {
      cleanup();
      resolve({ duration: 0, width: 0, height: 0, thumbnailUrl: '' });
    }, 4000);
  });
}

/**
 * Extracts multiple high-quality keyframes across the video duration for AI optical inspection
 */
export async function extractVideoKeyframes(file: File, maxFrames = 5): Promise<string[]> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'auto';
    video.muted = true;
    video.playsInline = true;
    const objectUrl = URL.createObjectURL(file);
    video.src = objectUrl;

    const frames: string[] = [];
    const cleanup = () => {
      URL.revokeObjectURL(objectUrl);
    };

    video.onloadedmetadata = () => {
      const dur = video.duration || 2;
      const timestamps: number[] = [];
      for (let i = 1; i <= maxFrames; i++) {
        timestamps.push((dur * i) / (maxFrames + 1));
      }

      let currentIdx = 0;

      const captureNext = () => {
        if (currentIdx >= timestamps.length) {
          cleanup();
          resolve(frames);
          return;
        }
        video.currentTime = Math.max(0.1, Math.min(dur - 0.1, timestamps[currentIdx]));
      };

      video.onseeked = () => {
        const width = video.videoWidth || 640;
        const height = video.videoHeight || 360;
        const canvas = document.createElement('canvas');
        canvas.width = Math.min(width, 640);
        canvas.height = Math.round((height * canvas.width) / width) || 360;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          frames.push(dataUrl);
        }
        currentIdx++;
        captureNext();
      };

      captureNext();
    };

    video.onerror = () => {
      cleanup();
      resolve(frames);
    };

    setTimeout(() => {
      cleanup();
      resolve(frames);
    }, 6000);
  });
}

/**
 * Extracts duration for audio files in browser
 */
export async function extractAudioClientMetadata(file: File): Promise<{
  duration: number;
}> {
  return new Promise((resolve) => {
    const audio = document.createElement('audio');
    audio.preload = 'metadata';
    const objectUrl = URL.createObjectURL(file);
    audio.src = objectUrl;

    audio.onloadedmetadata = () => {
      const duration = audio.duration || 0;
      URL.revokeObjectURL(objectUrl);
      resolve({ duration });
    };

    audio.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({ duration: 0 });
    };

    setTimeout(() => {
      URL.revokeObjectURL(objectUrl);
      resolve({ duration: 0 });
    }, 3000);
  });
}

/**
 * Detects if a file path or extension represents a readable text/code file
 */
function isReadableCodeOrTextFile(filePath: string): boolean {
  const lower = filePath.toLowerCase();
  // Exclude node_modules, git internals, or build caches if present in archives
  if (lower.includes('node_modules/') || lower.includes('.git/') || lower.includes('dist/') || lower.includes('build/')) {
    return false;
  }
  const codeExtensions = [
    '.ts', '.tsx', '.js', '.jsx', '.json', '.html', '.css', '.scss', '.sass', '.less',
    '.py', '.md', '.txt', '.csv', '.xml', '.yaml', '.yml', '.toml', '.env', '.env.example',
    '.sql', '.sh', '.bash', '.zsh', '.bat', '.ps1', '.c', '.cpp', '.h', '.hpp', '.cs',
    '.go', '.rs', '.java', '.kt', '.php', '.rb', '.swift', '.r', '.m', '.vue', '.svelte',
    '.graphql', '.proto', '.ini', '.cfg', '.conf', '.dockerfile', '.gitignore'
  ];
  return codeExtensions.some(ext => lower.endsWith(ext)) || lower.endsWith('dockerfile') || lower.endsWith('makefile') || lower.endsWith('license') || lower.endsWith('readme');
}

/**
 * Extracts text content from document, code files, or decompresses ZIP archives
 */
export async function extractTextClientMetadata(file: File): Promise<{
  textSnippet: string;
  lineCount: number;
  wordCount: number;
}> {
  const fileName = file.name || 'ملف مرفق';
  const isZip = fileName.toLowerCase().endsWith('.zip') || file.type.includes('zip') || file.type.includes('compressed');

  // Handle ZIP Archives with JSZip
  if (isZip) {
    try {
      const zip = await JSZip.loadAsync(file);
      const filePaths: string[] = [];
      const extractedFiles: Array<{ path: string; content: string; size: number }> = [];

      let totalExtractedLength = 0;
      const MAX_TOTAL_ARCHIVE_TEXT = 120000; // 120k chars per archive

      const entries = Object.keys(zip.files);
      for (const rawPath of entries) {
        const entry = zip.files[rawPath];
        if (entry.dir) {
          filePaths.push(`📁 ${rawPath}`);
          continue;
        }

        filePaths.push(`📄 ${rawPath} (${formatFileSize((entry as any)._data?.uncompressedSize || 0)})`);

        if (isReadableCodeOrTextFile(rawPath) && totalExtractedLength < MAX_TOTAL_ARCHIVE_TEXT) {
          try {
            const text = await entry.async('text');
            if (text && text.trim()) {
              const remainingBudget = MAX_TOTAL_ARCHIVE_TEXT - totalExtractedLength;
              const contentToTake = text.slice(0, remainingBudget);
              totalExtractedLength += contentToTake.length;
              extractedFiles.push({
                path: rawPath,
                content: contentToTake,
                size: text.length
              });
            }
          } catch (e) {
            console.warn(`[JSZip read file warning: ${rawPath}]`, e);
          }
        }
      }

      // Format clean directory tree representation
      const treeBlock = filePaths.slice(0, 100).join('\n') + (filePaths.length > 100 ? `\n... و(${filePaths.length - 100}) ملفات ومجلدات أخرى` : '');

      // Format individual code blocks with syntax tags
      const codeBlocks = extractedFiles.map(f => {
        const ext = f.path.split('.').pop()?.toLowerCase() || '';
        const lang = ext === 'ts' || ext === 'tsx' ? 'typescript' : ext === 'js' || ext === 'jsx' ? 'javascript' : ext === 'py' ? 'python' : ext === 'json' ? 'json' : ext === 'html' ? 'html' : ext === 'css' ? 'css' : ext === 'sql' ? 'sql' : ext === 'md' ? 'markdown' : '';
        return `\n--- [الملف: ${f.path}] ---\n\`\`\`${lang}\n${f.content}\n\`\`\``;
      }).join('\n');

      const fullArchiveRepresentation = [
        `[أرشيف مضغوط مفكوك ومستوعب عبر Fathom Spark: "${fileName}"]`,
        `• إجمالي الملفات والمجلدات: ${filePaths.length}`,
        `• ملفات الأكواد والنصوص المستخرجة: ${extractedFiles.length}`,
        `• شجرة الملفات والمجلدات:\n${treeBlock}`,
        codeBlocks ? `\n[الأكواد والمحتويات المفحوصة في الأرشيف]:\n${codeBlocks}` : '',
        `\n[نهاية أرشيف "${fileName}"]`
      ].filter(Boolean).join('\n');

      const lines = fullArchiveRepresentation.split('\n');
      const words = fullArchiveRepresentation.split(/\s+/).filter(Boolean);

      return {
        textSnippet: fullArchiveRepresentation,
        lineCount: lines.length,
        wordCount: words.length,
      };
    } catch (zipErr) {
      console.error('[JSZip Extraction Error]:', zipErr);
      return {
        textSnippet: `[تعذر فك أرشيف الـ ZIP "${fileName}"]: يرجى التأكد من سلامة الملف المضغوط.`,
        lineCount: 1,
        wordCount: 10,
      };
    }
  }

  // Handle Standard Text / Code / Document Files
  return new Promise((resolve) => {
    if (file.size > 10 * 1024 * 1024) {
      resolve({ textSnippet: `[ملف كبير بحجم ${formatFileSize(file.size)}]`, lineCount: 0, wordCount: 0 });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const rawText = (e.target?.result as string) || '';
      const lines = rawText.split('\n');
      const words = rawText.split(/\s+/).filter(Boolean);
      resolve({
        textSnippet: rawText.slice(0, 60000),
        lineCount: lines.length,
        wordCount: words.length,
      });
    };
    reader.onerror = () => {
      resolve({ textSnippet: '', lineCount: 0, wordCount: 0 });
    };
    reader.readAsText(file);
  });
}
