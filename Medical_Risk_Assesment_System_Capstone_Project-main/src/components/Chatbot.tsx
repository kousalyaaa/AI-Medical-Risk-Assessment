import React, { useState, useRef, useEffect } from 'react';
import { apiClient } from '@/integrations/api/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MessageCircle, X, Minimize2, Maximize2 } from 'lucide-react';

interface Message { role: 'user' | 'assistant'; text: string }

const Chatbot: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const send = async () => {
    if (!input.trim()) return;
    const userMsg: Message = { role: 'user', text: input };
    setMessages((m) => [...m, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const response = await apiClient.post('/chat/groq', { prompt: userMsg.text });
      const reply = response.data?.reply || 'No reply';
      setMessages((m) => [...m, { role: 'assistant', text: reply }]);
    } catch (err) {
      setMessages((m) => [...m, { role: 'assistant', text: 'Error: could not contact server.' }]);
    } finally {
      setLoading(false);
    }
  };

  const toggleOpen = () => setIsOpen((v) => !v);
  const minimize = () => setIsOpen(false);
  const close = () => setIsOpen(false);
  const toggleMaximize = () => setIsMaximized((v) => !v);

  return (
    <>
      {/* Launcher Icon */}
      <button
        aria-label="Open chatbot"
        onClick={toggleOpen}
        className="fixed right-6 bottom-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 text-white flex items-center justify-center shadow-xl"
      >
        <MessageCircle className="w-7 h-7" />
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className={`fixed right-6 bottom-20 z-50 bg-white border rounded-lg shadow-lg ${isMaximized ? 'w-[90vw] h-[80vh]' : 'w-96 h-96'}`}>
          <div className="flex items-center justify-between p-2 border-b">
            <div className="flex items-center gap-3">
              <MessageCircle className="w-5 h-5 text-sky-600" />
              <div className="font-semibold">Health Chatbot</div>
              <div className="text-xs text-muted-foreground">powered by GROQ</div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={minimize} className="p-1 rounded hover:bg-slate-100" title="Minimize">
                <Minimize2 className="w-4 h-4" />
              </button>
              <button onClick={toggleMaximize} className="p-1 rounded hover:bg-slate-100" title="Maximize">
                <Maximize2 className="w-4 h-4" />
              </button>
              <button onClick={close} className="p-1 rounded hover:bg-slate-100" title="Close">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div ref={scrollRef} className="p-3 max-h-[calc(100%-120px)] overflow-auto space-y-2">
            {messages.length === 0 ? (
              <div className="text-sm text-muted-foreground">Ask for diet or lifestyle suggestions</div>
            ) : (
              messages.map((m, i) => (
                <div key={i} className={m.role === 'user' ? 'text-right' : 'text-left'}>
                  <div className={`inline-block p-2 rounded ${m.role === 'user' ? 'bg-slate-200' : 'bg-green-50'}`}>
                    <div className="text-sm whitespace-pre-line">{m.text}</div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-3 border-t flex gap-2">
            <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about diet, exercise, sleep..." />
            <Button onClick={send} disabled={loading || !input.trim()}>{loading ? 'Sending...' : 'Send'}</Button>
          </div>
        </div>
      )}
    </>
  );
};

export default Chatbot;
