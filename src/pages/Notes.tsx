import { motion, AnimatePresence } from 'motion/react';
import { Plus, BookOpen, Calendar, ChevronRight, CheckCircle2, X, Trash2 } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useState } from 'react';
import { NoteItem } from '../types';

export default function Notes() {
  const { currentDayData, addNote, deleteNote, history } = useAppContext();
  const { notes } = currentDayData;
  const [isAdding, setIsAdding] = useState(false);
  const [selectedNote, setSelectedNote] = useState<NoteItem | null>(null);
  const [newNote, setNewNote] = useState({ title: '', content: '', tags: '', isExcuse: false });
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleAdd = () => {
    if (newNote.title && newNote.content) {
      addNote({
        id: crypto.randomUUID(),
        title: newNote.title,
        content: newNote.content,
        tags: newNote.tags.split(',').map(t => t.trim()).filter(t => t),
        timestamp: new Date().toISOString(),
        isExcuse: newNote.isExcuse
      });
      setIsAdding(false);
      setNewNote({ title: '', content: '', tags: '', isExcuse: false });
    } else {
      showToast('Please enter a title and content');
    }
  };

  // Combine current notes and history notes
  const allNotes = [...notes];
  history.forEach(day => {
    allNotes.push(...(day.notes || []));
  });

  // Sort by newest first
  allNotes.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold mb-2">Smart Daily Notes</h1>
          <p className="text-gray-400">Reflect on your days. Learn from your patterns.</p>
        </div>
        <button 
          onClick={() => {
            setIsAdding(true);
            setSelectedNote(null);
            setNewNote({ title: '', content: '', tags: '', isExcuse: false });
          }}
          className="w-full md:w-auto justify-center bg-accent-primary hover:bg-accent-primary-hover text-white px-4 py-3 md:py-2 rounded-xl text-sm font-medium transition-all shadow-sm flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> New Note
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column - Note Editor */}
        <div className="lg:col-span-2 space-y-6">
          {selectedNote ? (
            <div className="bg-surface border border-border-dim rounded-3xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3 text-gray-400 text-sm">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(selectedNote.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
                <button onClick={() => setSelectedNote(null)} className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <h2 className="text-2xl font-display font-bold text-white mb-4">{selectedNote.title}</h2>
              <div className="prose prose-invert max-w-none mb-6">
                <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">{selectedNote.content}</p>
              </div>
              {selectedNote.tags && selectedNote.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedNote.tags.map(tag => (
                    <span key={tag} className="text-xs uppercase tracking-wider font-semibold text-gray-500 bg-[#222] px-3 py-1 rounded-md">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-surface border border-border-dim rounded-3xl p-6 flex flex-col items-center justify-center h-64 text-center shadow-sm">
              <BookOpen className="w-12 h-12 text-gray-600 mb-4" />
              <h3 className="text-xl font-display font-bold text-white mb-2">Select a note or create a new one</h3>
              <p className="text-gray-400 mb-6">Capture your thoughts, reflections, and ideas.</p>
              <button 
                onClick={() => {
                  setIsAdding(true);
                  setSelectedNote(null);
                  setNewNote({ title: '', content: '', tags: '', isExcuse: false });
                }}
                className="bg-white/5 hover:bg-white/10 border border-white/10 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all"
              >
                Create New Note
              </button>
            </div>
          )}
        </div>

        {/* Right Column - Previous Notes */}
        <div className="space-y-6">
          <div className="bg-surface border border-border-dim rounded-3xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold font-display">Recent Notes</h2>
              <BookOpen className="w-5 h-5 text-gray-400" />
            </div>
            
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {allNotes.length === 0 ? (
                <div className="text-center py-10 text-gray-500">No notes yet.</div>
              ) : allNotes.map((note, i) => (
                <div 
                  key={`${note.id}-${i}`} 
                  onClick={() => {
                    setSelectedNote(note);
                    setIsAdding(false);
                  }}
                  className={`group p-4 rounded-xl bg-surface border ${selectedNote?.id === note.id ? 'border-accent-primary' : 'border-border-dim hover:border-accent-primary-border'} transition-all cursor-pointer shadow-sm`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500 font-mono">{new Date(note.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNote(note.id);
                          if (selectedNote?.id === note.id) {
                            setSelectedNote(null);
                          }
                        }}
                        className="text-gray-500 hover:text-accent-primary transition-colors p-1.5 md:p-1 rounded-full hover:bg-accent-primary-dim opacity-100 md:opacity-0 md:group-hover:opacity-100"
                        title="Delete Note"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-accent-primary transition-colors" />
                    </div>
                  </div>
                  <h3 className="font-medium text-white mb-2 line-clamp-1">{note.title}</h3>
                  <p className="text-sm text-gray-400 line-clamp-2 mb-3">{note.content}</p>
                  <div className="flex flex-wrap gap-2">
                    {note.tags && note.tags.map(tag => (
                      <span key={tag} className="text-[10px] uppercase tracking-wider font-semibold text-text-muted bg-surface-light px-2 py-0.5 rounded-md">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
      </motion.div>

      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface border border-border-dim p-6 w-full max-w-2xl relative shadow-lg rounded-3xl max-h-[90vh] overflow-y-auto"
            >
              <button 
                onClick={() => {
                  setIsAdding(false);
                  setNewNote({ title: '', content: '', tags: '', isExcuse: false });
                }} 
                className="absolute top-6 right-6 text-text-muted hover:text-text-main transition-colors p-2 hover:bg-surface-hover rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3 mb-6 text-text-muted text-sm">
                <Calendar className="w-4 h-4" />
                <span>Today, {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
              </div>
              
              <input 
                type="text" 
                placeholder="Note Title..." 
                value={newNote.title}
                onChange={e => setNewNote({...newNote, title: e.target.value})}
                className="w-full bg-transparent text-2xl font-display font-bold text-text-main placeholder-text-faint outline-none mb-4"
              />
              
              <textarea 
                placeholder="Write your reflection here..." 
                value={newNote.content}
                onChange={e => setNewNote({...newNote, content: e.target.value})}
                className="w-full h-64 bg-transparent text-text-muted placeholder-text-faint outline-none resize-none leading-relaxed"
              ></textarea>
              
              <div className="mb-4">
                <p className="text-xs text-text-muted mb-2">Tags (comma separated)</p>
                <input 
                  type="text" 
                  placeholder="e.g. Reflection, Win, Improvement" 
                  value={newNote.tags}
                  onChange={e => setNewNote({...newNote, tags: e.target.value})}
                  className="w-full bg-surface-light border border-border-dim rounded-xl px-4 py-3 text-text-main focus:outline-none focus:border-accent-primary text-sm transition-colors"
                />
              </div>

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-4 pt-4 border-t border-border-dim">
                <label className="flex items-center gap-2 text-sm text-text-muted cursor-pointer hover:text-text-main transition-colors">
                  <input 
                    type="checkbox" 
                    checked={newNote.isExcuse}
                    onChange={e => setNewNote({...newNote, isExcuse: e.target.checked})}
                    className="w-4 h-4 rounded border-border-dim bg-surface-light text-accent-primary focus:ring-accent-primary shrink-0"
                  />
                  <span className="leading-tight">This is a valid excuse for missing tasks today</span>
                </label>
                <div className="flex gap-3 md:gap-4 justify-end">
                  <button 
                    onClick={() => {
                      setIsAdding(false);
                      setNewNote({ title: '', content: '', tags: '', isExcuse: false });
                    }}
                    className="text-text-muted hover:text-text-main px-4 py-2 text-sm font-medium transition-colors bg-surface-light hover:bg-surface-hover rounded-xl"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleAdd}
                    className="bg-accent-primary hover:bg-accent-primary-hover text-white px-6 py-2 rounded-xl text-sm font-medium transition-all shadow-sm whitespace-nowrap"
                  >
                    Save Note
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 right-6 bg-surface border border-border-dim text-text-main px-6 py-3 rounded-xl shadow-xl flex items-center gap-3 z-[100]"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            <span className="font-medium">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
