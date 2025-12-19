"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { AdminNavigation } from "@/components/admin-navigation";
import { ArrowLeft, Plus, Minus, Trash2 } from "lucide-react";
import Link from "next/link";
import { API_ENDPOINTS } from "@/lib/config";

interface QuestionData {
  complianceName: string;
  question: string;
  options: Array<{
    label: string;
    text: string;
    weight: number;
  }>;
  questionWeight: number;
  userType: 'user' | 'company' | 'both';
}

interface SubmissionResult {
  success: boolean;
  message: string;
  questionIndex: number;
}

export default function AddQuestionPage() {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<QuestionData[]>([
    {
      complianceName: "",
      question: "",
      options: [
        { label: "A", text: "", weight: 1 },
        { label: "B", text: "", weight: 1 }
      ],
      questionWeight: 1,
      userType: 'user',
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [submissionResults, setSubmissionResults] = useState<SubmissionResult[]>([]);

  const addQuestion = () => {
    setQuestions(prev => [...prev, {
      complianceName: "",
      question: "",
      options: [
        { label: "A", text: "", weight: 1 },
        { label: "B", text: "", weight: 1 }
      ],
      questionWeight: 1,
      userType: 'user',
    }]);
  };

  const removeQuestion = (questionIndex: number) => {
    if (questions.length > 1) {
      setQuestions(prev => prev.filter((_, index) => index !== questionIndex));
    }
  };

  const addOption = (questionIndex: number) => {
    setQuestions(prev => {
      const updated = [...prev];
      const currentOptionCount = updated[questionIndex].options.length;
      const newLabel = String.fromCharCode(65 + currentOptionCount); // A, B, C, D, etc.
      
      updated[questionIndex] = {
        ...updated[questionIndex],
        options: [...updated[questionIndex].options, {
          label: newLabel,
          text: "",
          weight: 1
        }]
      };
      return updated;
    });
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    setQuestions(prev => {
      const updated = [...prev];
      if (updated[questionIndex].options.length > 2) {
        const newOptions = updated[questionIndex].options.filter((_, index) => index !== optionIndex);
        // Relabel remaining options
        const relabeledOptions = newOptions.map((option, idx) => ({
          ...option,
          label: String.fromCharCode(65 + idx) // A, B, C, D, etc.
        }));
        
        updated[questionIndex] = {
          ...updated[questionIndex],
          options: relabeledOptions
        };
      }
      return updated;
    });
  };

  const handleQuestionChange = (questionIndex: number, field: string, value: any) => {
    setQuestions(prevQuestions => {
      const updatedQuestions = [...prevQuestions];
      updatedQuestions[questionIndex] = {
        ...updatedQuestions[questionIndex],
        [field]: value,
      };
      return updatedQuestions;
    });
  };

  const handleOptionChange = (questionIndex: number, optionIndex: number, field: 'text' | 'weight', value: string | number) => {
    setQuestions(prevQuestions => {
      const updatedQuestions = [...prevQuestions];
      const updatedOptions = [...updatedQuestions[questionIndex].options];
      
      if (field === 'text') {
        updatedOptions[optionIndex] = {
          ...updatedOptions[optionIndex],
          text: value as string
        };
      } else if (field === 'weight') {
        const weightValue = typeof value === 'string' ? parseInt(value) : value;
        const validWeight = Math.max(1, isNaN(weightValue) ? 1 : weightValue);
        updatedOptions[optionIndex] = {
          ...updatedOptions[optionIndex],
          weight: validWeight
        };
      }
      
      updatedQuestions[questionIndex] = {
        ...updatedQuestions[questionIndex],
        options: updatedOptions,
      };
      
      return updatedQuestions;
    });
  };

  // Function to refresh the access token using the refresh token
  const refreshTokens = async (): Promise<boolean> => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        toast.error('No refresh token found. Please log in again.');
        return false;
      }

      const response = await fetch(API_ENDPOINTS.COMMON.REFRESH, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        return true;
      } else {
        toast.error('Unable to refresh token. Please log in again.');
        return false;
      }
    } catch (error) {
      console.error("Token refresh error:", error);
      toast.error('Error refreshing authentication. Please log in again.');
      return false;
    }
  };

  const submitQuestion = async (questionData: QuestionData, index: number): Promise<SubmissionResult> => {
    try {
      // Transform the data to match backend expectations
      const transformedData = {
        question: questionData.question,
        complianceName: questionData.complianceName,
        weight: questionData.questionWeight,
        userType: questionData.userType,
        options: questionData.options // No transformation needed since structure matches
      };

      // First attempt with current access token
      let response = await fetch(API_ENDPOINTS.ADMIN.ADD_QUESTION, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: JSON.stringify(transformedData),
      });

      // If we get a 403 error, try to refresh the token and retry
      if (response.status === 403) {
        console.log("Access token expired. Attempting to refresh...");
        
        const refreshed = await refreshTokens();
        
        if (refreshed) {
          // Retry the request with the new access token
          response = await fetch(API_ENDPOINTS.ADMIN.ADD_QUESTION, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
            body: JSON.stringify(transformedData),
          });
        } else {
          return {
            success: false,
            message: "Session expired. Please log in again.",
            questionIndex: index
          };
        }
      }

      if (response.ok) {
        return {
          success: true,
          message: "Question added successfully",
          questionIndex: index
        };
      } else {
        const errorData = await response.json();
        return {
          success: false,
          message: errorData.error || "Failed to add question",
          questionIndex: index
        };
      }
    } catch (error) {
      return {
        success: false,
        message: "Network error occurred",
        questionIndex: index
      };
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSubmissionResults([]);

    const results: SubmissionResult[] = [];
    
    // Submit each question sequentially
    for (let i = 0; i < questions.length; i++) {
      const result = await submitQuestion(questions[i], i);
      results.push(result);
    }
    
    setSubmissionResults(results);
    setLoading(false);
    
    // Show success/error messages
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;
    
    if (failureCount === 0) {
      toast.success(`All ${successCount} questions added successfully!`);
    } else if (successCount === 0) {
      toast.error(`Failed to add all ${failureCount} questions.`);
    } else {
      toast.warning(`${successCount} questions added, ${failureCount} failed.`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <AdminNavigation />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center mb-6">
          <Link href="/admin/dashboard" className="flex items-center text-white/70 hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
        </div>
        
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-white">Add Questions</h1>
            <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
              {questions.length} {questions.length === 1 ? 'Question' : 'Questions'}
            </Badge>
          </div>
          
          {loading && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-6 text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-400 mx-auto mb-4"></div>
                <h2 className="text-xl font-semibold text-white">Submitting Questions...</h2>
                <p className="text-gray-300 mt-2">Please wait while we add your questions</p>
              </div>
            </div>
          )}
          
          {submissionResults.length > 0 && (
            <div className="mb-6 p-4 bg-white/5 border border-white/10 rounded-lg">
              <h3 className="text-lg font-semibold text-white mb-4">Submission Results</h3>
              <div className="space-y-2">
                {submissionResults.map((result, index) => (
                  <div 
                    key={index}
                    className={`p-3 rounded-md flex items-center ${
                      result.success 
                        ? 'bg-green-500/10 border border-green-500/30' 
                        : 'bg-red-500/10 border border-red-500/30'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 text-sm ${
                      result.success ? 'bg-green-500' : 'bg-red-500'
                    }`}>
                      {result.success ? '✓' : '✗'}
                    </div>
                    <div className="flex-1">
                      <span className="font-medium text-white">Question {result.questionIndex + 1}: </span>
                      <span className={result.success ? 'text-green-300' : 'text-red-300'}>
                        {result.message}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-6">
              {questions.map((question, questionIndex) => (
                <div 
                  key={questionIndex} 
                  className="border border-white/20 rounded-lg p-6 space-y-4 bg-white/5"
                >
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium text-white">Question {questionIndex + 1}</h3>
                    {questions.length > 1 && (
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm"
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        onClick={() => removeQuestion(questionIndex)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Compliance Name */}
                    <div>
                      <Label htmlFor={`complianceName-${questionIndex}`} className="text-white">
                        Question Category *
                      </Label>
                      <Input
                        id={`complianceName-${questionIndex}`}
                        type="text"
                        placeholder="Enter category (e.g., GDPR, HIPAA, etc.)"
                        value={question.complianceName}
                        onChange={(e) => handleQuestionChange(questionIndex, "complianceName", e.target.value)}
                        className="bg-white/5 border-white/20 text-white placeholder-gray-400"
                        required
                      />
                    </div>

                    {/* Question Weight */}
                    <div>
                      <Label htmlFor={`questionWeight-${questionIndex}`} className="text-white">
                        Question Weight *
                      </Label>
                      <Input
                        id={`questionWeight-${questionIndex}`}
                        type="number"
                        min="1"
                        placeholder="Enter question weight"
                        value={question.questionWeight}
                        onChange={(e) => handleQuestionChange(questionIndex, "questionWeight", parseInt(e.target.value || "1"))}
                        className="bg-white/5 border-white/20 text-white placeholder-gray-400"
                        required
                      />
                    </div>
                  </div>

                  {/* Question */}
                  <div>
                    <Label htmlFor={`question-${questionIndex}`} className="text-white">
                      Question *
                    </Label>
                    <Input
                      id={`question-${questionIndex}`}
                      type="text"
                      placeholder="Enter the question"
                      value={question.question}
                      onChange={(e) => handleQuestionChange(questionIndex, "question", e.target.value)}
                      className="bg-white/5 border-white/20 text-white placeholder-gray-400"
                      required
                    />
                  </div>

                  {/* Options */}
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <div>
                        <Label className="text-white">Answer Options *</Label>
                        <p className="text-xs text-gray-400 mt-1">Add options with weights (higher weight = more points)</p>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          type="button"
                          size="sm"
                          className="bg-gradient-security hover:opacity-90 text-white border-0"
                          onClick={() => addOption(questionIndex)}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add Option
                        </Button>
                        {question.options.length > 2 && (
                          <Button
                            type="button"
                            size="sm"
                            className="bg-gradient-security hover:opacity-90 text-white border-0"
                            onClick={() => removeOption(questionIndex, question.options.length - 1)}
                          >
                            <Minus className="h-3 w-3 mr-1" />
                            Remove
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      {/* Option headers */}
                      <div className="flex items-center space-x-3 pb-2 border-b border-white/10">
                        <div className="w-8 text-center">
                          <Label className="text-xs text-gray-400">ID</Label>
                        </div>
                        <div className="flex-1">
                          <Label className="text-xs text-gray-400">Option Text</Label>
                        </div>
                        <div className="w-20">
                          <Label className="text-xs text-gray-400">Weight</Label>
                        </div>
                        <div className="w-8"></div> {/* Space for remove button */}
                      </div>
                      
                      {question.options.map((option, optionIndex) => (
                        <div key={optionIndex} className="flex items-center space-x-3">
                          <div className="w-8 text-center">
                            <Badge variant="outline" className="border-white/20 text-white bg-transparent">
                              {option.label}
                            </Badge>
                          </div>
                          <div className="flex-1">
                            <Input
                              id={`option-${questionIndex}-${optionIndex}`}
                              type="text"
                              placeholder={`Option ${optionIndex + 1}`}
                              value={option.text}
                              onChange={(e) => handleOptionChange(questionIndex, optionIndex, 'text', e.target.value)}
                              className="bg-white/5 border-white/20 text-white placeholder-gray-400"
                              required
                            />
                          </div>
                          <div className="w-20">
                            <Input
                              type="number"
                              min="1"
                              placeholder="Weight"
                              value={option.weight}
                              onChange={(e) => handleOptionChange(questionIndex, optionIndex, 'weight', parseInt(e.target.value) || 1)}
                              className="bg-white/5 border-white/20 text-white placeholder-gray-400 text-sm"
                              required
                            />
                          </div>
                          {question.options.length > 2 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-1"
                              onClick={() => removeOption(questionIndex, optionIndex)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex justify-between items-center pt-4">
              <Button
                type="button"
                className="bg-gradient-security hover:opacity-90 text-white border-0"
                onClick={addQuestion}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Another Question
              </Button>
              
              <Button
                type="submit"
                className="bg-gradient-security hover:opacity-90 text-white border-0"
                disabled={loading || questions.some(q => 
                  !q.complianceName || 
                  !q.question || 
                  q.options.some(opt => !opt.text.trim()) ||
                  !q.questionWeight
                )}
              >
                {loading ? 'Submitting...' : `Submit ${questions.length} ${questions.length === 1 ? 'Question' : 'Questions'}`}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}