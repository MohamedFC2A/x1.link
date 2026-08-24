import React, { useState, useEffect, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import { DisclaimerModal } from './components/DisclaimerModal';
import { X1UnlockModal } from './components/X1UnlockModal';
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
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  // Supabase User & Cloud Sync
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

  // Supabase Auth Listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadUserCloudChats(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadUserCloudChats(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserCloudChats = async (userId: string) => {
    const chats = await fetchUserChats(userId);
    setCloudChats(chats);
  };

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

    const chosenModel = (meta?.model as ModelType) || activeModel;
    if (chosenModel !== activeModel) {
      setActiveModel(chosenModel);
    }

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
    if (user) {
      if (!targetChatId) {
        targetChatId = await createCloudChat(user.id, text, chosenModel, isX1Active);
        if (targetChatId) {
          setCurrentChatId(targetChatId);
          loadUserCloudChats(user.id);
        }
      }
      if (targetChatId) {
        saveCloudMessage(targetChatId, user.id, userMessage);
      }
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
        abortControllerRef.current = null;
        if (user && targetChatId && fullAssistantResponse) {
          saveCloudMessage(targetChatId, user.id, {
            ...assistantMessage,
            content: fullAssistantResponse
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
    handleClearChat();
  };

  const handleSelectChat = async (chatId: string) => {
    setCurrentChatId(chatId);
    const msgs = await fetchChatMessages(chatId);
    setMessages(msgs);
  };

  const handleDeleteChat = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteCloudChat(chatId);
    if (user) {
      loadUserCloudChats(user.id);
    }
    if (currentChatId === chatId) {
      handleClearChat();
    }
  };

  return (
    <div className="h-[100dvh] flex flex-col bg-[#09090b] text-[#f8fafc] font-sans antialiased overflow-hidden select-text">
      
      {/* 18+ Mandatory Disclaimer Entry Gate */}
      {!hasAccepted18 && (
        <DisclaimerModal onAccept={handleAccept18} />
      )}

      {/* 21+ X1 Protocol Biometric Unlock Modal */}
      <X1UnlockModal
        isOpen={isX1ModalOpen}
        onClose={() => setIsX1ModalOpen(false)}
        onSuccess={handleBiometricSuccess}
      />

      {/* Slide-out Mobile Sidebar (History, Google Sign In, Cloud Sync) */}
      <SidebarDrawer
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        user={user}
        onGoogleSignIn={signInWithGoogle}
        onSignOut={signOutUser}
        chats={cloudChats}
        currentChatId={currentChatId}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
        onDeleteChat={handleDeleteChat}
        totalTokens={totalTokens}
      />

      {/* Modern Clean Top Header */}
      <TopBar
        isX1Active={isX1Active}
        isX1Unlocked={isX1Unlocked}
        activeModel={activeModel}
        user={user}
        onToggleX1={handleToggleX1}
        onSelectModel={setActiveModel}
        onOpenSidebar={() => setIsSidebarOpen(true)}
        onClearChat={handleClearChat}
      />

      {/* Chat Messages Body */}
      <main className="flex-1 flex flex-col max-w-4xl w-full mx-auto relative overflow-hidden">
        <ChatWindow
          messages={messages}
          isStreaming={isStreaming}
          isX1Active={isX1Active}
          onSendPreset={(preset) => handleSendMessage(preset)}
        />
      </main>

      {/* Modern Floating AI Chat Input & Stop Generator */}
      <div className="sticky bottom-0 z-30 w-full px-3 pb-3 pt-1 bg-gradient-to-t from-[#09090b] via-[#09090b]/90 to-transparent">
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
