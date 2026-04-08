import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, MessageSquareWarning, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

interface ComplainBoxProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ComplainBox({ isOpen, onClose }: ComplainBoxProps) {
  const { userSettings } = useAppContext();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;

    setStatus('submitting');
    try {
      // Simulate network request
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setStatus('success');
      setTimeout(() => {
        onClose();
        setStatus('idle');
        setSubject('');
        setMessage('');
      }, 1500);
    } catch (err) {
      console.error('Failed to submit complaint:', err);
      setStatus('error');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-md bg-[#111] border border-[#333] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="p-4 border-b border-[#222] flex items-center justify-between bg-[#0a0a0a]">
              <h2 className="text-lg font-bold font-display flex items-center gap-2 text-white">
                <MessageSquareWarning className="w-5 h-5 text-orange-400" />
                Complain Box
              </h2>
              <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-[#222]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              {status === 'success' ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-green-400" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Message Sent!</h3>
                  <p className="text-gray-400 text-sm">
                    Thank you for letting us know. We've received your message and will fix the issue as soon as possible.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <p className="text-sm text-gray-400 mb-4">
                    Found a bug or have a problem? Let the owner know so they can fix it!
                  </p>
                  
                  {status === 'error' && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-2 text-sm text-red-200">
                      <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      <p>Failed to send message. Please try again later.</p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1.5">Issue Subject</label>
                    <input
                      type="text"
                      required
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="e.g., App is hanging on habits page"
                      className="w-full bg-[#0a0a0a] border border-[#333] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-orange-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1.5">Describe the Problem</label>
                    <textarea
                      required
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Please explain the issue in detail..."
                      rows={4}
                      className="w-full bg-[#0a0a0a] border border-[#333] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-orange-500 transition-colors resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={status === 'submitting'}
                    className="w-full py-3 px-4 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2 mt-2"
                  >
                    {status === 'submitting' ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Send to Owner
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
