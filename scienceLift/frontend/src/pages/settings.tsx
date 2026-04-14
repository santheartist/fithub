import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/lib/api';
import { getErrorMessage } from '@/lib/errorHandler';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import LoadingSpinner from '@/components/LoadingSpinner';
import ColorPicker from '@/components/ColorPicker';
import { useThemePreferences } from '@/lib/useThemePreferences';

export default function SettingsPage() {
  const router = useRouter();
  const { user, logout, updateUser } = useAuth();
  const { preferences, updatePreferences } = useThemePreferences();

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Account Settings
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');

  // Password Settings
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Profile Picture
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  // Banner Picture
  const [bannerPicture, setBannerPicture] = useState<File | null>(null);
  const [bannerPreviewUrl, setBannerPreviewUrl] = useState<string>('');

  // Delete Account
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState('');

  // Theme Settings
  const [themeMode, setThemeMode] = useState('light');
  const [primaryColor, setPrimaryColor] = useState('#0066cc');
  const [accentColor, setAccentColor] = useState('#f5f5f5');
  const [textPrimaryColor, setTextPrimaryColor] = useState('#1a1a1a');
  const [textSecondaryColor, setTextSecondaryColor] = useState('#666666');
  const [bgPrimaryColor, setBgPrimaryColor] = useState('#ffffff');
  const [bgSecondaryColor, setBgSecondaryColor] = useState('#f5f5f5');

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    loadProfile();
  }, [user]);

  // Load theme preferences when they're fetched
  useEffect(() => {
    if (preferences) {
      setThemeMode(preferences.theme_mode);
      setPrimaryColor(preferences.primary_color);
      setAccentColor(preferences.accent_color);
      setTextPrimaryColor(preferences.text_primary_color);
      setTextSecondaryColor(preferences.text_secondary_color);
      setBgPrimaryColor(preferences.bg_primary_color);
      setBgSecondaryColor(preferences.bg_secondary_color);
    }
  }, [preferences]);

  const loadProfile = async () => {
    try {
      const response = await apiClient.getMyProfile();
      setUsername(response.data.username);
      setEmail(response.data.email);
      setBio(response.data.bio || '');
      if (response.data.profile_picture_url) {
        // Add cache buster to force fresh image load
        const picUrl = response.data.profile_picture_url.includes('data:')
          ? response.data.profile_picture_url
          : response.data.profile_picture_url + '?t=' + Date.now();
        setPreviewUrl(picUrl);
        
        // Also update user in AuthContext
        if (user) {
          updateUser({
            ...user,
            profile_picture_url: picUrl
          });
        }
      }
    } catch (err) {
      console.error('Error loading profile:', err);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  // Account Settings
  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await apiClient.updateProfileSettings({
        username: username.trim(),
        email: email.trim(),
        bio: bio.trim()
      });
      showMessage('success', 'Profile settings updated successfully!');
    } catch (err: any) {
      showMessage('error', getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // Password Change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showMessage('error', 'New passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      showMessage('error', 'Password must be at least 8 characters');
      return;
    }
    try {
      setLoading(true);
      await apiClient.changePassword(oldPassword, newPassword);
      showMessage('success', 'Password changed successfully!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      showMessage('error', getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // Profile Picture Upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
        showMessage('error', 'Only JPG, PNG, and GIF files are allowed');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        showMessage('error', 'File size must be less than 5MB');
        return;
      }
      setProfilePicture(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadPicture = async () => {
    if (!profilePicture) {
      showMessage('error', 'Please select a picture');
      return;
    }
    try {
      setLoading(true);
      const response = await apiClient.uploadProfilePicture(profilePicture);
      const baseUrl = response.data.profile_picture_url;
      const pictureUrl = baseUrl + '?t=' + Date.now();
      
      showMessage('success', 'Profile picture uploaded successfully!');
      setProfilePicture(null);
      
      // Reset file input
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
      // Update preview immediately
      setPreviewUrl(pictureUrl);
      
      // Update user in AuthContext
      if (user) {
        updateUser({
          ...user,
          profile_picture_url: pictureUrl
        });
      }
    } catch (err: any) {
      showMessage('error', getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleBannerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
        showMessage('error', 'Only JPG, PNG, and GIF files are allowed');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        showMessage('error', 'File size must be less than 5MB');
        return;
      }
      setBannerPicture(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setBannerPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadBanner = async () => {
    if (!bannerPicture) {
      showMessage('error', 'Please select a banner');
      return;
    }
    try {
      setLoading(true);
      const response = await apiClient.uploadBannerPicture(bannerPicture);
      const baseUrl = response.data.banner_picture_url;
      const bannerUrl = baseUrl + '?t=' + Date.now();
      
      showMessage('success', 'Banner uploaded successfully!');
      setBannerPicture(null);
      
      // Reset file input
      const fileInput = document.querySelectorAll('input[type="file"]')[1] as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
      // Update preview immediately
      setBannerPreviewUrl(bannerUrl);
      
      // Update user in AuthContext
      if (user) {
        updateUser({
          ...user,
          banner_picture_url: bannerUrl
        });
      }
    } catch (err: any) {
      showMessage('error', getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };


  // Delete Account
  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (deleteConfirm !== username) {
      showMessage('error', 'Username confirmation does not match');
      return;
    }
    if (!deletePassword) {
      showMessage('error', 'Password is required');
      return;
    }
    try {
      setLoading(true);
      await apiClient.deleteAccount(deletePassword);
      showMessage('success', 'Account deleted. Logging out...');
      setTimeout(() => {
        logout();
        router.push('/');
      }, 2000);
    } catch (err: any) {
      showMessage('error', getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // Theme Settings
  const handleUpdateTheme = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) {
        showMessage('error', 'Not authenticated');
        return;
      }
      
      await updatePreferences(token, {
        theme_mode: themeMode,
        primary_color: primaryColor,
        accent_color: accentColor,
        text_primary_color: textPrimaryColor,
        text_secondary_color: textSecondaryColor,
        bg_primary_color: bgPrimaryColor,
        bg_secondary_color: bgSecondaryColor,
      } as any);
      showMessage('success', 'Theme settings updated successfully!');
    } catch (err: any) {
      showMessage('error', getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:via-blue-900 dark:to-slate-900">
      {/* Animated background grid */}
      <div className="fixed inset-0 opacity-10 dark:opacity-10">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-600 opacity-20 dark:opacity-20" style={{
          backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(147, 51, 234, 0.1) 0%, transparent 50%)'
        }} />
      </div>

      <Header />
      <Sidebar onCategorySelect={() => {}} currentCategory={null} />

      <div className="ml-64 pt-20 px-6 pb-12 relative z-10">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-slate-100 mb-2">Settings</h1>
            <p className="text-gray-600 dark:text-slate-300">Manage your account and preferences</p>
          </div>

          {/* Message Alert */}
          {message && (
            <div
              className={`mb-6 p-4 rounded-xl border backdrop-blur-sm ${
                message.type === 'success'
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-600 text-green-800 dark:text-green-300'
                  : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-600 text-red-800 dark:text-red-300'
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Account Settings */}
          <div className="bg-white dark:bg-gradient-to-br dark:from-slate-800 dark:to-slate-900 rounded-2xl shadow-lg dark:shadow-xl border border-gray-200 dark:border-purple-500/20 mb-8 overflow-hidden hover:border-blue-300 dark:hover:border-purple-400/50 transition-all duration-300 dark:hover:shadow-2xl dark:hover:shadow-purple-500/20">
            <div className="px-8 py-6 border-b border-gray-200 dark:border-purple-500/20 bg-gray-50 dark:bg-slate-800/50 dark:backdrop-blur-sm">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Account Settings</h2>
            </div>
            <form onSubmit={handleUpdateSettings} className="p-8 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-slate-200 mb-2">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-purple-400 focus:border-transparent transition bg-gray-50 dark:bg-slate-700/30 hover:bg-white dark:hover:bg-slate-700/50 text-gray-900 dark:text-slate-100 dark:placeholder-slate-400"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-slate-200 mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-purple-400 focus:border-transparent transition bg-gray-50 dark:bg-slate-700/30 hover:bg-white dark:hover:bg-slate-700/50 text-gray-900 dark:text-slate-100 dark:placeholder-slate-400"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-slate-200 mb-2">Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell others about yourself..."
                  maxLength={500}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-purple-400 focus:border-transparent transition bg-gray-50 dark:bg-slate-700/30 hover:bg-white dark:hover:bg-slate-700/50 text-gray-900 dark:text-slate-100 dark:placeholder-slate-400 resize-none"
                />
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">{bio.length}/500 characters</p>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 font-medium shadow-lg hover:shadow-purple-500/50 transform hover:scale-105 active:scale-95 transition"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>

          {/* Profile Picture */}
          <div className="bg-white dark:bg-gradient-to-br dark:from-slate-800 dark:to-slate-900 rounded-2xl shadow-lg dark:shadow-xl border border-gray-200 dark:border-purple-500/20 mb-8 overflow-hidden hover:border-blue-300 dark:hover:border-purple-400/50 transition-all duration-300 dark:hover:shadow-2xl dark:hover:shadow-purple-500/20">
            <div className="px-8 py-6 border-b border-gray-200 dark:border-purple-500/20 bg-gray-50 dark:bg-slate-800/50 dark:backdrop-blur-sm">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Banner</h2>
            </div>
            <div className="p-8 space-y-6">
              {bannerPreviewUrl && (
                <div className="flex justify-center mb-6">
                  <div className="w-full h-40 rounded-xl overflow-hidden border-2 border-blue-200 dark:border-purple-500/30 shadow-lg">
                    <img
                      src={bannerPreviewUrl}
                      alt="Banner preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-slate-200 mb-3">
                  Upload Banner (JPG, PNG, GIF - Max 5MB)
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/gif"
                  onChange={handleBannerFileChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-700/30 text-gray-900 dark:text-slate-100"
                />
              </div>
              {bannerPicture && (
                <button
                  onClick={handleUploadBanner}
                  disabled={loading}
                  className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 font-semibold shadow-lg hover:shadow-purple-500/50 transform hover:scale-105 active:scale-95 transition"
                >
                  {loading ? 'Uploading...' : 'Upload Banner'}
                </button>
              )}
            </div>
          </div>

          {/* Profile Picture */}
          <div className="bg-white dark:bg-gradient-to-br dark:from-slate-800 dark:to-slate-900 rounded-2xl shadow-lg dark:shadow-xl border border-gray-200 dark:border-purple-500/20 mb-8 overflow-hidden hover:border-blue-300 dark:hover:border-purple-400/50 transition-all duration-300 dark:hover:shadow-2xl dark:hover:shadow-purple-500/20">
            <div className="px-8 py-6 border-b border-gray-200 dark:border-purple-500/20 bg-gray-50 dark:bg-slate-800/50 dark:backdrop-blur-sm">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Profile Picture</h2>
            </div>
            <div className="p-8 space-y-6">
              {previewUrl && (
                <div className="flex justify-center mb-6">
                  <div className="w-36 h-36 rounded-full overflow-hidden border-4 border-blue-200 dark:border-purple-500/30 shadow-lg">
                    <img
                      src={previewUrl}
                      alt="Profile preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-slate-200 mb-3">
                  Upload New Picture (JPG, PNG, GIF - Max 5MB)
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/gif"
                  onChange={handleFileChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-700/30 text-gray-900 dark:text-slate-100"
                />
              </div>
              {profilePicture && (
                <button
                  onClick={handleUploadPicture}
                  disabled={loading}
                  className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 font-semibold shadow-lg hover:shadow-purple-500/50 transform hover:scale-105 active:scale-95 transition"
                >
                  {loading ? 'Uploading...' : 'Upload Picture'}
                </button>
              )}
            </div>
          </div>

          {/* Change Password */}
          <div className="bg-white dark:bg-gradient-to-br dark:from-slate-800 dark:to-slate-900 rounded-2xl shadow-lg dark:shadow-xl border border-gray-200 dark:border-purple-500/20 mb-8 overflow-hidden hover:border-blue-300 dark:hover:border-purple-400/50 transition-all duration-300 dark:hover:shadow-2xl dark:hover:shadow-purple-500/20">
            <div className="px-8 py-6 border-b border-gray-200 dark:border-purple-500/20 bg-gray-50 dark:bg-slate-800/50 dark:backdrop-blur-sm">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Change Password</h2>
            </div>
            <form onSubmit={handleChangePassword} className="p-8 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-slate-200 mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-purple-400 focus:border-transparent transition bg-gray-50 dark:bg-slate-700/30 hover:bg-white dark:hover:bg-slate-700/50 text-gray-900 dark:text-slate-100 dark:placeholder-slate-400"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-slate-200 mb-2">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-purple-400 focus:border-transparent transition bg-gray-50 dark:bg-slate-700/30 hover:bg-white dark:hover:bg-slate-700/50 text-gray-900 dark:text-slate-100 dark:placeholder-slate-400"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-slate-200 mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-purple-400 focus:border-transparent transition bg-gray-50 dark:bg-slate-700/30 hover:bg-white dark:hover:bg-slate-700/50 text-gray-900 dark:text-slate-100 dark:placeholder-slate-400"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 font-medium shadow-lg hover:shadow-purple-500/50 transform hover:scale-105 active:scale-95 transition"
              >
                {loading ? 'Updating...' : 'Change Password'}
              </button>
            </form>
          </div>

          {/* Theme Customization */}
          <div className="bg-white dark:bg-gradient-to-br dark:from-slate-800 dark:to-slate-900 rounded-2xl shadow-lg dark:shadow-xl border border-gray-200 dark:border-purple-500/20 mb-8 overflow-hidden hover:border-blue-300 dark:hover:border-purple-400/50 transition-all duration-300 dark:hover:shadow-2xl dark:hover:shadow-purple-500/20">
            <div className="px-8 py-6 border-b border-gray-200 dark:border-purple-500/20 bg-gray-50 dark:bg-slate-800/50 dark:backdrop-blur-sm">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Theme Customization</h2>
              <p className="text-gray-600 dark:text-slate-400 text-sm mt-1">Personalize the appearance of the website</p>
            </div>
            <form onSubmit={handleUpdateTheme} className="p-8 space-y-8">
              {/* Theme Mode */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-slate-200 mb-4">Theme Mode</label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setThemeMode('light')}
                    className={`flex-1 px-4 py-3 rounded-xl border-2 font-medium transition ${
                      themeMode === 'light'
                        ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-500 text-blue-700 dark:text-blue-300'
                        : 'bg-gray-100 dark:bg-slate-700/30 border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300'
                    }`}
                  >
                    ☀️ Light
                  </button>
                  <button
                    type="button"
                    onClick={() => setThemeMode('dark')}
                    className={`flex-1 px-4 py-3 rounded-xl border-2 font-medium transition ${
                      themeMode === 'dark'
                        ? 'bg-purple-100 dark:bg-purple-900/30 border-purple-500 text-purple-700 dark:text-purple-300'
                        : 'bg-gray-100 dark:bg-slate-700/30 border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300'
                    }`}
                  >
                    🌙 Dark
                  </button>
                </div>
              </div>

              {/* Color Customization */}
              <div className="border-t border-gray-200 dark:border-slate-700 pt-8">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-6">Color Scheme</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <ColorPicker
                    label="Primary Color"
                    value={primaryColor}
                    onChange={setPrimaryColor}
                    description="Main accent color for buttons and links"
                  />
                  <ColorPicker
                    label="Accent Color"
                    value={accentColor}
                    onChange={setAccentColor}
                    description="Secondary accent color"
                  />
                  <ColorPicker
                    label="Text Primary"
                    value={textPrimaryColor}
                    onChange={setTextPrimaryColor}
                    description="Main text color"
                  />
                  <ColorPicker
                    label="Text Secondary"
                    value={textSecondaryColor}
                    onChange={setTextSecondaryColor}
                    description="Secondary text color"
                  />
                  <ColorPicker
                    label="Background Primary"
                    value={bgPrimaryColor}
                    onChange={setBgPrimaryColor}
                    description="Main background color"
                  />
                  <ColorPicker
                    label="Background Secondary"
                    value={bgSecondaryColor}
                    onChange={setBgSecondaryColor}
                    description="Secondary background color"
                  />
                </div>
              </div>

              {/* Preview */}
              <div className="border-t border-gray-200 dark:border-slate-700 pt-8">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">Preview</h3>
                <div
                  className="p-6 rounded-xl border-2 border-dashed"
                  style={{
                    backgroundColor: bgPrimaryColor,
                    color: textPrimaryColor,
                    borderColor: primaryColor,
                  }}
                >
                  <p className="text-sm mb-4">This is a preview of your custom theme</p>
                  <button
                    type="button"
                    className="px-4 py-2 rounded-lg font-medium transition"
                    style={{
                      backgroundColor: primaryColor,
                      color: bgPrimaryColor,
                    }}
                  >
                    Sample Button
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 font-semibold shadow-lg hover:shadow-purple-500/50 transform hover:scale-105 active:scale-95 transition"
              >
                {loading ? 'Saving...' : 'Save Theme'}
              </button>
            </form>
          </div>

          {/* Danger Zone */}
          <div className="bg-white dark:bg-gradient-to-br dark:from-slate-800 dark:to-slate-900 rounded-2xl shadow-lg dark:shadow-xl border-2 border-red-200 dark:border-red-600/40 overflow-hidden">
            <div className="px-6 py-4 border-b border-red-200 dark:border-red-600/40 bg-red-50 dark:bg-red-950/30">
              <h2 className="text-xl font-bold text-red-600 dark:text-red-400">Danger Zone</h2>
            </div>
            <form onSubmit={handleDeleteAccount} className="p-6 space-y-4">
              <p className="text-gray-600 dark:text-slate-300 text-sm">
                Deleting your account is permanent and cannot be undone. All your data will be deleted.
              </p>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-200 mb-2">
                  Confirm username ({username})
                </label>
                <input
                  type="text"
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value)}
                  placeholder="Type your username to confirm"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-600 dark:focus:ring-red-400 bg-gray-50 dark:bg-slate-700/30 text-gray-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-200 mb-2">Password</label>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-600 dark:focus:ring-red-400 bg-gray-50 dark:bg-slate-700/30 text-gray-900 dark:text-slate-100"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading || deleteConfirm !== username}
                className="w-full px-4 py-2 bg-red-600 dark:bg-red-700 text-white rounded-xl hover:bg-red-700 dark:hover:bg-red-600 disabled:opacity-50 font-medium shadow-lg hover:shadow-red-500/50 transform hover:scale-105 active:scale-95 transition"
              >
                {loading ? 'Deleting...' : 'Delete Account'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
