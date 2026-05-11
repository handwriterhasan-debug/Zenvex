import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Bot, Sparkles, ChevronDown, Check } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { useAppContext } from '../context/AppContext';
import Markdown from 'react-markdown';

interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
}

type ModelProvider = 'Grok' | 'Gemini' | 'OpenRouter';

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GEMINI_API_KEY_OVERRIDE = import.meta.env.VITE_GEMINI_API_KEY;
const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;

const MODELS = [
  { id: 'Gemini', name: 'Gemini (Flash)', icon: '✨' },
  { id: 'Grok', name: 'Grok', icon: '🚀' },
  { id: 'OpenRouter', name: 'OpenRouter (gpt-oss-120b:free)', icon: '🧠' }
];

export default function AIAgent() {
  const { userSettings } = useAppContext();
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'model', content: "Hello! I'm your AI Research Agent. Ask me anything about any topic, and I'll do my best to help you learn and understand." }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [provider, setProvider] = useState<ModelProvider>('Gemini');
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const chatHistoryText = messages.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n');
      const systemPrompt = `You are a helpful and knowledgeable AI Agent and Research Assistant. The user's name is ${userSettings.name || 'User'}. You are designed to provide accurate info, summarize topics, help with research, answer questions, and hold engaging conversations like Gemini or Claude. Be thorough but clear and structured in your responses (use markdown, lists, and headings when appropriate). If they ask you for advice on tasks or schedules within the Zenvex app, refer them to the "AI Tutor" option.\n\nChat History:\n${chatHistoryText}`;

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Timeout")), 30000);
      });

      let responseText = "";

      if (provider === 'Gemini') {
        const apiKey = GEMINI_API_KEY_OVERRIDE;
        if (!apiKey) throw new Error("GEMINI_API_KEY is missing.");
        const ai = new GoogleGenAI({ apiKey });
        const response = await Promise.race([
          ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `${systemPrompt}\nUser: ${userMsg.content}\nAssistant:`,
          }),
          timeoutPromise
        ]) as any;
        responseText = response.text || "I'm sorry, I couldn't generate a response.";
      } else if (provider === 'Grok') {
        const groqMessages = [
          { role: 'system', content: systemPrompt },
          ...messages.map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content })),
          { role: 'user', content: userMsg.content }
        ];

        const res = await Promise.race([
          fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${GROQ_API_KEY}`
            },
            body: JSON.stringify({
              model: 'llama3-70b-8192',
              messages: groqMessages
            })
          }),
          timeoutPromise
        ]) as Response;

        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`Groq API error: ${res.status} ${res.statusText} - ${errorText}`);
        }
        const data = await res.json();
        responseText = data.choices?.[0]?.message?.content || "No response received.";
      } else if (provider === 'OpenRouter') {
        const orMessages = [
          { role: 'system', content: systemPrompt },
          ...messages.map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content })),
          { role: 'user', content: userMsg.content }
        ];

        const res = await Promise.race([
          fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: "openai/gpt-oss-120b:free",
              messages: orMessages
            })
          }),
          timeoutPromise
        ]) as Response;

        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`OpenRouter API error: ${res.status} ${res.statusText} - ${errorText}`);
        }
        const data = await res.json();
        responseText = data.choices?.[0]?.message?.content || "No response received.";
      }
      
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'model', content: responseText }]);
    } catch (error: any) {
      console.error("AI Agent error:", error);
      const errorMessage = error.message === "Timeout" 
        ? "The request took too long. Please try asking again." 
        : "Sorry, I encountered an error connecting to the AI service. Please make sure the API key is configured correctly.";
      setMessages(prev => [...prev, { 
        id: crypto.randomUUID(), 
        role: 'model', 
        content: errorMessage 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-4xl mx-auto h-[calc(100dvh-150px)] md:h-[calc(100dvh-120px)] flex flex-col"
    >
      <div className="mb-4">
        <h1 className="text-3xl font-display font-bold mb-2 text-text-main flex items-center gap-3">
          <Bot className="w-8 h-8 text-blue-500" />
          AI Agent
        </h1>
        <p className="text-text-muted">
          Your personal research assistant. Ask me anything, explore new topics, and get knowledge.
        </p>
      </div>

      <div className="flex-1 min-h-0 bg-surface border border-border-dim rounded-2xl flex flex-col overflow-hidden shadow-sm relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[80px] rounded-full pointer-events-none"></div>

        <div className="flex-1 p-4 md:p-6 space-y-6 overflow-y-auto custom-scrollbar relative z-10">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={msg.role === 'user' 
                ? "bg-[#1a1a1a] border border-[#2a2a2a] text-white px-5 py-4 rounded-3xl rounded-tr-sm max-w-[85%] md:max-w-[75%]" 
                : "bg-surface-elevated border border-border-dim text-white px-6 py-5 rounded-3xl rounded-tl-sm max-w-[90%] md:max-w-[85%] shadow-sm"
              }>
                {msg.role === 'user' ? (
                  <div className="text-[15px] leading-relaxed whitespace-pre-wrap">{msg.content}</div>
                ) : (
                  <div className="prose prose-invert prose-emerald max-w-none prose-sm md:prose-base">
                    <Markdown>{msg.content}</Markdown>
                  </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-surface-elevated border border-border-dim px-6 py-4 rounded-3xl rounded-tl-sm flex items-center gap-3 shadow-sm">
                <Sparkles className="w-5 h-5 text-blue-500 animate-pulse" />
                <span className="text-[15px] text-text-muted">Researching and thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} className="h-2" />
        </div>

        <div className="p-4 bg-surface z-10 w-full max-w-3xl mx-auto mb-2">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="flex flex-col w-full bg-[#2a2a2a] border border-[#3a3a3a] rounded-3xl p-2 shadow-sm focus-within:border-[#5a5a5a] transition-all duration-200"
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (input.trim() && !isLoading) handleSend();
                }
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = `${Math.min(target.scrollHeight, 200)}px`;
              }}
              placeholder="Message AI Agent..."
              disabled={isLoading}
              className="w-full bg-transparent px-4 pt-3 pb-2 text-[15px] text-white focus:outline-none resize-none min-h-[56px] max-h-[200px] overflow-y-auto"
            />
            
            <div className="flex items-center justify-between px-2 pb-1 pt-2 border-t border-[#3a3a3a]/50 mt-1">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowModelDropdown(!showModelDropdown)}
                  className="flex items-center gap-1.5 bg-[#363636] hover:bg-[#404040] text-[#e0e0e0] px-3 py-1.5 rounded-xl text-[13px] font-medium transition-colors"
                >
                  <span className="text-sm">{MODELS.find(m => m.id === provider)?.icon}</span>
                  <span>{MODELS.find(m => m.id === provider)?.name}</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-gray-400 opacity-80 transition-transform duration-200 ${showModelDropdown ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {showModelDropdown && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowModelDropdown(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute left-0 sm:left-auto sm:right-auto bottom-full mb-2 w-[220px] sm:w-64 bg-[#2a2a2a] border border-[#3a3a3a] rounded-xl shadow-2xl overflow-hidden z-50 p-1"
                      >
                        {MODELS.map((model) => (
                          <button
                            type="button"
                            key={model.id}
                            onClick={() => { setProvider(model.id as ModelProvider); setShowModelDropdown(false); }}
                            className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-[#363636] transition-colors text-left"
                          >
                            <div className="flex items-center gap-2 sm:gap-3">
                              <span className="text-lg sm:text-xl">{model.icon}</span>
                              <span className={`text-[12px] sm:text-[13px] font-medium ${provider === model.id ? 'text-blue-400' : 'text-[#e0e0e0]'}`}>
                                {model.name}
                              </span>
                            </div>
                            {provider === model.id && <Check className="w-4 h-4 text-blue-400" />}
                          </button>
                        ))}
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              <button 
                type="submit"
                disabled={!input.trim() || isLoading}
                className="w-9 h-9 rounded-full bg-white hover:bg-gray-200 disabled:opacity-20 disabled:hover:bg-white text-black flex items-center justify-center transition-colors shrink-0"
              >
                <Send className="w-4 h-4 ml-0.5" />
              </button>
            </div>
          </form>
          <div className="text-center mt-3 text-[11px] text-[#808080]">
            AI Agent can make mistakes. Consider verifying important information.
          </div>
        </div>
      </div>
    </motion.div>
  );
}