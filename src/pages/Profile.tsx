import { motion, AnimatePresence } from 'motion/react';
import { UserCircle, Save, Trash2, Edit2, Check, X, Play, Camera, CheckCircle2, LogOut, Loader2, Key } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useState, useRef, ChangeEvent } from 'react';
import { formatTime12Hour } from '../utils/timeUtils';
import { useNavigate } from 'react-router';

import { supabase } from '../supabaseClient';

export default function Profile() {
  const { userProfile, updateProfile, savedSchedules, deleteScheduleTemplate, loadScheduleTemplate, resetState } = useAppContext();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(userProfile);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; templateId: string | null }>({ isOpen: false, templateId: null });
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [adminCode, setAdminCode] = useState('');
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('makeYourFutureState');
    localStorage.removeItem('isGuestMode');
    resetState();
    navigate('/');
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const confirmDelete = () => {
    if (deleteModal.templateId) {
      deleteScheduleTemplate(deleteModal.templateId);
      setDeleteModal({ isOpen: false, templateId: null });
      showToast('Template deleted successfully');
    }
  };

  const handleSaveProfile = () => {
    updateProfile(editForm);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditForm(userProfile);
    setIsEditing(false);
  };

  const handleAdminCodeSubmit = () => {
    if (adminCode === 'lefttrciks') {
      localStorage.setItem('isAdmin', 'true');
      showToast('Admin access granted!');
      setAdminCode('');
      // Force a reload to update the Layout state or navigate directly
      window.location.href = '/admin/complaints';
    } else {
      showToast('Invalid admin code');
    }
  };

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 200;
          const MAX_HEIGHT = 200;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          const base64String = canvas.toDataURL('image/jpeg', 0.7);
          setEditForm({ ...editForm, avatarUrl: base64String });
          updateProfile({ avatarUrl: base64String });
          showToast('Avatar uploaded successfully');
          setIsUploading(false);
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
      
    } catch (error: any) {
      console.error('Error uploading image:', error);
      showToast('Error uploading image');
      setIsUploading(false);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto space-y-8"
      >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display tracking-tight">Profile & Library</h1>
          <p className="text-gray-400 mt-1">Manage your personal info and saved schedule templates.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/')}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-white/5 text-white hover:bg-white/10 rounded-xl font-medium transition-colors border border-white/5 w-full md:w-auto"
          >
            <LogOut className="w-4 h-4" />
            Exit App
          </button>
          <button
            onClick={handleSignOut}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-accent-primary-dim text-accent-primary hover:bg-accent-primary-border rounded-xl font-medium transition-colors border border-accent-primary-border w-full md:w-auto"
          >
            <LogOut className="w-4 h-4" />
            Log Out
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-12">
        {/* Profile Info */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-surface border border-border-dim p-8 text-center relative shadow-sm mb-8 rounded-3xl">
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-16 h-16 bg-surface border border-border-dim rounded-2xl flex items-center justify-center shadow-sm">
              <UserCircle className="w-8 h-8 text-rose-500" />
            </div>
            
            <h2 className="text-xl font-bold font-display mt-4 mb-6 text-white">Personal Info</h2>

            {isEditing ? (
              <div className="space-y-4 text-left">
                <div className="flex flex-col items-center mb-6">
                  <div className="relative w-24 h-24 rounded-full overflow-hidden bg-white/5 border-2 border-white/5 mb-3 group">
                    {editForm.avatarUrl ? (
                      <img src={editForm.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <UserCircle className="w-12 h-12" />
                      </div>
                    )}
                    <div 
                      className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 cursor-pointer transition-opacity"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {isUploading ? (
                        <Loader2 className="w-6 h-6 text-white animate-spin" />
                      ) : (
                        <Camera className="w-6 h-6 text-[#ffffff]" />
                      )}
                    </div>
                  </div>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleImageUpload} 
                    accept="image/*" 
                    className="hidden" 
                    disabled={isUploading}
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs text-rose-500 hover:text-rose-600 font-bold"
                  >
                    Change Picture
                  </button>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Name</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                    className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Gender</label>
                  <select
                    value={editForm.gender}
                    onChange={(e) => setEditForm({...editForm, gender: e.target.value})}
                    className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all"
                  >
                    <option value="Not specified" className="bg-gray-900 text-white">Not specified</option>
                    <option value="Male" className="bg-gray-900 text-white">Male</option>
                    <option value="Female" className="bg-gray-900 text-white">Female</option>
                    <option value="Other" className="bg-gray-900 text-white">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Age</label>
                  <input
                    type="text"
                    value={editForm.age}
                    onChange={(e) => setEditForm({...editForm, age: e.target.value})}
                    className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Country</label>
                  <input
                    type="text"
                    value={editForm.country}
                    onChange={(e) => setEditForm({...editForm, country: e.target.value})}
                    className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all"
                  />
                </div>
                
                <div className="flex gap-3 pt-4 pb-6">
                  <button onClick={handleCancelEdit} className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-gray-300 font-bold transition-colors">
                    Cancel
                  </button>
                  <button onClick={handleSaveProfile} className="flex-1 py-3 bg-rose-500 hover:bg-rose-600 rounded-xl text-[#ffffff] font-bold transition-colors shadow-lg shadow-rose-500/30">
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-left pb-8">
                <div className="flex flex-col items-center mb-6">
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-white/5 border-2 border-white/5 mb-2 shadow-inner">
                    {userProfile.avatarUrl ? (
                      <img src={userProfile.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <UserCircle className="w-12 h-12" />
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex justify-between items-center border-b border-white/5 pb-3">
                  <span className="text-gray-400 text-sm font-bold">Name</span>
                  <span className="font-bold text-white">{userProfile.name}</span>
                </div>
                <div className="flex justify-between items-center border-b border-white/5 pb-3">
                  <span className="text-gray-400 text-sm font-bold">Gender</span>
                  <span className="font-bold text-white">{userProfile.gender}</span>
                </div>
                <div className="flex justify-between items-center border-b border-white/5 pb-3">
                  <span className="text-gray-400 text-sm font-bold">Age</span>
                  <span className="font-bold text-white">{userProfile.age}</span>
                </div>
                <div className="flex justify-between items-center border-b border-white/5 pb-3">
                  <span className="text-gray-400 text-sm font-bold">Country</span>
                  <span className="font-bold text-white">{userProfile.country}</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-gray-400 text-sm font-bold">Plan Status</span>
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-600 rounded-lg text-xs font-bold uppercase tracking-wider">
                    {userProfile.plan}
                  </span>
                </div>
                {userProfile.plan !== 'Free' && userProfile.subscriptionStartDate && userProfile.subscriptionEndDate && (
                  <div className="pt-4 border-t border-white/5">
                    <div className="flex justify-between text-xs text-gray-400 font-bold mb-2">
                      <span>Subscription Timeline</span>
                      <span>
                        {Math.max(0, Math.floor((new Date().getTime() - new Date(userProfile.subscriptionStartDate).getTime()) / (1000 * 60 * 60 * 24)))} / 
                        {Math.max(1, Math.floor((new Date(userProfile.subscriptionEndDate).getTime() - new Date(userProfile.subscriptionStartDate).getTime()) / (1000 * 60 * 60 * 24)))} days
                      </span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-rose-500 rounded-full transition-all duration-1000"
                        style={{ 
                          width: `${Math.min(100, Math.max(0, ((new Date().getTime() - new Date(userProfile.subscriptionStartDate).getTime()) / (new Date(userProfile.subscriptionEndDate).getTime() - new Date(userProfile.subscriptionStartDate).getTime())) * 100))}%` 
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {!isEditing && (
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-[80%]">
                <button 
                  onClick={() => setIsEditing(true)}
                  className="block w-full py-3.5 bg-rose-500 text-[#ffffff] rounded-xl text-sm font-bold hover:bg-rose-600 transition-colors shadow-lg shadow-rose-500/30"
                >
                  Edit Profile
                </button>
              </div>
            )}
          </div>

          {/* Admin Access Section */}
          <div className="bg-surface border border-border-dim p-8 shadow-sm mt-12 rounded-3xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-rose-500/10 rounded-xl flex items-center justify-center">
                <Key className="w-5 h-5 text-rose-500" />
              </div>
              <h2 className="text-xl font-bold font-display text-white">Admin Access</h2>
            </div>
            <div className="space-y-4">
              <p className="text-sm text-gray-400">Enter the admin code to access the complaints dashboard.</p>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={adminCode}
                  onChange={(e) => setAdminCode(e.target.value)}
                  placeholder="Enter code"
                  className="flex-1 bg-black/40 border border-white/5 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all"
                />
                <button
                  onClick={handleAdminCodeSubmit}
                  className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-bold transition-colors"
                >
                  Verify
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Library / Saved Schedules */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface border border-border-dim p-8 text-center relative shadow-sm mb-8 rounded-3xl">
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-16 h-16 bg-surface border border-border-dim rounded-2xl flex items-center justify-center shadow-sm">
              <Save className="w-8 h-8 text-rose-500" />
            </div>
            
            <h2 className="text-xl font-bold font-display mt-4 mb-6 text-white">Template Library</h2>

            <div className="space-y-4 text-left">
              {savedSchedules.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-white/5 rounded-2xl bg-black/40">
                  <p className="text-gray-400 font-bold mb-2">No saved schedules yet.</p>
                  <p className="text-sm text-gray-400">Go to the Schedule page to save your daily routine as a template.</p>
                </div>
              ) : (
                savedSchedules.map((template) => (
                  <div key={template.id} className="bg-surface border border-border-dim p-5 rounded-2xl hover:border-accent-primary-border transition-all shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-lg text-white">{template.name}</h3>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => {
                            loadScheduleTemplate(template.id);
                            showToast('Template loaded into your current schedule!');
                          }}
                          className="flex items-center gap-1 px-4 py-2 bg-white/5 hover:bg-rose-500 hover:text-[#ffffff] rounded-xl text-sm font-bold transition-colors text-gray-300"
                        >
                          <Play className="w-4 h-4" /> Load
                        </button>
                        <button 
                          onClick={() => setDeleteModal({ isOpen: true, templateId: template.id })}
                          className="p-2 bg-white/5 hover:bg-accent-primary hover:text-[#ffffff] rounded-xl text-gray-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      {template.tasks.slice(0, 3).map((task, idx) => (
                        <div key={idx} className="flex items-center gap-3 text-sm">
                          <span className="text-gray-400 font-mono text-xs w-20 font-bold">
                            {formatTime12Hour(task.timeStart)}
                          </span>
                          <span className="text-gray-300 font-medium">{task.task}</span>
                          <span className="text-xs text-gray-300 px-2 py-0.5 bg-white/5 rounded-full font-bold">
                            {task.category}
                          </span>
                        </div>
                      ))}
                      {template.tasks.length > 3 && (
                        <div className="text-xs text-gray-400 pt-2 italic font-medium">
                          + {template.tasks.length - 3} more tasks
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
      </motion.div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteModal.isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface border border-border-dim rounded-3xl p-6 max-w-sm w-full shadow-lg"
            >
              <h3 className="text-xl font-bold mb-2">Delete Template</h3>
              <p className="text-gray-400 mb-6">Are you sure you want to delete this template? This action cannot be undone.</p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteModal({ isOpen: false, templateId: null })}
                  className="flex-1 py-2 rounded-xl font-medium bg-white/5 hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 py-2 rounded-xl font-medium bg-accent-primary hover:bg-accent-primary-hover text-white transition-colors"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            className="fixed bottom-6 left-1/2 z-50 bg-emerald-500 text-[#ffffff] px-6 py-3 rounded-full shadow-lg font-medium flex items-center gap-2"
          >
            <CheckCircle2 className="w-5 h-5" />
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
