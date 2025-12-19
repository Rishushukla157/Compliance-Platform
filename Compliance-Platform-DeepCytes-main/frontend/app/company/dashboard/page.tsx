'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/components/auth-provider';
import { toast } from '@/hooks/use-toast';
import { 
  Building2, 
  Users, 
  Shield, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  FileText,
  Award,
  Target,
  BarChart3,
  Calendar,
  Download,
  Settings,
  Plus,
  Search,
  Filter,
  Mail,
  Phone,
  MapPin,
  Clock,
  Star,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  User,
  Building,
  Globe,
  Briefcase,
  Code,
  DollarSign,
  Zap,
  CheckSquare,
  AlertCircle,
  TrendingDown,
  Activity
} from 'lucide-react';
import { CompanyNavigation } from '@/components/company-navigation';
import { API_ENDPOINTS } from '@/lib/config';

type CategoryScore = {
  name: string;
  averageScore: number;
  employees: number;
};

export default function CompanyDashboard() {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [expandedRecommendations, setExpandedRecommendations] = useState<number[]>([]);
  const [overallScore, setOverallScore] = useState<number | null>(null);
  const [assessedEmployees, setAssessedEmployees] = useState<number>(0);
  const [totalEmployees, setTotalEmployees] = useState<number>(0);
  const [riskLevel, setRiskLevel] = useState('Low');
  const [categoryStats, setCategoryStats] = useState<CategoryScore[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);



useEffect(() => {
  setMounted(true);
}, []);

useEffect(() => {
  const fetchAnalytics = async () => {
    if (!user?.companyCode) return;

    try {
      const url = `${API_ENDPOINTS.COMPANY.ANALYTICS}?companyCode=${user.companyCode}`;
const res = await fetch(url, {
  method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      console.log("Fetched analytics:", data);

      setOverallScore(data.overallScore || 0);
      setAssessedEmployees(data.assessedEmployees || 0);
      setTotalEmployees(data.totalEmployees || 0);
      setRiskLevel(data.riskLevel || 'Low');
      setCategoryStats(data.categories || []);
      setLeaderboard(data.leaderboard || []);
      setEmployees(data.employees || []);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      toast({
        title: "Error",
        description: "Failed to fetch company analytics",
        variant: "destructive",
      });
      // Set default values on error
      setOverallScore(0);
      setAssessedEmployees(0);
      setTotalEmployees(0);
      setRiskLevel('Low');
      setCategoryStats([]);
      setLeaderboard([]);
      setEmployees([]);
    }
  };

  if (user) {
    fetchAnalytics();
  }
}, [user]);


const transformedCategories = Array.isArray(categoryStats)
  ? categoryStats.map((cat) => ({
      name: cat.name,
      score: cat.averageScore,
      employees: cat.employees,
      trend: 'stable',
      improvement: '0%',
    }))
  : [];

// Helper function to generate random colors for departments
const getRandomColor = (str: string) => {
  const colors = [
    'bg-blue-500', 'bg-green-500', 'bg-purple-500', 
    'bg-orange-500', 'bg-pink-500', 'bg-indigo-500',
    'bg-yellow-500', 'bg-red-500', 'bg-teal-500'
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

  if (!mounted) {
    return null;
  }

  // Generate recent activity from real data
  const recentActivity = employees
    .filter(emp => emp.lastAssessment)
    .slice(0, 6)
    .map(emp => ({
      action: 'Security Assessment Completed',
      user: emp.name,
      date: emp.lastAssessment,
      score: emp.securityScore,
      type: 'assessment'
    }));

  // Generate smart recommendations based on real data
  const generateRecommendations = () => {
    const recommendations = [];
    
    if (overallScore !== null && overallScore < 60) {
      recommendations.push({
        id: 1,
        priority: 'critical',
        category: 'Overall Security',
        title: 'Urgent Security Training Required',
        description: 'Overall company security score is below acceptable threshold',
        impact: 'High',
        effort: 'Medium',
        cost: '$5,000 - $10,000',
        timeline: '2-3 weeks',
        affectedEmployees: totalEmployees,
        details: {
          currentState: 'Multiple security gaps identified',
          proposedSolution: 'Comprehensive security training program',
          benefits: ['Improved security awareness', 'Reduced risk incidents'],
          risks: ['Training time investment'],
          steps: ['Assess current knowledge', 'Design training program', 'Deploy training', 'Monitor progress']
        }
      });
    }
    
    if (assessedEmployees < totalEmployees * 0.8) {
      recommendations.push({
        id: 2,
        priority: 'high',
        category: 'Assessment Coverage',
        title: 'Increase Assessment Participation',
        description: 'More employees need to complete security assessments',
        impact: 'High',
        effort: 'Low',
        cost: '$1,000 - $2,000',
        timeline: '1-2 weeks',
        affectedEmployees: totalEmployees - assessedEmployees,
        details: {
          currentState: 'Low assessment participation',
          proposedSolution: 'Incentivize assessment completion',
          benefits: ['Better security visibility', 'Improved compliance'],
          risks: ['Minimal risks'],
          steps: ['Send reminders', 'Provide incentives', 'Track progress', 'Follow up']
        }
      });
    }
    
    // Find categories with low scores
    categoryStats.forEach(cat => {
      if (cat.averageScore < 70) {
        recommendations.push({
          id: recommendations.length + 3,
          priority: cat.averageScore < 50 ? 'critical' : 'medium',
          category: cat.name,
          title: `Improve ${cat.name} Security`,
          description: `${cat.name} category shows below-average performance`,
          impact: 'Medium',
          effort: 'Medium',
          cost: '$2,000 - $5,000',
          timeline: '3-4 weeks',
          affectedEmployees: cat.employees,
          details: {
            currentState: `${cat.name} needs improvement`,
            proposedSolution: `Targeted training for ${cat.name}`,
            benefits: ['Category-specific improvement', 'Better compliance'],
            risks: ['Time investment'],
            steps: ['Identify gaps', 'Create training', 'Deploy', 'Measure results']
          }
        });
      }
    });
    
    return recommendations.slice(0, 4); // Limit to 4 recommendations
  };

  // Generate quiz analytics from real data
  const generateQuizAnalytics = () => {
    const totalQuizzes = employees.reduce((sum, emp) => sum + (emp.securityScore > 0 ? 1 : 0), 0);
    const averageScore = employees.length > 0 ? 
      employees.reduce((sum, emp) => sum + emp.securityScore, 0) / employees.length : 0;
    
    return {
      totalQuizzes,
      completionRate: totalEmployees > 0 ? Math.round((assessedEmployees / totalEmployees) * 100) : 0,
      averageScore: Math.round(averageScore),
      passRate: employees.filter(emp => emp.securityScore >= 70).length,
      averageTime: '16m 32s', // This could be calculated from real data
      categories: categoryStats.map(cat => ({
        name: cat.name,
        avgScore: Math.round(cat.averageScore),
        completions: cat.employees,
        difficulty: cat.averageScore > 80 ? 'Easy' : cat.averageScore > 60 ? 'Medium' : 'Hard'
      })),
      commonMistakes: categoryStats
        .filter(cat => cat.averageScore < 70)
        .map(cat => ({
          question: `Common issues in ${cat.name}`,
          errorRate: Math.round(100 - cat.averageScore),
          category: cat.name
        }))
    };
  };

  const companyData = {
    companyName: user?.companyName || 'Organization',
    companyCode: user?.companyName?.toUpperCase().substring(0, 3) + '-2024' || 'ORG-2024',
    totalEmployees: totalEmployees,
    foundedYear: 2019, // This could be made dynamic later
    industry: 'Technology', // This could be made dynamic later
    securityLevel: riskLevel === 'Low' ? 'Good' : riskLevel === 'Medium' ? 'Moderate' : 'Needs Attention',
    primaryContact: user?.email || 'contact@company.com',
    securityOfficer: user?.name || 'Security Officer',
    phone: user?.phone || 'Not provided',
    location: 'Not specified', // This could be made dynamic later
    overallScore: overallScore ?? 0,
    lastAssessment: employees.length > 0 ? '3 days ago' : 'No assessments',
    assessedEmployees: assessedEmployees,
    complianceFrameworks: [
      { name: 'ISO 27001', status: (overallScore || 0) >= 85 ? 'Active' : 'Needs Review', expiry: '2025-03-15' },
      { name: 'SOC 2 Type II', status: (overallScore || 0) >= 80 ? 'Active' : 'Needs Review', expiry: '2024-12-20' },
      { name: 'GDPR', status: (overallScore || 0) >= 75 ? 'Compliant' : 'Needs Review', expiry: 'Ongoing' },
      { name: 'Security Assessment', status: assessedEmployees > 0 ? 'Active' : 'Inactive', expiry: '2025-01-10' }
    ],
    riskLevel: riskLevel,
    departments: employees.reduce((depts: any[], emp: any) => {
      const existingDept = depts.find(d => d.name === emp.department);
      if (existingDept) {
        existingDept.employees++;
      } else {
        depts.push({
          name: emp.department,
          employees: 1,
          percentage: 0, // Will be calculated after
          color: getRandomColor(emp.department)
        });
      }
      return depts;
    }, []).map(dept => ({
      ...dept,
      percentage: totalEmployees > 0 ? Math.round((dept.employees / totalEmployees) * 100) : 0
    })),
    categories: transformedCategories,
    employees: employees,
    recentActivity: recentActivity,
    recommendations: generateRecommendations(),
    leaderboard: leaderboard,
    quizAnalytics: generateQuizAnalytics()
  };

  const toggleRecommendation = (id: number) => {
    setExpandedRecommendations(prev => 
      prev.includes(id) 
        ? prev.filter(recId => recId !== id)
        : [...prev, id]
    );
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-500';
    if (score >= 70) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreBg = (score: number) => {
    if (score >= 85) return 'bg-green-500/20';
    if (score >= 70) return 'bg-yellow-500/20';
    return 'bg-red-500/20';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'needs-attention': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'at-risk': return 'bg-red-500/20 text-red-300 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <Activity className="h-4 w-4 bg-gray-500 rounded-full" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-600 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-black';
      case 'low': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

 const filteredEmployees = employees.filter((employee) => {
  const name = employee.name || '';
  const email = employee.email || '';
  const dept = employee.department || '';

  const matchesSearch =
    name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    email.toLowerCase().includes(searchTerm.toLowerCase());

  const matchesDepartment =
    selectedDepartment === 'all' || dept === selectedDepartment;

  return matchesSearch && matchesDepartment;
});



  const riskColor = {
  Low: 'text-green-500',
  Medium: 'text-yellow-400',
  High: 'text-red-500',
}[companyData.riskLevel || 'High']; // fallback to High


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <CompanyNavigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              {companyData.companyName} Dashboard
            </h1>
            <p className="text-gray-300">
              Comprehensive security compliance monitoring and management platform
            </p>
          </div>
          
        </div>

        {/* Overview Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-300">
                  Overall Security Score
                </CardTitle>
                <Shield className="h-4 w-4 text-blue-400" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getScoreColor(companyData.overallScore)}`}>
                  {companyData.overallScore}%
                </div>
                <p className="text-xs text-gray-400">
                  Last assessment: {companyData.lastAssessment}
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-300">
                  Employee Coverage
                </CardTitle>
                <Users className="h-4 w-4 text-green-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                 {companyData.totalEmployees === 0
                    ? 'No employees registered'
                  : `${companyData.assessedEmployees}/${companyData.totalEmployees} assessed`}
                </div>
                <p className="text-xs text-gray-400">
                  {companyData.assessedEmployees}/{companyData.totalEmployees} assessed
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-300">
                  Active Frameworks
                </CardTitle>
                <CheckCircle className="h-4 w-4 text-green-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {companyData.complianceFrameworks.length}
                </div>
                <p className="text-xs text-gray-400">
                  Compliance certifications
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-300">
                  Risk Level
                </CardTitle>
                <AlertTriangle className={`h-4 w-4 ${riskColor}`} />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${riskColor}`}>
                  {companyData.riskLevel}
                </div>
                <p className="text-xs text-gray-400">
                  Current assessment
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-white/10 border-white/20">
            <TabsTrigger value="overview" className="data-[state=active]:bg-white/20">
              Overview
            </TabsTrigger>
            <TabsTrigger value="employees" className="data-[state=active]:bg-white/20">
              Employees
            </TabsTrigger>
            <TabsTrigger value="leaderboard" className="data-[state=active]:bg-white/20">
              Leaderboard
            </TabsTrigger>
            <TabsTrigger value="recommendations" className="data-[state=active]:bg-white/20">
              Recommendations
            </TabsTrigger>
            <TabsTrigger value="analysis" className="data-[state=active]:bg-white/20">
              Quiz Analysis
            </TabsTrigger>
            <TabsTrigger value="profile" className="data-[state=active]:bg-white/20">
              Company Profile
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Security Categories */}
              <div className="lg:col-span-2">
                <Card className="bg-white/10 backdrop-blur-md border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white">Security Categories Performance</CardTitle>
                    <CardDescription className="text-gray-300">
                      Performance metrics across different security domains
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {Array.isArray(categoryStats) &&
                    categoryStats.map((category) => (
                      <div key={category.name} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-2">
                            <span className="text-white font-medium">{category.name}</span>
                            {/* You can remove the trend icon or compute it based on previousScore if needed */}
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge className={`${getScoreBg(category.averageScore)} ${getScoreColor(category.averageScore)} border-0`}>
                              {category.averageScore.toFixed(1)}%
                              </Badge>
                              <span className="text-gray-400 text-sm">{category.employees} employees</span>
                            </div>
                          </div>
                          <Progress value={category.averageScore} className="bg-white/10" />
                        </div>
                      ))}
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity */}
              <div>
                <Card className="bg-white/10 backdrop-blur-md border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white">Recent Activity</CardTitle>
                    <CardDescription className="text-gray-300">
                      Latest security events and assessments
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {companyData.recentActivity.map((activity, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                          activity.type === 'assessment' ? 'bg-blue-400' :
                          activity.type === 'training' ? 'bg-green-400' :
                          activity.type === 'incident' ? 'bg-red-400' :
                          'bg-gray-400'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm">{activity.action}</p>
                          <p className="text-gray-400 text-xs">{activity.user}</p>
                          <div className="flex items-center justify-between mt-1">
                            <p className="text-gray-400 text-xs">{activity.date}</p>
                            {activity.score && (
                              <Badge className={`${getScoreBg(activity.score)} ${getScoreColor(activity.score)} border-0 text-xs`}>
                                {activity.score}%
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="employees">
            <div className="space-y-6">
              {/* Search and Filter */}
              <Card className="bg-white/10 backdrop-blur-md border-white/20">
                <CardContent className="pt-6">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Search employees by name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 bg-white/10 border-white/20 text-white placeholder-gray-400"
                      />
                    </div>
                    <select
                      value={selectedDepartment}
                      onChange={(e) => setSelectedDepartment(e.target.value)}
                      className="px-4 py-2 bg-white/10 border border-white/20 rounded-md text-white"
                    >
                      <option value="all">All Departments</option>
                      {companyData.departments.map(dept => (
                        <option key={dept.name} value={dept.name}>{dept.name}</option>
                      ))}
                    </select>
                  </div>
                </CardContent>
              </Card>

              {/* Employee Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEmployees.map((employee) => (
                  <Card key={employee.id} className="bg-white/10 backdrop-blur-md border-white/20">
                    <CardHeader className="pb-3">
                      <div className="flex items-center space-x-3">
                        {employee.avatarUrl ? (
<img
    src={employee.avatarUrl}
    alt={employee.name}
    className="w-10 h-10 rounded-full object-cover border border-white/30"
  />
) : (
  <div className="w-10 h-10 bg-gradient-security rounded-full flex items-center justify-center text-white font-semibold">
    {typeof employee.name === 'string' && employee.name.trim()
      ? employee.name
          .trim()
          .split(' ')
          .map((word: string) => word[0].toUpperCase())
          .join('')
          .slice(0, 2)
      : 'NA'}
  </div>
)}
                        <div className="flex-1">
                          <CardTitle className="text-white text-sm">{employee.name}</CardTitle>
                          <p className="text-gray-400 text-xs">{employee.role}</p>
                        </div>
                        <Badge className={getStatusColor(employee.status)}>
                          {employee.status.replace('-', ' ')}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-gray-400 text-xs">Security Score</p>
                          <p className={`font-semibold ${getScoreColor(employee.securityScore)}`}>
                            {employee.securityScore}%
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-xs">Quiz Score</p>
                          <p className={`font-semibold ${getScoreColor(employee.quizScore)}`}>
                            {employee.quizScore}%
                          </p>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-gray-400 text-xs mb-1">Department</p>
                        <Badge variant="outline" className="border-white/20 text-white">
                          {employee.department}
                        </Badge>
                      </div>

                      <div>
                        <p className="text-gray-400 text-xs mb-1">Weak Areas</p>
                        <div className="flex flex-wrap gap-1">
                          {(employee.weakAreas || []).map((area: string, idx: number) => (
  <Badge key={idx} className="bg-red-500/20 text-red-300 border-red-500/30 text-xs">
    {area}
  </Badge>
))}
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-2">
                        <p className="text-gray-400 text-xs">Last: {employee.lastAssessment}</p>
                        
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="leaderboard">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Top Performers */}
              <div className="lg:col-span-2">
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader>
          <CardTitle className="text-white">Security Champions</CardTitle>
          <CardDescription className="text-gray-300">
            Top performing employees in security assessments
          </CardDescription>
        </CardHeader>
        <CardContent>
          {companyData.leaderboard.length === 0 ? (
  <p className="text-gray-400 text-sm">No assessed employees yet.</p>
) : (
  <div className="space-y-4">
    {companyData.leaderboard.map((employee, index) => (

                <div key={index} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      employee.rank === 1 ? 'bg-yellow-500' :
                      employee.rank === 2 ? 'bg-gray-400' :
                      employee.rank === 3 ? 'bg-orange-500' :
                      'bg-blue-500'
                    } text-white`}>
                      {employee.rank}
                    </div>
                    <div>
                      <div className="text-white font-medium">{employee.name || 'N/A'}</div>
                      <div className="text-gray-400 text-sm">{employee.department || 'N/A'}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex space-x-2 mb-1">
                      <Badge className={`${getScoreBg(employee.securityScore)} ${getScoreColor(employee.securityScore)} border-0`}>
                        {employee.securityScore ?? 'N/A'}%
                      </Badge>
                      <Badge className={`${getScoreBg(employee.quizScore)} ${getScoreColor(employee.quizScore)} border-0`}>
                        Quiz: {employee.quizScore ?? 'N/A'}%
                      </Badge>
                    </div>
                    <div className="text-gray-400 text-xs">
                      {employee.perfectScores ?? 0} perfect scores • {employee.avgTime || 'N/A'} avg
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>

              {/* Department Rankings */}
              <div>
                <Card className="bg-white/10 backdrop-blur-md border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white">Department Rankings</CardTitle>
                    <CardDescription className="text-gray-300">
                      Average performance by department
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {companyData.departments.map((dept, index) => (
                      <div key={dept.name} className="p-3 bg-white/5 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-white font-medium">{dept.name}</span>
                          <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                            {dept.employees} employees
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-gray-400">Security: </span>
                            <span className="text-green-400">85%</span>
                          </div>
                          <div>
                            <span className="text-gray-400">Quiz Score: </span>
                            <span className="text-blue-400">82%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="recommendations">
            <div className="space-y-6">
              <Card className="bg-white/10 backdrop-blur-md border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Security Recommendations</CardTitle>
                  <CardDescription className="text-gray-300">
                    Prioritized action items to enhance your security posture
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {companyData.recommendations.map((rec) => (
                    <div key={rec.id} className="border border-white/10 rounded-lg bg-white/5">
                      <div 
                        className="p-4 cursor-pointer"
                        onClick={() => toggleRecommendation(rec.id)}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <Badge className={`${getPriorityColor(rec.priority)} border-0`}>
                              {rec.priority.toUpperCase()}
                            </Badge>
                            <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                              {rec.category}
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="border-white/20 text-white">
                              {rec.impact} Impact
                            </Badge>
                            {expandedRecommendations.includes(rec.id) ? 
                              <ChevronUp className="h-4 w-4 text-gray-400" /> : 
                              <ChevronDown className="h-4 w-4 text-gray-400" />
                            }
                          </div>
                        </div>
                        <h4 className="text-white font-semibold mb-2">{rec.title}</h4>
                        <p className="text-gray-300 text-sm mb-3">{rec.description}</p>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-400">Cost: </span>
                            <span className="text-white">{rec.cost}</span>
                          </div>
                          <div>
                            <span className="text-gray-400">Timeline: </span>
                            <span className="text-white">{rec.timeline}</span>
                          </div>
                          <div>
                            <span className="text-gray-400">Effort: </span>
                            <span className="text-white">{rec.effort}</span>
                          </div>
                          <div>
                            <span className="text-gray-400">Affected: </span>
                            <span className="text-white">{rec.affectedEmployees} employees</span>
                          </div>
                        </div>
                      </div>

                      {expandedRecommendations.includes(rec.id) && (
                        <div className="border-t border-white/10 p-4 bg-white/5">
                          <div className="grid md:grid-cols-2 gap-6">
                            <div>
                              <h5 className="text-white font-semibold mb-2">Current State</h5>
                              <p className="text-gray-300 text-sm mb-4">{rec.details.currentState}</p>
                              
                              <h5 className="text-white font-semibold mb-2">Proposed Solution</h5>
                              <p className="text-gray-300 text-sm mb-4">{rec.details.proposedSolution}</p>
                              
                              <h5 className="text-white font-semibold mb-2">Benefits</h5>
                              <ul className="text-gray-300 text-sm space-y-1">
                                {rec.details.benefits.map((benefit, idx) => (
                                  <li key={idx} className="flex items-center space-x-2">
                                    <CheckSquare className="h-3 w-3 text-green-400" />
                                    <span>{benefit}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                            
                            <div>
                              <h5 className="text-white font-semibold mb-2">Implementation Steps</h5>
                              <ol className="text-gray-300 text-sm space-y-2">
                                {rec.details.steps.map((step, idx) => (
                                  <li key={idx} className="flex items-start space-x-2">
                                    <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                                      {idx + 1}
                                    </span>
                                    <span>{step}</span>
                                  </li>
                                ))}
                              </ol>
                              
                              <div className="mt-4 pt-4 border-t border-white/10">
                                <div className="flex space-x-2">
                                  <Button size="sm" className="bg-gradient-security hover:opacity-90 text-white border-0">
                                    <Calendar className="mr-2 h-3 w-3" />
                                    Schedule
                                  </Button>
                                  <Button size="sm" variant="outline" className="border-white/30 text-white hover:bg-white/10">
                                    <ExternalLink className="mr-2 h-3 w-3" />
                                    Learn More
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="analysis">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Quiz Performance Overview */}
              <Card className="bg-white/10 backdrop-blur-md border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Quiz Performance Overview</CardTitle>
                  <CardDescription className="text-gray-300">
                    Comprehensive analysis of security quiz results
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-white/5 rounded-lg">
                      <div className="text-2xl font-bold text-white">{companyData.quizAnalytics.totalQuizzes}</div>
                      <div className="text-gray-400 text-sm">Total Quizzes</div>
                    </div>
                    <div className="text-center p-4 bg-white/5 rounded-lg">
                      <div className="text-2xl font-bold text-green-400">{companyData.quizAnalytics.completionRate}%</div>
                      <div className="text-gray-400 text-sm">Completion Rate</div>
                    </div>
                    <div className="text-center p-4 bg-white/5 rounded-lg">
                      <div className="text-2xl font-bold text-blue-400">{companyData.quizAnalytics.averageScore}%</div>
                      <div className="text-gray-400 text-sm">Average Score</div>
                    </div>
                    <div className="text-center p-4 bg-white/5 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-400">{companyData.quizAnalytics.passRate}%</div>
                      <div className="text-gray-400 text-sm">Pass Rate</div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-white/5 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-white font-medium">Average Completion Time</span>
                      <span className="text-blue-400 font-semibold">{companyData.quizAnalytics.averageTime}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Category Performance */}
              <Card className="bg-white/10 backdrop-blur-md border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Category Performance</CardTitle>
                  <CardDescription className="text-gray-300">
                    Performance breakdown by quiz category
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {companyData.quizAnalytics.categories.map((category, index) => (
                    <div key={category.name} className="p-3 bg-white/5 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-white font-medium">{category.name}</span>
                        <div className="flex items-center space-x-2">
                          <Badge className={`${getScoreBg(category.avgScore)} ${getScoreColor(category.avgScore)} border-0`}>
                            {category.avgScore}%
                          </Badge>
                          <Badge className={
                            category.difficulty === 'Easy' ? 'bg-green-500/20 text-green-300 border-green-500/30' :
                            category.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' :
                            'bg-red-500/20 text-red-300 border-red-500/30'
                          }>
                            {category.difficulty}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex justify-between text-sm text-gray-400">
                        <span>{category.completions} completions</span>
                        <span>{Math.round((category.completions / companyData.totalEmployees) * 100)}% participation</span>
                      </div>
                      <Progress value={category.avgScore} className="bg-white/10 mt-2" />
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Common Mistakes */}
              <Card className="bg-white/10 backdrop-blur-md border-white/20 lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-white">Common Mistakes & Learning Opportunities</CardTitle>
                  <CardDescription className="text-gray-300">
                    Areas where employees frequently struggle
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    {companyData.quizAnalytics.commonMistakes.map((mistake, index) => (
                      <div key={index} className="p-4 bg-white/5 rounded-lg border border-white/10">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="text-white font-medium text-sm">{mistake.question}</h4>
                          <Badge className="bg-red-500/20 text-red-300 border-red-500/30">
                            {mistake.errorRate}% error
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                            {mistake.category}
                          </Badge>
                          <Button size="sm" variant="outline" className="border-white/30 text-white hover:bg-white/10">
                            <Target className="mr-2 h-3 w-3" />
                            Create Training
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="profile">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Company Information */}
              <Card className="bg-white/10 backdrop-blur-md border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Organisation Information</CardTitle>
                  <CardDescription className="text-gray-300">
                    Basic company details and contact information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-white/5 rounded-lg">
                      <div className="flex items-center space-x-2 mb-1">
                        <Building className="h-4 w-4 text-blue-400" />
                        <span className="text-gray-400 text-sm">Company Name</span>
                      </div>
                      <span className="text-white font-medium">{companyData.companyName}</span>
                    </div>
                    <div className="p-3 bg-white/5 rounded-lg">
                      <div className="flex items-center space-x-2 mb-1">
                        <Code className="h-4 w-4 text-green-400" />
                        <span className="text-gray-400 text-sm">Company Code</span>
                      </div>
                      <span className="text-white font-medium">{companyData.companyCode}</span>
                    </div>
                    <div className="p-3 bg-white/5 rounded-lg">
                      <div className="flex items-center space-x-2 mb-1">
                        <Users className="h-4 w-4 text-purple-400" />
                        <span className="text-gray-400 text-sm">Total Employees</span>
                      </div>
                      <span className="text-white font-medium">{companyData.totalEmployees}</span>
                    </div>
                    <div className="p-3 bg-white/5 rounded-lg">
                      <div className="flex items-center space-x-2 mb-1">
                        <Calendar className="h-4 w-4 text-orange-400" />
                        <span className="text-gray-400 text-sm">Founded</span>
                      </div>
                      <span className="text-white font-medium">{companyData.foundedYear}</span>
                    </div>
                    <div className="p-3 bg-white/5 rounded-lg">
                      <div className="flex items-center space-x-2 mb-1">
                        <Briefcase className="h-4 w-4 text-yellow-400" />
                        <span className="text-gray-400 text-sm">Industry</span>
                      </div>
                      <span className="text-white font-medium">{companyData.industry}</span>
                    </div>
                    <div className="p-3 bg-white/5 rounded-lg">
                      <div className="flex items-center space-x-2 mb-1">
                        <Shield className="h-4 w-4 text-red-400" />
                        <span className="text-gray-400 text-sm">Security Level</span>
                      </div>
                      <span className="text-white font-medium">{companyData.securityLevel}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-3 pt-4 border-t border-white/10">
                    <div className="flex items-center space-x-3">
                      <Mail className="h-4 w-4 text-blue-400" />
                      <span className="text-gray-400 text-sm">Primary Contact:</span>
                      <span className="text-white">{companyData.primaryContact}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <User className="h-4 w-4 text-green-400" />
                      <span className="text-gray-400 text-sm">Security Officer:</span>
                      <span className="text-white">{companyData.securityOfficer}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Phone className="h-4 w-4 text-purple-400" />
                      <span className="text-gray-400 text-sm">Phone:</span>
                      <span className="text-white">{companyData.phone}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <MapPin className="h-4 w-4 text-orange-400" />
                      <span className="text-gray-400 text-sm">Location:</span>
                      <span className="text-white">{companyData.location}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Department Breakdown */}
              <Card className="bg-white/10 backdrop-blur-md border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Department Distribution</CardTitle>
                  <CardDescription className="text-gray-300">
                    Employee distribution across departments
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {companyData.departments.map((dept, index) => (
                    <div key={dept.name} className="p-3 bg-white/5 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-white font-medium">{dept.name}</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-white font-semibold">{dept.employees}</span>
                          <span className="text-gray-400 text-sm">({dept.percentage}%)</span>
                        </div>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${dept.color}`}
                          style={{ width: `${dept.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Compliance Certifications */}
              <Card className="bg-white/10 backdrop-blur-md border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Compliance Certifications</CardTitle>
                  <CardDescription className="text-gray-300">
                    Active compliance frameworks and certifications
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {companyData.complianceFrameworks.map((framework, index) => (
                    <div key={framework.name} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="h-5 w-5 text-green-400" />
                        <div>
                          <span className="text-white font-medium">{framework.name}</span>
                          <p className="text-gray-400 text-xs">Expires: {framework.expiry}</p>
                        </div>
                      </div>
                      <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                        {framework.status}
                      </Badge>
                    </div>
                  ))}
                  
                  <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/10">
                    <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 justify-center py-2">
                      PCI DSS
                    </Badge>
                    <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 justify-center py-2">
                      FedRAMP
                    </Badge>
                    <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30 justify-center py-2">
                      NIST
                    </Badge>
                    <Badge className="bg-pink-500/20 text-pink-300 border-pink-500/30 justify-center py-2">
                      CIS Controls
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card className="bg-white/10 backdrop-blur-md border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Company Statistics</CardTitle>
                  <CardDescription className="text-gray-300">
                    Key performance metrics and statistics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-white/5 rounded-lg">
                      <div className="text-2xl font-bold text-blue-400">5</div>
                      <div className="text-gray-400 text-sm">Years Active</div>
                    </div>
                    <div className="text-center p-4 bg-white/5 rounded-lg">
                      <div className="text-2xl font-bold text-green-400">99.9%</div>
                      <div className="text-gray-400 text-sm">Uptime</div>
                    </div>
                    <div className="text-center p-4 bg-white/5 rounded-lg">
                      <div className="text-2xl font-bold text-purple-400">24/7</div>
                      <div className="text-gray-400 text-sm">Support</div>
                    </div>
                    <div className="text-center p-4 bg-white/5 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-400">A+</div>
                      <div className="text-gray-400 text-sm">Security Rating</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}