// Advanced Passive Client Telemetry & Device Intelligence Engine for Matany.one
// 100% Passive - Zero Popups, Zero Permissions, Extreme Accuracy.

import {
  murmurhash3_32_gc,
  getCanvasFingerprint,
  getWebGLFingerprint,
  getAudioFingerprint,
  getClientHints,
  enumerateFonts,
  probeWebRtcCandidates,
  calculateShannonEntropy,
  getExtremeHardwareMetrics,
  type ClientHintsResult,
  type AudioFingerprintResult,
  type WebRtcProbeResult,
  type ExtremeHardwareMetrics,
} from './deepFingerprintEngine';
import {
  identifyDeviceWithCertainty,
  detectSafeAreaTopInset,
  inferChipsetFromGPU,
} from './deviceIntelligenceDatabase';

export interface AdvancedTelemetryPayload {
  // Visitor Identity & Session
  visitorId: string;
  isFirstVisit: boolean;
  visitCount: number;
  firstSeen: string;
  sessionDurationSec: number;
  timestamp: string;
  localTime: string;

  // Deep Silicon & Fingerprint Hashes (100% Passive)
  masterFingerprintHash: string;
  canvasHash: string;
  webglHash: string;
  audioHash: string;
  typographyHash: string;
  shannonEntropyBits: number;
  uniquenessPercentage: number;
  detectedFonts: string[];
  webrtcLocalIps: string[];
  webrtcReflectedIp?: string;

  // High-Entropy Client Hints & WebGL Specs
  clientHintsModel?: string;
  clientHintsArch?: string;
  clientHintsBitness?: string;
  clientHintsPlatformVersion?: string;
  glVendor?: string;
  glRenderer?: string;
  glPrecision?: string;
  glExtensionsCount?: number;

  // Device & Phone Fingerprint (Mandatory Brand First -> Exact Model)
  deviceCategory: 'Mobile' | 'Tablet' | 'Desktop' | 'Unknown';
  phoneBrand: string; // e.g. "Apple", "Samsung", "Xiaomi", "Google", "OnePlus"
  phoneModel: string; // e.g. "iPhone 16 Pro Max", "Galaxy S24 Ultra"
  phoneFullName: string; // e.g. "Apple iPhone 16 Pro Max (Dynamic Island)"
  chipset?: string; // e.g. "Apple A18 Pro", "Snapdragon 8 Gen 3"
  hasDynamicIsland?: boolean;
  hasNotch?: boolean;
  safeAreaTop?: number;
  screenMatrix?: string;
  confidenceScore: number;
  detectionMethod: string;
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

  // Extreme Silicon, WebGPU & Hardware Capabilities
  webGpuSupported?: boolean;
  mathPrecisionHash?: string;
  jsHeapSizeLimitMb?: number;
  totalJSHeapSizeMb?: number;
  usedJSHeapSizeMb?: number;
  storageQuotaMb?: number;
  storageUsageMb?: number;
  screenOrientationType?: string;
  screenOrientationAngle?: number;
  colorGamutP3?: boolean;
  prefersContrastMore?: boolean;
  prefersReducedMotion?: boolean;
  pdfViewerEnabled?: boolean;
  globalPrivacyControl?: boolean;
  bluetoothAvailable?: boolean;
  usbAvailable?: boolean;
  audioInputsCount?: number;
  videoInputsCount?: number;
  audioOutputsCount?: number;
  sensorsSupported?: {
    accelerometer: boolean;
    gyroscope: boolean;
    ambientLight: boolean;
  };
  codecsSupported?: {
    h264: boolean;
    hevc: boolean;
    vp9: boolean;
    av1: boolean;
  };

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

export async function collectMaximumTelemetryPayload(trigger: string = 'page_load'): Promise<AdvancedTelemetryPayload> {
  const ua = navigator.userAgent || '';
  const touchPoints = navigator.maxTouchPoints || 0;
  const touchSupported = touchPoints > 0 || 'ontouchstart' in window;
  const visitor = getVisitorIdentity();
  const gpu = extractGPUInfo();
  const osBrowser = parseOSAndBrowser(ua);

  // Parallel deep passive hardware biometric gathering
  const [
    canvasResult,
    webglResult,
    audioResult,
    clientHints,
    fontResult,
    webrtcResult,
    hz,
    battery,
    extremeMetrics,
  ] = await Promise.all([
    Promise.resolve().then(() => getCanvasFingerprint()).catch(() => ({ hash: 'err', sampleData: '' })),
    Promise.resolve().then(() => getWebGLFingerprint()).catch(() => ({
      hash: 'err',
      vendor: 'Unknown',
      renderer: 'Unknown',
      shadingLanguageVersion: 'N/A',
      maxTextureSize: 0,
      maxRenderBufferSize: 0,
      vertexShaderPrecision: 'N/A',
      fragmentShaderPrecision: 'N/A',
      extensionsCount: 0,
    })),
    getAudioFingerprint().catch(() => ({ hash: 'err', sampleRate: undefined } as AudioFingerprintResult)),
    getClientHints().catch(() => ({} as ClientHintsResult)),
    Promise.resolve().then(() => enumerateFonts()).catch(() => ({ installedFonts: [], typographyHash: 'err' })),
    probeWebRtcCandidates().catch(() => ({ candidateIps: [], localIps: [], publicReflectedIp: undefined } as WebRtcProbeResult)),
    measureRefreshRateHz().catch(() => 60),
    extractBatteryStatus(ua),
    getExtremeHardwareMetrics().catch(() => ({
      webGpuSupported: false,
      mathPrecisionHash: 'N/A',
      screenOrientationType: 'portrait-primary',
      screenOrientationAngle: 0,
      colorGamutP3: false,
      prefersContrastMore: false,
      prefersReducedMotion: false,
      pdfViewerEnabled: false,
      globalPrivacyControl: false,
      bluetoothAvailable: false,
      usbAvailable: false,
      audioInputsCount: 0,
      videoInputsCount: 0,
      audioOutputsCount: 0,
      sensorsSupported: { accelerometer: false, gyroscope: false, ambientLight: false },
      codecsSupported: { h264: true, hevc: false, vp9: true, av1: false },
    } as ExtremeHardwareMetrics)),
  ]);

  // Deterministic Hardware & Silicon Device Profiling (Brand first -> Exact Model 100%)
  const effectiveGpu = webglResult.renderer && webglResult.renderer !== 'Unknown' ? webglResult.renderer : gpu.renderer;
  const safeAreaTop = detectSafeAreaTopInset();
  const deviceDeduction = identifyDeviceWithCertainty({
    userAgent: ua,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    devicePixelRatio: window.devicePixelRatio || 1,
    touchPoints,
    gpuRenderer: effectiveGpu,
    refreshRateHz: hz,
    clientHintsModel: clientHints.model,
    safeAreaTop,
  });

  const entropyVector = [
    canvasResult.hash,
    webglResult.hash,
    audioResult.hash,
    fontResult.typographyHash,
    extremeMetrics.mathPrecisionHash,
    window.screen.width,
    window.screen.height,
    window.screen.colorDepth,
    window.devicePixelRatio || 1,
    navigator.hardwareConcurrency || 4,
    gpu.renderer,
    gpu.vendor,
    osBrowser.osName,
    osBrowser.browserName,
    clientHints.architecture || '',
    clientHints.bitness || '',
    Intl.DateTimeFormat().resolvedOptions().timeZone || '',
  ].map(String);

  const masterFingerprintHash = murmurhash3_32_gc(entropyVector.join('::'));
  const { entropyBits, uniquenessPercentage } = calculateShannonEntropy(entropyVector);

  const nav = navigator as any;
  const conn = nav.connection || nav.mozConnection || nav.webkitConnection;

  // Display & Gamut
  const colorGamut = extremeMetrics.colorGamutP3 || window.matchMedia('(color-gamut: p3)').matches
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
  } catch {}

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

    // Deep Silicon & Fingerprint Hashes
    masterFingerprintHash,
    canvasHash: canvasResult.hash,
    webglHash: webglResult.hash,
    audioHash: audioResult.hash,
    typographyHash: fontResult.typographyHash,
    shannonEntropyBits: entropyBits,
    uniquenessPercentage,
    detectedFonts: fontResult.installedFonts,
    webrtcLocalIps: webrtcResult.localIps,
    webrtcReflectedIp: webrtcResult.publicReflectedIp,

    // High-Entropy Client Hints & WebGL Specs
    clientHintsModel: clientHints.model,
    clientHintsArch: clientHints.architecture,
    clientHintsBitness: clientHints.bitness,
    clientHintsPlatformVersion: clientHints.platformVersion,
    glVendor: webglResult.vendor,
    glRenderer: webglResult.renderer,
    glPrecision: webglResult.fragmentShaderPrecision,
    glExtensionsCount: webglResult.extensionsCount,
    deviceCategory: deviceDeduction.category,
    phoneBrand: deviceDeduction.brand,
    phoneModel: deviceDeduction.model,
    phoneFullName: deviceDeduction.fullName,
    chipset: deviceDeduction.chipset,
    hasDynamicIsland: deviceDeduction.hasDynamicIsland,
    hasNotch: deviceDeduction.hasNotch,
    safeAreaTop: deviceDeduction.safeAreaTop,
    screenMatrix: `${Math.round(window.screen.width * (window.devicePixelRatio || 1))} × ${Math.round(window.screen.height * (window.devicePixelRatio || 1))} @ ${window.devicePixelRatio || 1}x DPR`,
    confidenceScore: deviceDeduction.confidenceScore,
    detectionMethod: deviceDeduction.detectionMethod,
    osName: osBrowser.osName,
    osVersion: osBrowser.osVersion,
    browserName: osBrowser.browserName,
    browserVersion: osBrowser.browserVersion,
    architecture: clientHints.architecture || navigator.platform || 'Unknown',
    userAgent: ua,

    cpuCores: navigator.hardwareConcurrency || 4,
    ramGb: nav.deviceMemory ? `${nav.deviceMemory} GB` : 'غير مصرح بالقراءة',
    gpuRenderer: webglResult.renderer !== 'Unknown' ? webglResult.renderer : gpu.renderer,
    gpuVendor: webglResult.vendor !== 'Unknown' ? webglResult.vendor : gpu.vendor,
    gpuMaxTextureSize: webglResult.maxTextureSize || gpu.maxTexture,
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
    orientation: extremeMetrics.screenOrientationType || window.screen.orientation?.type || (window.innerHeight > window.innerWidth ? 'portrait' : 'landscape'),

    batteryState: battery.stateText,
    batteryLevelNum: battery.levelNum,
    isCharging: battery.isCharging,

    networkType: netType,
    downlinkSpeedMbps: conn?.downlink,
    rttLatencyMs: conn?.rtt,
    dataSaver: Boolean(conn?.saveData),

    audioSampleRate: audioRate || audioResult.sampleRate,
    speechVoicesCount: 'speechSynthesis' in window ? window.speechSynthesis.getVoices().length : undefined,

    // Extreme Silicon, WebGPU & Hardware Capabilities
    webGpuSupported: extremeMetrics.webGpuSupported,
    mathPrecisionHash: extremeMetrics.mathPrecisionHash,
    jsHeapSizeLimitMb: extremeMetrics.jsHeapSizeLimitMb,
    totalJSHeapSizeMb: extremeMetrics.totalJSHeapSizeMb,
    usedJSHeapSizeMb: extremeMetrics.usedJSHeapSizeMb,
    storageQuotaMb: extremeMetrics.storageQuotaMb,
    storageUsageMb: extremeMetrics.storageUsageMb,
    screenOrientationType: extremeMetrics.screenOrientationType,
    screenOrientationAngle: extremeMetrics.screenOrientationAngle,
    colorGamutP3: extremeMetrics.colorGamutP3,
    prefersContrastMore: extremeMetrics.prefersContrastMore,
    prefersReducedMotion: extremeMetrics.prefersReducedMotion,
    pdfViewerEnabled: extremeMetrics.pdfViewerEnabled,
    globalPrivacyControl: extremeMetrics.globalPrivacyControl,
    bluetoothAvailable: extremeMetrics.bluetoothAvailable,
    usbAvailable: extremeMetrics.usbAvailable,
    audioInputsCount: extremeMetrics.audioInputsCount,
    videoInputsCount: extremeMetrics.videoInputsCount,
    audioOutputsCount: extremeMetrics.audioOutputsCount,
    sensorsSupported: extremeMetrics.sensorsSupported,
    codecsSupported: extremeMetrics.codecsSupported,

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

  return payload;
}

export async function captureAndDispatchTelemetry(trigger: string = 'page_load'): Promise<void> {
  if (isCapturing) return;

  const lastSent = sessionStorage.getItem(LAST_SENT_KEY);
  const nowMs = Date.now();
  if (lastSent && nowMs - parseInt(lastSent, 10) < 8000 && trigger !== 'manual_touch') {
    return;
  }

  isCapturing = true;

  try {
    const payload = await collectMaximumTelemetryPayload(trigger);
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
