import React from "react";
import { Globe, ExternalLink, Phone, PhoneCall, Mail } from "lucide-react";
import { renderSmartTextWithIcons } from "./smart-icons";

// Regex for Emails (e.g. ahu@asu.edu.eg, contact@domain.com, etc.)
const EMAIL_REGEX = /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/i;

// Regex for URLs & Multi-level Domains (excluding emails)
const URL_REGEX = /(https?:\/\/[^\s<>"'()]+|(?:www\.)[a-zA-Z0-9-]+\.[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:\/[^\s<>"'()]*)?|\b[a-zA-Z0-9-]*[a-zA-Z][a-zA-Z0-9-]*\.(?:[a-zA-Z0-9-]+\.)*(?:com|org|net|gov|edu|mil|info|io|ai|app|dev|link|tech|me|co|xyz|one|online|site|space|store|eg|sa|ae|uk|us|de|fr|ru|cn|jp|in|ca|au|ly|sy|iq|jo|kw|qa|bh|om|ye|sd|ma|dz|tn)(?:\/[^\s<>"'()]*)?\b)/i;

// Regex for Hotlines & Phone numbers (Guaranteed strict non-empty match)
const PHONE_REGEX = /(?:\+?[0-9]{1,4}[\s-]?)?(?:\(0[0-9]{1,3}\)|0[0-9]{1,3})[\s-]?[0-9]{3,4}[\s-]?[0-9]{3,4}|(?:\b1[56789][0-9]{3}\b)|(?:\b0900[0-9]{4,7}\b)|(?:\b0800[0-9]{4,7}\b)|(?:\b01[0125][0-9]{8}\b)/;

// Keywords for AI Detect and Affirmation styling
const AI_KEYWORD_REGEX = /\b(AI[-\s]?DETECT|AI[-\s]?GENERATED)\b|(?:\b(نعم)\b)/;

// Keywords for Meta Data / EXIF styling (Blue & White radiant styling)
const METADATA_KEYWORD_REGEX = /\b(Meta[-\s]?Data|Metadata|EXIF)\b|(?:\b(الميتا\s?داتا|الميتاداتا|ميتا\s?داتا|ميتاداتا)\b)/;

// Keywords for Time Detect (Aurora Multi-Color Temporal styling)
const TIME_KEYWORD_REGEX = /\b(Time[-\s]?Detect|TimeDetect)\b|(?:\b(تايم\s?ديتكت|تايم\s?ديتيكت|استشعار\s?الوقت|استشعار\s?الزمن)\b)/i;

const COMBINED_SCANNER = new RegExp(
  `(${EMAIL_REGEX.source})|(${URL_REGEX.source})|(${PHONE_REGEX.source})|(${AI_KEYWORD_REGEX.source})|(${METADATA_KEYWORD_REGEX.source})|(${TIME_KEYWORD_REGEX.source})`,
  "gi"
);

function isValidEmailToken(str: string): boolean {
  if (!str) return false;
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/i.test(str);
}

function isValidUrlToken(str: string): boolean {
  if (!str) return false;
  if (str.includes("@")) return false;
  if (/^\d+\.?$/.test(str)) return false;
  if (/^https?:\/\//i.test(str)) return true;
  if (/^www\./i.test(str)) return true;
  if (/[a-zA-Z]/.test(str) && /\.(com|org|net|gov|edu|mil|info|io|ai|app|dev|link|tech|me|co|xyz|one|online|site|space|store|eg|sa|ae|uk|us|de|fr|ru|cn|jp|in|ca|au|ly|sy|iq|jo|kw|qa|bh|om|ye|sd|ma|dz|tn)/i.test(str)) {
    return true;
  }
  return false;
}

function isValidPhoneToken(str: string): boolean {
  if (!str) return false;
  if (/[a-zA-Z/.@]/.test(str)) return false;

  const clean = str.replace(/[^\d+]/g, "");
  if (clean.length < 5 || clean.length > 15) return false;

  if (/^1[56789]\d{3}$/.test(clean)) return true;
  if (/^0[89]00\d{4,7}$/.test(clean)) return true;
  if (/^01[0125]\d{8}$/.test(clean) || /^(?:\+20|0020)1[0125]\d{8}$/.test(clean)) return true;
  if (/^(\+|00)\d{8,14}$/.test(clean)) return true;
  if (/^0[2-9]\d{7,8}$/.test(clean)) return true;

  return false;
}

export function renderSmartContentWithLinksAndPhones(
  text: string,
  onUrlClick: (url: string) => void,
  onPhoneClick: (phone: string) => void,
  onEmailClick?: (email: string) => void
): React.ReactNode {
  if (!text || typeof text !== "string") return text;

  COMBINED_SCANNER.lastIndex = 0;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = COMBINED_SCANNER.exec(text)) !== null) {
    const matchedToken = match[0];
    const matchIndex = match.index;

    // Zero-length match safety to prevent browser lockup
    if (!matchedToken || matchedToken.length === 0) {
      COMBINED_SCANNER.lastIndex++;
      continue;
    }

    // Push preceding text
    if (matchIndex > lastIndex) {
      const plainChunk = text.slice(lastIndex, matchIndex);
      parts.push(renderSmartTextWithIcons(plainChunk));
    }

    if (isValidEmailToken(matchedToken)) {
      parts.push(
        <bdi key={`email-${matchIndex}`} className="inline-flex items-center align-middle mx-1">
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onEmailClick?.(matchedToken);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onEmailClick?.(matchedToken);
              }
            }}
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-[#0c1017] hover:bg-[#141b29] border border-sky-500/20 hover:border-sky-500/40 text-zinc-200 hover:text-white font-mono text-xs transition-colors cursor-pointer select-none active:scale-95 group/email"
            title={`انقر لتأكيد مراسلة البريد: ${matchedToken}`}
          >
            <Mail className="size-3 text-sky-400 group-hover/email:text-sky-300 shrink-0" />
            <span className="break-all dir-ltr underline underline-offset-2 text-zinc-200 group-hover/email:text-white font-mono">
              {matchedToken}
            </span>
          </span>
        </bdi>
      );
    } else if (isValidPhoneToken(matchedToken)) {
      const clean = matchedToken.replace(/[^\d]/g, "");
      const isHotline = /^1[56789]\d{3}$/.test(clean) || matchedToken.startsWith("0900") || matchedToken.startsWith("0800");
      parts.push(
        <bdi key={`phone-${matchIndex}`} className="inline-flex items-center align-middle mx-1">
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onPhoneClick(matchedToken);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onPhoneClick(matchedToken);
              }
            }}
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-[#0c120e] hover:bg-[#121c16] border border-emerald-500/20 hover:border-emerald-500/40 text-zinc-200 hover:text-white font-mono text-xs transition-colors cursor-pointer select-none active:scale-95 group/phone"
            title={`انقر لتأكيد الاتصال برقم: ${matchedToken}`}
          >
            {isHotline ? (
              <PhoneCall className="size-3 text-emerald-400 group-hover/phone:text-emerald-300 shrink-0" />
            ) : (
              <Phone className="size-3 text-emerald-400 group-hover/phone:text-emerald-300 shrink-0" />
            )}
            <span className="dir-ltr text-zinc-200 group-hover/phone:text-white font-mono">
              {matchedToken}
            </span>
          </span>
        </bdi>
      );
    } else if (isValidUrlToken(matchedToken)) {
      parts.push(
        <bdi key={`link-${matchIndex}`} className="inline-flex items-center align-middle mx-1">
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onUrlClick(matchedToken);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onUrlClick(matchedToken);
              }
            }}
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-[#0e0e12] hover:bg-[#16161c] border border-white/[0.1] hover:border-white/[0.22] text-zinc-200 hover:text-white font-mono text-xs transition-colors cursor-pointer select-none active:scale-95 group/link"
            title={`انقر لتأكيد الانتقال إلى: ${matchedToken}`}
          >
            <Globe className="size-3 text-zinc-400 group-hover/link:text-zinc-200 shrink-0" />
            <span className="break-all dir-ltr underline underline-offset-2 text-zinc-200 group-hover/link:text-white font-mono">
              {matchedToken}
            </span>
            <ExternalLink className="size-2.5 text-zinc-400 group-hover/link:text-zinc-200 shrink-0" />
          </span>
        </bdi>
      );
    } else if (/^(AI[-\s]?DETECT|AI[-\s]?GENERATED)$/i.test(matchedToken)) {
      parts.push(
        <span
          key={`ai-detect-${matchIndex}`}
          className="inline-flex items-center px-1.5 py-0.5 mx-1 rounded bg-zinc-900 border border-white/10 ai-detect-text font-mono font-black text-xs align-middle select-text"
        >
          {matchedToken}
        </span>
      );
    } else if (/^(Meta[-\s]?Data|Metadata|EXIF|الميتا\s?داتا|الميتاداتا|ميتا\s?داتا|ميتاداتا)$/i.test(matchedToken)) {
      parts.push(
        <span
          key={`metadata-${matchIndex}`}
          className="inline-flex items-center px-1.5 py-0.5 mx-1 rounded bg-zinc-900 border border-sky-400/20 meta-data-text font-mono font-black text-xs align-middle select-text"
        >
          {matchedToken}
        </span>
      );
    } else if (/^(Time[-\s]?Detect|TimeDetect|تايم\s?ديتكت|تايم\s?ديتيكت|استشعار\s?الوقت|استشعار\s?الزمن)$/i.test(matchedToken)) {
      parts.push(
        <span
          key={`timedetect-${matchIndex}`}
          className="inline-flex items-center gap-1 px-2 py-0.5 mx-1 rounded-full time-detect-glass select-text align-middle"
        >
          <span className="time-detect-text font-sans font-black text-xs">
            {matchedToken}
          </span>
        </span>
      );
    } else if (/^نعم$/i.test(matchedToken)) {
      parts.push(
        <span
          key={`na3am-${matchIndex}`}
          className="inline-block px-1.5 py-0.5 mx-0.5 rounded bg-zinc-900 border border-white/10 ai-detect-text font-bold text-sm align-baseline select-text"
        >
          {matchedToken}
        </span>
      );
    } else {
      parts.push(renderSmartTextWithIcons(matchedToken));
    }

    lastIndex = COMBINED_SCANNER.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(renderSmartTextWithIcons(text.slice(lastIndex)));
  }

  return parts;
}
