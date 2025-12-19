'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdminNavigation } from '@/components/admin-navigation';
import { useAuth } from '@/components/auth-provider';
import { toast } from '@/hooks/use-toast';
import { 
  Settings, 
  Shield, 
  Bell, 
  Database, 
  Lock,
  Save,
  RefreshCw
} from 'lucide-react';

export default function AdminSettings() {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // System Settings
  const [systemSettings, setSystemSettings] = useState({
    maintenanceMode: false,
    autoBackup: true,
    emailNotifications: true,
    sessionTimeout: 30,
    maxLoginAttempts: 5,
  });

  // Email Settings
  const [emailSettings, setEmailSettings] = useState({
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    fromEmail: 'admin@compliance-platform.com',
    fromName: 'Compliance Platform'
  });

  // Security Settings
  const [securitySettings, setSecuritySettings] = useState({
    minPasswordLength: 8,
    requireSpecialChars: true,
    requireNumbers: true,
    ipWhitelist: '',
    bruteForceProtection: true,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSystemSettingChange = (key: string, value: any) => {
    setSystemSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleEmailSettingChange = (key: string, value: string) => {
    setEmailSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSecuritySettingChange = (key: string, value: any) => {
    setSecuritySettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveSettings = async (settingsType: string) => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Settings Saved",
        description: `${settingsType} settings have been updated successfully.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to save ${settingsType} settings.`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <AdminNavigation />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center space-x-3 mb-8">
          <div className="p-2 bg-gradient-security rounded-lg">
            <Settings className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">System Settings</h1>
            <p className="text-gray-300">Manage platform configuration and preferences</p>
          </div>
        </div>

        <Tabs defaultValue="system" className="space-y-6">
          <TabsList className="bg-white/10 border-white/20">
            <TabsTrigger value="system" className="data-[state=active]:bg-white/20">
              <Shield className="h-4 w-4 mr-2" />
              System
            </TabsTrigger>
            <TabsTrigger value="email" className="data-[state=active]:bg-white/20">
              <Bell className="h-4 w-4 mr-2" />
              Email
            </TabsTrigger>
            <TabsTrigger value="security" className="data-[state=active]:bg-white/20">
              <Lock className="h-4 w-4 mr-2" />
              Security
            </TabsTrigger>
            <TabsTrigger value="database" className="data-[state=active]:bg-white/20">
              <Database className="h-4 w-4 mr-2" />
              Database
            </TabsTrigger>
          </TabsList>

          {/* System Settings */}
          <TabsContent value="system">
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardHeader>
                <CardTitle className="text-white">General Settings</CardTitle>
                <CardDescription className="text-gray-300">
                  Configure basic system behavior and features
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-white">Maintenance Mode</Label>
                        <p className="text-gray-400 text-sm">Temporarily disable public access</p>
                      </div>
                      <Switch
                        checked={systemSettings.maintenanceMode}
                        onCheckedChange={(checked) => handleSystemSettingChange('maintenanceMode', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-white">Auto Backup</Label>
                        <p className="text-gray-400 text-sm">Automatically backup data daily</p>
                      </div>
                      <Switch
                        checked={systemSettings.autoBackup}
                        onCheckedChange={(checked) => handleSystemSettingChange('autoBackup', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-white">Email Notifications</Label>
                        <p className="text-gray-400 text-sm">Send system notifications via email</p>
                      </div>
                      <Switch
                        checked={systemSettings.emailNotifications}
                        onCheckedChange={(checked) => handleSystemSettingChange('emailNotifications', checked)}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="sessionTimeout" className="text-white">Session Timeout (minutes)</Label>
                      <Input
                        id="sessionTimeout"
                        type="number"
                        value={systemSettings.sessionTimeout}
                        onChange={(e) => handleSystemSettingChange('sessionTimeout', parseInt(e.target.value))}
                        className="bg-white/5 border-white/20 text-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="maxLoginAttempts" className="text-white">Max Login Attempts</Label>
                      <Input
                        id="maxLoginAttempts"
                        type="number"
                        value={systemSettings.maxLoginAttempts}
                        onChange={(e) => handleSystemSettingChange('maxLoginAttempts', parseInt(e.target.value))}
                        className="bg-white/5 border-white/20 text-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10">
                  <Button 
                    onClick={() => handleSaveSettings('System')}
                    disabled={loading}
                    className="bg-gradient-security hover:opacity-90 text-white border-0"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {loading ? 'Saving...' : 'Save System Settings'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Email Settings */}
          <TabsContent value="email">
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Email Configuration</CardTitle>
                <CardDescription className="text-gray-300">
                  Configure SMTP settings for outgoing emails
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="smtpHost" className="text-white">SMTP Host</Label>
                      <Input
                        id="smtpHost"
                        value={emailSettings.smtpHost}
                        onChange={(e) => handleEmailSettingChange('smtpHost', e.target.value)}
                        className="bg-white/5 border-white/20 text-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="smtpPort" className="text-white">SMTP Port</Label>
                      <Input
                        id="smtpPort"
                        type="number"
                        value={emailSettings.smtpPort}
                        onChange={(e) => handleEmailSettingChange('smtpPort', e.target.value)}
                        className="bg-white/5 border-white/20 text-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="fromEmail" className="text-white">From Email</Label>
                      <Input
                        id="fromEmail"
                        type="email"
                        value={emailSettings.fromEmail}
                        onChange={(e) => handleEmailSettingChange('fromEmail', e.target.value)}
                        className="bg-white/5 border-white/20 text-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="fromName" className="text-white">From Name</Label>
                      <Input
                        id="fromName"
                        value={emailSettings.fromName}
                        onChange={(e) => handleEmailSettingChange('fromName', e.target.value)}
                        className="bg-white/5 border-white/20 text-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10">
                  <Button 
                    onClick={() => handleSaveSettings('Email')}
                    disabled={loading}
                    className="bg-gradient-security hover:opacity-90 text-white border-0"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {loading ? 'Saving...' : 'Save Email Settings'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security">
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Security Configuration</CardTitle>
                <CardDescription className="text-gray-300">
                  Configure security policies and password requirements
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="minPasswordLength" className="text-white">Minimum Password Length</Label>
                      <Input
                        id="minPasswordLength"
                        type="number"
                        value={securitySettings.minPasswordLength}
                        onChange={(e) => handleSecuritySettingChange('minPasswordLength', parseInt(e.target.value))}
                        className="bg-white/5 border-white/20 text-white"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-white">Require Special Characters</Label>
                        <p className="text-gray-400 text-sm">Password must contain special characters</p>
                      </div>
                      <Switch
                        checked={securitySettings.requireSpecialChars}
                        onCheckedChange={(checked) => handleSecuritySettingChange('requireSpecialChars', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-white">Require Numbers</Label>
                        <p className="text-gray-400 text-sm">Password must contain numbers</p>
                      </div>
                      <Switch
                        checked={securitySettings.requireNumbers}
                        onCheckedChange={(checked) => handleSecuritySettingChange('requireNumbers', checked)}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="ipWhitelist" className="text-white">IP Whitelist</Label>
                      <Input
                        id="ipWhitelist"
                        placeholder="192.168.1.1, 10.0.0.1"
                        value={securitySettings.ipWhitelist}
                        onChange={(e) => handleSecuritySettingChange('ipWhitelist', e.target.value)}
                        className="bg-white/5 border-white/20 text-white"
                      />
                      <p className="text-gray-400 text-xs">Comma-separated list of allowed IP addresses</p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-white">Brute Force Protection</Label>
                        <p className="text-gray-400 text-sm">Block IPs after failed attempts</p>
                      </div>
                      <Switch
                        checked={securitySettings.bruteForceProtection}
                        onCheckedChange={(checked) => handleSecuritySettingChange('bruteForceProtection', checked)}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10">
                  <Button 
                    onClick={() => handleSaveSettings('Security')}
                    disabled={loading}
                    className="bg-gradient-security hover:opacity-90 text-white border-0"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {loading ? 'Saving...' : 'Save Security Settings'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Database Settings */}
          <TabsContent value="database">
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Database Management</CardTitle>
                <CardDescription className="text-gray-300">
                  Manage database backups and maintenance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="p-4 bg-white/5 rounded-lg">
                      <h3 className="text-white font-medium mb-2">Database Status</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Status:</span>
                          <span className="text-green-400">Connected</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Size:</span>
                          <span className="text-white">245.7 MB</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Last Backup:</span>
                          <span className="text-white">2 hours ago</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Button 
                        onClick={() => handleSaveSettings('Database Backup')}
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white border-0"
                      >
                        <Database className="h-4 w-4 mr-2" />
                        Create Backup
                      </Button>
                      
                      <Button 
                        onClick={() => handleSaveSettings('Database Optimization')}
                        disabled={loading}
                        className="bg-gradient-security hover:opacity-90 text-white border-0"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Optimize Database
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 bg-white/5 rounded-lg">
                      <h3 className="text-white font-medium mb-3">Recent Backups</h3>
                      <div className="space-y-2">
                        {[
                          { name: 'backup_2025_07_13_07_00.sql', size: '245.7 MB', date: '2 hours ago' },
                          { name: 'backup_2025_07_12_07_00.sql', size: '243.2 MB', date: '1 day ago' },
                          { name: 'backup_2025_07_11_07_00.sql', size: '241.8 MB', date: '2 days ago' }
                        ].map((backup, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-white/5 rounded text-sm">
                            <div>
                              <div className="text-white">{backup.name}</div>
                              <div className="text-gray-400">{backup.size} • {backup.date}</div>
                            </div>
                            <Button size="sm" variant="ghost" className="text-blue-400 hover:bg-blue-400/10">
                              Download
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
