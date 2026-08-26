import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, Globe, X, Copy, Check, ArrowUpRight } from "lucide-react";
import { getFaviconUrl } from "@/lib/utils";

interface LinkConfirmModalProps {
  url: string | null;
  onClose: () => void;
}

export const LinkConfirmModal: React.FC<LinkConfirmModalProps> = ({ url, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || typeof document === "undefined") return null;

  let domain = "";
  if (url) {
    try {
      const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
      domain = parsed.hostname;
    } catch {
      domain = url.split("/")[0];
    }
  }

  const faviconUrl = domain && url ? getFaviconUrl(url.startsWith("http") ? url : `https://${url}`) : null;

  const handleCopy = () => {
    if (!url) return;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConfirm = () => {
    if (!url) return;
    const finalUrl = url.startsWith("http://") || url.startsWith("https://") ? url : `https://${url}`;
    window.open(finalUrl, "_blank", "noopener,noreferrer");
    onClose();
  };

  return createPortal(
    <AnimatePresence>
      {url && (
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-150 select-none"
          onClick={onClose}
          dir="rtl"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 15 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md rounded-3xl bg-[#09090b]/95 border border-white/[0.16] p-5 sm:p-6 shadow-[0_0_50px_rgba(0,0,0,0.8)] backdrop-blur-2xl text-right overflow-hidden"
          >
            {/* Top Bar with Close Button */}
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2.5 text-zinc-100 font-sans font-semibold text-sm sm:text-base">
                <div className="size-8 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                  <ShieldAlert className="size-4 text-amber-400" />
                </div>
                <span>تأكيد الانتقال لرابط خارجي</span>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="size-8 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Body Information */}
            <div className="py-4 space-y-3.5">
              <p className="text-xs sm:text-sm text-zinc-300 font-sans leading-relaxed">
                أنت على وشك مغادرة المنصة والتوجه إلى الموقع الخارجي التالي. هل ترغب في المتابعة والانتقال؟
              </p>

              {/* Target URL Display Card */}
              <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-white/[0.1] backdrop-blur-xl space-y-2">
                <div className="flex items-center justify-between text-xs text-zinc-400 font-sans">
                  <div className="flex items-center gap-1.5 font-medium text-zinc-200">
                    {faviconUrl ? (
                      <img
                        src={faviconUrl}
                        alt={domain}
                        className="size-3.5 object-contain rounded"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <Globe className="size-3.5 text-zinc-400" />
                    )}
                    <span className="font-mono text-[11px] sm:text-xs text-zinc-200">{domain}</span>
                  </div>

                  <button
                    type="button"
                    onClick={handleCopy}
                    className="flex items-center gap-1 text-[10px] font-sans px-2 py-0.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.14] text-zinc-300 hover:text-white transition-colors cursor-pointer"
                    title="نسخ الرابط"
                  >
                    {copied ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
                    <span>{copied ? "تم النسخ" : "نسخ"}</span>
                  </button>
                </div>

                <div className="font-mono text-xs text-zinc-200 break-all bg-black/70 p-2.5 rounded-xl border border-white/[0.08] select-text text-left dir-ltr">
                  {url}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300 hover:text-white text-xs sm:text-sm font-sans font-medium transition-colors cursor-pointer"
              >
                إلغاء
              </button>

              <button
                type="button"
                onClick={handleConfirm}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-white text-zinc-950 hover:bg-zinc-200 text-xs sm:text-sm font-sans font-semibold transition-all cursor-pointer shadow-lg active:scale-95"
              >
                <span>متابعة الانتقال</span>
                <ArrowUpRight className="size-4 stroke-[2.5]" />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};
