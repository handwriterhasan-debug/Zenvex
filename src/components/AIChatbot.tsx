import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User, Loader2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI, Type, FunctionDeclaration } from '@google/genai';
import { useAppContext } from '../context/AppContext';
import { useNavigate } from 'react-router';
import Markdown from 'react-markdown';

interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
}

export function AIChatbot() {
  const { addSchedule, updateSettings, clearSchedule, undoSchedule, addHabit, addExpense, addNote, applySubscription, userProfile, updateProfile, addNotification, currentDayData, history, userSettings } = useAppContext();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'model', content: "Hi! I'm Your Tutor. How can I help you plan your day, manage expenses, or give advice?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  useEffect(() => {
    const handleOpenChatbot = () => setIsOpen(true);
    window.addEventListener('open-ai-chatbot', handleOpenChatbot);
    return () => window.removeEventListener('open-ai-chatbot', handleOpenChatbot);
  }, []);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY is missing. Please add it to your environment variables.");
      }

      const ai = new GoogleGenAI({ apiKey });
      
      const createScheduleFunction: FunctionDeclaration = {
        name: "createSchedule",
        description: "Creates a schedule by adding multiple tasks to the user's daily schedule.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            tasks: {
              type: Type.ARRAY,
              description: "List of tasks to add to the schedule.",
              items: {
                type: Type.OBJECT,
                properties: {
                  task: { type: Type.STRING, description: "Name of the task." },
                  timeStart: { type: Type.STRING, description: "Start time in HH:MM format (24-hour)." },
                  timeEnd: { type: Type.STRING, description: "End time in HH:MM format (24-hour)." },
                  category: { type: Type.STRING, description: "Category of the task (e.g., Work, Fitness, Rest, Social, Learning, Research, Religious, Spiritual, Hanging out, Games, Reading)." }
                },
                required: ["task", "timeStart", "timeEnd", "category"]
              }
            }
          },
          required: ["tasks"]
        }
      };

      const replaceScheduleFunction: FunctionDeclaration = {
        name: "replaceSchedule",
        description: "Replaces the user's entire schedule with a new set of tasks.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            tasks: {
              type: Type.ARRAY,
              description: "List of tasks to replace the current schedule with.",
              items: {
                type: Type.OBJECT,
                properties: {
                  task: { type: Type.STRING, description: "Name of the task." },
                  timeStart: { type: Type.STRING, description: "Start time in HH:MM format (24-hour)." },
                  timeEnd: { type: Type.STRING, description: "End time in HH:MM format (24-hour)." },
                  category: { type: Type.STRING, description: "Category of the task (e.g., Work, Fitness, Rest, Social, Learning, Research, Religious, Spiritual, Hanging out, Games, Reading)." }
                },
                required: ["task", "timeStart", "timeEnd", "category"]
              }
            }
          },
          required: ["tasks"]
        }
      };

      const updateFinancesFunction: FunctionDeclaration = {
        name: "updateFinances",
        description: "Updates the user's financial settings like current savings balance, fixed monthly income, and currency. Note: Total Wallet balance is automatically calculated as (Fixed Income + Savings + Incomes - Expenses) and cannot be set directly.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            savingsBalance: { type: Type.NUMBER, description: "The new current savings balance." },
            monthlyIncome: { type: Type.NUMBER, description: "The new fixed monthly income." },
            currency: { type: Type.STRING, description: "The 3-letter currency code (e.g., 'USD', 'PKR', 'EUR', 'GBP', 'INR', 'SAR')." }
          }
        }
      };

      const clearScheduleFunction: FunctionDeclaration = {
        name: "clearSchedule",
        description: "Clears the user's current schedule.",
      };

      const undoScheduleFunction: FunctionDeclaration = {
        name: "undoSchedule",
        description: "Undoes the last clear schedule action, restoring the previous schedule.",
      };

      const addHabitFunction: FunctionDeclaration = {
        name: "addHabit",
        description: "Adds a new habit to the user's habit tracker.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: "Name of the habit." },
            category: { type: Type.STRING, description: "Category of the habit (e.g., Health, Productivity, Learning)." },
            target: { type: Type.NUMBER, description: "Target number of days to complete the habit." }
          },
          required: ["name", "category", "target"]
        }
      };

      const addExpenseFunction: FunctionDeclaration = {
        name: "addExpense",
        description: "Adds a new expense or income transaction.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "Title or description of the transaction." },
            amount: { type: Type.NUMBER, description: "Amount of the transaction." },
            type: { type: Type.STRING, description: "Type of transaction: 'income' or 'expense'." },
            category: { type: Type.STRING, description: "Category of the transaction (e.g., Food, Transport, Bills, Salary)." },
            source: { type: Type.STRING, description: "Source of funds: 'wallet' or 'savings'. Defaults to 'wallet'." }
          },
          required: ["title", "amount", "type", "category"]
        }
      };

      const addNoteFunction: FunctionDeclaration = {
        name: "addNote",
        description: "Adds a new note or journal entry.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "Title of the note." },
            content: { type: Type.STRING, description: "Content of the note." },
            tags: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Optional tags for the note." }
          },
          required: ["title", "content"]
        }
      };

      const applyCouponFunction: FunctionDeclaration = {
        name: "applyCoupon",
        description: "Applies a coupon code to get a premium subscription.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            code: { type: Type.STRING, description: "The coupon code to apply." }
          },
          required: ["code"]
        }
      };

      const updateProfileFunction: FunctionDeclaration = {
        name: "updateProfile",
        description: "Updates the user's profile information like name, age, country, and gender.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: "The user's new name." },
            age: { type: Type.STRING, description: "The user's new age." },
            country: { type: Type.STRING, description: "The user's new country." },
            gender: { type: Type.STRING, description: "The user's new gender." }
          }
        }
      };

      const navigateFunction: FunctionDeclaration = {
        name: "navigate",
        description: "Navigates to a specific page in the app.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            page: { type: Type.STRING, description: "The page to navigate to (e.g., 'dashboard', 'schedule', 'habits', 'expenses', 'analytics', 'history', 'notes', 'profile', 'subscription', 'settings')." }
          },
          required: ["page"]
        }
      };

      const chatHistory = messages.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n');
      const prompt = `You are a helpful productivity and life advice assistant named "Your Tutor" inside a dashboard app called Zenvex. The user's name is ${userSettings.name || 'User'}. Keep your answers concise, friendly, and practical. You can help users create schedules, replace schedules, clear schedules, undo schedule clears, update finances, add habits, add expenses, add notes, update their profile, navigate to pages, and apply coupons using the provided tools. 

Key Guidelines:
- Always greet the user by their name if it's the start of a conversation or if they introduce themselves.
- If the user asks to create a schedule but doesn't provide times, ask them for the times before creating it. 
- If the user provides a full schedule and asks to fix or replace their current one, use the replaceSchedule tool.
- If the user wants to apply a coupon, use the applyCoupon tool.
- When creating habits, feel free to add relevant emojis to the habit name if it makes sense (e.g., "🚶‍♂️ 20 days challenge of walk").
- If you generate a plan (like a gym plan or diet plan) and the user asks to save it, use the addNote tool to save it immediately.
- If the user asks for analytics, use the navigate tool to take them to the 'analytics' page.
- If the user mentions a new currency (like $, dollar, USD, EUR, etc.), use the updateFinances tool to update the currency setting.
- When the user adds an expense or income, DO NOT also update the wallet balance using updateFinances. The system will automatically deduct/add the amount from/to their current balance. Only use updateFinances when the user explicitly states their current fixed income or savings balance.
- Always confirm what you've done after calling a tool.

Chat History:
${chatHistory}
User: ${userMsg.content}
Assistant:`;

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Timeout")), 15000);
      });

      const response = await Promise.race([
        ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: prompt,
          config: {
            tools: [{ functionDeclarations: [
              createScheduleFunction, 
              replaceScheduleFunction,
              updateFinancesFunction,
              clearScheduleFunction,
              undoScheduleFunction,
              addHabitFunction,
              addExpenseFunction,
              addNoteFunction,
              applyCouponFunction,
              updateProfileFunction,
              navigateFunction
            ] }]
          }
        }),
        timeoutPromise
      ]) as any;

      let responseText = response.text || "";

      if (response.functionCalls && response.functionCalls.length > 0) {
        for (const call of response.functionCalls) {
          try {
            if (call.name === 'createSchedule') {
              const args = call.args as any;
              if (args.tasks && Array.isArray(args.tasks)) {
                args.tasks.forEach((t: any) => {
                  addSchedule({
                    id: crypto.randomUUID(),
                    task: t.task,
                    timeStart: t.timeStart,
                    timeEnd: t.timeEnd,
                    category: t.category || 'Work',
                    status: 'pending'
                  });
                });
                responseText += "\n\nI've added those tasks to your schedule!";
                addNotification({
                  title: 'Schedule Updated',
                  message: `Added ${args.tasks.length} tasks to your schedule.`,
                  type: 'success'
                });
              }
            } else if (call.name === 'replaceSchedule') {
              const args = call.args as any;
              if (args.tasks && Array.isArray(args.tasks)) {
                clearSchedule();
                args.tasks.forEach((t: any) => {
                  addSchedule({
                    id: crypto.randomUUID(),
                    task: t.task,
                    timeStart: t.timeStart,
                    timeEnd: t.timeEnd,
                    category: t.category || 'Work',
                    status: 'pending'
                  });
                });
                responseText += "\n\nI've replaced your schedule with the new tasks!";
                addNotification({
                  title: 'Schedule Replaced',
                  message: `Replaced your schedule with ${args.tasks.length} new tasks.`,
                  type: 'success'
                });
              }
            } else if (call.name === 'updateFinances') {
              const args = call.args as any;
              const updates: any = {};
              
              // Calculate current expenses and incomes to adjust the initial balance correctly
              const allExpenses = [...currentDayData.expenses];
              history.forEach(day => allExpenses.push(...day.expenses));
              
              const walletExpenses = allExpenses.filter(e => e.type === 'expense' && e.source !== 'savings').reduce((sum, e) => sum + e.amount, 0);
              const savingsExpenses = allExpenses.filter(e => e.type === 'expense' && e.source === 'savings').reduce((sum, e) => sum + e.amount, 0);
              
              const walletIncomes = allExpenses.filter(e => e.type === 'income' && e.source !== 'savings').reduce((sum, e) => sum + e.amount, 0);
              const savingsIncomes = allExpenses.filter(e => e.type === 'income' && e.source === 'savings').reduce((sum, e) => sum + e.amount, 0);

              if (args.savingsBalance !== undefined) {
                // currentSavings = savingsBalance + savingsIncomes - savingsExpenses
                // So, newSavingsBalance = currentSavings - savingsIncomes + savingsExpenses
                updates.savingsBalance = args.savingsBalance - savingsIncomes + savingsExpenses;
              }
              if (args.monthlyIncome !== undefined) updates.monthlyIncome = args.monthlyIncome;
              if (args.currency !== undefined) updates.currency = args.currency;
              
              if (Object.keys(updates).length > 0) {
                updateSettings(updates);
                responseText += "\n\nI've updated your financial settings!";
                addNotification({
                  title: 'Finances Updated',
                  message: 'Your financial settings have been updated.',
                  type: 'success'
                });
              }
            } else if (call.name === 'clearSchedule') {
              clearSchedule();
              responseText += "\n\nI've cleared your schedule!";
              addNotification({
                title: 'Schedule Cleared',
                message: 'Your schedule has been cleared.',
                type: 'info'
              });
            } else if (call.name === 'undoSchedule') {
              undoSchedule();
              responseText += "\n\nI've restored your previous schedule!";
              addNotification({
                title: 'Schedule Restored',
                message: 'Your previous schedule has been restored.',
                type: 'info'
              });
            } else if (call.name === 'addHabit') {
              const args = call.args as any;
              addHabit({
                id: crypto.randomUUID(),
                name: args.name,
                category: args.category,
                target: args.target,
                streak: 0,
                completedToday: false,
                color: 'bg-blue-500',
                startDate: new Date().toISOString().split('T')[0]
              });
              responseText += `\n\nI've added the habit "${args.name}" to your tracker!`;
              addNotification({
                title: 'Habit Added',
                message: `Added new habit: ${args.name}`,
                type: 'success'
              });
            } else if (call.name === 'addExpense') {
              const args = call.args as any;
              addExpense({
                id: crypto.randomUUID(),
                title: args.title,
                amount: Math.abs(Number(args.amount)),
                type: args.type as 'income' | 'expense',
                category: args.category,
                source: (args.source as 'wallet' | 'savings') || 'wallet',
                timestamp: new Date().toISOString()
              });
              responseText += `\n\nI've added the ${args.type} "${args.title}" for ${args.amount}!`;
              addNotification({
                title: args.type === 'income' ? 'Income Added' : 'Expense Added',
                message: `Added ${args.title} (${args.amount})`,
                type: 'success'
              });
            } else if (call.name === 'addNote') {
              const args = call.args as any;
              addNote({
                id: crypto.randomUUID(),
                title: args.title,
                content: args.content,
                tags: Array.isArray(args.tags) ? args.tags : [],
                timestamp: new Date().toISOString()
              });
              responseText += `\n\nI've added the note "${args.title}"!`;
              addNotification({
                title: 'Note Added',
                message: `Created new note: ${args.title}`,
                type: 'success'
              });
            } else if (call.name === 'applyCoupon') {
              const args = call.args as any;
              const code = (args.code || '').toLowerCase();
              if (code === '1856hk') {
                applySubscription('Pro', 90, code);
                responseText += "\n\nCoupon applied! 3 Months Pro plan unlocked.";
                addNotification({
                  title: 'Coupon Applied',
                  message: 'Successfully unlocked 3 Months Pro plan!',
                  type: 'success'
                });
              } else if (code === 'leftricks' || code === 'access') {
                applySubscription('Pro', 9999, code);
                responseText += "\n\nAdmin access granted: Lifetime Pro plan unlocked.";
                addNotification({
                  title: 'Admin Access',
                  message: 'Successfully unlocked Lifetime Pro plan!',
                  type: 'success'
                });
              } else {
                responseText += `\n\nSorry, the coupon code "${args.code}" is invalid.`;
                addNotification({
                  title: 'Coupon Invalid',
                  message: `The coupon code "${args.code}" is invalid.`,
                  type: 'error'
                });
              }
            } else if (call.name === 'updateProfile') {
              const args = call.args as any;
              const updates: any = {};
              if (args.name) {
                updates.name = args.name;
                updateSettings({ name: args.name });
              }
              if (args.age) updates.age = args.age;
              if (args.country) updates.country = args.country;
              if (args.gender) updates.gender = args.gender;
              
              if (Object.keys(updates).length > 0) {
                updateProfile(updates);
                responseText += "\n\nI've updated your profile information!";
                addNotification({
                  title: 'Profile Updated',
                  message: 'Your profile information has been successfully updated by Your Tutor.',
                  type: 'success'
                });
              }
            } else if (call.name === 'navigate') {
              const args = call.args as any;
              if (args.page) {
                navigate(`/${args.page.toLowerCase()}`);
                responseText += `\n\nI've navigated you to the ${args.page} page.`;
              }
            }
          } catch (err) {
            console.error(`Error executing function ${call.name}:`, err);
            responseText += `\n\nSorry, I encountered an error while trying to perform the action: ${call.name}.`;
          }
        }
      }

      if (!responseText) {
        responseText = "I've processed your request.";
      }
      
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'model', content: responseText }]);
    } catch (error: any) {
      console.error("Chatbot error:", error);
      const errorMessage = error.message === "Timeout" 
        ? "Something went wrong, please try again" 
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
    <>
      {/* Floating Action Button */}
      <motion.button
        drag
        dragElastic={0.5}
        dragMomentum={true}
        whileDrag={{ scale: 1.1, cursor: 'grabbing' }}
        onClick={() => setIsOpen(true)}
        className={`fixed z-[999] flex items-center justify-center transition-all bg-accent-primary hover:bg-accent-primary-hover text-[#000000] touch-none ${isOpen ? 'scale-0' : 'scale-100'}`}
        style={{
          width: '52px',
          height: '52px',
          borderRadius: '50%',
          bottom: '80px',
          right: '20px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.35)'
        }}
      >
        <MessageSquare className="w-6 h-6 fill-current" />
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[998] md:hidden"
            />
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="fixed bottom-0 left-0 right-0 w-full max-h-[70vh] bg-[#111] border-t border-[#333] rounded-t-3xl md:bottom-24 md:right-6 md:left-auto md:w-[400px] md:max-h-[600px] md:border md:rounded-2xl shadow-2xl flex flex-col z-[999] overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-4 border-b border-[#222] bg-[#0a0a0a]">
                <div className="flex items-center gap-3">
                  <div className="w-[36px] h-[36px] rounded-full bg-accent-primary/20 flex items-center justify-center text-accent-primary shrink-0">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col">
                    <h3 className="font-bold text-white text-[15px] leading-tight">Your Tutor</h3>
                    <p className="text-[12px] font-medium text-accent-primary flex items-center gap-1.5 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent-primary"></span> Online
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-gray-400 hover:text-white hover:bg-[#222] rounded-full transition-colors shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#0a0a0a]/50">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div 
                      className={`max-w-[85%] px-4 py-3 text-[14px] leading-relaxed ${
                        msg.role === 'user' 
                          ? 'bg-accent-primary text-[#1A1A1A] font-medium' 
                          : 'bg-[#222] text-white border border-[#333]'
                      }`}
                      style={{ borderRadius: '16px' }}
                    >
                      {msg.role === 'user' ? (
                        msg.content
                      ) : (
                        <div className="prose prose-invert prose-sm max-w-none text-[14px] leading-relaxed">
                          <Markdown>{msg.content}</Markdown>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div 
                      className="bg-[#222] border border-[#333] px-4 py-3 flex items-center gap-2"
                      style={{ borderRadius: '16px' }}
                    >
                      <Sparkles className="w-4 h-4 text-accent-primary animate-pulse" />
                      <span className="text-[14px] text-gray-300">Thinking...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t border-[#222] bg-[#0a0a0a] pb-safe">
                <form 
                  onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                  className="flex items-center gap-3 w-full"
                >
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        if (input.trim() && !isLoading) {
                          handleSend();
                        }
                      }
                    }}
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement;
                      target.style.height = 'auto';
                      target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
                    }}
                    placeholder="Ask your tutor..."
                    maxLength={1000}
                    rows={1}
                    className="flex-1 bg-[#111] border border-[#333] rounded-full px-5 py-3 text-[14px] text-white focus:outline-none focus:border-accent-primary transition-colors resize-none min-h-[44px] max-h-[120px] overflow-y-auto"
                  />
                  <button 
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    className="w-11 h-11 rounded-full bg-accent-primary hover:bg-accent-primary-hover disabled:opacity-50 disabled:hover:bg-accent-primary text-[#1A1A1A] flex items-center justify-center transition-colors shrink-0"
                  >
                    <Send className="w-5 h-5 ml-0.5" />
                  </button>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
