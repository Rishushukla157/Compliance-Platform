'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  TrendingUp, 
  FileText, 
  Award, 
  CheckCircle, 
  AlertTriangle,
  Play,
  BarChart3,
  Target,
  Clock
} from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { UserNavigation } from '@/components/user-navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { API_ENDPOINTS } from '@/lib/config';

interface DashboardData {
  userName: string;
  overallScore: number;
  previousScore: number;
  assessmentsCompleted: number;
  totalAssessments: number;
  lastAssessment: string;
  categories: Array<{
    name: string;
    score: number;
    status: string;
  }>;
  achievements: Array<{
    name: string;
    icon: any;
    earned: boolean;
  }>;
  recentActivity: Array<{
    action: string;
    date: string;
    score: number | null;
    userName: string;
  }>;
}

export default function UserDashboard() {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    if (user?.id) {
      fetchDashboardData();
    } else {
      toast.error('Please log in to view your dashboard');
      router.push('/auth/login');
    }
  }, [user, router]);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      console.log('Fetching dashboard data for user:', user?.id);
      const response = await fetch(`${API_ENDPOINTS.USER.REPORT}?userId=${user?.id}`, {
        method: 'GET',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      console.log('Dashboard response status:', response.status);
      const data = await response.json();
      console.log('Dashboard response data:', data);
      if (response.ok) {
        setDashboardData({
          userName: data.userName,
          overallScore: Number((data.overallScore || 0).toFixed(2)),
          previousScore: Number((data.previousScore || 0).toFixed(2)),
          assessmentsCompleted: data.totalAssessments || 0,
          totalAssessments: 10,
          lastAssessment: data.lastAssessment ? new Date(data.lastAssessment).toLocaleDateString() : 'No assessments yet',
          categories: Object.entries(data.categoryScores || {}).map(([name, score]) => ({
            name,
            score: Number((score || 0).toFixed(2)),
            status: Number(score) >= 80 ? 'good' : 'warning'
          })),
          achievements: [
            { name: 'Security Rookie', icon: Shield, earned: (data.overallScore || 0) >= 60 },
            { name: 'Password Master', icon: CheckCircle, earned: (data.categoryScores?.['Password Management'] || 0) >= 80 },
            { name: 'Privacy Pro', icon: Award, earned: (data.overallScore || 0) >= 90 },
          ],
          recentActivity: (data.attempts || []).map((attempt: any) => ({
            action: `Completed Security Assessment (Attempt #${attempt.attemptNumber})`,
            date: new Date(attempt.completedAt).toLocaleDateString(),
            score: Number((attempt.overallPercentage || 0).toFixed(2)),
            userName: attempt.userName || data.userName
          })).slice(0, 5)
        });
      } else {
        console.error('Dashboard error response:', data);
        toast.error(data.error || 'Failed to fetch dashboard data');
        setDashboardData({
          userName: user?.name || 'User',
          overallScore: 0,
          previousScore: 0,
          assessmentsCompleted: 0,
          totalAssessments: 10,
          lastAssessment: 'No assessments yet',
          categories: [],
          achievements: [
            { name: 'Security Rookie', icon: Shield, earned: false },
            { name: 'Password Master', icon: CheckCircle, earned: false },
            { name: 'Privacy Pro', icon: Award, earned: false },
          ],
          recentActivity: []
        });
      }
    } catch (error) {
      console.error('Fetch dashboard error:', error);
      toast.error(`Error fetching dashboard data: ${(error as Error).message}`);
      setDashboardData({
        userName: user?.name || 'User',
        overallScore: 0,
        previousScore: 0,
        assessmentsCompleted: 0,
        totalAssessments: 10,
        lastAssessment: 'No assessments yet',
        categories: [],
        achievements: [
          { name: 'Security Rookie', icon: Shield, earned: false },
          { name: 'Password Master', icon: CheckCircle, earned: false },
          { name: 'Privacy Pro', icon: Award, earned: false },
        ],
        recentActivity: []
      });
    } finally {
      setIsLoading(false);
    }
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

  if (!mounted || isLoading || !dashboardData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <UserNavigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-white text-center">
          Loading dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <UserNavigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome back, {dashboardData.userName}!
          </h1>
          <p className="text-gray-300">
            Track your security progress and improve your digital safety.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-300">
                  Overall Score
                </CardTitle>
                <BarChart3 className="h-4 w-4 text-blue-400" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getScoreColor(dashboardData.overallScore)}`}>
                  {dashboardData.overallScore.toFixed(2)}%
                </div>
                <p className="text-xs text-gray-400">
                  {dashboardData.recentActivity.length > 1
                    ? `${(dashboardData.overallScore - dashboardData.previousScore) >= 0 ? '+' : ''}${(dashboardData.overallScore - dashboardData.previousScore).toFixed(2)}% from last assessment`
                    : 'No previous assessment'}
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
                  Assessments
                </CardTitle>
                <Target className="h-4 w-4 text-green-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {dashboardData.assessmentsCompleted}/{dashboardData.totalAssessments}
                </div>
                <p className="text-xs text-gray-400">
                  {dashboardData.totalAssessments - dashboardData.assessmentsCompleted} remaining
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
                  Achievements
                </CardTitle>
                <Award className="h-4 w-4 text-yellow-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {dashboardData.achievements.filter(a => a.earned).length}
                </div>
                <p className="text-xs text-gray-400">
                  badges earned
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
                  Last Assessment
                </CardTitle>
                <Clock className="h-4 w-4 text-purple-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {dashboardData.lastAssessment}
                </div>
                <p className="text-xs text-gray-400">
                  Security Assessment
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Card className="bg-white/10 backdrop-blur-md border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Security Categories</CardTitle>
                  <CardDescription className="text-gray-300">
                    Your performance across different security areas
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {dashboardData.categories.length > 0 ? (
                    dashboardData.categories.map((category, index) => (
                      <div key={category.name || index} className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-white font-medium">{category.name}</span>
                          <div className="flex items-center space-x-2">
                            <Badge 
                              className={`${getScoreBg(category.score)} ${getScoreColor(category.score)} border-0`}
                            >
                              {category.score.toFixed(2)}%
                            </Badge>
                            {category.status === 'warning' && (
                              <AlertTriangle className="h-4 w-4 text-yellow-500" />
                            )}
                          </div>
                        </div>
                        <Progress 
                          value={category.score} 
                          className="bg-white/10"
                        />
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-300">No category data available.</p>
                  )}
                  <div className="pt-4">
                    <Link href="/user/assessment">
                      <Button className="w-full bg-gradient-security hover:opacity-90 text-white border-0">
                        <Play className="mr-2 h-4 w-4" />
                        Start New Assessment
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <Card className="bg-white/10 backdrop-blur-md border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Achievements</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {dashboardData.achievements.map((achievement, index) => (
                    <div 
                      key={achievement.name || index}
                      className={`flex items-center space-x-3 p-3 rounded-lg ${
                        achievement.earned ? 'bg-green-500/20' : 'bg-gray-500/20'
                      }`}
                    >
                      <achievement.icon 
                        className={`h-5 w-5 ${
                          achievement.earned ? 'text-green-400' : 'text-gray-400'
                        }`} 
                      />
                      <span className={achievement.earned ? 'text-white' : 'text-gray-400'}>
                        {achievement.name}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <Card className="bg-white/10 backdrop-blur-md border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {dashboardData.recentActivity.length > 0 ? (
                    dashboardData.recentActivity.map((activity, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm">{activity.action}</p>
                          <div className="flex items-center justify-between mt-1">
                            <p className="text-gray-400 text-xs">{activity.date}</p>
                            {activity.score !== null && (
                              <Badge className={`${getScoreBg(activity.score)} ${getScoreColor(activity.score)} border-0 text-xs`}>
                                {activity.score.toFixed(2)}%
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-300">No recent activity available.</p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}