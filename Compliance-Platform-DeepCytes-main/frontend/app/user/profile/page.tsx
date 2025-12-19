'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { 
  User, 
  Mail, 
  Bell, 
  Shield, 
  Eye,
  Save,
  Calendar,
  Award,
  Settings
} from 'lucide-react';
import { UserNavigation } from '@/components/user-navigation';
import { useAuth } from '@/components/auth-provider';
import { toast } from 'sonner';
import { API_ENDPOINTS } from '@/lib/config';

export default function ProfilePage() {
  const { user, accessToken } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    notifications: {
      email: true,
      assessment: true,
      achievements: true,
      security: true
    },
    privacy: {
      showOnLeaderboard: true,
      shareProgress: false,
      publicProfile: false
    }
  });
  const [profileStats, setProfileStats] = useState({
    joinDate: '',
    totalAssessments: 0,
    lastAssessment: '',
    currentScore: 0,
    achievements: 0,
    rank: 'Bronze'
  });

  useEffect(() => {
    setMounted(true);
    if (user && accessToken) {
      console.log('User and token:', { userId: user.id, accessToken });
      fetchData();
    } else {
      console.error('User or token missing:', { user, accessToken });
      setError('Authentication error: Please log in again.');
      setIsLoading(false);
    }
  }, [user, accessToken]);

  const fetchWithTimeout = async (url, options, timeout = 5000) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(id);
      return response;
    } catch (error) {
      clearTimeout(id);
      throw error;
    }
  };

  const fetchProfileData = async () => {
    try {
      const response = await fetchWithTimeout(`${API_ENDPOINTS.USER.PROFILE}?userId=${user.id}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Profile fetch failed: ${errorData || response.statusText}`);
      }
      const data = await response.json();
      setProfile({
        name: data.name || '',
        email: data.email || '',
        notifications: data.notifications || {
          email: true,
          assessment: true,
          achievements: true,
          security: true
        },
        privacy: data.privacy || {
          showOnLeaderboard: true,
          shareProgress: false,
          publicProfile: false
        }
      });
    } catch (error) {
      console.error('Fetch profile error:', error.message);
      throw error;
    }
  };

  const fetchStatsData = async () => {
    try {
      const response = await fetchWithTimeout(`${API_ENDPOINTS.USER.REPORT}?userId=${user.id}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Stats fetch failed: ${errorData || response.statusText}`);
      }
      const data = await response.json();
      setProfileStats({
        joinDate: data.joinDate || 'N/A',
        totalAssessments: data.totalAssessments || 0,
        lastAssessment: data.lastAssessment || 'No assessments yet',
        currentScore: data.overallScore || 0,
        achievements: data.achievements || 0,
        rank: data.rank || 'Bronze'
      });
    } catch (error) {
      console.error('Fetch stats error:', error.message);
      throw error;
    }
  };

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await Promise.all([fetchProfileData(), fetchStatsData()]);
    } catch (error) {
      setError(error.message);
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.USER.PROFILE_UPDATE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          userId: user.id,
          name: profile.name,
          email: profile.email,
          notifications: profile.notifications,
          privacy: profile.privacy
        })
      });
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Update failed: ${errorData || response.statusText}`);
      }
      toast.success('Profile updated successfully!');
      setIsEditing(false);
    } catch (error) {
      console.error('Update profile error:', error.message);
      toast.error(error.message);
    }
  };

  if (!mounted || !user) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-center">
          <p className="text-xl mb-4">Error: {error}</p>
          <Button
            onClick={fetchData}
            className="bg-gradient-security hover:opacity-90 text-white"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <UserNavigation />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-gradient-security rounded-full">
              <User className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">{profile.name}</h1>
          <p className="text-gray-300">{profile.email}</p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-white/10 border-white/20 w-full">
            <TabsTrigger value="overview" className="data-[state=active]:bg-white/20 flex-1">
              Overview
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-white/20 flex-1">
              Settings
            </TabsTrigger>
            <TabsTrigger value="privacy" className="data-[state=active]:bg-white/20 flex-1">
              Privacy
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid md:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <Card className="bg-white/10 backdrop-blur-md border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white">Profile Statistics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-300">Member Since</span>
                      <span className="text-white">{profileStats.joinDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Total Assessments</span>
                      <span className="text-white">{profileStats.totalAssessments}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Last Assessment</span>
                      <span className="text-white">{profileStats.lastAssessment}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Current Score</span>
                      <span className="text-green-400 font-semibold">{profileStats.currentScore}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Achievements</span>
                      <span className="text-yellow-400">{profileStats.achievements}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Current Rank</span>
                      <span className="text-blue-400">{profileStats.rank}</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <Card className="bg-white/10 backdrop-blur-md border-white/20">
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-white">Personal Information</CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsEditing(!isEditing)}
                        className="text-blue-400 hover:bg-blue-400/10"
                      >
                        {isEditing ? 'Cancel' : 'Edit'}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-white">Full Name</Label>
                      <Input
                        id="name"
                        value={profile.name}
                        onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                        disabled={!isEditing}
                        className="bg-white/5 border-white/20 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-white">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profile.email}
                        onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                        disabled={!isEditing}
                        className="bg-white/5 border-white/20 text-white"
                      />
                    </div>
                    {isEditing && (
                      <Button
                        onClick={handleSave}
                        className="w-full bg-gradient-security hover:opacity-90 text-white border-0"
                      >
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </TabsContent>

          <TabsContent value="settings">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Card className="bg-white/10 backdrop-blur-md border-white/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Bell className="mr-2 h-5 w-5" />
                    Notification Preferences
                  </CardTitle>
                  <CardDescription className="text-gray-300">
                    Choose what notifications you'd like to receive
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-white">Email Notifications</Label>
                      <p className="text-sm text-gray-400">Receive updates via email</p>
                    </div>
                    <Switch
                      checked={profile.notifications.email}
                      onCheckedChange={(checked) => 
                        setProfile(prev => ({
                          ...prev,
                          notifications: { ...prev.notifications, email: checked }
                        }))
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-white">Assessment Reminders</Label>
                      <p className="text-sm text-gray-400">Get reminded to take assessments</p>
                    </div>
                    <Switch
                      checked={profile.notifications.assessment}
                      onCheckedChange={(checked) => 
                        setProfile(prev => ({
                          ...prev,
                          notifications: { ...prev.notifications, assessment: checked }
                        }))
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-white">Achievement Notifications</Label>
                      <p className="text-sm text-gray-400">Get notified when you earn achievements</p>
                    </div>
                    <Switch
                      checked={profile.notifications.achievements}
                      onCheckedChange={(checked) => 
                        setProfile(prev => ({
                          ...prev,
                          notifications: { ...prev.notifications, achievements: checked }
                        }))
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-white">Security Alerts</Label>
                      <p className="text-sm text-gray-400">Important security updates and alerts</p>
                    </div>
                    <Switch
                      checked={profile.notifications.security}
                      onCheckedChange={(checked) => 
                        setProfile(prev => ({
                          ...prev,
                          notifications: { ...prev.notifications, security: checked }
                        }))
                      }
                    />
                  </div>
                  <Button
                    onClick={handleSave}
                    className="w-full bg-gradient-security hover:opacity-90 text-white border-0"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Save Notification Settings
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="privacy">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Card className="bg-white/10 backdrop-blur-md border-white/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Eye className="mr-2 h-5 w-5" />
                    Privacy Settings
                  </CardTitle>
                  <CardDescription className="text-gray-300">
                    Control how your information is shared and displayed
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-white">Show on Leaderboard</Label>
                      <p className="text-sm text-gray-400">Display your rank on public leaderboards</p>
                    </div>
                    <Switch
                      checked={profile.privacy.showOnLeaderboard}
                      onCheckedChange={(checked) => 
                        setProfile(prev => ({
                          ...prev,
                          privacy: { ...prev.privacy, showOnLeaderboard: checked }
                        }))
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-white">Share Progress</Label>
                      <p className="text-sm text-gray-400">Allow others to see your security improvements</p>
                    </div>
                    <Switch
                      checked={profile.privacy.shareProgress}
                      onCheckedChange={(checked) => 
                        setProfile(prev => ({
                          ...prev,
                          privacy: { ...prev.privacy, shareProgress: checked }
                        }))
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-white">Public Profile</Label>
                      <p className="text-sm text-gray-400">Make your profile viewable by others</p>
                    </div>
                    <Switch
                      checked={profile.privacy.publicProfile}
                      onCheckedChange={(checked) => 
                        setProfile(prev => ({
                          ...prev,
                          privacy: { ...prev.privacy, publicProfile: checked }
                        }))
                      }
                    />
                  </div>
                  <Button
                    onClick={handleSave}
                    className="w-full bg-gradient-security hover:opacity-90 text-white border-0"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Save Privacy Settings
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}