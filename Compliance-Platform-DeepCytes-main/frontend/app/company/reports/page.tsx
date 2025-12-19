'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/components/auth-provider';
import { toast } from '@/hooks/use-toast';
import { 
  FileText, 
  Download, 
  Calendar, 
  BarChart3, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  Shield,
  Target,
  Activity,
  RefreshCw
} from 'lucide-react';
import { CompanyNavigation } from '@/components/company-navigation';
import { API_ENDPOINTS } from '@/lib/config';

interface Report {
  _id: string;
  title: string;
  type: 'security' | 'compliance' | 'assessment' | 'risk';
  generatedDate: string;
  period: string;
  status: 'ready' | 'generating' | 'error';
  size: string;
  description: string;
  metrics: {
    totalScore: number;
    improvementAreas: number;
    risksIdentified: number;
    complianceRate: number;
  };
}

interface ReportMetrics {
  totalReports: number;
  securityScore: number;
  complianceRate: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  lastGenerated: string;
}

export default function CompanyReports() {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<Report[]>([]);
  const [metrics, setMetrics] = useState<ReportMetrics | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [generatingReport, setGeneratingReport] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    loadReports();
    loadMetrics();
  }, []);

  const loadReports = async () => {
    setLoading(true);
    try {
      // Mock data for reports
      const mockReports: Report[] = [
        {
          _id: '1',
          title: 'Monthly Security Assessment Report',
          type: 'security',
          generatedDate: '2024-12-01T10:00:00Z',
          period: 'November 2024',
          status: 'ready',
          size: '2.4 MB',
          description: 'Comprehensive security posture analysis including vulnerability assessments and threat landscape.',
          metrics: {
            totalScore: 78,
            improvementAreas: 5,
            risksIdentified: 3,
            complianceRate: 85
          }
        },
        {
          _id: '2',
          title: 'Compliance Status Report',
          type: 'compliance',
          generatedDate: '2024-11-28T15:30:00Z',
          period: 'Q4 2024',
          status: 'ready',
          size: '1.8 MB',
          description: 'Regulatory compliance status across GDPR, HIPAA, and internal security policies.',
          metrics: {
            totalScore: 92,
            improvementAreas: 2,
            risksIdentified: 1,
            complianceRate: 94
          }
        },
        {
          _id: '3',
          title: 'Risk Assessment Analysis',
          type: 'risk',
          generatedDate: '2024-11-25T09:15:00Z',
          period: 'November 2024',
          status: 'ready',
          size: '3.1 MB',
          description: 'Detailed risk analysis covering operational, technical, and human factor risks.',
          metrics: {
            totalScore: 72,
            improvementAreas: 8,
            risksIdentified: 12,
            complianceRate: 76
          }
        },
        {
          _id: '4',
          title: 'Employee Assessment Summary',
          type: 'assessment',
          generatedDate: '2024-11-20T14:45:00Z',
          period: 'October 2024',
          status: 'ready',
          size: '1.2 MB',
          description: 'Summary of employee security awareness training and assessment results.',
          metrics: {
            totalScore: 88,
            improvementAreas: 3,
            risksIdentified: 2,
            complianceRate: 91
          }
        }
      ];

      setReports(mockReports);
    } catch (error) {
      console.error('Error loading reports:', error);
      toast({
        title: "Error",
        description: "Failed to load reports",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadMetrics = async () => {
    try {
      const mockMetrics: ReportMetrics = {
        totalReports: 15,
        securityScore: 82,
        complianceRate: 89,
        riskLevel: 'Medium',
        lastGenerated: '2024-12-01T10:00:00Z'
      };

      setMetrics(mockMetrics);
    } catch (error) {
      console.error('Error loading metrics:', error);
    }
  };

  const generateNewReport = async (type: Report['type']) => {
    setGeneratingReport(type);
    try {
      // Simulate report generation
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      toast({
        title: "Success",
        description: `${type.charAt(0).toUpperCase() + type.slice(1)} report generated successfully`,
      });
      
      // Reload reports after generation
      await loadReports();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate report",
        variant: "destructive"
      });
    } finally {
      setGeneratingReport(null);
    }
  };

  const downloadReport = (reportId: string, title: string) => {
    // Simulate download
    toast({
      title: "Download Started",
      description: `Downloading ${title}...`,
    });
  };

  const getReportTypeIcon = (type: Report['type']) => {
    switch (type) {
      case 'security':
        return <Shield className="h-5 w-5" />;
      case 'compliance':
        return <CheckCircle className="h-5 w-5" />;
      case 'assessment':
        return <FileText className="h-5 w-5" />;
      case 'risk':
        return <AlertTriangle className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  const getReportTypeColor = (type: Report['type']) => {
    switch (type) {
      case 'security':
        return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      case 'compliance':
        return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'assessment':
        return 'text-purple-400 bg-purple-400/10 border-purple-400/20';
      case 'risk':
        return 'text-red-400 bg-red-400/10 border-red-400/20';
      default:
        return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'Low':
        return 'text-green-400';
      case 'Medium':
        return 'text-yellow-400';
      case 'High':
        return 'text-red-400';
      default:
        return 'text-gray-400';
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
              Security Reports
            </h1>
            <p className="text-gray-300">
              Generate, view, and download comprehensive security reports
            </p>
          </div>
          <Button
            onClick={() => loadReports()}
            className="bg-white/10 hover:bg-white/20 text-white border-white/20"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white/10 border-white/20">
            <TabsTrigger value="overview" className="data-[state=active]:bg-white/20">
              Overview
            </TabsTrigger>
            <TabsTrigger value="reports" className="data-[state=active]:bg-white/20">
              All Reports
            </TabsTrigger>
            <TabsTrigger value="generate" className="data-[state=active]:bg-white/20">
              Generate New
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            {/* Metrics Overview */}
            {metrics && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card className="bg-white/10 backdrop-blur-md border-white/20">
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="p-2 bg-blue-500/20 rounded-lg">
                        <FileText className="h-6 w-6 text-blue-400" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-300">Total Reports</p>
                        <p className="text-2xl font-bold text-white">{metrics.totalReports}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/10 backdrop-blur-md border-white/20">
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="p-2 bg-green-500/20 rounded-lg">
                        <Shield className="h-6 w-6 text-green-400" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-300">Security Score</p>
                        <p className="text-2xl font-bold text-white">{metrics.securityScore}%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/10 backdrop-blur-md border-white/20">
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="p-2 bg-purple-500/20 rounded-lg">
                        <CheckCircle className="h-6 w-6 text-purple-400" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-300">Compliance Rate</p>
                        <p className="text-2xl font-bold text-white">{metrics.complianceRate}%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/10 backdrop-blur-md border-white/20">
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="p-2 bg-yellow-500/20 rounded-lg">
                        <AlertTriangle className="h-6 w-6 text-yellow-400" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-300">Risk Level</p>
                        <p className={`text-2xl font-bold ${getRiskLevelColor(metrics.riskLevel)}`}>
                          {metrics.riskLevel}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Recent Reports */}
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Recent Reports</CardTitle>
                <CardDescription className="text-gray-300">
                  Latest generated security and compliance reports
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reports.slice(0, 3).map((report) => (
                    <div key={report._id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className={`p-2 rounded-lg ${getReportTypeColor(report.type)}`}>
                          {getReportTypeIcon(report.type)}
                        </div>
                        <div>
                          <h3 className="text-white font-medium">{report.title}</h3>
                          <p className="text-sm text-gray-400">
                            Generated: {new Date(report.generatedDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => downloadReport(report._id, report.title)}
                        className="bg-white/10 hover:bg-white/20 text-white border-white/20"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports">
            {/* All Reports Grid */}
            {loading ? (
              <div className="text-center py-12">
                <div className="text-white">Loading reports...</div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {reports.map((report) => (
                  <motion.div
                    key={report._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className="bg-white/10 backdrop-blur-md border-white/20 hover:border-white/30 transition-all h-full">
                      <CardHeader>
                        <div className="flex justify-between items-start mb-2">
                          <Badge className={getReportTypeColor(report.type)}>
                            {getReportTypeIcon(report.type)}
                            <span className="ml-1 capitalize">{report.type}</span>
                          </Badge>
                          <Badge variant="outline" className="bg-green-500/10 text-green-300 border-green-500/30">
                            {report.status}
                          </Badge>
                        </div>
                        <CardTitle className="text-white">{report.title}</CardTitle>
                        <CardDescription className="text-gray-300">
                          {report.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {/* Report Details */}
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="text-gray-300">
                              <Calendar className="h-4 w-4 inline mr-2" />
                              Period: {report.period}
                            </div>
                            <div className="text-gray-300">
                              <Activity className="h-4 w-4 inline mr-2" />
                              Size: {report.size}
                            </div>
                          </div>

                          {/* Metrics */}
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="text-gray-300">
                              Score: <span className="text-white font-medium">{report.metrics.totalScore}%</span>
                            </div>
                            <div className="text-gray-300">
                              Compliance: <span className="text-white font-medium">{report.metrics.complianceRate}%</span>
                            </div>
                            <div className="text-gray-300">
                              Improvements: <span className="text-white font-medium">{report.metrics.improvementAreas}</span>
                            </div>
                            <div className="text-gray-300">
                              Risks: <span className="text-white font-medium">{report.metrics.risksIdentified}</span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex space-x-2 pt-2">
                            <Button
                              onClick={() => downloadReport(report._id, report.title)}
                              className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border-blue-500/30"
                            >
                              <Download className="mr-2 h-4 w-4" />
                              Download
                            </Button>
                            <Button
                              variant="outline"
                              className="flex-1 bg-white/5 hover:bg-white/10 text-white border-white/20"
                            >
                              <BarChart3 className="mr-2 h-4 w-4" />
                              View Details
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="generate">
            {/* Generate New Reports */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { type: 'security' as const, title: 'Security Report', description: 'Comprehensive security posture analysis' },
                { type: 'compliance' as const, title: 'Compliance Report', description: 'Regulatory compliance status' },
                { type: 'assessment' as const, title: 'Assessment Report', description: 'Employee assessment summary' },
                { type: 'risk' as const, title: 'Risk Report', description: 'Risk analysis and mitigation' }
              ].map((reportType) => (
                <Card key={reportType.type} className="bg-white/10 backdrop-blur-md border-white/20">
                  <CardHeader>
                    <div className={`p-2 rounded-lg ${getReportTypeColor(reportType.type)} w-fit`}>
                      {getReportTypeIcon(reportType.type)}
                    </div>
                    <CardTitle className="text-white">{reportType.title}</CardTitle>
                    <CardDescription className="text-gray-300">
                      {reportType.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      onClick={() => generateNewReport(reportType.type)}
                      disabled={generatingReport === reportType.type}
                      className="w-full bg-gradient-security hover:opacity-90 text-white border-0"
                    >
                      {generatingReport === reportType.type ? (
                        <>
                          <Clock className="mr-2 h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <TrendingUp className="mr-2 h-4 w-4" />
                          Generate Report
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
