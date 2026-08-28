/**
 * Search Intelligence System — Deep Page Content Extractor
 * Fetches and extracts clean article text, match statistics, and deep page content.
 * Matany AI (Matany)
 */

import * as cheerio from 'cheerio';
import { SearchResult } from './searchTypes';

/**
 * Decodes Google News RSS article URLs to publisher target URLs if possible.
 */
export async function resolveDestinationUrl(url: string, signal?: AbortSignal): Promise<string> {
  if (!url) return '';
  if (!url.includes('news.google.com/rss/articles/')) {
    return url;
  }

  const tokenMatch = url.match(/articles\/([A-Za-z0-9_-]+)/);
  if (!tokenMatch) return url;
  const token = tokenMatch[1];

  try {
    const payload = `f.req=${encodeURIComponent(JSON.stringify([
      [["Fbv4je", JSON.stringify(["garturlreq", [["X", "X", ["X", "X"], null, null, null, 1, 1], null, token, 1, 1, "US:en", null, 1, null, null, null, null, null, 0, 1], "X", 1, 1, null, 0]), null, "generic"]]
    ]))}`;

    const res = await fetch('https://news.google.com/_/DotsSplashUi/data/batchexecute?rpcids=Fbv4je', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
      },
      body: payload,
      signal
    });

    if (res.ok) {
      const rawText = await res.text();
      const urls = rawText.match(/https?:\/\/[^\s"'\\]+/g);
      if (urls) {
        const realUrl = urls.find(u =>
          !u.includes('google.com') &&
          !u.includes('gstatic.com') &&
          !u.includes('schema.org') &&
          !u.includes('w3.org')
        );
        if (realUrl) return realUrl;
      }
    }
  } catch {
    // Ignore and fallback
  }

  return url;
}

/**
 * Extracts clean, dense article body text from raw HTML using Cheerio DOM parsing.
 */
export function extractCleanArticleTextFromHtml(html: string): string {
  if (!html || typeof html !== 'string') return '';

  try {
    const $ = cheerio.load(html);

    // Remove noise, headers, footers, navigation, scripts, ads
    $(
      'script, style, svg, noscript, iframe, nav, header, footer, aside, .ad, .ads, .advertisement, .social-share, .comments, .menu, .navbar, .cookie-banner, .sidebar, #header, #footer'
    ).remove();

    // Priority 1: Target semantic article or story content containers
    const articleContainer = $(
      'article, [itemprop="articleBody"], .article-body, .story-body, .post-content, .entry-content, .article-content, .news-details, main, #main-content'
    ).first();

    let extractedText = '';

    if (articleContainer.length > 0) {
      // Extract paragraphs and headings inside container
      const blocks: string[] = [];
      articleContainer.find('h1, h2, h3, h4, p, li').each((_, el) => {
        const t = $(el).text().replace(/\s+/g, ' ').trim();
        if (t.length > 15 && !blocks.includes(t)) {
          blocks.push(t);
        }
      });
      extractedText = blocks.join('\n');
    }

    // Priority 2: Fallback to all clean paragraphs
    if (!extractedText || extractedText.length < 100) {
      const pBlocks: string[] = [];
      $('p, h1, h2, h3').each((_, el) => {
        const t = $(el).text().replace(/\s+/g, ' ').trim();
        if (t.length > 20 && !pBlocks.includes(t)) {
          pBlocks.push(t);
        }
      });
      extractedText = pBlocks.slice(0, 25).join('\n');
    }

    // Clean whitespace and limit to max ~1800 characters per article for optimal token density
    return extractedText.replace(/\n{3,}/g, '\n\n').trim().slice(0, 2000);
  } catch {
    // Fallback regex extraction
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 1500);
  }
}

/**
 * Fetches page content from a URL with timeout and user-agent.
 */
export async function fetchPageContent(
  rawUrl: string,
  timeoutMs = 2800
): Promise<{ text: string; resolvedUrl: string }> {
  if (!rawUrl || !rawUrl.startsWith('http')) {
    return { text: '', resolvedUrl: rawUrl };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const resolvedUrl = await resolveDestinationUrl(rawUrl, controller.signal);

    const res = await fetch(resolvedUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ar,en-US;q=0.9,en;q=0.8',
      },
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!res.ok) {
      return { text: '', resolvedUrl };
    }

    const html = await res.text();
    const text = extractCleanArticleTextFromHtml(html);
    return { text, resolvedUrl };
  } catch {
    clearTimeout(timer);
    return { text: '', resolvedUrl: rawUrl };
  }
}

/**
 * Enriches top search results with deep article body text concurrently.
 */
export async function enrichSearchResultsWithDeepContent(
  results: SearchResult[],
  maxDeepArticles = 3,
  timeoutMs = 3000
): Promise<SearchResult[]> {
  if (!results || results.length === 0) return [];

  const candidates = results.slice(0, maxDeepArticles);
  const remaining = results.slice(maxDeepArticles);

  const enrichedPromises = candidates.map(async (hit) => {
    // If snippet already contains rich text > 400 chars, keep it
    if (hit.snippet && hit.snippet.length > 400 && !hit.url.includes('news.google.com')) {
      return hit;
    }

    try {
      const { text, resolvedUrl } = await fetchPageContent(hit.url, timeoutMs);
      if (text && text.length > 80) {
        return {
          ...hit,
          url: resolvedUrl || hit.url,
          fullContent: text,
          snippet: text.length > hit.snippet.length ? text.slice(0, 450) + '...' : hit.snippet
        };
      }
    } catch {
      // Keep original hit on error
    }
    return hit;
  });

  const enriched = await Promise.all(enrichedPromises);
  return [...enriched, ...remaining];
}
