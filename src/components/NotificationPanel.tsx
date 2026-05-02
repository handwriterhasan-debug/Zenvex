import { motion, AnimatePresence } from 'motion/react';
import { Bell, X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useState } from 'react';

export function NotificationPanel() {
  const { notifications, markNotificationRead, clearNotifications } = useAppContext();
  const [isOpen, setIsOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case 'error': return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      default: return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  return (
    <div className="relative z-50">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-text-muted hover:text-text-main transition-colors rounded-full hover:bg-surface-hover"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-accent-primary rounded-full border-2 border-bg-surface"></span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-40"
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="fixed sm:absolute top-16 sm:top-full left-4 right-4 sm:left-auto sm:right-0 sm:mt-2 w-auto sm:w-[384px] min-w-[320px] max-w-[calc(100vw-2rem)] sm:max-w-none bg-surface border border-border-dim rounded-2xl shadow-2xl overflow-hidden z-[100]"
            >
              <div className="p-4 border-b border-border-dim flex items-center justify-between bg-surface-light">
                <h3 className="font-bold text-text-main flex items-center gap-2">
                  <Bell className="w-4 h-4 text-accent-primary" />
                  Notifications
                </h3>
                {notifications.length > 0 && (
                  <button 
                    onClick={clearNotifications}
                    className="text-xs text-text-muted hover:text-text-main transition-colors"
                  >
                    Clear All
                  </button>
                )}
              </div>

              <div className="max-h-[400px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-text-muted">
                    <Bell className="w-8 h-8 mx-auto mb-3 opacity-20" />
                    <p>No notifications yet</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border-dim">
                    {notifications.map((notification) => (
                      <div 
                        key={notification.id} 
                        className={`p-4 hover:bg-surface-hover transition-colors cursor-pointer flex gap-3 ${!notification.read ? 'bg-surface-light' : ''}`}
                        onClick={() => markNotificationRead(notification.id)}
                      >
                        <div className="shrink-0 mt-0.5">
                          {getIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h4 className={`text-sm font-medium truncate ${!notification.read ? 'text-text-main' : 'text-text-muted'}`}>
                              {notification.title}
                            </h4>
                            <span className="text-[10px] text-text-faint shrink-0 whitespace-nowrap">
                              {new Date(notification.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className={`text-xs line-clamp-2 ${!notification.read ? 'text-text-main' : 'text-text-muted'}`}>
                            {notification.message}
                          </p>
                        </div>
                        {!notification.read && (
                          <div className="shrink-0 w-2 h-2 rounded-full bg-accent-primary mt-1.5"></div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
