
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { chatWithAssistant } from '../services/geminiService';

const AssistantChat: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: 'أهلاً بك يا صديقي الصغير! أنا بندوق 🤖، مساعدك الذكي. هل تريد أن تسألني عن شيء في القصة؟' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMsg = inputValue.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await chatWithAssistant(userMsg, messages);
      setMessages(prev => [...prev, { role: 'model', text: response || 'عذراً، لم أسمعك جيداً. هل يمكنك التكرار؟' }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', text: 'أوه، لقد تعثرت في الكلام! حاول مرة أخرى.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 left-6 z-50">
      {isOpen ? (
        <div className="bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] w-80 md:w-[24rem] flex flex-col overflow-hidden border-8 border-white ring-4 ring-blue-100">
          <div className="bg-blue-500 p-5 text-white flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-3xl shadow-inner animate-bounce">🤖</div>
              <div>
                <span className="font-black text-xl block leading-tight">بندوق</span>
                <span className="text-xs opacity-80 font-bold">مستعد للدردشة!</span>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="bg-blue-400/50 p-2 rounded-xl hover:bg-blue-600 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div ref={scrollRef} className="h-96 overflow-y-auto p-6 space-y-6 bg-blue-50/50">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[90%] p-4 rounded-3xl text-lg font-bold shadow-sm relative ${
                  msg.role === 'user' 
                  ? 'bg-white text-slate-800 rounded-br-none border-2 border-blue-50' 
                  : 'bg-blue-600 text-white rounded-bl-none shadow-blue-200'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-end">
                <div className="bg-blue-200 p-4 rounded-3xl animate-pulse flex gap-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-75"></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-150"></div>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 bg-white border-t-4 border-blue-50 flex gap-3">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="اكتب رسالة لبندوق..."
              className="flex-1 bg-gray-50 border-2 border-gray-100 rounded-2xl px-5 py-3 focus:outline-none focus:border-blue-400 focus:bg-white transition-all text-lg font-bold"
            />
            <button
              onClick={handleSend}
              disabled={isLoading}
              className="bg-blue-500 text-white p-4 rounded-2xl hover:bg-blue-600 transition-all shadow-lg hover:shadow-blue-200 disabled:opacity-50 transform active:scale-90"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="group bg-blue-500 text-white p-5 rounded-[2rem] shadow-[0_15px_30px_rgba(59,130,246,0.3)] hover:scale-105 transition-all animate-float flex items-center gap-4 hover:bg-blue-600 ring-4 ring-white"
        >
          <span className="font-black text-xl hidden md:inline pl-2">بندوق ينتظرك!</span>
          <div className="bg-white rounded-2xl p-2 text-3xl group-hover:rotate-12 transition-transform shadow-inner">🤖</div>
        </button>
      )}
    </div>
  );
};

export default AssistantChat;
