import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Plus, Trash2, ListTodo, Circle } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export default function Todos() {
  const { currentDayData, addTodo, updateTodo, deleteTodo } = useAppContext();
  const [newTask, setNewTask] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    
    addTodo({
      id: crypto.randomUUID(),
      task: newTask.trim(),
      completed: false,
      timestamp: new Date().toISOString()
    });
    setNewTask('');
  };

  const completedCount = currentDayData.todos?.filter(t => t.completed).length || 0;
  const totalCount = currentDayData.todos?.length || 0;
  const progress = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-4xl mx-auto space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display tracking-tight text-text-main flex items-center gap-3">
            <ListTodo className="w-8 h-8 text-accent-primary" />
            Tasks
          </h1>
          <p className="text-gray-400 mt-1 flex items-center gap-2">
            A simpler way to track your daily tasks
          </p>
        </div>
        
        {totalCount > 0 && (
          <div className="bg-surface border border-border-dim rounded-xl p-3 flex items-center gap-4 min-w-[200px]">
            <div className="flex-1">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-400">Progress</span>
                <span className="font-bold text-accent-primary">{progress}%</span>
              </div>
              <div className="w-full bg-surface-light rounded-full h-2">
                <div 
                  className="bg-accent-primary h-2 rounded-full transition-all duration-500" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-surface border border-border-dim rounded-2xl p-4 sm:p-6 shadow-sm">
        <form onSubmit={handleAdd} className="flex gap-2 mb-6">
          <input
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="Add a new task (e.g., Go to gym)..."
            className="flex-1 bg-surface-light border border-border-dim rounded-xl px-4 py-3 text-text-main focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary/20 transition-all placeholder-text-faint"
          />
          <button
            type="submit"
            disabled={!newTask.trim()}
            className="bg-accent-primary text-[#000000] px-4 py-3 rounded-xl font-bold hover:bg-accent-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 shrink-0 neon-glow"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Add Task</span>
          </button>
        </form>

        <div className="space-y-2">
          {(!currentDayData.todos || currentDayData.todos.length === 0) ? (
            <div className="text-center py-12 border-2 border-dashed border-border-dim rounded-xl bg-surface-light/50 text-text-muted">
              <ListTodo className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <h3 className="text-lg font-medium text-text-main">No tasks yet</h3>
              <p className="text-sm">Add some simple tasks for today to get started.</p>
            </div>
          ) : (
            <AnimatePresence>
              {currentDayData.todos.map((todo) => (
                <motion.div
                  key={todo.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`group flex items-center justify-between p-4 rounded-xl border transition-all ${
                    todo.completed 
                      ? 'bg-surface-light/30 border-border-dim/50' 
                      : 'bg-surface border-border-dim hover:border-accent-primary/30'
                  }`}
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0 pr-4">
                    <button
                      onClick={() => updateTodo(todo.id, { completed: !todo.completed })}
                      className={`shrink-0 flex-none w-6 h-6 min-w-[24px] min-h-[24px] rounded-md border-2 flex items-center justify-center transition-all ${
                        todo.completed
                          ? 'bg-accent-primary border-accent-primary text-black'
                          : 'border-gray-500 text-transparent hover:border-accent-primary'
                      }`}
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <span 
                      className={`truncate text-base md:text-lg transition-all ${
                        todo.completed ? 'text-text-muted line-through' : 'text-text-main font-medium'
                      }`}
                    >
                      {todo.task}
                    </span>
                  </div>
                  
                  <button
                    onClick={() => deleteTodo(todo.id)}
                    className="shrink-0 p-2 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100"
                    title="Delete task"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>
    </motion.div>
  );
}
