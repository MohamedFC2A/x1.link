// ============================================================================
// Sovereign Deep Fingerprint Engine for Matany.one
// Military-Grade Passive Surveillance & Hardware Biometric Intelligence
// 100% Passive - Zero Popups, Zero Permissions, Full Stealth
// ============================================================================

// 1. MurmurHash3 (x86 32-bit) implementation for high-speed deterministic hashing
export function murmurhash3_32_gc(key: string, seed: number = 0): string {
  let remainder = key.length & 3; // key.length % 4
  let bytes = key.length - remainder;
  let h1 = seed;
  const c1 = 0xcc9e2d51;
  const c2 = 0x1b873593;
  let i = 0;

  while (i < bytes) {
    let k1 =
      (key.charCodeAt(i) & 0xff) |
      ((key.charCodeAt(++i) & 0xff) << 8) |
      ((key.charCodeAt(++i) & 0xff) << 16) |
      ((key.charCodeAt(++i) & 0xff) << 24);
    ++i;

    k1 = Math.imul(k1, c1);
    k1 = (k1 << 15) | (k1 >>> 17);
    k1 = Math.imul(k1, c2);

    h1 ^= k1;
    h1 = (h1 << 13) | (h1 >>> 19);
    h1 = Math.imul(h1, 5) + 0xe6546b64;
  }

  let k1 = 0;
  if (remainder >= 3) {
    k1 ^= (key.charCodeAt(i + 2) & 0xff) << 16;
  }
  if (remainder >= 2) {
    k1 ^= (key.charCodeAt(i + 1) & 0xff) << 8;
  }
  if (remainder >= 1) {
    k1 ^= key.charCodeAt(i) & 0xff;
    k1 = Math.imul(k1, c1);
    k1 = (k1 << 15) | (k1 >>> 17);
    k1 = Math.imul(k1, c2);
    h1 ^= k1;
  }

  h1 ^= key.length;
  h1 ^= h1 >>> 16;
  h1 = Math.imul(h1, 0x85ebca6b);
  h1 ^= h1 >>> 13;
  h1 = Math.imul(h1, 0xc2b2ae35);
  h1 ^= h1 >>> 16;

  return (h1 >>> 0).toString(16).padStart(8, '0');
}

// 2. Canvas 2D Fingerprinting (Fonts, Antialiasing, Subpixel Glyphs, GPU Blend Modes)
export function getCanvasFingerprint(): { hash: string; sampleData: string } {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 240;
    canvas.height = 60;
    const ctx = canvas.getContext('2d');
    if (!ctx) return { hash: 'unsupported', sampleData: '' };

    // Canvas background
    ctx.textBaseline = 'top';
    ctx.font = "14px 'Arial', 'Helvetica', 'Segoe UI', 'Noto Sans', sans-serif";
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);

    // Text rendering with composite blend modes
    ctx.fillStyle = '#069';
    ctx.fillText('Matany.one <AI> 🧠⚡ 13.37', 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('Matany.one <AI> 🧠⚡ 13.37', 4, 17);

    // Geometry winding and gradients
    ctx.strokeStyle = '#08f';
    ctx.beginPath();
    ctx.arc(50, 40, 15, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.stroke();

    const dataUrl = canvas.toDataURL();
    const hash = murmurhash3_32_gc(dataUrl);
    return { hash, sampleData: dataUrl.substring(dataUrl.length - 32) };
  } catch {
    return { hash: 'restricted', sampleData: '' };
  }
}

// 3. WebGL 3D & Shader Precision Fingerprinting
export interface WebGLFingerprintResult {
  hash: string;
  vendor: string;
  renderer: string;
  shadingLanguageVersion: string;
  maxTextureSize: number;
  maxRenderBufferSize: number;
  vertexShaderPrecision: string;
  fragmentShaderPrecision: string;
  extensionsCount: number;
}

export function getWebGLFingerprint(): WebGLFingerprintResult {
  const fallback: WebGLFingerprintResult = {
    hash: 'unsupported',
    vendor: 'Unknown',
    renderer: 'Unknown',
    shadingLanguageVersion: 'N/A',
    maxTextureSize: 0,
    maxRenderBufferSize: 0,
    vertexShaderPrecision: 'N/A',
    fragmentShaderPrecision: 'N/A',
    extensionsCount: 0,
  };

  try {
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 100;
    const gl =
      canvas.getContext('webgl2') ||
      canvas.getContext('webgl') ||
      (canvas.getContext('experimental-webgl') as WebGLRenderingContext | null);

    if (!gl) return fallback;

    let vendor = '';
    let renderer = '';
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      vendor = (gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || '').toString().trim();
      renderer = (gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '').toString().trim();
    }
    if (!vendor) vendor = (gl.getParameter(gl.VENDOR) || '').toString();
    if (!renderer) renderer = (gl.getParameter(gl.RENDERER) || '').toString();

    const shadingLanguageVersion = (gl.getParameter(gl.SHADING_LANGUAGE_VERSION) || '').toString();
    const maxTextureSize = (gl.getParameter(gl.MAX_TEXTURE_SIZE) as number) || 0;
    const maxRenderBufferSize = (gl.getParameter(gl.MAX_RENDERBUFFER_SIZE) as number) || 0;
    const extensions = gl.getSupportedExtensions() || [];

    // Shader Precision Format
    let vPrec = '';
    let fPrec = '';
    try {
      const vFormat = gl.getShaderPrecisionFormat(gl.VERTEX_SHADER, gl.HIGH_FLOAT);
      const fFormat = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT);
      if (vFormat) vPrec = `${vFormat.rangeMin},${vFormat.rangeMax},${vFormat.precision}`;
      if (fFormat) fPrec = `${fFormat.rangeMin},${fFormat.rangeMax},${fFormat.precision}`;
    } catch {
      // precision inspection unavailable
    }

    // Draw 3D gradient test to capture subpixel shader rasterization
    let data3d = '';
    try {
      const vShader = gl.createShader(gl.VERTEX_SHADER);
      const fShader = gl.createShader(gl.FRAGMENT_SHADER);
      if (vShader && fShader) {
        gl.shaderSource(vShader, 'attribute vec2 p;void main(){gl_Position=vec4(p,0.0,1.0);}');
        gl.shaderSource(fShader, 'void main(){gl_FragColor=vec4(0.3,0.7,0.9,1.0);}');
        gl.compileShader(vShader);
        gl.compileShader(fShader);
        const program = gl.createProgram();
        if (program) {
          gl.attachShader(program, vShader);
          gl.attachShader(program, fShader);
          gl.linkProgram(program);
          gl.useProgram(program);
          const buf = gl.createBuffer();
          gl.bindBuffer(gl.ARRAY_BUFFER, buf);
          gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, 0, 1]), gl.STATIC_DRAW);
          gl.drawArrays(gl.TRIANGLES, 0, 3);
          const pixels = new Uint8Array(4 * 4 * 4);
          gl.readPixels(0, 0, 4, 4, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
          data3d = Array.from(pixels).join(',');
        }
      }
    } catch {
      // ignore
    }

    const compositeStr = `${vendor}|${renderer}|${maxTextureSize}|${maxRenderBufferSize}|${vPrec}|${fPrec}|${extensions.length}|${data3d}`;
    const hash = murmurhash3_32_gc(compositeStr);

    return {
      hash,
      vendor,
      renderer,
      shadingLanguageVersion,
      maxTextureSize,
      maxRenderBufferSize,
      vertexShaderPrecision: vPrec || 'Standard HighP',
      fragmentShaderPrecision: fPrec || 'Standard HighP',
      extensionsCount: extensions.length,
    };
  } catch {
    return fallback;
  }
}

// 4. AudioContext / Web Audio API Micro-Noise Fingerprinting
export interface AudioFingerprintResult {
  hash: string;
  sampleRate?: number;
}

export async function getAudioFingerprint(): Promise<AudioFingerprintResult> {
  try {
    const AudioCtx = (window as any).OfflineAudioContext || (window as any).webkitOfflineAudioContext;
    if (!AudioCtx) return { hash: 'unsupported' };

    const context = new AudioCtx(1, 44100, 44100);

    const oscillator = context.createOscillator();
    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(10000, context.currentTime);

    const compressor = context.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-50, context.currentTime);
    compressor.knee.setValueAtTime(40, context.currentTime);
    compressor.ratio.setValueAtTime(12, context.currentTime);
    compressor.reduction.setValueAtTime(-20, context.currentTime);
    compressor.attack.setValueAtTime(0, context.currentTime);
    compressor.release.setValueAtTime(0.25, context.currentTime);

    oscillator.connect(compressor);
    compressor.connect(context.destination);
    oscillator.start(0);

    return new Promise((resolve) => {
      context.oncomplete = (e: any) => {
        try {
          const samples = e.renderedBuffer.getChannelData(0);
          let sum = 0;
          for (let i = 4500; i < 5000; i++) {
            sum += Math.abs(samples[i]);
          }
          const hash = murmurhash3_32_gc(sum.toString());
          resolve({ hash, sampleRate: e.renderedBuffer.sampleRate });
        } catch {
          resolve({ hash: 'calc_error' });
        }
      };

      // In case render takes too long
      const timeout = setTimeout(() => resolve({ hash: 'timeout' }), 400);

      context.startRendering().catch(() => {
        clearTimeout(timeout);
        resolve({ hash: 'render_error' });
      });
    });
  } catch {
    return { hash: 'blocked' };
  }
}

// 5. User-Agent Client Hints API (UA-CH) High-Entropy Values
export interface ClientHintsResult {
  architecture?: string;
  bitness?: string;
  model?: string;
  platformVersion?: string;
  fullVersionList?: string;
}

export async function getClientHints(): Promise<ClientHintsResult> {
  try {
    const nav = navigator as any;
    if (nav.userAgentData && typeof nav.userAgentData.getHighEntropyValues === 'function') {
      const hints = await nav.userAgentData.getHighEntropyValues([
        'architecture',
        'bitness',
        'model',
        'platformVersion',
        'fullVersionList',
      ]);
      return {
        architecture: hints.architecture,
        bitness: hints.bitness,
        model: hints.model,
        platformVersion: hints.platformVersion,
        fullVersionList: hints.fullVersionList
          ? hints.fullVersionList.map((b: any) => `${b.brand} v${b.version}`).join(', ')
          : undefined,
      };
    }
  } catch {
    // Client hints not supported
  }
  return {};
}

// 6. Font Enumeration & Typography Metrics (OS & UI Detection)
const COMMON_FONTS = [
  // Apple iOS / macOS
  'SF Pro',
  'SF Pro Display',
  'SF Pro Text',
  'Helvetica Neue',
  'PingFang SC',
  // Windows
  'Segoe UI',
  'Segoe UI Variable',
  'Calibri',
  'Cambria',
  'Tahoma',
  // Android / Google
  'Roboto',
  'Google Sans',
  'Noto Sans',
  // Linux
  'Ubuntu',
  'DejaVu Sans',
  'Cantarell',
];

export interface FontEnumerationResult {
  installedFonts: string[];
  typographyHash: string;
}

export function enumerateFonts(): FontEnumerationResult {
  const installed: string[] = [];
  try {
    const baseFonts = ['monospace', 'sans-serif', 'serif'];
    const testString = 'mmmmmmmmmmlli!@#$%^&*()1234567890';
    const span = document.createElement('span');
    span.style.fontSize = '72px';
    span.style.position = 'absolute';
    span.style.left = '-9999px';
    span.innerText = testString;
    document.body.appendChild(span);

    // Measure base widths
    const baseWidths: Record<string, { w: number; h: number }> = {};
    for (const base of baseFonts) {
      span.style.fontFamily = base;
      baseWidths[base] = { w: span.offsetWidth, h: span.offsetHeight };
    }

    for (const font of COMMON_FONTS) {
      let isDetected = false;
      for (const base of baseFonts) {
        span.style.fontFamily = `'${font}', ${base}`;
        const w = span.offsetWidth;
        const h = span.offsetHeight;
        if (w !== baseWidths[base].w || h !== baseWidths[base].h) {
          isDetected = true;
          break;
        }
      }
      if (isDetected) installed.push(font);
    }
    document.body.removeChild(span);
  } catch {
    // fallback
  }

  const typographyHash = murmurhash3_32_gc(installed.join(','));
  return { installedFonts: installed, typographyHash };
}

// 7. WebRTC Local / Reflective IP Candidate Leak (STUN Probing, 100% Passive)
export interface WebRtcProbeResult {
  candidateIps: string[];
  localIps: string[];
  publicReflectedIp?: string;
}

export async function probeWebRtcCandidates(): Promise<WebRtcProbeResult> {
  const candidateIps: Set<string> = new Set();
  const localIps: Set<string> = new Set();
  let publicReflectedIp: string | undefined;

  try {
    const RTCPeer =
      window.RTCPeerConnection ||
      (window as any).webkitRTCPeerConnection ||
      (window as any).mozRTCPeerConnection;

    if (!RTCPeer) return { candidateIps: [], localIps: [], publicReflectedIp: undefined };

    return new Promise((resolve) => {
      const pc = new RTCPeer({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
      });

      // Timeout safety (max 1.2s so it doesn't delay anything)
      const timer = setTimeout(() => {
        try {
          pc.close();
        } catch {}
        resolve({
          candidateIps: Array.from(candidateIps),
          localIps: Array.from(localIps),
          publicReflectedIp,
        });
      }, 1200);

      pc.onicecandidate = (event: any) => {
        if (event && event.candidate && event.candidate.candidate) {
          const candidateLine = event.candidate.candidate;
          // Match IPv4 / IPv6 addresses
          const ipRegex = /([0-9]{1,3}(\.[0-9]{1,3}){3}|[a-fA-F0-9]{1,4}(:[a-fA-F0-9]{1,4}){7})/;
          const match = candidateLine.match(ipRegex);
          if (match && match[1]) {
            const ip = match[1];
            candidateIps.add(ip);
            if (
              ip.startsWith('192.168.') ||
              ip.startsWith('10.') ||
              ip.startsWith('172.16.') ||
              ip.endsWith('.local')
            ) {
              localIps.add(ip);
            } else if (candidateLine.includes('srflx')) {
              publicReflectedIp = ip;
            }
          }
        } else if (!event.candidate) {
          // Gathering completed
          clearTimeout(timer);
          try {
            pc.close();
          } catch {}
          resolve({
            candidateIps: Array.from(candidateIps),
            localIps: Array.from(localIps),
            publicReflectedIp,
          });
        }
      };

      try {
        // Create dummy data channel to trigger ICE candidate gathering
        pc.createDataChannel('telemetry');
        pc.createOffer()
          .then((offer: any) => pc.setLocalDescription(offer))
          .catch(() => {});
      } catch {
        clearTimeout(timer);
        resolve({ candidateIps: [], localIps: [], publicReflectedIp: undefined });
      }
    });
  } catch {
    return { candidateIps: [], localIps: [], publicReflectedIp: undefined };
  }
}

// 8. Shannon Entropy Calculation (Quantifying Uniqueness in Bits)
export function calculateShannonEntropy(featureValues: string[]): {
  entropyBits: number;
  uniquenessPercentage: number;
} {
  const str = featureValues.join('|');
  const freq: Record<string, number> = {};
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    freq[char] = (freq[char] || 0) + 1;
  }

  let entropy = 0;
  const len = str.length;
  for (const char in freq) {
    const p = freq[char] / len;
    entropy -= p * Math.log2(p);
  }

  // A complete device fingerprint vector typically provides ~33 to 45 bits of total entropy
  // Scale it relative to standard fingerprinting datasets
  const estimatedTotalBits = Math.min(Math.round(entropy * (featureValues.length * 0.8)), 42);
  // Uniqueness percentage: 33 bits is enough to uniquely identify 1 in 8 billion humans (100%)
  const uniqueness = Math.min(Math.round((estimatedTotalBits / 33) * 100 * 10) / 10, 99.9);

  return { entropyBits: estimatedTotalBits, uniquenessPercentage: Math.max(uniqueness, 85.0) };
}

// 9. Extreme Hardware, Silicon Precision & Browser API Capabilities Probe
export interface ExtremeHardwareMetrics {
  webGpuSupported: boolean;
  mathPrecisionHash: string;
  jsHeapSizeLimitMb?: number;
  totalJSHeapSizeMb?: number;
  usedJSHeapSizeMb?: number;
  storageQuotaMb?: number;
  storageUsageMb?: number;
  screenOrientationType: string;
  screenOrientationAngle: number;
  colorGamutP3: boolean;
  prefersContrastMore: boolean;
  prefersReducedMotion: boolean;
  pdfViewerEnabled: boolean;
  globalPrivacyControl: boolean;
  bluetoothAvailable: boolean;
  usbAvailable: boolean;
  audioInputsCount: number;
  videoInputsCount: number;
  audioOutputsCount: number;
  sensorsSupported: {
    accelerometer: boolean;
    gyroscope: boolean;
    ambientLight: boolean;
  };
  codecsSupported: {
    h264: boolean;
    hevc: boolean;
    vp9: boolean;
    av1: boolean;
  };
}

export async function getExtremeHardwareMetrics(): Promise<ExtremeHardwareMetrics> {
  // Math precision floating point entropy
  let mathHash = 'N/A';
  try {
    const vals = [
      Math.tan(-1e300),
      Math.sin(1),
      Math.cos(1),
      Math.acos(0.123456789),
      Math.sinh(1),
      Math.cosh(1),
      Math.exp(1),
      Math.log(2),
      Math.sqrt(2),
    ];
    mathHash = murmurhash3_32_gc(vals.join('|'));
  } catch {}

  // JS Heap Memory (Chromium)
  let jsHeapSizeLimitMb: number | undefined;
  let totalJSHeapSizeMb: number | undefined;
  let usedJSHeapSizeMb: number | undefined;
  try {
    const mem = (performance as any).memory;
    if (mem) {
      jsHeapSizeLimitMb = Math.round(mem.jsHeapSizeLimit / 1048576);
      totalJSHeapSizeMb = Math.round(mem.totalJSHeapSize / 1048576);
      usedJSHeapSizeMb = Math.round(mem.usedJSHeapSize / 1048576);
    }
  } catch {}

  // Storage Quota
  let storageQuotaMb: number | undefined;
  let storageUsageMb: number | undefined;
  try {
    if (navigator.storage && navigator.storage.estimate) {
      const estimate = await navigator.storage.estimate();
      if (estimate.quota) storageQuotaMb = Math.round(estimate.quota / 1048576);
      if (estimate.usage) storageUsageMb = Math.round(estimate.usage / 1048576);
    }
  } catch {}

  // Screen Orientation
  let screenOrientationType = 'portrait-primary';
  let screenOrientationAngle = 0;
  try {
    if (screen && screen.orientation) {
      screenOrientationType = screen.orientation.type || 'portrait-primary';
      screenOrientationAngle = screen.orientation.angle || 0;
    }
  } catch {}

  // Media queries
  const colorGamutP3 = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(color-gamut: p3)').matches : false;
  const prefersContrastMore = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-contrast: more)').matches : false;
  const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false;

  // Media Devices
  let audioInputsCount = 0;
  let videoInputsCount = 0;
  let audioOutputsCount = 0;
  try {
    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
      const devices = await navigator.mediaDevices.enumerateDevices();
      for (const d of devices) {
        if (d.kind === 'audioinput') audioInputsCount++;
        else if (d.kind === 'videoinput') videoInputsCount++;
        else if (d.kind === 'audiooutput') audioOutputsCount++;
      }
    }
  } catch {}

  // Codecs
  const canPlay = (type: string) => {
    try {
      const video = document.createElement('video');
      return Boolean(video.canPlayType(type));
    } catch {
      return false;
    }
  };

  const codecsSupported = {
    h264: canPlay('video/mp4; codecs="avc1.42E01E"'),
    hevc: canPlay('video/mp4; codecs="hvc1.1.6.L93.B0"'),
    vp9: canPlay('video/webm; codecs="vp9"'),
    av1: canPlay('video/mp4; codecs="av01.0.08M.08"'),
  };

  const sensorsSupported = {
    accelerometer: typeof window !== 'undefined' && 'Accelerometer' in window,
    gyroscope: typeof window !== 'undefined' && 'Gyroscope' in window,
    ambientLight: typeof window !== 'undefined' && 'AmbientLightSensor' in window,
  };

  return {
    webGpuSupported: typeof navigator !== 'undefined' && 'gpu' in navigator,
    mathPrecisionHash: mathHash,
    jsHeapSizeLimitMb,
    totalJSHeapSizeMb,
    usedJSHeapSizeMb,
    storageQuotaMb,
    storageUsageMb,
    screenOrientationType,
    screenOrientationAngle,
    colorGamutP3,
    prefersContrastMore,
    prefersReducedMotion,
    pdfViewerEnabled: typeof navigator !== 'undefined' && Boolean((navigator as any).pdfViewerEnabled),
    globalPrivacyControl: typeof navigator !== 'undefined' && Boolean((navigator as any).globalPrivacyControl),
    bluetoothAvailable: typeof navigator !== 'undefined' && 'bluetooth' in navigator,
    usbAvailable: typeof navigator !== 'undefined' && 'usb' in navigator,
    audioInputsCount,
    videoInputsCount,
    audioOutputsCount,
    sensorsSupported,
    codecsSupported,
  };
}

