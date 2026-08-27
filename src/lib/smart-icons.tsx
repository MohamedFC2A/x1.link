import React from 'react';
import {
  Brain,
  ShieldCheck,
  Sparkles,
  Cpu,
  Zap,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  XCircle,
  FileText,
  Terminal,
  Flame,
  Eye,
  Search,
  Globe,
  Link2,
  Lock,
  Layers,
  Code2,
  BarChart3,
  Lightbulb,
  Compass,
  CircleDot,
  HelpCircle,
  KeyRound,
  Server,
  FolderGit2
} from 'lucide-react';

const EMOJI_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  '🧠': Brain,
  '💡': Lightbulb,
  '🛡️': ShieldCheck,
  '🛡': ShieldCheck,
  '🔒': Lock,
  '🔐': KeyRound,
  '🔑': KeyRound,
  '⚠️': AlertTriangle,
  '🚨': AlertCircle,
  '❗': AlertCircle,
  '❕': AlertCircle,
  '❓': HelpCircle,
  '✅': CheckCircle2,
  '✔️': CheckCircle2,
  '☑️': CheckCircle2,
  '❌': XCircle,
  '✖️': XCircle,
  '🔥': Flame,
  '⚡': Zap,
  '💥': Zap,
  '👁️': Eye,
  '👁': Eye,
  '🔍': Search,
  '🔎': Search,
  '💻': Terminal,
  '🖥️': Terminal,
  '⚙️': Cpu,
  '⚙': Cpu,
  '📄': FileText,
  '📝': FileText,
  '📋': FileText,
  '🚀': Sparkles,
  '✨': Sparkles,
  '🌟': Sparkles,
  '⭐': Sparkles,
  '🌐': Globe,
  '🔗': Link2,
  '📊': BarChart3,
  '📈': BarChart3,
  '📁': FolderGit2,
  '📂': FolderGit2,
  '🗄️': Server,
  '🎯': CircleDot,
  '🧭': Compass,
  '🔧': Code2,
  '🛠️': Code2,
  '📦': Layers,
  '🏷️': Layers,
};

const EMOJI_REGEX = /([\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}])/gu;
const EMOJI_FAST_TEST = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u;

export function purgeEmojis(text: string): string {
  if (!text || typeof text !== 'string' || !EMOJI_FAST_TEST.test(text)) return text || '';
  EMOJI_REGEX.lastIndex = 0;
  return text.replace(EMOJI_REGEX, '').replace(/\s{2,}/g, ' ');
}

export function renderSmartTextWithIcons(text: string): React.ReactNode {
  if (!text || typeof text !== 'string' || !EMOJI_FAST_TEST.test(text)) return text;

  EMOJI_REGEX.lastIndex = 0;

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = EMOJI_REGEX.exec(text)) !== null) {
    const emojiChar = match[1];
    const matchIndex = match.index;

    if (matchIndex > lastIndex) {
      parts.push(text.substring(lastIndex, matchIndex));
    }

    const IconComponent = EMOJI_ICON_MAP[emojiChar] || Sparkles;
    parts.push(
      React.createElement(
        'span',
        {
          key: `smart-icon-${matchIndex}`,
          className: 'inline-flex items-center justify-center text-zinc-400 align-middle mx-1 shrink-0 select-none'
        },
        React.createElement(IconComponent, {
          className: 'w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[1.75] text-zinc-400'
        })
      )
    );

    lastIndex = matchIndex + emojiChar.length;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length === 1 ? parts[0] : React.createElement(React.Fragment, null, ...parts);
}
