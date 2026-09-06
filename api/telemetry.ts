// Sovereign Intelligence Telemetry Dispatcher for Matany.one
// 100% Passive - Extreme Geolocation, Hardware, and Device Fingerprinting to Telegram @sosai1_bot

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8505397370:AAHaWajm8k0TFBafpkiHPsQQ4dSk4KITt7U';
const PRIMARY_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '8495121463';

export const config = {
  runtime: 'edge',
};
export const runtime = 'edge';
export const maxDuration = 30;

function escapeHtml(str: string | number | undefined | null): string {
  if (str === undefined || str === null || str === '') return 'غير متوفر';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const ARABIC_COUNTRIES: Record<string, string> = {
  EG: 'مصر 🇪🇬',
  SA: 'المملكة العربية السعودية 🇸🇦',
  AE: 'الإمارات العربية المتحدة 🇦🇪',
  KW: 'الكويت 🇰🇼',
  QA: 'قطر 🇶🇦',
  OM: 'سلطنة عمان 🇴🇲',
  BH: 'البحرين 🇧🇭',
  JO: 'الأردن 🇯🇴',
  IQ: 'العراق 🇮🇶',
  SY: 'سوريا 🇸🇾',
  LB: 'لبنان 🇱🇧',
  PS: 'فلسطين 🇵🇸',
  YE: 'اليمن 🇾🇪',
  LY: 'ليبيا 🇱🇾',
  SD: 'السودان 🇸🇩',
  MA: 'المغرب 🇲🇦',
  DZ: 'الجزائر 🇩🇿',
  TN: 'تونس 🇹🇳',
  TR: 'تركيا 🇹🇷',
  US: 'الولايات المتحدة الأمريكية 🇺🇸',
  GB: 'المملكة المتحدة (بريطانيا) 🇬🇧',
  DE: 'ألمانيا 🇩🇪',
  FR: 'فرنسا 🇫🇷',
  IT: 'إيطاليا 🇮🇹',
  ES: 'إسبانيا 🇪🇸',
  CA: 'كندا 🇨🇦',
  AU: 'أستراليا 🇦🇺',
  RU: 'روسيا 🇷🇺',
  CN: 'الصين 🇨🇳',
  NL: 'هولندا 🇳🇱',
  SE: 'السويد 🇸🇪',
  CH: 'سويسرا 🇨🇭',
};

function formatCountryName(code: string | undefined, fallback: string | undefined): string {
  if (!code && !fallback) return 'غير محدد';
  const upper = (code || '').toUpperCase();
  if (ARABIC_COUNTRIES[upper]) return ARABIC_COUNTRIES[upper];
  try {
    const intlName = new Intl.DisplayNames(['ar'], { type: 'region' }).of(upper);
    if (intlName) return `${intlName} (${upper})`;
  } catch {
    // fallback
  }
  return fallback || code || 'غير محدد';
}

interface ServerGeo {
  country?: string;
  countryCode?: string;
  region?: string;
  city?: string;
  district?: string;
  zip?: string;
  lat?: number;
  lon?: number;
  timezone?: string;
  isp?: string;
  org?: string;
  as?: string;
  isMobile?: boolean;
  isProxy?: boolean;
  isHosting?: boolean;
}

async function resolveServerGeo(ip: string): Promise<ServerGeo> {
  // Ignore local / loopback IPs
  if (!ip || ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
    return {};
  }

  try {
    const res = await fetch(
      `http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,regionName,city,district,zip,lat,lon,timezone,isp,org,as,mobile,proxy,hosting`,
      { signal: AbortSignal.timeout(3500) }
    );
    if (res.ok) {
      const data = await res.json();
      if (data.status === 'success') {
        return {
          country: data.country,
          countryCode: data.countryCode,
          region: data.regionName,
          city: data.city,
          district: data.district,
          zip: data.zip,
          lat: data.lat,
          lon: data.lon,
          timezone: data.timezone,
          isp: data.isp,
          org: data.org,
          as: data.as,
          isMobile: Boolean(data.mobile),
          isProxy: Boolean(data.proxy),
          isHosting: Boolean(data.hosting),
        };
      }
    }
  } catch (err) {
    console.error('[Telemetry] Server Geo Lookup error:', err);
  }

  return {};
}

export default async function handler(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: corsHeaders,
    });
  }

  try {
    const clientData = await req.json().catch(() => ({}));

    // 1. Precise IP Extraction from Edge & Proxy Headers
    const cfIp = req.headers.get('cf-connecting-ip');
    const trueClientIp = req.headers.get('true-client-ip');
    const xRealIp = req.headers.get('x-real-ip');
    const xForwardedFor = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
    const finalIp = cfIp || trueClientIp || xRealIp || xForwardedFor || 'غير متاح';

    // 2. Cloudflare & Vercel Edge Geography
    const cfCountry = req.headers.get('cf-ipcountry');
    const cfRay = req.headers.get('cf-ray'); // Data center code (e.g. CAI, RUH, FRA)
    const vercelCountry = req.headers.get('x-vercel-ip-country');
    const vercelCity = req.headers.get('x-vercel-ip-city');
    const vercelRegion = req.headers.get('x-vercel-ip-country-region');
    const vercelLat = req.headers.get('x-vercel-ip-latitude');
    const vercelLon = req.headers.get('x-vercel-ip-longitude');
    const vercelTz = req.headers.get('x-vercel-ip-timezone');
    const reqUserAgent = req.headers.get('user-agent') || clientData.userAgent;
    const reqReferer = req.headers.get('referer') || clientData.referrer;

    // 3. Deep Server-side IP Geolocation Resolution
    const serverGeo = await resolveServerGeo(finalIp);

    const countryCode = (cfCountry || serverGeo.countryCode || vercelCountry || '') as string;
    const countryName = formatCountryName(countryCode || undefined, (serverGeo.country || vercelCountry || undefined) || undefined);
    const cityName = serverGeo.city || (vercelCity ? decodeURIComponent(vercelCity) : 'غير محدد');
    const regionName = serverGeo.region || (vercelRegion ? decodeURIComponent(vercelRegion) : '');
    const districtName = serverGeo.district ? ` (${serverGeo.district})` : '';

    const latitude = serverGeo.lat || (vercelLat ? parseFloat(vercelLat) : undefined);
    const longitude = serverGeo.lon || (vercelLon ? parseFloat(vercelLon) : undefined);
    const mapsLink =
      latitude && longitude
        ? `<a href="https://www.google.com/maps?q=${latitude},${longitude}">📍 فتح الموقع الدقيق على Google Maps</a>`
        : 'غير متوفر';

    const ispName = serverGeo.isp || serverGeo.org || 'مزود خدمة محلي';
    const asnInfo = serverGeo.as || 'N/A';
    const timezone = serverGeo.timezone || vercelTz || clientData.timezone || 'Africa/Cairo';

    // Security & Network flags
    const networkTags: string[] = [];
    if (serverGeo.isMobile) networkTags.push('📱 شبكة بيانات جوال (Mobile Data)');
    if (serverGeo.isProxy) networkTags.push('⚠️ متصل عبر VPN / Proxy');
    if (serverGeo.isHosting) networkTags.push('🏢 خادم بيانات / روبوت (Datacenter/Hosting)');
    if (cfRay) networkTags.push(`⚡ سيرفر وسيط: Cloudflare Ray (${cfRay.split('-')[1] || cfRay})`);

    const networkTagsText = networkTags.length > 0 ? networkTags.join('\n• ') : 'اتصال منزلي / ألياف بصرية مباشر (Clean ISP)';

    // Battery String
    const batteryDisplay = clientData.batteryState || 'غير متاحة في إعدادات هذا المتصفح';

    // Hardware & Phone
    const phoneModel = clientData.phoneModel || 'جهاز تصفح ذكي';
    const deviceCategory = clientData.deviceCategory || 'Mobile';
    const osFull = `${clientData.osName || 'نظام غير محدد'} ${clientData.osVersion || ''}`.trim();
    const browserFull = `${clientData.browserName || 'متصفح ويب'} ${clientData.browserVersion || ''}`.trim();

    const screenSummary = `${clientData.physicalResolution || clientData.cssResolution || 'غير محدد'} (العرض الفعلي: ${
      clientData.cssResolution || ''
    }) - نسبة البكسل: ${clientData.devicePixelRatio || 1}x`;

    const hardwareSummary = `${clientData.cpuCores || '?'} أنوية معالجة (Cores) | الرام: ${clientData.ramGb || 'N/A'}`;
    const displayFeatures = [
      clientData.refreshRateHz ? `معدل التحديث: ${clientData.refreshRateHz}Hz` : null,
      clientData.colorGamut ? clientData.colorGamut : null,
      clientData.hdrSupported ? 'تقنية الألوان العالية: HDR مدعوم' : null,
      clientData.touchSupported ? `شاشة لمس (${clientData.touchPoints || 5} نقاط)` : 'لا يدعم اللمس',
    ]
      .filter(Boolean)
      .join(' | ');

    const speedInfo = [
      clientData.networkType ? `نوع الاتصال: ${clientData.networkType}` : null,
      clientData.downlinkSpeedMbps ? `السرعة: ${clientData.downlinkSpeedMbps} Mbps` : null,
      clientData.rttLatencyMs ? `زمن الاستجابة: ${clientData.rttLatencyMs}ms` : null,
    ]
      .filter(Boolean)
      .join(' | ') || 'طبيعي';

    const visitBadge = clientData.isFirstVisit
      ? '🚨 <b>[زائر جـديد لأول مـرة!]</b>'
      : `🔄 <b>[زائر مـكرر - الزيارة رقم #${clientData.visitCount || 2}]</b>`;

    // 4. Hardware Fingerprinting Hashes & Entropy
    const masterHash = clientData.masterFingerprintHash || 'غير متوفر';
    const canvasHash = clientData.canvasHash || 'N/A';
    const webglHash = clientData.webglHash || 'N/A';
    const audioHash = clientData.audioHash || 'N/A';
    const typographyHash = clientData.typographyHash || 'N/A';
    const entropyBits = clientData.shannonEntropyBits || 35;
    const uniquenessPct = clientData.uniquenessPercentage || 99.8;

    const webrtcCandidates = Array.isArray(clientData.webrtcLocalIps) ? clientData.webrtcLocalIps : [];
    const webrtcReflected = clientData.webrtcReflectedIp ? ` | العام المسترجع: ${clientData.webrtcReflectedIp}` : '';
    const webrtcText = webrtcCandidates.length > 0
      ? `${webrtcCandidates.join(', ')}${webrtcReflected}`
      : (clientData.webrtcReflectedIp ? `العام: ${clientData.webrtcReflectedIp}` : 'محمي بواسطة سياسة المتصفح (Protected)');

    const fontsList = Array.isArray(clientData.detectedFonts) ? clientData.detectedFonts : [];
    const detectedFontsText = fontsList.length > 0
      ? fontsList.slice(0, 8).join(', ') + (fontsList.length > 8 ? ` (+${fontsList.length - 8} أخرى)` : '')
      : 'خطوط النظام القياسية';

    const clientHintsText = [
      clientData.clientHintsModel ? `الموديل: ${clientData.clientHintsModel}` : null,
      clientData.clientHintsArch ? `المعمارية: ${clientData.clientHintsArch} (${clientData.clientHintsBitness || '64'}bit)` : null,
      clientData.clientHintsPlatformVersion ? `إصدار النواة: v${clientData.clientHintsPlatformVersion}` : null,
    ].filter(Boolean).join(' | ') || 'معمارية الويب الافتراضية';

    // 5. Construct Master HTML Telegram Message
    const telegramMessage = `
${visitBadge}
🌐 <b>الرادار السيبراني والاستخباراتي - Matany.one</b>
━━━━━━━━━━━━━━━━━━━━━
📍 <b>الموقع الجغرافي والشبكة (بدون أذونات):</b>
• الدولة: <b>${escapeHtml(countryName)}</b>
• المدينة والمحافظة: <b>${escapeHtml(cityName)} - ${escapeHtml(regionName)}${escapeHtml(districtName)}</b>
• عنوان الآي بي (IP): <code>${escapeHtml(finalIp)}</code>
• مزود خدمة الإنترنت (ISP): <b>${escapeHtml(ispName)}</b>
• المنظومة المستقلة (ASN): <code>${escapeHtml(asnInfo)}</code>
• خرائط جوجل: ${mapsLink}
• المنطقة الزمنية: <b>${escapeHtml(timezone)} (فرق التوقيت: ${escapeHtml(clientData.timezoneOffsetHours ?? 0)} س)</b>
• طبيعة الاتصال:
• ${networkTagsText}

🧬 <b>بصمة العتاد الفائقة (Hardware Fingerprint):</b>
• المعرف السيبراني الشامل (Master ID): <code>${escapeHtml(masterHash)}</code>
• بصمة الكانفاس (Canvas 2D Hash): <code>${escapeHtml(canvasHash)}</code>
• بصمة الشادر والرسم (WebGL 3D Hash): <code>${escapeHtml(webglHash)}</code>
• بصمة الصوت والمعالجة (AudioContext Hash): <code>${escapeHtml(audioHash)}</code>
• بصمة خطوط النظام (Typography Hash): <code>${escapeHtml(typographyHash)}</code>
• دقة التمييز وقوة البصمة (Shannon Entropy): <b>${escapeHtml(entropyBits)} bits (${escapeHtml(uniquenessPct)}% فرادة مطلقة)</b>
• تسريب WebRTC (Candidate / Reflected): <code>${escapeHtml(webrtcText)}</code>
• خطوط النظام المكتشفة: <b>${escapeHtml(detectedFontsText)}</b>
• مؤشرات العميل (Client Hints): <b>${escapeHtml(clientHintsText)}</b>

📱 <b>مواصفات الجهاز والهاتف بالكامل:</b>
• الطراز المستنتج بدقة: <b>${escapeHtml(phoneModel)}</b>
• التصنيف: <b>${escapeHtml(deviceCategory)}</b>
• نظام التشغيل: <b>${escapeHtml(osFull)}</b>
• المتصفح: <b>${escapeHtml(browserFull)}</b>
• كارت الشاشة الفعلي (GPU): <code>${escapeHtml(clientData.gpuRenderer || 'غير متاح')}</code>
• مواصفات العتاد: <b>${escapeHtml(hardwareSummary)}</b>
• أبعاد الشاشة: <b>${escapeHtml(screenSummary)}</b>
• مزايا الشاشة: <b>${escapeHtml(displayFeatures)}</b>

🔋 <b>حالة البطارية والطاقة:</b>
• حالة الشحن: <b>${escapeHtml(batteryDisplay)}</b>

📶 <b>سرعة التصفح والشبكة:</b>
• تفاصيل السرعة: <b>${escapeHtml(speedInfo)}</b>

🕵️ <b>جلسة التصفح وهوية الزائر:</b>
• توقيت الدخول: <b>${escapeHtml(clientData.localTime || new Date().toLocaleString('ar-EG'))}</b>
• مدة الجلسة الحالية: <b>${escapeHtml(clientData.sessionDurationSec ?? 0)} ثانية</b>
• مصدر الدخول (Referrer): <code>${escapeHtml(reqReferer || 'دخول مباشر')}</code>
• الصفحة المطلوبة: <code>${escapeHtml(clientData.pageUrl || 'https://matany.one/')}</code>
• نمط العرض: <b>${escapeHtml(clientData.themePreference || 'Dark')}</b> | لغة الجهاز: <b>${escapeHtml(clientData.preferredLanguage || 'ar')}</b>
• معرف البصمة (Visitor ID): <code>${escapeHtml(clientData.visitorId || 'N/A')}</code>
• البصمة الكاملة (User-Agent):
<code>${escapeHtml(reqUserAgent || 'Unknown')}</code>
━━━━━━━━━━━━━━━━━━━━━
`;

    // 5. Instant Dispatch to Telegram
    const targetChatIds = new Set<string | number>();
    if (PRIMARY_CHAT_ID) targetChatIds.add(PRIMARY_CHAT_ID);

    // Also send to active chats from getUpdates if needed
    try {
      const updateRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getUpdates?limit=10`);
      if (updateRes.ok) {
        const updateData = (await updateRes.json()) as any;
        if (updateData.ok && Array.isArray(updateData.result)) {
          for (const upd of updateData.result) {
            const chat = upd?.message?.chat || upd?.channel_post?.chat;
            if (chat?.id) targetChatIds.add(chat.id);
          }
        }
      }
    } catch {
      // ignore
    }

    const results = await Promise.all(
      Array.from(targetChatIds).map(async (chatId) => {
        try {
          const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: chatId,
              text: telegramMessage,
              parse_mode: 'HTML',
              disable_web_page_preview: false,
            }),
          });
          return res.ok;
        } catch {
          return false;
        }
      })
    );

    return new Response(
      JSON.stringify({
        success: true,
        detectedIp: finalIp,
        country: countryName,
        city: cityName,
        model: phoneModel,
        delivered: results.filter(Boolean).length,
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (err: any) {
    console.error('[Telemetry Fatal Error]:', err);
    return new Response(JSON.stringify({ error: err.message || 'Internal error' }), {
      status: 500,
      headers: corsHeaders,
    });
  }
}
