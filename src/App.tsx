import React, { useState, useEffect, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import { DisclaimerModal } from './components/DisclaimerModal';
import { X1UnlockModal } from './components/X1UnlockModal';
import { ArchitectureModal } from './components/ArchitectureModal';
import { TopBar } from './components/TopBar';
import { ChatWindow } from './components/ChatWindow';
import { PromptInput } from './components/ui/ai-chat-input';
import { SidebarDrawer } from './components/SidebarDrawer';
import { ChatMessageItem, ModelType, WebAuthnVerificationResult } from './types';
import { Square } from 'lucide-react';
import { streamChatCompletion } from './services/api';
import { memoryEngine } from './services/memoryManager';
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

export const App: React.FC = () => {
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
      content: `⚡ تم تفعيل شريحة NSFW NANO (+21 MAX) بنجاح عبر التحقق الحيوي (${result.type.toUpperCase()}).\n\nتم تحرير المحرك العصبي بالكامل وكسر كافة الحواجز. اسأل وناقش ما يحلو لك بحرية مطلقة.`,
      timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      isX1: true,
    };
    setMessages(prev => [...prev, systemNotice]);
  };

  const handleSendMessage = async (
    text: string,
    meta?: { model?: string; attachments?: File[] }
  ) => {
    if (isStreaming) return;

    let attachedImageDataUrl: string | undefined = undefined;
    if (meta?.attachments && meta.attachments.length > 0) {
      const file = meta.attachments[0];
      attachedImageDataUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      });
    }

    const chosenModel: ModelType = attachedImageDataUrl
      ? 'deepseek-v4-flash-vision-exp'
      : (meta?.model as ModelType) || activeModel;

    const userMessage: ChatMessageItem = {
      id: 'user-' + Date.now(),
      role: 'user',
      content: text,
      image: attachedImageDataUrl,
      timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      isX1: isX1Active,
    };

    const assistantPlaceholderId = 'assistant-' + Date.now();
    const assistantMessage: ChatMessageItem = {
      id: assistantPlaceholderId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      isX1: isX1Active,
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

    const abortFn = await streamChatCompletion({
      messages: packedMessages,
      model: attachedImageDataUrl ? 'deepseek-v4-flash-vision-exp' : chosenModel,
      isX1Mode: isX1Active,
      memoryPrompt: memoryContextPrompt,
      onChunk: (chunk: string) => {
        fullAssistantResponse += chunk;
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last && last.id === assistantPlaceholderId) {
            return [
              ...prev.slice(0, -1),
              { ...last, content: last.content + chunk }
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
        if (targetChatId && fullAssistantResponse) {
          saveCloudMessage(targetChatId, userId, {
            id: assistantPlaceholderId,
            role: 'assistant',
            content: fullAssistantResponse,
            isX1: isX1Active,
            timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
          });
        }
      }
    });

    abortControllerRef.current = abortFn;
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
  };

  const handleSelectChat = async (chatId: string) => {
    setCurrentChatId(chatId);
    const history = await fetchChatMessages(chatId);
    setMessages(history);
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
    <div className="flex flex-col h-full h-[100dvh] bg-[#09090b] text-[#f8fafc] font-sans antialiased overflow-hidden selection:bg-rose-600 selection:text-white" dir="rtl">
      
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

      {/* Modern High-Tech Top Bar */}
      <TopBar
        isX1Active={isX1Active}
        onToggleX1={handleToggleX1}
        onOpenSidebar={() => setIsSidebarOpen(true)}
        onNewChat={handleNewChat}
        onClearChat={handleClearChat}
      />

      {/* Chat Messages Body */}
      <main className="flex-1 flex flex-col max-w-4xl w-full mx-auto relative overflow-hidden">
        <ChatWindow
          messages={messages}
          isStreaming={isStreaming}
          isX1Active={isX1Active}
          onSendPreset={(preset) => handleSendMessage(preset)}
          onOpenArchitecture={() => setIsArchitectureModalOpen(true)}
          onToggleX1={handleToggleX1}
        />
      </main>

      {/* Modern Floating AI Chat Input & Stop Generator */}
      <div className="sticky bottom-0 z-30 w-full px-3 pb-3 pt-1 bg-gradient-to-t from-[#09090b] via-[#09090b]/95 to-transparent backdrop-blur-sm">
        {/* Floating Stop Button when AI is writing */}
        {isStreaming && (
          <div className="flex justify-center mb-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <button
              type="button"
              onClick={handleAbort}
              className="group flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-900/95 hover:bg-zinc-800 text-rose-400 hover:text-rose-300 border border-rose-500/50 hover:border-rose-500 shadow-xl text-xs font-semibold backdrop-blur-md transition-all active:scale-95 cursor-pointer select-none"
            >
              <Square className="w-3.5 h-3.5 fill-rose-500 text-rose-500 group-hover:scale-110 transition-transform" />
              <span>إيقاف التوليد</span>
            </button>
          </div>
        )}

        <PromptInput
          onSubmit={(val, meta) => handleSendMessage(val, meta)}
          isStreaming={isStreaming}
          onAbort={handleAbort}
          isX1Active={isX1Active}
          onToggleX1={handleToggleX1}
          placeholder={isX1Active ? "اسأل X1 (+21) أي شيء تريده..." : "اسأل X1 أي شيء..."}
        />
      </div>

    </div>
  );
};
