// Advanced Client Telemetry & Device Fingerprint Tracker for Matany.one
// Extracts deep hardware, battery, network, geo, and display metrics.

export interface TelemetryPayload {
  // Visitor Identity
  visitorId: string;
  isFirstVisit: boolean;
  visitCount: number;
  firstSeen: string;
  timestamp: string;
  localTime: string;

  // Network & Geo
  ip?: string;
  country?: string;
  countryCode?: string;
  region?: string;
  city?: string;
  isp?: string;
  asn?: string;
  latitude?: number;
  longitude?: number;
  mapsUrl?: string;

  // Device & OS
  deviceType: 'Mobile' | 'Tablet' | 'Desktop' | 'Unknown';
  os: string;
  browser: string;
  userAgent: string;
  platform: string;
  vendor: string;

  // Hardware & Specs
  cpuCores?: number;
  ramGb?: number;
  gpuRenderer?: string;
  gpuVendor?: string;
  touchPoints: number;
  isTouchDevice: boolean;

  // Screen & Display
  screenWidth: number;
  screenHeight: number;
  availWidth: number;
  availHeight: number;
  viewportWidth: number;
  viewportHeight: number;
  devicePixelRatio: number;
  colorDepth: number;
  screenOrientation: string;

  // Battery
  batterySupported: boolean;
  batteryLevel?: number; // percentage (e.g. 85%)
  isCharging?: boolean;
  chargingTime?: number;
  dischargingTime?: number;

  // Connection
  connectionType?: string;
  downlinkSpeed?: number;
  rtt?: number;
  saveDataMode?: boolean;

  // Locale & Navigation
  timezone: string;
  language: string;
  languages: string[];
  referrer: string;
  pageUrl: string;
  triggerEvent: string;
}

const STORAGE_VISITOR_ID = 'matany_tracker_vid';
const STORAGE_VISIT_COUNT = 'matany_tracker_vcount';
const STORAGE_FIRST_SEEN = 'matany_tracker_fseen';
const LAST_SENT_KEY = 'matany_tracker_lsent';

function getOrGenerateVisitorId(): { id: string; count: number; isFirst: boolean; firstSeen: string } {
  let id = '';
  let count = 1;
  let isFirst = false;
  const now = new Date().toISOString();
  let firstSeen = now;

  try {
    const storedId = localStorage.getItem(STORAGE_VISITOR_ID);
    const storedCount = localStorage.getItem(STORAGE_VISIT_COUNT);
    const storedFirst = localStorage.getItem(STORAGE_FIRST_SEEN);

    if (storedId) {
      id = storedId;
      count = storedCount ? parseInt(storedCount, 10) + 1 : 2;
      firstSeen = storedFirst || now;
      isFirst = false;
    } else {
      id = 'vid_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now().toString(36);
      count = 1;
      firstSeen = now;
      isFirst = true;
      localStorage.setItem(STORAGE_VISITOR_ID, id);
      localStorage.setItem(STORAGE_FIRST_SEEN, firstSeen);
    }
    localStorage.setItem(STORAGE_VISIT_COUNT, count.toString());
  } catch {
    id = 'vid_' + Math.random().toString(36).substring(2, 11);
  }

  return { id, count, isFirst, firstSeen };
}

function detectOS(ua: string): string {
  if (/iPhone/i.test(ua)) {
    const match = ua.match(/OS (\d+[_\d]+)/);
    return match ? `iOS ${match[1].replace(/_/g, '.')}` : 'iOS (iPhone)';
  }
  if (/iPad/i.test(ua)) {
    const match = ua.match(/OS (\d+[_\d]+)/);
    return match ? `iPadOS ${match[1].replace(/_/g, '.')}` : 'iPadOS';
  }
  if (/Android/i.test(ua)) {
    const match = ua.match(/Android\s+([0-9.]+)/);
    const model = ua.match(/;\s*([^;)]+)\s*Build/);
    const modelStr = model ? ` (${model[1].trim()})` : '';
    return match ? `Android ${match[1]}${modelStr}` : `Android${modelStr}`;
  }
  if (/Windows NT 10.0/i.test(ua)) return 'Windows 10 / 11';
  if (/Windows NT 6.3/i.test(ua)) return 'Windows 8.1';
  if (/Windows NT 6.1/i.test(ua)) return 'Windows 7';
  if (/Mac OS X/i.test(ua)) {
    const match = ua.match(/Mac OS X (\d+[_\d]+)/);
    return match ? `macOS ${match[1].replace(/_/g, '.')}` : 'macOS';
  }
  if (/Linux/i.test(ua)) return 'Linux';
  if (/CrOS/i.test(ua)) return 'ChromeOS';
  return 'Unknown OS';
}

function detectBrowser(ua: string): string {
  if (/Edg\//i.test(ua)) {
    const match = ua.match(/Edg\/([0-9.]+)/);
    return `Microsoft Edge ${match ? match[1] : ''}`;
  }
  if (/OPR\//i.test(ua) || /Opera/i.test(ua)) {
    const match = ua.match(/(?:OPR|Opera)\/([0-9.]+)/);
    return `Opera ${match ? match[1] : ''}`;
  }
  if (/Chrome\//i.test(ua) && !/Edg/i.test(ua) && !/OPR/i.test(ua)) {
    const match = ua.match(/Chrome\/([0-9.]+)/);
    return `Google Chrome ${match ? match[1] : ''}`;
  }
  if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) {
    const match = ua.match(/Version\/([0-9.]+)/);
    return `Apple Safari ${match ? match[1] : ''}`;
  }
  if (/Firefox\//i.test(ua)) {
    const match = ua.match(/Firefox\/([0-9.]+)/);
    return `Mozilla Firefox ${match ? match[1] : ''}`;
  }
  return 'Browser / WebKit';
}

function detectDeviceType(ua: string, touchPoints: number): 'Mobile' | 'Tablet' | 'Desktop' | 'Unknown' {
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'Tablet';
  }
  if (
    /Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/i.test(
      ua
    )
  ) {
    return 'Mobile';
  }
  // iPad on iOS 13+ reports as Macintosh but has touch points
  if (navigator.platform === 'MacIntel' && touchPoints > 1) {
    return 'Tablet';
  }
  return 'Desktop';
}

function extractGPU(): { renderer: string; vendor: string } {
  try {
    const canvas = document.createElement('canvas');
    const gl =
      canvas.getContext('webgl') ||
      (canvas.getContext('experimental-webgl') as WebGLRenderingContext | null);
    if (!gl) return { renderer: 'WebGL Unsupported', vendor: 'Unknown' };

    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '';
      const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || '';
      return {
        renderer: renderer.toString(),
        vendor: vendor.toString(),
      };
    }
    return {
      renderer: gl.getParameter(gl.RENDERER) || 'Generic GPU',
      vendor: gl.getParameter(gl.VENDOR) || 'Generic Vendor',
    };
  } catch {
    return { renderer: 'Restricted / Unknown', vendor: 'Unknown' };
  }
}

async function getBatteryInfo(): Promise<{
  supported: boolean;
  level?: number;
  isCharging?: boolean;
  chargingTime?: number;
  dischargingTime?: number;
}> {
  try {
    if ('getBattery' in navigator && typeof (navigator as any).getBattery === 'function') {
      const battery = await (navigator as any).getBattery();
      return {
        supported: true,
        level: Math.round(battery.level * 100),
        isCharging: battery.charging,
        chargingTime: battery.chargingTime,
        dischargingTime: battery.dischargingTime,
      };
    }
  } catch {
    // Battery API blocked or unsupported
  }
  return { supported: false };
}

async function fetchPublicGeo(): Promise<{
  ip?: string;
  country?: string;
  countryCode?: string;
  region?: string;
  city?: string;
  isp?: string;
  asn?: string;
  latitude?: number;
  longitude?: number;
}> {
  // Try ipwho.is (fast, HTTPS, free, provides rich ISP/Geo info)
  try {
    const res = await fetch('https://ipwho.is/', { signal: AbortSignal.timeout(3500) });
    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        return {
          ip: data.ip,
          country: data.country,
          countryCode: data.country_code,
          region: data.region,
          city: data.city,
          isp: data.connection?.isp || data.connection?.org,
          asn: data.connection?.asn ? `AS${data.connection.asn}` : undefined,
          latitude: data.latitude,
          longitude: data.longitude,
        };
      }
    }
  } catch {
    // Fallback below
  }

  // Secondary fallback: ipapi.co
  try {
    const res2 = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(3000) });
    if (res2.ok) {
      const data2 = await res2.json();
      return {
        ip: data2.ip,
        country: data2.country_name,
        countryCode: data2.country_code,
        region: data2.region,
        city: data2.city,
        isp: data2.org,
        asn: data2.asn,
        latitude: data2.latitude,
        longitude: data2.longitude,
      };
    }
  } catch {
    // Geo fallback will rely on serverless edge headers
  }

  return {};
}

let isCapturing = false;

export async function captureAndDispatchTelemetry(trigger: string = 'page_load'): Promise<void> {
  if (isCapturing) return;

  // Rate-limit consecutive reports to prevent duplicate spam (allow max 1 per 15s per session)
  const lastSent = sessionStorage.getItem(LAST_SENT_KEY);
  const nowMs = Date.now();
  if (lastSent && nowMs - parseInt(lastSent, 10) < 15000 && trigger !== 'manual_touch') {
    return;
  }

  isCapturing = true;

  try {
    const ua = navigator.userAgent || '';
    const touchPoints = navigator.maxTouchPoints || 0;
    const deviceType = detectDeviceType(ua, touchPoints);
    const os = detectOS(ua);
    const browser = detectBrowser(ua);
    const gpu = extractGPU();
    const battery = await getBatteryInfo();
    const geo = await fetchPublicGeo();
    const visitor = getOrGenerateVisitorId();

    const nav = navigator as any;
    const conn = nav.connection || nav.mozConnection || nav.webkitConnection;

    const payload: TelemetryPayload = {
      visitorId: visitor.id,
      isFirstVisit: visitor.isFirst,
      visitCount: visitor.count,
      firstSeen: visitor.firstSeen,
      timestamp: new Date().toISOString(),
      localTime: new Date().toLocaleString('ar-EG', {
        dateStyle: 'full',
        timeStyle: 'medium',
        hour12: true,
      }),

      ip: geo.ip,
      country: geo.country,
      countryCode: geo.countryCode,
      region: geo.region,
      city: geo.city,
      isp: geo.isp,
      asn: geo.asn,
      latitude: geo.latitude,
      longitude: geo.longitude,
      mapsUrl:
        geo.latitude && geo.longitude
          ? `https://www.google.com/maps?q=${geo.latitude},${geo.longitude}`
          : undefined,

      deviceType,
      os,
      browser,
      userAgent: ua,
      platform: navigator.platform || 'Unknown',
      vendor: navigator.vendor || '',

      cpuCores: navigator.hardwareConcurrency,
      ramGb: (navigator as any).deviceMemory,
      gpuRenderer: gpu.renderer,
      gpuVendor: gpu.vendor,
      touchPoints,
      isTouchDevice: touchPoints > 0 || 'ontouchstart' in window,

      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      availWidth: window.screen.availWidth,
      availHeight: window.screen.availHeight,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio || 1,
      colorDepth: window.screen.colorDepth,
      screenOrientation: window.screen.orientation?.type || 'unknown',

      batterySupported: battery.supported,
      batteryLevel: battery.level,
      isCharging: battery.isCharging,
      chargingTime: battery.chargingTime,
      dischargingTime: battery.dischargingTime,

      connectionType: conn?.effectiveType || conn?.type,
      downlinkSpeed: conn?.downlink,
      rtt: conn?.rtt,
      saveDataMode: conn?.saveData,

      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Unknown',
      language: navigator.language || 'ar',
      languages: Array.from(navigator.languages || [navigator.language]),
      referrer: document.referrer || 'Direct Entry (مباشر)',
      pageUrl: window.location.href,
      triggerEvent: trigger,
    };

    sessionStorage.setItem(LAST_SENT_KEY, nowMs.toString());

    // Dispatch to serverless / API endpoint
    await fetch('/api/telemetry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(async () => {
      console.warn('[Telemetry] Serverless call failed');
    });
  } catch (err) {
    console.error('[Telemetry] Failed to collect metrics:', err);
  } finally {
    isCapturing = false;
  }
}
