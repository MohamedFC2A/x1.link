import React from "react";
import { Globe, ExternalLink, Phone, PhoneCall } from "lucide-react";
import { renderSmartTextWithIcons } from "./smart-icons";

// Regex for URLs & Multi-level Domains (e.g. tansik.egypt.gov.eg, https://..., matany.one, www.gov.eg, moe.gov.eg)
const URL_PATTERN = /(https?:\/\/[^\s<>"'()]+|(?:www\.)[a-zA-Z0-9-]+\.[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:\/[^\s<>"'()]*)?|\b[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.(?:com|org|net|gov|edu|mil|info|io|ai|app|dev|link|tech|me|co|xyz|one|online|site|space|store|eg|sa|ae|uk|us|de|fr|ru|cn|jp|in|ca|au|ly|sy|iq|jo|kw|qa|bh|om|ye|sd|ma|dz|tn)(?:\.[a-zA-Z]{2,})?(?:\/[^\s<>"'()]*)?\b)/i;

// Regex for Hotlines & Phone Numbers (e.g. 09007111, 19xxx, 16xxx, 010xxxxxxxx, +2010xxxxxxxx, 0800xxxxxx)
const PHONE_PATTERN = /(\+?[0-9]{1,4}[\s-]?)?(?:(?:\(0[0-9]{1,3}\)|0[0-9]{1,3})[\s-]?)?[0-9]{3,4}[\s-]?[0-9]{3,4}|(?:\b1[56789][0-9]{3}\b)|(?:\b0900[0-9]{4,7}\b)|(?:\b0800[0-9]{4,7}\b)|(?:\b01[0125][0-9]{8}\b)/;

// Combined Scanner
const COMBINED_SCANNER = new RegExp(
  `(${URL_PATTERN.source})|(${PHONE_PATTERN.source})`,
  "gi"
);

function isValidPhoneNumber(str: string): boolean {
  if (!str) return false;
  // If it contains domain dots or slashes, it's a URL not a phone
  if (str.includes(".") || str.includes("/") || str.includes("www") || str.includes("http")) return false;

  const clean = str.replace(/[^\d+]/g, "");
  // Must be between 5 and 15 digits
  if (clean.length < 5 || clean.length > 15) return false;

  // Short Egyptian hotline: 5 digits starting with 15, 16, 17, 18, 19
  if (/^1[56789]\d{3}$/.test(clean)) return true;

  // Egyptian Toll Free / Premium Rate: 0900xxxx or 0800xxxx
  if (/^0[89]00\d{4,7}$/.test(clean)) return true;

  // Egyptian Mobile: 010, 011, 012, 015 + 8 digits
  if (/^01[0125]\d{8}$/.test(clean) || /^(?:\+20|0020)1[0125]\d{8}$/.test(clean)) return true;

  // International format: starts with + or 00 and length >= 8
  if (/^(\+|00)\d{8,14}$/.test(clean)) return true;

  // Landline with area code: 02, 03, etc. + 7-8 digits (length 9-10)
  if (/^0[2-9]\d{7,8}$/.test(clean)) return true;

  return false;
}

export function renderSmartContentWithLinksAndPhones(
  text: string,
  onUrlClick: (url: string) => void,
  onPhoneClick: (phone: string) => void
): React.ReactNode {
  if (!text || typeof text !== "string") return text;

  // Reset regex state
  COMBINED_SCANNER.lastIndex = 0;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = COMBINED_SCANNER.exec(text)) !== null) {
    const matchedToken = match[0];
    const matchIndex = match.index;

    // Push preceding plain text
    if (matchIndex > lastIndex) {
      const plainChunk = text.slice(lastIndex, matchIndex);
      parts.push(renderSmartTextWithIcons(plainChunk));
    }

    // Check if it is a phone / hotline
    if (isValidPhoneNumber(matchedToken)) {
      const isHotline = /^1[56789]\d{3}$/.test(matchedToken.replace(/[^\d]/g, "")) || matchedToken.startsWith("0900") || matchedToken.startsWith("0800");
      parts.push(
        <span
          key={`phone-${matchIndex}`}
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
          className="inline-flex items-center gap-1.5 px-3 py-1 my-0.5 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-500/40 hover:border-emerald-400/80 text-white font-mono text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow-lg mx-1 align-baseline select-none active:scale-95 group/phone backdrop-blur-2xl hover:shadow-[0_0_20px_rgba(16,185,129,0.3)]"
          title={`انقر لتأكيد الاتصال برقم: ${matchedToken}`}
        >
          {isHotline ? (
            <PhoneCall className="size-3.5 text-emerald-400 group-hover/phone:text-emerald-300 shrink-0 inline-block" />
          ) : (
            <Phone className="size-3.5 text-emerald-400 group-hover/phone:text-emerald-300 shrink-0 inline-block" />
          )}
          <span className="dir-ltr text-emerald-100 group-hover/phone:text-white font-mono tracking-wide font-bold">
            {matchedToken}
          </span>
          <span className="text-[10px] font-sans px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 font-medium shrink-0">
            {isHotline ? "خط ساخن" : "اتصال"}
          </span>
        </span>
      );
    } else {
      // It is a URL / Domain
      parts.push(
        <span
          key={`link-${matchIndex}`}
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
          className="inline-flex items-center gap-1.5 px-3 py-1 my-0.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.18] border border-white/[0.18] hover:border-white/40 text-white font-mono text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow-lg mx-1 align-baseline select-none active:scale-95 group/link backdrop-blur-2xl hover:shadow-[0_0_20px_rgba(255,255,255,0.12)]"
          title={`انقر لتأكيد الانتقال إلى: ${matchedToken}`}
        >
          <Globe className="size-3.5 text-zinc-300 group-hover/link:text-white shrink-0 inline-block" />
          <span className="break-all dir-ltr underline underline-offset-2 text-white font-semibold">
            {matchedToken}
          </span>
          <ExternalLink className="size-2.5 opacity-80 group-hover/link:opacity-100 text-zinc-300 group-hover/link:text-white shrink-0 inline-block" />
        </span>
      );
    }

    lastIndex = COMBINED_SCANNER.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(renderSmartTextWithIcons(text.slice(lastIndex)));
  }

  return parts;
}
