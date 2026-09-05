/**
 * Sovereign VPS & Cloud Computer Intent Detection & Constants
 * Safe to import across Edge, Browser, and Node.js environments.
 */

export const VPS_STATUS_NOTICE = 'يتم الان الوصول للكمبيوتر والاوامر السحابية';

export function isVpsOrCloudRequest(text: string): boolean {
  if (!text || typeof text !== 'string') return false;
  const lower = text.toLowerCase().trim();

  // 1. Explicit Exclusions: General Windows CMD, PowerShell, local PC cleanups, or informational syntax inquiries
  const isGeneralLocalCmdOrInfo = (
    /(?:تنظيف\s*ملفات\s*الجهاز|تنظيف\s*الجهاز|تنظيف\s*الويندوز|تسريع\s*الجهاز|cleanmgr|temp|%temp%|prefetch|sfc\s*\/scannow|dism|chkdsk)/i.test(lower) ||
    (/(?:ما\s*هو\s*أمر|ماهو\s*أمر|ما\s*هو\s*امر|ماهو\s*امر|شرح\s*أمر|شرح\s*امر|أمر\s*في\s*cmd|امر\s*في\s*cmd|في\s*cmd|على\s*cmd|بـ\s*cmd|cmd\s*command|كيف\s*افتح\s*cmd)/i.test(lower) &&
     !/(?:على|في|عبر|من|بـ)?\s*(?:السيرفر|الخادم|الـ\s*vps|vps|الكمبيوتر\s+السحابي|104\.207\.77\.162)/i.test(lower))
  );

  if (isGeneralLocalCmdOrInfo) {
    return false;
  }

  // 2. Direct Target & Management Identifiers
  if (
    lower.includes('104.207.77.162') ||
    lower.includes('upstore-bot') ||
    lower.includes('upstore-promoter') ||
    /(?:pm2\s*(?:stop|start|restart|list|status|logs|monit|delete|reload|في|على)?|pm2-logrotate)/i.test(lower)
  ) {
    return true;
  }

  // 3. Explicit Remote Server Execution & Cyber Security Testing Patterns
  const hasServerTarget = /(?:سيرفر|السيرفر|الخادم|خادم|vps|الـ\s*vps|كمبيوتر\s*سحابي|الكمبيوتر\s*السحابي|بيئة\s*سحابية|البيئة\s*السحابية|104\.207\.77\.162|ssh)/i.test(lower);

  const hasRemoteAction = /(?:نفذ|شغل|جرب|افحص|اختبر|افتح|ادخل|ارفع|نزل|حمل|تحقق|اعمل|أوقف|اوقف|استئناف|restart|reboot|run|exec|execute|scan|audit|test|deploy|debug|terminal|طرفية|غرفة\s*التحكم|مساحة|استهلاك|رام|ram|معالج|cpu|هارد|ديسك|بورتات|منافذ|بوت|أتمتة|اتمتة|عمليات|سجلات|logs|uptime)/i.test(lower);

  const isCyberSecurityVpsIntent = /(?:فحص\s*الثغرات|اختبار\s*الاختراق|فحص\s*المنافذ|بورتات|nmap|curl|ping|traceroute|بايلود|payload|reverse\s*shell|bash\s*script|سكريبت\s*باش|هجوم\s*سيبراني|فحص\s*امني|فحص\s*أمني)/i.test(lower) && hasServerTarget;

  if (hasServerTarget && hasRemoteAction) {
    return true;
  }

  if (isCyberSecurityVpsIntent) {
    return true;
  }

  // 4. Specific Cloud Control Room Requests
  if (/(?:غرفة\s*التحكم\s*بالسيرفر|غرفة\s*تحكم\s*السيرفر|لوحة\s*تحكم\s*السيرفر|التحكم\s*في\s*السيرفر|التحكم\s*بالخادم|sovereign\s*vps)/i.test(lower)) {
    return true;
  }

  return false;
}
