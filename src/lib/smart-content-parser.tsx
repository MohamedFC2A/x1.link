import React from "react";
import { Globe, ExternalLink, Phone, PhoneCall, Mail } from "lucide-react";
import { renderSmartTextWithIcons } from "./smart-icons";

// Regex for Emails (e.g. ahu@asu.edu.eg, contact@domain.com, etc.)
const EMAIL_REGEX = /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/i;

// Regex for URLs & Multi-level Domains (excluding emails!)
const URL_REGEX = /(https?:\/\/[^\s<>"'()]+|(?:www\.)[a-zA-Z0-9-]+\.[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:\/[^\s<>"'()]*)?|\b[a-zA-Z0-9-]*[a-zA-Z][a-zA-Z0-9-]*\.(?:[a-zA-Z0-9-]+\.)*(?:com|org|net|gov|edu|mil|info|io|ai|app|dev|link|tech|me|co|xyz|one|online|site|space|store|eg|sa|ae|uk|us|de|fr|ru|cn|jp|in|ca|au|ly|sy|iq|jo|kw|qa|bh|om|ye|sd|ma|dz|tn)(?:\/[^\s<>"'()]*)?\b)/i;

// Regex for Hotlines & Phone numbers
const PHONE_REGEX = /(\+?[0-9]{1,4}[\s-]?)?(?:(?:\(0[0-9]{1,3}\)|0[0-9]{1,3})[\s-]?)?[0-9]{3,4}[\s-]?[0-9]{3,4}|(?:\b1[56789][0-9]{3}\b)|(?:\b0900[0-9]{4,7}\b)|(?:\b0800[0-9]{4,7}\b)|(?:\b01[0125][0-9]{8}\b)/;

const COMBINED_SCANNER = new RegExp(
  `(${EMAIL_REGEX.source})|(${URL_REGEX.source})|(${PHONE_REGEX.source})`,
  "gi"
);

function isValidEmailToken(str: string): boolean {
  if (!str) return false;
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/i.test(str);
}

function isValidUrlToken(str: string): boolean {
  if (!str) return false;
  if (str.includes("@")) return false; // Emails are not URLs
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

    // Push preceding text
    if (matchIndex > lastIndex) {
      const plainChunk = text.slice(lastIndex, matchIndex);
      parts.push(renderSmartTextWithIcons(plainChunk));
    }

    if (isValidEmailToken(matchedToken)) {
      parts.push(
        <bdi key={`email-${matchIndex}`} className="inline-flex align-middle mx-1 my-0.5">
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
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#0c1017] hover:bg-[#121824] border border-sky-500/20 hover:border-sky-500/40 text-zinc-200 hover:text-white font-mono text-xs sm:text-sm font-medium transition-colors cursor-pointer select-none active:scale-95 group/email"
            title={`انقر لتأكيد مراسلة البريد: ${matchedToken}`}
          >
            <Mail className="size-3.5 text-sky-400 group-hover/email:text-sky-300 shrink-0 inline-block" />
            <span className="break-all dir-ltr underline underline-offset-2 text-zinc-100 group-hover/email:text-white font-medium">
              {matchedToken}
            </span>
            <span className="text-[10px] font-sans px-1.5 py-0.2 rounded-md bg-sky-500/10 text-sky-400 border border-sky-500/20 font-medium shrink-0">
              بريد
            </span>
          </span>
        </bdi>
      );
    } else if (isValidPhoneToken(matchedToken)) {
      const clean = matchedToken.replace(/[^\d]/g, "");
      const isHotline = /^1[56789]\d{3}$/.test(clean) || matchedToken.startsWith("0900") || matchedToken.startsWith("0800");
      parts.push(
        <bdi key={`phone-${matchIndex}`} className="inline-flex align-middle mx-1 my-0.5">
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
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#0c120e] hover:bg-[#121c16] border border-emerald-500/20 hover:border-emerald-500/40 text-zinc-200 hover:text-white font-mono text-xs sm:text-sm font-semibold transition-colors cursor-pointer select-none active:scale-95 group/phone"
            title={`انقر لتأكيد الاتصال برقم: ${matchedToken}`}
          >
            {isHotline ? (
              <PhoneCall className="size-3.5 text-emerald-400 group-hover/phone:text-emerald-300 shrink-0 inline-block" />
            ) : (
              <Phone className="size-3.5 text-emerald-400 group-hover/phone:text-emerald-300 shrink-0 inline-block" />
            )}
            <span className="dir-ltr text-zinc-100 group-hover/phone:text-white font-mono tracking-wide font-medium">
              {matchedToken}
            </span>
            <span className="text-[10px] font-sans px-1.5 py-0.2 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium shrink-0">
              {isHotline ? "خط ساخن" : "اتصال"}
            </span>
          </span>
        </bdi>
      );
    } else if (isValidUrlToken(matchedToken)) {
      parts.push(
        <bdi key={`link-${matchIndex}`} className="inline-flex align-middle mx-1 my-0.5">
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
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#0e0e12] hover:bg-[#16161c] border border-white/[0.1] hover:border-white/[0.22] text-zinc-200 hover:text-white font-mono text-xs sm:text-sm font-medium transition-colors cursor-pointer select-none active:scale-95 group/link"
            title={`انقر لتأكيد الانتقال إلى: ${matchedToken}`}
          >
            <Globe className="size-3.5 text-zinc-400 group-hover/link:text-zinc-200 shrink-0 inline-block" />
            <span className="break-all dir-ltr underline underline-offset-2 text-zinc-100 group-hover/link:text-white font-medium">
              {matchedToken}
            </span>
            <ExternalLink className="size-2.5 text-zinc-400 group-hover/link:text-zinc-200 shrink-0 inline-block" />
          </span>
        </bdi>
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
