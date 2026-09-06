// Serverless Telemetry Dispatcher for Matany.one
// Combines Vercel Edge headers + Client Hardware/Battery/GPU telemetry and forwards to Telegram bot @sosai1_bot

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8505397370:AAHaWajm8k0TFBafpkiHPsQQ4dSk4KITt7U';
let cachedChatIds: Set<string | number> = new Set();

export const config = {
  runtime: 'edge',
};
export const runtime = 'edge';
export const maxDuration = 30;

// Escape HTML special characters for Telegram HTML parse_mode
function escapeHtml(str: string | number | undefined | null): string {
  if (str === undefined || str === null) return 'غير متاح';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function resolveTelegramChatIds(): Promise<Array<string | number>> {
  // If explicitly configured in environment
  if (process.env.TELEGRAM_CHAT_ID) {
    const ids = process.env.TELEGRAM_CHAT_ID.split(',').map((s) => s.trim());
    return ids;
  }

  // If we already discovered chat IDs in this runtime instance
  if (cachedChatIds.size > 0) {
    return Array.from(cachedChatIds);
  }

  // Query Telegram getUpdates to auto-discover user chat ID
  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getUpdates?limit=20`, {
      signal: AbortSignal.timeout(4000),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.ok && Array.isArray(data.result)) {
        for (const update of data.result) {
          const chat = update?.message?.chat || update?.channel_post?.chat || update?.callback_query?.message?.chat;
          if (chat?.id) {
            cachedChatIds.add(chat.id);
          }
        }
      }
    }
  } catch (err) {
    console.error('[Telemetry] Failed to resolve Telegram chat IDs:', err);
  }

  return Array.from(cachedChatIds);
}

export default async function handler(req: Request) {
  // CORS Preflight
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

    // Server-side Vercel Edge Headers
    const cfIp = req.headers.get('cf-connecting-ip');
    const xRealIp = req.headers.get('x-real-ip');
    const xForwardedFor = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
    const vercelCountry = req.headers.get('x-vercel-ip-country');
    const vercelRegion = req.headers.get('x-vercel-ip-country-region');
    const vercelCity = req.headers.get('x-vercel-ip-city');
    const vercelLatitude = req.headers.get('x-vercel-ip-latitude');
    const vercelLongitude = req.headers.get('x-vercel-ip-longitude');
    const vercelTimezone = req.headers.get('x-vercel-ip-timezone');
    const reqUserAgent = req.headers.get('user-agent');
    const reqReferer = req.headers.get('referer');

    // Consolidated Metrics
    const finalIp = xRealIp || cfIp || xForwardedFor || clientData.ip || 'غير معروف';
    const finalCountry = vercelCountry || clientData.country || 'غير معروف';
    const finalCity = vercelCity || clientData.city || 'غير معروف';
    const finalRegion = vercelRegion || clientData.region || '';
    const finalLat = vercelLatitude || clientData.latitude;
    const finalLon = vercelLongitude || clientData.longitude;
    const mapsLink = finalLat && finalLon ? `https://www.google.com/maps?q=${finalLat},${finalLon}` : clientData.mapsUrl;

    // Battery Info
    let batteryText = 'غير مدعوم في المتصفح أو تم حظره';
    if (clientData.batterySupported && clientData.batteryLevel !== undefined) {
      const chargeIcon = clientData.isCharging ? '⚡ متصل بالشاحن (Charging)' : '🔋 يعمل على البطارية (Discharging)';
      batteryText = `${clientData.batteryLevel}% [${chargeIcon}]`;
    }

    // Network Info
    const netDetails = [
      clientData.connectionType ? `النوع: ${clientData.connectionType}` : null,
      clientData.downlinkSpeed ? `السرعة: ${clientData.downlinkSpeed} Mbps` : null,
      clientData.rtt ? `البينغ: ${clientData.rtt}ms` : null,
    ]
      .filter(Boolean)
      .join(' | ') || 'غير متوفر';

    // Screen Info
    const screenDetails = `${clientData.screenWidth || '?'}x${clientData.screenHeight || '?'} (العرض الفعلي: ${clientData.viewportWidth || '?'}x${clientData.viewportHeight || '?'}) - DPR: ${clientData.devicePixelRatio || 1}x - التوجيه: ${clientData.screenOrientation || 'default'}`;

    // Hardware Info
    const hardwareDetails = [
      clientData.cpuCores ? `${clientData.cpuCores} CPU Cores` : null,
      clientData.ramGb ? `${clientData.ramGb} GB RAM` : null,
      clientData.touchPoints !== undefined ? `${clientData.touchPoints} نقاط لمس` : null,
    ]
      .filter(Boolean)
      .join(' | ') || 'غير متوفر';

    const visitBadge = clientData.isFirstVisit
      ? '🚨 <b>[زائر جـديد لأول مـرة!]</b>'
      : `🔄 <b>[زائر مـكرر - الزيارة رقم #${clientData.visitCount || 2}]</b>`;

    // Construct Telegram HTML Report
    const telegramMessage = `
${visitBadge}
🌐 <b>الرادار الأمني - Matany.one</b>
━━━━━━━━━━━━━━━━━━━━━
📍 <b>الموقع الجغرافي والشبكة:</b>
• الدولة: <b>${escapeHtml(finalCountry)}</b>
• المدينة / المحافظة: <b>${escapeHtml(finalCity)} ${escapeHtml(finalRegion)}</b>
• عنوان الآي بي (IP): <code>${escapeHtml(finalIp)}</code>
• مزود الخدمة (ISP): <b>${escapeHtml(clientData.isp || 'غير محدد')}</b>
• إحداثيات الخريطة: ${mapsLink ? `<a href="${mapsLink}">📍 فتح الموقع على Google Maps</a>` : 'غير متوفرة'}
• المنطقة الزمنية: <b>${escapeHtml(vercelTimezone || clientData.timezone || 'Unknown')}</b>

📱 <b>مواصفات الجهاز والهاتف الكاملة:</b>
• التصنيف: <b>${escapeHtml(clientData.deviceType || 'Unknown')}</b>
• نظام التشغيل: <b>${escapeHtml(clientData.os || 'Unknown')}</b>
• المتصفح: <b>${escapeHtml(clientData.browser || 'Unknown')}</b>
• كارت الشاشة (GPU): <code>${escapeHtml(clientData.gpuRenderer || 'غير متاح')}</code>
• مواصفات العتاد: <b>${escapeHtml(hardwareDetails)}</b>
• مقاس الشاشة: <b>${escapeHtml(screenDetails)}</b>

🔋 <b>حالة البطارية والطاقة:</b>
• النسبة والشحن: <b>${escapeHtml(batteryText)}</b>

📶 <b>بيانات سرعة الاتصال:</b>
• تفاصيل الشبكة: <b>${escapeHtml(netDetails)}</b>

🕵️ <b>بيانات التصفح والسلوك:</b>
• وقت الدخول: <b>${escapeHtml(clientData.localTime || new Date().toLocaleString('ar-EG'))}</b>
• مصدر التحويل (Referrer): <code>${escapeHtml(clientData.referrer || reqReferer || 'دخول مباشر')}</code>
• الرابط المطلوب: <code>${escapeHtml(clientData.pageUrl || 'https://matany.one/')}</code>
• هوية الزائر (ID): <code>${escapeHtml(clientData.visitorId || 'N/A')}</code>
• المعرف الكامل (User-Agent):
<code>${escapeHtml(reqUserAgent || clientData.userAgent || 'Unknown')}</code>
━━━━━━━━━━━━━━━━━━━━━
`;

    // Discover or fetch Chat IDs
    const chatIds = await resolveTelegramChatIds();

    if (chatIds.length > 0) {
      // Broadcast to all active chats (e.g. user personal chat)
      await Promise.all(
        chatIds.map(async (chatId) => {
          try {
            await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: chatId,
                text: telegramMessage,
                parse_mode: 'HTML',
                disable_web_page_preview: false,
              }),
            });
          } catch (e) {
            console.error(`[Telemetry] Failed sending to chat ${chatId}:`, e);
          }
        })
      );
    } else {
      console.warn('[Telemetry] No chat ID found. Please send /start to @sosai1_bot.');
    }

    return new Response(
      JSON.stringify({
        success: true,
        detectedIp: finalIp,
        activeChats: chatIds.length,
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (err: any) {
    console.error('[Telemetry Error]:', err);
    return new Response(JSON.stringify({ error: err.message || 'Internal Server Error' }), {
      status: 500,
      headers: corsHeaders,
    });
  }
}
