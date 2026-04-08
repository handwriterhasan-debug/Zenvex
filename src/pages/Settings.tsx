import { motion } from 'motion/react';
import { useAppContext } from '../context/AppContext';
import { useState } from 'react';
import { Save, AlertCircle } from 'lucide-react';

export default function Settings() {
  const { userSettings, updateSettings, isDemoMode, disableDemoMode } = useAppContext();
  const [name, setName] = useState(userSettings.name);
  const [dayEndTime, setDayEndTime] = useState(userSettings.dayEndTime);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    updateSettings({ name, dayEndTime });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold mb-2 text-text-main">Settings</h1>
          <p className="text-text-muted">Manage your account and preferences.</p>
        </div>
      </div>

      {isDemoMode && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-3xl p-6 flex items-start gap-4">
          <AlertCircle className="w-6 h-6 text-amber-500 shrink-0" />
          <div>
            <h3 className="font-bold text-amber-500 mb-1">Demo Mode Active</h3>
            <p className="text-sm text-text-muted mb-4">You are currently viewing demo data. Changes made here will not be saved permanently.</p>
            <button 
              onClick={disableDemoMode}
              className="bg-amber-500 text-black px-4 py-2 rounded-lg text-sm font-bold hover:bg-amber-400 transition-colors"
            >
              Exit Demo Mode
            </button>
          </div>
        </div>
      )}

      <div className="bg-surface border border-border-dim rounded-3xl p-6 max-w-2xl shadow-sm">
        <h2 className="text-xl font-bold font-display mb-6 text-text-main">Profile & Preferences</h2>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-text-muted mb-2">Your Name</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-surface-light border border-border-dim rounded-xl px-4 py-3 text-text-main focus:outline-none focus:border-accent-primary transition-colors"
              placeholder="Enter your name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-muted mb-2">Day End Time</label>
            <p className="text-xs text-text-faint mb-3">
              When does your day actually end? If you work late into the night (e.g., until 4 AM), set this to 04:00 so your habits and schedule don't reset at midnight.
            </p>
            <input 
              type="time" 
              value={dayEndTime}
              onChange={(e) => setDayEndTime(e.target.value)}
              className="w-full bg-surface-light border border-border-dim rounded-xl px-4 py-3 text-text-main focus:outline-none focus:border-accent-primary transition-colors"
            />
          </div>

          <div className="pt-4 border-t border-border-dim flex flex-col sm:flex-row items-center justify-between gap-4">
            {saved ? (
              <span className="text-emerald-500 text-sm font-medium flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-start">
                <Save className="w-4 h-4" /> Settings saved!
              </span>
            ) : (
              <span className="hidden sm:inline"></span>
            )}
            <button 
              onClick={handleSave}
              className="w-full sm:w-auto justify-center bg-accent-primary hover:bg-accent-primary-hover text-white px-6 py-3 sm:py-2 rounded-xl font-medium transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4" /> Save Changes
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
