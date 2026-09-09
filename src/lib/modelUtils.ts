import { ModelType } from '../types';

export function getModelDisplayName(model?: string, isX1?: boolean): string {
  if (isX1) return 'matany.one (X1 MAX)';
  if (!model) return 'Fathom Quant 3';

  switch (model) {
    case 'fathom-quant-3':
      return 'Fathom Quant 3';
    case 'deepseek-v4-flash':
      return 'Fathom 1.1';
    case 'deepseek-v4-flash-cyber-2.6':
      return 'Fathom Cyber Flash 2.6';
    case 'deepseek-v4-pro-cyber-2.6':
    case 'deepseek-v4-pro-cyber-2.1':
      return 'Fathom Cyber Ultra 2.6';
    case 'deepseek-v4-flash-cyber-2.1':
      return 'Fathom Cyber Flash 2.6';
    case 'deepseek-v4-flash-cyber':
      return 'Fathom Cyber';
    case 'deepseek-v4-flash-vision-exp':
      return 'Fathom Cam';
    case 'meta/muse-spark-1.2-contributor':
      return 'Fathom Spark';
    default:
      if (model.includes('quant-3') || model.includes('quant3')) return 'Fathom Quant 3';
      if (model.includes('pro-cyber') || model.includes('cyber-ultra') || model.includes('pro-cyper')) return 'Fathom Cyber Ultra 2.6';
      if (model.includes('flash-cyber') || model.includes('flash-cyper')) return 'Fathom Cyber Flash 2.6';
      if (model.includes('cyber') || model.includes('cyper')) return 'Fathom Cyber';
      if (model.includes('vision') || model.includes('cam')) return 'Fathom Cam';
      if (model.includes('spark')) return 'Fathom Spark';
      return 'Fathom 1.1';
  }
}

export function getModelSubtitle(model?: string, isX1?: boolean): string {
  if (isX1) {
    return 'الوضع غير المقيد (NSFW OFF) مفعّل بكامل طاقته للتحليل والنقد الحر والواقعية المطلقة';
  }
  switch (model) {
    case 'fathom-quant-3':
      return 'استدلال فائق، توليد وتعديل الصور، استوديو SVG، وتحكم بالسيرفر السحابي VPS';
    case 'deepseek-v4-pro-cyber-2.6':
    case 'deepseek-v4-pro-cyber-2.1':
      return 'تفكير استدلالي عميق وهندسة سيبرانية سيادية متقدمة باللغة العربية';
    case 'deepseek-v4-flash-cyber-2.6':
    case 'deepseek-v4-flash-cyber-2.1':
      return 'فحص أمني واستجابة سيبرانية لحظية فائقة السرعة باللغة العربية';
    case 'deepseek-v4-flash-cyber':
      return 'فحص أمني واستخبارات سيبرانية متقدمة واستكشاف الأهداف';
    case 'deepseek-v4-flash-vision-exp':
      return 'تحليل بصري واستكشاف الصور والمستندات بدقة عالية';
    case 'meta/muse-spark-1.2-contributor':
      return 'محرك الوسائط والأكواد: تفكيك الفيديوهات والصوتيات والمستندات';
    case 'deepseek-v4-flash':
    default:
      return 'محادثة عامة ذكية واستيعاب عميق للنصوص والمسائل المتنوعة';
  }
}

export function getModelPlaceholder(
  model?: string,
  isX1?: boolean,
  options?: {
    hasAttachments?: boolean;
    hasNonImageMedia?: boolean;
    isDeepSearch?: boolean;
    activeFusion?: { placeholder: string } | null;
  }
): string {
  if (options?.activeFusion?.placeholder) {
    return options.activeFusion.placeholder;
  }
  if (options?.isDeepSearch) {
    return 'ابحث في الويب مباشرة مع Fathom Search...';
  }
  if (options?.hasNonImageMedia) {
    return 'محرك Fathom Spark: حلل الفيديوهات، استمع للصوتيات، وافحص المستندات...';
  }
  if (options?.hasAttachments) {
    return 'اسأل Fathom Cam أو أرفق صورة للتحليل البصري...';
  }
  if (isX1) {
    return 'اسأل matany.one في أي شيء (الوضع غير المقيد مفعّل)...';
  }
  switch (model) {
    case 'fathom-quant-3':
      return 'اسأل Fathom Quant 3، صمم أو عدل صوراً، أو تحكم بالسيرفر السحابي VPS...';
    case 'deepseek-v4-flash-cyber-2.6':
    case 'deepseek-v4-flash-cyber-2.1':
      return 'اسأل Fathom Cyber Flash 2.6 أو افحص أمنياً بشكل خاطف...';
    case 'deepseek-v4-pro-cyber-2.6':
    case 'deepseek-v4-pro-cyber-2.1':
      return 'اطرح لغزاً، مسألة معقدة، أو افحص أمنياً مع Fathom Cyber Ultra...';
    case 'deepseek-v4-flash-cyber':
      return 'أدخل رابط الهدف أو اسأل استخباراتياً مع Fathom Cyber...';
    case 'deepseek-v4-flash-vision-exp':
      return 'اسأل Fathom Cam أو أرفق صورة للتحليل البصري...';
    case 'meta/muse-spark-1.2-contributor':
      return 'محرك Fathom Spark: حلل الفيديوهات، استمع للصوتيات، وافحص المستندات...';
    case 'deepseek-v4-flash':
    default:
      return 'اسأل Fathom 1.1 في أي شيء...';
  }
}
