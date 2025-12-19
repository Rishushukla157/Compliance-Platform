'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/components/auth-provider';
import { toast } from '@/hooks/use-toast';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Play, 
  Users, 
  BarChart3,
  Calendar,
  Target,
  Award
} from 'lucide-react';
import { CompanyNavigation } from '@/components/company-navigation';
import { API_ENDPOINTS } from '@/lib/config';

interface Assessment {
  _id: string;
  title: string;
  description: string;
  category: string;
  totalQuestions: number;
  completedBy: number;
  totalEmployees: number;
  averageScore: number;
  status: 'active' | 'completed' | 'pending';
  deadline: string;
  timeLimit: number; // in minutes
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

export default function CompanyAssessment() {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    setMounted(true);
    loadAssessments();
  }, []);

  const loadAssessments = async () => {
    setLoading(true);
    try {
      // For now, we'll use mock data. In a real implementation, this would fetch from API
      const mockAssessments: Assessment[] = [
        {
          _id: '1',
          title: 'Cybersecurity Fundamentals',
          description: 'Basic cybersecurity knowledge assessment covering password security, phishing, and data protection.',
          category: 'Security',
          totalQuestions: 25,
          completedBy: 18,
          totalEmployees: 25,
          averageScore: 78,
          status: 'active',
          deadline: '2024-12-31',
          timeLimit: 30,
          difficulty: 'Medium'
        },
        {
          _id: '2',
          title: 'Data Privacy Compliance',
          description: 'Assessment on GDPR, data handling procedures, and privacy regulations.',
          category: 'Compliance',
          totalQuestions: 20,
          completedBy: 22,
          totalEmployees: 25,
          averageScore: 85,
          status: 'active',
          deadline: '2024-12-25',
          timeLimit: 25,
          difficulty: 'Hard'
        },
        {
          _id: '3',
          title: 'Incident Response',
          description: 'Knowledge test on security incident response procedures and escalation protocols.',
          category: 'Response',
          totalQuestions: 15,
          completedBy: 12,
          totalEmployees: 25,
          averageScore: 72,
          status: 'active',
          deadline: '2024-12-20',
          timeLimit: 20,
          difficulty: 'Hard'
        },
        {
          _id: '4',
          title: 'Social Engineering Awareness',
          description: 'Assessment covering social engineering tactics and prevention strategies.',
          category: 'Awareness',
          totalQuestions: 18,
          completedBy: 25,
          totalEmployees: 25,
          averageScore: 92,
          status: 'completed',
          deadline: '2024-11-30',
          timeLimit: 22,
          difficulty: 'Easy'
        }
      ];

      setAssessments(mockAssessments);
    } catch (error) {
      console.error('Error loading assessments:', error);
      toast({
        title: "Error",
        description: "Failed to load assessments",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-blue-500';
      case 'completed':
        return 'bg-green-500';
      case 'pending':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy':
        return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'Medium':
        return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'Hard':
        return 'text-red-400 bg-red-400/10 border-red-400/20';
      default:
        return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
    }
  };

  const filteredAssessments = assessments.filter(assessment => 
    filterStatus === 'all' || assessment.status === filterStatus
  );

  const completionRate = assessments.length > 0 
    ? Math.round((assessments.filter(a => a.status === 'completed').length / assessments.length) * 100)
    : 0;

  const averageCompletionPercentage = assessments.length > 0
    ? Math.round(assessments.reduce((acc, curr) => acc + (curr.completedBy / curr.totalEmployees), 0) / assessments.length * 100)
    : 0;

  const overallAverageScore = assessments.length > 0
    ? Math.round(assessments.reduce((acc, curr) => acc + curr.averageScore, 0) / assessments.length)
    : 0;

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
              Security Assessments
            </h1>
            <p className="text-gray-300">
              Monitor and manage security assessments for your organization
            </p>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <FileText className="h-6 w-6 text-blue-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-300">Total Assessments</p>
                  <p className="text-2xl font-bold text-white">{assessments.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-300">Completion Rate</p>
                  <p className="text-2xl font-bold text-white">{completionRate}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-purple-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-300">Average Score</p>
                  <p className="text-2xl font-bold text-white">{overallAverageScore}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-500/20 rounded-lg">
                  <Users className="h-6 w-6 text-yellow-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-300">Participation</p>
                  <p className="text-2xl font-bold text-white">{averageCompletionPercentage}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter Tabs */}
        <div className="flex space-x-4 mb-6">
          {['all', 'active', 'completed', 'pending'].map((status) => (
            <Button
              key={status}
              variant={filterStatus === status ? "default" : "ghost"}
              onClick={() => setFilterStatus(status)}
              className={filterStatus === status 
                ? "bg-white/20 text-white border-white/30" 
                : "text-gray-300 hover:text-white hover:bg-white/10"
              }
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Button>
          ))}
        </div>

        {/* Assessments Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="text-white">Loading assessments...</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredAssessments.map((assessment) => (
              <motion.div
                key={assessment._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="bg-white/10 backdrop-blur-md border-white/20 hover:border-white/30 transition-all h-full">
                  <CardHeader>
                    <div className="flex justify-between items-start mb-2">
                      <Badge className={getDifficultyColor(assessment.difficulty)}>
                        {assessment.difficulty}
                      </Badge>
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(assessment.status)}`} />
                    </div>
                    <CardTitle className="text-white">{assessment.title}</CardTitle>
                    <CardDescription className="text-gray-300">
                      {assessment.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Progress Bar */}
                      <div>
                        <div className="flex justify-between text-sm text-gray-300 mb-2">
                          <span>Completion Progress</span>
                          <span>{assessment.completedBy}/{assessment.totalEmployees}</span>
                        </div>
                        <Progress 
                          value={(assessment.completedBy / assessment.totalEmployees) * 100} 
                          className="h-2"
                        />
                      </div>

                      {/* Assessment Details */}
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center text-gray-300">
                          <Clock className="h-4 w-4 mr-2" />
                          {assessment.timeLimit} min
                        </div>
                        <div className="flex items-center text-gray-300">
                          <Target className="h-4 w-4 mr-2" />
                          {assessment.totalQuestions} questions
                        </div>
                        <div className="flex items-center text-gray-300">
                          <Calendar className="h-4 w-4 mr-2" />
                          Due: {new Date(assessment.deadline).toLocaleDateString()}
                        </div>
                        <div className="flex items-center text-gray-300">
                          <Award className="h-4 w-4 mr-2" />
                          Avg: {assessment.averageScore}%
                        </div>
                      </div>

                      {/* Category Badge */}
                      <Badge variant="outline" className="bg-blue-500/10 text-blue-300 border-blue-500/30">
                        {assessment.category}
                      </Badge>

                      {/* Action Button */}
                      <div className="pt-2">
                        {assessment.status === 'completed' ? (
                          <Button className="w-full bg-green-500/20 hover:bg-green-500/30 text-green-300 border-green-500/30">
                            <CheckCircle className="mr-2 h-4 w-4" />
                            View Results
                          </Button>
                        ) : (
                          <Button className="w-full bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border-blue-500/30">
                            <Play className="mr-2 h-4 w-4" />
                            Monitor Progress
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {filteredAssessments.length === 0 && !loading && (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">
              No assessments found
            </h3>
            <p className="text-gray-400">
              {filterStatus === 'all' 
                ? 'No assessments available at the moment.' 
                : `No ${filterStatus} assessments found.`
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
