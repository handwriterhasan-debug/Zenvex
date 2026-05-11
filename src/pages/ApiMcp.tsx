import { motion } from 'motion/react';
import { Code, Terminal, Bot, Zap, ExternalLink } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export default function ApiMcp() {
  const { userProfile } = useAppContext();
  const isPro = userProfile.plan === 'Pro' || userProfile.plan === 'Premium';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-4xl mx-auto space-y-8 pb-20"
    >
      <div>
        <h1 className="text-3xl font-display font-bold mb-2 text-text-main flex items-center gap-3">
          <Code className="w-8 h-8 text-emerald-500" />
          API & MCP Integrations
        </h1>
        <p className="text-text-muted">
          Connect your MakeYourFuture workspace with other tools, AI assistants, and internal systems.
        </p>
      </div>

      <div className="bg-surface border border-border-dim rounded-3xl p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[80px] rounded-full pointer-events-none"></div>
        
        <div className="relative z-10 flex items-center justify-between flex-wrap gap-6 text-center max-w-2xl mx-auto py-12">
           <div className="w-full">
            <Bot className="w-16 h-16 text-emerald-500 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-text-main mb-4">Coming Soon!</h2>
            <p className="text-text-muted mb-8 text-lg">
              We're building powerful APIs and Model Context Protocol (MCP) servers so you can seamlessly integrate your data with Claude, Gemini, ChatGPT, and your custom workflows.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left max-w-xl mx-auto">
              <div className="bg-surface border border-border-dim rounded-2xl p-4 flex items-start gap-4">
                <Terminal className="w-6 h-6 text-blue-500 shrink-0" />
                <div>
                  <h3 className="font-bold text-text-main mb-1">REST API</h3>
                  <p className="text-sm text-text-muted">Access your schedule, habits, and expenses programmatically.</p>
                </div>
              </div>
              <div className="bg-surface border border-border-dim rounded-2xl p-4 flex items-start gap-4">
                <Zap className="w-6 h-6 text-amber-500 shrink-0" />
                <div>
                  <h3 className="font-bold text-text-main mb-1">MCP Server</h3>
                  <p className="text-sm text-text-muted">Give AI assistants direct access to context from your workspace.</p>
                </div>
              </div>
            </div>
            
            {!isPro && (
               <div className="mt-8 inline-block bg-accent-primary/10 border border-accent-primary/20 rounded-xl px-4 py-3 text-sm text-accent-primary">
                 <span className="font-bold">Note:</span> API access will require a Pro or Premium subscription.
               </div>
            )}
           </div>
        </div>
      </div>
    </motion.div>
  );
}
