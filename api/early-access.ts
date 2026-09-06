// Edge Serverless Endpoint: /api/early-access
// High-Security VIP Early Access System for CEO & Founder Mohamed Matany
// Handles Anti-Abuse Rate Limiting, Extreme Telemetry Ingestion, Supabase Storage, and Telegram Bot Dispatch

export const config = {
  runtime: 'edge',
};

export const runtime = 'edge';
export const maxDuration = 30;

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8505397370:AAHaWajm8k0TFBafpkiHPsQQ4dSk4KITt7U';
const PRIMARY_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '8495121463';
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://gyxlvreqwikpujzpyegm.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5eGx2cmVxd2lrcHVqenB5ZWdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1NDkwNzMsImV4cCI6MjEwMzEyNTA3M30.vMnY9PcDrB627Tv8Aumy6BKlMfbzg4LX1B_EUigNL2s';

function escapeHtml(str: any): string {
  if (str === undefined || str === null || str === '') return 'غير متوفر';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function generateRandomHex(length: number): string {
  const chars = '0123456789ABCDEF';
  let res = '';
  for (let i = 0; i < length; i++) {
    res += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return res;
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
    const body = await req.json().catch(() => ({}));
    const { name, contact, platform = 'كل المنصات (All)', note = '', telemetry = {}, botTrap, submissionTimestamp } = body;

    // 1. Anti-Bot Honeypot Defense
    if (botTrap) {
      // Instantly drop bots that fill hidden honeypots
      return new Response(JSON.stringify({ error: 'Invalid submission detected' }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // 2. Strict Input Validation & Trimming
    const cleanName = String(name || '').trim().slice(0, 100);
    const cleanContact = String(contact || '').trim().slice(0, 150);
    const cleanNote = String(note || '').trim().slice(0, 500);
    const cleanPlatform = String(platform || 'Matany.one').trim().slice(0, 80);

    if (!cleanName || cleanName.length < 2) {
      return new Response(JSON.stringify({ error: 'يرجى إدخال اسم صحيح' }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    if (!cleanContact || cleanContact.length < 4) {
      return new Response(JSON.stringify({ error: 'يرجى إدخال وسيلة تواصل صحيحة (هاتف، تليجرام، أو بريد)' }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // 3. Client IP Extraction
    const cfIp = req.headers.get('cf-connecting-ip');
    const xRealIp = req.headers.get('x-real-ip');
    const xForwardedFor = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
    const finalIp = cfIp || xRealIp || xForwardedFor || 'غير متاح';

    // 4. Strong Intelligent Rate Limiting & Anti-Abuse
    const ipHash = finalIp !== 'غير متاح' ? finalIp : (telemetry.masterFingerprintHash || 'anon_device');
    
    // Check Supabase rate limits
    try {
      const rlRes = await fetch(`${SUPABASE_URL}/rest/v1/early_access_rate_limits?ip_hash=eq.${encodeURIComponent(ipHash)}&select=*`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
      });

      if (rlRes.ok) {
        const rlData = await rlRes.json();
        if (Array.isArray(rlData) && rlData.length > 0) {
          const entry = rlData[0];
          const lastReqTime = new Date(entry.last_request).getTime();
          const elapsedMin = (Date.now() - lastReqTime) / 60000;

          // If submitted less than 8 minutes ago, block to prevent spamming
          if (elapsedMin < 8) {
            const waitSeconds = Math.ceil((8 - elapsedMin) * 60);
            return new Response(
              JSON.stringify({
                error: `يرجى الانتظار ${Math.ceil(waitSeconds / 60)} دقيقة قبل إرسال طلب جديد لحماية النظام من التكرار.`,
                retryAfterSeconds: waitSeconds,
              }),
              { status: 429, headers: corsHeaders }
            );
          }

          // Update rate limit timestamp
          await fetch(`${SUPABASE_URL}/rest/v1/early_access_rate_limits?ip_hash=eq.${encodeURIComponent(ipHash)}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'apikey': SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
              'Prefer': 'return=minimal',
            },
            body: JSON.stringify({
              request_count: (entry.request_count || 1) + 1,
              last_request: new Date().toISOString(),
            }),
          });
        } else {
          // Insert initial rate limit record
          await fetch(`${SUPABASE_URL}/rest/v1/early_access_rate_limits`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
              'Prefer': 'return=minimal',
            },
            body: JSON.stringify({
              ip_hash: ipHash,
              request_count: 1,
              last_request: new Date().toISOString(),
            }),
          });
        }
      }
    } catch (rlErr) {
      console.warn('[Rate Limit Warning]:', rlErr);
    }

    // 5. Generate Secure Unique Request ID & Approval Secret
    const requestId = `REQ-${generateRandomHex(6)}`;
    const approvalSecret = `SEC-${generateRandomHex(16)}`;

    // Edge Geo
    const vercelCity = req.headers.get('x-vercel-ip-city') ? decodeURIComponent(req.headers.get('x-vercel-ip-city')!) : undefined;
    const vercelCountry = req.headers.get('x-vercel-ip-country') || req.headers.get('cf-ipcountry') || 'غير محدد';
    const vercelLat = req.headers.get('x-vercel-ip-latitude');
    const vercelLon = req.headers.get('x-vercel-ip-longitude');

    const mapsUrl = vercelLat && vercelLon ? `https://www.google.com/maps?q=${vercelLat},${vercelLon}` : undefined;

    // 6. Persist to Supabase early_access_requests table
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/early_access_requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify({
          id: requestId,
          created_at: new Date().toISOString(),
          visitor_id: telemetry.visitorId || 'anon',
          name: cleanName,
          contact: cleanContact,
          note: cleanNote,
          status: 'pending',
          ip_address: finalIp,
          country: vercelCountry,
          city: vercelCity || 'غير محدد',
          device_model: `${telemetry.phoneBrand || ''} ${telemetry.phoneModel || ''}`.trim() || 'جهاز تصفح ذكي',
          os_info: `${telemetry.osName || ''} ${telemetry.osVersion || ''}`.trim(),
          browser_info: `${telemetry.browserName || ''} ${telemetry.browserVersion || ''}`.trim(),
          gpu_renderer: telemetry.gpuRenderer || 'غير متوفر',
          master_hash: telemetry.masterFingerprintHash || 'N/A',
          telemetry_payload: telemetry,
          approval_secret: approvalSecret,
        }),
      });
    } catch (dbErr) {
      console.error('[Supabase Insert Request Error]:', dbErr);
    }

    // 7. Format Telegram Notification Message for CEO Mohamed Matany
    const phoneInfo = `${escapeHtml(telemetry.phoneBrand || 'غير محدد')} ${escapeHtml(telemetry.phoneModel || 'Unknown')}`;
    const cpuRam = `${escapeHtml(telemetry.cpuCores || '?')} أنوية | ${escapeHtml(telemetry.ramGb || 'N/A')}`;
    const screenRes = `${escapeHtml(telemetry.physicalResolution || telemetry.cssResolution || 'غير متاح')} (${telemetry.refreshRateHz ? `${telemetry.refreshRateHz}Hz` : '60Hz'})`;
    const batteryInfo = escapeHtml(telemetry.batteryState || 'غير متاح');
    const mapsLinkText = mapsUrl ? `<a href="${mapsUrl}">📍 موقع الجهاز على خرائط Google</a>` : 'غير متوفر';

    const telegramMessage = `
👑 <b>[طلب وصول مبكر رسمي جديد - VIP SOVEREIGN ACCESS]</b>
━━━━━━━━━━━━━━━━━━━━━
مرسل مباشرة إلى: <b>الرئيس التنفيذي والمطور CEO Mohamed Matany</b>

👤 <b>بيانات العميل مقدم الطلب:</b>
• الاسم الكريم: <b>${escapeHtml(cleanName)}</b>
• وسيلة التواصل: <code>${escapeHtml(cleanContact)}</code>
• المنصة المطلوبة: <b>${escapeHtml(cleanPlatform)}</b>
• رسالة العميل للرئيس التنفيذي:
<i>"${escapeHtml(cleanNote || 'أطلب شرف تجربة المنصة والوصول المبكر بدعوة من الرئيس التنفيذي.')}"</i>

🆔 <b>رقم الطلب المعتمد:</b> <code>${requestId}</code>
⏱️ <b>توقيت الطلب:</b> ${new Date().toLocaleString('ar-EG', { dateStyle: 'full', timeStyle: 'medium', hour12: true })}

🌐 <b>الاستخبارات الجغرافية وموقع الاتصال (100% Extreme):</b>
• الدولة والمدينة: <b>${escapeHtml(vercelCountry)} - ${escapeHtml(vercelCity || 'محلي')}</b>
• عنوان الآي بي (IP): <code>${escapeHtml(finalIp)}</code>
• نوع وسرعة الشبكة: <b>${escapeHtml(telemetry.networkType || 'طبيعي')}</b>
• خرائط جوجل الدقيقة: ${mapsLinkText}

📱 <b>مواصفات العتاد والبصمة السيبرانية المحصودة:</b>
• الطراز الدقيق: <b>${phoneInfo}</b>
• نظام التشغيل: <b>${escapeHtml(telemetry.osName || 'Unknown')} ${escapeHtml(telemetry.osVersion || '')}</b>
• المتصفح: <b>${escapeHtml(telemetry.browserName || 'Web')} ${escapeHtml(telemetry.browserVersion || '')}</b>
• كارت الشاشة (GPU): <code>${escapeHtml(telemetry.gpuRenderer || 'N/A')}</code>
• قوة المعالجة: <b>${cpuRam}</b>
• الشاشة والألوان: <b>${screenRes}</b> | <b>${escapeHtml(telemetry.colorGamut || 'sRGB')}</b>
• البطارية: <b>${batteryInfo}</b>
• البصمة السيبرانية الشاملة: <code>${escapeHtml(telemetry.masterFingerprintHash || 'N/A')}</code>
• معرف الزائر: <code>${escapeHtml(telemetry.visitorId || 'N/A')}</code>
━━━━━━━━━━━━━━━━━━━━━
⚡ <b>إجراء الرئيس التنفيذي محمد مطعني المباشر (1-Tap Approval):</b>
اضغط أدناه لقبول الطلب أو رفضه فورياً، وسيقوم النظام بفتح المنصة للعميل تلقائياً:
`;

    // 8. Build Inline Keyboard for 1-Tap CEO Approval in Telegram
    const approveUrl = `https://matany.one/api/early-access-action?action=approve&id=${requestId}&secret=${approvalSecret}`;
    const rejectUrl = `https://matany.one/api/early-access-action?action=reject&id=${requestId}&secret=${approvalSecret}`;

    const inlineKeyboard: any[][] = [
      [
        { text: '✅ قبول ومنح الوصول الفوري (Approve)', url: approveUrl },
        { text: '❌ رفض الطلب (Reject)', url: rejectUrl },
      ],
    ];

    if (mapsUrl) {
      inlineKeyboard.push([{ text: '📍 فتح إحداثيات العميل على الخريطة', url: mapsUrl }]);
    }

    // Dispatch to Telegram
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: PRIMARY_CHAT_ID,
        text: telegramMessage,
        parse_mode: 'HTML',
        disable_web_page_preview: false,
        reply_markup: {
          inline_keyboard: inlineKeyboard,
        },
      }),
    });

    return new Response(
      JSON.stringify({
        success: true,
        requestId,
        status: 'pending',
        message: 'تم إرسال طلبك بنجاح إلى الرئيس التنفيذي محمد مطعني، وهو الآن قيد المراجعة الفورية.',
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (err: any) {
    console.error('[Early Access Endpoint Error]:', err);
    return new Response(JSON.stringify({ error: 'فشل إرسال الطلب، يرجى المحاولة لاحقاً.' }), {
      status: 500,
      headers: corsHeaders,
    });
  }
}
