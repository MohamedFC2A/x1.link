// Advanced Passive Client Telemetry & Device Intelligence Engine for Matany.one
// 100% Passive - Zero Popups, Zero Permissions, Extreme Accuracy.

export interface AdvancedTelemetryPayload {
  // Visitor Identity & Session
  visitorId: string;
  isFirstVisit: boolean;
  visitCount: number;
  firstSeen: string;
  sessionDurationSec: number;
  timestamp: string;
  localTime: string;

  // Device & Phone Fingerprint
  deviceCategory: 'Mobile' | 'Tablet' | 'Desktop' | 'Unknown';
  phoneModel: string; // e.g., "iPhone 15 Pro Max", "Samsung Galaxy S24 Ultra"
  osName: string;
  osVersion: string;
  browserName: string;
  browserVersion: string;
  architecture: string;
  userAgent: string;

  // Hardware & Silicon Specs
  cpuCores: number;
  ramGb: number | string;
  gpuRenderer: string;
  gpuVendor: string;
  gpuMaxTextureSize: number;
  colorGamut: string; // "Display P3 (Wide Color)" or "sRGB"
  hdrSupported: boolean;
  refreshRateHz?: number; // 60, 90, 120Hz (ProMotion)
  touchPoints: number;
  touchSupported: boolean;

  // Screen & Display Matrix
  physicalResolution: string; // e.g. "1290 x 2796 (Physical)"
  cssResolution: string; // e.g. "430 x 932 (CSS Viewport)"
  windowSize: string; // e.g. "430 x 850"
  devicePixelRatio: number;
  colorDepth: number;
  orientation: string;

  // Battery Status
  batteryState: string; // e.g. "87% ⚡ متصل بالشاحن" or informative OS status
  batteryLevelNum?: number;
  isCharging?: boolean;

  // Network & Connectivity
  networkType: string; // "5G / 4G Fast", "Wi-Fi", etc.
  downlinkSpeedMbps?: number;
  rttLatencyMs?: number;
  dataSaver: boolean;

  // Audio & Media Fingerprint
  audioSampleRate?: number;
  speechVoicesCount?: number;

  // Navigation & Environment
  timezone: string;
  timezoneOffsetHours: number;
  preferredLanguage: string;
  allLanguages: string[];
  themePreference: 'Dark Mode' | 'Light Mode';
  cookiesEnabled: boolean;
  localStorageSupported: boolean;
  referrer: string;
  pageUrl: string;
  triggerEvent: string;
}

const STORAGE_VISITOR_ID = 'matany_tracker_vid';
const STORAGE_VISIT_COUNT = 'matany_tracker_vcount';
const STORAGE_FIRST_SEEN = 'matany_tracker_fseen';
const LAST_SENT_KEY = 'matany_tracker_lsent';
const SESSION_START_KEY = 'matany_tracker_sstart';

if (!sessionStorage.getItem(SESSION_START_KEY)) {
  sessionStorage.setItem(SESSION_START_KEY, Date.now().toString());
}

function getVisitorIdentity(): { id: string; count: number; isFirst: boolean; firstSeen: string; duration: number } {
  let id = '';
  let count = 1;
  let isFirst = false;
  const nowIso = new Date().toISOString();
  let firstSeen = nowIso;

  try {
    const storedId = localStorage.getItem(STORAGE_VISITOR_ID);
    const storedCount = localStorage.getItem(STORAGE_VISIT_COUNT);
    const storedFirst = localStorage.getItem(STORAGE_FIRST_SEEN);

    if (storedId) {
      id = storedId;
      count = storedCount ? parseInt(storedCount, 10) + 1 : 2;
      firstSeen = storedFirst || nowIso;
      isFirst = false;
    } else {
      id = 'vid_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now().toString(36);
      count = 1;
      firstSeen = nowIso;
      isFirst = true;
      localStorage.setItem(STORAGE_VISITOR_ID, id);
      localStorage.setItem(STORAGE_FIRST_SEEN, firstSeen);
    }
    localStorage.setItem(STORAGE_VISIT_COUNT, count.toString());
  } catch {
    id = 'vid_' + Math.random().toString(36).substring(2, 11);
  }

  const sStart = parseInt(sessionStorage.getItem(SESSION_START_KEY) || Date.now().toString(), 10);
  const duration = Math.round((Date.now() - sStart) / 1000);

  return { id, count, isFirst, firstSeen, duration };
}

// Deep deduction of phone model without permissions
function deducePrecisePhoneModel(
  ua: string,
  width: number,
  height: number,
  dpr: number,
  touchPoints: number,
  gpu: string
): { model: string; category: 'Mobile' | 'Tablet' | 'Desktop' | 'Unknown' } {
  const minDim = Math.min(width, height);
  const maxDim = Math.max(width, height);
  const physW = Math.round(minDim * dpr);
  const physH = Math.round(maxDim * dpr);

  const isIOS = /iPhone|iPad|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && touchPoints > 1);
  const isAndroid = /Android/i.test(ua);

  // 1. Apple iPhones & iPads
  if (isIOS) {
    if (touchPoints > 1 && (minDim >= 740 || maxDim >= 1024)) {
      // iPad family
      if (physW === 2048 && physH === 2732) return { model: 'Apple iPad Pro 12.9" (Liquid Retina XDR)', category: 'Tablet' };
      if (physW === 1668 && physH === 2388) return { model: 'Apple iPad Pro 11" (ProMotion 120Hz)', category: 'Tablet' };
      if (physW === 1640 && physH === 2360) return { model: 'Apple iPad Air (M1/M2) / iPad 10th Gen', category: 'Tablet' };
      if (physW === 1620 && physH === 2160) return { model: 'Apple iPad 9th / 8th Gen (10.2")', category: 'Tablet' };
      if (physW === 1488 && physH === 2266) return { model: 'Apple iPad mini 6th Gen', category: 'Tablet' };
      return { model: 'Apple iPad Tablet', category: 'Tablet' };
    }

    // iPhone identification by exact native physical matrix & aspect
    if (physW === 1320 && physH === 2868) return { model: 'Apple iPhone 16 Pro Max (Dynamic Island)', category: 'Mobile' };
    if (physW === 1206 && physH === 2622) return { model: 'Apple iPhone 16 Pro (Dynamic Island)', category: 'Mobile' };
    if (physW === 1290 && physH === 2796) {
      if (gpu.includes('Apple GPU') && dpr === 3) return { model: 'Apple iPhone 15 Pro Max / 14 Pro Max / 16 Plus', category: 'Mobile' };
      return { model: 'Apple iPhone 15 Plus / 14 Pro Max', category: 'Mobile' };
    }
    if (physW === 1179 && physH === 2556) {
      return { model: 'Apple iPhone 16 / 15 / 15 Pro / 14 Pro', category: 'Mobile' };
    }
    if (physW === 1284 && physH === 2778) return { model: 'Apple iPhone 14 Plus / 13 Pro Max / 12 Pro Max', category: 'Mobile' };
    if (physW === 1170 && physH === 2532) return { model: 'Apple iPhone 14 / 13 / 13 Pro / 12 / 12 Pro', category: 'Mobile' };
    if (physW === 1080 && physH === 2340) return { model: 'Apple iPhone 13 mini / 12 mini', category: 'Mobile' };
    if (physW === 1242 && physH === 2688) return { model: 'Apple iPhone 11 Pro Max / XS Max', category: 'Mobile' };
    if (physW === 1125 && physH === 2436) return { model: 'Apple iPhone 11 Pro / XS / X', category: 'Mobile' };
    if (physW === 828 && physH === 1792) return { model: 'Apple iPhone 11 / XR (Liquid Retina)', category: 'Mobile' };
    if (physW === 750 && physH === 1334) return { model: 'Apple iPhone SE (2nd/3rd Gen) / iPhone 8/7', category: 'Mobile' };
    if (physW === 1080 && physH === 1920) return { model: 'Apple iPhone 8 Plus / 7 Plus / 6s Plus', category: 'Mobile' };

    return { model: `Apple iPhone (${minDim}x${maxDim} @ ${dpr}x)`, category: 'Mobile' };
  }

  // 2. Android Devices (Samsung, Xiaomi, Pixel, Oppo, Vivo, Huawei, etc.)
  if (isAndroid) {
    const isTablet = /Tablet/i.test(ua) || (minDim >= 600 && touchPoints > 1);
    const category: 'Mobile' | 'Tablet' = isTablet ? 'Tablet' : 'Mobile';

    // Parse model string from UA: e.g. "Linux; Android 14; SM-S928B Build/..."
    const androidMatch = ua.match(/Android\s+([0-9.]+)?;\s*([^;)]+)\s*(?:Build|[;)])/i);
    let rawModel = androidMatch && androidMatch[2] ? androidMatch[2].trim() : '';

    if (rawModel) {
      // Samsung Mapping
      if (/SM-S928/i.test(rawModel)) return { model: 'Samsung Galaxy S24 Ultra (Snapdragon 8 Gen 3)', category };
      if (/SM-S926/i.test(rawModel)) return { model: 'Samsung Galaxy S24+ (Galaxy AI)', category };
      if (/SM-S921/i.test(rawModel)) return { model: 'Samsung Galaxy S24', category };
      if (/SM-S918/i.test(rawModel)) return { model: 'Samsung Galaxy S23 Ultra (200MP Camera)', category };
      if (/SM-S916/i.test(rawModel)) return { model: 'Samsung Galaxy S23+', category };
      if (/SM-S911/i.test(rawModel)) return { model: 'Samsung Galaxy S23', category };
      if (/SM-S908/i.test(rawModel)) return { model: 'Samsung Galaxy S22 Ultra', category };
      if (/SM-G998/i.test(rawModel)) return { model: 'Samsung Galaxy S21 Ultra 5G', category };
      if (/SM-G991/i.test(rawModel)) return { model: 'Samsung Galaxy S21 5G', category };
      if (/SM-F946/i.test(rawModel)) return { model: 'Samsung Galaxy Z Fold 5 (Foldable)', category };
      if (/SM-F731/i.test(rawModel)) return { model: 'Samsung Galaxy Z Flip 5 (Foldable)', category };
      if (/SM-A546/i.test(rawModel)) return { model: 'Samsung Galaxy A54 5G', category };
      if (/SM-A536/i.test(rawModel)) return { model: 'Samsung Galaxy A53 5G', category };
      if (/SM-A346/i.test(rawModel)) return { model: 'Samsung Galaxy A34 5G', category };
      if (/SM-A245/i.test(rawModel)) return { model: 'Samsung Galaxy A24', category };
      if (/SM-A145/i.test(rawModel) || /SM-A146/i.test(rawModel)) return { model: 'Samsung Galaxy A14 5G', category };

      // Google Pixel
      if (/Pixel 8 Pro/i.test(rawModel)) return { model: 'Google Pixel 8 Pro (Google Tensor G3)', category };
      if (/Pixel 8/i.test(rawModel)) return { model: 'Google Pixel 8', category };
      if (/Pixel 7 Pro/i.test(rawModel)) return { model: 'Google Pixel 7 Pro (Google Tensor G2)', category };
      if (/Pixel 7/i.test(rawModel)) return { model: 'Google Pixel 7', category };
      if (/Pixel 6 Pro/i.test(rawModel)) return { model: 'Google Pixel 6 Pro', category };
      if (/Pixel 6/i.test(rawModel)) return { model: 'Google Pixel 6', category };

      // Xiaomi / Redmi / Poco
      if (/Redmi/i.test(rawModel)) return { model: `Xiaomi ${rawModel}`, category };
      if (/POCO/i.test(rawModel)) return { model: `Poco ${rawModel}`, category };
      if (/2[23][0-9]{2}[0-9A-Z]+/i.test(rawModel)) return { model: `Xiaomi Device (${rawModel})`, category };

      // Oppo / Vivo / Realme / OnePlus
      if (/CPH\d+/i.test(rawModel)) return { model: `Oppo Smartphone (${rawModel})`, category };
      if (/V2\d+/i.test(rawModel)) return { model: `Vivo Smartphone (${rawModel})`, category };
      if (/RMX\d+/i.test(rawModel)) return { model: `Realme Smartphone (${rawModel})`, category };
      if (/OnePlus/i.test(rawModel) || /NE22\d+/i.test(rawModel)) return { model: `OnePlus Device (${rawModel})`, category };
      if (/Infinix/i.test(rawModel) || /X\d{3,}/i.test(rawModel)) return { model: `Infinix (${rawModel})`, category };
      if (/TECNO/i.test(rawModel)) return { model: `Tecno (${rawModel})`, category };

      return { model: `Android Smartphone (${rawModel})`, category };
    }

    return { model: `Android Device (${minDim}x${maxDim} @ ${dpr}x)`, category };
  }

  // 3. Desktop Systems
  if (/Mac OS X/i.test(ua)) {
    const isAppleSilicon = gpu.includes('Apple M') || gpu.includes('Apple GPU') || (touchPoints === 0 && dpr >= 2);
    const chipDesc = isAppleSilicon ? ' (Apple Silicon M-Series)' : ' (Intel Core)';
    return { model: `Apple Mac / MacBook${chipDesc}`, category: 'Desktop' };
  }
  if (/Windows/i.test(ua)) {
    return { model: 'Windows PC (Desktop/Laptop)', category: 'Desktop' };
  }
  if (/Linux/i.test(ua)) {
    return { model: 'Linux PC / Workstation', category: 'Desktop' };
  }
  if (/CrOS/i.test(ua)) {
    return { model: 'Google Chromebook (ChromeOS)', category: 'Desktop' };
  }

  return { model: 'جهاز مكتبي أو هاتف غير مصنف', category: 'Unknown' };
}

function parseOSAndBrowser(ua: string): { osName: string; osVersion: string; browserName: string; browserVersion: string } {
  let osName = 'غير معروف';
  let osVersion = '';
  let browserName = 'متصفح ويب';
  let browserVersion = '';

  // OS
  if (/iPhone/i.test(ua)) {
    osName = 'iOS (iPhone)';
    const m = ua.match(/OS (\d+[_\d]+)/);
    osVersion = m ? m[1].replace(/_/g, '.') : '';
  } else if (/iPad/i.test(ua)) {
    osName = 'iPadOS (iPad)';
    const m = ua.match(/OS (\d+[_\d]+)/);
    osVersion = m ? m[1].replace(/_/g, '.') : '';
  } else if (/Android/i.test(ua)) {
    osName = 'Android OS';
    const m = ua.match(/Android\s+([0-9.]+)/);
    osVersion = m ? m[1] : '';
  } else if (/Windows NT 10.0/i.test(ua)) {
    osName = 'Windows';
    osVersion = '10 / 11 (64-bit)';
  } else if (/Windows NT 6.3/i.test(ua)) {
    osName = 'Windows';
    osVersion = '8.1';
  } else if (/Windows NT 6.1/i.test(ua)) {
    osName = 'Windows';
    osVersion = '7';
  } else if (/Mac OS X/i.test(ua)) {
    osName = 'macOS';
    const m = ua.match(/Mac OS X (\d+[_\d]+)/);
    osVersion = m ? m[1].replace(/_/g, '.') : '';
  } else if (/Linux/i.test(ua)) {
    osName = 'GNU/Linux';
    osVersion = 'x86_64';
  }

  // Browser
  if (/SamsungBrowser\/([0-9.]+)/i.test(ua)) {
    browserName = 'Samsung Internet';
    browserVersion = ua.match(/SamsungBrowser\/([0-9.]+)/i)?.[1] || '';
  } else if (/Edg\/([0-9.]+)/i.test(ua)) {
    browserName = 'Microsoft Edge';
    browserVersion = ua.match(/Edg\/([0-9.]+)/i)?.[1] || '';
  } else if (/OPR\/([0-9.]+)/i.test(ua) || /Opera/i.test(ua)) {
    browserName = 'Opera Browser';
    browserVersion = ua.match(/(?:OPR|Opera)\/([0-9.]+)/i)?.[1] || '';
  } else if (/Chrome\/([0-9.]+)/i.test(ua)) {
    browserName = 'Google Chrome';
    browserVersion = ua.match(/Chrome\/([0-9.]+)/i)?.[1] || '';
  } else if (/Firefox\/([0-9.]+)/i.test(ua)) {
    browserName = 'Mozilla Firefox';
    browserVersion = ua.match(/Firefox\/([0-9.]+)/i)?.[1] || '';
  } else if (/Safari\/([0-9.]+)/i.test(ua) && !/Chrome/i.test(ua)) {
    browserName = 'Apple Safari';
    browserVersion = ua.match(/Version\/([0-9.]+)/i)?.[1] || '';
  }

  return { osName, osVersion, browserName, browserVersion };
}

function extractGPUInfo(): { renderer: string; vendor: string; maxTexture: number } {
  try {
    const canvas = document.createElement('canvas');
    const gl =
      canvas.getContext('webgl2') ||
      canvas.getContext('webgl') ||
      (canvas.getContext('experimental-webgl') as WebGLRenderingContext | null);

    if (!gl) return { renderer: 'غير مدعوم في المتصفح', vendor: 'غير معروف', maxTexture: 0 };

    const maxTexture = gl.getParameter(gl.MAX_TEXTURE_SIZE) || 4096;
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');

    if (debugInfo) {
      const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '';
      const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || '';
      return {
        renderer: renderer.toString().trim(),
        vendor: vendor.toString().trim(),
        maxTexture,
      };
    }

    return {
      renderer: (gl.getParameter(gl.RENDERER) || 'Generic GPU').toString(),
      vendor: (gl.getParameter(gl.VENDOR) || 'Generic Vendor').toString(),
      maxTexture,
    };
  } catch {
    return { renderer: 'محمي أو غير متاح', vendor: 'غير معروف', maxTexture: 0 };
  }
}

// Measure display frame rate (60Hz vs 90Hz vs 120Hz ProMotion)
async function measureRefreshRateHz(): Promise<number> {
  return new Promise((resolve) => {
    let frames = 0;
    const startTime = performance.now();

    function step() {
      frames++;
      if (frames >= 12) {
        const elapsed = performance.now() - startTime;
        const fps = Math.round((frames / elapsed) * 1000);
        // Normalize to common displays
        if (fps > 105) resolve(120);
        else if (fps > 75) resolve(90);
        else if (fps > 50) resolve(60);
        else resolve(fps);
      } else {
        requestAnimationFrame(step);
      }
    }
    requestAnimationFrame(step);

    // Timeout safety
    setTimeout(() => resolve(60), 300);
  });
}

// Battery acquisition with descriptive breakdown
async function extractBatteryStatus(ua: string): Promise<{
  stateText: string;
  levelNum?: number;
  isCharging?: boolean;
}> {
  // Apple iOS Safari deliberately removes Battery API for privacy
  if (/iPhone|iPad|iPod/i.test(ua)) {
    return { stateText: 'محجوبة في نظام Apple iOS لحماية الخصوصية' };
  }

  try {
    if ('getBattery' in navigator && typeof (navigator as any).getBattery === 'function') {
      const battery = await (navigator as any).getBattery();
      const level = Math.round(battery.level * 100);
      const isCharging = Boolean(battery.charging);

      // Visual battery bar
      const filledBars = Math.round(level / 10);
      const emptyBars = 10 - filledBars;
      const bar = '█'.repeat(filledBars) + '░'.repeat(emptyBars);

      const chargeLabel = isCharging ? '⚡ متصل بالشاحن (Charging)' : '🔋 يعمل على البطارية (Discharging)';
      const stateText = `[${bar}] ${level}% — ${chargeLabel}`;

      return { stateText, levelNum: level, isCharging };
    }
  } catch {
    // blocked
  }

  return { stateText: 'غير متاحة في إعدادات هذا المتصفح' };
}

let isCapturing = false;

export async function captureAndDispatchTelemetry(trigger: string = 'page_load'): Promise<void> {
  if (isCapturing) return;

  const lastSent = sessionStorage.getItem(LAST_SENT_KEY);
  const nowMs = Date.now();
  if (lastSent && nowMs - parseInt(lastSent, 10) < 8000 && trigger !== 'manual_touch') {
    return;
  }

  isCapturing = true;

  try {
    const ua = navigator.userAgent || '';
    const touchPoints = navigator.maxTouchPoints || 0;
    const touchSupported = touchPoints > 0 || 'ontouchstart' in window;
    const visitor = getVisitorIdentity();
    const gpu = extractGPUInfo();
    const osBrowser = parseOSAndBrowser(ua);
    const phoneDeduction = deducePrecisePhoneModel(
      ua,
      window.screen.width,
      window.screen.height,
      window.devicePixelRatio || 1,
      touchPoints,
      gpu.renderer
    );

    const [hz, battery] = await Promise.all([
      measureRefreshRateHz().catch(() => 60),
      extractBatteryStatus(ua),
    ]);

    const nav = navigator as any;
    const conn = nav.connection || nav.mozConnection || nav.webkitConnection;

    // Display & Gamut
    const colorGamut = window.matchMedia('(color-gamut: p3)').matches
      ? 'Display P3 (Wide Color Gamut فائق الألوان)'
      : 'sRGB القياسي';
    const hdrSupported = window.matchMedia('(dynamic-range: high)').matches;
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    // Network description
    let netType = 'غير محدد';
    if (conn) {
      const type = conn.effectiveType || conn.type || '';
      if (type === '4g' && (conn.downlink || 0) > 20) netType = '5G / 4G فائقة السرعة';
      else if (type === '4g') netType = '4G LTE';
      else if (type === 'wifi') netType = 'Wi-Fi شبكة لاسلكية';
      else if (type) netType = type.toUpperCase();
    }

    // Audio sample rate
    let audioRate: number | undefined;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        audioRate = ctx.sampleRate;
        ctx.close().catch(() => {});
      }
    } catch {
      // ignore
    }

    const payload: AdvancedTelemetryPayload = {
      visitorId: visitor.id,
      isFirstVisit: visitor.isFirst,
      visitCount: visitor.count,
      firstSeen: visitor.firstSeen,
      sessionDurationSec: visitor.duration,
      timestamp: new Date().toISOString(),
      localTime: new Date().toLocaleString('ar-EG', {
        dateStyle: 'full',
        timeStyle: 'medium',
        hour12: true,
      }),

      deviceCategory: phoneDeduction.category,
      phoneModel: phoneDeduction.model,
      osName: osBrowser.osName,
      osVersion: osBrowser.osVersion,
      browserName: osBrowser.browserName,
      browserVersion: osBrowser.browserVersion,
      architecture: navigator.platform || 'Unknown',
      userAgent: ua,

      cpuCores: navigator.hardwareConcurrency || 4,
      ramGb: nav.deviceMemory ? `${nav.deviceMemory} GB` : 'غير مصرح بالقراءة',
      gpuRenderer: gpu.renderer,
      gpuVendor: gpu.vendor,
      gpuMaxTextureSize: gpu.maxTexture,
      colorGamut,
      hdrSupported,
      refreshRateHz: hz,
      touchPoints,
      touchSupported,

      physicalResolution: `${Math.round(window.screen.width * (window.devicePixelRatio || 1))} × ${Math.round(
        window.screen.height * (window.devicePixelRatio || 1)
      )} (Physical Pixels)`,
      cssResolution: `${window.screen.width} × ${window.screen.height}`,
      windowSize: `${window.innerWidth} × ${window.innerHeight}`,
      devicePixelRatio: window.devicePixelRatio || 1,
      colorDepth: window.screen.colorDepth || 24,
      orientation: window.screen.orientation?.type || (window.innerHeight > window.innerWidth ? 'portrait' : 'landscape'),

      batteryState: battery.stateText,
      batteryLevelNum: battery.levelNum,
      isCharging: battery.isCharging,

      networkType: netType,
      downlinkSpeedMbps: conn?.downlink,
      rttLatencyMs: conn?.rtt,
      dataSaver: Boolean(conn?.saveData),

      audioSampleRate: audioRate,
      speechVoicesCount: 'speechSynthesis' in window ? window.speechSynthesis.getVoices().length : undefined,

      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Africa/Cairo',
      timezoneOffsetHours: -(new Date().getTimezoneOffset() / 60),
      preferredLanguage: navigator.language || 'ar',
      allLanguages: Array.from(navigator.languages || [navigator.language]),
      themePreference: isDark ? 'Dark Mode' : 'Light Mode',
      cookiesEnabled: navigator.cookieEnabled,
      localStorageSupported: typeof localStorage !== 'undefined',
      referrer: document.referrer || 'دخول مباشر (Direct Entry)',
      pageUrl: window.location.href,
      triggerEvent: trigger,
    };

    sessionStorage.setItem(LAST_SENT_KEY, nowMs.toString());

    // Dispatch silently to serverless telemetry endpoint
    await fetch('/api/telemetry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {});
  } catch (err) {
    console.error('[Telemetry Capture Error]:', err);
  } finally {
    isCapturing = false;
  }
}
