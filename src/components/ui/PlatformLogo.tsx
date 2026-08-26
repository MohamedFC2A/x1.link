import React, { useState } from 'react';
import { Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

export type SupportedPlatform =
  | 'tiktok'
  | 'youtube'
  | 'instagram'
  | 'facebook'
  | 'twitter'
  | 'github'
  | 'reddit'
  | 'linkedin'
  | 'telegram'
  | 'discord'
  | 'pinterest'
  | 'twitch'
  | 'spotify'
  | 'generic';

export interface PlatformDetails {
  platform: SupportedPlatform;
  displayName: string;
  canonicalDomain: string;
}

/**
 * Detects the platform and returns canonical domain and metadata.
 */
export function detectPlatformDetails(urlOrDomain: string): PlatformDetails {
  if (!urlOrDomain) {
    return { platform: 'generic', displayName: 'Website', canonicalDomain: '' };
  }

  const clean = urlOrDomain.toLowerCase().trim();

  // 1. TikTok
  if (
    clean.includes('tiktok.com') ||
    clean.includes('vt.tiktok.com') ||
    clean.includes('vm.tiktok.com') ||
    clean.includes('douyin.com')
  ) {
    return { platform: 'tiktok', displayName: 'TikTok', canonicalDomain: 'tiktok.com' };
  }

  // 2. YouTube
  if (
    clean.includes('youtube.com') ||
    clean.includes('youtu.be') ||
    clean.includes('yt.be') ||
    clean.includes('youtube-nocookie.com')
  ) {
    return { platform: 'youtube', displayName: 'YouTube', canonicalDomain: 'youtube.com' };
  }

  // 3. Instagram
  if (clean.includes('instagram.com') || clean.includes('instagr.am')) {
    return { platform: 'instagram', displayName: 'Instagram', canonicalDomain: 'instagram.com' };
  }

  // 4. Facebook
  if (
    clean.includes('facebook.com') ||
    clean.includes('fb.watch') ||
    clean.includes('fb.com') ||
    clean.includes('m.facebook.com')
  ) {
    return { platform: 'facebook', displayName: 'Facebook', canonicalDomain: 'facebook.com' };
  }

  // 5. X / Twitter
  // IMPORTANT: Must NOT use clean.includes('t.co') — it causes false positives
  // for domains like "chatgpt.com" which contain the substring "t.co".
  // Instead, extract the host and check for exact domain match.
  const hostForTwitterCheck = clean.replace(/^https?:\/\//i, '').replace(/^www\./i, '').split('/')[0].split(':')[0].split('?')[0];
  if (
    clean.includes('twitter.com') ||
    clean.includes('x.com') ||
    clean.includes('mobile.twitter.com') ||
    hostForTwitterCheck === 't.co' ||
    hostForTwitterCheck.endsWith('.t.co')
  ) {
    return { platform: 'twitter', displayName: 'X (Twitter)', canonicalDomain: 'x.com' };
  }

  // 6. GitHub
  if (clean.includes('github.com') || clean.includes('github.io')) {
    return { platform: 'github', displayName: 'GitHub', canonicalDomain: 'github.com' };
  }

  // 7. LinkedIn
  if (clean.includes('linkedin.com') || clean.includes('lnkd.in')) {
    return { platform: 'linkedin', displayName: 'LinkedIn', canonicalDomain: 'linkedin.com' };
  }

  // 8. Telegram
  if (clean.includes('t.me') || clean.includes('telegram.org') || clean.includes('telegram.me')) {
    return { platform: 'telegram', displayName: 'Telegram', canonicalDomain: 'telegram.org' };
  }

  // 9. Discord
  if (clean.includes('discord.com') || clean.includes('discord.gg') || clean.includes('discordapp.com')) {
    return { platform: 'discord', displayName: 'Discord', canonicalDomain: 'discord.com' };
  }

  // 10. Reddit
  if (clean.includes('reddit.com') || clean.includes('redd.it')) {
    return { platform: 'reddit', displayName: 'Reddit', canonicalDomain: 'reddit.com' };
  }

  // 11. Spotify
  if (clean.includes('spotify.com') || clean.includes('spoti.fi')) {
    return { platform: 'spotify', displayName: 'Spotify', canonicalDomain: 'spotify.com' };
  }

  // 12. Twitch
  if (clean.includes('twitch.tv')) {
    return { platform: 'twitch', displayName: 'Twitch', canonicalDomain: 'twitch.tv' };
  }

  // 13. Pinterest
  if (clean.includes('pinterest.com') || clean.includes('pin.it')) {
    return { platform: 'pinterest', displayName: 'Pinterest', canonicalDomain: 'pinterest.com' };
  }

  // Generic domain fallback
  let host = clean.replace(/^https?:\/\//i, '').replace(/^www\./i, '').split('/')[0].split(':')[0];
  return { platform: 'generic', displayName: host, canonicalDomain: host };
}

// ─── SVG Brand Icons ─────────────────────────────────────────────────────────

export const TikTokBrandIcon: React.FC<{ className?: string }> = ({ className = 'size-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .58.04.85.12V9.32a6.35 6.35 0 0 0-.85-.06A6.34 6.34 0 0 0 3 15.6a6.34 6.34 0 0 0 10.82 4.48 6.27 6.27 0 0 0 1.95-4.48V8.71a8.18 8.18 0 0 0 4.82 1.56V6.82a4.84 4.84 0 0 1-1-.13z"
      fill="#25F4EE"
    />
    <path
      d="M18.59 5.69a4.83 4.83 0 0 1-3.77-4.25V1h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .58.04.85.12V8.32a6.35 6.35 0 0 0-.85-.06A6.34 6.34 0 0 0 2 14.6a6.34 6.34 0 0 0 10.82 4.48 6.27 6.27 0 0 0 1.95-4.48V7.71a8.18 8.18 0 0 0 4.82 1.56V5.82a4.84 4.84 0 0 1-1-.13z"
      fill="#FE2C55"
      className="mix-blend-screen"
    />
    <path
      d="M19.09 6.19a4.83 4.83 0 0 1-3.77-4.25V1.5h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .58.04.85.12V8.82a6.35 6.35 0 0 0-.85-.06A6.34 6.34 0 0 0 2.5 15.1a6.34 6.34 0 0 0 10.82 4.48 6.27 6.27 0 0 0 1.95-4.48V8.21a8.18 8.18 0 0 0 4.82 1.56V6.32a4.84 4.84 0 0 1-1-.13z"
      fill="#FFFFFF"
    />
  </svg>
);

export const YouTubeBrandIcon: React.FC<{ className?: string }> = ({ className = 'size-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <rect width="24" height="24" rx="5" fill="#FF0000" />
    <path d="M10 8.5L15.5 12L10 15.5V8.5Z" fill="#FFFFFF" />
  </svg>
);

export const InstagramBrandIcon: React.FC<{ className?: string }> = ({ className = 'size-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <defs>
      <linearGradient id="igGradient" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#fdf497" />
        <stop offset="5%" stopColor="#fdf497" />
        <stop offset="45%" stopColor="#fd5949" />
        <stop offset="60%" stopColor="#d6249f" />
        <stop offset="90%" stopColor="#285AEB" />
      </linearGradient>
    </defs>
    <rect width="24" height="24" rx="6" fill="url(#igGradient)" />
    <circle cx="12" cy="12" r="4.2" stroke="#ffffff" strokeWidth="1.8" />
    <circle cx="17.5" cy="6.5" r="1.2" fill="#ffffff" />
    <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" stroke="#ffffff" strokeWidth="1.8" />
  </svg>
);

export const FacebookBrandIcon: React.FC<{ className?: string }> = ({ className = 'size-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="12" fill="#1877F2" />
    <path
      d="M13.5 8.5H15V6h-2.2C10.6 6 9.8 7.3 9.8 9.2V11H7.5v2.5h2.3V20h3.2v-6.5h2.5l.4-2.5h-2.9V9.6c0-.7.3-1.1 1-1.1z"
      fill="#FFFFFF"
    />
  </svg>
);

export const TwitterXBrandIcon: React.FC<{ className?: string }> = ({ className = 'size-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

export const GitHubBrandIcon: React.FC<{ className?: string }> = ({ className = 'size-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
    />
  </svg>
);

export const TelegramBrandIcon: React.FC<{ className?: string }> = ({ className = 'size-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="12" fill="#24A1DE" />
    <path
      d="M5.4 11.9l11.6-4.5c.5-.2 1 .1.9.7l-2 9.4c-.1.6-.6.8-1.1.5l-3.2-2.4-1.5 1.5c-.2.2-.4.4-.8.4l.2-3.2 5.8-5.2c.3-.2-.1-.4-.4-.2l-7.2 4.5-3.1-1c-.7-.2-.7-.7.2-1z"
      fill="#FFFFFF"
    />
  </svg>
);

export const DiscordBrandIcon: React.FC<{ className?: string }> = ({ className = 'size-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <rect width="24" height="24" rx="6" fill="#5865F2" />
    <path
      d="M18.8 6.5A14.2 14.2 0 0015.3 5.4a.1.1 0 00-.1.1c-.2.4-.4.8-.5 1.2a13.3 13.3 0 00-5.4 0 8.3 8.3 0 00-.5-1.2.1.1 0 00-.1-.1 14.2 14.2 0 00-3.5 1.1.1.1 0 000 .1C3.1 9.8 2.5 13 2.8 16.2a.1.1 0 000 .1 14.4 14.4 0 004.4 2.2.1.1 0 00.1 0c.3-.4.7-.9 1-1.4a.1.1 0 00-.1-.1 9.4 9.4 0 01-1.5-.7.1.1 0 010-.2c.1-.1.2-.2.3-.2a10.2 10.2 0 009.6 0c.1 0 .2.1.3.2a.1.1 0 010 .2 9.4 9.4 0 01-1.5.7.1.1 0 00-.1.1c.3.5.7 1 1 1.4a.1.1 0 00.1 0 14.4 14.4 0 004.4-2.2.1.1 0 000-.1c.4-3.6-.6-6.8-2.6-9.6a.1.1 0 000-.1zM8.5 13.9c-.8 0-1.5-.7-1.5-1.6s.7-1.6 1.5-1.6c.9 0 1.6.7 1.5 1.6 0 .9-.7 1.6-1.5 1.6zm7 0c-.8 0-1.5-.7-1.5-1.6s.7-1.6 1.5-1.6c.9 0 1.6.7 1.5 1.6 0 .9-.6 1.6-1.5 1.6z"
      fill="#FFFFFF"
    />
  </svg>
);

// ─── Master PlatformLogo Component ───────────────────────────────────────────

export interface PlatformLogoProps {
  url: string;
  className?: string;
  size?: number;
}

export const PlatformLogo: React.FC<PlatformLogoProps> = ({
  url,
  className = 'size-4',
  size = 16
}) => {
  const [imgError, setImgError] = useState(false);
  const details = detectPlatformDetails(url);

  // Render direct crisp vector logos for top platforms
  switch (details.platform) {
    case 'tiktok':
      return <TikTokBrandIcon className={cn('shrink-0 drop-shadow-sm', className)} />;
    case 'youtube':
      return <YouTubeBrandIcon className={cn('shrink-0 drop-shadow-sm', className)} />;
    case 'instagram':
      return <InstagramBrandIcon className={cn('shrink-0 drop-shadow-sm', className)} />;
    case 'facebook':
      return <FacebookBrandIcon className={cn('shrink-0 drop-shadow-sm', className)} />;
    case 'twitter':
      return <TwitterXBrandIcon className={cn('shrink-0 text-white drop-shadow-sm', className)} />;
    case 'github':
      return <GitHubBrandIcon className={cn('shrink-0 text-white drop-shadow-sm', className)} />;
    case 'telegram':
      return <TelegramBrandIcon className={cn('shrink-0 drop-shadow-sm', className)} />;
    case 'discord':
      return <DiscordBrandIcon className={cn('shrink-0 drop-shadow-sm', className)} />;
  }

  // Fallback to high-res Google favicon for general websites
  if (details.canonicalDomain && !imgError) {
    const faviconUrl = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(details.canonicalDomain)}&sz=128`;
    return (
      <img
        src={faviconUrl}
        alt={details.displayName}
        className={cn('shrink-0 object-contain rounded drop-shadow-sm', className)}
        style={{ width: size, height: size }}
        onError={() => setImgError(true)}
      />
    );
  }

  // Fallback icon
  return <Globe className={cn('shrink-0 text-cyan-400', className)} style={{ width: size, height: size }} />;
};
