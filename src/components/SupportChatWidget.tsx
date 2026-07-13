import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Send, X, Headphones, Sparkles, User, Bot } from 'lucide-react';
import { ref, onValue, push, set, get, update } from 'firebase/database';
import { database } from '../lib/firebase';
import { SupportMessage, SupportChat } from '../types';

interface SupportChatWidgetProps {
  currentUser: { emailOrPhone: string; role: string; id: string } | null;
}

export default function SupportChatWidget({ currentUser }: SupportChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [chatId, setChatId] = useState<string | null>(null);
  const [liveMode, setLiveMode] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [needName, setNeedName] = useState(false);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [chatStatus, setChatStatus] = useState<'active' | 'closed'>('active');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const startNewChat = () => {
    if (!chatId) return;
    const newId = 'chat_' + Math.random().toString(36).substring(2, 11);
    localStorage.setItem('3d_baski_chat_session_id', newId);
    setChatId(newId);
    setLiveMode(false);
    setChatStatus('active');
    setMessages([]);
    localStorage.removeItem(`bot_history_${chatId}`);
  };

  // Initialize Chat Session ID
  useEffect(() => {
    let storedId = localStorage.getItem('3d_baski_chat_session_id');
    if (!storedId) {
      storedId = 'chat_' + Math.random().toString(36).substring(2, 11);
      localStorage.setItem('3d_baski_chat_session_id', storedId);
    }
    setChatId(storedId);

    const storedName = localStorage.getItem('3d_baski_chat_customer_name') || '';
    if (storedName) {
      setCustomerName(storedName);
    } else if (currentUser) {
      setCustomerName(currentUser.emailOrPhone);
    }
  }, [currentUser]);

  // Initial bot message and local storage messages
  useEffect(() => {
    if (!chatId) return;

    // Load static greeting or local chat messages if not in liveMode yet
    const initialBotMessage: SupportMessage = {
      id: 'welcome',
      sender: 'bot',
      text: 'Merhaba! Ben 3D Baskı Akıllı Destek Botu. 🤖 Karabük Merkezli profesyonel 3D baskı hizmetlerimiz hakkında merak ettiğiniz her şeyi sorabilirsiniz!',
      timestamp: Date.now(),
    };

    if (!liveMode) {
      // Look at local storage cache for bot history
      const localHistory = localStorage.getItem(`bot_history_${chatId}`);
      if (localHistory) {
        try {
          setMessages(JSON.parse(localHistory));
        } catch (e) {
          setMessages([initialBotMessage]);
        }
      } else {
        setMessages([initialBotMessage]);
      }
    }
  }, [chatId, liveMode]);

  // Sync with Firebase once in liveMode
  useEffect(() => {
    if (!chatId || !liveMode) return;

    const chatRef = ref(database, `support_chats/${chatId}`);
    const unsubscribeChat = onValue(chatRef, (snapshot) => {
      if (snapshot.exists()) {
        const chatData = snapshot.val() as SupportChat;
        setLiveMode(chatData.liveMode);
        if (chatData.status) {
          setChatStatus(chatData.status);
        } else {
          setChatStatus('active');
        }
        
        if (chatData.messages) {
          const list = Object.entries(chatData.messages).map(([id, msg]) => ({
            id,
            ...msg,
          })).sort((a, b) => a.timestamp - b.timestamp);
          
          setMessages(list);

          // If chat is closed, check for new messages from admin
          if (!isOpen && list.length > 0) {
            const lastMsg = list[list.length - 1];
            if (lastMsg.sender === 'admin') {
              // Compare with last seen timestamp
              const lastSeen = Number(localStorage.getItem(`last_seen_timestamp_${chatId}`) || '0');
              if (lastMsg.timestamp > lastSeen) {
                setUnreadCount((prev) => prev + 1);
              }
            }
          }
        }
      }
    });

    return () => unsubscribeChat();
  }, [chatId, liveMode, isOpen]);

  // Set last seen timestamp when opening the chat
  useEffect(() => {
    if (isOpen && chatId && messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      localStorage.setItem(`last_seen_timestamp_${chatId}`, String(lastMsg.timestamp));
      setUnreadCount(0);
    }
  }, [isOpen, chatId, messages]);

  // Check if live mode exists in firebase for this session on mount
  useEffect(() => {
    if (!chatId) return;

    const checkLiveMode = async () => {
      const chatSnap = await get(ref(database, `support_chats/${chatId}`));
      if (chatSnap.exists()) {
        const data = chatSnap.val() as SupportChat;
        if (data.liveMode) {
          setLiveMode(true);
          if (data.status) {
            setChatStatus(data.status);
          }
        }
      }
    };
    checkLiveMode();
  }, [chatId]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Bot Auto Reply Engine
  const getBotReply = (text: string): string => {
    const q = text.toLowerCase().trim();
    if (q.includes('fiyat') || q.includes('ücret') || q.includes('para') || q.includes('kaç tl') || q.includes('maliyet')) {
      return "Baskı ücretleri gram ağırlığı üzerinden şeffaf şekilde hesaplanır. ⚖️ 'Özel 3D Baskı' sekmesinden model linkinizi veya dosya adınızı yazarak ağırlık girip güncel fiyatı anında hesaplayabilirsiniz!";
    }
    if (q.includes('kargo') || q.includes('gönder') || q.includes('teslim') || q.includes('nereden') || q.includes('şehir')) {
      return "✈️ Karabük'teki merkezimizden tüm Türkiye'ye anlaşmalı ve indirimli kargolarımızla güvenli gönderim yapıyoruz. Havale sonrası siparişiniz hızla basılıp özenle paketlenir!";
    }
    if (q.includes('filament') || q.includes('malzeme') || q.includes('pla') || q.includes('esun') || q.includes('plastik')) {
      return "💪 Baskılarımızda birinci sınıf eSUN PLA+ filamentleri kullanıyoruz. PLA+'lar standart PLA filamentlere göre çok daha yüksek darbe direnci, mukavemet ve pürüzsüz yüzey kalitesi sunar.";
    }
    if (q.includes('takip') || q.includes('nerede') || q.includes('kod') || q.includes('sipariş')) {
      return "🔍 Siparişinizin durumunu (Baskıda, Hazır, Kargoda vb.) üst menüdeki 'Sipariş Takip' sekmesine giderek Sipariş Kodunuz ile anlık ve canlı olarak izleyebilirsiniz!";
    }
    if (q.includes('merhaba') || q.includes('selam') || q.includes('hey') || q.includes('mrb') || q.includes('slm')) {
      return "Merhaba! Size yardımcı olmaktan mutluluk duyarım. Karabük 3D Baskı ile ilgili merak ettiğiniz konuyu aşağıdan seçebilir veya yazabilirsiniz.";
    }
    return "Anlaşılmadı 🤖. Dilerseniz hemen alttaki '👨‍💼 Canlı Admine Bağlan' seçeneğine tıklayarak gerçek bir insanla (adminimizle) doğrudan canlı sohbete geçebilirsiniz!";
  };

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;

    if (!textToSend) setInputText('');

    const userMsg: SupportMessage = {
      id: 'msg_' + Date.now(),
      sender: 'user',
      text,
      timestamp: Date.now(),
    };

    if (liveMode && chatId) {
      // Send to Firebase
      const chatRef = ref(database, `support_chats/${chatId}`);
      await push(ref(database, `support_chats/${chatId}/messages`), userMsg);
      await update(chatRef, {
        id: chatId,
        customerName: customerName || 'Ziyaretçi Müşteri',
        lastMessage: text,
        updatedAt: Date.now(),
        liveMode: true,
        status: 'active',
      });
    } else {
      // Local Bot Mode
      const newMessages = [...messages, userMsg];
      setMessages(newMessages);
      localStorage.setItem(`bot_history_${chatId}`, JSON.stringify(newMessages));

      // Trigger bot typing delay
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        const replyText = getBotReply(text);
        const botMsg: SupportMessage = {
          id: 'bot_' + Date.now(),
          sender: 'bot',
          text: replyText,
          timestamp: Date.now(),
        };
        const updatedWithBot = [...newMessages, botMsg];
        setMessages(updatedWithBot);
        localStorage.setItem(`bot_history_${chatId}`, JSON.stringify(updatedWithBot));
      }, 750);
    }
  };

  const startLiveMode = () => {
    if (!customerName.trim() && !currentUser) {
      setNeedName(true);
    } else {
      connectToLiveAdmin();
    }
  };

  const connectToLiveAdmin = async () => {
    if (!chatId) return;
    setNeedName(false);
    
    const finalName = customerName.trim() || currentUser?.emailOrPhone || 'Ziyaretçi';
    localStorage.setItem('3d_baski_chat_customer_name', finalName);

    setLiveMode(true);

    const chatRef = ref(database, `support_chats/${chatId}`);
    
    // Check if chat already exists
    const chatSnap = await get(chatRef);
    if (!chatSnap.exists()) {
      // Set initial structure
      await set(chatRef, {
        id: chatId,
        customerName: finalName,
        lastMessage: 'Canlı desteğe bağlandı',
        updatedAt: Date.now(),
        liveMode: true,
        status: 'active',
      });

      // Welcome system messages
      await push(ref(database, `support_chats/${chatId}/messages`), {
        id: 'sys_1',
        sender: 'bot',
        text: `Temsilci bağlantı isteği oluşturuldu. İsim: ${finalName}. Lütfen sorunuzu yazın, adminimiz kısa sürede canlı cevaplayacaktır! 👨‍💼`,
        timestamp: Date.now()
      });
    } else {
      // Make sure liveMode is set to true
      await update(chatRef, {
        customerName: finalName,
        liveMode: true,
        status: 'active',
        updatedAt: Date.now(),
      });
    }
  };

  const handleQuickReply = (text: string) => {
    handleSend(text);
  };

  return (
    <>
      {/* Floating Chat Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 group flex items-center justify-center cursor-pointer"
          id="btn-support-chat-toggle"
        >
          {isOpen ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
          
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center border-2 border-white animate-bounce">
              {unreadCount}
            </span>
          )}
          
          <span className="absolute right-16 bg-slate-900 text-white text-xs px-3 py-1.5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap pointer-events-none font-medium shadow-md">
            Müşteri Desteği 💬
          </span>
        </button>
      </div>

      {/* Chat Window Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className="fixed bottom-24 right-6 w-full max-w-[360px] sm:max-w-[400px] h-[550px] bg-white rounded-3xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden z-50"
            id="panel-support-chat"
          >
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-slate-900 to-slate-850 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${chatStatus === 'closed' && liveMode ? 'bg-rose-500/10 text-rose-400' : liveMode ? 'bg-emerald-500/10 text-emerald-400' : 'bg-indigo-500/10 text-indigo-400'}`}>
                  {chatStatus === 'closed' && liveMode ? <X className="h-5 w-5 animate-none" /> : liveMode ? <Headphones className="h-5 w-5 animate-pulse" /> : <Sparkles className="h-5 w-5" />}
                </div>
                <div>
                  <h4 className="font-bold text-sm tracking-wide">
                    {chatStatus === 'closed' && liveMode ? 'Sohbet Sonlandırıldı' : liveMode ? 'Canlı Destek (Admin)' : '3D Baskı Destek Botu'}
                  </h4>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {chatStatus !== 'closed' && (
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                    )}
                    <span className="text-[10px] text-slate-300 font-medium">
                      {chatStatus === 'closed' && liveMode ? 'Sohbet Kapandı 🔒' : liveMode ? 'Admine Canlı Bağlı' : 'Yapay Zeka Asistanı'}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Chat Body Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
              {needName ? (
                <div className="h-full flex flex-col justify-center items-center text-center p-6 space-y-4">
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-full">
                    <Headphones className="h-8 w-8" />
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-800 text-sm">Canlı Desteğe Bağlanın</h5>
                    <p className="text-xs text-slate-400 mt-1 max-w-[220px]">
                      Lütfen size nasıl hitap etmemizi istediğinizi yazın.
                    </p>
                  </div>
                  <input
                    type="text"
                    placeholder="Adınız Soyadınız"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 text-center"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') connectToLiveAdmin();
                    }}
                  />
                  <div className="flex gap-2 w-full">
                    <button
                      onClick={() => setNeedName(false)}
                      className="flex-1 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      Vazgeç
                    </button>
                    <button
                      onClick={connectToLiveAdmin}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-xl text-xs font-semibold transition-colors shadow-md cursor-pointer"
                    >
                      Bağlan
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((msg) => {
                    const isUser = msg.sender === 'user';
                    const isAdmin = msg.sender === 'admin';
                    const isBot = msg.sender === 'bot';
                    
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col gap-1 max-w-[85%] ${
                          isUser ? 'ml-auto items-end' : 'items-start'
                        }`}
                      >
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider px-1">
                          {isUser ? 'Siz' : isAdmin ? '👨‍💼 Canlı Destek (Admin)' : '🤖 Akıllı Bot'}
                        </span>
                        <div
                          className={`p-2.5 rounded-2xl text-xs leading-relaxed shadow-sm border ${
                            isUser
                              ? 'bg-indigo-600 text-white border-indigo-600 rounded-tr-none'
                              : isAdmin
                              ? 'bg-slate-900 text-white border-slate-900 rounded-tl-none'
                              : 'bg-white text-slate-700 border-slate-100 rounded-tl-none'
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                          <span className={`text-[8px] block text-right mt-1 ${isUser || isAdmin ? 'text-indigo-100/70' : 'text-slate-400'}`}>
                            {new Date(msg.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    );
                  })}

                  {isTyping && (
                    <div className="flex gap-2.5 max-w-[85%]">
                      <div className="bg-white border border-slate-100 p-3 rounded-2xl rounded-tl-none flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce"></span>
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.2s]"></span>
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.4s]"></span>
                      </div>
                    </div>
                  )}

                  {/* Predefined bot option buttons if not in live mode */}
                  {!liveMode && (
                    <div className="space-y-1.5 pt-2">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1 mb-1.5">Sıkça Sorulan Sorular</p>
                      <button
                        onClick={() => handleQuickReply('Fiyatlandırma nasıl yapılıyor?')}
                        className="w-full text-left bg-white hover:bg-indigo-50/50 border border-slate-150 hover:border-indigo-150 text-slate-700 px-3.5 py-2.5 rounded-xl text-xs transition-all shadow-sm flex items-center justify-between cursor-pointer"
                      >
                        <span>⚖️ Fiyatlandırma nasıl yapılıyor?</span>
                      </button>
                      <button
                        onClick={() => handleQuickReply('Kargo gönderimi var mı?')}
                        className="w-full text-left bg-white hover:bg-indigo-50/50 border border-slate-150 hover:border-indigo-150 text-slate-700 px-3.5 py-2.5 rounded-xl text-xs transition-all shadow-sm flex items-center justify-between cursor-pointer"
                      >
                        <span>✈️ Kargo gönderimi var mı?</span>
                      </button>
                      <button
                        onClick={() => handleQuickReply('Hangi filamentleri kullanıyorsunuz?')}
                        className="w-full text-left bg-white hover:bg-indigo-50/50 border border-slate-150 hover:border-indigo-150 text-slate-700 px-3.5 py-2.5 rounded-xl text-xs transition-all shadow-sm flex items-center justify-between cursor-pointer"
                      >
                        <span>💪 Hangi filamentleri kullanıyorsunuz?</span>
                      </button>
                      <button
                        onClick={() => handleQuickReply('Siparişimi nasıl takip edebilirim?')}
                        className="w-full text-left bg-white hover:bg-indigo-50/50 border border-slate-150 hover:border-indigo-150 text-slate-700 px-3.5 py-2.5 rounded-xl text-xs transition-all shadow-sm flex items-center justify-between cursor-pointer"
                      >
                        <span>🔍 Siparişimi nasıl takip edebilirim?</span>
                      </button>
                      
                      <div className="pt-2 border-t border-slate-100 mt-2">
                        <button
                          onClick={startLiveMode}
                          className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold px-3.5 py-2.5 rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Headphones className="h-4 w-4" />
                          <span>👨‍💼 Canlı Admine (Gerçek İnsana) Bağlan</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Reference marker for scroll */}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

             {/* Input Footer */}
            {!needName && (
              chatStatus === 'closed' && liveMode ? (
                <div className="p-4 border-t border-slate-100 bg-slate-50 flex flex-col gap-2 items-center justify-center text-center">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600">
                    <span>🔒 Sohbet admin tarafından kapatıldı.</span>
                  </div>
                  <p className="text-[10px] text-slate-400">Yeni bir soru veya baskı talebi için yeni bir sohbet başlatabilirsiniz.</p>
                  <button
                    onClick={startNewChat}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-md flex items-center justify-center gap-1 mt-1"
                  >
                    Yeni Sohbet Başlat 💬
                  </button>
                </div>
              ) : (
                <div className="p-3 border-t border-slate-100 bg-white flex items-center gap-2">
                  <input
                    type="text"
                    placeholder={liveMode ? "Canlı desteğe yazın..." : "Sorunuzu buraya yazın..."}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSend();
                    }}
                    className="flex-1 px-3.5 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 focus:border-slate-300 focus:ring-2 focus:ring-indigo-100 rounded-xl text-xs outline-none text-slate-800 transition-all"
                  />
                  <button
                    onClick={() => handleSend()}
                    disabled={!inputText.trim()}
                    className="p-2.5 bg-indigo-600 disabled:opacity-40 hover:bg-indigo-700 disabled:hover:bg-indigo-600 text-white rounded-xl shadow-md transition-all flex items-center justify-center cursor-pointer"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </div>
              )
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
