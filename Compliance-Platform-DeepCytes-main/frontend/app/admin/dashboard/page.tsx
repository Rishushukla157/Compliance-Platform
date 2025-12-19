'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import { API_ENDPOINTS } from '@/lib/config';
import { 
  Crown, 
  Users, 
  Building2, 
  FileText, 
  BarChart3,
  TrendingUp,
  Shield,
  Settings,
  Plus,
  Edit,
  Trash2,
  Eye,
  AlertTriangle
} from 'lucide-react';
import { AdminNavigation } from '@/components/admin-navigation';
import { useAuth } from '@/components/auth-provider';
import { toast } from 'sonner';

// Define interfaces for API responses
interface User {
  _id: string;
  email: string;
  userType: 'user' | 'company' | 'admin';
  profile: {
    name: string;
    phone?: string;
    department?: string;
    isActive: boolean;
  };
  lastLogin?: string;
  createdAt: string;
}

interface Question {
  _id: string;
  question: string;
  options: Array<{
    label: string;
    text: string;
    weight: number;
  }>;
  complianceName: string;
  weight: number;
  userType?: string;
  isActive?: boolean;
  responses: number;
  createdAt: string;
  updatedAt: string;
  __v?: number;
}

interface CategoryStats {
  category: string;
  count: number;
  avgWeight: number;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  
  // State for dashboard data
  const [users, setUsers] = useState<User[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([]);
  const [recentActivities, setRecentActivities] = useState<{action: string, entity: string, date: string}[]>([]);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [loading, setLoading] = useState({
    users: true,
    questions: true,
    activities: true
  });
  const [error, setError] = useState({
    users: false,
    questions: false,
    activities: false
  });

  // System health defaults (these would ideally come from a real API endpoint in the future)
  const systemHealth = {
    uptime: '99.9%',
    responseTime: '120ms',
    errorRate: '0.01%'
  };

  // Function to make authenticated requests with token refresh
  const authenticatedFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
    const updatedOptions = { 
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        ...(options.headers || {})
      }
    };

    // Make initial request
    let response = await fetch(url, updatedOptions);

    // If we get a 403 error, try to refresh the token and retry
    if (response.status === 403) {
      console.log('Token expired, attempting to refresh...');
      
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token found');
        }

        const refreshResponse = await fetch(API_ENDPOINTS.AUTH.REFRESH, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        });

        if (refreshResponse.ok) {
          const data = await refreshResponse.json();
          localStorage.setItem('accessToken', data.accessToken);
          localStorage.setItem('refreshToken', data.refreshToken);
          
          // Create new options with the fresh token
          const retryOptions = { 
            ...options,
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
              ...(options.headers || {})
            }
          };
          
          // Retry the request with the new token
          response = await fetch(url, retryOptions);
        } else {
          throw new Error('Failed to refresh token');
        }
      } catch (refreshError) {
        console.error('Error refreshing token:', refreshError);
      }
    }

    return response;
  };

  // Fetch users data
  const fetchUsers = async () => {
    setLoading(prev => ({ ...prev, users: true }));
    setError(prev => ({ ...prev, users: false }));
    
    try {
      const response = await authenticatedFetch(API_ENDPOINTS.ADMIN.USERS);
      
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      
      const data = await response.json();
      setUsers(data.users || []);
      setLastRefreshed(new Date());
    } catch (error) {
      console.error('Error fetching users:', error);
      setError(prev => ({ ...prev, users: true }));
      toast.error('Failed to load users data');
    } finally {
      setLoading(prev => ({ ...prev, users: false }));
    }
  };

  // Helper function to format date for display
  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return `${diffInSeconds} seconds ago`;
    } else if (diffInSeconds < 3600) {
      return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    } else if (diffInSeconds < 86400) {
      return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    } else {
      return `${Math.floor(diffInSeconds / 86400)} days ago`;
    }
  };

  // Fetch questions data
  const fetchQuestions = async () => {
    setLoading(prev => ({ ...prev, questions: true, activities: true }));
    setError(prev => ({ ...prev, questions: false, activities: false }));
    
    try {
      const response = await authenticatedFetch(API_ENDPOINTS.ADMIN.QUESTIONS);
      
      if (!response.ok) {
        throw new Error('Failed to fetch questions');
      }
      
      const questionsData = await response.json();
      setQuestions(questionsData || []);
      setLastRefreshed(new Date());
      
      // Calculate category statistics
      const categoriesMap = new Map<string, { count: number, totalWeight: number }>();
      
      questionsData.forEach((q: Question) => {
        if (!categoriesMap.has(q.complianceName)) {
          categoriesMap.set(q.complianceName, { count: 0, totalWeight: 0 });
        }
        
        const category = categoriesMap.get(q.complianceName)!;
        category.count += 1;
        category.totalWeight += (q.weight || 1); // Use correct weight property
      });
      
      const categoryStats: CategoryStats[] = Array.from(categoriesMap.entries()).map(([category, stats]) => ({
        category,
        count: stats.count,
        avgWeight: parseFloat((stats.totalWeight / stats.count).toFixed(1))
      }));
      
      setCategoryStats(categoryStats);
      
      // Process recent activities based on createdAt and updatedAt
      const activities: {action: string, entity: string, date: string}[] = [];
      
      // Sort questions by updatedAt and createdAt dates (newest first)
      const sortedQuestions = [...questionsData].sort((a, b) => {
        const dateA = new Date(a.updatedAt || a.createdAt);
        const dateB = new Date(b.updatedAt || b.createdAt);
        return dateB.getTime() - dateA.getTime();
      });
      
      // Take the most recent 10 activities
      sortedQuestions.slice(0, 10).forEach((q: Question) => {
        const createdDate = new Date(q.createdAt);
        const updatedDate = new Date(q.updatedAt);
        
        // Only include updates if they're different from creation time
        if (updatedDate.getTime() !== createdDate.getTime()) {
          activities.push({
            action: "Question updated",
            entity: `${q.complianceName}: ${q.question.substring(0, 30)}${q.question.length > 30 ? '...' : ''}`,
            date: formatTimeAgo(q.updatedAt)
          });
        }
        
        activities.push({
          action: "Question created",
          entity: `${q.complianceName}: ${q.question.substring(0, 30)}${q.question.length > 30 ? '...' : ''}`,
          date: formatTimeAgo(q.createdAt)
        });
      });
      
      setRecentActivities(activities.slice(0, 5)); // Limit to 5 most recent activities
      
    } catch (error) {
      console.error('Error fetching questions:', error);
      setError(prev => ({ ...prev, questions: true, activities: true }));
      toast.error('Failed to load questions data');
    } finally {
      setLoading(prev => ({ ...prev, questions: false, activities: false }));
    }
  };

  // Calculate platform statistics from available data
  const calculatePlatformStats = () => {
    // Calculate the number of questions modified in the last 24 hours
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const recentlyModifiedQuestions = questions.filter(q => {
      const updatedAt = new Date(q.updatedAt);
      return updatedAt > last24Hours;
    });

    // Calculate the number of questions created in the last 7 days
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const recentlyCreatedQuestions = questions.filter(q => {
      const createdAt = new Date(q.createdAt);
      return createdAt > last7Days;
    });
    
    // Calculate the average responses per question
    const totalResponses = questions.reduce((sum, q) => sum + (q.responses || 0), 0);
    const avgResponses = questions.length > 0 ? (totalResponses / questions.length).toFixed(1) : 0;
    
    // Calculate the percentage of active questions
    const activeQuestions = questions.filter(q => q.isActive !== false).length;
    const inactiveQuestions = questions.filter(q => q.isActive === false).length;
    const activePercentage = questions.length > 0 ? Math.round((activeQuestions / questions.length) * 100) : 0;
    
    return {
      recentModifications: recentlyModifiedQuestions.length,
      recentCreations: recentlyCreatedQuestions.length,
      avgResponses,
      activePercentage,
      activeQuestions,
      inactiveQuestions,
      totalUsers: users.length,
      totalQuestions: questions.length,
      totalResponses
    };
  };

  // Calculate question response statistics
  const calculateQuestionResponseStats = () => {
    // Skip if no questions
    if (!questions || questions.length === 0) {
      return {
        totalResponses: 0,
        avgResponsesPerQuestion: 0,
        mostPopularCategory: '',
        responsesByCategory: [],
        questionsWithoutResponses: 0,
        highestResponseCount: 0
      };
    }
    
    const totalResponses = questions.reduce((sum, q) => sum + (q.responses || 0), 0);
    const avgResponsesPerQuestion = parseFloat((totalResponses / questions.length).toFixed(1));
    
    // Count responses by category
    const responsesByCategory = new Map<string, number>();
    
    questions.forEach(q => {
      if (!responsesByCategory.has(q.complianceName)) {
        responsesByCategory.set(q.complianceName, 0);
      }
      
      responsesByCategory.set(
        q.complianceName, 
        responsesByCategory.get(q.complianceName)! + (q.responses || 0)
      );
    });
    
    // Find the category with most responses
    let mostPopularCategory = '';
    let highestResponses = 0;
    
    responsesByCategory.forEach((responses, category) => {
      if (responses > highestResponses) {
        highestResponses = responses;
        mostPopularCategory = category;
      }
    });
    
    // Calculate questions without responses
    const questionsWithoutResponses = questions.filter(q => !q.responses || q.responses === 0).length;
    
    // Find the highest response count for a single question
    const highestResponseCount = Math.max(...questions.map(q => q.responses || 0));
    
    return {
      totalResponses,
      avgResponsesPerQuestion,
      mostPopularCategory,
      responsesByCategory: Array.from(responsesByCategory.entries())
        .map(([category, responses]) => ({ category, responses }))
        .sort((a, b) => b.responses - a.responses),
      questionsWithoutResponses,
      highestResponseCount
    };
  };

  useEffect(() => {
    setMounted(true);
    
    // Fetch data when component mounts
    if (user) {
      fetchUsers();
      fetchQuestions();
    }
  }, [user]);

  if (!mounted) {
    return null;
  }
  
  // Calculate counts for dashboard
  const userCounts = {
    total: users.length,
    individual: users.filter((u: User) => u.userType === 'user').length,
    company: users.filter((u: User) => u.userType === 'company').length,
    admin: users.filter((u: User) => u.userType === 'admin').length
  };
  
  const questionCounts = {
    total: questions.length,
    active: questions.filter(q => q.isActive !== false).length, // Calculate actual active questions
    inactive: questions.filter(q => q.isActive === false).length, // Calculate inactive questions
    categories: new Set(questions.map(q => q.complianceName)).size
  };
  
  // Create a dataset for the dashboard
  const dashboardData = {
    totalUsers: userCounts.total,
    naiveUsers: userCounts.individual,
    companyUsers: userCounts.company,
    totalAssessments: questions.reduce((sum, q) => sum + (q.responses || 0), 0),
    totalQuestions: questionCounts.total,
    activeQuestions: questionCounts.active,
    inactiveQuestions: questionCounts.inactive,
    averageScore: 76, // This might need to come from another API
    questionCategories: categoryStats,
    systemStats: {
      uptime: '99.9%',
      responseTime: '120ms',
      errorRate: '0.01%',
      activeConnections: userCounts.total
    },
    platformStats: calculatePlatformStats(),
    responseStats: calculateQuestionResponseStats()
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <AdminNavigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Admin Dashboard
            </h1>
            <p className="text-gray-300">
              Manage the SecureCheck platform and monitor system performance
              {lastRefreshed && (
                <span className="ml-2 text-xs text-gray-400">
                  Last updated: {lastRefreshed.toLocaleTimeString()}
                </span>
              )}
            </p>
          </div>
          <div className="flex space-x-3">
            <Button
              onClick={() => {
                fetchUsers();
                fetchQuestions();
                toast.success('Refreshing dashboard data...');
              }}
              className="bg-gradient-security hover:opacity-90 text-white border-0"
              disabled={loading.users || loading.questions}
            >
              <svg className={`mr-2 h-4 w-4 ${(loading.users || loading.questions) ? 'animate-spin' : ''}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Refresh Data
            </Button>
            <Link href="/admin/add-question">
              <Button 
                className="bg-gradient-security hover:opacity-90 text-white border-0"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Question
              </Button>
            </Link>
            <Link href="/admin/settings">
              <Button className="bg-gradient-security hover:opacity-90 text-white border-0">
                <Settings className="mr-2 h-4 w-4" />
                System Settings
              </Button>
            </Link>
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
                  Total Users
                </CardTitle>
                <Users className="h-4 w-4 text-blue-400" />
              </CardHeader>
              <CardContent>
                {loading.users ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-400"></div>
                    <span className="text-gray-400 text-sm">Loading...</span>
                  </div>
                ) : error.users ? (
                  <div className="text-red-400 text-sm flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-1" /> Error loading data
                  </div>
                ) : (
                  <>
                    <div className="text-2xl font-bold text-white">
                      {dashboardData.totalUsers.toLocaleString()}
                    </div>
                    <p className="text-xs text-gray-400">
                      {dashboardData.naiveUsers} individual, {dashboardData.companyUsers} company
                    </p>
                  </>
                )}
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
                  Assessments
                </CardTitle>
                <FileText className="h-4 w-4 text-green-400" />
              </CardHeader>
              <CardContent>
                {loading.questions ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-green-400"></div>
                    <span className="text-gray-400 text-sm">Loading...</span>
                  </div>
                ) : error.questions ? (
                  <div className="text-red-400 text-sm flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-1" /> Error loading data
                  </div>
                ) : (
                  <>
                    <div className="text-2xl font-bold text-white">
                      {dashboardData.totalAssessments.toLocaleString()}
                    </div>
                    <p className="text-xs text-gray-400">
                      Total completed
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Link href="/admin/manage-questions">
              <Card className="bg-white/10 backdrop-blur-md border-white/20 cursor-pointer hover:bg-white/15 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-300">
                    Questions
                  </CardTitle>
                  <Shield className="h-4 w-4 text-purple-400" />
                </CardHeader>
                <CardContent>
                  {loading.questions ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-400"></div>
                      <span className="text-gray-400 text-sm">Loading...</span>
                    </div>
                  ) : error.questions ? (
                    <div className="text-red-400 text-sm flex items-center">
                      <AlertTriangle className="h-4 w-4 mr-1" /> Error loading data
                    </div>
                  ) : (
                    <>
                      <div className="flex items-baseline space-x-1 mb-2">
                        <div className="text-2xl font-bold text-green-400">
                          {dashboardData.activeQuestions}
                        </div>
                        <div className="text-sm text-gray-400">/</div>
                        <div className="text-lg font-semibold text-white">
                          {dashboardData.totalQuestions}
                        </div>
                        <div className="ml-2 flex items-center">
                          <div className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1"></div>
                          <span className="text-xs text-green-400 font-medium">
                            {dashboardData.totalQuestions > 0 
                              ? Math.round((dashboardData.activeQuestions / dashboardData.totalQuestions) * 100)
                              : 0}%
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-400">
                          Active / Total Questions
                        </p>
                        {dashboardData.inactiveQuestions > 0 && (
                          <div className="flex items-center space-x-1">
                            <div className="w-1.5 h-1.5 bg-red-400 rounded-full"></div>
                            <span className="text-xs text-red-400">
                              {dashboardData.inactiveQuestions} inactive
                            </span>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-300">
                  Categories
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-yellow-400" />
              </CardHeader>
              <CardContent>
                {loading.questions ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-yellow-400"></div>
                    <span className="text-gray-400 text-sm">Loading...</span>
                  </div>
                ) : error.questions ? (
                  <div className="text-red-400 text-sm flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-1" /> Error loading data
                  </div>
                ) : (
                  <>
                    <div className="text-2xl font-bold text-white">
                      {questionCounts.categories}
                    </div>
                    <p className="text-xs text-gray-400">
                      Question categories
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-white/10 border-white/20">
            <TabsTrigger value="overview" className="data-[state=active]:bg-white/20">
              Overview
            </TabsTrigger>
            <TabsTrigger value="questions" className="data-[state=active]:bg-white/20">
              Questions
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-white/20">
              Users
            </TabsTrigger>
            {/* <TabsTrigger value="analytics" className="data-[state=active]:bg-white/20">
              Analytics
            </TabsTrigger> */}
          </TabsList>

          <TabsContent value="overview">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Recent Activity */}
              <div className="lg:col-span-2">
                <Card className="bg-white/10 backdrop-blur-md border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white">Recent Activity</CardTitle>
                    <CardDescription className="text-gray-300">
                      Latest platform activities and changes
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {loading.activities ? (
                      <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-400"></div>
                      </div>
                    ) : error.activities ? (
                      <div className="text-center py-8">
                        <AlertTriangle className="h-8 w-8 text-red-400 mx-auto mb-2" />
                        <p className="text-gray-300">Error loading activities</p>
                      </div>
                    ) : recentActivities.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-gray-300">No recent activities found</p>
                      </div>
                    ) : (
                      recentActivities.map((activity, index) => (
                        <div key={index} className="flex items-start space-x-3 p-3 bg-white/5 rounded-lg">
                          <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-white text-sm">{activity.action}</p>
                            <p className="text-gray-400 text-xs">{activity.entity}</p>
                            <p className="text-gray-500 text-xs">{activity.date}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* System Stats */}
              <div>
                <Card className="bg-white/10 backdrop-blur-md border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white">Platform Statistics</CardTitle>
                    <CardDescription className="text-gray-300">
                      Real-time system performance metrics
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {loading.questions || loading.users ? (
                      <div className="flex justify-center py-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-400"></div>
                      </div>
                    ) : error.questions || error.users ? (
                      <div className="text-center py-4">
                        <AlertTriangle className="h-8 w-8 text-red-400 mx-auto mb-2" />
                        <p className="text-gray-300">Error loading statistics</p>
                      </div>
                    ) : (
                      (() => {
                        const stats = calculatePlatformStats();
                        return (
                          <>
                            <div className="flex justify-between">
                              <span className="text-gray-300">Platform Health</span>
                              <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                                Active
                              </Badge>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-300">Recent Activity</span>
                              <span className="text-white">
                                {stats.recentModifications} changes in 24h
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-300">New Questions</span>
                              <span className="text-white">
                                {stats.recentCreations} in 7 days
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-300">Avg Responses</span>
                              <span className="text-white">
                                {stats.avgResponses} per question
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-300">Question Status</span>
                              <Badge className={`${
                                stats.activePercentage > 80 ? "bg-green-500/20 text-green-300 border-green-500/30" : 
                                stats.activePercentage > 50 ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/30" : 
                                "bg-red-500/20 text-red-300 border-red-500/30"
                              }`}>
                                {stats.activePercentage}% Active
                              </Badge>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-300">Active Questions</span>
                              <span className="text-green-400 font-medium">
                                {stats.activeQuestions}
                              </span>
                            </div>
                            {stats.inactiveQuestions > 0 && (
                              <div className="flex justify-between">
                                <span className="text-gray-300">Inactive Questions</span>
                                <span className="text-red-400 font-medium">
                                  {stats.inactiveQuestions}
                                </span>
                              </div>
                            )}
                            <div className="flex justify-between">
                              <span className="text-gray-300">Last Updated</span>
                              <span className="text-blue-300 text-xs">
                                {lastRefreshed ? lastRefreshed.toLocaleTimeString() : 'Never'}
                              </span>
                            </div>
                          </>
                        );
                      })()
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="questions">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Question Management</h2>
              <div className="flex space-x-3">
                <Link href="/admin/add-question">
                  <Button size="sm" className="bg-gradient-security hover:opacity-90 text-white border-0">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Question
                  </Button>
                </Link>
                <Link href="/admin/manage-questions">
                  <Button size="sm" className="bg-gradient-security hover:opacity-90 text-white border-0">
                    <Eye className="mr-2 h-4 w-4" />
                    Manage Questions
                  </Button>
                </Link>
              </div>
            </div>
            
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Question Categories */}
              <Card className="bg-white/10 backdrop-blur-md border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Question Categories</CardTitle>
                  <CardDescription className="text-gray-300">
                    Distribution and weighting of assessment questions
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {loading.questions ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-400"></div>
                    </div>
                  ) : error.questions ? (
                    <div className="text-center py-8">
                      <AlertTriangle className="h-8 w-8 text-red-400 mx-auto mb-2" />
                      <p className="text-gray-300">Error loading categories</p>
                    </div>
                  ) : dashboardData.questionCategories.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-300">No question categories found</p>
                    </div>
                  ) : (
                    dashboardData.questionCategories.map((cat, index) => (
                      <div key={cat.category} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                        <div>
                          <div className="text-white font-medium">{cat.category}</div>
                          <div className="text-gray-400 text-sm">{cat.count} questions</div>
                        </div>
                        <div className="text-right">
                          <div className="text-white">Weight: {cat.avgWeight}</div>
                          {/* <div className="flex space-x-2">
                            <Button size="sm" variant="ghost" className="text-blue-400 hover:bg-blue-400/10">
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="ghost" className="text-red-400 hover:bg-red-400/10">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div> */}
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Recent Questions */}
              <Card className="bg-white/10 backdrop-blur-md border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Recent Questions</CardTitle>
                  <CardDescription className="text-gray-300">
                    Latest questions added to the platform
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {loading.questions ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-400"></div>
                    </div>
                  ) : error.questions ? (
                    <div className="text-center py-8">
                      <AlertTriangle className="h-8 w-8 text-red-400 mx-auto mb-2" />
                      <p className="text-gray-300">Error loading questions</p>
                    </div>
                  ) : questions.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-300">No questions found</p>
                    </div>
                  ) : (
                    // Sort questions by creation date (newest first) and display the top 5
                    [...questions]
                      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                      .slice(0, 5)
                      .map((question, index) => (
                        <div key={question._id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                              index === 0 ? 'bg-blue-500' :
                              index === 1 ? 'bg-blue-500/90' :
                              index === 2 ? 'bg-blue-500/80' :
                              'bg-blue-500/70'
                            } text-white`}>
                              {index + 1}
                            </div>
                            <div className="max-w-xs">
                              <div className="text-white font-medium truncate">{question.question}</div>
                              <div className="text-gray-400 text-xs">{question.complianceName}</div>
                              <div className="text-gray-500 text-xs">{formatTimeAgo(question.createdAt)}</div>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <Badge className={`${
                              question.isActive === false ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/30" :
                              "bg-green-500/20 text-green-300 border-green-500/30"
                            }`}>
                              {question.responses} {question.responses === 1 ? 'response' : 'responses'}
                            </Badge>
                          </div>
                        </div>
                      ))
                  )}
                  <div className="pt-2 text-center">
                    <Link href="/admin/manage-questions">
                      <Button size="sm" className="bg-gradient-security hover:opacity-90 text-white border-0">
                        View All Questions
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Question Response Statistics Row */}
            <div className="mt-6">
              <Card className="bg-white/10 backdrop-blur-md border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Response Statistics</CardTitle>
                  <CardDescription className="text-gray-300">
                    Insights into user engagement with assessment questions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading.questions ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-400"></div>
                    </div>
                  ) : error.questions ? (
                    <div className="text-center py-8">
                      <AlertTriangle className="h-8 w-8 text-red-400 mx-auto mb-2" />
                      <p className="text-gray-300">Error loading question statistics</p>
                    </div>
                  ) : (
                    (() => {
                      const responseStats = calculateQuestionResponseStats();
                      
                      return (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {/* Total Responses */}
                          <div className="p-4 bg-white/5 rounded-lg">
                            <div className="text-gray-400 mb-1">Total Responses</div>
                            <div className="text-2xl font-bold text-white">{responseStats.totalResponses}</div>
                            <div className="text-blue-400 text-sm mt-2">
                              ~{responseStats.avgResponsesPerQuestion} per question
                            </div>
                          </div>
                          
                          {/* Top Category */}
                          <div className="p-4 bg-white/5 rounded-lg">
                            <div className="text-gray-400 mb-1">Most Popular Category</div>
                            <div className="text-xl font-bold text-white truncate">
                              {responseStats.mostPopularCategory || 'N/A'}
                            </div>
                            {responseStats.responsesByCategory[0] && (
                              <div className="text-blue-400 text-sm mt-2">
                                {responseStats.responsesByCategory[0].responses} responses
                              </div>
                            )}
                          </div>
                          
                          {/* Questions Without Responses */}
                          <div className="p-4 bg-white/5 rounded-lg">
                            <div className="text-gray-400 mb-1">Questions Without Responses</div>
                            <div className="text-2xl font-bold text-white">
                              {responseStats.questionsWithoutResponses}
                            </div>
                            <div className="text-blue-400 text-sm mt-2">
                              {questions.length > 0 
                                ? `${Math.round((responseStats.questionsWithoutResponses / questions.length) * 100)}% of total`
                                : '0% of total'
                              }
                            </div>
                          </div>
                          
                          {/* Category Breakdown */}
                          <div className="col-span-1 md:col-span-2 lg:col-span-3 p-4 bg-white/5 rounded-lg">
                            <div className="text-gray-300 mb-3">Response Distribution by Category</div>
                            <div className="space-y-2">
                              {responseStats.responsesByCategory.slice(0, 5).map((item, i) => (
                                <div key={item.category} className="flex flex-col">
                                  <div className="flex justify-between text-sm mb-1">
                                    <span className="text-white">{item.category}</span>
                                    <span className="text-blue-300">{item.responses} responses</span>
                                  </div>
                                  <div className="w-full bg-white/10 rounded-full h-2">
                                    <div 
                                      className="bg-blue-500 h-2 rounded-full" 
                                      style={{ 
                                        width: `${responseStats.totalResponses > 0 
                                          ? (item.responses / responseStats.totalResponses) * 100 
                                          : 0}%` 
                                      }}
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })()
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">User Management</h2>
              <div className="flex space-x-3">
                <Link href="/admin/add-user">
                  <Button size="sm" className="bg-gradient-security hover:opacity-90 text-white border-0">
                    <Plus className="mr-2 h-4 w-4" />
                    Add User
                  </Button>
                </Link>
                <Link href="/admin/manage-users">
                  <Button size="sm" className="bg-gradient-security hover:opacity-90 text-white border-0">
                    <Eye className="mr-2 h-4 w-4" />
                    Manage Users
                  </Button>
                </Link>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Individual Users */}
              <Card className="bg-white/10 backdrop-blur-md border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Individual Users</CardTitle>
                  <CardDescription className="text-gray-300">
                    Users with individual access to the platform
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {loading.users ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-400"></div>
                    </div>
                  ) : error.users ? (
                    <div className="text-center py-8">
                      <AlertTriangle className="h-8 w-8 text-red-400 mx-auto mb-2" />
                      <p className="text-gray-300">Error loading users</p>
                    </div>
                  ) : users.filter(user => user.userType === 'user').length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-300">No individual users found</p>
                    </div>
                  ) : (
                    users.filter(user => user.userType === 'user')
                      .slice(0, 5)
                      .map((user, index) => (
                        <div key={user._id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                              <Users className="h-4 w-4 text-blue-300" />
                            </div>
                            <div>
                              <div className="text-white font-medium">{user.profile?.name || user.email}</div>
                              <div className="text-gray-400 text-xs">{user.email}</div>
                              {user.profile?.department && (
                                <div className="text-gray-500 text-xs">{user.profile.department}</div>
                              )}
                            </div>
                          </div>
                          <div>
                            <Badge className={user.profile?.isActive ? 
                              "bg-green-500/20 text-green-300 border-green-500/30" : 
                              "bg-red-500/20 text-red-300 border-red-500/30"}>
                              {user.profile?.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                        </div>
                      ))
                  )}
                  {!loading.users && !error.users && users.filter(user => user.userType === 'user').length > 5 && (
                    <div className="pt-2 text-center">
                      <Link href="/admin/manage-users">
                        <Button size="sm" className="bg-gradient-security hover:opacity-90 text-white border-0">
                          View All Users
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Company Users */}
              <Card className="bg-white/10 backdrop-blur-md border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Company Accounts</CardTitle>
                  <CardDescription className="text-gray-300">
                    Organizations with access to the platform
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {loading.users ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-400"></div>
                    </div>
                  ) : error.users ? (
                    <div className="text-center py-8">
                      <AlertTriangle className="h-8 w-8 text-red-400 mx-auto mb-2" />
                      <p className="text-gray-300">Error loading companies</p>
                    </div>
                  ) : users.filter(user => user.userType === 'company').length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-300">No company accounts found</p>
                    </div>
                  ) : (
                    users.filter(user => user.userType === 'company')
                      .slice(0, 5)
                      .map((company, index) => (
                        <div key={company._id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                              <Building2 className="h-4 w-4 text-purple-300" />
                            </div>
                            <div>
                              <div className="text-white font-medium">{company.profile?.name || company.email}</div>
                              <div className="text-gray-400 text-xs">{company.email}</div>
                            </div>
                          </div>
                          <div>
                            <Badge className={company.profile?.isActive ? 
                              "bg-green-500/20 text-green-300 border-green-500/30" : 
                              "bg-red-500/20 text-red-300 border-red-500/30"}>
                              {company.profile?.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                        </div>
                      ))
                  )}
                  {!loading.users && !error.users && users.filter(user => user.userType === 'company').length > 5 && (
                    <div className="pt-2 text-center">
                      <Link href="/admin/manage-users?type=company">
                        <Button size="sm" className="bg-gradient-security hover:opacity-90 text-white border-0">
                          View All Companies
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="analytics">
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Platform Analytics</CardTitle>
                <CardDescription className="text-gray-300">
                  Detailed analytics and reporting
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">Advanced Analytics</h3>
                  <p className="text-gray-300 mb-6">
                    Comprehensive analytics dashboard coming soon
                  </p>
                  <Button className="bg-gradient-security hover:opacity-90 text-white border-0">
                    Generate Report
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