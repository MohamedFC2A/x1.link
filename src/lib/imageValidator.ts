/**
 * Fathom Cam Visual Quality & Integrity Validator
 * Rejects corrupted, empty, low-resolution (<64x64), or unreadable images
 * to guarantee pristine optical perception and OCR readability for Fathom Cam.
 */

export interface ImageValidationResult {
  valid: boolean;
  reason?: string;
  width?: number;
  height?: number;
  size?: number;
}

export const MIN_IMAGE_DIMENSION = 64;
export const MIN_TOTAL_PIXELS = 8192; // e.g. 64x128 or 90x91
export const MIN_FILE_BYTES = 512;

/**
 * Validates a file or data URL for optical processing by Fathom Cam
 */
export async function validateImageFileForFathomCam(file: File): Promise<ImageValidationResult> {
  // 1. File size check: reject 0-byte or stub files
  if (!file || file.size < MIN_FILE_BYTES) {
    return {
      valid: false,
      reason: `حجم ملف الصورة صغير جداً أو فارغ (${file ? file.size : 0} بايت). الحد الأدنى المطلوب هو ${MIN_FILE_BYTES} بايت لضمان عدم تلف البيانات.`,
      size: file ? file.size : 0
    };
  }

  // 2. MIME type check
  if (file.type && !file.type.startsWith('image/')) {
    return {
      valid: false,
      reason: `نوع الملف غير مدعوم كصورة (${file.type}).`,
      size: file.size
    };
  }

  // 3. Decoding and dimensional verification
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const dataUrl = (e.target?.result as string) || '';
      if (!dataUrl || dataUrl.length < 100) {
        resolve({
          valid: false,
          reason: 'بيانات الصورة فارغة أو تالفة وغير قابلة للقراءة.',
          size: file.size
        });
        return;
      }

      const img = new Image();
      img.onload = () => {
        const width = img.naturalWidth || 0;
        const height = img.naturalHeight || 0;
        const totalPixels = width * height;

        if (width < MIN_IMAGE_DIMENSION || height < MIN_IMAGE_DIMENSION) {
          resolve({
            valid: false,
            reason: `دقة الصورة منعدمة أو صغيرة جداً (${width}×${height} بكسل). الحد الأدنى المطلوب لأبعاد الصورة هو ${MIN_IMAGE_DIMENSION}×${MIN_IMAGE_DIMENSION} بكسل لتتمكن عين Fathom Cam من تحليلها.`,
            width,
            height,
            size: file.size
          });
          return;
        }

        if (totalPixels < MIN_TOTAL_PIXELS) {
          resolve({
            valid: false,
            reason: `مساحة الصورة البصرية ضعيفة جداً (${totalPixels} بكسل إجمالي). الحد الأدنى المطلوب هو ${MIN_TOTAL_PIXELS} بكسل.`,
            width,
            height,
            size: file.size
          });
          return;
        }

        resolve({
          valid: true,
          width,
          height,
          size: file.size
        });
      };

      img.onerror = () => {
        resolve({
          valid: false,
          reason: 'فشل فك ترميز ملف الصورة؛ الملف معطوب أو تالف ولا يمكن لعين Fathom Cam قراءته وفحصه.',
          size: file.size
        });
      };

      img.src = dataUrl;
    };

    reader.onerror = () => {
      resolve({
        valid: false,
        reason: 'تعذر قراءة بيانات ملف الصورة من القرص بسبب خطأ في الإدخال/الإخراج.',
        size: file.size
      });
    };

    reader.readAsDataURL(file);
  });
}
