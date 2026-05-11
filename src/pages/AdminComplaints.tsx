import React from 'react';
import { motion } from 'motion/react';
import { MessageSquareWarning } from 'lucide-react';

export default function AdminComplaints() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-8"
    >
      <div>
        <h1 className="text-3xl font-bold font-display tracking-tight flex items-center gap-3">
          <MessageSquareWarning className="w-8 h-8 text-orange-500" />
          Admin Complaints
        </h1>
        <p className="text-gray-400 mt-1">Manage user feedback and issues.</p>
      </div>

      <div className="bg-surface border border-border-dim rounded-3xl p-8 shadow-sm text-center">
        <div className="w-16 h-16 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <MessageSquareWarning className="w-8 h-8 text-orange-400" />
        </div>
        <h2 className="text-xl font-bold mb-2">Disabled in Guest Mode</h2>
        <p className="text-gray-400 max-w-md mx-auto">
          The complaints system requires a backend database to function. 
          In this guest mode demo, data is only saved locally to your browser.
        </p>
      </div>
    </motion.div>
  );
}
