import React, { useState, useEffect, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import { DisclaimerModal } from './components/DisclaimerModal';
import { X1UnlockModal } from './components/X1UnlockModal';
import { ArchitectureModal } from './components/ArchitectureModal';
import { LandingPage } from './components/LandingPage';
import { TopBar } from './components/TopBar';
import { ChatWindow } from './components/ChatWindow';
import { PromptInput } from './components/ui/ai-chat-input';
import { SidebarDrawer } from './components/SidebarDrawer';
import { ChatMessageItem, ModelType, WebAuthnVerificationResult } from './types';
import { Square } from 'lucide-react';
import { streamChatCompletion } from './services/api';
import { memoryEngine } from './services/memoryManager';
import { compressImageFile } from './lib/imageCompressor';
import { detectAndExtractUrl } from './lib/utils';
import {
  supabase,
  signInWithGoogle,
  signOutUser,
  createCloudChat,
  saveCloudMessage,
  fetchUserChats,
  fetchChatMessages,
  deleteCloudChat,
  SupabaseChat
} from './services/supabase';

const STORAGE_KEY_18 = 'x1_auth_age_18';
const STORAGE_KEY_21 = 'x1_auth_age_21_biometric';
const STORAGE_KEY_MSGS = 'x1_chat_history';
const STORAGE_KEY_SEEN_LANDING = 'x1_has_seen_landing';

export const App: React.FC = () => {
  // Page Navigation State: 'landing' (Shown only for first-time visitor) vs 'chat' (AI Chat Room)
  const [viewMode, setViewMode] = useState<'landing' | 'chat'>(() => {
    return localStorage.getItem(STORAGE_KEY_SEEN_LANDING) === 'true' ? 'chat' : 'landing';
  });

  // Authentication & Mode State
  const [hasAccepted18, setHasAccepted18] = useState<boolean>(() => {
    return localStorage.getItem(STORAGE_KEY_18) === 'true';
  });

  const [isX1Unlocked, setIsX1Unlocked] = useState<boolean>(() => {
    return localStorage.getItem(STORAGE_KEY_21) === 'true';
  });

  const [isX1Active, setIsX1Active] = useState<boolean>(false);
  const [isX1ModalOpen, setIsX1ModalOpen] = useState<boolean>(false);
  const [isArchitectureModalOpen, setIsArchitectureModalOpen] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  // Supabase User & Cloud Sync (Automatic for both Guests & Logged-in Users)
  const [user, setUser] = useState<User | null>(null);
  const [cloudChats, setCloudChats] = useState<SupabaseChat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);

  // Model & Chat State
  const [activeModel, setActiveModel] = useState<ModelType>('deepseek-v4-flash');
  const [messages, setMessages] = useState<ChatMessageItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_MSGS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });

  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [totalTokens, setTotalTokens] = useState<number>(0);
  const abortControllerRef = useRef<(() => void) | null>(null);

  const loadCloudChats = async (userId: string | null) => {
    const chats = await fetchUserChats(userId);
    setCloudChats(chats);
  };

  // Initial mount & Supabase Auth Listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      loadCloudChats(currentUser?.id ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      loadCloudChats(currentUser?.id ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_MSGS, JSON.stringify(messages));
    const stats = memoryEngine.processMessages(messages);
    setTotalTokens(stats.totalTokens);
  }, [messages]);

  const handleAccept18 = () => {
    localStorage.setItem(STORAGE_KEY_18, 'true');
    setHasAccepted18(true);
  };

  const handleToggleX1 = () => {
    if (!isX1Active) {
      // Must require biometric verification on every single activation
      setIsX1ModalOpen(true);
    } else {
      setIsX1Active(false);
    }
  };

  const handleBiometricSuccess = (result: WebAuthnVerificationResult) => {
    setIsX1Unlocked(true);
    setIsX1Active(true);
    setIsX1ModalOpen(false);

    const systemNotice: ChatMessageItem = {
      id: 'sys-' + Date.now(),
      role: 'assistant',
      content: `⚡ تم تفعيل وضع NSFW Off (Uncensored) بنجاح عبر التحقق الحيوي (${result.type.toUpperCase()}).\n\nتم إلغاء كافة قيود وفلاتر الرقابة بالكامل. اسأل وناقش ما يحلو لك بحرية تعبير مطلقة.`,
      timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      isX1: true,
    };
    setMessages(prev => [...prev, systemNotice]);
  };

  const handleSendMessage = async (
    text: string,
    meta?: { model?: string; attachments?: File[]; targetUrl?: string; effort?: string; deepSearch?: boolean }
  ) => {
    if (isStreaming) return;

    // Switch to Chat room mode when sending message
    setViewMode('chat');

    const attachedImagesDataUrls: string[] = [];
    if (meta?.attachments && meta.attachments.length > 0) {
      for (const file of meta.attachments.slice(0, 5)) {
        try {
          const dataUrl = await compressImageFile(file);
          attachedImagesDataUrls.push(dataUrl);
        } catch {
          const fallbackUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.readAsDataURL(file);
          });
          attachedImagesDataUrls.push(fallbackUrl);
        }
      }
    }

    const trimmedText = text.trim();
    const effectivePrompt = trimmedText || (attachedImagesDataUrls.length > 0 ? (attachedImagesDataUrls.length > 1 ? `حلل هذه الـ ${attachedImagesDataUrls.length} صور وقارن بينها واستخرج كافة التفاصيل والمعلومات بدقة.` : 'حلل هذه الصورة واستخرج كافة التفاصيل والمعلومات الواردة فيها بدقة.') : '');
    if (!effectivePrompt && attachedImagesDataUrls.length === 0) return;

    const detectedUrlInfo = detectAndExtractUrl(effectivePrompt);
    const resolvedTargetUrl = meta?.targetUrl || (detectedUrlInfo.hasUrl ? detectedUrlInfo.cleanUrl : undefined);

    let chosenModel: ModelType;
    if (attachedImagesDataUrls.length > 0) {
      chosenModel = 'deepseek-v4-flash-vision-exp';
    } else if (meta?.model) {
      chosenModel = meta.model as ModelType;
    } else if (resolvedTargetUrl) {
      chosenModel = 'deepseek-v4-flash-cyber';
    } else {
      chosenModel = activeModel;
    }

    if (chosenModel !== activeModel) {
      setActiveModel(chosenModel);
    }

    const userMessage: ChatMessageItem = {
      id: 'user-' + Date.now(),
      role: 'user',
      content: effectivePrompt,
      image: attachedImagesDataUrls[0],
      images: attachedImagesDataUrls,
      timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      isX1: isX1Active,
      model: chosenModel,
    };

    const assistantPlaceholderId = 'assistant-' + Date.now();
    const assistantMessage: ChatMessageItem = {
      id: assistantPlaceholderId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      isX1: isX1Active,
      model: chosenModel,
    };

    const newMessagesList = [...messages, userMessage];
    setMessages([...newMessagesList, assistantMessage]);
    setIsStreaming(true);

    let targetChatId = currentChatId;
    const userId = user ? user.id : null;

    if (!targetChatId) {
      targetChatId = await createCloudChat(userId, text, chosenModel, isX1Active);
      if (targetChatId) {
        setCurrentChatId(targetChatId);
        loadCloudChats(userId);
      }
    }
    if (targetChatId) {
      saveCloudMessage(targetChatId, userId, userMessage);
    }

    const { packedMessages, memoryContextPrompt } = memoryEngine.processMessages(newMessagesList);

    let fullAssistantResponse = '';
    let fullAssistantReasoning = '';

    const streamAbortController = new AbortController();
    abortControllerRef.current = () => {
      try {
        streamAbortController.abort();
      } catch (err) {
        console.error('[Abort Exception]:', err);
      }
    };

    await streamChatCompletion({
      messages: packedMessages,
      model: attachedImagesDataUrls.length > 0 ? 'deepseek-v4-flash-vision-exp' : chosenModel,
      isX1Mode: isX1Active,
      deepSearch: meta?.deepSearch ?? false,
      memoryPrompt: memoryContextPrompt,
      targetUrl: resolvedTargetUrl || undefined,
      signal: streamAbortController.signal,
      onChunk: (data) => {
        fullAssistantResponse = data.content;
        fullAssistantReasoning = data.reasoning;
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last && last.id === assistantPlaceholderId) {
            return [
              ...prev.slice(0, -1),
              {
                ...last,
                content: data.content,
                reasoning: data.reasoning,
                isThinking: data.isThinking,
              }
            ];
          }
          return prev;
        });
      },
      onError: (errMsg: string) => {
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last && last.id === assistantPlaceholderId) {
            return [
              ...prev.slice(0, -1),
              {
                ...last,
                isThinking: false,
                content: last.content
                  ? last.content + `\n\n[خطأ]: ${errMsg}`
                  : `خطأ في الاتصال: ${errMsg}`
              }
            ];
          }
          return prev;
        });
      },
      onComplete: () => {
        setIsStreaming(false);
        abortControllerRef.current = null;
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last && last.id === assistantPlaceholderId) {
            return [
              ...prev.slice(0, -1),
              {
                ...last,
                isThinking: false,
              }
            ];
          }
          return prev;
        });
        if (targetChatId && fullAssistantResponse) {
          saveCloudMessage(targetChatId, userId, {
            id: assistantPlaceholderId,
            role: 'assistant',
            content: fullAssistantResponse,
            reasoning: fullAssistantReasoning,
            isX1: isX1Active,
            timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
          });
        }
      }
    });
  };

  const handleAbort = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
    setMessages(prev => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      if (last && last.role === 'assistant') {
        if (!last.content || last.content.trim() === '') {
          return prev.slice(0, -1);
        }
        return [
          ...prev.slice(0, -1),
          {
            ...last,
            isThinking: false,
          }
        ];
      }
      return prev;
    });
  };

  const handleClearChat = () => {
    setMessages([]);
    setCurrentChatId(null);
    localStorage.removeItem(STORAGE_KEY_MSGS);
  };

  const handleNewChat = () => {
    setMessages([]);
    setCurrentChatId(null);
    localStorage.removeItem(STORAGE_KEY_MSGS);
    setViewMode('chat');
  };

  const handleSelectChat = async (chatId: string) => {
    setCurrentChatId(chatId);
    const history = await fetchChatMessages(chatId);
    setMessages(history);
    setViewMode('chat');
  };

  const handleDeleteChat = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteCloudChat(chatId);
    if (currentChatId === chatId) {
      handleNewChat();
    }
    loadCloudChats(user?.id ?? null);
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.error('[Google Auth Failed]:', err);
    }
  };

  const handleSignOut = async () => {
    await signOutUser();
    setUser(null);
    loadCloudChats(null);
  };

  return (
    <div className="fixed inset-0 w-full h-[100dvh] flex flex-col bg-black text-[#f8fafc] font-sans antialiased overflow-hidden selection:bg-white selection:text-black relative" dir="rtl">
      
      {/* Dynamic Ambient Atmospheric Glow for Visual Vitality */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden select-none">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[650px] h-[320px] bg-gradient-to-b from-zinc-800/15 via-zinc-900/10 to-transparent rounded-full blur-[100px] opacity-75" />
        <div className="absolute top-1/4 -right-32 w-[400px] h-[400px] bg-cyan-950/15 rounded-full blur-[110px] opacity-60" />
        <div className="absolute -bottom-32 -left-32 w-[450px] h-[450px] bg-zinc-900/15 rounded-full blur-[120px] opacity-50" />
      </div>

      {/* 18+ Mandatory Age Disclaimer Modal */}
      <DisclaimerModal
        isOpen={!hasAccepted18}
        onAccept={handleAccept18}
      />

      {/* Biometric NSFW NANO Unlock Modal */}
      <X1UnlockModal
        isOpen={isX1ModalOpen}
        onClose={() => setIsX1ModalOpen(false)}
        onSuccess={handleBiometricSuccess}
      />

      {/* Architecture & Capabilities Timeline Roadmap Modal */}
      <ArchitectureModal
        isOpen={isArchitectureModalOpen}
        onClose={() => setIsArchitectureModalOpen(false)}
        onStartChat={() => {
          setViewMode('chat');
          const textarea = document.querySelector('textarea') as HTMLTextAreaElement | null;
          if (textarea) textarea.focus();
        }}
      />

      {/* Cloud History Drawer */}
      <SidebarDrawer
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        user={user}
        onGoogleSignIn={handleGoogleSignIn}
        onSignOut={handleSignOut}
        chats={cloudChats}
        currentChatId={currentChatId}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
        onDeleteChat={handleDeleteChat}
        totalTokens={totalTokens}
      />

      {/* View Switch: Standalone Reception Landing Page vs Active AI Chat */}
      {viewMode === 'landing' ? (
        <LandingPage
          onStartChat={() => {
            localStorage.setItem(STORAGE_KEY_SEEN_LANDING, 'true');
            setViewMode('chat');
          }}
          onSelectPreset={(preset) => {
            localStorage.setItem(STORAGE_KEY_SEEN_LANDING, 'true');
            setViewMode('chat');
            handleSendMessage(preset);
          }}
          onOpenArchitecture={() => setIsArchitectureModalOpen(true)}
          onOpenSidebar={() => setIsSidebarOpen(true)}
          user={user}
        />
      ) : (
        <div className="flex-1 flex flex-col h-full min-h-0 overflow-hidden relative z-10 animate-in fade-in duration-200">
          
          {/* Top Bar for Chat Room */}
          <TopBar
            isX1Active={isX1Active}
            activeModel={activeModel}
            onSelectModel={setActiveModel}
            user={user}
            onToggleX1={handleToggleX1}
            onOpenSidebar={() => setIsSidebarOpen(true)}
            onNewChat={handleNewChat}
            onClearChat={handleClearChat}
            onGoHome={() => setViewMode('landing')}
          />

          {/* Chat Messages Body */}
          <main className="flex-1 flex flex-col max-w-4xl w-full mx-auto relative overflow-hidden min-h-0">
            <ChatWindow
              messages={messages}
              isStreaming={isStreaming}
              isX1Active={isX1Active}
              onSendPreset={(preset) => handleSendMessage(preset)}
              onOpenArchitecture={() => setIsArchitectureModalOpen(true)}
              onToggleX1={handleToggleX1}
            />
          </main>

          {/* Floating AI Chat Input */}
          <div className="sticky bottom-0 z-30 w-full px-3 sm:px-6 pb-3 sm:pb-4 pt-1 bg-gradient-to-t from-black via-black/80 to-transparent pb-safe max-w-4xl mx-auto">
            <PromptInput
              onSubmit={(val, meta) => handleSendMessage(val, meta)}
              isStreaming={isStreaming}
              onAbort={handleAbort}
              isX1Active={isX1Active}
              onToggleX1={handleToggleX1}
              activeModel={activeModel}
              onSelectModel={setActiveModel}
              placeholder={
                activeModel === 'deepseek-v4-flash-cyber'
                  ? "اسأل Fathom Cyber عن فحص الروابط أو تدقيق الحماية..."
                  : isX1Active
                  ? "اسأل X1 MAX أي شيء تريده..."
                  : "اسأل Fathom 1 أي شيء..."
              }
            />
          </div>

        </div>
      )}

    </div>
  );
};
