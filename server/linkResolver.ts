/**
 * Advanced Link Unshortener & UI Framework / Design System Profiler
 * Developed for x1.link / matany.one
 *
 * Capabilities:
 * 1. Recursive HTTP 301/302/303/307/308 redirect tracking with hop-by-hop audit
 * 2. Meta-refresh, JavaScript redirect, and Canonical tag unshortening
 * 3. Specialized handling for share.google, goo.gl, g.co, bit.ly, t.co, etc.
 * 4. Stealth headers & anti-blocking bypass (Cloudflare/WAF fallback)
 * 5. Full UI Framework detection (Next.js, React, Vue, Svelte, Angular, Astro, etc.)
 * 6. Component library detection (Tailwind, Bootstrap, MUI, Radix, Shadcn, Chakra, etc.)
 * 7. Design Style Aesthetic profiling (Glassmorphism, Neo-Brutalism, AI Minimalist, etc.)
 * 8. Automatic extraction of Logo, Favicon, OpenGraph banner, and SVG brand marks
 */

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
  mediaType?: 'video' | 'website';
  videoMetadata?: {
    videoId?: string;
    authorName?: string;
    thumbnailUrl?: string;
  };
  rawAnalysisSummaryAr: string;
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
        currentUrl = toAbsoluteUrl(location, currentUrl);
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
    const timeout = setTimeout(() => controller.abort(), 6000);
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
    const bypassTimeout = setTimeout(() => bypassController.abort(), 5000);
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

  // Check if target is a YouTube or TikTok video
  // Check if target is a Video (YouTube, TikTok, Instagram, Facebook, X/Twitter)
  const ytMatch = finalUrl.match(/(?:v=|youtu\.be\/|\/(?:shorts|embed|live|v|e)\/|^)([a-zA-Z0-9_-]{11})/);
  const isYouTube = /(?:youtube\.com|youtu\.be)\//i.test(finalUrl);
  const isTikTok = /(?:tiktok\.com|vm\.tiktok\.com|vt\.tiktok\.com)\//i.test(finalUrl);
  const isInstagram = /(?:instagram\.com|instagr\.am|ig\.me)\//i.test(finalUrl);
  const isFacebook = /(?:facebook\.com|fb\.watch|fb\.me|m\.facebook\.com)\//i.test(finalUrl);
  const isTwitter = /(?:x\.com|twitter\.com|t\.co)\//i.test(finalUrl);

  const isVideoPlatform = isYouTube || isTikTok || isInstagram || isFacebook || isTwitter;
  let mediaType: 'video' | 'website' = isVideoPlatform ? 'video' : 'website';
  let videoMetadata: { videoId?: string; authorName?: string; thumbnailUrl?: string; platform?: 'youtube' | 'tiktok' | 'instagram' | 'facebook' | 'twitter' } | undefined = undefined;

  let effectiveTitle = title;
  let effectiveDescription = description;
  let effectiveBrandAssets = brandAssets;
  let effectiveFrameworks = frameworks;

  if (isYouTube && ytMatch && ytMatch[1]) {
    const videoId = ytMatch[1];
    const thumbUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    
    let isVideoAvailable = false;
    let videoTitle = '';
    let videoAuthor = '';
    let videoDesc = '';

    // 1. Try official oEmbed (watch)
    try {
      const oembedRes = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
      if (oembedRes.ok) {
        const oembedData: any = await oembedRes.json();
        if (oembedData.title) {
          videoTitle = oembedData.title;
          videoAuthor = oembedData.author_name || 'قناة يوتيوب';
          videoDesc = `قناة: ${videoAuthor}`;
          isVideoAvailable = true;
        }
      }
    } catch {}

    // 2. Try noembed fallback
    if (!isVideoAvailable) {
      try {
        const noembedRes = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`);
        if (noembedRes.ok) {
          const noembedData: any = await noembedRes.json();
          if (noembedData.title && !noembedData.error) {
            videoTitle = noembedData.title;
            videoAuthor = noembedData.author_name || 'قناة يوتيوب';
            videoDesc = `قناة: ${videoAuthor}`;
            isVideoAvailable = true;
          }
        }
      } catch {}
    }

    // 3. Try checking HTML playabilityStatus for Shorts / age-gated / deleted videos
    if (!isVideoAvailable) {
      try {
        const pageRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Accept-Language': 'ar,en;q=0.9'
          }
        });
        if (pageRes.ok) {
          const pageHtml = await pageRes.text();
          const isErrorStatus = pageHtml.includes('"status":"ERROR"') || pageHtml.includes('الفيديو غير متاح') || pageHtml.includes('هذا الفيديو غير متوفّر');
          if (isErrorStatus) {
            videoTitle = 'فيديو غير متاح على يوتيوب (محذوف أو خاص)';
            videoAuthor = 'غير متاح';
            videoDesc = 'هذا الفيديو غير متوفر حالياً على خوادم يوتيوب (قد يكون محذوفاً، خاصاً، أو تم تغيير رابطه).';
            isVideoAvailable = false;
          } else {
            const ogTitle = pageHtml.match(/<meta\s+property=["']og:title["']\s+content=["'](.*?)["']/i)?.[1];
            if (ogTitle && !ogTitle.includes('- YouTube')) {
              videoTitle = ogTitle;
              videoAuthor = pageHtml.match(/<link\s+itemprop=["']name["']\s+content=["'](.*?)["']/i)?.[1] || 'قناة يوتيوب';
              isVideoAvailable = true;
            }
          }
        }
      } catch {}
    }

    if (!videoTitle) {
      videoTitle = 'فيديو غير متاح على يوتيوب (محذوف أو خاص)';
      videoAuthor = 'غير متاح';
      videoDesc = 'هذا الفيديو غير متوفر حالياً على خوادم يوتيوب (قد يكون محذوفاً، خاصاً، أو تم تغيير رابطه).';
    }

    effectiveTitle = videoTitle;
    effectiveDescription = videoDesc;

    videoMetadata = {
      videoId,
      authorName: videoAuthor,
      thumbnailUrl: thumbUrl,
      platform: 'youtube',
    };

    effectiveBrandAssets = {
      ...brandAssets,
      bestLogoUrl: 'https://www.youtube.com/s/desktop/f71887e1/img/favicon_144x144.png',
      favicon: 'https://www.youtube.com/s/desktop/f71887e1/img/favicon_144x144.png',
      ogImage: videoMetadata.thumbnailUrl || thumbUrl,
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
    
    try {
      const oembedRes = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(finalUrl)}`);
      if (oembedRes.ok) {
        const oembedData: any = await oembedRes.json();
        if (oembedData.title) effectiveTitle = oembedData.title;
        if (oembedData.author_name) effectiveDescription = `@${oembedData.author_unique_id || oembedData.author_name}`;
        videoMetadata = {
          videoId,
          authorName: oembedData.author_name ? `@${oembedData.author_unique_id || oembedData.author_name}` : 'TikTok Creator',
          thumbnailUrl: oembedData.thumbnail_url || brandAssets.ogImage || 'https://www.tiktok.com/favicon.ico',
          platform: 'tiktok',
        };
      }
    } catch {}

    if (!videoMetadata) {
      videoMetadata = {
        videoId,
        authorName: 'TikTok Creator',
        thumbnailUrl: brandAssets.ogImage || 'https://www.tiktok.com/favicon.ico',
        platform: 'tiktok',
      };
    }

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

    let authorName = 'Instagram Creator';
    const userMatch = title.match(/([^(]+)\s*\(@([^)]+)\)/i) || title.match(/@([a-zA-Z0-9_.]+)/);
    if (userMatch) {
      authorName = `@${userMatch[2] || userMatch[1]}`;
    }

    videoMetadata = {
      videoId,
      authorName,
      thumbnailUrl: brandAssets.ogImage || brandAssets.twitterImage || 'https://www.instagram.com/static/images/ico/favicon-192.png/68d99ba29cc8.png',
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
    const idMatch = finalUrl.match(/(?:videos|reel|watch\/\?v=)\/?([0-9]+)/i);
    const videoId = idMatch ? idMatch[1] : undefined;

    videoMetadata = {
      videoId,
      authorName: title.includes('|') ? title.split('|')[0].trim() : 'Facebook Creator',
      thumbnailUrl: brandAssets.ogImage || brandAssets.twitterImage || 'https://static.xx.fbcdn.net/rsrc.php/yT/r/a9Pl9FiAbJy.ico',
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
    const videoId = statusMatch ? statusMatch[1] : undefined;
    const userMatch = finalUrl.match(/(?:twitter\.com|x\.com)\/([a-zA-Z0-9_]+)\/status/i);
    const authorName = userMatch ? `@${userMatch[1]}` : 'X User';

    videoMetadata = {
      videoId,
      authorName,
      thumbnailUrl: brandAssets.twitterImage || brandAssets.ogImage || 'https://abs.twimg.com/favicons/twitter.3.ico',
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
- نوع المحتوى: ${isYouTube ? 'فيديو يوتيوب (YouTube Video)' : (isTikTok ? 'فيديو تيك توك (TikTok Video)' : 'موقع ويب / منصة')}
- مسار إعادة التوجيه (${chain.length} قفزات):
${chainText}
- الرابط الأصلي والنهائي (Final Resolved URL): ${finalUrl}
- الرابط المعياري (Canonical URL): ${canonicalUrl || finalUrl}
- عنوان المحتوى (Title): ${effectiveTitle}
- الوصف (Description): ${effectiveDescription || 'غير متوفر'}
- الشعار والأصول البصرية (Brand Assets):
  * الشعار الأساسي / Thumbnail: ${effectiveBrandAssets.bestLogoUrl || 'غير محدد'}
  * Favicon: ${effectiveBrandAssets.favicon || 'غير محدد'}
${(!isYouTube && !isTikTok) ? `- أطر العمل المكتشفة (Detected Frameworks):
  * واجهة المستخدم الأساسية: ${effectiveFrameworks.coreFramework.join(', ') || 'Custom Vanilla / Server Rendered'}
  * مكتبات المكونات والتنسيق: ${effectiveFrameworks.componentLibraries.join(', ') || 'Custom CSS Tokens'}
  * الأيقونات والحركات: ${effectiveFrameworks.iconsAndAnimations.join(', ') || 'Inline SVG'}
  * إدارة الحالة والبيانات: ${effectiveFrameworks.stateAndDataFetching.join(', ') || 'Native React/DOM State'}
  * البنية التحتية والشبكة: ${effectiveFrameworks.infrastructure.join(', ') || 'Edge Server / CDN'}` : ''}
`.trim();

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
    videoMetadata,
    rawAnalysisSummaryAr,
  };

  serverLinkCache.set(normalized, {
    data: result,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });

  return result;
}
