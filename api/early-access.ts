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

// Resilient, fail-safe Telegram Dispatcher with HTML-to-Plaintext automatic fallback
async function dispatchTelegramSafe(chatId: string | number, text: string, inlineKeyboard?: any[][]): Promise<{ ok: boolean; messageId?: number; error?: string }> {
  try {
    // 1. First Attempt: Rich HTML Mode
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
        reply_markup: inlineKeyboard ? { inline_keyboard: inlineKeyboard } : undefined,
      }),
    });

    const data = await res.json().catch(() => null);
    if (res.ok && data?.ok) {
      return { ok: true, messageId: data.result?.message_id };
    }

    console.warn(`[Telegram HTML Dispatch Failed]: ${data?.description || res.statusText}, attempting fallback plain text...`);

    // 2. Automatic Fallback: Strip HTML tags and send plain text to guarantee delivery
    const plainText = text.replace(/<[^>]+>/g, '').slice(0, 4000);
    const fallbackRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: plainText,
        disable_web_page_preview: true,
        reply_markup: inlineKeyboard ? { inline_keyboard: inlineKeyboard } : undefined,
      }),
    });

    const fallbackData = await fallbackRes.json().catch(() => null);
    if (fallbackRes.ok && fallbackData?.ok) {
      return { ok: true, messageId: fallbackData.result?.message_id };
    }

    return { ok: false, error: fallbackData?.description || 'Failed both HTML and PlainText dispatch' };
  } catch (err: any) {
    console.error('[Telegram Dispatch Exception]:', err);
    return { ok: false, error: err.message };
  }
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
    const { name, contact, platform = 'كل المنصات (Matany.one & UpStore)', note = '', telemetry = {}, botTrap } = body;

    // 1. Anti-Bot Honeypot Defense
    if (botTrap) {
      return new Response(JSON.stringify({ error: 'Invalid submission detected' }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // 2. Strict Input Validation & Trimming
    const cleanName = String(name || '').trim().slice(0, 100);
    const cleanContact = String(contact || '').trim().slice(0, 150);
    const cleanNote = String(note || '').trim().slice(0, 500);
    const cleanPlatform = String(platform || 'كل المنصات (Matany.one & UpStore)').trim().slice(0, 80);

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

    // 4. Client Identifiers
    const clientVisitorId = telemetry.visitorId && telemetry.visitorId !== 'anon' ? String(telemetry.visitorId).trim() : '';
    const clientMasterHash = telemetry.masterFingerprintHash && telemetry.masterFingerprintHash !== 'N/A' ? String(telemetry.masterFingerprintHash).trim() : '';

    // 5. Radical Multi-Vector Location Intelligence Synthesis
    const incomingLocation = body.radicalLocation || telemetry.radicalLocation || {};
    
    // Edge Geo Headers fallback
    const edgeCity = req.headers.get('x-vercel-ip-city') ? decodeURIComponent(req.headers.get('x-vercel-ip-city')!) : undefined;
    const edgeCountry = req.headers.get('x-vercel-ip-country') || req.headers.get('cf-ipcountry') || undefined;
    const edgeLat = req.headers.get('x-vercel-ip-latitude');
    const edgeLon = req.headers.get('x-vercel-ip-longitude');

    let finalCountry = incomingLocation.country || edgeCountry || 'غير محدد';
    let finalCity = incomingLocation.city || edgeCity || 'غير محدد';
    let finalRegion = incomingLocation.region || '';
    let finalIsp = incomingLocation.isp || incomingLocation.org || 'مقدم خدمة محلي';
    let finalAsn = incomingLocation.asn || '';
    let isVpn = !!incomingLocation.isVpn || !!incomingLocation.isProxy;
    let flagEmoji = incomingLocation.flagEmoji || '🌐';
    let finalLat = incomingLocation.latitude || (edgeLat ? parseFloat(edgeLat) : null);
    let finalLon = incomingLocation.longitude || (edgeLon ? parseFloat(edgeLon) : null);
    let locationConfidence = incomingLocation.confidence || (edgeLat ? 'Vercel Edge Geolocation' : 'IP Approximation');

    // Server-side fallback lookup if coordinates are completely missing
    if (!finalLat && finalIp && finalIp !== 'غير متاح' && !finalIp.startsWith('127.') && finalIp !== '::1') {
      try {
        const ipLookupRes = await fetch(`http://ip-api.com/json/${encodeURIComponent(finalIp)}?fields=status,country,countryCode,regionName,city,lat,lon,isp,org,as,proxy,hosting`, {
          signal: AbortSignal.timeout(2500)
        });
        if (ipLookupRes.ok) {
          const ipData = await ipLookupRes.json();
          if (ipData.status === 'success') {
            finalCountry = ipData.country || finalCountry;
            finalCity = ipData.city || finalCity;
            finalRegion = ipData.regionName || finalRegion;
            finalLat = ipData.lat;
            finalLon = ipData.lon;
            finalIsp = ipData.isp || ipData.org || finalIsp;
            finalAsn = ipData.as || finalAsn;
            isVpn = isVpn || !!ipData.proxy || !!ipData.hosting;
            locationConfidence = 'Server Edge Triangulation';
          }
        }
      } catch {}
    }

    const hasValidCoords = finalLat !== null && finalLon !== null && !isNaN(Number(finalLat)) && !isNaN(Number(finalLon));
    const mapsUrl = hasValidCoords ? `https://www.google.com/maps?q=${finalLat},${finalLon}` : undefined;

    // 6. Check for Existing Prior Submission
    const duplicateOrFilters: string[] = [];
    if (cleanContact && cleanContact.length >= 4) {
      duplicateOrFilters.push(`contact.ilike.%${encodeURIComponent(cleanContact)}%`);
    }
    if (clientMasterHash && clientMasterHash.length >= 6 && clientMasterHash !== 'N/A') {
      duplicateOrFilters.push(`master_hash.eq.${encodeURIComponent(clientMasterHash)}`);
    }
    if (clientVisitorId && clientVisitorId.length >= 8 && clientVisitorId !== 'anon') {
      duplicateOrFilters.push(`visitor_id.eq.${encodeURIComponent(clientVisitorId)}`);
    }

    let existingRecord: any = null;
    if (duplicateOrFilters.length > 0) {
      try {
        const checkRes = await fetch(
          `${SUPABASE_URL}/rest/v1/early_access_requests?or=(${duplicateOrFilters.join(',')})&select=*&order=created_at.desc&limit=1`,
          {
            headers: {
              'apikey': SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            },
          }
        );

        if (checkRes.ok) {
          const existingList = await checkRes.json();
          if (Array.isArray(existingList) && existingList.length > 0) {
            existingRecord = existingList[0];
          }
        }
      } catch (checkErr) {
        console.warn('[Once-Only Check Warning]:', checkErr);
      }
    }

    // 7. Handle Existing Record
    if (existingRecord) {
      // A. If already approved, grant instant access
      if (existingRecord.status === 'approved') {
        return new Response(
          JSON.stringify({
            success: true,
            alreadySubmitted: true,
            requestId: existingRecord.id,
            status: 'approved',
            message: 'تمت الموافقة على طلبك مسبقاً! المنصة مفتوحة لك بالكامل الآن.',
          }),
          { status: 200, headers: corsHeaders }
        );
      }

      // B. If rejected
      if (existingRecord.status === 'rejected') {
        return new Response(
          JSON.stringify({
            success: false,
            alreadySubmitted: true,
            requestId: existingRecord.id,
            status: 'rejected',
            error: 'تمت مراجعة طلبك والاعتذار عنه في الوقت الحالي.',
          }),
          { status: 200, headers: corsHeaders }
        );
      }

      // C. If still PENDING: Update note and RESEND Telegram alert to ensure CEO sees it!
      const activeSecret = existingRecord.approval_secret || `SEC-${generateRandomHex(16)}`;
      
      try {
        await fetch(`${SUPABASE_URL}/rest/v1/early_access_requests?id=eq.${encodeURIComponent(existingRecord.id)}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            updated_at: new Date().toISOString(),
            note: cleanNote || existingRecord.note,
            contact: cleanContact,
            approval_secret: activeSecret,
          }),
        });
      } catch {}

      const resendTelegramMessage = `
👑 <b>[طلب وصول مبكر - VIP SOVEREIGN ACCESS (تذكير / إعادة إرسال)]</b>
━━━━━━━━━━━━━━━━━━━━━
مرسل مباشرة إلى: <b>الرئيس التنفيذي والمطور CEO Mohamed Matany</b>

👤 <b>بيانات العميل مقدم الطلب:</b>
• الاسم الكريم: <b>${escapeHtml(cleanName || existingRecord.name)}</b>
• وسيلة التواصل: <code>${escapeHtml(cleanContact)}</code>
• المنصة المطلوبة: <b>${escapeHtml(cleanPlatform)}</b>
• رسالة العميل للرئيس التنفيذي:
<i>"${escapeHtml(cleanNote || existingRecord.note || 'أطلب شرف تجربة المنصة والوصول المبكر بدعوة من الرئيس التنفيذي.')}"</i>

🆔 <b>رقم الطلب المعتمد:</b> <code>${existingRecord.id}</code>
⏱️ <b>توقيت التذكير:</b> ${new Date().toLocaleString('ar-EG', { dateStyle: 'full', timeStyle: 'medium', hour12: true })}
📊 <b>الحالة:</b> <b>⏳ قيد المراجعة الفورية (Pending)</b>

🌐 <b>الموقع والشبكة:</b>
• الموقع: ${flagEmoji} <b>${escapeHtml(finalCountry)}</b> - <b>${escapeHtml(finalCity)}</b>
• الآي بي (IP): <code>${escapeHtml(finalIp)}</code>
• مزود الخدمة: <b>${escapeHtml(finalIsp)}</b>
• فحص الأمان: ${isVpn ? '⚠️ VPN/Proxy' : '✅ اتصال محلي مباشر'}
${hasValidCoords ? `• الإحداثيات: <code>${finalLat}, ${finalLon}</code>` : ''}
━━━━━━━━━━━━━━━━━━━━━
⚡ <b>إجراء الرئيس التنفيذي محمد مطعني المباشر:</b>
`;

      const approveUrl = `https://matany.one/api/early-access-action?id=${existingRecord.id}&secret=${activeSecret}&intent=approve`;
      const rejectUrl = `https://matany.one/api/early-access-action?id=${existingRecord.id}&secret=${activeSecret}&intent=reject`;

      const inlineKeyboard: any[][] = [
        [
          { text: '✅ قبول ومنح الوصول الفوري (Approve)', url: approveUrl },
          { text: '❌ رفض الطلب نهائياً (Reject)', url: rejectUrl },
        ],
      ];
      if (mapsUrl) {
        inlineKeyboard.push([{ text: '📍 خرائط جوجل الدقيقة', url: mapsUrl }]);
      }

      await dispatchTelegramSafe(PRIMARY_CHAT_ID, resendTelegramMessage, inlineKeyboard);

      return new Response(
        JSON.stringify({
          success: true,
          alreadySubmitted: true,
          requestId: existingRecord.id,
          status: 'pending',
          message: 'تم استلام طلبك وتنبيه الرئيس التنفيذي محمد مطعني مباشرة لمراجعته الآن.',
        }),
        { status: 200, headers: corsHeaders }
      );
    }

    // 8. Brand New Request: Generate ID and Secret
    const requestId = `REQ-${generateRandomHex(6)}`;
    const approvalSecret = `SEC-${generateRandomHex(16)}`;

    // 9. Persist to Supabase early_access_requests table
    try {
      const dbRes = await fetch(`${SUPABASE_URL}/rest/v1/early_access_requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Prefer': 'return=representation',
        },
        body: JSON.stringify({
          id: requestId,
          created_at: new Date().toISOString(),
          visitor_id: clientVisitorId || 'anon',
          name: cleanName,
          contact: cleanContact,
          note: cleanNote,
          status: 'pending',
          ip_address: finalIp,
          country: finalCountry,
          city: finalCity,
          device_model: `${telemetry.phoneBrand || ''} ${telemetry.phoneModel || ''}`.trim() || 'جهاز ذكي',
          phone_brand: telemetry.phoneBrand || 'غير محدد',
          phone_model: telemetry.phoneModel || 'غير محدد',
          model_code: telemetry.modelCode || 'غير محدد',
          chipset: telemetry.chipset || 'غير محدد',
          refresh_rate: telemetry.refreshRateHz || 60,
          screen_matrix: telemetry.screenMatrix || telemetry.physicalResolution || '',
          location_dossier: {
            ip: finalIp,
            country: finalCountry,
            region: finalRegion,
            city: finalCity,
            isp: finalIsp,
            asn: finalAsn,
            isVpn,
            latitude: finalLat,
            longitude: finalLon,
            confidence: locationConfidence,
            mapsUrl,
          },
          os_info: `${telemetry.osName || ''} ${telemetry.osVersion || ''}`.trim(),
          browser_info: `${telemetry.browserName || ''} ${telemetry.browserVersion || ''}`.trim(),
          gpu_renderer: telemetry.gpuRenderer || 'غير متوفر',
          master_hash: clientMasterHash || 'N/A',
          telemetry_payload: telemetry,
          approval_secret: approvalSecret,
        }),
      });

      if (!dbRes.ok) {
        console.error('[Supabase Insert Warning]:', dbRes.status, await dbRes.text().catch(() => ''));
      }
    } catch (dbErr) {
      console.error('[Supabase Exception]:', dbErr);
    }

    // 10. Format Telegram Executive Dossier for CEO Mohamed Matany
    const brandName = escapeHtml(telemetry.phoneBrand || 'غير محدد');
    const modelName = escapeHtml(telemetry.phoneModel || 'Unknown');
    const chipsetDesc = escapeHtml(telemetry.chipset || 'غير مصرح بالقراءة');
    const islandBadge = telemetry.hasDynamicIsland ? ' [🏝️ Dynamic Island]' : telemetry.hasNotch ? ' [📱 شاشة بنوتش]' : '';
    const phoneInfo = `<b>${brandName}</b> — <b>${modelName}</b>${islandBadge}`;
    const cpuRam = `${escapeHtml(telemetry.cpuCores || '?')} أنوية | ${escapeHtml(telemetry.ramGb || 'N/A')}`;
    const screenRes = `${escapeHtml(telemetry.screenMatrix || telemetry.physicalResolution || telemetry.cssResolution || 'غير متاح')} (${telemetry.refreshRateHz ? `${telemetry.refreshRateHz}Hz` : '60Hz'})`;
    const batteryInfo = escapeHtml(telemetry.batteryState || 'غير متاح');
    const vpnStatus = isVpn
      ? '⚠️ <b>تحذير: اتصال عبر شبكة افتراضية / بروكسي (VPN/Proxy Detected)</b>'
      : '✅ <b>اتصال محلي مباشر وموثوق (No VPN Detected)</b>';

    const locationSummary = `${flagEmoji} <b>${escapeHtml(finalCountry)}</b> - <b>${escapeHtml(finalRegion ? `${finalRegion}, ` : '')}${escapeHtml(finalCity)}</b>`;

    const telegramMessage = `
👑 <b>[طلب وصول مبكر رسمي - VIP SOVEREIGN ACCESS]</b>
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

🌐 <b>الاستخبارات الجغرافية الدقيقة (Radical Location Intelligence):</b>
• الموقع الجغرافي: ${locationSummary}
• عنوان الآي بي (IP): <code>${escapeHtml(finalIp)}</code>
• مزود خدمة الإنترنت (ISP): <b>${escapeHtml(finalIsp)}</b> ${finalAsn ? `(<code>${escapeHtml(finalAsn)}</code>)` : ''}
• فحص الأمان والشبكة: ${vpnStatus}
• دقة ومصدر التحديد: <i>${escapeHtml(locationConfidence)}</i>
${hasValidCoords ? `• الإحداثيات الدقيقة: <code>${finalLat}, ${finalLon}</code>` : ''}

📱 <b>استخبارات الجوال والعتاد السيبراني (Mobile Silicon Intelligence):</b>
• المُصنّع والطراز: ${phoneInfo}
• الرمز الكودي المعتمد (Model Code): <code>${escapeHtml(telemetry.modelCode || 'N/A')}</code>
• سنة الإصدار / حالة الاعتماد: <b>${telemetry.releaseYear || '2025'} (${escapeHtml(telemetry.marketStatus || 'معتمد تجارياً')})</b>
• المعالج ورقاقة النظام (SoC): <b>${chipsetDesc}</b>
• نظام التشغيل: <b>${escapeHtml(telemetry.osName || 'Unknown')} ${escapeHtml(telemetry.osVersion || '')}</b>
• مصفوفة الشاشة والدقة: <b>${screenRes}</b> | <b>${escapeHtml(telemetry.colorGamut || 'sRGB')}</b>
• كارت الشاشة (GPU): <code>${escapeHtml(telemetry.gpuRenderer || 'N/A')}</code>
• الذاكرة والأداء: <b>${cpuRam}</b>
• حالة البطارية: <b>${batteryInfo}</b>
• البصمة السيبرانية الموحدة: <code>${escapeHtml(clientMasterHash || 'N/A')}</code>
• معرف الزائر الفريد: <code>${escapeHtml(clientVisitorId || 'N/A')}</code>
━━━━━━━━━━━━━━━━━━━━━
⚡ <b>إجراء الرئيس التنفيذي محمد مطعني المباشر (1-Tap Approval):</b>
`;

    // 11. Build Inline Keyboard for 1-Tap CEO Approval in Telegram
    const approveUrl = `https://matany.one/api/early-access-action?id=${requestId}&secret=${approvalSecret}&intent=approve`;
    const rejectUrl = `https://matany.one/api/early-access-action?id=${requestId}&secret=${approvalSecret}&intent=reject`;

    const inlineKeyboard: any[][] = [
      [
        { text: '✅ قبول ومنح الوصول الفوري (Approve)', url: approveUrl },
        { text: '❌ رفض الطلب نهائياً (Reject)', url: rejectUrl },
      ],
    ];

    if (mapsUrl) {
      inlineKeyboard.push([{ text: '📍 خرائط جوجل الدقيقة', url: mapsUrl }]);
    }

    // 12. Dispatch to Telegram using Fail-Safe Dispatcher
    const dispatchResult = await dispatchTelegramSafe(PRIMARY_CHAT_ID, telegramMessage, inlineKeyboard);

    // Also dispatch to active chats from getUpdates if primary had an issue or as safety backup
    try {
      const updateRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getUpdates?limit=5`);
      if (updateRes.ok) {
        const updateData = await updateRes.json();
        if (updateData.ok && Array.isArray(updateData.result)) {
          for (const upd of updateData.result) {
            const chat = upd?.message?.chat || upd?.channel_post?.chat;
            if (chat?.id && String(chat.id) !== String(PRIMARY_CHAT_ID)) {
              await dispatchTelegramSafe(chat.id, telegramMessage, inlineKeyboard);
            }
          }
        }
      }
    } catch {}

    return new Response(
      JSON.stringify({
        success: true,
        requestId,
        status: 'pending',
        telegramSent: dispatchResult.ok,
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
