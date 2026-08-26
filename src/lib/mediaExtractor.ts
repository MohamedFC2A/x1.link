/**
 * Universal Media & File Extraction Engine
 * Supports all video formats (mp4, webm, mov, mkv, avi, m4v, flv, 3gp, ts, ogv),
 * audio formats (mp3, wav, m4a, ogg, aac, flac, opus, wma, amr),
 * and documents/code (pdf, docx, txt, md, csv, json, py, js, ts, etc.).
 */

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

  // 4. Documents & Code
  if (
    mime.startsWith('text/') ||
    mime.includes('pdf') ||
    mime.includes('json') ||
    mime.includes('xml') ||
    mime.includes('document') ||
    mime.includes('spreadsheet') ||
    /\.(pdf|doc|docx|txt|md|csv|json|xml|log|py|js|ts|tsx|jsx|html|css|scss|java|c|cpp|cs|go|rs|php|rb|sql|sh|yaml|yml|toml|ini|env)$/i.test(name)
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
 * Extracts text content from document or code files
 */
export async function extractTextClientMetadata(file: File): Promise<{
  textSnippet: string;
  lineCount: number;
  wordCount: number;
}> {
  return new Promise((resolve) => {
    if (file.size > 5 * 1024 * 1024) {
      resolve({ textSnippet: `[ملف كبير بحجم ${formatFileSize(file.size)}]`, lineCount: 0, wordCount: 0 });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const rawText = (e.target?.result as string) || '';
      const lines = rawText.split('\n');
      const words = rawText.split(/\s+/).filter(Boolean);
      resolve({
        textSnippet: rawText.slice(0, 15000),
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
