'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/components/auth-provider';
import { toast } from '@/hooks/use-toast';
import { 
  Settings, 
  Building,
  User,
  Bell,
  Shield,
  Mail,
  Phone,
  MapPin,
  Globe,
  Calendar,
  Save,
  Edit,
  Lock,
  Users,
  FileText,
  Database
} from 'lucide-react';
import { CompanyNavigation } from '@/components/company-navigation';

export default function CompanySettings() {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('company');

  // Company Profile State
  const [companyProfile, setCompanyProfile] = useState({
    companyName: '',
    industry: '',
    foundedYear: '',
    employeeCount: '',
    website: '',
    address: '',
    city: '',
    country: '',
    description: ''
  });

  // Contact Information State
  const [contactInfo, setContactInfo] = useState({
    primaryEmail: '',
    secondaryEmail: '',
    phone: '',
    fax: '',
    emergencyContact: '',
    emergencyPhone: ''
  });

  // Security Settings State
  const [securitySettings, setSecuritySettings] = useState({
    passwordPolicy: 'medium',
    sessionTimeout: '30',
    twoFactorAuth: false,
    dataRetention: '365',
    auditLogging: true,
    encryptionLevel: 'aes256'
  });

  // Notification Settings State
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    securityAlerts: true,
    weeklyReports: true,
    monthlyReports: true,
    riskAssessmentAlerts: true,
    complianceUpdates: true
  });

  useEffect(() => {
    setMounted(true);
    loadCompanySettings();
  }, []);

  const loadCompanySettings = () => {
    // Initialize with user data if available
    if (user) {
      setCompanyProfile(prev => ({
        ...prev,
        companyName: user.companyName || '',
        primaryEmail: user.email || ''
      }));
      
      setContactInfo(prev => ({
        ...prev,
        primaryEmail: user.email || '',
        phone: user.phone || ''
      }));
    }
  };

  const handleSaveCompanyProfile = async () => {
    setLoading(true);
    try {
      // Here you would typically make an API call to save the company profile
      // For now, we'll just show a success message
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      toast({
        title: "Success",
        description: "Company profile updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update company profile",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveContactInfo = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({
        title: "Success",
        description: "Contact information updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update contact information",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSecuritySettings = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({
        title: "Success",
        description: "Security settings updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update security settings",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotificationSettings = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({
        title: "Success",
        description: "Notification settings updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update notification settings",
        variant: "destructive"
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
      <CompanyNavigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Company Settings
            </h1>
            <p className="text-gray-300">
              Manage your organization's profile, security, and preferences
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white/10 border-white/20">
            <TabsTrigger value="company" className="data-[state=active]:bg-white/20">
              <Building className="mr-2 h-4 w-4" />
              Company Profile
            </TabsTrigger>
            <TabsTrigger value="contact" className="data-[state=active]:bg-white/20">
              <Mail className="mr-2 h-4 w-4" />
              Contact Information
            </TabsTrigger>
            <TabsTrigger value="security" className="data-[state=active]:bg-white/20">
              <Shield className="mr-2 h-4 w-4" />
              Security Settings
            </TabsTrigger>
            <TabsTrigger value="notifications" className="data-[state=active]:bg-white/20">
              <Bell className="mr-2 h-4 w-4" />
              Notifications
            </TabsTrigger>
          </TabsList>

          <TabsContent value="company">
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Company Profile</CardTitle>
                <CardDescription className="text-gray-300">
                  Update your company's basic information and details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Company Name</label>
                    <Input
                      value={companyProfile.companyName}
                      onChange={(e) => setCompanyProfile(prev => ({ ...prev, companyName: e.target.value }))}
                      className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                      placeholder="Enter company name"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Industry</label>
                    <select
                      value={companyProfile.industry}
                      onChange={(e) => setCompanyProfile(prev => ({ ...prev, industry: e.target.value }))}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white"
                    >
                      <option value="">Select Industry</option>
                      <option value="technology">Technology</option>
                      <option value="finance">Finance</option>
                      <option value="healthcare">Healthcare</option>
                      <option value="manufacturing">Manufacturing</option>
                      <option value="retail">Retail</option>
                      <option value="education">Education</option>
                      <option value="government">Government</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Founded Year</label>
                    <Input
                      type="number"
                      value={companyProfile.foundedYear}
                      onChange={(e) => setCompanyProfile(prev => ({ ...prev, foundedYear: e.target.value }))}
                      className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                      placeholder="e.g., 2020"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Employee Count</label>
                    <select
                      value={companyProfile.employeeCount}
                      onChange={(e) => setCompanyProfile(prev => ({ ...prev, employeeCount: e.target.value }))}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white"
                    >
                      <option value="">Select Size</option>
                      <option value="1-10">1-10 employees</option>
                      <option value="11-50">11-50 employees</option>
                      <option value="51-200">51-200 employees</option>
                      <option value="201-500">201-500 employees</option>
                      <option value="501-1000">501-1000 employees</option>
                      <option value="1000+">1000+ employees</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Website</label>
                    <Input
                      type="url"
                      value={companyProfile.website}
                      onChange={(e) => setCompanyProfile(prev => ({ ...prev, website: e.target.value }))}
                      className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                      placeholder="https://www.company.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Country</label>
                    <Input
                      value={companyProfile.country}
                      onChange={(e) => setCompanyProfile(prev => ({ ...prev, country: e.target.value }))}
                      className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                      placeholder="Enter country"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Address</label>
                  <Input
                    value={companyProfile.address}
                    onChange={(e) => setCompanyProfile(prev => ({ ...prev, address: e.target.value }))}
                    className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                    placeholder="Enter company address"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Company Description</label>
                  <Textarea
                    value={companyProfile.description}
                    onChange={(e) => setCompanyProfile(prev => ({ ...prev, description: e.target.value }))}
                    className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                    placeholder="Brief description of your company..."
                    rows={4}
                  />
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={handleSaveCompanyProfile}
                    disabled={loading}
                    className="bg-gradient-security hover:opacity-90 text-white border-0"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {loading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contact">
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Contact Information</CardTitle>
                <CardDescription className="text-gray-300">
                  Manage your company's contact details and emergency contacts
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Primary Email</label>
                    <Input
                      type="email"
                      value={contactInfo.primaryEmail}
                      onChange={(e) => setContactInfo(prev => ({ ...prev, primaryEmail: e.target.value }))}
                      className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                      placeholder="primary@company.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Secondary Email</label>
                    <Input
                      type="email"
                      value={contactInfo.secondaryEmail}
                      onChange={(e) => setContactInfo(prev => ({ ...prev, secondaryEmail: e.target.value }))}
                      className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                      placeholder="secondary@company.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Phone Number</label>
                    <Input
                      type="tel"
                      value={contactInfo.phone}
                      onChange={(e) => setContactInfo(prev => ({ ...prev, phone: e.target.value }))}
                      className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Fax Number</label>
                    <Input
                      type="tel"
                      value={contactInfo.fax}
                      onChange={(e) => setContactInfo(prev => ({ ...prev, fax: e.target.value }))}
                      className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                      placeholder="+1 (555) 123-4568"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Emergency Contact</label>
                    <Input
                      value={contactInfo.emergencyContact}
                      onChange={(e) => setContactInfo(prev => ({ ...prev, emergencyContact: e.target.value }))}
                      className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                      placeholder="Emergency contact name"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Emergency Phone</label>
                    <Input
                      type="tel"
                      value={contactInfo.emergencyPhone}
                      onChange={(e) => setContactInfo(prev => ({ ...prev, emergencyPhone: e.target.value }))}
                      className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                      placeholder="+1 (555) 911-0000"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={handleSaveContactInfo}
                    disabled={loading}
                    className="bg-gradient-security hover:opacity-90 text-white border-0"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {loading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Security Settings</CardTitle>
                <CardDescription className="text-gray-300">
                  Configure your company's security policies and data protection settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Password Policy</label>
                    <select
                      value={securitySettings.passwordPolicy}
                      onChange={(e) => setSecuritySettings(prev => ({ ...prev, passwordPolicy: e.target.value }))}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white"
                    >
                      <option value="low">Low Security (8+ characters)</option>
                      <option value="medium">Medium Security (12+ characters, mixed case)</option>
                      <option value="high">High Security (16+ characters, symbols required)</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Session Timeout (minutes)</label>
                    <select
                      value={securitySettings.sessionTimeout}
                      onChange={(e) => setSecuritySettings(prev => ({ ...prev, sessionTimeout: e.target.value }))}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white"
                    >
                      <option value="15">15 minutes</option>
                      <option value="30">30 minutes</option>
                      <option value="60">1 hour</option>
                      <option value="120">2 hours</option>
                      <option value="480">8 hours</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Data Retention (days)</label>
                    <Input
                      type="number"
                      value={securitySettings.dataRetention}
                      onChange={(e) => setSecuritySettings(prev => ({ ...prev, dataRetention: e.target.value }))}
                      className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                      placeholder="365"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Encryption Level</label>
                    <select
                      value={securitySettings.encryptionLevel}
                      onChange={(e) => setSecuritySettings(prev => ({ ...prev, encryptionLevel: e.target.value }))}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white"
                    >
                      <option value="aes128">AES-128</option>
                      <option value="aes256">AES-256</option>
                      <option value="rsa2048">RSA-2048</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                    <div>
                      <div className="text-white font-medium">Two-Factor Authentication</div>
                      <div className="text-gray-400 text-sm">Require 2FA for all users</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={securitySettings.twoFactorAuth}
                        onChange={(e) => setSecuritySettings(prev => ({ ...prev, twoFactorAuth: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                    <div>
                      <div className="text-white font-medium">Audit Logging</div>
                      <div className="text-gray-400 text-sm">Log all user activities</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={securitySettings.auditLogging}
                        onChange={(e) => setSecuritySettings(prev => ({ ...prev, auditLogging: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={handleSaveSecuritySettings}
                    disabled={loading}
                    className="bg-gradient-security hover:opacity-90 text-white border-0"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {loading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Notification Settings</CardTitle>
                <CardDescription className="text-gray-300">
                  Configure how and when you receive notifications from the platform
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                    <div>
                      <div className="text-white font-medium">Email Notifications</div>
                      <div className="text-gray-400 text-sm">Receive general platform notifications via email</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationSettings.emailNotifications}
                        onChange={(e) => setNotificationSettings(prev => ({ ...prev, emailNotifications: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                    <div>
                      <div className="text-white font-medium">Security Alerts</div>
                      <div className="text-gray-400 text-sm">Immediate notifications for security incidents</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationSettings.securityAlerts}
                        onChange={(e) => setNotificationSettings(prev => ({ ...prev, securityAlerts: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                    <div>
                      <div className="text-white font-medium">Weekly Reports</div>
                      <div className="text-gray-400 text-sm">Weekly summary of company security metrics</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationSettings.weeklyReports}
                        onChange={(e) => setNotificationSettings(prev => ({ ...prev, weeklyReports: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                    <div>
                      <div className="text-white font-medium">Monthly Reports</div>
                      <div className="text-gray-400 text-sm">Comprehensive monthly analytics and insights</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationSettings.monthlyReports}
                        onChange={(e) => setNotificationSettings(prev => ({ ...prev, monthlyReports: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                    <div>
                      <div className="text-white font-medium">Risk Assessment Alerts</div>
                      <div className="text-gray-400 text-sm">Notifications when risk levels change</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationSettings.riskAssessmentAlerts}
                        onChange={(e) => setNotificationSettings(prev => ({ ...prev, riskAssessmentAlerts: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                    <div>
                      <div className="text-white font-medium">Compliance Updates</div>
                      <div className="text-gray-400 text-sm">Updates on compliance standards and regulations</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationSettings.complianceUpdates}
                        onChange={(e) => setNotificationSettings(prev => ({ ...prev, complianceUpdates: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={handleSaveNotificationSettings}
                    disabled={loading}
                    className="bg-gradient-security hover:opacity-90 text-white border-0"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {loading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
