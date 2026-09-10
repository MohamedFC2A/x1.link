/**
 * Unit Tests: Icon-free Model Selector, Metallic Silver Names, RTL Descriptions, Obsidian Palette & Chat Restore Alert
 * Matany AI (Matany)
 * Zero External Tokens Consumed
 */

import * as fs from 'fs';
import * as path from 'path';
import { TestHarness, expect } from '../testUtils';

export async function runModelPresentationAndRestoreAlertTests(harness: TestHarness) {
  await harness.describe('Model Presentation & Chat Restore Alert Invariants', async () => {
    const aiChatInputPath = path.resolve(process.cwd(), 'src/components/ui/ai-chat-input.tsx');
    const chatWindowPath = path.resolve(process.cwd(), 'src/components/ChatWindow.tsx');
    const appPath = path.resolve(process.cwd(), 'src/App.tsx');

    const aiChatInputContent = fs.readFileSync(aiChatInputPath, 'utf8');
    const chatWindowContent = fs.readFileSync(chatWindowPath, 'utf8');
    const appContent = fs.readFileSync(appPath, 'utf8');

    await harness.it('Model Selector Popover has NO model icons in its option list (clean, official layout)', () => {
      const modelMenuMatch = /{\/\*\s*Interactive Model Selector Popover\s*\*\/}[\s\S]*?{\/\*\s*3-Dots Actions Menu Popover\s*\*\/}/.exec(aiChatInputContent);
      expect(Boolean(modelMenuMatch)).toBe(true);
      const modelMenuSnippet = modelMenuMatch![0];

      // Must NOT contain icon components in the model options
      expect(modelMenuSnippet).not.toContain('<Quant3PerfectionIcon');
      expect(modelMenuSnippet).not.toContain('<ShieldCheck');
      expect(modelMenuSnippet).not.toContain('<Zap');
      expect(modelMenuSnippet).not.toContain('<Camera');
      expect(modelMenuSnippet).not.toContain('<Sparkles');
    });

    await harness.it('Model names use strict LTR and shiny metallic silver text styling without glowing', () => {
      const modelMenuMatch = /{\/\*\s*Interactive Model Selector Popover\s*\*\/}[\s\S]*?{\/\*\s*3-Dots Actions Menu Popover\s*\*\/}/.exec(aiChatInputContent);
      expect(Boolean(modelMenuMatch)).toBe(true);
      const modelMenuSnippet = modelMenuMatch![0];

      // Check for LTR directional wrapper on model titles
      expect(modelMenuSnippet).toContain('dir="ltr"');

      // Check for metallic silver gradient
      expect(modelMenuSnippet).toContain('bg-clip-text text-transparent');
      expect(modelMenuSnippet).toContain('from-white via-zinc-200 to-zinc-300');

      // Check that glowing drop-shadows are NOT present on model items
      expect(modelMenuSnippet).not.toContain('shadow-[0_0_15px');
      expect(modelMenuSnippet).not.toContain('shadow-indigo-500');
      expect(modelMenuSnippet).not.toContain('shadow-amber-500');
    });

    await harness.it('Arabic descriptions use strict RTL direction and clean text-right alignment', () => {
      const modelMenuMatch = /{\/\*\s*Interactive Model Selector Popover\s*\*\/}[\s\S]*?{\/\*\s*3-Dots Actions Menu Popover\s*\*\/}/.exec(aiChatInputContent);
      expect(Boolean(modelMenuMatch)).toBe(true);
      const modelMenuSnippet = modelMenuMatch![0];

      // RTL for Arabic descriptions
      expect(modelMenuSnippet).toContain('dir="rtl" className="text-[11px] text-zinc-400 font-normal leading-normal text-right');
      expect(modelMenuSnippet).toContain('توليد وتعديل الصور، SVG، واستدلال عميق');
      expect(modelMenuSnippet).toContain('تفكير استدلالي وهندسة سيبرانية متقدمة');
    });

    await harness.it('Colors are pure obsidian/black and completely eradicate navy/indigo blue tints', () => {
      const modelMenuMatch = /{\/\*\s*Interactive Model Selector Popover\s*\*\/}[\s\S]*?{\/\*\s*3-Dots Actions Menu Popover\s*\*\/}/.exec(aiChatInputContent);
      expect(Boolean(modelMenuMatch)).toBe(true);
      const modelMenuSnippet = modelMenuMatch![0];

      // Obsidian background
      expect(modelMenuSnippet).toContain('bg-[#09090b]/98');
      expect(modelMenuSnippet).toContain('border-zinc-800');

      // Eradicated navy/indigo classes
      expect(modelMenuSnippet).not.toContain('bg-[#0c0d12]');
      expect(modelMenuSnippet).not.toContain('bg-indigo-950');
      expect(modelMenuSnippet).not.toContain('text-indigo-100');
      expect(modelMenuSnippet).not.toContain('bg-amber-950');
    });

    await harness.it('Trigger button in bottom toolbar is sleek obsidian with shiny silver text and no glowing icons', () => {
      const triggerMatch = /{\/\*\s*Right Group: Compact Model Selector\s*\*\/}[\s\S]*?<\/button>/.exec(aiChatInputContent);
      expect(Boolean(triggerMatch)).toBe(true);
      const triggerSnippet = triggerMatch![0];

      expect(triggerSnippet).toContain('bg-zinc-900/90');
      expect(triggerSnippet).toContain('bg-clip-text text-transparent');
      expect(triggerSnippet).not.toContain('<Quant3PerfectionIcon');
      expect(triggerSnippet).not.toContain('<ShieldCheck');
      expect(triggerSnippet).not.toContain('<Zap');
    });

    await harness.it('ChatWindow supports isRestoringChat and renders centered restoration alert during refresh', () => {
      expect(chatWindowContent).toContain('isRestoringChat?: boolean');
      expect(chatWindowContent).toContain('isRestoringChat && messages.length === 0');
      expect(chatWindowContent).toContain('جارٍ استعادة المحادثة...');
      expect(chatWindowContent).toContain('يرجى الانتظار لحظات ريثما يتم تحميل سجل الرسائل');
      expect(chatWindowContent).toContain('min-h-[50vh] flex flex-col items-center justify-center');
    });

    await harness.it('App.tsx properly detects active chat on reload and binds isRestoringChat to ChatWindow', () => {
      expect(appContent).toContain('const [isRestoringChat, setIsRestoringChat] = useState<boolean>');
      expect(appContent).toContain('isRestoringChat={isRestoringChat}');
      expect(appContent).toContain('sessionStorage.getItem(\'matany_active_chat_id\')');
    });
  });
}
