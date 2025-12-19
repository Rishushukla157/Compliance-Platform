'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  CheckCircle, 
  ArrowRight, 
  ArrowLeft,
  Clock,
  Target,
  Award,
  TrendingUp
} from 'lucide-react';
import { UserNavigation } from '@/components/user-navigation';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAuth } from '@/components/auth-provider';
import { API_ENDPOINTS } from '@/lib/config';

interface User {
  id: string;
  name: string;
}

interface Question {
  _id: string;
  complianceName: string;
  question: string;
  options: Array<{
    label: string;
    text: string;
    weight: number;
  }>;
  questionWeight: number;
}

interface SubmitResponse {
  success: boolean;
  overallPercentage: number;
  categoryScores: Array<{
    complianceName: string;
    totalScored: number;
    totalWeighted: number;
    percentageScore: number;
    questionsAnswered: number;
    attemptNumber: number;
  }>;
  attemptNumber: number;
}

export default function AssessmentPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isStarted, setIsStarted] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const [categoryScores, setCategoryScores] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [attemptNumber, setAttemptNumber] = useState<number | null>(null);
  const [canAttempt, setCanAttempt] = useState(true);
  const [totalQuestions, setTotalQuestions] = useState<number>(10); // Default fallback

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    // Fetch total question count when component mounts
    fetchTotalQuestions();
    if (isStarted && !questions.length && canAttempt) {
      fetchQuestions();
    }
    if (isCompleted) {
      router.push('/user/reports');
    }
  }, [user, isStarted, isCompleted, canAttempt, router]);

  const fetchTotalQuestions = async () => {
    try {
      const response = await fetch(`${API_ENDPOINTS.QUESTIONS.SERVICES}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setTotalQuestions(data.length);
          console.log(`Total questions available: ${data.length}`);
        }
      }
    } catch (error) {
      console.error('Error fetching total questions:', error);
      // Keep default fallback value
    }
  };

  const fetchQuestions = async () => {
    setIsLoading(true);
    try {
      console.log('Fetching questions for user:', user?.id);
      let response = await fetch(`${API_ENDPOINTS.USER.QUESTIONS}?userType=user&userId=${user?.id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      // If unauthorized, try to refresh token
      if (response.status === 401 || response.status === 403) {
        console.log('Token expired, attempting to refresh...');
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          try {
            const refreshResponse = await fetch(API_ENDPOINTS.COMMON.REFRESH, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refreshToken })
            });
            
            if (refreshResponse.ok) {
              const refreshData = await refreshResponse.json();
              localStorage.setItem('accessToken', refreshData.accessToken);
              localStorage.setItem('refreshToken', refreshData.refreshToken);
              
              // Retry the original request with new token
              response = await fetch(`${API_ENDPOINTS.USER.QUESTIONS}?userType=user&userId=${user?.id}`, {
                method: 'GET',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${refreshData.accessToken}`
                }
              });
            }
          } catch (refreshError) {
            console.error('Token refresh failed:', refreshError);
            toast.error('Session expired. Please log in again.');
            router.push('/auth/login');
            return;
          }
        } else {
          toast.error('Session expired. Please log in again.');
          router.push('/auth/login');
          return;
        }
      }

      const data = await response.json();
      console.log('Questions response:', data);
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (response.ok) {
        if (Array.isArray(data) && data.length > 0) {
          console.log(`Successfully fetched ${data.length} questions`);
          setQuestions(data);
          setAttemptNumber(data.attemptNumber || 1);
        } else {
          console.warn('No questions in response:', data);
          toast.error('No questions available. Please try again later or contact support.');
        }
      } else {
        console.error('Fetch questions error:', data.error);
        if (data.error === 'Maximum assessment attempts (10) reached') {
          setCanAttempt(false);
          toast.error('You have reached the maximum of 10 assessment attempts');
        } else if (data.error === 'userId is required') {
          toast.error('User authentication error. Please log in again.');
          router.push('/auth/login');
        } else {
          toast.error(data.error || 'Failed to fetch questions');
        }
      }
    } catch (error) {
      console.error('Fetch questions exception:', error);
      toast.error(`Error fetching questions: ${(error as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const saveAnswer = async (questionId: string, selectedOption: string) => {
    if (!user?.id) {
      console.error('User not authenticated');
      toast.error('User not authenticated. Please log in again.');
      router.push('/auth/login');
      return false;
    }
    try {
      console.log('Saving answer:', { userId: user.id, questionId, selectedOption, attemptNumber });
      const response = await fetch(API_ENDPOINTS.USER.SAVE_ANSWER, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({
          userId: user.id,
          questionId,
          selectedOption,
          attemptNumber: attemptNumber || 1
        })
      });
      
      let data;
      try {
        data = await response.json();
        console.log('Save answer response:', data);
      } catch (jsonError) {
        console.error('Failed to parse JSON response:', await response.text());
        throw new Error('Invalid JSON response from server');
      }

      if (!response.ok) {
        console.error('Save answer error:', data.error);
        toast.error(data.error || 'Failed to save answer');
        return false;
      }
      return true;
    } catch (error) {
      console.error('Save answer exception:', error);
      toast.error(`Error saving answer: ${(error as Error).message}`);
      return false;
    }
  };

  const handleAnswer = (optionLabel: string) => {
    if (!questions[currentQuestion]) {
      console.error('No question available at index:', currentQuestion);
      toast.error('No question available. Please try again.');
      return;
    }
    console.log('Selected option:', optionLabel, 'for question:', questions[currentQuestion]._id);
    setAnswers(prev => ({
      ...prev,
      [questions[currentQuestion]._id]: optionLabel
    }));
  };

  const submitAssessment = async () => {
    if (!user?.id) {
      console.error('User not authenticated');
      toast.error('User not authenticated. Please log in again.');
      router.push('/auth/login');
      return;
    }
    setIsLoading(true);
    try {
      console.log('Submitting assessment:', { userId: user.id, answers, attemptNumber });
      const response = await fetch(API_ENDPOINTS.USER.SUBMIT_ASSESSMENT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({
          userId: user.id,
          name: user.name,
          answers,
          attemptNumber
        })
      });
      const data: SubmitResponse = await response.json();
      console.log('Submit assessment response:', data);
      if (response.ok) {
        setScore(data.overallPercentage);
        const newCategoryScores = {};
        data.categoryScores.forEach(cs => {
          newCategoryScores[cs.complianceName] = cs.percentageScore;
        });
        setCategoryScores(newCategoryScores);
        setAttemptNumber(data.attemptNumber);
        setIsCompleted(true);
        toast.success('Assessment completed! Redirecting to report...');
      } else {
        console.error('Submit assessment error:', data.error);
        if (data.error === 'Maximum assessment attempts (10) reached') {
          setCanAttempt(false);
          toast.error('You have reached the maximum of 10 assessment attempts');
        } else {
          toast.error(data.error || 'Failed to submit assessment');
        }
      }
    } catch (error) {
      console.error('Submit assessment exception:', error);
      toast.error(`Error submitting assessment: ${(error as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const nextQuestion = async () => {
    if (!questions[currentQuestion]) {
      console.error('No question available at index:', currentQuestion);
      toast.error('No question available. Please try again.');
      return;
    }
    if (!answers[questions[currentQuestion]._id]) {
      toast.error('Please select an option before proceeding');
      return;
    }

    const questionId = questions[currentQuestion]._id;
    const selectedOption = answers[questionId];
    const saved = await saveAnswer(questionId, selectedOption);
    if (!saved) return;

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      await submitAssessment();
    }
  };

  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 90) return { text: 'Excellent', color: 'bg-green-500' };
    if (score >= 80) return { text: 'Good', color: 'bg-green-400' };
    if (score >= 60) return { text: 'Fair', color: 'bg-yellow-500' };
    if (score >= 40) return { text: 'Poor', color: 'bg-orange-500' };
    return { text: 'Critical', color: 'bg-red-500' };
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <UserNavigation />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-white text-center">
          Please log in to access the assessment
        </div>
      </div>
    );
  }

  if (!canAttempt) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <UserNavigation />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-gradient-security rounded-full">
                <Shield className="h-12 w-12 text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">Assessment Limit Reached</h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              You have reached the maximum of 10 assessment attempts. Please review your reports for insights.
            </p>
          </motion.div>
          <div className="text-center">
            <Button
              onClick={() => router.push('/user/reports')}
              className="bg-gradient-security hover:opacity-90 text-white border-0 px-12 py-6 text-lg"
            >
              View Reports
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!isStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <UserNavigation />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-gradient-security rounded-full">
                <Shield className="h-12 w-12 text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">Security Assessment</h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Evaluate your personal security posture with our comprehensive assessment. 
              Answer questions to get your security score and personalized recommendations.
            </p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card className="bg-white/10 backdrop-blur-md border-white/20 text-center">
              <CardContent className="pt-6">
                <Clock className="h-8 w-8 text-blue-400 mx-auto mb-4" />
                <h3 className="text-white font-semibold mb-2">Duration</h3>
                <p className="text-gray-300">5-8 minutes</p>
              </CardContent>
            </Card>
            <Card className="bg-white/10 backdrop-blur-md border-white/20 text-center">
              <CardContent className="pt-6">
                <Target className="h-8 w-8 text-green-400 mx-auto mb-4" />
                <h3 className="text-white font-semibold mb-2">Questions</h3>
                <p className="text-gray-300">{totalQuestions} questions</p>
              </CardContent>
            </Card>
            <Card className="bg-white/10 backdrop-blur-md border-white/20 text-center">
              <CardContent className="pt-6">
                <Award className="h-8 w-8 text-yellow-400 mx-auto mb-4" />
                <h3 className="text-white font-semibold mb-2">Result</h3>
                <p className="text-gray-300">Detailed report</p>
              </CardContent>
            </Card>
          </div>
          <div className="text-center">
            <Button
              size="lg"
              onClick={() => setIsStarted(true)}
              className="bg-gradient-security hover:opacity-90 text-white border-0 px-12 py-6 text-lg"
              disabled={isLoading}
            >
              Start Assessment
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading || !questions.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <UserNavigation />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-white text-center">
          Loading questions...
        </div>
      </div>
    );
  }

  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const question = questions[currentQuestion];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <UserNavigation />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex justify-between text-white mb-2">
            <span>Question {currentQuestion + 1} of {questions.length}</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="bg-white/10" />
        </div>
        <motion.div
          key={currentQuestion}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="bg-white/10 backdrop-blur-md border-white/20 mb-8">
            <CardHeader>
              <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 w-fit">
                {question.complianceName}
              </Badge>
              <CardTitle className="text-white text-xl">
                {question.question}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {question.options.map((option) => (
                <motion.button
                  key={option.label}
                  onClick={() => handleAnswer(option.label)}
                  className={`w-full p-4 rounded-lg border text-left transition-all ${
                    answers[question._id] === option.label
                      ? 'bg-blue-500/20 border-blue-500 text-white'
                      : 'bg-white/5 border-white/20 text-gray-300 hover:bg-white/10 hover:border-white/30'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isLoading}
                >
                  <div className="flex items-start space-x-3">
                    <span className={`font-bold ${
                      answers[question._id] === option.label ? 'text-blue-400' : 'text-gray-400'
                    }`}>
                      {option.label}.
                    </span>
                    <span>{option.text}</span>
                  </div>
                </motion.button>
              ))}
            </CardContent>
          </Card>
        </motion.div>
        <div className="flex justify-between">
          <Button
            onClick={prevQuestion}
            disabled={currentQuestion === 0 || isLoading}
            variant="outline"
            className="bg-gradient-security hover:opacity-90 text-white border-0 disabled:opacity-50"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>
          <Button
            onClick={nextQuestion}
            disabled={!answers[question._id] || isLoading}
            className="bg-gradient-security hover:opacity-90 text-white border-0 disabled:opacity-50"
          >
            {currentQuestion === questions.length - 1 ? 'Finish' : 'Next'}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}