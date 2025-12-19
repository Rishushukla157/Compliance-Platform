'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, TrendingUp, AlertTriangle, CheckCircle, Download, Calendar, Target, Lightbulb, BarChart2, Mail } from 'lucide-react';
import { UserNavigation } from '@/components/user-navigation';
import { useAuth } from '@/components/auth-provider';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import SecurityReport from './analytics';
import { API_ENDPOINTS } from '@/lib/config';

interface ReportData {
  userName: string;
  overallScore: number;
  previousScore: number;
  lastAssessment: string;
  totalAssessments: number;
  attempts: Array<{
    attemptNumber: number;
    overallPercentage: number;
    completedAt: string;
    userName: string;
    accuracyChange: number;
  }>;
  categoryScores: Record<string, number>;
  recommendations: Array<{
    category: string;
    issue: string;
    description: string;
    action: string;
    priority: string;
  }>;
  improvements: Array<{
    date: string;
    score: number;
    category: string;
    userName: string;
  }>;
  benchmarks: {
    industry: number;
    peers: number;
    topPerformers: number;
  };
  joinDate?: string;
  achievements?: number;
}

interface AssessmentData {
  _id: string;
  answers: Record<string, string>;
  categoryScores: Record<string, { score: number; total: number }>;
  overallScore: number;
  timestamp: string;
  userName: string;
  benchmarks?: { industry: number; peers: number; topPerformers?: number };
  totalAssessments?: number;
  lastAssessment?: string;
  joinDate?: string;
  achievements?: number;
  recommendations?: Array<{
    category: string;
    issue: string;
    description: string;
    action: string;
    priority: string;
  }>;
}

export default function ReportsPage() {
  const [mounted, setMounted] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [emailForm, setEmailForm] = useState({
    recipientEmail: '',
    recipientName: '',
    testName: 'Security Assessment Report',
  });
  const [isEmailSending, setIsEmailSending] = useState(false);
  const { user, accessToken, refreshAccessToken } = useAuth();
  const router = useRouter();

  // Refs for each section (kept for UI rendering, not PDF generation)
  const overviewRef = useRef<HTMLDivElement>(null);
  const chartsRef = useRef<HTMLDivElement>(null);
  const recommendationsRef = useRef<HTMLDivElement>(null);

  // Pre-fill email form with user data
  useEffect(() => {
    if (user && !emailForm.recipientEmail) {
      setEmailForm((prev) => ({
        ...prev,
        recipientEmail: user.email || '',
        recipientName: user.name || '',
      }));
    }
  }, [user, emailForm.recipientEmail]);

  // Fetch report data
  useEffect(() => {
    setMounted(true);
    if (user?.id && accessToken) {
      fetchReport();
    } else {
      toast.error('Please log in to view your report');
      router.push('/auth/login');
    }
  }, [user, accessToken, router]);

  const fetchReport = async () => {
    setIsLoading(true);
    try {
      console.log('Fetching report for user:', user?.id, 'with token:', accessToken);
      let response = await fetch(`${API_ENDPOINTS.USER.REPORT}?userId=${user?.id}&t=${Date.now()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
          'Cache-Control': 'no-cache',
        },
      });

      if (response.status === 403) {
        console.log('Token expired, attempting to refresh...');
        const refreshed = await refreshAccessToken();
        if (!refreshed) {
          throw new Error('Failed to refresh token');
        }
        response = await fetch(`${API_ENDPOINTS.USER.REPORT}?userId=${user?.id}&t=${Date.now()}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
            'Cache-Control': 'no-cache',
          },
        });
      }

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        let errorData;
        if (contentType && contentType.includes('application/json')) {
          errorData = await response.json();
        } else {
          errorData = { error: `HTTP error! status: ${response.status}` };
        }
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Report response data:', data);

      // Validate data structure
      if (!data || typeof data.overallScore === 'undefined') {
        throw new Error('Invalid report data: missing overallScore');
      }

      const validatedData: ReportData = {
        userName: data.userName || user?.name || 'User',
        overallScore: Math.min(Number((data.overallScore || 0).toFixed(1)), 100),
        previousScore: Math.min(Number((data.previousScore || 0).toFixed(1)), 100),
        lastAssessment: data.lastAssessment || 'No assessments yet',
        totalAssessments: data.totalAssessments || 0,
        attempts: (data.attempts || []).map((attempt: any) => ({
          attemptNumber: attempt.attemptNumber || 0,
          overallPercentage: Math.min(Number((attempt.overallPercentage || 0).toFixed(1)), 100),
          completedAt: attempt.completedAt || new Date().toISOString(),
          userName: attempt.userName || data.userName || user?.name || 'User',
          accuracyChange: attempt.accuracyChange || 0,
        })),
        categoryScores: Object.fromEntries(
          Object.entries(data.categoryScores || {}).map(([key, value]) => [
            key,
            Math.min(Number((value as number || 0).toFixed(1)), 100),
          ])
        ),
        recommendations: data.recommendations || [],
        improvements: (data.improvements || []).map((imp: any) => ({
          date: imp.date || new Date().toISOString(),
          score: Math.min(Number((imp.score || 0).toFixed(1)), 100),
          category: imp.category || 'General',
          userName: imp.userName || data.userName || user?.name || 'User',
        })),
        benchmarks: {
          industry: data.benchmarks?.industry || 75,
          peers: data.benchmarks?.peers || 68,
          topPerformers: data.benchmarks?.topPerformers || 92,
        },
        joinDate: data.joinDate,
        achievements: data.achievements,
      };

      setReportData(validatedData);
    } catch (error) {
      console.error('Fetch report error:', error);
      toast.error(`Error fetching report: ${(error as Error).message}`);
      setReportData({
        userName: user?.name || 'User',
        overallScore: 0,
        previousScore: 0,
        lastAssessment: 'No assessments yet',
        totalAssessments: 0,
        attempts: [],
        categoryScores: {},
        recommendations: [],
        improvements: [],
        benchmarks: {
          industry: 75,
          peers: 68,
          topPerformers: 92,
        },
        joinDate: user?.joinDate,
        achievements: 0,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Utility to validate and parse date strings
  const parseDateString = (dateStr: string): string => {
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.toISOString();
    }
    const relativeMatch = dateStr.match(/^(\d+)\s+days\s+ago$/i);
    if (relativeMatch) {
      const days = parseInt(relativeMatch[1], 10);
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - days);
      return pastDate.toISOString();
    }
    console.warn(`Invalid date string: ${dateStr}. Falling back to current date.`);
    return new Date().toISOString();
  };

  const exportToPDF = async () => {
    if (!reportData || !user?.id || !accessToken) {
      toast.error('Unable to generate PDF: Report data or authentication missing');
      return;
    }

    const loadingToast = toast.loading('Generating PDF...');
    try {
      let response = await fetch(`${API_ENDPOINTS.USER.GENERATE_REPORT}?userId=${user.id}&t=${Date.now()}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/pdf',
          'Cache-Control': 'no-cache',
        },
      });

      if (response.status === 403) {
        console.log('Token expired, attempting to refresh...');
        const refreshed = await refreshAccessToken();
        if (!refreshed) {
          throw new Error('Failed to refresh token');
        }
        response = await fetch(`${API_ENDPOINTS.USER.GENERATE_REPORT}?userId=${user.id}&t=${Date.now()}`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
            Accept: 'application/pdf',
            'Cache-Control': 'no-cache',
          },
        });
      }

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        let errorMessage = `PDF generation failed: ${response.status}`;
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/pdf')) {
        throw new Error('Invalid response: Expected PDF content type');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Security_Assessment_Report_${reportData.userName}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Report exported successfully', { id: loadingToast });
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error(`Failed to export report: ${(error as Error).message}`, { id: loadingToast });
    }
  };

  const sendReportByEmail = async () => {
    if (!reportData || !user?.id || !accessToken) {
      toast.error('No report data or authentication available');
      return;
    }

    if (!emailForm.recipientEmail || !emailForm.recipientName) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!isValidEmail(emailForm.recipientEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsEmailSending(true);
    const progressToast = toast.loading('Sending email...');

    try {
      // First, generate the PDF
      let response = await fetch(`${API_ENDPOINTS.USER.GENERATE_REPORT}?userId=${user.id}&t=${Date.now()}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/pdf',
          'Cache-Control': 'no-cache',
        },
      });

      if (response.status === 403) {
        console.log('Token expired, attempting to refresh...');
        const refreshed = await refreshAccessToken();
        if (!refreshed) {
          throw new Error('Failed to refresh token');
        }
        response = await fetch(`${API_ENDPOINTS.USER.GENERATE_REPORT}?userId=${user.id}&t=${Date.now()}`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
            Accept: 'application/pdf',
            'Cache-Control': 'no-cache',
          },
        });
      }

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        let errorMessage = `PDF generation failed: ${response.status}`;
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const pdfBlob = await response.blob();
      const formData = new FormData();
      formData.append('recipientEmail', emailForm.recipientEmail);
      formData.append('recipientName', emailForm.recipientName);
      formData.append('testName', emailForm.testName);
      formData.append('userId', user.id);
      formData.append('pdf', pdfBlob, `Security_Assessment_Report_${reportData.userName}_${new Date().toISOString().split('T')[0]}.pdf`);

      let emailResponse = await fetch(API_ENDPOINTS.USER.SEND_REPORT, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
      });

      if (emailResponse.status === 403) {
        console.log('Token expired, attempting to refresh...');
        const refreshed = await refreshAccessToken();
        if (!refreshed) {
          throw new Error('Failed to refresh token');
        }
        emailResponse = await fetch(API_ENDPOINTS.USER.SEND_REPORT, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
          body: formData,
        });
      }

      const result = await emailResponse.json();

      if (emailResponse.ok) {
        toast.success('Report sent successfully!', { id: progressToast });
        setShowEmailDialog(false);
        setEmailForm({
          recipientEmail: user?.email || '',
          recipientName: user?.name || '',
          testName: 'Security Assessment Report',
        });
      } else {
        throw new Error(result.error || 'Failed to send email');
      }
    } catch (error) {
      console.error('Email sending error:', error);
      toast.error(`Failed to send report: ${(error as Error).message}`, { id: progressToast });
    } finally {
      setIsEmailSending(false);
    }
  };

  // Email validation utility
  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-500/20';
    if (score >= 60) return 'bg-yellow-500/20';
    return 'bg-red-500/20';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'bg-red-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <UserNavigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-white text-center">
          Loading report...
        </div>
      </div>
    );
  }

  if (!reportData || reportData.totalAssessments === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <UserNavigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-white text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-3xl font-bold mb-4">No Assessments Completed</h1>
            <p className="text-gray-300 mb-6">Complete an assessment to view your security report.</p>
            <Button
              onClick={() => router.push('/user/assessment')}
              className="bg-gradient-security hover:opacity-90 text-white border-0 px-8 py-4 text-lg"
            >
              Take Assessment
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  const analyticsData: AssessmentData = {
    _id: user?.id || '',
    userName: reportData.userName,
    overallScore: reportData.overallScore,
    answers: {},
    categoryScores: Object.fromEntries(
      Object.entries(reportData.categoryScores).map(([key, value]) => [key, { score: value, total: 100 }])
    ),
    timestamp: parseDateString(reportData.lastAssessment),
    benchmarks: reportData.benchmarks,
    totalAssessments: reportData.totalAssessments,
    lastAssessment: reportData.lastAssessment,
    joinDate: reportData.joinDate,
    achievements: reportData.achievements,
    recommendations: reportData.recommendations,
  };

  console.log('analyticsData:', analyticsData);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <UserNavigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Security Reports for {reportData.userName}</h1>
            <p className="text-gray-300">
              Detailed analysis of your security posture and improvement recommendations
            </p>
          </div>
          <div className="flex gap-4">
            <Button
              onClick={() => router.push('/user/reports/analytics')}
              className="bg-blue-600 hover:bg-blue-700 text-white border-0"
            >
              <BarChart2 className="mr-2 h-4 w-4" />
              View Analytics
            </Button>
            <Button
              onClick={exportToPDF}
              className="bg-gradient-security hover:opacity-90 text-white border-0"
              disabled={isLoading || !reportData}
            >
              <Download className="mr-2 h-4 w-4" />
              Export Report
            </Button>
            <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
              <DialogTrigger asChild>
                <Button
                  className="bg-blue-600 hover:bg-blue-700 text-white border-0"
                  disabled={isLoading || !reportData}
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Send via Email
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] bg-slate-900 border-slate-700">
                <DialogHeader>
                  <DialogTitle className="text-white">Send Report via Email</DialogTitle>
                  <DialogDescription className="text-slate-400">
                    Enter the recipient details to send the security assessment report.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="recipientName" className="text-right text-white">
                      Name
                    </Label>
                    <Input
                      id="recipientName"
                      value={emailForm.recipientName}
                      onChange={(e) => setEmailForm((prev) => ({ ...prev, recipientName: e.target.value }))}
                      className="col-span-3 bg-slate-800 border-slate-600 text-white"
                      placeholder="Recipient Name"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="recipientEmail" className="text-right text-white">
                      Email
                    </Label>
                    <Input
                      id="recipientEmail"
                      type="email"
                      value={emailForm.recipientEmail}
                      onChange={(e) => setEmailForm((prev) => ({ ...prev, recipientEmail: e.target.value }))}
                      className="col-span-3 bg-slate-800 border-slate-600 text-white"
                      placeholder="recipient@example.com"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="testName" className="text-right text-white">
                      Subject
                    </Label>
                    <Input
                      id="testName"
                      value={emailForm.testName}
                      onChange={(e) => setEmailForm((prev) => ({ ...prev, testName: e.target.value }))}
                      className="col-span-3 bg-slate-800 border-slate-600 text-white"
                      placeholder="Report Subject"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    onClick={() => setShowEmailDialog(false)}
                    variant="outline"
                    className="border-slate-600 text-slate-300 hover:bg-slate-800"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={sendReportByEmail}
                    disabled={isEmailSending || !emailForm.recipientEmail || !emailForm.recipientName || !isValidEmail(emailForm.recipientEmail)}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {isEmailSending ? 'Sending...' : 'Send Report'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Hidden refs for UI rendering (not used for PDF) */}
        <div ref={overviewRef} style={{ display: 'none' }}>
          <SecurityReport data={analyticsData} section="overview" />
        </div>
        <div ref={chartsRef} style={{ display: 'none' }}>
          <SecurityReport data={analyticsData} section="charts" />
        </div>
        <div ref={recommendationsRef} style={{ display: 'none' }}>
          <SecurityReport data={analyticsData} section="recommendations" />
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-white/10 border-white/20">
            <TabsTrigger value="overview" className="data-[state=active]:bg-white/20">
              Overview
            </TabsTrigger>
            <TabsTrigger value="detailed" className="data-[state=active]:bg-white/20">
              Detailed Analysis
            </TabsTrigger>
            <TabsTrigger value="trends" className="data-[state=active]:bg-white/20">
              History
            </TabsTrigger>
            <TabsTrigger value="recommendations" className="data-[state=active]:bg-white/20">
              Recommendations
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid lg:grid-cols-3 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="lg:col-span-1"
              >
                <Card className="bg-white/10 backdrop-blur-md border-white/20">
                  <CardHeader className="text-center">
                    <CardTitle className="text-white">Overall Security Score</CardTitle>
                    <div className={`text-5xl font-bold ${getScoreColor(reportData.overallScore)} mb-4`}>
                      {reportData.overallScore.toFixed(1)}%
                    </div>
                    <div className="flex items-center justify-center space-x-2">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <span className="text-green-500">
                        {reportData.attempts.length > 1
                          ? `${reportData.overallScore - reportData.previousScore >= 0 ? '+' : ''}${(reportData.overallScore - reportData.previousScore).toFixed(1)}% from last assessment`
                          : 'No previous assessment'}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-center">
                        <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                          Last assessment: {new Date(reportData.lastAssessment).toLocaleDateString()}
                        </Badge>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-300">
                          Total assessments completed: {reportData.totalAssessments}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="lg:col-span-2"
              >
                <Card className="bg-white/10 backdrop-blur-md border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white">Category Performance</CardTitle>
                    <CardDescription className="text-gray-300">
                      Your scores across different security areas
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {Object.entries(reportData.categoryScores || {}).length > 0 ? (
                      Object.entries(reportData.categoryScores).map(([category, score]) => (
                        <div key={category} className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-white font-medium">{category}</span>
                            <Badge className={`${getScoreBg(score)} ${getScoreColor(score)} border-0`}>
                              {score.toFixed(1)}%
                            </Badge>
                          </div>
                          <Progress value={score} className="bg-white/10" />
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-300">No category data available. Please complete an assessment.</p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-6"
            >
              <Card className="bg-white/10 backdrop-blur-md border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Industry Benchmarks</CardTitle>
                  <CardDescription className="text-gray-300">
                    See how you compare to industry standards
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-500 mb-2">
                        {reportData.benchmarks.industry.toFixed(1)}%
                      </div>
                      <div className="text-gray-300">Industry Average</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-500 mb-2">
                        {reportData.benchmarks.peers.toFixed(1)}%
                      </div>
                      <div className="text-gray-300">Similar Users</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-500 mb-2">
                        {reportData.benchmarks.topPerformers.toFixed(1)}%
                      </div>
                      <div className="text-gray-300">Top Performers</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="detailed">
            <div className="space-y-6">
              {Object.entries(reportData.categoryScores || {}).length > 0 ? (
                Object.entries(reportData.categoryScores).map(([category, score], index) => (
                  <motion.div
                    key={category}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                  >
                    <Card className="bg-white/10 backdrop-blur-md border-white/20">
                      <CardHeader>
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-white">{category}</CardTitle>
                          <Badge className={`${getScoreBg(score)} ${getScoreColor(score)} border-0`}>
                            {score.toFixed(1)}%
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <Progress value={score} className="bg-white/10 mb-4" />
                        <div className="text-gray-300">
                          <p className="mb-2">
                            <strong>Assessment:</strong>{' '}
                            {score >= 80
                              ? 'Excellent security practices in this area.'
                              : score >= 60
                              ? 'Good practices with room for improvement.'
                              : score >= 25
                              ? 'Basic practices; significant improvements needed.'
                              : 'Poor practices; urgent improvements required.'}
                          </p>
                          <p>
                            <strong>Impact:</strong> This category contributes to your overall security posture.{' '}
                            {score < 80 && 'Consider following the recommended actions to improve your score.'}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              ) : (
                <Card className="bg-white/10 backdrop-blur-md border-white/20">
                  <CardContent>
                    <p className="text-gray-300">No category data available. Please complete an assessment.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="trends">
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Security Score Trends</CardTitle>
                <CardDescription className="text-gray-300">
                  Track your security improvements over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reportData.attempts.length > 0 ? (
                    reportData.attempts.map((attempt, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Calendar className="h-5 w-5 text-blue-400" />
                          <div>
                            <div className="text-white font-medium">
                              Attempt #{attempt.attemptNumber} by {attempt.userName}
                            </div>
                            <div className="text-gray-400 text-sm">
                              {new Date(attempt.completedAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge
                            className={`${getScoreBg(attempt.overallPercentage)} ${getScoreColor(attempt.overallPercentage)} border-0`}
                          >
                            {attempt.overallPercentage.toFixed(1)}%
                          </Badge>
                          {attempt.accuracyChange !== 0 && (
                            <Badge
                              className={
                                attempt.accuracyChange >= 0 ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'
                              }
                            >
                              {attempt.accuracyChange >= 0 ? '+' : ''}{attempt.accuracyChange.toFixed(1)}%
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-300">No assessment history available. Please complete an assessment.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recommendations">
            <div className="space-y-6">
              <Card className="bg-white/10 backdrop-blur-md border-white/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Lightbulb className="mr-2 h-5 w-5 text-yellow-400" />
                    Security Improvement Recommendations
                  </CardTitle>
                  <CardDescription className="text-gray-300">
                    Actionable steps to improve your security score
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {reportData.recommendations.length > 0 ? (
                    reportData.recommendations.map((rec, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: index * 0.1 }}
                        className="p-4 bg-white/5 rounded-lg border border-white/10"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">{rec.category}</Badge>
                            <Badge className={`${getPriorityColor(rec.priority)} text-white border-0`}>
                              {rec.priority.toUpperCase()}
                            </Badge>
                          </div>
                          <Target className="h-5 w-5 text-gray-400" />
                        </div>
                        <h4 className="text-white font-semibold mb-2">{rec.issue}</h4>
                        <p className="text-gray-300 mb-3">{rec.description}</p>
                        <div className="bg-gradient-security/20 p-3 rounded-lg">
                          <p className="text-white text-sm">
                            <strong>Action:</strong> {rec.action}
                          </p>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <p className="text-gray-300">No recommendations available. Your security practices are excellent!</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}