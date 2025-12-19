'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/components/auth-provider';
import { toast } from '@/hooks/use-toast';
import { 
  Trophy, 
  Medal, 
  Award, 
  TrendingUp, 
  Star, 
  Crown,
  Target,
  BarChart3,
  Users,
  Calendar,
  RefreshCw,
  ChevronUp,
  ChevronDown,
  Minus
} from 'lucide-react';
import { CompanyNavigation } from '@/components/company-navigation';
import { API_ENDPOINTS } from '@/lib/config';

interface Employee {
  _id: string;
  name: string;
  email: string;
  department: string;
  position: string;
  overallScore: number;
  assessmentsCompleted: number;
  totalAssessments: number;
  lastAssessment: string;
  rank: number;
  previousRank?: number;
  badges: string[];
  streak: number;
  improvement: number; // percentage change from last period
}

interface Department {
  name: string;
  averageScore: number;
  employeeCount: number;
  topPerformer: string;
  completionRate: number;
}

interface LeaderboardStats {
  totalEmployees: number;
  averageScore: number;
  topScore: number;
  assessmentsCompleted: number;
  totalAssessments: number;
}

export default function CompanyLeaderboard() {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [stats, setStats] = useState<LeaderboardStats | null>(null);
  const [activeTab, setActiveTab] = useState('individual');
  const [timeFilter, setTimeFilter] = useState('monthly');

  useEffect(() => {
    setMounted(true);
    loadLeaderboardData();
  }, [timeFilter]);

  const loadLeaderboardData = async () => {
    setLoading(true);
    try {
      // Mock data for leaderboard
      const mockEmployees: Employee[] = [
        {
          _id: '1',
          name: 'Sarah Johnson',
          email: 'sarah.johnson@company.com',
          department: 'Security',
          position: 'Security Analyst',
          overallScore: 95,
          assessmentsCompleted: 12,
          totalAssessments: 12,
          lastAssessment: '2024-12-01T10:00:00Z',
          rank: 1,
          previousRank: 2,
          badges: ['Security Expert', 'Perfect Score', 'Fast Learner'],
          streak: 8,
          improvement: 5.2
        },
        {
          _id: '2',
          name: 'Michael Chen',
          email: 'michael.chen@company.com',
          department: 'IT',
          position: 'IT Manager',
          overallScore: 92,
          assessmentsCompleted: 11,
          totalAssessments: 12,
          lastAssessment: '2024-11-30T15:30:00Z',
          rank: 2,
          previousRank: 1,
          badges: ['Compliance Master', 'Consistent Performer'],
          streak: 6,
          improvement: -1.3
        },
        {
          _id: '3',
          name: 'Emily Rodriguez',
          email: 'emily.rodriguez@company.com',
          department: 'HR',
          position: 'HR Director',
          overallScore: 89,
          assessmentsCompleted: 10,
          totalAssessments: 12,
          lastAssessment: '2024-11-29T09:15:00Z',
          rank: 3,
          previousRank: 3,
          badges: ['Team Player', 'Quick Responder'],
          streak: 4,
          improvement: 2.1
        },
        {
          _id: '4',
          name: 'David Kim',
          email: 'david.kim@company.com',
          department: 'Finance',
          position: 'Financial Analyst',
          overallScore: 87,
          assessmentsCompleted: 9,
          totalAssessments: 12,
          lastAssessment: '2024-11-28T14:45:00Z',
          rank: 4,
          previousRank: 5,
          badges: ['Risk Aware'],
          streak: 3,
          improvement: 8.7
        },
        {
          _id: '5',
          name: 'Lisa Wang',
          email: 'lisa.wang@company.com',
          department: 'Marketing',
          position: 'Marketing Manager',
          overallScore: 84,
          assessmentsCompleted: 8,
          totalAssessments: 12,
          lastAssessment: '2024-11-27T11:20:00Z',
          rank: 5,
          previousRank: 4,
          badges: ['Improving', 'Active Learner'],
          streak: 2,
          improvement: -3.2
        }
      ];

      const mockDepartments: Department[] = [
        {
          name: 'Security',
          averageScore: 93,
          employeeCount: 8,
          topPerformer: 'Mohan Panday',
          completionRate: 95
        },
        {
          name: 'IT',
          averageScore: 88,
          employeeCount: 12,
          topPerformer: 'Michael Chen',
          completionRate: 87
        },
        {
          name: 'HR',
          averageScore: 85,
          employeeCount: 6,
          topPerformer: 'Emily Rodriguez',
          completionRate: 92
        },
        {
          name: 'Finance',
          averageScore: 82,
          employeeCount: 9,
          topPerformer: 'David Kim',
          completionRate: 78
        },
        {
          name: 'Marketing',
          averageScore: 79,
          employeeCount: 7,
          topPerformer: 'Lisa Wang',
          completionRate: 83
        }
      ];

      const mockStats: LeaderboardStats = {
        totalEmployees: 42,
        averageScore: 84,
        topScore: 95,
        assessmentsCompleted: 168,
        totalAssessments: 210
      };

      setEmployees(mockEmployees);
      setDepartments(mockDepartments);
      setStats(mockStats);
    } catch (error) {
      console.error('Error loading leaderboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load leaderboard data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-6 w-6 text-yellow-400" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Award className="h-6 w-6 text-amber-600" />;
      default:
        return <span className="text-lg font-bold text-white">#{rank}</span>;
    }
  };

  const getRankChange = (employee: Employee) => {
    if (!employee.previousRank) return <Minus className="h-4 w-4 text-gray-400" />;
    
    if (employee.rank < employee.previousRank) {
      return <ChevronUp className="h-4 w-4 text-green-400" />;
    } else if (employee.rank > employee.previousRank) {
      return <ChevronDown className="h-4 w-4 text-red-400" />;
    } else {
      return <Minus className="h-4 w-4 text-gray-400" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 80) return 'text-yellow-400';
    if (score >= 70) return 'text-orange-400';
    return 'text-red-400';
  };

  const getBadgeColor = (badge: string) => {
    const colors = [
      'bg-blue-500/20 text-blue-300 border-blue-500/30',
      'bg-green-500/20 text-green-300 border-green-500/30',
      'bg-purple-500/20 text-purple-300 border-purple-500/30',
      'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
      'bg-red-500/20 text-red-300 border-red-500/30'
    ];
    return colors[badge.length % colors.length];
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
              Security Leaderboard
            </h1>
            <p className="text-gray-300">
              Track and celebrate top security performers in your organization
            </p>
          </div>
          <div className="flex space-x-4">
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white"
            >
              <option value="weekly">This Week</option>
              <option value="monthly">This Month</option>
              <option value="quarterly">This Quarter</option>
              <option value="yearly">This Year</option>
            </select>
            <Button
              onClick={loadLeaderboardData}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Overview Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <Users className="h-6 w-6 text-blue-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-300">Total Employees</p>
                    <p className="text-2xl font-bold text-white">{stats.totalEmployees}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <BarChart3 className="h-6 w-6 text-green-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-300">Average Score</p>
                    <p className="text-2xl font-bold text-white">{stats.averageScore}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-500/20 rounded-lg">
                    <Trophy className="h-6 w-6 text-yellow-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-300">Top Score</p>
                    <p className="text-2xl font-bold text-white">{stats.topScore}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-500/20 rounded-lg">
                    <Target className="h-6 w-6 text-purple-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-300">Completion Rate</p>
                    <p className="text-2xl font-bold text-white">
                      {Math.round((stats.assessmentsCompleted / stats.totalAssessments) * 100)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white/10 border-white/20">
            <TabsTrigger value="individual" className="data-[state=active]:bg-white/20">
              Individual Rankings
            </TabsTrigger>
            <TabsTrigger value="departments" className="data-[state=active]:bg-white/20">
              Department Rankings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="individual">
            {/* Individual Leaderboard */}
            {loading ? (
              <div className="text-center py-12">
                <div className="text-white">Loading leaderboard...</div>
              </div>
            ) : (
              <div className="space-y-4">
                {employees.map((employee, index) => (
                  <motion.div
                    key={employee._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <Card className={`bg-white/10 backdrop-blur-md border-white/20 hover:border-white/30 transition-all ${
                      employee.rank <= 3 ? 'ring-2 ring-yellow-400/20' : ''
                    }`}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            {/* Rank */}
                            <div className="flex items-center space-x-2">
                              {getRankIcon(employee.rank)}
                              {getRankChange(employee)}
                            </div>

                            {/* Avatar and Info */}
                            <Avatar className="h-12 w-12">
                              <AvatarFallback className="bg-blue-500/20 text-blue-300">
                                {employee.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>

                            <div>
                              <h3 className="text-white font-semibold">{employee.name}</h3>
                              <p className="text-gray-400 text-sm">
                                {employee.position} • {employee.department}
                              </p>
                              <div className="flex items-center space-x-2 mt-1">
                                <Star className="h-4 w-4 text-yellow-400" />
                                <span className="text-sm text-gray-300">
                                  {employee.streak} day streak
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className={`text-3xl font-bold ${getScoreColor(employee.overallScore)}`}>
                              {employee.overallScore}%
                            </div>
                            <div className="text-sm text-gray-400">
                              {employee.assessmentsCompleted}/{employee.totalAssessments} completed
                            </div>
                            <div className="flex items-center justify-end mt-1">
                              {employee.improvement > 0 ? (
                                <div className="flex items-center text-green-400 text-sm">
                                  <TrendingUp className="h-3 w-3 mr-1" />
                                  +{employee.improvement.toFixed(1)}%
                                </div>
                              ) : employee.improvement < 0 ? (
                                <div className="flex items-center text-red-400 text-sm">
                                  <ChevronDown className="h-3 w-3 mr-1" />
                                  {employee.improvement.toFixed(1)}%
                                </div>
                              ) : (
                                <div className="text-gray-400 text-sm">No change</div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="mt-4">
                          <div className="flex justify-between text-sm text-gray-300 mb-2">
                            <span>Assessment Progress</span>
                            <span>{employee.assessmentsCompleted}/{employee.totalAssessments}</span>
                          </div>
                          <Progress 
                            value={(employee.assessmentsCompleted / employee.totalAssessments) * 100} 
                            className="h-2"
                          />
                        </div>

                        {/* Badges */}
                        {employee.badges.length > 0 && (
                          <div className="mt-4">
                            <div className="flex flex-wrap gap-2">
                              {employee.badges.map((badge, badgeIndex) => (
                                <Badge
                                  key={badgeIndex}
                                  variant="outline"
                                  className={getBadgeColor(badge)}
                                >
                                  {badge}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="departments">
            {/* Department Rankings */}
            {loading ? (
              <div className="text-center py-12">
                <div className="text-white">Loading departments...</div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {departments.map((department, index) => (
                  <motion.div
                    key={department.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <Card className="bg-white/10 backdrop-blur-md border-white/20 hover:border-white/30 transition-all h-full">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-white">{department.name}</CardTitle>
                            <CardDescription className="text-gray-300">
                              {department.employeeCount} employees
                            </CardDescription>
                          </div>
                          <div className="text-right">
                            <div className={`text-2xl font-bold ${getScoreColor(department.averageScore)}`}>
                              {department.averageScore}%
                            </div>
                            <div className="text-sm text-gray-400">Average Score</div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {/* Top Performer */}
                          <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                            <div>
                              <div className="text-white font-medium">Top Performer</div>
                              <div className="text-gray-400 text-sm">{department.topPerformer}</div>
                            </div>
                            <Trophy className="h-6 w-6 text-yellow-400" />
                          </div>

                          {/* Completion Rate */}
                          <div>
                            <div className="flex justify-between text-sm text-gray-300 mb-2">
                              <span>Department Completion Rate</span>
                              <span>{department.completionRate}%</span>
                            </div>
                            <Progress value={department.completionRate} className="h-2" />
                          </div>

                          {/* Quick Stats */}
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="text-center p-2 bg-white/5 rounded">
                              <div className="text-white font-medium">{department.employeeCount}</div>
                              <div className="text-gray-400">Team Size</div>
                            </div>
                            <div className="text-center p-2 bg-white/5 rounded">
                              <div className="text-white font-medium">{department.completionRate}%</div>
                              <div className="text-gray-400">Completion</div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
