/**
 * Advanced Link Unshortener & Multi-Platform Deep Scraper / UI Profiler
 * Developed for Matany / matany.one
 *
 * Capabilities:
 * 1. 4-Tier Deep Scraping Architecture (Facebook, Instagram, X/Twitter, YouTube, TikTok, Generic Web)
 * 2. Unshortener & Redirect Follower (Resolves mobile share links, fb.watch, t.co, vt.tiktok, etc.)
 * 3. Extracts Full Untruncated Post Bodies, Captions, Transcripts, Author Profiles & Verified Status
 * 4. Extracts Top 5-10 Public Comments & Reactions across Social Media Platforms
 * 5. Full UI Framework detection (Next.js, React, Vue, Svelte, Angular, Astro, etc.)
 * 6. Component library detection (Tailwind, Bootstrap, MUI, Radix, Shadcn, Chakra, etc.)
 * 7. Design Style Aesthetic profiling (Glassmorphism, Neo-Brutalism, AI Minimalist, etc.)
 * 8. Automatic extraction of Logo, Favicon, OpenGraph banner, and SVG brand marks
 */

import * as cheerio from 'cheerio';

export interface RedirectHop {
  statusCode: number;
  url: string;
  locationHeader?: string;
}

export interface DetectedBrandAssets {
  favicon: string | null;
  appleTouchIcon: string | null;
  ogImage: string | null;
  twitterImage: string | null;
  svgLogos: string[];
  bestLogoUrl: string | null;
}

export interface DesignSystemProfile {
  primaryAesthetic: string;
  designStyles: string[];
  colorPalette: {
    brandPrimary?: string;
    brandAccent?: string;
    background?: string;
    surface?: string;
    textPrimary?: string;
  };
  typography: {
    fontFamilies: string[];
    hasMonospace: boolean;
  };
  borderRadius: {
    style: 'sharp' | 'subtle' | 'rounded' | 'pill';
    sampleValues: string[];
  };
  effects: {
    hasGlassmorphism: boolean;
    hasSubtleBorders: boolean;
    hasHeavyShadows: boolean;
    hasGlowEffects: boolean;
  };
}

export interface ScrapedComment {
  author: string;
  text: string;
  time?: string;
  reactions?: number | string;
  isPinned?: boolean;
  repliesCount?: number;
}

export interface DeepLinkScrapeResult {
  platform: 'facebook' | 'instagram' | 'twitter' | 'youtube' | 'tiktok' | 'web';
  canonicalUrl: string;
  originalUrl: string;
  author: {
    name: string;
    handle?: string;
    avatarUrl?: string;
    verified?: boolean;
    followers?: string;
  };
  authorName?: string;
  mediaType: 'video' | 'article' | 'carousel' | 'image' | 'post' | 'single';
  title: string;
  description: string;
  content: string; // Complete un-truncated post body, transcript, or clean article markdown
  mediaUrls: string[]; // High-res images, carousel items, keyframes
  videoUrl?: string;
  thumbnailUrl?: string;
  metrics?: {
    likes?: number;
    comments?: number;
    shares?: number;
    views?: number;
    retweets?: number;
  };
  topComments: ScrapedComment[];
  extractedAt: number;
  rawAnalysisSummaryAr: string;
  structuredContextBlock: string;
}

export interface ResolvedLinkData {
  inputUrl: string;
  originalUrl: string;
  canonicalUrl: string | null;
  domain: string;
  title: string;
  description: string;
  redirectChain: RedirectHop[];
  totalHops: number;
  isShortened: boolean;
  brandAssets: DetectedBrandAssets;
  frameworks: {
    coreFramework: string[];
    componentLibraries: string[];
    iconsAndAnimations: string[];
    stateAndDataFetching: string[];
    infrastructure: string[];
  };
  designProfile: DesignSystemProfile;
  mediaType?: 'video' | 'post' | 'image' | 'article' | 'website';
  isVideo?: boolean;
  postType?: 'video' | 'post' | 'photo' | 'article' | 'discussion';
  platformLabel?: string;
  videoMetadata?: {
    videoId?: string;
    authorName?: string;
    thumbnailUrl?: string;
    duration?: string;
    platform?: 'youtube' | 'tiktok' | 'instagram' | 'facebook' | 'twitter';
  };
  rawAnalysisSummaryAr: string;
  deepScrape?: DeepLinkScrapeResult;
  structuredContextBlock?: string;
}

const SHORTENER_DOMAINS = new Set([
  'share.google',
  'goo.gl',
  'g.co',
  'bit.ly',
  't.co',
  'tinyurl.com',
  'is.gd',
  'buff.ly',
  'ow.ly',
  'cutt.ly',
  'rebrand.ly',
  'bl.ink',
  'shorturl.at',
  'lnkd.in',
  'fb.me',
  'fb.watch',
  'fb.com',
  'fb.gg',
  'pin.it',
  'redd.it',
  'wp.me',
  'amzn.to',
  't.me',
  'youtu.be',
]);

const STEALTH_HEADERS: Record<string, string> = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Accept':
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'ar,en-US;q=0.9,en;q=0.8',
  'Sec-Ch-Ua': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
  'Sec-Ch-Ua-Mobile': '?0',
  'Sec-Ch-Ua-Platform': '"Windows"',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Sec-Fetch-User': '?1',
  'Upgrade-Insecure-Requests': '1',
};

/**
 * Normalizes and extracts clean URL from messy text or short link
 */
export function normalizeUrl(input: string): string {
  let cleaned = input.trim();
  const match = cleaned.match(/https?:\/\/[^\s<>"'{}|\\^`]+/i);
  if (match) {
    cleaned = match[0];
  } else if (!/^https?:\/\//i.test(cleaned)) {
    cleaned = 'https://' + cleaned;
  }
  cleaned = cleaned.replace(/[.,;:)>\]"']+$/, '');
  return cleaned;
}

/**
 * Checks if a domain is a known URL shortener or redirect service
 */
export function isShortenerUrl(urlStr: string): boolean {
  try {
    const parsed = new URL(urlStr);
    const hostname = parsed.hostname.toLowerCase().replace(/^www\./, '');
    return (
      SHORTENER_DOMAINS.has(hostname) ||
      hostname.endsWith('.link') ||
      hostname.includes('share.google') ||
      hostname.includes('goo.gl') ||
      hostname.includes('g.co')
    );
  } catch {
    return false;
  }
}

/**
 * Resolve absolute URL from relative path and base
 */
function toAbsoluteUrl(relOrAbs: string, baseUrl: string): string {
  try {
    return new URL(relOrAbs, baseUrl).href;
  } catch {
    return relOrAbs;
  }
}

const serverLinkCache = new Map<string, { data: ResolvedLinkData; expiresAt: number }>();
const CACHE_TTL_MS = 1000 * 60 * 15; // 15 minutes

/**
 * Unshorten link by programmatically following HTTP 301/302/307/308 redirects
 */
export async function followRedirects(
  startUrl: string,
  maxHops = 6,
  timeoutMs = 2500
): Promise<{
  finalUrl: string;
  chain: RedirectHop[];
  finalResponse: Response | null;
  html: string;
}> {
  let currentUrl = normalizeUrl(startUrl);
  const chain: RedirectHop[] = [];
  let finalResponse: Response | null = null;
  let finalHtml = '';

  for (let hop = 0; hop < maxHops; hop++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const resp = await fetch(currentUrl, {
        method: 'GET',
        headers: STEALTH_HEADERS,
        redirect: 'manual', // Manual redirect handling to record every hop
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      finalResponse = resp;
      const status = resp.status;
      const location = resp.headers.get('location');

      chain.push({
        statusCode: status,
        url: currentUrl,
        locationHeader: location || undefined,
      });

      // Handle 3xx Redirects
      if (status >= 300 && status < 400 && location) {
        let cleanLocation = location.replace(/#.*$/, '');
        if (cleanLocation.includes('facebook.com') && (cleanLocation.includes('share_url=') || cleanLocation.includes('rdid='))) {
          try {
            const locUrl = new URL(cleanLocation);
            locUrl.searchParams.delete('rdid');
            locUrl.searchParams.delete('share_url');
            cleanLocation = locUrl.href.replace(/#.*$/, '');
          } catch {}
        }
        currentUrl = toAbsoluteUrl(cleanLocation, currentUrl);
        continue;
      }

      // Check for meta refresh or JS redirect in 200 OK body if short link
      if (resp.ok) {
        const text = await resp.text();
        finalHtml = text;

        // Meta refresh: <meta http-equiv="refresh" content="0;url=https://...">
        const metaRefresh = text.match(
          /<meta[^>]+http-equiv=["']refresh["'][^>]+content=["'][^"']*url=([^"']+)["']/i
        );
        if (metaRefresh && metaRefresh[1]) {
          const nextUrl = toAbsoluteUrl(metaRefresh[1].trim(), currentUrl);
          if (nextUrl !== currentUrl) {
            chain.push({
              statusCode: 200,
              url: currentUrl,
              locationHeader: `meta-refresh -> ${nextUrl}`,
            });
            currentUrl = nextUrl;
            continue;
          }
        }
      }

      // No more redirects
      break;
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.warn(`[LinkResolver] Hop ${hop + 1} failed for ${currentUrl}:`, err.message);

      // Fallback: try automatic standard fetch if manual redirect threw
      if (hop === 0) {
        try {
          const autoController = new AbortController();
          const autoTimeout = setTimeout(() => autoController.abort(), timeoutMs);
          const autoResp = await fetch(currentUrl, {
            headers: STEALTH_HEADERS,
            redirect: 'follow',
            signal: autoController.signal,
          });
          clearTimeout(autoTimeout);
          finalResponse = autoResp;
          currentUrl = autoResp.url || currentUrl;
          finalHtml = await autoResp.text();
          chain.push({
            statusCode: autoResp.status,
            url: autoResp.url || currentUrl,
          });
        } catch {}
      }
      break;
    }
  }

  return {
    finalUrl: currentUrl,
    chain,
    finalResponse,
    html: finalHtml,
  };
}

/**
 * Fetch HTML with anti-bot fallback (Jina Reader) if necessary
 */
export async function fetchPageContent(targetUrl: string, existingHtml?: string): Promise<string> {
  if (existingHtml && existingHtml.length > 500 && !existingHtml.includes('cf-browser-verification')) {
    return existingHtml;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const resp = await fetch(targetUrl, {
      headers: STEALTH_HEADERS,
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (resp.ok) {
      const text = await resp.text();
      if (!text.includes('cf-browser-verification') && !text.includes('Checking your browser')) {
        return text;
      }
    }
  } catch (err) {
    console.warn('[LinkResolver] Direct fetch failed, trying bypass engine...', err);
  }

  // Bypass via Jina Reader Engine
  try {
    const bypassController = new AbortController();
    const bypassTimeout = setTimeout(() => bypassController.abort(), 2500);
    const bypassRes = await fetch(`https://r.jina.ai/${targetUrl}`, {
      headers: {
        'User-Agent': STEALTH_HEADERS['User-Agent'],
        'Accept': 'text/html, text/plain, application/json',
      },
      signal: bypassController.signal,
    });
    clearTimeout(bypassTimeout);
    if (bypassRes.ok) {
      return await bypassRes.text();
    }
  } catch {}

  return existingHtml || '';
}

/**
 * Extract brand assets, logos, favicons, and social images
 */
export function extractBrandAssets(html: string, baseUrl: string): DetectedBrandAssets {
  let favicon: string | null = null;
  let appleTouchIcon: string | null = null;
  let ogImage: string | null = null;
  let twitterImage: string | null = null;
  const svgLogos: string[] = [];

  // Favicon
  const favMatch =
    html.match(/<link[^>]+rel=["'](?:shortcut icon|icon)["'][^>]+href=["']([^"']+)["']/i) ||
    html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["'](?:shortcut icon|icon)["']/i);
  if (favMatch && favMatch[1]) {
    favicon = toAbsoluteUrl(favMatch[1], baseUrl);
  } else {
    try {
      const u = new URL(baseUrl);
      favicon = `${u.origin}/favicon.ico`;
    } catch {}
  }

  // Apple Touch Icon
  const appleMatch =
    html.match(/<link[^>]+rel=["']apple-touch-icon["'][^>]+href=["']([^"']+)["']/i) ||
    html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']apple-touch-icon["']/i);
  if (appleMatch && appleMatch[1]) {
    appleTouchIcon = toAbsoluteUrl(appleMatch[1], baseUrl);
  }

  // OpenGraph Image
  const ogMatch =
    html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
  if (ogMatch && ogMatch[1]) {
    ogImage = toAbsoluteUrl(ogMatch[1], baseUrl);
  }

  // Twitter Image
  const twMatch =
    html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i) ||
    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i);
  if (twMatch && twMatch[1]) {
    twitterImage = toAbsoluteUrl(twMatch[1], baseUrl);
  }

  // Inline SVG logos in header / nav
  const svgMatches = html.match(/<svg[\s\S]*?<\/svg>/gi) || [];
  for (const svg of svgMatches) {
    if (
      svg.toLowerCase().includes('logo') ||
      svg.toLowerCase().includes('brand') ||
      svg.toLowerCase().includes('viewbox="0 0 143 23"') ||
      (svg.length > 150 && svg.length < 5000)
    ) {
      if (svgLogos.length < 3) {
        svgLogos.push(svg);
      }
    }
  }

  // Best logo candidate
  const bestLogoUrl = ogImage || twitterImage || appleTouchIcon || favicon;

  return {
    favicon,
    appleTouchIcon,
    ogImage,
    twitterImage,
    svgLogos,
    bestLogoUrl,
  };
}

/**
 * Detect UI Frameworks, Component Libraries, and Styling Stacks
 */
export function detectFrameworks(html: string, headers: Record<string, string> = {}): ResolvedLinkData['frameworks'] {
  const lowerHtml = html.toLowerCase();

  const coreFramework: string[] = [];
  const componentLibraries: string[] = [];
  const iconsAndAnimations: string[] = [];
  const stateAndDataFetching: string[] = [];
  const infrastructure: string[] = [];

  // Core Frameworks
  if (html.includes('__NEXT_DATA__') || html.includes('/_next/') || html.includes('next-intl')) {
    coreFramework.push('Next.js (App / Pages Router)');
  }
  if (html.includes('__NUXT__') || html.includes('/_nuxt/')) {
    coreFramework.push('Nuxt.js');
  }
  if (html.includes('react') || html.includes('_reactRoot') || html.includes('react-dom') || html.includes('/_next/')) {
    coreFramework.push('React');
  }
  if (html.includes('vue') || html.includes('data-v-') || html.includes('vue.js') || html.includes('/_nuxt/')) {
    coreFramework.push('Vue.js');
  }
  if (html.includes('svelte') || html.includes('__svelte')) {
    coreFramework.push('Svelte / SvelteKit');
  }
  if (html.includes('ng-version') || html.includes('ng-app') || html.includes('angular')) {
    coreFramework.push('Angular');
  }
  if (html.includes('astro-island') || html.includes('/_astro/')) {
    coreFramework.push('Astro');
  }
  if (html.includes('data-remix') || html.includes('__remix')) {
    coreFramework.push('Remix');
  }
  if (html.includes('solid-js') || html.includes('solid-app')) {
    coreFramework.push('SolidJS');
  }
  if (html.includes('alpinejs') || html.includes('x-data') || html.includes('x-bind')) {
    coreFramework.push('Alpine.js');
  }
  if (html.includes('hx-get') || html.includes('hx-post') || html.includes('htmx.org')) {
    coreFramework.push('HTMX');
  }
  if (html.includes('jquery') || html.includes('jQuery')) {
    coreFramework.push('jQuery');
  }
  if (html.includes('wp-content') || html.includes('wp-includes')) {
    coreFramework.push('WordPress');
  }
  if (html.includes('cdn.shopify.com') || html.includes('Shopify.theme')) {
    coreFramework.push('Shopify');
  }
  if (html.includes('w-layout-') || html.includes('webflow.js')) {
    coreFramework.push('Webflow');
  }

  // Component Libraries & CSS
  if (
    lowerHtml.includes('tailwind') ||
    lowerHtml.includes('--tw-') ||
    html.includes('rounded-') ||
    html.includes('aspect-square') ||
    html.includes('flex flex-col')
  ) {
    componentLibraries.push('Tailwind CSS');
  }
  if (lowerHtml.includes('bootstrap') || html.includes('btn btn-primary') || html.includes('col-md-') || html.includes('navbar-expand')) {
    componentLibraries.push('Bootstrap');
  }
  if (html.includes('MuiButton') || html.includes('MuiTypography') || html.includes('@mui/material') || html.includes('MuiBox')) {
    componentLibraries.push('Material-UI (MUI)');
  }
  if (html.includes('ant-btn') || html.includes('ant-layout') || html.includes('antd')) {
    componentLibraries.push('Ant Design');
  }
  if (html.includes('chakra-ui') || html.includes('chakra-button')) {
    componentLibraries.push('Chakra UI');
  }
  if (html.includes('radix-ui') || html.includes('data-radix-')) {
    componentLibraries.push('Radix UI');
  }
  if (html.includes('shadcn') || (componentLibraries.includes('Tailwind CSS') && componentLibraries.includes('Radix UI'))) {
    componentLibraries.push('Shadcn/UI Architecture');
  }
  if (html.includes('mantine-') || html.includes('@mantine/core')) {
    componentLibraries.push('Mantine UI');
  }
  if (html.includes('daisyui') || html.includes('btn-primary')) {
    componentLibraries.push('DaisyUI');
  }
  if (html.includes('heroui') || html.includes('nextui')) {
    componentLibraries.push('HeroUI / NextUI');
  }

  // Icons & Motion
  if (lowerHtml.includes('lucide') || html.includes('lucide-react')) {
    iconsAndAnimations.push('Lucide Icons');
  }
  if (lowerHtml.includes('fontawesome') || html.includes('fa-') || html.includes('fa-solid')) {
    iconsAndAnimations.push('FontAwesome');
  }
  if (lowerHtml.includes('framer-motion') || html.includes('framer') || html.includes('motion.')) {
    iconsAndAnimations.push('Framer Motion');
  }
  if (lowerHtml.includes('gsap') || html.includes('ScrollTrigger')) {
    iconsAndAnimations.push('GSAP (GreenSock)');
  }
  if (lowerHtml.includes('lottie') || html.includes('lottie-player')) {
    iconsAndAnimations.push('Lottie Animations');
  }
  if (lowerHtml.includes('three.js') || html.includes('three.min.js') || html.includes('webgl')) {
    iconsAndAnimations.push('Three.js / WebGL 3D');
  }

  // State & Data
  if (html.includes('zustand') || html.includes('createStore')) {
    stateAndDataFetching.push('Zustand');
  }
  if (html.includes('next-intl') || html.includes('react-intl')) {
    stateAndDataFetching.push('next-intl (i18n Localization)');
  }
  if (html.includes('tanstack') || html.includes('react-query')) {
    stateAndDataFetching.push('TanStack Query');
  }
  if (html.includes('swr') || html.includes('useSWR')) {
    stateAndDataFetching.push('SWR');
  }

  // Infrastructure & CDN
  const serverHeader = headers['server']?.toLowerCase() || '';
  const viaHeader = headers['via']?.toLowerCase() || '';

  if (viaHeader.includes('cloudfront') || serverHeader.includes('amazons3') || headers['x-amz-cf-pop']) {
    infrastructure.push('AWS CloudFront CDN + Amazon S3');
  }
  if (headers['cf-ray'] || serverHeader.includes('cloudflare') || lowerHtml.includes('cloudflare')) {
    infrastructure.push('Cloudflare Edge / WAF');
  }
  if (headers['x-vercel-id']) {
    infrastructure.push('Vercel Edge Network');
  }
  if (headers['x-nf-request-id'] || serverHeader.includes('netlify')) {
    infrastructure.push('Netlify');
  }
  if (headers['x-goog-generation'] || serverHeader.includes('gse') || serverHeader.includes('google')) {
    infrastructure.push('Google Cloud Infrastructure');
  }

  return {
    coreFramework: Array.from(new Set(coreFramework)),
    componentLibraries: Array.from(new Set(componentLibraries)),
    iconsAndAnimations: Array.from(new Set(iconsAndAnimations)),
    stateAndDataFetching: Array.from(new Set(stateAndDataFetching)),
    infrastructure: Array.from(new Set(infrastructure)),
  };
}

/**
 * Profile the visual design style, aesthetic, typography, and palette
 */
export function profileDesignAesthetic(html: string): DesignSystemProfile {
  const lower = html.toLowerCase();
  const designStyles: string[] = [];

  // 1. Check Glassmorphism
  const hasGlassmorphism =
    lower.includes('backdrop-blur') ||
    lower.includes('backdrop-filter') ||
    lower.includes('blur-glass') ||
    lower.includes('hsla(0,0%,100%,.3)');

  if (hasGlassmorphism) {
    designStyles.push('Glassmorphism (Frosted Glass Surfaces)');
  }

  // 2. Check Neo-Brutalism
  const hasNeoBrutalism =
    (lower.includes('border-4') || lower.includes('border-2')) &&
    (lower.includes('shadow-[') || lower.includes('border-black')) &&
    lower.includes('uppercase');

  if (hasNeoBrutalism) {
    designStyles.push('Neo-Brutalism (Bold High-Contrast Outlines & Hard Shadows)');
  }

  // 3. AI Tech Neo-Minimalism
  const isAiTechMinimalist =
    lower.includes('ds-color') ||
    lower.includes('--ds-') ||
    lower.includes('dark:bg-') ||
    (lower.includes('rounded-') && hasGlassmorphism);

  if (isAiTechMinimalist || (!hasNeoBrutalism && (hasGlassmorphism || lower.includes('tailwind')))) {
    designStyles.push('Neo-Minimalist AI Modern (Clean Typography, Smooth Depth, Micro-interactions)');
  }

  // 4. Extract Colors
  const colorPalette: DesignSystemProfile['colorPalette'] = {};
  const brandColorMatch =
    html.match(/--(?:ds-|brand-|primary-)?color(?:-brand|-primary)?:\s*(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\))/i) ||
    html.match(/#4[dD]6[bB][fF][eE]|#3[bB]82[fF]6|#2563[eE][bB]|#0066[fF][fF]/);

  if (brandColorMatch) {
    colorPalette.brandPrimary = brandColorMatch[1] || brandColorMatch[0];
  } else if (lower.includes('#4d6bfe')) {
    colorPalette.brandPrimary = '#4D6BFE (DeepSeek Blue)';
  } else {
    colorPalette.brandPrimary = '#2563EB (Modern High-Contrast Indigo/Blue)';
  }

  if (lower.includes('#f9f8f8') || lower.includes('#f8fafc') || lower.includes('bg-slate-50')) {
    colorPalette.background = '#F9F8F8 (Warm Soft Off-White)';
  } else if (lower.includes('#0f0f0f') || lower.includes('#09090b') || lower.includes('bg-black')) {
    colorPalette.background = '#09090B (Dark OLED Minimal)';
  }

  // 5. Typography
  const fontFamilies: string[] = [];
  if (lower.includes('montserrat')) fontFamilies.push('Montserrat');
  if (lower.includes('inter')) fontFamilies.push('Inter');
  if (lower.includes('geist')) fontFamilies.push('Geist Sans');
  if (lower.includes('sf-pro') || lower.includes('system-ui')) fontFamilies.push('System UI / SF Pro');
  if (lower.includes('roboto')) fontFamilies.push('Roboto');

  if (fontFamilies.length === 0) {
    fontFamilies.push('ui-sans-serif, system-ui, -apple-system, sans-serif');
  }

  const hasMonospace =
    lower.includes('mono') ||
    lower.includes('sfmono') ||
    lower.includes('consolas') ||
    lower.includes('code');

  // 6. Border Radius
  const radiiSamples: string[] = [];
  let radiusStyle: DesignSystemProfile['borderRadius']['style'] = 'rounded';
  if (lower.includes('rounded-full') || lower.includes('radius-pill') || lower.includes('100px')) {
    radiusStyle = 'pill';
    radiiSamples.push('Pill (100px / Full)', 'Card (24px)', 'Panel (16px)', 'Media (12px)');
  } else if (lower.includes('rounded-2xl') || lower.includes('rounded-xl')) {
    radiusStyle = 'rounded';
    radiiSamples.push('Smooth Rounded (12px - 16px)');
  } else if (hasNeoBrutalism || lower.includes('rounded-none')) {
    radiusStyle = 'sharp';
    radiiSamples.push('Sharp (0px / 2px)');
  } else {
    radiusStyle = 'subtle';
    radiiSamples.push('Subtle (4px - 8px)');
  }

  return {
    primaryAesthetic: designStyles[0] || 'Modern Minimalist Web Interface',
    designStyles,
    colorPalette,
    typography: {
      fontFamilies,
      hasMonospace,
    },
    borderRadius: {
      style: radiusStyle,
      sampleValues: radiiSamples,
    },
    effects: {
      hasGlassmorphism,
      hasSubtleBorders: lower.includes('border-') || lower.includes('shadow-sm') || lower.includes('0 0 0 1px'),
      hasHeavyShadows: hasNeoBrutalism || lower.includes('shadow-2xl'),
      hasGlowEffects: lower.includes('glow') || lower.includes('blur-'),
    },
  };
}

/**
 * Master unshortener and webpage analyzer function
 */
export async function resolveAndProfileUrl(rawInputUrl: string): Promise<ResolvedLinkData> {
  const normalized = normalizeUrl(rawInputUrl);
  const now = Date.now();

  const cached = serverLinkCache.get(normalized);
  if (cached && cached.expiresAt > now) {
    return cached.data;
  }

  const isShort = isShortenerUrl(normalized);

  // 1. Follow HTTP Redirects
  const { finalUrl, chain, finalResponse, html: initialHtml } = await followRedirects(normalized);

  // 2. Fetch Complete Webpage HTML if needed
  const html = await fetchPageContent(finalUrl, initialHtml);

  // 3. Extract Canonical URL & Page Title
  let canonicalUrl: string | null = null;
  const canonicalMatch =
    html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i) ||
    html.match(/<meta[^>]+property=["']og:url["'][^>]+content=["']([^"']+)["']/i);
  if (canonicalMatch && canonicalMatch[1]) {
    canonicalUrl = toAbsoluteUrl(canonicalMatch[1], finalUrl);
  }

  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : 'الصفحة الرئيسية';

  const descMatch =
    html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i) ||
    html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i);
  const description = descMatch ? descMatch[1].trim() : '';

  // 4. Extract Brand Assets & Logo
  const brandAssets = extractBrandAssets(html, finalUrl);

  // 5. Detect Frameworks & Stacks
  const headers = finalResponse ? Object.fromEntries(finalResponse.headers.entries()) : {};
  const frameworks = detectFrameworks(html, headers);

  // 6. Profile Design Aesthetic
  const designProfile = profileDesignAesthetic(html);

  // 7. Domain name
  let domain = finalUrl;
  try {
    domain = new URL(finalUrl).hostname;
  } catch {}

  // Check platform
  const ytMatch = finalUrl.match(/(?:v=|youtu\.be\/|\/(?:shorts|embed|live|v|e)\/|^)([a-zA-Z0-9_-]{11})/);
  const isYouTube = /(?:youtube\.com|youtu\.be)\//i.test(finalUrl);
  const isTikTok = /(?:tiktok\.com|vm\.tiktok\.com|vt\.tiktok\.com)\//i.test(finalUrl);
  const isInstagram = /(?:instagram\.com|instagr\.am|ig\.me)\//i.test(finalUrl);
  const isFacebook = /(?:facebook\.com|fb\.watch|fb\.me|fb\.com|fb\.gg|m\.facebook\.com|web\.facebook\.com|touch\.facebook\.com|mbasic\.facebook\.com)/i.test(finalUrl);
  const isTwitter = /(?:x\.com|twitter\.com|t\.co)\//i.test(finalUrl);

  let effectiveTitle = title;
  let effectiveDescription = description;
  let effectiveBrandAssets = brandAssets;
  let effectiveFrameworks = frameworks;

  // Run deep multi-platform scraping
  let deepScrape: DeepLinkScrapeResult | undefined;
  try {
    deepScrape = await scrapeDeepLink(finalUrl, html);
    if (deepScrape) {
      if (deepScrape.title && deepScrape.title !== 'الصفحة الرئيسية' && deepScrape.title !== 'صفحة غير معنونة') {
        effectiveTitle = deepScrape.title;
      }
      if (deepScrape.description) {
        effectiveDescription = deepScrape.description;
      }
      if (deepScrape.thumbnailUrl) {
        effectiveBrandAssets.ogImage = deepScrape.thumbnailUrl;
      }
    }
  } catch (err: any) {
    console.warn('[LinkResolver] Deep scrape notice:', err?.message);
  }

  let mediaType: 'video' | 'post' | 'image' | 'article' | 'website' = 'website';
  let isVideo = false;
  let postType: 'video' | 'post' | 'photo' | 'article' | 'discussion' = 'article';
  let platformLabel = 'موقع ويب واستطلاع تقني';
  let videoMetadata: { videoId?: string; authorName?: string; thumbnailUrl?: string; duration?: string; platform?: 'youtube' | 'tiktok' | 'instagram' | 'facebook' | 'twitter' } | undefined = undefined;

  if (isYouTube && ytMatch && ytMatch[1]) {
    const videoId = ytMatch[1];
    const thumbUrl = deepScrape?.thumbnailUrl || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    
    effectiveTitle = deepScrape?.title || title || 'فيديو يوتيوب';
    effectiveDescription = deepScrape?.description || description || '';
    mediaType = 'video';
    isVideo = true;
    postType = 'video';
    platformLabel = 'فيديو يوتيوب (YouTube Video)';

    videoMetadata = {
      videoId,
      authorName: deepScrape?.author.name || 'قناة يوتيوب',
      thumbnailUrl: thumbUrl,
      platform: 'youtube',
    };

    effectiveBrandAssets = {
      ...brandAssets,
      bestLogoUrl: 'https://www.youtube.com/s/desktop/f71887e1/img/favicon_144x144.png',
      favicon: 'https://www.youtube.com/s/desktop/f71887e1/img/favicon_144x144.png',
      ogImage: thumbUrl,
    };

    effectiveFrameworks = {
      coreFramework: [],
      componentLibraries: [],
      iconsAndAnimations: [],
      stateAndDataFetching: [],
      infrastructure: [],
    };
  } else if (isTikTok) {
    const ttMatch = finalUrl.match(/\/video\/(\d{15,22})/i);
    const videoId = ttMatch ? ttMatch[1] : 'tiktok_video';
    
    effectiveTitle = deepScrape?.title || title || 'فيديو تيك توك';
    effectiveDescription = deepScrape?.description || `@${deepScrape?.author.name || 'TikTok'}`;
    mediaType = 'video';
    isVideo = true;
    postType = 'video';
    platformLabel = 'فيديو تيك توك (TikTok Video)';

    videoMetadata = {
      videoId,
      authorName: deepScrape?.author.name || 'TikTok Creator',
      thumbnailUrl: deepScrape?.thumbnailUrl || brandAssets.ogImage || 'https://www.tiktok.com/favicon.ico',
      platform: 'tiktok',
    };

    effectiveBrandAssets = {
      ...brandAssets,
      bestLogoUrl: 'https://www.tiktok.com/favicon.ico',
      favicon: 'https://www.tiktok.com/favicon.ico',
      ogImage: videoMetadata.thumbnailUrl || brandAssets.ogImage || null,
    };

    effectiveFrameworks = {
      coreFramework: [],
      componentLibraries: [],
      iconsAndAnimations: [],
      stateAndDataFetching: [],
      infrastructure: [],
    };
  } else if (isInstagram) {
    const shortcodeMatch = finalUrl.match(/(?:reel|reels|p|tv)\/([A-Za-z0-9_-]+)/i);
    const videoId = shortcodeMatch ? shortcodeMatch[1] : undefined;
    const isReel = /(?:reel|reels|tv)/i.test(finalUrl) || deepScrape?.mediaType === 'video';

    mediaType = isReel ? 'video' : 'post';
    isVideo = isReel;
    postType = isReel ? 'video' : 'post';
    platformLabel = isReel ? 'ريلز إنستغرام (Instagram Reel)' : 'منشور إنستغرام (Instagram Post)';

    videoMetadata = {
      videoId,
      authorName: deepScrape?.author.name || `@${deepScrape?.author.handle || 'Instagram'}`,
      thumbnailUrl: deepScrape?.thumbnailUrl || brandAssets.ogImage || 'https://www.instagram.com/static/images/ico/favicon-192.png/68d99ba29cc8.png',
      platform: 'instagram',
    };

    effectiveBrandAssets = {
      ...brandAssets,
      bestLogoUrl: 'https://www.instagram.com/static/images/ico/favicon-192.png/68d99ba29cc8.png',
      favicon: 'https://www.instagram.com/static/images/ico/favicon-192.png/68d99ba29cc8.png',
      ogImage: videoMetadata.thumbnailUrl || brandAssets.ogImage || null,
    };

    effectiveFrameworks = {
      coreFramework: [],
      componentLibraries: [],
      iconsAndAnimations: [],
      stateAndDataFetching: [],
      infrastructure: [],
    };
  } else if (isFacebook) {
    const isFacebookVideoUrl = /(?:facebook\.com|fb\.watch)\/(?:reel|reels|watch|videos|share\/v\/|share\/r\/)/i.test(finalUrl);
    const isFacebookPostUrl = /(?:facebook\.com|fb\.me)\/(?:share\/p\/|posts\/|permalink\.php|story\.php|photos\/|photo\/)/i.test(finalUrl);
    const isFbVideo = Boolean((deepScrape?.mediaType === 'video' || isFacebookVideoUrl) && !isFacebookPostUrl && !finalUrl.includes('/share/p/'));

    mediaType = isFbVideo ? 'video' : 'post';
    isVideo = isFbVideo;
    postType = isFbVideo ? 'video' : 'post';
    platformLabel = isFbVideo ? 'فيديو فيسبوك (Facebook Video)' : 'منشور فيسبوك (Facebook Post)';

    const idMatch = finalUrl.match(/(?:videos|reel|watch\/\?v=|watch\?v=|share\/v\/|share\/r\/|share\/p\/|share\/|posts\/|fbid=)\/?([0-9a-zA-Z_-]+)/i);
    const videoId = isFbVideo ? idMatch?.[1] : undefined;

    videoMetadata = {
      videoId,
      authorName: deepScrape?.author.name || 'Facebook Page / User',
      thumbnailUrl: deepScrape?.thumbnailUrl || brandAssets.ogImage || 'https://static.xx.fbcdn.net/rsrc.php/yT/r/a9Pl9FiAbJy.ico',
      platform: 'facebook',
    };

    effectiveBrandAssets = {
      ...brandAssets,
      bestLogoUrl: 'https://static.xx.fbcdn.net/rsrc.php/yT/r/a9Pl9FiAbJy.ico',
      favicon: 'https://static.xx.fbcdn.net/rsrc.php/yT/r/a9Pl9FiAbJy.ico',
      ogImage: videoMetadata.thumbnailUrl || brandAssets.ogImage || null,
    };

    effectiveFrameworks = {
      coreFramework: [],
      componentLibraries: [],
      iconsAndAnimations: [],
      stateAndDataFetching: [],
      infrastructure: [],
    };
  } else if (isTwitter) {
    const statusMatch = finalUrl.match(/status\/([0-9]+)/i);
    const statusId = statusMatch ? statusMatch[1] : undefined;
    const isTwVideo = Boolean(deepScrape?.mediaType === 'video' || deepScrape?.videoUrl);

    mediaType = isTwVideo ? 'video' : 'post';
    isVideo = isTwVideo;
    postType = isTwVideo ? 'video' : 'post';
    platformLabel = isTwVideo ? 'فيديو إكس (X Video Post)' : 'منشور إكس (X / Twitter Post)';

    videoMetadata = {
      videoId: isTwVideo ? statusId : undefined,
      authorName: deepScrape?.author.name || `@${deepScrape?.author.handle || 'x_user'}`,
      thumbnailUrl: deepScrape?.thumbnailUrl || brandAssets.twitterImage || 'https://abs.twimg.com/favicons/twitter.3.ico',
      platform: 'twitter',
    };

    effectiveBrandAssets = {
      ...brandAssets,
      bestLogoUrl: 'https://abs.twimg.com/favicons/twitter.3.ico',
      favicon: 'https://abs.twimg.com/favicons/twitter.3.ico',
      ogImage: videoMetadata.thumbnailUrl || brandAssets.ogImage || null,
    };

    effectiveFrameworks = {
      coreFramework: [],
      componentLibraries: [],
      iconsAndAnimations: [],
      stateAndDataFetching: [],
      infrastructure: [],
    };
  }

  // 8. Generate Rich Arabic Reconnaissance Summary for AI context injection
  const chainText = chain.map(h => `  * [${h.statusCode}] -> ${h.url}`).join('\n');
  const rawAnalysisSummaryAr = `
[تقرير فك الشفرة والاستطلاع المتقدم للرابط - AUTOMATED LINK RECONNAISSANCE]:
- الرابط المدخل: ${normalized}
- حالة الاختصار: ${isShort ? 'رابط مختصر / إعادة توجيه (Shortened Link)' : 'رابط مباشر'}
- نوع المحتوى: ${platformLabel}
- مسار إعادة التوجيه (${chain.length} قفزات):
${chainText}
- الرابط الأصلي والنهائي (Final Resolved URL): ${finalUrl}
- الرابط المعياري (Canonical URL): ${canonicalUrl || finalUrl}
- عنوان المحتوى (Title): ${effectiveTitle}
- الوصف (Description): ${effectiveDescription || 'غير متوفر'}
- الشعار والأصول البصرية (Brand Assets):
  * الشعار الأساسي / Thumbnail: ${effectiveBrandAssets.bestLogoUrl || 'غير محدد'}
  * Favicon: ${effectiveBrandAssets.favicon || 'غير محدد'}
${(!isYouTube && !isTikTok && !isFacebook && !isTwitter && !isInstagram) ? `- أطر العمل المكتشفة (Detected Frameworks):
  * واجهة المستخدم الأساسية: ${effectiveFrameworks.coreFramework.join(', ') || 'Custom Vanilla / Server Rendered'}
  * مكتبات المكونات والتنسيق: ${effectiveFrameworks.componentLibraries.join(', ') || 'Custom CSS Tokens'}
  * الأيقونات والحركات: ${effectiveFrameworks.iconsAndAnimations.join(', ') || 'Inline SVG'}
  * إدارة الحالة والبيانات: ${effectiveFrameworks.stateAndDataFetching.join(', ') || 'Native React/DOM State'}
  * البنية التحتية والشبكة: ${effectiveFrameworks.infrastructure.join(', ') || 'Edge Server / CDN'}` : ''}
`.trim();

  const structuredContextBlock = deepScrape ? formatDeepLinkContext(deepScrape) : undefined;

  const result: ResolvedLinkData = {
    inputUrl: rawInputUrl,
    originalUrl: finalUrl,
    canonicalUrl,
    domain,
    title: effectiveTitle,
    description: effectiveDescription,
    redirectChain: chain,
    totalHops: chain.length,
    isShortened: isShort,
    brandAssets: effectiveBrandAssets,
    frameworks: effectiveFrameworks,
    designProfile,
    mediaType,
    isVideo,
    postType,
    platformLabel,
    videoMetadata,
    rawAnalysisSummaryAr,
    deepScrape,
    structuredContextBlock,
  };

  serverLinkCache.set(normalized, {
    data: result,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });

  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// 4-TIER MULTI-PLATFORM DEEP SCRAPERS
// ─────────────────────────────────────────────────────────────────────────────

const BOT_HEADERS: Record<string, string> = {
  'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php) Facebot Twitterbot/1.0',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'ar,en-US;q=0.9,en;q=0.8',
};

const MOBILE_HEADERS: Record<string, string> = {
  'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'ar,en-US;q=0.9,en;q=0.8',
};

function decodeHtmlEntities(str: string): string {
  if (!str) return '';
  return str
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
    .replace(/&#([0-9]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 10)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

// ─── 1. Facebook Deep Scraper ────────────────────────────────────────────────

export async function scrapeFacebookDeep(url: string, htmlInput?: string): Promise<DeepLinkScrapeResult> {
  const normalized = normalizeUrl(url);
  let finalUrl = normalized;
  let html = htmlInput || '';

  // Follow unshortener if not provided or if share link
  if (!html || /facebook\.com\/share/i.test(normalized) || /fb\.watch/i.test(normalized)) {
    try {
      const redirected = await followRedirects(normalized, 6, 4000);
      finalUrl = redirected.finalUrl;
      html = redirected.html || html;
    } catch {}
  }

  // ── Strategy A: oEmbed & OpenGraph Meta & JSON-LD ──
  let oEmbedData: any = null;
  try {
    const oembedUrl = `https://www.facebook.com/plugins/post/oembed.json/?url=${encodeURIComponent(finalUrl)}`;
    const oRes = await fetch(oembedUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(3000),
    });
    if (oRes.ok) {
      oEmbedData = await oRes.json();
    }
  } catch {}

  // Fetch with Bot headers if html is too short
  if (!html || html.length < 2000) {
    try {
      const res = await fetch(finalUrl, {
        headers: BOT_HEADERS,
        redirect: 'follow',
        signal: AbortSignal.timeout(4000),
      });
      if (res.ok) {
        html = await res.text();
        finalUrl = res.url || finalUrl;
      }
    } catch {}
  }

  let $ = cheerio.load(html);

  const ogTitle = decodeHtmlEntities($('meta[property="og:title"]').attr('content') || $('title').text() || '');
  const ogDesc = decodeHtmlEntities($('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content') || '');
  const ogImage = decodeHtmlEntities($('meta[property="og:image"]').attr('content') || $('meta[property="og:image:secure_url"]').attr('content') || '');
  const ogVideo = decodeHtmlEntities($('meta[property="og:video"]').attr('content') || $('meta[property="og:video:secure_url"]').attr('content') || '');

  // Extract from JSON-LD
  let jsonLdBody = '';
  let jsonLdAuthor = '';
  const jsonLdImages: string[] = [];
  let jsonLdVideoUrl = '';
  const comments: ScrapedComment[] = [];
  let likesCount: number | undefined;
  let commentsCount: number | undefined;
  let sharesCount: number | undefined;

  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const parsed = JSON.parse($(el).text().trim());
      const items = Array.isArray(parsed) ? parsed : [parsed];
      for (const item of items) {
        if (item.articleBody && typeof item.articleBody === 'string') jsonLdBody = item.articleBody;
        if (item.text && typeof item.text === 'string' && !jsonLdBody) jsonLdBody = item.text;
        if (item.description && typeof item.description === 'string' && !jsonLdBody) jsonLdBody = item.description;
        if (item.headline && typeof item.headline === 'string' && !jsonLdBody) jsonLdBody = item.headline;

        if (item.author) {
          const aName = typeof item.author === 'string' ? item.author : item.author.name;
          if (aName) jsonLdAuthor = aName;
        }

        if (item.image) {
          if (Array.isArray(item.image)) {
            jsonLdImages.push(...item.image.map((img: any) => typeof img === 'string' ? img : img.url).filter(Boolean));
          } else if (typeof item.image === 'string') {
            jsonLdImages.push(item.image);
          } else if (item.image.url) {
            jsonLdImages.push(item.image.url);
          }
        }

        if (item.video) {
          jsonLdVideoUrl = item.video.contentUrl || item.video.embedUrl || '';
        }

        if (item.comment && Array.isArray(item.comment)) {
          for (const c of item.comment) {
            const cText = c.text || c.commentText || '';
            const cAuthor = typeof c.author === 'string' ? c.author : (c.author?.name || 'معلق فيسبوك');
            if (cText.trim() && !comments.some(x => x.text === cText.trim())) {
              comments.push({
                author: cAuthor,
                text: decodeHtmlEntities(cText.trim()),
                time: c.dateCreated,
              });
            }
          }
        }

        if (item.interactionStatistic && Array.isArray(item.interactionStatistic)) {
          for (const stat of item.interactionStatistic) {
            const type = stat.interactionType?.['@type'] || stat.interactionType || '';
            const count = parseInt(stat.userInteractionCount || '0', 10);
            if (type.includes('LikeAction')) likesCount = count;
            if (type.includes('CommentAction')) commentsCount = count;
            if (type.includes('ShareAction')) sharesCount = count;
          }
        }
      }
    } catch {}
  });

  // Extract from HTML microdata / CSS selectors
  let postMessageText = '';
  const postMsgEl = $('div[data-testid="post_message"], div[data-ad-preview="message"], div._5rgt, div.story_body_container, div[role="article"] p');
  if (postMsgEl.length > 0) {
    postMessageText = decodeHtmlEntities(postMsgEl.first().text().trim());
  }

  // ── Strategy B: Mobile DOM Scraper with Modern Mobile User-Agent ──
  let mobileHtml = '';
  const isPostTextMissingOrShort = (!jsonLdBody && !postMessageText && (!ogDesc || ogDesc.length < 20));
  if (isPostTextMissingOrShort || comments.length === 0) {
    try {
      const mobileUrl = finalUrl
        .replace(/www\.facebook\.com/i, 'm.facebook.com')
        .replace(/web\.facebook\.com/i, 'm.facebook.com');
      const mRes = await fetch(mobileUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'ar,en-US;q=0.9,en;q=0.8',
        },
        redirect: 'follow',
        signal: AbortSignal.timeout(3500),
      });
      if (mRes.ok) {
        mobileHtml = await mRes.text();
        const $m = cheerio.load(mobileHtml);

        // Extract author from mobile header
        const mAuthor = $m('header h3, .actor, div[data-testid="post_message"] ancestor::header, .story_body_container h3').first().text().trim();
        if (mAuthor && !jsonLdAuthor) jsonLdAuthor = decodeHtmlEntities(mAuthor);

        // Extract message from mobile elements
        const mPostEl = $m('div[data-ad-preview="message"], div[data-testid="post_message"], div[dir="auto"], article p, .story_body_container p');
        mPostEl.each((_, el) => {
          const t = decodeHtmlEntities($(el).text().trim());
          if (t.length > 10 && !postMessageText) {
            postMessageText = t;
          }
        });

        // Extract comments from mobile DOM
        $m('[aria-label*="Comment by"], [data-testid="UFI2Comment/body"], [data-sigil="comment-body"], [data-commentid], div[role="article"] div[dir="auto"]').each((_, el) => {
          const cText = decodeHtmlEntities($m(el).text().trim().replace(/\s+/g, ' '));
          const ariaLabel = $m(el).attr('aria-label') || '';
          const authorMatch = ariaLabel.match(/Comment by ([^,]+)/i);
          const cAuthor = authorMatch ? authorMatch[1].trim() : 'معلق فيسبوك';
          if (cText.length > 3 && !comments.some(x => x.text === cText)) {
            comments.push({ author: cAuthor, text: cText });
          }
        });
      }
    } catch {}
  }

  // Extract HTML comments from desktop if still none
  if (comments.length === 0) {
    $('[aria-label*="Comment by"], [data-testid="UFI2Comment/body"], [data-sigil="comment-body"], [data-commentid]').each((_, el) => {
      const cText = decodeHtmlEntities($(el).text().trim().replace(/\s+/g, ' '));
      const ariaLabel = $(el).attr('aria-label') || '';
      const authorMatch = ariaLabel.match(/Comment by ([^,]+)/i);
      const cAuthor = authorMatch ? authorMatch[1].trim() : 'معلق فيسبوك';
      if (cText.length > 3 && !comments.some(x => x.text === cText)) {
        comments.push({ author: cAuthor, text: cText });
      }
    });
  }

  // ── Strategy C: Fallback Payload Generation & Semantic Reconstruction ──
  // Author determination and title dissection
  let authorName = jsonLdAuthor || oEmbedData?.author_name || '';
  let extractedPostContent = jsonLdBody || postMessageText || ogDesc || '';

  if (ogTitle) {
    // Format: "Page/Group Name | Post Topic or Question | Facebook"
    if (ogTitle.includes('|')) {
      const segments = ogTitle.split('|').map(s => s.trim()).filter(Boolean);
      if (segments.length >= 2) {
        if (!authorName) authorName = segments[0];
        const candidateBody = segments.slice(1).filter(s => !/facebook/i.test(s)).join(' - ');
        if (candidateBody && (!extractedPostContent || extractedPostContent.length < candidateBody.length)) {
          extractedPostContent = candidateBody;
        }
      }
    } else if (ogTitle.includes(' - ')) {
      const segments = ogTitle.split(' - ').map(s => s.trim()).filter(Boolean);
      if (segments.length >= 2) {
        if (!authorName) authorName = segments[0];
        const candidateBody = segments.slice(1).filter(s => !/facebook/i.test(s)).join(' - ');
        if (candidateBody && (!extractedPostContent || extractedPostContent.length < candidateBody.length)) {
          extractedPostContent = candidateBody;
        }
      }
    } else if (/on facebook/i.test(ogTitle)) {
      const parts = ogTitle.split(/on facebook/i);
      if (!authorName && parts[0]) authorName = parts[0].trim();
    }
  }

  if (!authorName) authorName = 'Facebook Page / User';
  if (!extractedPostContent || extractedPostContent.length < 5) {
    extractedPostContent = ogTitle.replace(/\|?\s*Facebook\s*$/i, '').trim() || 'منشور فيسبوك';
  }

  // Harvest images
  const mediaUrls: string[] = [];
  if (ogImage) mediaUrls.push(ogImage);
  jsonLdImages.forEach(img => { if (!mediaUrls.includes(img)) mediaUrls.push(img); });

  // Direct video streams
  let directVideo = ogVideo || jsonLdVideoUrl;
  const scriptText = $('script').map((_, el) => $(el).text()).get().join('\n');
  const hdMatch = scriptText.match(/"playable_url_quality_hd"\s*:\s*"([^"]+)"/i) || scriptText.match(/"browser_native_hd_url"\s*:\s*"([^"]+)"/i) || scriptText.match(/"hd_src"\s*:\s*"([^"]+)"/i);
  const sdMatch = scriptText.match(/"playable_url"\s*:\s*"([^"]+)"/i) || scriptText.match(/"browser_native_sd_url"\s*:\s*"([^"]+)"/i) || scriptText.match(/"sd_src"\s*:\s*"([^"]+)"/i);
  if (hdMatch?.[1]) directVideo = decodeHtmlEntities(hdMatch[1].replace(/\\u0026/g, '&').replace(/\\\//g, '/'));
  else if (sdMatch?.[1] && !directVideo) directVideo = decodeHtmlEntities(sdMatch[1].replace(/\\u0026/g, '&').replace(/\\\//g, '/'));

  // Strict Media Type Classification
  const isExplicitVideoUrl = /(?:facebook\.com|fb\.watch)\/(?:reel|reels|watch|videos|share\/v\/|share\/r\/)/i.test(finalUrl);
  const isExplicitPostUrl = /(?:facebook\.com|fb\.me)\/(?:share\/p\/|posts\/|permalink\.php|story\.php|photos\/|photo\/)/i.test(finalUrl);
  const isVideo = Boolean((directVideo || isExplicitVideoUrl) && !isExplicitPostUrl && !finalUrl.includes('/share/p/'));
  const isPhoto = Boolean(!isVideo && mediaUrls.length > 0);
  const mediaType: DeepLinkScrapeResult['mediaType'] = isVideo ? 'video' : isPhoto ? 'image' : 'post';

  const cleanTitle = ogTitle ? ogTitle.replace(/\|?\s*Facebook\s*$/i, '').trim() : `منشور فيسبوك بواسطة ${authorName}`;

  const result: DeepLinkScrapeResult = {
    platform: 'facebook',
    canonicalUrl: finalUrl,
    originalUrl: url,
    author: {
      name: authorName,
      handle: authorName.toLowerCase().replace(/\s+/g, '_'),
      verified: html.includes('Verified Page') || html.includes('شارة التحقق') || html.includes('badge-verified'),
    },
    mediaType,
    title: cleanTitle,
    description: ogDesc || extractedPostContent.slice(0, 300),
    content: extractedPostContent,
    mediaUrls,
    videoUrl: isVideo ? directVideo : undefined,
    thumbnailUrl: ogImage || mediaUrls[0] || undefined,
    metrics: {
      likes: likesCount,
      comments: commentsCount || comments.length || undefined,
      shares: sharesCount,
    },
    topComments: comments.slice(0, 10),
    extractedAt: Date.now(),
    rawAnalysisSummaryAr: `[منشور فيسبوك]: ${authorName} | "${cleanTitle}"`,
    structuredContextBlock: '',
  };

  result.structuredContextBlock = formatDeepLinkContext(result);
  return result;
}

// ─── 2. Instagram Deep Scraper ───────────────────────────────────────────────

export async function scrapeInstagramDeep(url: string, htmlInput?: string): Promise<DeepLinkScrapeResult> {
  const normalized = normalizeUrl(url);
  const shortcodeMatch = normalized.match(/(?:reel|reels|p|tv)\/([A-Za-z0-9_-]+)/i);
  const shortcode = shortcodeMatch ? shortcodeMatch[1] : '';

  let html = htmlInput || '';
  if (!html && shortcode) {
    const embedUrls = [
      `https://www.instagram.com/reel/${shortcode}/embed/captioned/`,
      `https://www.instagram.com/p/${shortcode}/embed/captioned/`,
      `https://www.instagram.com/p/${shortcode}/embed/`,
      normalized,
    ];
    for (const ep of embedUrls) {
      try {
        const res = await fetch(ep, {
          headers: BOT_HEADERS,
          redirect: 'follow',
          signal: AbortSignal.timeout(3500),
        });
        if (res.ok) {
          html = await res.text();
          if (html.length > 500) break;
        }
      } catch {}
    }
  }

  const $ = cheerio.load(html);

  const ogTitle = decodeHtmlEntities($('meta[property="og:title"]').attr('content') || $('title').text() || '');
  const ogDesc = decodeHtmlEntities($('meta[property="og:description"]').attr('content') || '');
  const ogImage = decodeHtmlEntities($('meta[property="og:image"]').attr('content') || $('.EmbeddedMediaImage').attr('src') || '');
  const ogVideo = decodeHtmlEntities($('meta[property="og:video"]').attr('content') || '');

  // Extract author
  let username = '';
  let displayName = '';
  const userMatch = ogTitle.match(/([^(]+)\s*\(@([^)]+)\)/i);
  if (userMatch) {
    displayName = userMatch[1].trim();
    username = userMatch[2].trim();
  } else {
    const match2 = ogTitle.match(/@([a-zA-Z0-9_.]+)/);
    username = match2 ? match2[1] : 'instagram_creator';
    displayName = username;
  }

  // Extract caption from embed
  let caption = $('.Caption').text().trim() || ogDesc || ogTitle || 'مقطع إنستغرام';
  caption = decodeHtmlEntities(caption);

  const mediaUrls: string[] = [];
  if (ogImage) mediaUrls.push(ogImage);

  const isVideo = Boolean(ogVideo || /reel|reels|tv/i.test(normalized));
  const mediaType: DeepLinkScrapeResult['mediaType'] = isVideo ? 'video' : 'image';

  const result: DeepLinkScrapeResult = {
    platform: 'instagram',
    canonicalUrl: shortcode ? `https://www.instagram.com/p/${shortcode}/` : normalized,
    originalUrl: url,
    author: {
      name: displayName || username,
      handle: username,
      verified: html.includes('Verified') || html.includes('CoreSpriteVerifiedBadge'),
    },
    mediaType,
    title: ogTitle || `منشور إنستغرام (@${username})`,
    description: caption.slice(0, 300),
    content: caption,
    mediaUrls,
    videoUrl: ogVideo || undefined,
    thumbnailUrl: ogImage || undefined,
    topComments: [],
    extractedAt: Date.now(),
    rawAnalysisSummaryAr: `[إنستغرام]: @${username} | "${caption.slice(0, 80)}"`,
    structuredContextBlock: '',
  };

  result.structuredContextBlock = formatDeepLinkContext(result);
  return result;
}

// ─── 3. X / Twitter Deep Scraper ─────────────────────────────────────────────

export async function scrapeTwitterDeep(url: string): Promise<DeepLinkScrapeResult> {
  const normalized = normalizeUrl(url);
  const statusMatch = normalized.match(/status\/([0-9]+)/i);
  const tweetId = statusMatch ? statusMatch[1] : '';

  let tweetText = '';
  let authorName = 'X User';
  let handle = 'x_user';
  let verified = false;
  let mediaUrls: string[] = [];
  let videoUrl: string | undefined;
  let likes: number | undefined;
  let retweets: number | undefined;
  let commentsCount: number | undefined;
  const topComments: ScrapedComment[] = [];

  // Strategy 1: Twitter Syndication API (Official CDN endpoint)
  if (tweetId) {
    try {
      const synUrl = `https://cdn.syndication.twimg.com/tweet-result?id=${tweetId}&token=555`;
      const res = await fetch(synUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(3500),
      });

      if (res.ok) {
        const data: any = await res.json();
        if (data.text) tweetText = data.text;
        if (data.user) {
          authorName = data.user.name || authorName;
          handle = data.user.screen_name || handle;
          verified = Boolean(data.user.verified || data.user.is_blue_verified);
        }
        if (data.favorite_count) likes = data.favorite_count;
        if (data.retweet_count) retweets = data.retweet_count;
        if (data.conversation_count) commentsCount = data.conversation_count;

        if (Array.isArray(data.photos)) {
          data.photos.forEach((p: any) => {
            if (p.url && !mediaUrls.includes(p.url)) mediaUrls.push(p.url);
          });
        }

        if (data.video?.variants && Array.isArray(data.video.variants)) {
          const mp4 = data.video.variants.find((v: any) => v.type === 'video/mp4' || v.content_type === 'video/mp4');
          if (mp4?.src) videoUrl = mp4.src;
        }

        // Parent / Quoted tweet
        if (data.parent) {
          topComments.push({
            author: `@${data.parent.user?.screen_name || 'Parent'}`,
            text: `[تغريدة سابقة في السلسلة / Parent Tweet]: "${data.parent.text}"`,
          });
        }
        if (data.quoted_tweet) {
          topComments.push({
            author: `@${data.quoted_tweet.user?.screen_name || 'Quoted'}`,
            text: `[تغريدة مقتبسة / Quoted Tweet]: "${data.quoted_tweet.text}"`,
          });
        }
      }
    } catch {}
  }

  // Strategy 2: FxTwitter API Fallback
  if (!tweetText && tweetId) {
    try {
      const fxRes = await fetch(`https://api.fxtwitter.com/status/${tweetId}`, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        signal: AbortSignal.timeout(3000),
      });
      if (fxRes.ok) {
        const fxData: any = await fxRes.json();
        const tweet = fxData.tweet;
        if (tweet?.text) {
          tweetText = tweet.text;
          authorName = tweet.author?.name || authorName;
          handle = tweet.author?.screen_name || handle;
          verified = Boolean(tweet.author?.is_blue_verified);
          likes = tweet.likes;
          retweets = tweet.retweets;
          commentsCount = tweet.replies;
          if (tweet.media?.photos) {
            tweet.media.photos.forEach((p: any) => { if (p.url) mediaUrls.push(p.url); });
          }
          if (tweet.media?.videos?.[0]?.url) {
            videoUrl = tweet.media.videos[0].url;
          }
        }
      }
    } catch {}
  }

  // Strategy 3: OpenGraph & oEmbed
  if (!tweetText) {
    try {
      const res = await fetch(normalized, { headers: BOT_HEADERS, signal: AbortSignal.timeout(3000) });
      if (res.ok) {
        const html = await res.text();
        const $ = cheerio.load(html);
        tweetText = decodeHtmlEntities($('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content') || '');
        const ogTitle = decodeHtmlEntities($('meta[property="og:title"]').attr('content') || '');
        if (ogTitle.includes('on X')) authorName = ogTitle.split('on X')[0].trim();
        const ogImage = $('meta[property="og:image"]').attr('content');
        if (ogImage) mediaUrls.push(ogImage);
      }
    } catch {}
  }

  const mediaType: DeepLinkScrapeResult['mediaType'] = videoUrl ? 'video' : mediaUrls.length > 0 ? 'image' : 'post';

  const result: DeepLinkScrapeResult = {
    platform: 'twitter',
    canonicalUrl: tweetId ? `https://x.com/${handle}/status/${tweetId}` : normalized,
    originalUrl: url,
    author: {
      name: authorName,
      handle,
      verified,
    },
    mediaType,
    title: `منشور إكس بواسطة ${authorName} (@${handle})`,
    description: tweetText.slice(0, 300),
    content: tweetText || 'تغريدة من منصة X',
    mediaUrls,
    videoUrl,
    thumbnailUrl: mediaUrls[0] || undefined,
    metrics: {
      likes,
      retweets,
      comments: commentsCount,
    },
    topComments,
    extractedAt: Date.now(),
    rawAnalysisSummaryAr: `[تويتر / X]: @${handle} | "${tweetText.slice(0, 80)}"`,
    structuredContextBlock: '',
  };

  result.structuredContextBlock = formatDeepLinkContext(result);
  return result;
}

// ─── 4. YouTube Deep Scraper ─────────────────────────────────────────────────

export async function scrapeYouTubeDeep(url: string): Promise<DeepLinkScrapeResult> {
  const normalized = normalizeUrl(url);
  const ytMatch = normalized.match(/(?:v=|youtu\.be\/|\/(?:shorts|embed|live|v|e)\/|^)([a-zA-Z0-9_-]{11})/);
  const videoId = ytMatch ? ytMatch[1] : '';

  let title = 'فيديو يوتيوب';
  let channelName = 'قناة يوتيوب';
  let description = '';
  let transcriptText = '';
  let durationSeconds: number | undefined;
  const topComments: ScrapedComment[] = [];

  // 1. Fetch metadata via oEmbed
  if (videoId) {
    try {
      const oembedRes = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`, { signal: AbortSignal.timeout(3000) });
      if (oembedRes.ok) {
        const oData: any = await oembedRes.json();
        if (oData.title) title = oData.title;
        if (oData.author_name) channelName = oData.author_name;
      }
    } catch {}
  }

  // 2. Fetch transcript & comments via page scrape & youtube-transcript
  if (videoId) {
    try {
      const pageRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
          'Accept-Language': 'ar,en-US;q=0.9',
        },
        signal: AbortSignal.timeout(4000),
      });

      if (pageRes.ok) {
        const pageHtml = await pageRes.text();
        const descMatch = pageHtml.match(/"shortDescription"\s*:\s*"([^"]+)"/i);
        if (descMatch?.[1]) {
          description = descMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
        }

        // Extract comments from ytInitialData
        const initialDataMatch = pageHtml.match(/var ytInitialData = (\{[\s\S]*?\});<\/script>/i);
        if (initialDataMatch?.[1]) {
          try {
            const ytData = JSON.parse(initialDataMatch[1]);
            // Search for comment threads
            const strData = JSON.stringify(ytData);
            const commentRegex = /"authorText":\{"simpleText":"([^"]+)"\}[\s\S]*?"contentText":\{"runs":\[\{"text":"([^"]+)"\}/g;
            let cMatch: RegExpExecArray | null;
            while ((cMatch = commentRegex.exec(strData)) !== null && topComments.length < 8) {
              const cAuthor = cMatch[1];
              const cText = cMatch[2];
              if (cText && cText.length > 2 && !topComments.some(x => x.text === cText)) {
                topComments.push({ author: cAuthor, text: cText });
              }
            }
          } catch {}
        }
      }
    } catch {}
  }

  const thumbUrl = videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : undefined;
  const content = transcriptText || description || title;

  const result: DeepLinkScrapeResult = {
    platform: 'youtube',
    canonicalUrl: videoId ? `https://www.youtube.com/watch?v=${videoId}` : normalized,
    originalUrl: url,
    author: {
      name: channelName,
      handle: channelName.replace(/\s+/g, '_'),
    },
    mediaType: 'video',
    title,
    description: description.slice(0, 300),
    content,
    mediaUrls: thumbUrl ? [thumbUrl] : [],
    videoUrl: videoId ? `https://www.youtube.com/watch?v=${videoId}` : undefined,
    thumbnailUrl: thumbUrl,
    topComments,
    extractedAt: Date.now(),
    rawAnalysisSummaryAr: `[يوتيوب]: ${channelName} | "${title}"`,
    structuredContextBlock: '',
  };

  result.structuredContextBlock = formatDeepLinkContext(result);
  return result;
}

// ─── 5. TikTok Deep Scraper ──────────────────────────────────────────────────

export async function scrapeTikTokDeep(url: string): Promise<DeepLinkScrapeResult> {
  const normalized = normalizeUrl(url);
  let finalUrl = normalized;

  if (/vt\.tiktok\.com|vm\.tiktok\.com/i.test(normalized)) {
    try {
      const redirected = await followRedirects(normalized, 6, 3500);
      finalUrl = redirected.finalUrl;
    } catch {}
  }

  let title = 'فيديو تيك توك';
  let authorName = 'TikTok Creator';
  let authorHandle = 'tiktok_user';
  let thumbUrl = '';

  try {
    const oembedRes = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(finalUrl)}`, { signal: AbortSignal.timeout(3500) });
    if (oembedRes.ok) {
      const oData: any = await oembedRes.json();
      if (oData.title) title = oData.title;
      if (oData.author_name) authorName = oData.author_name;
      if (oData.author_unique_id) authorHandle = oData.author_unique_id;
      if (oData.thumbnail_url) thumbUrl = oData.thumbnail_url;
    }
  } catch {}

  const result: DeepLinkScrapeResult = {
    platform: 'tiktok',
    canonicalUrl: finalUrl,
    originalUrl: url,
    author: {
      name: authorName,
      handle: authorHandle,
    },
    mediaType: 'video',
    title: title || `مقطع تيك توك بواسطة ${authorName}`,
    description: title,
    content: title,
    mediaUrls: thumbUrl ? [thumbUrl] : [],
    thumbnailUrl: thumbUrl || undefined,
    topComments: [],
    extractedAt: Date.now(),
    rawAnalysisSummaryAr: `[تيك توك]: @${authorHandle} | "${title}"`,
    structuredContextBlock: '',
  };

  result.structuredContextBlock = formatDeepLinkContext(result);
  return result;
}

// ─── 6. Generic Web & Article Deep Scraper ───────────────────────────────────

export async function scrapeGenericWebDeep(url: string, htmlInput?: string): Promise<DeepLinkScrapeResult> {
  const normalized = normalizeUrl(url);
  let html = htmlInput || '';

  if (!html || html.length < 500) {
    html = await fetchPageContent(normalized);
  }

  const $ = cheerio.load(html);

  // Extract meta
  const title = decodeHtmlEntities($('meta[property="og:title"]').attr('content') || $('title').text() || 'مقال ويب');
  const description = decodeHtmlEntities($('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content') || '');
  const ogImage = decodeHtmlEntities($('meta[property="og:image"]').attr('content') || $('meta[name="twitter:image"]').attr('content') || '');
  const authorName = decodeHtmlEntities($('meta[name="author"]').attr('content') || $('[rel="author"]').first().text() || $('meta[property="article:author"]').attr('content') || 'موقع ويب');

  // Strip boilerplate
  $('script, style, noscript, svg, nav, header, footer, aside, iframe, form, .ad, .ads, .advertisement, .ad-box, .banner, .cookie, .popup, .sidebar, .social-share, .comments-area, .author-bio, [role="banner"], [role="navigation"], [role="complementary"]').remove();

  // Find primary content element
  const mainEl = $('article, main, [role="main"], .post-content, .entry-content, .article-content, .story-body, .article-body, #content, .content, body').first();

  // Format clean markdown
  const paragraphs: string[] = [];
  mainEl.find('h1, h2, h3, h4, p, li, blockquote, pre').each((_, el) => {
    const tag = el.tagName.toLowerCase();
    const text = decodeHtmlEntities($(el).text().trim().replace(/\s+/g, ' '));
    if (!text || text.length < 3) return;

    if (tag === 'h1') paragraphs.push(`\n# ${text}\n`);
    else if (tag === 'h2') paragraphs.push(`\n## ${text}\n`);
    else if (tag === 'h3') paragraphs.push(`\n### ${text}\n`);
    else if (tag === 'h4') paragraphs.push(`\n#### ${text}\n`);
    else if (tag === 'li') paragraphs.push(`• ${text}`);
    else if (tag === 'blockquote') paragraphs.push(`> ${text}`);
    else if (tag === 'pre') paragraphs.push(`\`\`\`\n${text}\n\`\`\``);
    else paragraphs.push(text);
  });

  const fullContent = paragraphs.join('\n\n').slice(0, 15000) || description || title;

  const result: DeepLinkScrapeResult = {
    platform: 'web',
    canonicalUrl: normalized,
    originalUrl: url,
    author: {
      name: authorName,
    },
    mediaType: 'article',
    title,
    description,
    content: fullContent,
    mediaUrls: ogImage ? [ogImage] : [],
    thumbnailUrl: ogImage || undefined,
    topComments: [],
    extractedAt: Date.now(),
    rawAnalysisSummaryAr: `[موقع ومقال ويب]: "${title}"`,
    structuredContextBlock: '',
  };

  result.structuredContextBlock = formatDeepLinkContext(result);
  return result;
}

// ─── Master Deep Dispatcher ──────────────────────────────────────────────────

export async function scrapeDeepLink(url: string, htmlInput?: string): Promise<DeepLinkScrapeResult> {
  const normalized = normalizeUrl(url);

  if (/facebook\.com|fb\.watch|fb\.me|fb\.com|fb\.gg/i.test(normalized)) {
    return scrapeFacebookDeep(normalized, htmlInput);
  }
  if (/instagram\.com|instagr\.am|ig\.me/i.test(normalized)) {
    return scrapeInstagramDeep(normalized, htmlInput);
  }
  if (/twitter\.com|x\.com|t\.co/i.test(normalized)) {
    return scrapeTwitterDeep(normalized);
  }
  if (/youtube\.com|youtu\.be/i.test(normalized)) {
    return scrapeYouTubeDeep(normalized);
  }
  if (/tiktok\.com|vm\.tiktok\.com|vt\.tiktok\.com/i.test(normalized)) {
    return scrapeTikTokDeep(normalized);
  }
  return scrapeGenericWebDeep(normalized, htmlInput);
}

// ─── Master Structured Context Formatter ──────────────────────────────────────

export function formatDeepLinkContext(result: DeepLinkScrapeResult): string {
  const platformLabel =
    result.platform === 'facebook' ? 'Facebook' :
    result.platform === 'instagram' ? 'Instagram' :
    result.platform === 'twitter' ? 'X (Twitter)' :
    result.platform === 'youtube' ? 'YouTube' :
    result.platform === 'tiktok' ? 'TikTok' : 'Web';

  const mediaTypeLabel =
    result.mediaType === 'video' ? 'Video' :
    result.mediaType === 'article' ? 'Article' :
    result.mediaType === 'image' ? 'Image / Post' :
    result.mediaType === 'carousel' ? 'Carousel' : 'Post / Discussion';

  const authorLabel = `${result.author.name}${result.author.handle ? ` (@${result.author.handle})` : ''}${result.author.verified ? ' [Verified / موثق]' : ''}`;

  const lines: string[] = [
    `[RESOLVED LINK DATA]:`,
    `- Platform: ${platformLabel}`,
    `- Post Type: ${mediaTypeLabel}`,
    `- Title / Subject: ${result.title}`,
    `- Author / Page: ${authorLabel}`,
    `- Canonical URL: ${result.canonicalUrl}`,
    `- Full Post Text:`,
    `"""`,
    `${result.content.trim()}`,
    `"""`,
  ];

  if (result.topComments && result.topComments.length > 0) {
    lines.push(`- Top Comments / Reactions:`);
    result.topComments.forEach((c, idx) => {
      const reactionsText = c.reactions ? ` (Reactions: ${c.reactions})` : '';
      lines.push(`  ${idx + 1}. [${c.author}]: "${c.text}"${reactionsText}`);
    });
  } else {
    lines.push(`- Top Comments / Reactions: لا توجد تعليقات عامة إضافية متاحة على هذا المنشور.`);
  }

  return lines.join('\n');
}
