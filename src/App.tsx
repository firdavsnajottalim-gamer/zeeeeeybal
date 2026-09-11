import React, { useState, useEffect, useRef } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { 
  auth, 
  testConnection, 
  logoutUser, 
  fetchUserChats, 
  saveChatSession, 
  deleteChatSession, 
  fetchChatMessages, 
  saveChatMessage, 
  fetchSavedItems, 
  addSavedItemToDb, 
  deleteSavedItemFromDb, 
  fetchUserProfile, 
  saveUserProfile 
} from './lib/firebase';
import { parseContent } from './lib/parser';
import { ChatSession, Message, SavedItem, UserSettings, UserStats } from './types';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ChatMessageItem } from './components/ChatMessageItem';
import { PromptInputBar } from './components/PromptInputBar';
import { WelcomeView } from './components/WelcomeView';
import { CodePreviewModal } from './components/CodePreviewModal';
import { ShaxsiyKabinetModal } from './components/ShaxsiyKabinetModal';
import { AuthModal } from './components/AuthModal';
import { EyeOff } from 'lucide-react';

const DEFAULT_SETTINGS: UserSettings = {
  streamSpeed: 'slow',
  neonIntensity: 'subtle',
  defaultMode: 'all',
  soundEffects: true,
};

const DEFAULT_STATS: UserStats = {
  totalMessages: 0,
  totalCodes: 0,
  totalPrompts: 0,
  totalImages: 0,
};

export default function App() {
  // Auth state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // App & Chat states
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [activeMode, setActiveMode] = useState<'all' | 'code' | 'image_prompt' | 'image_gen'>('all');
  const [isIncognito, setIsIncognito] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Modals
  const [cabinetOpen, setCabinetOpen] = useState(false);
  const [previewCodeModal, setPreviewCodeModal] = useState<{ isOpen: boolean; code: string; language: string }>({
    isOpen: false,
    code: '',
    language: 'html',
  });

  // User Cabinet Data
  const [stats, setStats] = useState<UserStats>(DEFAULT_STATS);
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);

  // Streaming & Typewriter queue references
  const [isStreaming, setIsStreaming] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const streamQueueRef = useRef<string>('');
  const isDrainingQueueRef = useRef(false);
  const currentMsgIdRef = useRef<string | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isStreaming]);

  // Initial Firebase connection check and Auth listener
  useEffect(() => {
    testConnection();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setAuthLoading(false);

      if (user) {
        setAuthModalOpen(false);
        // Load user cloud profile, chats and saved bookmarks
        try {
          const profile = await fetchUserProfile(user.uid);
          if (profile) {
            setStats(profile.stats || DEFAULT_STATS);
            setSettings(profile.settings || DEFAULT_SETTINGS);
          } else {
            await saveUserProfile({
              uid: user.uid,
              displayName: user.displayName || 'Foydalanuvchi',
              email: user.email || '',
              photoURL: user.photoURL || '',
              createdAt: Date.now(),
              stats: DEFAULT_STATS,
              settings: DEFAULT_SETTINGS,
            });
          }

          const userChats = await fetchUserChats(user.uid);
          setSessions(userChats);

          const items = await fetchSavedItems(user.uid);
          setSavedItems(items);
        } catch (err) {
          console.warn('Error fetching user cloud data:', err);
        }
      } else {
        // User requested: "boshida yangi kirgan odam da rinchi login oynasi chqadi shu yerda email parol orqali kirish yoki google orqali kirish qilib qoy"
        setAuthModalOpen(true);

        const localChats = localStorage.getItem('neongen_guest_chats');
        if (localChats) {
          try {
            setSessions(JSON.parse(localChats));
          } catch (e) {}
        }
        const localSaved = localStorage.getItem('neongen_saved_items');
        if (localSaved) {
          try {
            setSavedItems(JSON.parse(localSaved));
          } catch (e) {}
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Load messages when currentSessionId changes
  useEffect(() => {
    if (!currentSessionId) {
      setMessages([]);
      return;
    }

    const activeSession = sessions.find(s => s.id === currentSessionId);
    if (activeSession?.isIncognito) {
      return;
    }

    if (currentUser) {
      fetchChatMessages(currentSessionId).then((loaded) => {
        setMessages(loaded);
      }).catch(err => {
        console.error('Failed to load chat messages:', err);
      });
    } else {
      const localMsgs = localStorage.getItem(`neongen_msgs_${currentSessionId}`);
      if (localMsgs) {
        try {
          setMessages(JSON.parse(localMsgs));
        } catch (e) {}
      }
    }
  }, [currentSessionId, currentUser]);

  const handleLogout = async () => {
    try {
      await logoutUser();
      setSessions([]);
      setCurrentSessionId(null);
      setMessages([]);
      setCabinetOpen(false);
      setAuthModalOpen(true);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Start a new chat session
  const handleNewChat = () => {
    if (isStreaming) {
      handleStopStreaming();
    }

    const newId = 'chat_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const newSession: ChatSession = {
      id: newId,
      userId: currentUser?.uid || 'guest',
      title: isIncognito ? 'Inkognito suhbat' : 'Yangi suhbat',
      category: activeMode,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messageCount: 0,
      isIncognito: isIncognito,
    };

    if (!isIncognito) {
      setSessions(prev => [newSession, ...prev]);
      if (currentUser) {
        saveChatSession(newSession);
      } else {
        localStorage.setItem('neongen_guest_chats', JSON.stringify([newSession, ...sessions]));
      }
    }

    setCurrentSessionId(newId);
    setMessages([]);
  };

  // Delete chat session
  const handleDeleteSession = async (chatId: string) => {
    setSessions(prev => prev.filter(s => s.id !== chatId));
    if (currentSessionId === chatId) {
      setCurrentSessionId(null);
      setMessages([]);
    }

    if (currentUser) {
      try {
        await deleteChatSession(chatId);
      } catch (e) {
        console.error('Delete chat error:', e);
      }
    } else {
      localStorage.removeItem(`neongen_msgs_${chatId}`);
      localStorage.setItem('neongen_guest_chats', JSON.stringify(sessions.filter(s => s.id !== chatId)));
    }
  };

  // Save Item to User Cabinet
  const handleSaveItem = async (item: Omit<SavedItem, 'id' | 'userId' | 'createdAt'>) => {
    const newItem: SavedItem = {
      ...item,
      id: 'saved_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      userId: currentUser?.uid || 'guest',
      createdAt: Date.now(),
    };

    setSavedItems(prev => [newItem, ...prev]);

    if (currentUser) {
      try {
        await addSavedItemToDb(newItem);
      } catch (err) {
        console.error('Save to db error:', err);
      }
    } else {
      localStorage.setItem('neongen_saved_items', JSON.stringify([newItem, ...savedItems]));
    }
  };

  const handleDeleteSavedItem = async (id: string) => {
    setSavedItems(prev => prev.filter(i => i.id !== id));
    if (currentUser) {
      try {
        await deleteSavedItemFromDb(id);
      } catch (err) {
        console.error('Delete saved error:', err);
      }
    } else {
      localStorage.setItem('neongen_saved_items', JSON.stringify(savedItems.filter(i => i.id !== id)));
    }
  };

  // Update Settings
  const handleUpdateSettings = async (newSettings: Partial<UserSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);

    if (currentUser) {
      saveUserProfile({
        uid: currentUser.uid,
        displayName: currentUser.displayName || 'Foydalanuvchi',
        email: currentUser.email || '',
        photoURL: currentUser.photoURL || '',
        createdAt: Date.now(),
        stats,
        settings: updated,
      });
    }
  };

  // Stop streaming
  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
    streamQueueRef.current = '';
    isDrainingQueueRef.current = false;
  };

  // Smooth Typewriter pacing engine for slow, smooth text flow
  const startTypewriterDraining = (msgId: string) => {
    if (isDrainingQueueRef.current) return;
    isDrainingQueueRef.current = true;

    const charDelay = settings.streamSpeed === 'slow' ? 18 : settings.streamSpeed === 'medium' ? 8 : 2;

    const step = () => {
      if (streamQueueRef.current.length > 0) {
        const batchSize = settings.streamSpeed === 'slow' 
          ? (streamQueueRef.current.length > 150 ? 3 : 1)
          : (streamQueueRef.current.length > 100 ? 5 : 2);

        const nextChars = streamQueueRef.current.slice(0, batchSize);
        streamQueueRef.current = streamQueueRef.current.slice(batchSize);

        setMessages(prev =>
          prev.map(m => {
            if (m.id === msgId) {
              const updatedText = m.text + nextChars;
              const parsed = parseContent(updatedText);
              return {
                ...m,
                text: updatedText,
                isThinking: false,
                isStreaming: true,
                codeBlocks: parsed.codeBlocks,
                imagePromptDetails: parsed.imagePromptDetails,
              };
            }
            return m;
          })
        );

        setTimeout(step, charDelay);
      } else {
        isDrainingQueueRef.current = false;
      }
    };

    setTimeout(step, charDelay);
  };

  // Direct Image Generation Handler
  const handleGenerateImage = async (promptText: string, ar: string = '16:9') => {
    if (!promptText.trim()) return;

    let chatId = currentSessionId;
    if (!chatId) {
      chatId = 'chat_' + Date.now();
      const newSession: ChatSession = {
        id: chatId,
        userId: currentUser?.uid || 'guest',
        title: promptText.slice(0, 30) + '...',
        category: 'image_gen',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messageCount: 0,
        isIncognito: isIncognito,
      };

      if (!isIncognito) {
        setSessions(prev => [newSession, ...prev]);
        if (currentUser) saveChatSession(newSession);
      }
      setCurrentSessionId(chatId);
    }

    const userMsg: Message = {
      id: 'msg_' + Date.now(),
      role: 'user',
      text: promptText,
      type: 'image_gen',
      timestamp: Date.now(),
    };

    const modelMsgId = 'msg_' + (Date.now() + 1);
    const modelMsg: Message = {
      id: modelMsgId,
      role: 'model',
      text: '',
      type: 'generated_image',
      isThinking: true,
      timestamp: Date.now() + 1,
    };

    setMessages(prev => [...prev, userMsg, modelMsg]);
    setIsStreaming(true);

    try {
      const response = await fetch('/api/image/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptText, aspectRatio: ar }),
      });

      if (!response.ok) {
        throw new Error('Rasm yaratishda xatolik yuz berdi');
      }

      const data = await response.json();

      setMessages(prev =>
        prev.map(m => {
          if (m.id === modelMsgId) {
            return {
              ...m,
              isThinking: false,
              text: `Sizning so'rovingiz bo'yicha yaratilgan tasvir:\n"${promptText}"`,
              imageUrl: data.imageUrl,
            };
          }
          return m;
        })
      );

      setStats(prev => ({
        ...prev,
        totalMessages: prev.totalMessages + 2,
        totalImages: prev.totalImages + 1,
      }));

      if (!isIncognito) {
        if (currentUser) {
          saveChatMessage(chatId, currentUser.uid, userMsg);
          saveChatMessage(chatId, currentUser.uid, {
            ...modelMsg,
            isThinking: false,
            text: `Tasvir: "${promptText}"`,
            imageUrl: data.imageUrl,
          });
        }
      }
    } catch (err: any) {
      console.error(err);
      setMessages(prev =>
        prev.map(m => {
          if (m.id === modelMsgId) {
            return {
              ...m,
              isThinking: false,
              text: `⚠️ Xatolik yuz berdi: ${err.message || 'Rasm yaratib bo\'lmadi'}`,
            };
          }
          return m;
        })
      );
    } finally {
      setIsStreaming(false);
    }
  };

  // Main Submit Handler (Chat, Code, Prompt stream)
  const handleSubmit = async (overridePrompt?: string, overrideMode?: 'all' | 'code' | 'image_prompt' | 'image_gen') => {
    const promptToSend = overridePrompt || input;
    const modeToSend = overrideMode || activeMode;

    if (!promptToSend.trim() || isStreaming) return;

    if (modeToSend === 'image_gen') {
      setInput('');
      handleGenerateImage(promptToSend, '16:9');
      return;
    }

    setInput('');

    let chatId = currentSessionId;
    if (!chatId) {
      chatId = 'chat_' + Date.now();
      const newSession: ChatSession = {
        id: chatId,
        userId: currentUser?.uid || 'guest',
        title: promptToSend.slice(0, 30) + '...',
        category: modeToSend,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messageCount: 0,
        isIncognito: isIncognito,
      };

      if (!isIncognito) {
        setSessions(prev => [newSession, ...prev]);
        if (currentUser) saveChatSession(newSession);
      }
      setCurrentSessionId(chatId);
    }

    const userMsg: Message = {
      id: 'msg_' + Date.now(),
      role: 'user',
      text: promptToSend,
      type: modeToSend === 'code' ? 'code' : modeToSend === 'image_prompt' ? 'image_prompt' : 'chat',
      timestamp: Date.now(),
    };

    const modelMsgId = 'msg_' + (Date.now() + 1);
    currentMsgIdRef.current = modelMsgId;
    streamQueueRef.current = '';

    const modelMsg: Message = {
      id: modelMsgId,
      role: 'model',
      text: '',
      type: modeToSend === 'code' ? 'code' : modeToSend === 'image_prompt' ? 'image_prompt' : 'chat',
      isThinking: true,
      isStreaming: true,
      timestamp: Date.now() + 1,
    };

    setMessages(prev => [...prev, userMsg, modelMsg]);
    setIsStreaming(true);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const historyPayload = messages.slice(-10).map(m => ({
        role: m.role,
        text: m.text,
      }));
      historyPayload.push({ role: 'user', text: promptToSend });

      const res = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: historyPayload,
          mode: modeToSend,
        }),
        signal: abortController.signal,
      });

      if (!res.ok) {
        let errMessage = 'Server ulanishida xatolik';
        try {
          const errData = await res.json();
          if (errData.error) errMessage = errData.error;
        } catch (_) {}
        throw new Error(errMessage);
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('Oqim o\'qib bo\'lmadi');
      }

      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          // Ignore SSE comments/keepalive pings
          if (line.startsWith(':')) {
            continue;
          }

          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6).trim();
            if (!dataStr) continue;

            try {
              const data = JSON.parse(dataStr);

              if (data.type === 'thinking') {
                setMessages(prev =>
                  prev.map(m => (m.id === modelMsgId ? { ...m, isThinking: true } : m))
                );
              } else if (data.type === 'start_writing') {
                setMessages(prev =>
                  prev.map(m => (m.id === modelMsgId ? { ...m, isThinking: false } : m))
                );
              } else if (data.type === 'chunk') {
                streamQueueRef.current += data.text;
                startTypewriterDraining(modelMsgId);
              } else if (data.type === 'error') {
                streamQueueRef.current += `\n\n⚠️ ${data.message || 'Xatolik yuz berdi'}`;
                startTypewriterDraining(modelMsgId);
              }
            } catch (jsonErr) {}
          }
        }
      }

      const checkDrain = () => {
        if (streamQueueRef.current.length > 0) {
          setTimeout(checkDrain, 50);
        } else {
          setMessages(prev =>
            prev.map(m => {
              if (m.id === modelMsgId) {
                const parsed = parseContent(m.text);
                const finalMsg: Message = {
                  ...m,
                  isStreaming: false,
                  isThinking: false,
                  codeBlocks: parsed.codeBlocks,
                  imagePromptDetails: parsed.imagePromptDetails,
                };

                if (!isIncognito && chatId) {
                  if (currentUser) {
                    saveChatMessage(chatId, currentUser.uid, userMsg);
                    saveChatMessage(chatId, currentUser.uid, finalMsg);
                  } else {
                    localStorage.setItem(`neongen_msgs_${chatId}`, JSON.stringify([...messages, userMsg, finalMsg]));
                  }
                }

                setStats(s => ({
                  ...s,
                  totalMessages: s.totalMessages + 2,
                  totalCodes: s.totalCodes + (parsed.codeBlocks?.length || 0),
                  totalPrompts: s.totalPrompts + (parsed.imagePromptDetails ? 1 : 0),
                }));

                return finalMsg;
              }
              return m;
            })
          );
          setIsStreaming(false);
        }
      };

      checkDrain();
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('Stream aborted by user');
      } else {
        console.error('Streaming error:', err);
        const userFriendlyMsg =
          err.message?.includes('Failed to fetch') || err.message?.includes('network error')
            ? "Tarmoq bilan ulanishda vaqtinchalik uzilish bo'ldi. Iltimos qayta yuborib ko'ring."
            : err.message || "Xatolik yuz berdi";
        setMessages(prev =>
          prev.map(m => {
            if (m.id === modelMsgId) {
              return {
                ...m,
                isThinking: false,
                isStreaming: false,
                text: m.text ? m.text + `\n\n[${userFriendlyMsg}]` : `⚠️ ${userFriendlyMsg}`,
              };
            }
            return m;
          })
        );
      }
      setIsStreaming(false);
    }
  };

  return (
    <div className="flex h-screen w-screen bg-white text-slate-800 overflow-hidden font-sans">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onCloseMobile={() => setSidebarOpen(false)}
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={(id) => setCurrentSessionId(id)}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
        isIncognito={isIncognito}
        onToggleIncognito={() => {
          setIsIncognito(!isIncognito);
          if (!isIncognito) {
            handleNewChat();
          }
        }}
        onOpenCabinet={() => setCabinetOpen(true)}
        currentUser={currentUser}
        onOpenAuth={() => setAuthModalOpen(true)}
        savedCount={savedItems.length}
      />

      {/* Main Canvas */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative overflow-hidden bg-white">
        {/* Header */}
        <Header
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />

        {/* Incognito Notice Banner */}
        {isIncognito && (
          <div className="bg-slate-900 text-white px-4 py-2 flex items-center justify-between text-xs z-20 shadow-xs">
            <div className="flex items-center gap-2">
              <EyeOff className="w-3.5 h-3.5 text-blue-400" />
              <span>
                <strong>Inkognito Rejimi faol:</strong> Ushbu suhbat xabarlari bulutli bazaga saqlanmaydi.
              </span>
            </div>
            <button
              onClick={() => setIsIncognito(false)}
              className="underline hover:text-blue-300 transition-colors cursor-pointer"
            >
              Rejimdan chiqish
            </button>
          </div>
        )}

        {/* Chat Messages or Welcome Screen */}
        <div className="flex-1 overflow-y-auto flex flex-col bg-white">
          {messages.length === 0 ? (
            <WelcomeView
              onSelectSuggestion={(prompt, mode) => {
                setActiveMode(mode);
                handleSubmit(prompt, mode);
              }}
            />
          ) : (
            <div className="flex-1">
              {messages.map((m) => (
                <ChatMessageItem
                  key={m.id}
                  message={m}
                  onSaveCode={(code, lang, title) =>
                    handleSaveItem({ type: 'code', title, content: code, language: lang })
                  }
                  onSavePrompt={(prompt, title) =>
                    handleSaveItem({ type: 'prompt', title, content: prompt })
                  }
                  onSaveImage={(imageUrl, prompt) =>
                    handleSaveItem({ type: 'image', title: 'Generatsiya qilingan rasm', content: prompt, imageUrl })
                  }
                  onOpenCodePreview={(code, lang) =>
                    setPreviewCodeModal({ isOpen: true, code, language: lang })
                  }
                  onGenerateImageFromPrompt={(prompt, ar) => {
                    handleGenerateImage(prompt, ar);
                  }}
                />
              ))}
              <div ref={chatBottomRef} />
            </div>
          )}
        </div>

        {/* Floating Prompt Bar */}
        <PromptInputBar
          input={input}
          onChangeInput={setInput}
          onSubmit={() => handleSubmit()}
          isStreaming={isStreaming}
          onStopStreaming={handleStopStreaming}
          activeMode={activeMode}
          onChangeMode={setActiveMode}
        />
      </div>

      {/* Interactive Code Preview Modal */}
      <CodePreviewModal
        isOpen={previewCodeModal.isOpen}
        onClose={() => setPreviewCodeModal(prev => ({ ...prev, isOpen: false }))}
        code={previewCodeModal.code}
        language={previewCodeModal.language}
      />

      {/* Shaxsiy Kabinet Modal */}
      <ShaxsiyKabinetModal
        isOpen={cabinetOpen}
        onClose={() => setCabinetOpen(false)}
        currentUser={currentUser}
        onOpenAuth={() => setAuthModalOpen(true)}
        onLogout={handleLogout}
        stats={stats}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        savedItems={savedItems}
        onDeleteSavedItem={handleDeleteSavedItem}
        onSelectSavedItemToChat={(content) => {
          setInput(content);
          setCabinetOpen(false);
        }}
        onOpenCodePreview={(code, lang) =>
          setPreviewCodeModal({ isOpen: true, code, language: lang })
        }
      />

      {/* First-time Login / Register Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={() => {
          setAuthModalOpen(false);
        }}
      />
    </div>
  );
}
