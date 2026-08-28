/**
 * High-Performance Client-Side Code Syntax Highlighter
 * Powered by PrismJS with graceful fallback for resilient, fast rendering.
 */

import Prism from 'prismjs';

// Ensure Prism is globally available for components that attach to global Prism
if (typeof window !== 'undefined') {
  (window as any).Prism = Prism;
} else if (typeof globalThis !== 'undefined') {
  (globalThis as any).Prism = Prism;
}

// Pre-load core language grammars
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-markdown';

// Language aliases map
const LANGUAGE_ALIASES: Record<string, string> = {
  js: 'javascript',
  ts: 'typescript',
  py: 'python',
  sh: 'bash',
  shell: 'bash',
  zsh: 'bash',
  ps1: 'bash',
  pwsh: 'bash',
  cmd: 'bash',
  dockerfile: 'bash',
  golang: 'go',
  yml: 'yaml',
  md: 'markdown',
  html: 'markup',
  xml: 'markup',
  svg: 'markup'
};

/**
 * Highlights a code string into safe HTML using PrismJS
 */
export function highlightCode(code: string, rawLanguage: string): string {
  if (!code) return '';

  const cleanLang = (rawLanguage || '').toLowerCase().trim();
  const lang = LANGUAGE_ALIASES[cleanLang] || cleanLang;

  const grammar = Prism.languages[lang];
  if (!grammar) {
    // Safe escape fallback if grammar not loaded
    return escapeHtml(code);
  }

  try {
    return Prism.highlight(code, grammar, lang);
  } catch (err) {
    console.warn(`[SyntaxHighlighter] Failed to highlight language "${lang}":`, err);
    return escapeHtml(code);
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
