import React, { useState, useEffect, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import { DisclaimerModal } from './components/DisclaimerModal';
import { X1UnlockModal } from './components/X1UnlockModal';
import { ArchitectureModal } from './components/ArchitectureModal';
import { SubscriptionModal } from './components/SubscriptionModal';
import { AuthRequiredModal } from './components/AuthRequiredModal';
import { LandingPage } from './components/LandingPage';
import { TopBar } from './components/TopBar';
import { ChatWindow } from './components/ChatWindow';
import { PromptInput } from './components/ui/ai-chat-input';
import { InteractiveGridBackground } from './components/ui/InteractiveGridBackground';
import { SidebarDrawer } from './components/SidebarDrawer';
import { PricingPage } from './components/PricingPage';
import { LimitsPage } from './components/LimitsPage';
import { ProfilePage } from './components/ProfilePage';
import { PrivacyPolicyPage } from './components/PrivacyPolicyPage';
import { TermsOfServicePage } from './components/TermsOfServicePage';
import { ChatMessageItem, ModelType, WebAuthnVerificationResult, MediaAttachmentItem } from './types';
import { streamChatCompletion } from './services/api';
import { memoryEngine } from './services/memoryManager';
import { compressImageFile } from './lib/imageCompressor';
import { detectAndExtractUrl, isMediaOrVideoUrl, formatEnglishTimestamp } from './lib/utils';
import { classifyFileType, extractVideoClientMetadata, extractAudioClientMetadata, extractTextClientMetadata, extractVideoKeyframes, formatMediaDuration } from './lib/mediaExtractor';
import { fetchUserSubscription } from './services/subscriptionService';
import { recordRealUsage, checkPlanLimit, getLocalUsage, fetchRemoteUsage, estimateTokens } from './services/usageTracker';
import {
  supabase,
  signInWithGoogle,
  signOutUser,
  createCloudChat,
  saveCloudMessage,
  fetchUserChats,
  fetchChatMessages,
  deleteCloudChat,
  fetchCrossChatHistoryForMemory,
  purgeAllLocalChatArtifacts,
  getOrCreateDeviceId,
  SupabaseChat
} from './services/supabase';

const STORAGE_KEY_18 = 'x1_auth_age_18';
const STORAGE_KEY_21 = 'x1_auth_age_21_biometric';
const STORAGE_KEY_SEEN_LANDING = 'x1_has_seen_landing';
const STORAGE_KEY_PLAN = 'x1_active_plan';

export type AppViewMode = 'landing' | 'chat' | 'pricing' | 'limits' | 'profile' | 'privacy' | 'terms';

export const App: React.FC = () => {
  // Page Navigation State based on pathname or local storage
  const [viewMode, setViewMode] = useState<AppViewMode>(() => {
    const path = window.location.pathname.toLowerCase();
    if (path === '/privacy' || path === '/privacy-policy') return 'privacy';
    if (path === '/terms' || path === '/terms-of-service') return 'terms';
    if (path === '/pricing') return 'pricing';
    if (path === '/limits') return 'limits';
    if (path === '/profile') return 'profile';
    return localStorage.getItem(STORAGE_KEY_SEEN_LANDING) === 'true' ? 'chat' : 'landing';
  });

  const navigateTo = (view: AppViewMode) => {
    setViewMode(view);
    const pathMap: Record<AppViewMode, string> = {
      landing: '/',
      chat: '/',
      pricing: '/pricing',
      limits: '/limits',
      profile: '/profile',
      privacy: '/privacy',
      terms: '/terms',
    };
    const newPath = pathMap[view] || '/';
    if (window.location.pathname !== newPath) {
      window.history.pushState(null, '', newPath);
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.toLowerCase();
      if (path === '/privacy' || path === '/privacy-policy') setViewMode('privacy');
      else if (path === '/terms' || path === '/terms-of-service') setViewMode('terms');
      else if (path === '/pricing') setViewMode('pricing');
      else if (path === '/limits') setViewMode('limits');
      else if (path === '/profile') setViewMode('profile');
      else {
        setViewMode(localStorage.getItem(STORAGE_KEY_SEEN_LANDING) === 'true' ? 'chat' : 'landing');
        const urlParams = new URLSearchParams(window.location.search);
        const urlChatId = urlParams.get('c') || urlParams.get('chat');
        if (urlChatId && urlChatId !== currentChatId) {
          handleSelectChat(urlChatId);
        } else if (!urlChatId && currentChatId) {
          handleNewChat();
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Current Subscription Plan ('free-0' | 'pro-29' | 'elite-99')
  const [currentPlanId, setCurrentPlanId] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY_PLAN) || 'free-0';
  });

  // Subscription Modal State
  const [isSubModalOpen, setIsSubModalOpen] = useState<boolean>(false);
  const [subModalTargetPlan, setSubModalTargetPlan] = useState<'pro-29' | 'elite-99'>('pro-29');

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
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  // Supabase User & Cloud Sync
  const [user, setUser] = useState<User | null>(null);
  const [cloudChats, setCloudChats] = useState<SupabaseChat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);

  // Model & Chat State (Persistent Smart Preferred Base Model: Fathom 1.1, Fathom Cyber 2.0 or Fathom Cyber 2.1 Pro)
  const [preferredBaseModel, setPreferredBaseModel] = useState<ModelType>(() => {
    try {
      const saved = localStorage.getItem('matany_preferred_base_model');
      if (saved === 'deepseek-v4-pro-cyber-2.1' || saved === 'deepseek-v4-flash-cyber-2.1' || saved === 'deepseek-v4-flash-cyber' || saved === 'deepseek-v4-flash') {
        return saved as ModelType;
      }
    } catch (e) {}
    return 'deepseek-v4-flash';
  });

  const [activeModel, setActiveModel] = useState<ModelType>(preferredBaseModel);

  const handleSelectModel = (model: ModelType) => {
    setActiveModel(model);
    if (model === 'deepseek-v4-flash' || model === 'deepseek-v4-flash-cyber' || model === 'deepseek-v4-pro-cyber-2.1' || model === 'deepseek-v4-flash-cyber-2.1') {
      setPreferredBaseModel(model);
      try {
        localStorage.setItem('matany_preferred_base_model', model);
      } catch (e) {}
    }
  };

  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [totalTokens, setTotalTokens] = useState<number>(() => getLocalUsage().totalTokens);
  const abortControllerRef = useRef<(() => void) | null>(null);
  const activeStreamSessionRef = useRef<number>(0);

  // Calculate current active chat tokens
  const currentChatTokens = messages.reduce((acc, m) => {
    if (m.tokensCount) return acc + m.tokensCount;
    return acc + estimateTokens(m.content || '', '', m.reasoning);
  }, 0);

  const getTargetChatIdFromUrlOrStorage = (): string | null => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const paramChatId = urlParams.get('c') || urlParams.get('chat');
      if (paramChatId === 'new') return null;
      if (paramChatId) return paramChatId;

      const stored = sessionStorage.getItem('matany_active_chat_id');
      if (stored === 'new') return null;
      if (stored) return stored;
    } catch (e) {}
    return null;
  };

  const updateActiveChatUrlAndStorage = (chatId: string | null) => {
    try {
      const url = new URL(window.location.href);
      if (chatId) {
        sessionStorage.setItem('matany_active_chat_id', chatId);
        url.searchParams.set('c', chatId);
        window.history.replaceState(null, '', url.toString());
      } else {
        sessionStorage.setItem('matany_active_chat_id', 'new');
        url.searchParams.delete('c');
        url.searchParams.delete('chat');
        window.history.replaceState(null, '', url.toString());
      }
    } catch (e) {}
  };

  const refreshSidebarChats = async (userId: string | null) => {
    try {
      const chats = await fetchUserChats(userId);
      setCloudChats(chats);
      if (chats.length > 0) {
        memoryEngine.ingestCrossChatSessions(chats);
        fetchCrossChatHistoryForMemory(userId, 20).then(history => {
          history.forEach(item => {
            if (item.messages && item.messages.length > 0) {
              memoryEngine.updateChatMemoryNode(item.chat.id, item.chat.title, item.messages, item.chat.updated_at);
            }
          });
        }).catch(() => {});
      }
      return chats;
    } catch (err) {
      console.warn('[Refresh Sidebar Error]:', err);
      return [];
    }
  };

  const restoreActiveChatSession = async (userId: string | null, targetExplicitChatId?: string | null) => {
    const chats = await refreshSidebarChats(userId);

    // Determine what chat should be active
    const activeTarget = targetExplicitChatId !== undefined 
      ? targetExplicitChatId 
      : getTargetChatIdFromUrlOrStorage();

    if (activeTarget && activeTarget !== 'new') {
      const chatExists = chats.some(c => c.id === activeTarget);
      if (chatExists) {
        setCurrentChatId(activeTarget);
        updateActiveChatUrlAndStorage(activeTarget);
        const msgs = await fetchChatMessages(activeTarget);
        setMessages(msgs);
        if (msgs.length > 0) {
          const targetChat = chats.find(c => c.id === activeTarget);
          memoryEngine.updateChatMemoryNode(activeTarget, targetChat?.title || 'محادثة سابقة', msgs, targetChat?.updated_at);

          // If the last message was from user, the server may still be generating the response in background
          if (msgs[msgs.length - 1].role === 'user') {
            let pollAttempts = 0;
            const pollInterval = setInterval(async () => {
              pollAttempts++;
              const latestMsgs = await fetchChatMessages(activeTarget);
              if (latestMsgs.length > msgs.length && latestMsgs[latestMsgs.length - 1].role === 'assistant') {
                setMessages(latestMsgs);
                clearInterval(pollInterval);
              } else if (pollAttempts >= 18) {
                clearInterval(pollInterval);
              }
            }, 2000);
          }
        }
      } else {
        // Chat was deleted or does not exist
        setCurrentChatId(null);
        setMessages([]);
        updateActiveChatUrlAndStorage(null);
      }
    } else if (targetExplicitChatId === null || (targetExplicitChatId === undefined && activeTarget === null && !currentChatId)) {
      // Retain clean fresh new chat state
      setCurrentChatId(null);
      setMessages([]);
      updateActiveChatUrlAndStorage(null);
    }
  };

  // Initial mount & Supabase Auth & Subscription Listener
  useEffect(() => {
    // Radically clean and wipe all obsolete local chat remnants
    purgeAllLocalChatArtifacts();

    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      memoryEngine.setUserIdAndLoad(currentUser?.id ?? null);
      restoreActiveChatSession(currentUser?.id ?? null);
      fetchUserSubscription(currentUser?.id ?? null).then(plan => setCurrentPlanId(plan));
      fetchRemoteUsage(currentUser?.id ?? null).then(usage => {
        if (usage) setTotalTokens(usage.totalTokens);
      });
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      memoryEngine.setUserIdAndLoad(currentUser?.id ?? null);
      refreshSidebarChats(currentUser?.id ?? null);
      fetchUserSubscription(currentUser?.id ?? null).then(plan => setCurrentPlanId(plan));
      fetchRemoteUsage(currentUser?.id ?? null).then(usage => {
        if (usage) setTotalTokens(usage.totalTokens);
      });
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleAccept18 = () => {
    localStorage.setItem(STORAGE_KEY_18, 'true');
    setHasAccepted18(true);
  };

  const handleToggleX1 = () => {
    if (!isX1Active) {
      setIsX1ModalOpen(true);
    } else {
      setIsX1Active(false);
    }
  };

  const handleBiometricSuccess = (_result: WebAuthnVerificationResult) => {
    setIsX1Unlocked(true);
    setIsX1Active(true);
    setIsX1ModalOpen(false);
  };

  const handleSelectPlan = (planId: string) => {
    setCurrentPlanId(planId);
    localStorage.setItem(STORAGE_KEY_PLAN, planId);
  };

  const handleSendMessage = async (
    text: string,
    meta?: { model?: string; attachments?: File[]; targetUrl?: string; targetUrls?: string[]; effort?: string; deepSearch?: boolean; resolvedLink?: any }
  ) => {
    if (isStreaming) return;

    // Cloud-First & Guest Adaptive Session

    const attachedImagesDataUrls: string[] = [];
    const attachedVideoKeyframes: string[] = [];
    const attachedMediaList: MediaAttachmentItem[] = [];

    if (meta?.attachments && meta.attachments.length > 0) {
      for (const file of meta.attachments.slice(0, 6)) {
        const mediaType = classifyFileType(file);
        if (mediaType === 'image') {
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
        } else if (mediaType === 'video') {
          const metaInfo = await extractVideoClientMetadata(file);
          // Check for preloaded keyframes first for 0ms instant send
          const preloaded = (meta as any)?.preloadedKeyframes?.[file.name];
          if (preloaded && Array.isArray(preloaded) && preloaded.length > 0) {
            attachedVideoKeyframes.push(...preloaded);
          } else {
            try {
              const keyframes = await extractVideoKeyframes(file, 5);
              if (keyframes.length > 0) {
                attachedVideoKeyframes.push(...keyframes);
              }
            } catch (e) {
              console.warn('[Keyframes extraction caught]:', e);
            }
          }

          attachedMediaList.push({
            id: `video-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            name: file.name,
            type: 'video',
            mimeType: file.type || 'video/mp4',
            dataUrl: URL.createObjectURL(file),
            size: file.size,
            duration: metaInfo.duration,
            width: metaInfo.width,
            height: metaInfo.height,
          });
        } else if (mediaType === 'audio') {
          const metaInfo = await extractAudioClientMetadata(file);
          attachedMediaList.push({
            id: `audio-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            name: file.name,
            type: 'audio',
            mimeType: file.type || 'audio/mp3',
            dataUrl: URL.createObjectURL(file),
            size: file.size,
            duration: metaInfo.duration,
          });
        } else {
          const textMeta = await extractTextClientMetadata(file);
          attachedMediaList.push({
            id: `doc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            name: file.name,
            type: 'document',
            mimeType: file.type || 'text/plain',
            size: file.size,
          });
        }
      }
    }

    const uniqueImagesDataUrls = Array.from(new Set(attachedImagesDataUrls));
    const trimmedText = text.trim();
    let effectivePrompt = trimmedText;
    if (!effectivePrompt) {
      if (attachedMediaList.length > 0) {
        const names = attachedMediaList.map(m => `"${m.name}" (${m.type})`).join('، ');
        effectivePrompt = `قم بتحليل واستيعاب المعطيات والبيانات الواردة في المرفقات التالية بالتفصيل: ${names}`;
      } else if (uniqueImagesDataUrls.length > 0) {
        effectivePrompt = uniqueImagesDataUrls.length > 1
          ? `حلل هذه الـ ${uniqueImagesDataUrls.length} لقطات/صور بصرية وقارن بينها واستخرج كافة التفاصيل والمعلومات بدقة.`
          : 'حلل هذه الصورة واستخرج كافة التفاصيل والمعلومات الواردة فيها بدقة.';
      }
    }

    // Append document text contents & audio metadata into effective prompt
    for (const item of attachedMediaList) {
      if (item.type === 'document') {
        const docFile = meta?.attachments?.find(f => f.name === item.name);
        if (docFile) {
          const textData = await extractTextClientMetadata(docFile);
          if (textData.textSnippet) {
            effectivePrompt += `\n\n--- [محتوى المستند/الكود المرفق: "${item.name}"] ---\n${textData.textSnippet}\n--- [نهاية المستند] ---`;
          }
        }
      } else if (item.type === 'audio') {
        effectivePrompt += `\n\n[ملف صوتي مرفق: "${item.name}" - المدة: ${formatMediaDuration(item.duration || 0)}]`;
      }
    }

    if (meta?.resolvedLink) {
      const rl = meta.resolvedLink;
      const rlTitle = rl.title || rl.metaTitle || '';
      const rlDesc = rl.description || rl.metaDescription || '';
      const rlAuthor = rl.authorName || rl.author || '';
      const rlPlatform = rl.platform || 'رابط';
      const rlUrl = rl.url || '';
      effectivePrompt += `\n\n[معطيات الرابط والمحتوى المرفق - ${rlPlatform}]:\n• العنوان: ${rlTitle}\n• صانع المحتوى / الحساب: ${rlAuthor}\n• الرابط: ${rlUrl}\n• ملخص / وصف المحتوى: ${rlDesc}`;
    }

    if (!effectivePrompt && uniqueImagesDataUrls.length === 0 && attachedMediaList.length === 0) return;

    const detectedUrlInfo = detectAndExtractUrl(effectivePrompt);
    const resolvedTargetUrl = meta?.targetUrl || (detectedUrlInfo.hasUrl ? detectedUrlInfo.cleanUrl : undefined);

    // Enforce Plan Limits: Only actual non-media websites trigger Cyber limits
    const isTargetMedia = isMediaOrVideoUrl(resolvedTargetUrl);
    const isActualCyberUrlScan = !isTargetMedia && Boolean(resolvedTargetUrl);

    const limitCheck = checkPlanLimit(currentPlanId, {
      isVision: uniqueImagesDataUrls.length > 0,
      isCyber: meta?.model === 'deepseek-v4-flash-cyber' || meta?.model === 'deepseek-v4-pro-cyber-2.1' || meta?.model === 'deepseek-v4-flash-cyber-2.1',
      isCyberUrlScan: isActualCyberUrlScan,
    });

    if (!limitCheck.allowed) {
      navigateTo('chat');
      let limitMsg = '';
      if (limitCheck.reason === 'free_fathom1_limit') {
        limitMsg = 'لقد استهلكت حد التجربة المتاح في الخطة المجانية لنموذج Fathom 1.1 (مرتان فقط). يرجى الترقية إلى باقة المحترف ($29) أو النخبة ($99) للمتابعة بلا قيود.';
      } else if (limitCheck.reason === 'free_vision_limit') {
        limitMsg = 'لقد استهلكت حد التجربة المتاح في الخطة المجانية لإدراك Fathom Cam البصري (صورتان فقط). يرجى الترقية إلى باقة المحترف ($29) أو النخبة ($99) لتحليل غير محدود.';
      } else if (limitCheck.reason === 'free_cyber_disabled') {
        limitMsg = 'فحوصات Fathom Cyber (2.0 / 2.1) والاستخبارات السيبرانية غير مفعلة في الخطة المجانية. يرجى تفعيل باقة المحترف ($29) أو النخبة ($99).';
      } else {
        limitMsg = 'لقد بلغت الحد الأقصى لرصيد التوكن الشهري لخطة اشتراكك الحالية. يمكنك الترقية لباقة النخبة ($99) للحصول على سعة مفتوحة.';
      }

      setMessages(prev => [
        ...prev,
        {
          id: 'user-' + Date.now(),
          role: 'user',
          content: effectivePrompt,
          timestamp: formatEnglishTimestamp(),
        },
        {
          id: 'assistant-' + Date.now(),
          role: 'assistant',
          content: limitMsg,
          timestamp: formatEnglishTimestamp(),
        }
      ]);
      setSubModalTargetPlan('pro-29');
      setIsSubModalOpen(true);
      return;
    }

    // Switch to Chat room mode when sending message
    navigateTo('chat');

    let chosenModel: ModelType;
    if (attachedMediaList.length > 0 || attachedVideoKeyframes.length > 0) {
      chosenModel = 'meta/muse-spark-1.2-contributor';
    } else if (attachedImagesDataUrls.length > 0) {
      chosenModel = 'deepseek-v4-flash-vision-exp';
    } else if (meta?.model) {
      chosenModel = meta.model as ModelType;
    } else if (resolvedTargetUrl) {
      chosenModel = 'deepseek-v4-flash-cyber';
    } else {
      chosenModel = preferredBaseModel || activeModel;
    }

    // Auto-restore input back to user preferred base model if multi-modal media was sent
    if (attachedMediaList.length > 0 || attachedImagesDataUrls.length > 0) {
      setActiveModel(preferredBaseModel);
    } else if (chosenModel !== activeModel) {
      setActiveModel(chosenModel);
    }

    const userCleanDisplayContent = text.trim() || (
      uniqueImagesDataUrls.length > 0
        ? 'تحليل وفحص الصور المرفقة'
        : (attachedMediaList.length > 0
            ? (attachedMediaList[0].type === 'audio'
                ? 'استماع وتحليل المقطع الصوتي المرفق'
                : attachedMediaList[0].type === 'video'
                  ? 'تحليل وفحص الفيديو المرفق'
                  : 'فحص وتحليل المستند المرفق')
            : effectivePrompt)
    );

    const userMessage: ChatMessageItem = {
      id: 'user-' + Date.now(),
      role: 'user',
      content: userCleanDisplayContent,
      image: uniqueImagesDataUrls[0],
      images: uniqueImagesDataUrls.length > 0 ? uniqueImagesDataUrls : undefined,
      videoKeyframes: attachedVideoKeyframes.length > 0 ? attachedVideoKeyframes : undefined,
      mediaAttachments: attachedMediaList,
      timestamp: formatEnglishTimestamp(),
      isX1: isX1Active,
      model: chosenModel,
    };

    const assistantPlaceholderId = 'assistant-' + Date.now();
    const assistantMessage: ChatMessageItem = {
      id: assistantPlaceholderId,
      role: 'assistant',
      content: '',
      timestamp: formatEnglishTimestamp(),
      isX1: isX1Active,
      model: chosenModel,
    };

    const newMessagesList = [...messages, userMessage];
    setMessages([...newMessagesList, assistantMessage]);
    setIsStreaming(true);

    let targetChatId = currentChatId;
    const userId = user ? user.id : null;

    if (!targetChatId) {
      targetChatId = await createCloudChat(userId, userCleanDisplayContent, chosenModel, isX1Active);
      if (targetChatId) {
        setCurrentChatId(targetChatId);
        updateActiveChatUrlAndStorage(targetChatId);
        refreshSidebarChats(userId);
      }
    }
    if (targetChatId) {
      saveCloudMessage(targetChatId, userId, userMessage);
    }

    // For LLM reasoning, inject effectivePrompt with attachments context
    const messagesForEngine = [
      ...messages,
      {
        ...userMessage,
        content: effectivePrompt || userCleanDisplayContent
      }
    ];

    const {
      packedMessages,
      memoryContextPrompt,
      isMemoryDetectTriggered,
      memoryDetectSummary
    } = memoryEngine.processMessages(messagesForEngine, targetChatId);

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

    const streamSessionId = Date.now();
    activeStreamSessionRef.current = streamSessionId;

    await streamChatCompletion({
      messages: packedMessages,
      model: attachedImagesDataUrls.length > 0 ? 'deepseek-v4-flash-vision-exp' : chosenModel,
      isX1Mode: isX1Active,
      deepSearch: meta?.deepSearch ?? false,
      memoryPrompt: memoryContextPrompt,
      targetUrl: resolvedTargetUrl || undefined,
      targetUrls: meta?.targetUrls || (resolvedTargetUrl ? [resolvedTargetUrl] : undefined),
      chatId: targetChatId,
      userId,
      deviceId: getOrCreateDeviceId(),
      signal: streamAbortController.signal,
      onChunk: (data) => {
        if (activeStreamSessionRef.current !== streamSessionId) return;
        fullAssistantResponse = data.content;
        fullAssistantReasoning = data.reasoning;
        setMessages(prev => {
          const existingIdx = prev.findIndex(m => m.id === assistantPlaceholderId);
          if (existingIdx !== -1) {
            const updated = [...prev];
            updated[existingIdx] = {
              ...updated[existingIdx],
              content: data.content,
              reasoning: data.reasoning,
              isThinking: data.isThinking,
              isMemoryDetectTriggered,
              memoryDetectSummary,
            };
            return updated;
          }
          const last = prev[prev.length - 1];
          if (last && last.role === 'assistant') {
            return [
              ...prev.slice(0, -1),
              {
                ...last,
                content: data.content,
                reasoning: data.reasoning,
                isThinking: data.isThinking,
                isMemoryDetectTriggered,
                memoryDetectSummary,
              }
            ];
          }
          return [
            ...prev,
            {
              id: assistantPlaceholderId,
              role: 'assistant',
              content: data.content,
              reasoning: data.reasoning,
              isThinking: data.isThinking,
              timestamp: formatEnglishTimestamp(),
              isX1: isX1Active,
              model: chosenModel,
              isMemoryDetectTriggered,
              memoryDetectSummary,
            }
          ];
        });
      },
      onError: (errMsg: string) => {
        if (activeStreamSessionRef.current !== streamSessionId) return;
        setIsStreaming(false);
        abortControllerRef.current = null;
        setMessages(prev => {
          const existingIdx = prev.findIndex(m => m.id === assistantPlaceholderId);
          if (existingIdx !== -1) {
            const updated = [...prev];
            updated[existingIdx] = {
              ...updated[existingIdx],
              isThinking: false,
              content: updated[existingIdx].content
                ? updated[existingIdx].content + `\n\n[خطأ]: ${errMsg}`
                : `خطأ في الاتصال: ${errMsg}`
            };
            return updated;
          }
          const last = prev[prev.length - 1];
          if (last && last.role === 'assistant') {
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
      onComplete: async () => {
        if (activeStreamSessionRef.current !== streamSessionId) return;
        setIsStreaming(false);
        abortControllerRef.current = null;

        const effectiveFinalContent = fullAssistantResponse && fullAssistantResponse.trim()
          ? fullAssistantResponse.trim()
          : (fullAssistantReasoning && fullAssistantReasoning.trim()
              ? fullAssistantReasoning.trim()
              : '');

        const finalAssistantMsg: ChatMessageItem = {
          id: assistantPlaceholderId,
          role: 'assistant',
          content: fullAssistantResponse?.trim() || effectiveFinalContent,
          reasoning: fullAssistantReasoning,
          isX1: isX1Active,
          timestamp: formatEnglishTimestamp(),
          isMemoryDetectTriggered,
          memoryDetectSummary,
        };

        setMessages(prev => {
          const existingIdx = prev.findIndex(m => m.id === assistantPlaceholderId);
          if (existingIdx !== -1) {
            const updated = [...prev];
            updated[existingIdx] = finalAssistantMsg;
            return updated;
          }
          const last = prev[prev.length - 1];
          if (last && last.role === 'assistant') {
            return [...prev.slice(0, -1), finalAssistantMsg];
          }
          return [...prev, finalAssistantMsg];
        });

        // Record real usage & token metrics to Supabase
        const updatedUsage = await recordRealUsage({
          model: chosenModel,
          promptText: effectivePrompt,
          responseText: fullAssistantResponse || effectiveFinalContent,
          reasoningText: fullAssistantReasoning,
          hasImages: uniqueImagesDataUrls.length > 0,
          imagesCount: uniqueImagesDataUrls.length,
          isCyberScan: !!resolvedTargetUrl || meta?.model === 'deepseek-v4-flash-cyber' || meta?.model === 'deepseek-v4-pro-cyber-2.1' || meta?.model === 'deepseek-v4-flash-cyber-2.1',
          userId,
          currentPlanId,
        });

        setTotalTokens(updatedUsage.totalTokens);

        if (targetChatId) {
          saveCloudMessage(targetChatId, userId, finalAssistantMsg);
          const currentChatTitle = cloudChats.find(c => c.id === targetChatId)?.title || text.slice(0, 40);
          memoryEngine.updateChatMemoryNode(targetChatId, currentChatTitle, [...newMessagesList, finalAssistantMsg]);
          refreshSidebarChats(userId);
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

  const handleClearChat = async () => {
    purgeAllLocalChatArtifacts();
    if (currentChatId) {
      await deleteCloudChat(currentChatId);
      refreshSidebarChats(user?.id ?? null);
    }
    setMessages([]);
    setCurrentChatId(null);
    updateActiveChatUrlAndStorage(null);
  };

  const handleNewChat = () => {
    activeStreamSessionRef.current = 0;
    if (abortControllerRef.current) {
      try {
        abortControllerRef.current();
      } catch {}
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
    setMessages([]);
    setCurrentChatId(null);
    updateActiveChatUrlAndStorage(null);
    navigateTo('chat');
  };

  useEffect(() => {
    const onAutoDelete = async () => {
      if (currentChatId) {
        try {
          await deleteCloudChat(currentChatId);
          refreshSidebarChats(user?.id ?? null);
        } catch (err) {
          console.warn('[AutoDelete Cloud Error]:', err);
        }
      }
      handleNewChat();
    };

    window.addEventListener('x1:autodelete-chat', onAutoDelete);
    return () => window.removeEventListener('x1:autodelete-chat', onAutoDelete);
  }, [currentChatId, user]);

  // Mobile Edge-Swipe to Open Sidebar Drawer (Swipe from Right to Left)
  useEffect(() => {
    let touchStartX = 0;
    let touchStartY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.changedTouches.length === 1) {
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        const deltaX = touchEndX - touchStartX;
        const deltaY = touchEndY - touchStartY;

        // In RTL (drawer anchored on the right):
        // If touch begins within 45px of the right screen edge and swipes to the left by > 45px
        const isRightEdge = touchStartX > window.innerWidth - 45;
        const isSwipeLeft = deltaX < -45;
        const isHorizontal = Math.abs(deltaX) > Math.abs(deltaY) * 1.2;

        if (!isSidebarOpen && isRightEdge && isSwipeLeft && isHorizontal) {
          setIsSidebarOpen(true);
        }
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isSidebarOpen]);

  const handleSelectChat = async (chatId: string) => {
    activeStreamSessionRef.current = 0;
    if (abortControllerRef.current) {
      try {
        abortControllerRef.current();
      } catch {}
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
    setCurrentChatId(chatId);
    updateActiveChatUrlAndStorage(chatId);
    const history = await fetchChatMessages(chatId);
    setMessages(history);
    const targetChat = cloudChats.find(c => c.id === chatId);
    if (history.length > 0) {
      memoryEngine.updateChatMemoryNode(chatId, targetChat?.title || 'محادثة سابقة', history);
    }
    navigateTo('chat');
  };

  const handleDeleteChat = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteCloudChat(chatId);
    if (currentChatId === chatId) {
      handleNewChat();
    }
    refreshSidebarChats(user?.id ?? null);
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
    refreshSidebarChats(null);
  };

  return (
    <div className="fixed inset-0 w-full h-[100dvh] flex flex-col bg-[#030306] text-[#f8fafc] font-sans antialiased overflow-hidden selection:bg-white selection:text-black relative" dir="rtl">
      
      {/* Intelligent Interactive High-Tech Laser Blueprint Grid (Dynamic Cursor Tracking & Multi-Model Color Auras) */}
      <InteractiveGridBackground activeModel={activeModel} isX1Active={isX1Active} />

      {/* Ambient Neutral Monochrome Luminescence (Sleek Obsidian & Pure Grey Depth) */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0 select-none opacity-30">
        <div className="absolute -top-[15%] right-[10%] w-[550px] h-[550px] rounded-full bg-gradient-to-br from-zinc-700/20 via-zinc-800/10 to-transparent blur-[140px]" />
        <div className="absolute top-[35%] -left-[10%] w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-zinc-800/20 via-zinc-900/15 to-transparent blur-[150px]" />
        <div className="absolute -bottom-[15%] right-[20%] w-[500px] h-[500px] rounded-full bg-gradient-to-tl from-zinc-700/15 via-zinc-800/10 to-transparent blur-[140px]" />
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

      {/* Mandatory User Authentication Modal */}
      <AuthRequiredModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      {/* Subscription & Activation Code Modal */}
      <SubscriptionModal
        isOpen={isSubModalOpen}
        onClose={() => setIsSubModalOpen(false)}
        targetPlanId={subModalTargetPlan}
        onSuccess={(plan) => handleSelectPlan(plan)}
        user={user}
      />

      {/* Architecture & Capabilities Timeline Roadmap Modal */}
      <ArchitectureModal
        isOpen={isArchitectureModalOpen}
        onClose={() => setIsArchitectureModalOpen(false)}
        onStartChat={() => {
          navigateTo('chat');
          const textarea = document.querySelector('textarea') as HTMLTextAreaElement | null;
          if (textarea) textarea.focus();
        }}
      />

      {/* Cloud History & Navigation Drawer */}
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
        onClearChat={handleClearChat}
        currentChatTokens={currentChatTokens}
        totalTokens={totalTokens}
        onNavigateToPricing={() => navigateTo('pricing')}
        onNavigateToLimits={() => navigateTo('limits')}
        onNavigateToProfile={() => navigateTo('profile')}
        onNavigateToChat={() => navigateTo('chat')}
      />

      {/* Main App Layout */}
      {viewMode === 'landing' ? (
        <LandingPage
          onStartChat={() => {
            if (!user) {
              setIsAuthModalOpen(true);
              return;
            }
            localStorage.setItem(STORAGE_KEY_SEEN_LANDING, 'true');
            navigateTo('chat');
          }}
          onSelectPreset={(preset) => {
            if (!user) {
              setIsAuthModalOpen(true);
              return;
            }
            localStorage.setItem(STORAGE_KEY_SEEN_LANDING, 'true');
            navigateTo('chat');
            handleSendMessage(preset);
          }}
          onOpenArchitecture={() => setIsArchitectureModalOpen(true)}
          onOpenSidebar={() => setIsSidebarOpen(true)}
          onNavigateToPricing={() => navigateTo('pricing')}
          onNavigateToLimits={() => navigateTo('limits')}
          onNavigateToProfile={() => navigateTo('profile')}
          user={user}
        />
      ) : (
        <div className="flex-1 flex flex-col h-full min-h-0 overflow-hidden relative z-10">
          
          {/* PERSISTENT FIXED GLOBAL TOP BAR */}
          <TopBar
            isX1Active={isX1Active}
            activeModel={activeModel}
            onSelectModel={setActiveModel}
            user={user}
            currentView={viewMode === 'privacy' || viewMode === 'terms' ? 'chat' : viewMode}
            currentChatTokens={currentChatTokens}
            totalTokens={totalTokens}
            cloudChatsCount={cloudChats.length}
            onToggleX1={handleToggleX1}
            onOpenSidebar={() => setIsSidebarOpen(true)}
            onNewChat={handleNewChat}
            onClearChat={handleClearChat}
            onGoHome={() => navigateTo('landing')}
            onNavigateToPricing={() => navigateTo('pricing')}
            onNavigateToLimits={() => navigateTo('limits')}
            onNavigateToProfile={() => navigateTo('profile')}
            onNavigateToChat={() => navigateTo('chat')}
          />

          {/* Dynamic Page Views Container */}
          <div className="flex-1 min-h-0 overflow-hidden relative">
            {viewMode === 'pricing' && (
              <PricingPage
                currentPlanId={currentPlanId}
                onSelectPlan={handleSelectPlan}
                onNavigateToLimits={() => navigateTo('limits')}
                onNavigateToProfile={() => navigateTo('profile')}
                onNavigateToChat={() => navigateTo('chat')}
                user={user}
              />
            )}

            {viewMode === 'limits' && (
              <LimitsPage
                currentPlanId={currentPlanId}
                totalTokensUsed={totalTokens}
                onNavigateToPricing={() => navigateTo('pricing')}
                onNavigateToProfile={() => navigateTo('profile')}
                onNavigateToChat={() => navigateTo('chat')}
                onSelectPlan={handleSelectPlan}
                user={user}
              />
            )}

            {viewMode === 'profile' && (
              <ProfilePage
                currentPlanId={currentPlanId}
                totalTokens={totalTokens}
                user={user}
                onGoogleSignIn={handleGoogleSignIn}
                onSignOut={handleSignOut}
                onNavigateToPricing={() => navigateTo('pricing')}
                onNavigateToLimits={() => navigateTo('limits')}
                onNavigateToChat={() => navigateTo('chat')}
                onClearChatHistory={handleClearChat}
              />
            )}

            {viewMode === 'privacy' && (
              <PrivacyPolicyPage
                onNavigateToChat={() => navigateTo('chat')}
                onNavigateToTerms={() => navigateTo('terms')}
              />
            )}

            {viewMode === 'terms' && (
              <TermsOfServicePage
                onNavigateToChat={() => navigateTo('chat')}
                onNavigateToPrivacy={() => navigateTo('privacy')}
              />
            )}

            {viewMode === 'chat' && (
              <div className="flex flex-col h-full min-h-0 animate-in fade-in duration-150">
                {/* Chat Messages Body - Smart Spacious Width */}
                <main className="flex-1 flex flex-col max-w-5xl w-full mx-auto relative overflow-hidden min-h-0 px-1 sm:px-3">
                  <ChatWindow
                    messages={messages}
                    isStreaming={isStreaming}
                    isX1Active={isX1Active}
                    activeModel={activeModel}
                    onSendPreset={(preset) => handleSendMessage(preset)}
                    onOpenArchitecture={() => setIsArchitectureModalOpen(true)}
                    onToggleX1={handleToggleX1}
                  />
                </main>

                {/* Full-Width Seamless Floating AI Chat Input Wrapper */}
                <div className="sticky bottom-0 z-30 w-full pb-3 sm:pb-4 pt-4 bg-gradient-to-t from-[#030306] via-[#030306]/90 to-transparent pb-safe pointer-events-none">
                  <div className="max-w-5xl mx-auto px-2.5 sm:px-6 pointer-events-auto">
                    <PromptInput
                      onSubmit={(val, meta) => handleSendMessage(val, meta)}
                      isStreaming={isStreaming}
                      onAbort={handleAbort}
                      isX1Active={isX1Active}
                      onToggleX1={handleToggleX1}
                      activeModel={activeModel}
                      onSelectModel={handleSelectModel}
                      placeholder={
                        activeModel === 'deepseek-v4-pro-cyber-2.1' || activeModel === 'deepseek-v4-flash-cyber-2.1'
                          ? "اطرح فرضية علمية أو افحص أمنياً..."
                          : activeModel === 'deepseek-v4-flash-cyber'
                          ? "أدخل رابط الهدف أو اسأل أمنياً..."
                          : activeModel === 'deepseek-v4-flash-vision-exp'
                          ? "اسأل Fathom Cam أو أرفق صور..."
                          : isX1Active
                          ? "اسأل matany.one في أي شيء..."
                          : "اسأل Fathom 1.1 في أي شيء..."
                      }
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
};
