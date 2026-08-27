import ExifReader from 'exifreader';

export type ForensicsRiskLevel = 'SAFE' | 'LOW' | 'WARNING' | 'CRITICAL';

export interface ForensicsSecurityFinding {
  level: 'INFO' | 'WARNING' | 'CRITICAL';
  title: string;
  description: string;
  recommendation?: string;
}

export interface CameraOpticsData {
  make?: string;
  model?: string;
  software?: string;
  lensModel?: string;
  lensMake?: string;
  serialNumber?: string;
  lensSerialNumber?: string;
  iso?: string | number;
  exposureTime?: string;
  aperture?: string;
  focalLength?: string;
  focalLength35mm?: string;
  flash?: string;
  whiteBalance?: string;
  meteringMode?: string;
  exposureProgram?: string;
  orientation?: string;
  digitalZoomRatio?: string;
}

export interface GeolocationData {
  hasGps: boolean;
  latitude?: number;
  longitude?: number;
  latitudeRef?: string;
  longitudeRef?: string;
  formattedCoordinates?: string;
  altitudeMeters?: number;
  altitudeFeet?: number;
  altitudeRef?: string;
  gpsTimestamp?: string;
  googleMapsUrl?: string;
  appleMapsUrl?: string;
  openStreetMapUrl?: string;
}

export interface MetadataRightsData {
  artist?: string;
  creator?: string;
  copyright?: string;
  title?: string;
  description?: string;
  softwareHistory?: string;
  createDate?: string;
  modifyDate?: string;
  originalDate?: string;
  offsetTime?: string;
}

export interface RawTagItem {
  name: string;
  category: 'EXIF' | 'IPTC' | 'XMP' | 'MakerNotes' | 'File' | 'ICC' | 'JFIF' | 'Other';
  value: string;
  description?: string;
}

export interface ImageForensicsResult {
  fileName: string;
  fileSize: number;
  fileType: string;
  mimeType: string;
  imageWidth?: number;
  imageHeight?: number;
  megapixels?: string;
  colorSpace?: string;
  camera: CameraOpticsData;
  gps: GeolocationData;
  rights: MetadataRightsData;
  security: {
    riskLevel: ForensicsRiskLevel;
    riskScore: number; // 0 (safe) to 100 (critical)
    summary: string;
    findings: ForensicsSecurityFinding[];
  };
  rawTags: RawTagItem[];
  hasAnyMetadata: boolean;
  forensicPromptContext: string;
}

/**
 * Converts a base64 Data URL, Blob, or File into an ArrayBuffer
 */
export async function fileOrDataUrlToArrayBuffer(input: File | Blob | string): Promise<{ buffer: ArrayBuffer; fileName: string; fileSize: number; mimeType: string }> {
  if (typeof input === 'string') {
    // Base64 Data URL or HTTP URL
    if (input.startsWith('data:')) {
      const mimeMatch = input.match(/^data:([^;]+);base64,/);
      const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
      const base64Data = input.replace(/^data:[^;]+;base64,/, '');
      const binaryString = atob(base64Data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return {
        buffer: bytes.buffer,
        fileName: 'image_' + Date.now() + '.' + (mimeType.split('/')[1] || 'jpg'),
        fileSize: len,
        mimeType
      };
    } else {
      const response = await fetch(input);
      const blob = await response.blob();
      const buffer = await blob.arrayBuffer();
      return {
        buffer,
        fileName: 'downloaded_image',
        fileSize: blob.size,
        mimeType: blob.type || 'image/jpeg'
      };
    }
  } else {
    // File or Blob
    const buffer = await input.arrayBuffer();
    return {
      buffer,
      fileName: (input as File).name || 'image_' + Date.now(),
      fileSize: input.size,
      mimeType: input.type || 'image/jpeg'
    };
  }
}

/**
 * Helper to safely extract string description or value from an ExifReader tag
 */
function getTagString(tag: any): string | undefined {
  if (!tag) return undefined;
  if (tag.description !== undefined && tag.description !== null && tag.description !== '') {
    return String(tag.description).trim();
  }
  if (tag.value !== undefined && tag.value !== null) {
    if (Array.isArray(tag.value)) {
      return tag.value.map((v: any) => (typeof v === 'object' ? JSON.stringify(v) : String(v))).join(', ');
    }
    return String(tag.value).trim();
  }
  return undefined;
}

/**
 * Parses GPS coordinates accurately from ExifReader tags into decimal latitude & longitude
 */
function parseGpsCoordinates(tags: any): GeolocationData {
  const gpsResult: GeolocationData = {
    hasGps: false
  };

  const latTag = tags.GPSLatitude || tags['GPS Latitude'] || tags.latitude;
  const latRefTag = tags.GPSLatitudeRef || tags['GPS Latitude Ref'];
  const lonTag = tags.GPSLongitude || tags['GPS Longitude'] || tags.longitude;
  const lonRefTag = tags.GPSLongitudeRef || tags['GPS Longitude Ref'];
  const altTag = tags.GPSAltitude || tags['GPS Altitude'] || tags.altitude;
  const altRefTag = tags.GPSAltitudeRef || tags['GPS Altitude Ref'];
  const dateTag = tags.GPSDateStamp || tags['GPS Date Stamp'];
  const timeTag = tags.GPSTimeStamp || tags['GPS Time Stamp'];

  if (!latTag || !lonTag) {
    return gpsResult;
  }

  let lat: number | undefined;
  let lon: number | undefined;

  // Case 1: ExifReader parsed decimal description
  if (latTag.description !== undefined && typeof latTag.description === 'number') {
    lat = latTag.description;
  } else if (typeof latTag.value === 'number') {
    lat = latTag.value;
  } else if (Array.isArray(latTag.value) && latTag.value.length >= 3) {
    // [deg, min, sec]
    const deg = Number(latTag.value[0]) || 0;
    const min = Number(latTag.value[1]) || 0;
    const sec = Number(latTag.value[2]) || 0;
    lat = deg + min / 60 + sec / 3600;
  } else if (typeof latTag.description === 'string' && !isNaN(parseFloat(latTag.description))) {
    lat = parseFloat(latTag.description);
  }

  if (lonTag.description !== undefined && typeof lonTag.description === 'number') {
    lon = lonTag.description;
  } else if (typeof lonTag.value === 'number') {
    lon = lonTag.value;
  } else if (Array.isArray(lonTag.value) && lonTag.value.length >= 3) {
    const deg = Number(lonTag.value[0]) || 0;
    const min = Number(lonTag.value[1]) || 0;
    const sec = Number(lonTag.value[2]) || 0;
    lon = deg + min / 60 + sec / 3600;
  } else if (typeof lonTag.description === 'string' && !isNaN(parseFloat(lonTag.description))) {
    lon = parseFloat(lonTag.description);
  }

  const latRef = getTagString(latRefTag)?.toUpperCase() || (lat && lat < 0 ? 'S' : 'N');
  const lonRef = getTagString(lonRefTag)?.toUpperCase() || (lon && lon < 0 ? 'W' : 'E');

  if (lat !== undefined && lon !== undefined && !isNaN(lat) && !isNaN(lon)) {
    // Apply directional sign
    if (latRef.includes('S') && lat > 0) lat = -lat;
    if (lonRef.includes('W') && lon > 0) lon = -lon;

    gpsResult.hasGps = true;
    gpsResult.latitude = Number(lat.toFixed(6));
    gpsResult.longitude = Number(lon.toFixed(6));
    gpsResult.latitudeRef = latRef;
    gpsResult.longitudeRef = lonRef;
    gpsResult.formattedCoordinates = `${Math.abs(gpsResult.latitude)}° ${gpsResult.latitude >= 0 ? 'N' : 'S'}, ${Math.abs(gpsResult.longitude)}° ${gpsResult.longitude >= 0 ? 'E' : 'W'}`;

    // Altitude
    if (altTag) {
      let altVal: number | undefined;
      if (typeof altTag.description === 'number') altVal = altTag.description;
      else if (typeof altTag.value === 'number') altVal = altTag.value;
      else if (typeof altTag.description === 'string') altVal = parseFloat(altTag.description);

      if (altVal !== undefined && !isNaN(altVal)) {
        const altRef = getTagString(altRefTag);
        if (altRef && (altRef.includes('Below') || altRef === '1')) {
          altVal = -Math.abs(altVal);
        }
        gpsResult.altitudeMeters = Number(altVal.toFixed(1));
        gpsResult.altitudeFeet = Number((altVal * 3.28084).toFixed(1));
        gpsResult.altitudeRef = altVal >= 0 ? 'Above Sea Level' : 'Below Sea Level';
      }
    }

    // Timestamp
    const dateStr = getTagString(dateTag);
    const timeStr = getTagString(timeTag);
    if (dateStr || timeStr) {
      gpsResult.gpsTimestamp = [dateStr, timeStr].filter(Boolean).join(' ');
    }

    // Map links
    gpsResult.googleMapsUrl = `https://www.google.com/maps?q=${gpsResult.latitude},${gpsResult.longitude}`;
    gpsResult.appleMapsUrl = `https://maps.apple.com/?q=${gpsResult.latitude},${gpsResult.longitude}`;
    gpsResult.openStreetMapUrl = `https://www.openstreetmap.org/?mlat=${gpsResult.latitude}&mlon=${gpsResult.longitude}#map=16/${gpsResult.latitude}/${gpsResult.longitude}`;
  }

  return gpsResult;
}

/**
 * Main Digital Forensics Extraction Engine
 * Fully parses EXIF, IPTC, XMP, MakerNotes, and ICC profile data locally
 */
export async function extractImageForensics(fileOrDataUrl: File | Blob | string): Promise<ImageForensicsResult> {
  const { buffer, fileName, fileSize, mimeType } = await fileOrDataUrlToArrayBuffer(fileOrDataUrl);

  let rawTagsObject: any = {};
  try {
    rawTagsObject = ExifReader.load(buffer, { expanded: true });
  } catch (err: any) {
    try {
      // Fallback to standard flat tag loading
      rawTagsObject = ExifReader.load(buffer);
    } catch (e: any) {
      console.warn('[ExifReader Extract Warning]:', e.message);
    }
  }

  // Flatten and categorize tags
  const rawTags: RawTagItem[] = [];
  const flatTagsLookup: Record<string, any> = {};

  const processCategory = (categoryName: RawTagItem['category'], categoryObj: any) => {
    if (!categoryObj || typeof categoryObj !== 'object') return;
    Object.entries(categoryObj).forEach(([tagName, tagData]: [string, any]) => {
      if (!tagData) return;
      flatTagsLookup[tagName] = tagData;
      const desc = getTagString(tagData);
      if (desc !== undefined) {
        rawTags.push({
          name: tagName,
          category: categoryName,
          value: desc,
          description: tagData.description !== undefined ? String(tagData.description) : undefined
        });
      }
    });
  };

  if (rawTagsObject.exif) processCategory('EXIF', rawTagsObject.exif);
  if (rawTagsObject.iptc) processCategory('IPTC', rawTagsObject.iptc);
  if (rawTagsObject.xmp) processCategory('XMP', rawTagsObject.xmp);
  if (rawTagsObject.makerNotes) processCategory('MakerNotes', rawTagsObject.makerNotes);
  if (rawTagsObject.icc) processCategory('ICC', rawTagsObject.icc);
  if (rawTagsObject.jfif) processCategory('JFIF', rawTagsObject.jfif);
  if (rawTagsObject.file) processCategory('File', rawTagsObject.file);

  // If flat object was returned directly
  if (rawTags.length === 0 && Object.keys(rawTagsObject).length > 0) {
    Object.entries(rawTagsObject).forEach(([k, v]: [string, any]) => {
      if (k === 'exif' || k === 'iptc' || k === 'xmp' || k === 'makerNotes' || k === 'icc' || k === 'jfif' || k === 'file') return;
      flatTagsLookup[k] = v;
      const desc = getTagString(v);
      if (desc !== undefined) {
        rawTags.push({
          name: k,
          category: k.startsWith('GPS') ? 'EXIF' : 'Other',
          value: desc,
          description: v.description !== undefined ? String(v.description) : undefined
        });
      }
    });
  }

  // 1. Camera & Optics Identification
  const camera: CameraOpticsData = {
    make: getTagString(flatTagsLookup.Make || flatTagsLookup.make),
    model: getTagString(flatTagsLookup.Model || flatTagsLookup.model),
    software: getTagString(flatTagsLookup.Software || flatTagsLookup.software || flatTagsLookup.HostComputer),
    lensModel: getTagString(flatTagsLookup.LensModel || flatTagsLookup['Lens Model'] || flatTagsLookup.LensInfo),
    lensMake: getTagString(flatTagsLookup.LensMake || flatTagsLookup['Lens Make']),
    serialNumber: getTagString(flatTagsLookup.BodySerialNumber || flatTagsLookup.SerialNumber || flatTagsLookup['Serial Number']),
    lensSerialNumber: getTagString(flatTagsLookup.LensSerialNumber || flatTagsLookup['Lens Serial Number']),
    iso: getTagString(flatTagsLookup.ISOSpeedRatings || flatTagsLookup.ISO || flatTagsLookup.PhotographicSensitivity),
    exposureTime: getTagString(flatTagsLookup.ExposureTime || flatTagsLookup['Exposure Time'] || flatTagsLookup.ShutterSpeedValue),
    aperture: getTagString(flatTagsLookup.FNumber || flatTagsLookup['F-Number'] || flatTagsLookup.ApertureValue),
    focalLength: getTagString(flatTagsLookup.FocalLength || flatTagsLookup['Focal Length']),
    focalLength35mm: getTagString(flatTagsLookup.FocalLengthIn35mmFormat || flatTagsLookup['Focal Length In 35mm Format']),
    flash: getTagString(flatTagsLookup.Flash || flatTagsLookup.flash),
    whiteBalance: getTagString(flatTagsLookup.WhiteBalance || flatTagsLookup['White Balance']),
    meteringMode: getTagString(flatTagsLookup.MeteringMode || flatTagsLookup['Metering Mode']),
    exposureProgram: getTagString(flatTagsLookup.ExposureProgram || flatTagsLookup['Exposure Program']),
    orientation: getTagString(flatTagsLookup.Orientation || flatTagsLookup.orientation),
    digitalZoomRatio: getTagString(flatTagsLookup.DigitalZoomRatio || flatTagsLookup['Digital Zoom Ratio']),
  };

  // 2. Geolocation & GPS Extraction
  const gps = parseGpsCoordinates(flatTagsLookup);

  // 3. Metadata & Rights Information
  const rights: MetadataRightsData = {
    artist: getTagString(flatTagsLookup.Artist || flatTagsLookup.artist || flatTagsLookup.Byline),
    creator: getTagString(flatTagsLookup.Creator || flatTagsLookup.creator),
    copyright: getTagString(flatTagsLookup.Copyright || flatTagsLookup.copyright || flatTagsLookup.CopyrightNotice),
    title: getTagString(flatTagsLookup.DocumentTitle || flatTagsLookup.Title || flatTagsLookup.ObjectName),
    description: getTagString(flatTagsLookup.ImageDescription || flatTagsLookup.Description || flatTagsLookup.Caption),
    softwareHistory: getTagString(flatTagsLookup.History || flatTagsLookup.SoftwareAgent || flatTagsLookup.CreatorTool),
    originalDate: getTagString(flatTagsLookup.DateTimeOriginal || flatTagsLookup['Date and Time (Original)']),
    createDate: getTagString(flatTagsLookup.DateTimeDigitized || flatTagsLookup.CreateDate || flatTagsLookup['Date and Time (Digitized)']),
    modifyDate: getTagString(flatTagsLookup.DateTime || flatTagsLookup.ModifyDate || flatTagsLookup['Date and Time']),
    offsetTime: getTagString(flatTagsLookup.OffsetTimeOriginal || flatTagsLookup.OffsetTime || flatTagsLookup.TimeZoneOffset),
  };

  // Image Dimensions & Color Space
  const widthVal = flatTagsLookup.ImageWidth?.value || flatTagsLookup['Image Width']?.value || flatTagsLookup.PixelXDimension?.value;
  const heightVal = flatTagsLookup.ImageLength?.value || flatTagsLookup['Image Height']?.value || flatTagsLookup.PixelYDimension?.value;
  const imageWidth = widthVal ? Number(widthVal) : undefined;
  const imageHeight = heightVal ? Number(heightVal) : undefined;
  const megapixels = (imageWidth && imageHeight) ? ( (imageWidth * imageHeight) / 1000000 ).toFixed(2) + ' MP' : undefined;
  const colorSpace = getTagString(flatTagsLookup.ColorSpace || flatTagsLookup['Color Space'] || flatTagsLookup.ProfileDescription);

  // 4. Security Risk & Privacy Analysis Engine
  const findings: ForensicsSecurityFinding[] = [];
  let riskScore = 0;

  if (gps.hasGps && gps.latitude && gps.longitude) {
    riskScore += 65;
    findings.push({
      level: 'CRITICAL',
      title: 'إحداثيات الموقع الجغرافي مكشوفة (Exposed GPS Geolocation)',
      description: `الصورة تحتوي على خطوط الطول والعرض الدقيقة (${gps.formattedCoordinates}) والارتفاع (${gps.altitudeMeters || 0}m)، مما يكشف موقع التصوير بدقة فائقة.`,
      recommendation: 'يُنصح بحذف بيانات EXIF أو استخدام أداة التطهير المدمجة قبل نشر الصورة علناً.'
    });
  }

  if (camera.serialNumber || camera.lensSerialNumber) {
    riskScore += 25;
    findings.push({
      level: 'WARNING',
      title: 'الرقم التسلسلي للجهاز مكشوف (Device / Lens Serial Number)',
      description: `تم اكتشاف الرقم التسلسلي لكاميرا الهاتف أو العدسة (${camera.serialNumber || camera.lensSerialNumber}). يتيح هذا الربط الجنائي بين صور مختلفة تم التقاطها بنفس الجهاز.`,
      recommendation: 'تجريد الميتاداتا لحماية خصوصية الأجهزة والهوية الرقمية للمصور.'
    });
  }

  if (camera.make || camera.model || camera.software) {
    riskScore += 10;
    findings.push({
      level: 'INFO',
      title: 'بصمة الكاميرا ونظام التشغيل (Device Hardware Fingerprint)',
      description: `تم كشف نوع الجهاز المصور (${camera.make || ''} ${camera.model || ''}) وإصدار السوفتوير (${camera.software || 'غير محدد'}).`,
      recommendation: 'معلومات تقنية تفيد في التحليل الرقمي لكنها تكشف عتاد المستخدم.'
    });
  }

  if (rights.originalDate || rights.createDate) {
    riskScore += 10;
    findings.push({
      level: 'INFO',
      title: 'تاريخ وساعة الالتقاط الأصلية (Timestamp Signature)',
      description: `تاريخ الالتقاط مسجل بدقة (${rights.originalDate || rights.createDate}) مع التوقيت الزمني.`,
    });
  }

  if (rights.artist || rights.creator || rights.copyright) {
    findings.push({
      level: 'INFO',
      title: 'بيانات المالك وحقوق الملكية الفكرية (IPTC / Author Profile)',
      description: `المالك أو المصور: ${rights.artist || rights.creator || 'غير محدد'} | الحقوق: ${rights.copyright || 'عامة'}.`
    });
  }

  let riskLevel: ForensicsRiskLevel = 'SAFE';
  if (riskScore >= 60) riskLevel = 'CRITICAL';
  else if (riskScore >= 25) riskLevel = 'WARNING';
  else if (riskScore > 0) riskLevel = 'LOW';

  const hasAnyMetadata = rawTags.length > 0 || Boolean(camera.make || gps.hasGps || rights.originalDate);

  // Generate Structured AI Prompt Context for Fathom Models
  const forensicPromptContext = `
[تقرير الفحص الجنائي الرقمي وميتاداتا الصورة - FATHOM DIGITAL FORENSICS MATRIX]:
• اسم الملف: ${fileName} | الحجم: ${(fileSize / 1024).toFixed(1)} KB | النوع: ${mimeType}
• الأبعاد والدقة: ${imageWidth || '?'}x${imageHeight || '?'} px (${megapixels || 'غير محدد'}) | مساحة الألوان: ${colorSpace || 'sRGB'}
• نوع الكاميرا والجهاز: ${camera.make || 'غير معروف'} ${camera.model || ''} | نظام التشغيل: ${camera.software || 'غير محدد'}
• العدسة والعتاد: ${camera.lensModel || 'عدسة قياسية'} | الرقم التسلسلي: ${camera.serialNumber || 'غير مكشوف'}
• إعدادات التعريض: ISO ${camera.iso || 'تلقائي'} | سرعة الغالق: ${camera.exposureTime || 'غير محدد'} | فتحة العدسة: ${camera.aperture || 'غير محدد'} | البعد البؤري: ${camera.focalLength || 'غير محدد'} (${camera.focalLength35mm || ''})
• التوقيت الزمني للالتقاط: ${rights.originalDate || rights.createDate || 'غير مسجل في EXIF'}
• الموقع الجغرافي (GPS): ${gps.hasGps ? `خط العرض: ${gps.latitude} | خط الطول: ${gps.longitude} (${gps.formattedCoordinates}) | الارتفاع: ${gps.altitudeMeters || 0}m | خرائط جوجل: ${gps.googleMapsUrl}` : 'لا توجد إحداثيات GPS مضمنة (آمن)'}
• مستوى الخطر الأمني للخصوصية: ${riskLevel} (درجة المخاطرة: ${riskScore}/100)
• عدد وسوم الميتاداتا المستخرجة: ${rawTags.length} وسم (EXIF, IPTC, XMP).`.trim();

  return {
    fileName,
    fileSize,
    fileType: mimeType.split('/')[1]?.toUpperCase() || 'IMAGE',
    mimeType,
    imageWidth,
    imageHeight,
    megapixels,
    colorSpace,
    camera,
    gps,
    rights,
    security: {
      riskLevel,
      riskScore: Math.min(100, riskScore),
      summary: gps.hasGps
        ? 'تم اكتشاف إحداثيات GPS وموقع دقيق للصورة مما يشكل خطراً على الخصوصية.'
        : hasAnyMetadata
        ? 'تم استخراج بيانات عتاد الكاميرا والتوقيت بنجاح دون كشف الموقع الجغرافي.'
        : 'الصورة نظيفة وخالية من بيانات EXIF الحساسة.',
      findings
    },
    rawTags,
    hasAnyMetadata,
    forensicPromptContext
  };
}

/**
 * Client-Side Image Sanitizer & EXIF Stripper
 * Redraws the image to an HTML5 Canvas, completely stripping all EXIF, GPS, IPTC, and XMP metadata tags
 */
export async function stripImageMetadata(fileOrDataUrl: File | Blob | string): Promise<{ dataUrl: string; blob: Blob; originalSize: number; newSize: number }> {
  return new Promise(async (resolve, reject) => {
    try {
      let srcUrl = '';
      let origSize = 0;

      if (typeof fileOrDataUrl === 'string') {
        srcUrl = fileOrDataUrl;
        origSize = fileOrDataUrl.length;
      } else {
        srcUrl = URL.createObjectURL(fileOrDataUrl);
        origSize = fileOrDataUrl.size;
      }

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas 2D context unavailable'));
          return;
        }
        ctx.drawImage(img, 0, 0);

        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Failed to generate sanitized image blob'));
            return;
          }
          const reader = new FileReader();
          reader.onloadend = () => {
            if (typeof fileOrDataUrl !== 'string') {
              URL.revokeObjectURL(srcUrl);
            }
            resolve({
              dataUrl: reader.result as string,
              blob,
              originalSize: origSize,
              newSize: blob.size
            });
          };
          reader.readAsDataURL(blob);
        }, 'image/jpeg', 0.96);
      };

      img.onerror = (e) => {
        if (typeof fileOrDataUrl !== 'string') {
          URL.revokeObjectURL(srcUrl);
        }
        reject(new Error('Failed to load image for metadata stripping: ' + String(e)));
      };

      img.src = srcUrl;
    } catch (err) {
      reject(err);
    }
  });
}
