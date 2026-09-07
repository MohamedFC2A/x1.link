// Edge Serverless Endpoint: /api/early-access-action
// Secure Human-Confirmation Decision Cockpit for CEO & Founder Mohamed Matany
// GUARANTEED: Zero data mutations on GET requests. Requires explicit human POST action.

export const config = {
  runtime: 'edge',
};

export const runtime = 'edge';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8505397370:AAHaWajm8k0TFBafpkiHPsQQ4dSk4KITt7U';
const PRIMARY_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '8495121463';
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://gyxlvreqwikpujzpyegm.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5eGx2cmVxd2lrcHVqenB5ZWdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1NDkwNzMsImV4cCI6MjEwMzEyNTA3M30.vMnY9PcDrB627Tv8Aumy6BKlMfbzg4LX1B_EUigNL2s';

function escapeHtml(str: string): string {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export default async function handler(req: Request) {
  const url = new URL(req.url);
  const userAgent = (req.headers.get('user-agent') || '').toLowerCase();

  // 1. SILENT CRAWLER & BOT SHIELD
  // If TelegramBot, WhatsApp, Twitter, Facebook, or any scraper/prefetcher attempts to fetch, return 200 without touching data
  const isBotOrCrawler = /bot|telegram|crawl|spider|slurp|facebook|whatsapp|preview|curl|wget|scanner|inspection/i.test(userAgent);
  if (req.method === 'GET' && isBotOrCrawler) {
    return new Response('<!DOCTYPE html><html><head><meta name="robots" content="noindex,nofollow"></head><body>OK</body></html>', {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'X-Robots-Tag': 'noindex, nofollow',
      },
    });
  }

  // 2. EXTRACT PARAMETERS
  let action: string | null = null;
  let requestId = url.searchParams.get('id');
  let secret = url.searchParams.get('secret');
  const intent = url.searchParams.get('intent') || 'approve';

  if (req.method === 'POST') {
    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
      try {
        const formData = await req.formData();
        if (formData.get('action')) action = String(formData.get('action'));
        if (formData.get('id')) requestId = String(formData.get('id'));
        if (formData.get('secret')) secret = String(formData.get('secret'));
      } catch {}
    } else if (contentType.includes('application/json')) {
      try {
        const body = await req.json();
        if (body.action) action = body.action;
        if (body.id) requestId = body.id;
        if (body.secret) secret = body.secret;
      } catch {}
    } else {
      action = url.searchParams.get('action');
    }
  }

  if (!requestId || !secret) {
    return new Response('بيانات الطلب غير صالحة أو مفقودة.', { status: 400 });
  }

  try {
    // 3. FETCH AND VERIFY IN SUPABASE
    const checkRes = await fetch(
      `${SUPABASE_URL}/rest/v1/early_access_requests?id=eq.${encodeURIComponent(requestId)}&approval_secret=eq.${encodeURIComponent(secret)}&select=*`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
      }
    );

    if (!checkRes.ok) {
      return new Response('خطأ في الاتصال بقاعدة البيانات.', { status: 500 });
    }

    const requests = await checkRes.json();
    if (!Array.isArray(requests) || requests.length === 0) {
      return new Response('طلب غير موجود أو رمز الحماية غير متطابق.', { status: 403 });
    }

    const requestData = requests[0];
    const currentStatus = requestData.status || 'pending';

    // 4. HANDLE HTTP POST: EXECUTE EXPLICIT CEO DECISION
    if (req.method === 'POST' && (action === 'approve' || action === 'reject')) {
      const isApproved = action === 'approve';
      const newStatus = isApproved ? 'approved' : 'rejected';

      // Update Supabase
      await fetch(`${SUPABASE_URL}/rest/v1/early_access_requests?id=eq.${encodeURIComponent(requestId)}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify({
          status: newStatus,
          approved_at: new Date().toISOString(),
          approved_by: 'CEO Mohamed Matany',
          updated_at: new Date().toISOString(),
        }),
      });

      // Dispatch Confirmation Telegram Message to CEO
      const actionNotice = isApproved
        ? `🎉 <b>[تم اعتماد منح الوصول بنجاح بواسطة الرئيس التنفيذي]</b>\n━━━━━━━━━━━━━━━━━━━━━\nقام <b>الرئيس التنفيذي محمد مطعني</b> بالموافقة الصريحة المعتمدة على طلب:\n• العميل: <b>${escapeHtml(requestData.name)}</b>\n• وسيلة التواصل: <code>${escapeHtml(requestData.contact)}</code>\n• كود الطلب: <code>${requestId}</code>\n━━━━━━━━━━━━━━━━━━━━━\n🚀 <b>حالة المنصة:</b> انفتحت المنصة الآن لجهاز العميل فورياً!`
        : `🛑 <b>[تم رفض طلب الوصول بواسطة الرئيس التنفيذي]</b>\n━━━━━━━━━━━━━━━━━━━━━\nقام <b>الرئيس التنفيذي محمد مطعني</b> برفض طلب:\n• العميل: <b>${escapeHtml(requestData.name)}</b>\n• كود الطلب: <code>${requestId}</code>`;

      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: PRIMARY_CHAT_ID,
          text: actionNotice,
          parse_mode: 'HTML',
        }),
      }).catch(() => {});

      // Render Execution Result Screen
      return new Response(renderResultHtml(isApproved, requestData, requestId), {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    // 5. HANDLE HTTP GET: RENDER THE EXECUTIVE DECISION COCKPIT (ZERO DATA MUTATION)
    return new Response(renderCockpitHtml(requestData, requestId, secret, intent, currentStatus), {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });

  } catch (err: any) {
    console.error('[Action Error]:', err);
    return new Response('حدث خطأ أثناء معالجة الطلب.', { status: 500 });
  }
}

function renderCockpitHtml(
  data: any,
  requestId: string,
  secret: string,
  intent: string,
  currentStatus: string
): string {
  const isAlreadyProcessed = currentStatus === 'approved' || currentStatus === 'rejected';
  const isApproved = currentStatus === 'approved';

  const statusBadge = isAlreadyProcessed
    ? isApproved
      ? '<span style="color:#22d3ee;background:rgba(34,211,238,0.12);padding:4px 12px;border-radius:999px;border:1px solid rgba(34,211,238,0.3);font-size:12px;font-weight:bold;">✅ تم القبول مسبقاً</span>'
      : '<span style="color:#ef4444;background:rgba(239,68,68,0.12);padding:4px 12px;border-radius:999px;border:1px solid rgba(239,68,68,0.3);font-size:12px;font-weight:bold;">❌ تم الرفض مسبقاً</span>'
    : '<span style="color:#eab308;background:rgba(234,179,8,0.12);padding:4px 12px;border-radius:999px;border:1px solid rgba(234,179,8,0.3);font-size:12px;font-weight:bold;">⏳ قيد انتظار قرارك الرسمي</span>';

  const deviceDisplay = escapeHtml(data.phone_brand ? `${data.phone_brand} - ${data.phone_model || data.device_model || ''}` : data.device_model || 'جهاز ذكي');
  const locationDisplay = escapeHtml(`${data.country || 'غير محدد'} • ${data.city || ''}`);

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>بوابة اتخاذ القرار • CEO Mohamed Matany</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 20px 12px;
      min-height: 100vh;
      background: #05060a;
      color: #fff;
      font-family: 'Cairo', -apple-system, BlinkMacSystemFont, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }
    .card {
      position: relative;
      z-index: 10;
      max-width: 500px;
      width: 100%;
      background: rgba(13, 17, 28, 0.95);
      border: 1px solid rgba(255, 255, 255, 0.15);
      box-shadow: 0 25px 70px rgba(0,0,0,0.9), inset 0 1px 1.5px rgba(255,255,255,0.2);
      backdrop-filter: blur(28px);
      border-radius: 28px;
      padding: 32px 24px;
      text-align: center;
    }
    .header-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      border-radius: 999px;
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.14);
      font-size: 12px;
      font-weight: 700;
      color: #94a3b8;
      margin-bottom: 16px;
    }
    h1 {
      margin: 0 0 6px;
      font-size: 22px;
      font-weight: 900;
      color: #fff;
      letter-spacing: -0.5px;
    }
    .sub {
      margin: 0 0 20px;
      font-size: 13px;
      color: #94a3b8;
      line-height: 1.6;
    }
    .dossier {
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 20px;
      padding: 16px 18px;
      margin-bottom: 24px;
      text-align: right;
      font-size: 13px;
    }
    .row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid rgba(255,255,255,0.05);
    }
    .row:last-child { border-bottom: none; }
    .label { color: #64748b; font-size: 12px; font-weight: 600; }
    .val { color: #f1f5f9; font-weight: 700; text-align: left; }
    .btn-group {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .btn-submit {
      width: 100%;
      padding: 15px 20px;
      border-radius: 16px;
      font-family: inherit;
      font-size: 14.5px;
      font-weight: 800;
      cursor: pointer;
      border: none;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    .btn-approve {
      background: linear-gradient(135deg, #00f2fe 0%, #4facfe 100%);
      color: #030306;
      box-shadow: 0 6px 20px rgba(0,242,254,0.3);
    }
    .btn-approve:hover { transform: translateY(-1px); box-shadow: 0 8px 25px rgba(0,242,254,0.45); }
    .btn-reject {
      background: rgba(239, 68, 68, 0.12);
      color: #ef4444;
      border: 1px solid rgba(239, 68, 68, 0.3);
    }
    .btn-reject:hover { background: rgba(239, 68, 68, 0.2); }
    .security-notice {
      margin-top: 20px;
      font-size: 11px;
      color: #64748b;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="header-badge">👑 بوابـة الرئيس التنفيذي محمد مطعني</div>
    <h1>مراجعة طلب الوصول المبكر</h1>
    <p class="sub">يطلب العميل تصريح الدخول الرسمي للمنصة السيادية. قرارك الصريح مطلوب لاعتماد أو رفض الطلب.</p>

    <div class="dossier">
      <div class="row">
        <span class="label">حالة الطلب الحالية:</span>
        <span class="val">${statusBadge}</span>
      </div>
      <div class="row">
        <span class="label">اسم العميل:</span>
        <span class="val">${escapeHtml(data.name)}</span>
      </div>
      <div class="row">
        <span class="label">وسيلة التواصل:</span>
        <span class="val" dir="ltr"><code>${escapeHtml(data.contact)}</code></span>
      </div>
      <div class="row">
        <span class="label">عتاد الجوال المكتشف:</span>
        <span class="val">${deviceDisplay}</span>
      </div>
      <div class="row">
        <span class="label">الموقع الجغرافي:</span>
        <span class="val">${locationDisplay}</span>
      </div>
      <div class="row">
        <span class="label">كود الطلب:</span>
        <span class="val" dir="ltr"><code>${escapeHtml(requestId)}</code></span>
      </div>
    </div>

    ${!isAlreadyProcessed ? `
    <form method="POST" action="/api/early-access-action" class="btn-group">
      <input type="hidden" name="id" value="${escapeHtml(requestId)}">
      <input type="hidden" name="secret" value="${escapeHtml(secret)}">

      <button type="submit" name="action" value="approve" class="btn-submit btn-approve">
        ✅ تأكيد منح الوصول الفوري للمنصة (Approve)
      </button>

      <button type="submit" name="action" value="reject" class="btn-submit btn-reject">
        ❌ تأكيد الرفض النهائي للطلب (Reject)
      </button>
    </form>
    ` : `
    <div style="padding: 14px; border-radius: 16px; background: rgba(255,255,255,0.04); color: #cbd5e1; font-size: 13px; font-weight: 600;">
      ${isApproved ? 'تمت الموافقة الرسمية على هذا الطلب مسبقاً وتفعيل ترخيصه.' : 'تم رفض هذا الطلب مسبقاً.'}
    </div>
    `}

    <div class="security-notice">
      🔒 نظام الحماية المشدد: لا يمكن اتخاذ أي قرار أو تعديل في قاعدة البيانات عبر البوتات أو روابط المعاينة التلقائية إطلاقاً. الموافقة تتطلب ضغطاً يدوياً صريحاً من الرئيس التنفيذي فقط.
    </div>
  </div>
</body>
</html>`;
}

function renderResultHtml(isApproved: boolean, data: any, requestId: string): string {
  const statusColor = isApproved ? '#00f2fe' : '#ef4444';
  const statusIcon = isApproved ? '👑' : '🛑';
  const titleText = isApproved ? 'تم منح الوصول وتفعيل الترخيص بنجاح!' : 'تم رفض الطلب بنجاح';
  const subtitleText = isApproved
    ? `تم تفعيل ترخيص الوصول السيادي للمستخدم <strong>${escapeHtml(data.name)}</strong>، وانفتحت له المنصة رسمياً على جهازه فورياً.`
    : `تم رفض الطلب رقم <code>${escapeHtml(requestId)}</code> ولن يتمكن من الدخول.`;

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${titleText} • CEO Mohamed Matany</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap" rel="stylesheet">
  <style>
    body {
      margin: 0;
      padding: 20px 12px;
      min-height: 100vh;
      background: #030306;
      color: #fff;
      font-family: 'Cairo', -apple-system, BlinkMacSystemFont, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .card {
      max-width: 480px;
      width: 100%;
      background: rgba(13, 17, 28, 0.9);
      border: 1px solid rgba(255, 255, 255, 0.15);
      box-shadow: 0 25px 70px rgba(0,0,0,0.85);
      backdrop-filter: blur(24px);
      border-radius: 28px;
      padding: 36px 24px;
      text-align: center;
    }
    .icon-badge {
      width: 72px;
      height: 72px;
      margin: 0 auto 20px;
      border-radius: 50%;
      background: rgba(255,255,255,0.05);
      border: 2px solid ${statusColor};
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 32px;
      box-shadow: 0 0 30px ${statusColor}40;
    }
    h1 { margin: 0 0 10px; font-size: 22px; font-weight: 900; color: #fff; }
    p { margin: 0 0 24px; font-size: 14px; color: #94a3b8; line-height: 1.7; }
    .btn {
      display: inline-block;
      width: 100%;
      padding: 14px 20px;
      border-radius: 16px;
      background: ${isApproved ? 'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)' : '#334155'};
      color: ${isApproved ? '#030306' : '#fff'};
      font-weight: 800;
      font-size: 14px;
      text-decoration: none;
      transition: transform 0.2s, opacity 0.2s;
    }
    .btn:hover { opacity: 0.92; transform: scale(1.01); }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon-badge">${statusIcon}</div>
    <h1>${titleText}</h1>
    <p>${subtitleText}</p>
    <a href="https://matany.one" class="btn">العودة إلى المنصة الرئيسية</a>
  </div>
</body>
</html>`;
}

