"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { AdminNavigation } from "@/components/admin-navigation";
import { ArrowLeft, Plus, Edit, Trash2, Search, Filter, Eye, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { API_ENDPOINTS } from "@/lib/config";

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
  isActive?: boolean;
  responses?: number;
  createdAt?: string;
  updatedAt?: string;
}

export default function ManageQuestionsPage() {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("_all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // Function to refresh the access token using the refresh token
  const refreshTokens = async (): Promise<boolean> => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        console.error('No refresh token found in localStorage');
        toast.error('No refresh token found. Please log in again.');
        return false;
      }

      console.log("Attempting to refresh token...");
      
      const response = await fetch(API_ENDPOINTS.COMMON.REFRESH, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        
        if (!data.accessToken || !data.refreshToken) {
          console.error('Invalid response from refresh token endpoint:', data);
          toast.error('Invalid token response. Please log in again.');
          return false;
        }
        
        console.log("Tokens refreshed successfully");
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        return true;
      } else {
        // Try to get more details about the error
        let errorMessage = 'Unable to refresh token. Please log in again.';
        try {
          const errorData = await response.json();
          console.error('Token refresh failed:', errorData);
          if (errorData.error) {
            errorMessage = `${errorMessage} (${errorData.error})`;
          }
        } catch (e) {
          console.error('Token refresh failed with status:', response.status);
        }
        
        toast.error(errorMessage);
        return false;
      }
    } catch (error) {
      console.error("Token refresh error:", error);
      toast.error('Error refreshing authentication. Please log in again.');
      return false;
    }
  };

  // Function to make authenticated requests with token refresh capability
  const authenticatedFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
    // Create a new options object with the current headers
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
      const refreshed = await refreshTokens();
      
      if (refreshed) {
        // Create new options with the fresh token
        const retryOptions = { 
          ...options,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            ...(options.headers || {})
          }
        };
        
        console.log('Token refreshed, retrying request...');
        // Retry the request with the new token
        response = await fetch(url, retryOptions);
      } else {
        console.log('Failed to refresh token');
      }
    }

    return response;
  };

  // Fetch all questions
  const fetchQuestions = async () => {
    setLoading(true);
    try {
      // Always fetch all questions first
      let url = API_ENDPOINTS.ADMIN.QUESTIONS;
      console.log("Fetching questions from URL:", url);
      
      const response = await authenticatedFetch(url);
      
      if (response.ok) {
        const data = await response.json();
        console.log("Fetched questions data:", data);
        console.log("Selected category for filtering:", selectedCategory);
        
        // Apply client-side filtering if a specific category is selected
        let filteredData = data;
        if (selectedCategory && selectedCategory !== "_all") {
          filteredData = data.filter((q: Question) => 
            q.complianceName && q.complianceName.toLowerCase() === selectedCategory.toLowerCase()
          );
          console.log("Filtered questions by category:", filteredData);
        }
        
        setQuestions(filteredData);
        
        // Extract unique categories from ALL questions (not filtered ones)
        const uniqueCategories = Array.from(new Set(data.map((q: Question) => q.complianceName)))
          .filter((category): category is string => 
            typeof category === 'string' && category.trim() !== ""
          );
        setCategories(uniqueCategories);
        console.log("Available categories:", uniqueCategories);
      } else {
        console.error("Failed to fetch questions, response status:", response.status);
        toast.error("Failed to fetch questions");
      }
    } catch (error) {
      console.error("Error fetching questions:", error);
      toast.error("An error occurred while fetching questions");
    } finally {
      setLoading(false);
    }
  };

  // Verify token validity on page load
  const verifyTokenStatus = async () => {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      console.log('No access token found, user may need to login');
      return;
    }
    
    // Simple check to see if token might be expired
    try {
      const tokenParts = accessToken.split('.');
      if (tokenParts.length === 3) {
        const payload = JSON.parse(atob(tokenParts[1]));
        const expiryTime = payload.exp * 1000; // Convert to milliseconds
        const currentTime = Date.now();
        
        console.log('Token status check - Current time:', new Date(currentTime).toISOString());
        console.log('Token expires at:', new Date(expiryTime).toISOString());
        
        // If token is expired or about to expire in the next minute, refresh it
        if (expiryTime - currentTime < 60000) {
          console.log('Token is expired or about to expire, refreshing...');
          await refreshTokens();
        }
      }
    } catch (error) {
      console.error('Error parsing token:', error);
      // If there's any issue with the token, attempt to refresh it
      await refreshTokens();
    }
  };

  // Fetch questions on initial load and when category changes
  useEffect(() => {
    verifyTokenStatus();
    fetchQuestions();
  }, [selectedCategory]);

  // Delete a question
  const deleteQuestion = async (id: string) => {
    try {
      const response = await authenticatedFetch(`${API_ENDPOINTS.ADMIN.DELETE_QUESTION}/${id}`, {
        method: "DELETE"
      });

      if (response.ok) {
        toast.success("Question deleted successfully");
        fetchQuestions(); // Refresh the questions list
        setDeleteConfirmOpen(false);
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to delete question");
      }
    } catch (error) {
      console.error("Error deleting question:", error);
      toast.error("An error occurred while deleting the question");
    }
  };

  // Update a question
  const updateQuestion = async (e: React.FormEvent | null = null) => {
    console.log("updateQuestion function called");
    if (e) e.preventDefault(); // Only prevent default if event exists
    
    if (!selectedQuestion) {
      console.error("No selected question to update");
      toast.error("No question selected");
      return;
    }
    
    // Ensure all required properties exist
    if (!selectedQuestion._id) {
      console.error("Selected question is missing _id");
      toast.error("Invalid question data - missing ID");
      return;
    }
    
    // Ensure question text exists
    if (!selectedQuestion.question || selectedQuestion.question.trim() === '') {
      console.error("Question text is empty");
      toast.error("Question text cannot be empty");
      return;
    }
    
    // Ensure complianceName exists
    if (!selectedQuestion.complianceName || selectedQuestion.complianceName.trim() === '') {
      console.error("Category/compliance name is empty");
      toast.error("Category cannot be empty");
      return;
    }
    
    // Ensure options is an array with content
    if (!Array.isArray(selectedQuestion.options) || selectedQuestion.options.length === 0) {
      console.error("Selected question options is not a valid array:", selectedQuestion.options);
      toast.error("Question must have at least one option");
      return;
    }
    
    // Check if any option is empty
    if (selectedQuestion.options.some(option => !option || !option.text || option.text.trim() === '')) {
      console.error("Some options are empty");
      toast.error("Options cannot be empty");
      return;
    }

    try {
      // Show loading state
      console.log("Starting update process for question:", selectedQuestion._id);
      toast.loading("Updating question...");
      
      const questionData = {
        question: selectedQuestion.question,
        options: selectedQuestion.options,
        complianceName: selectedQuestion.complianceName,
        weight: selectedQuestion.weight || 1,
        isActive: selectedQuestion.isActive !== false // Default to true if undefined
      };
      
      console.log("Sending update request for question:", selectedQuestion._id);
      console.log("Question data:", questionData);
      
      console.log(`Making API request to ${API_ENDPOINTS.ADMIN.UPDATE_QUESTION}/${selectedQuestion._id}`);
      const response = await authenticatedFetch(`${API_ENDPOINTS.ADMIN.UPDATE_QUESTION}/${selectedQuestion._id}`, {
        method: "PUT",
        body: JSON.stringify(questionData)
      });
      console.log("API response status:", response.status);

      // Dismiss loading toast
      toast.dismiss();

      if (response.ok) {
        console.log("Question updated successfully");
        toast.success("Question updated successfully");
        fetchQuestions(); // Refresh the questions list
        setIsUpdateDialogOpen(false);
      } else {
        // Try to get error details
        let errorMessage = "Failed to update question";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
          console.error("Update failed:", errorData);
        } catch (parseError) {
          console.error("Update failed with status:", response.status);
        }
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error("Error updating question:", error);
      toast.error("An error occurred while updating the question");
    }
  };

  // Filtered questions based on search query and category
  const filteredQuestions = questions.filter(q => {
    // Apply search filter
    const matchesSearch = searchQuery === "" || 
      q.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
      q.complianceName.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Since category filtering is now handled in fetchQuestions, all questions here should match the category
    return matchesSearch;
  });

  // Handle option change in the update form
  const handleOptionChange = (index: number, field: 'text' | 'weight', value: string | number) => {
    if (!selectedQuestion) return;
    
    const updatedOptions = [...selectedQuestion.options];
    if (field === 'text') {
      updatedOptions[index] = {
        ...updatedOptions[index],
        text: value as string
      };
    } else if (field === 'weight') {
      // Ensure weight is always a valid number with minimum of 1
      const weightValue = typeof value === 'string' ? parseInt(value) : value;
      const validWeight = Math.max(1, isNaN(weightValue) ? 1 : weightValue);
      
      updatedOptions[index] = {
        ...updatedOptions[index],
        weight: validWeight
      };
    }
    
    setSelectedQuestion({
      ...selectedQuestion,
      options: updatedOptions
    });
  };

  // Handle adding a new option to a question
  const addOption = () => {
    if (!selectedQuestion || !Array.isArray(selectedQuestion.options)) {
      return;
    }
    
    const newOptionLabel = String.fromCharCode(65 + selectedQuestion.options.length); // A, B, C, D, etc.
    
    setSelectedQuestion({
      ...selectedQuestion,
      options: [...selectedQuestion.options, {
        label: newOptionLabel,
        text: `Option ${selectedQuestion.options.length + 1}`,
        weight: 1
      }]
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <AdminNavigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center mb-6">
          <Link href="/admin/dashboard" className="flex items-center text-white/70 hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
        </div>
        
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">Manage Questions</h1>
              <p className="text-gray-300">View, add, update, or delete assessment questions</p>
            </div>
            <div className="flex space-x-3">
              <Link href="/admin/add-question">
                <Button className="bg-gradient-security hover:opacity-90 text-white border-0">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Questions
                </Button>
              </Link>
            </div>
          </div>
          
          <Card className="bg-white/5 border-white/10 mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search questions or categories..."
                      className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-gray-400"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                <div className="w-full md:w-64">
                  <div className="flex items-center space-x-2">
                    <Filter className="h-4 w-4 text-gray-400" />
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger className="w-full bg-white/5 border-white/20 text-white placeholder:text-gray-400">
                        <SelectValue placeholder="Filter by category">
                          {selectedCategory === "_all" ? "All Categories" : selectedCategory}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="_all">All Categories</SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>{category}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-400 mx-auto mb-4"></div>
              <p className="text-gray-300">Loading questions...</p>
            </div>
          ) : filteredQuestions.length === 0 ? (
            <div className="text-center py-12 bg-white/5 rounded-lg border border-white/10">
              <AlertTriangle className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Questions Found</h3>
              <p className="text-gray-300 mb-6">
                {searchQuery || selectedCategory ? 
                  "No questions match your search criteria." : 
                  "There are no questions in the system yet."}
              </p>
              <Link href="/admin/add-question">
                <Button className="bg-gradient-security hover:opacity-90 text-white border-0">
                  Add Questions
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="w-full">
                <TableHeader className="bg-white/5">
                  <TableRow>
                    <TableHead className="text-gray-300 w-8">#</TableHead>
                    <TableHead className="text-gray-300">Question</TableHead>
                    <TableHead className="text-gray-300">Category</TableHead>
                    <TableHead className="text-gray-300">Weight</TableHead>
                    <TableHead className="text-gray-300">Status</TableHead>
                    <TableHead className="text-gray-300 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredQuestions.map((question, index) => (
                    <TableRow key={question._id} className="border-white/10 hover:bg-white/5">
                      <TableCell className="text-gray-400">{index + 1}</TableCell>
                      <TableCell className="text-white">
                        <div className="max-w-md truncate">{question.question}</div>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                          {question.complianceName}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-white">{question.weight}</TableCell>
                      <TableCell>
                        <Badge className={`${
                          question.isActive !== false 
                            ? "bg-green-500/20 text-green-300 border-green-500/30" 
                            : "bg-red-500/20 text-red-300 border-red-500/30"
                        }`}>
                          {question.isActive !== false ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="text-blue-400 hover:bg-blue-400/10"
                            onClick={() => {
                              console.log("Edit button clicked for question:", question._id);
                              try {
                                // Create a deep copy of the question with safe access to properties
                                const safeOptions = Array.isArray(question.options) ? 
                                  [...question.options] : 
                                  // If options is not an array, create an array with default options
                                  [
                                    { label: 'A', text: 'Option 1', weight: 1 },
                                    { label: 'B', text: 'Option 2', weight: 1 },
                                    { label: 'C', text: 'Option 3', weight: 1 },
                                    { label: 'D', text: 'Option 4', weight: 1 }
                                  ];
                                
                                console.log("Options for question:", safeOptions);
                                
                                setSelectedQuestion({
                                  ...question, 
                                  // Ensure options is always a valid array
                                  options: safeOptions,
                                  weight: question.weight || 1
                                });
                                console.log("selectedQuestion set to:", {...question, options: safeOptions});
                                setIsUpdateDialogOpen(true);
                                console.log("isUpdateDialogOpen set to true");
                              } catch (error) {
                                console.error("Error setting selected question:", error);
                                toast.error("Error opening question editor");
                              }
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="text-red-400 hover:bg-red-400/10"
                            onClick={() => {
                              try {
                                // Set the selected question without spreading options
                                setSelectedQuestion(question);
                                setDeleteConfirmOpen(true);
                              } catch (error) {
                                console.error("Error setting question for deletion:", error);
                                toast.error("Error preparing question for deletion");
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          
          {/* Update Question Dialog */}
          <Dialog 
            open={isUpdateDialogOpen} 
            onOpenChange={(open) => {
              console.log("Dialog onOpenChange triggered, new state:", open);
              if (!open) {
                console.log("Dialog closing, clearing selected question");
              } else if (selectedQuestion) {
                console.log("Dialog opening with question:", selectedQuestion._id);
                console.log("Question options:", selectedQuestion.options);
              }
              setIsUpdateDialogOpen(open);
            }}
          >
            <DialogContent 
              className="bg-slate-900 text-white border-white/20 max-w-3xl max-h-[90vh] w-[95vw] sm:w-full flex flex-col"
              onEscapeKeyDown={(e) => {
                console.log("Dialog escape key pressed");
              }}
              onPointerDownOutside={(e) => {
                console.log("Dialog clicked outside");
              }}
            >
              <DialogHeader className="flex-shrink-0">
                <DialogTitle className="text-white text-xl">Update Question</DialogTitle>
                <DialogDescription className="text-gray-300">
                  Make changes to the question below. Click save when you're done.
                </DialogDescription>
              </DialogHeader>
              
              {selectedQuestion && selectedQuestion._id ? (
                <>
                  <div className="flex-1 overflow-y-auto px-1">
                    <form 
                      id="updateQuestionForm"
                      onSubmit={(e) => {
                        console.log("Form submission triggered");
                        e.preventDefault(); // Prevent default form submission
                        updateQuestion(e);
                      }} 
                      className="space-y-4"
                    >
                  {/* Category */}
                  <div className="space-y-2">
                    <Label htmlFor="complianceName" className="text-white">Category</Label>
                    <Input
                      id="complianceName"
                      value={selectedQuestion.complianceName}
                      onChange={(e) => setSelectedQuestion({...selectedQuestion, complianceName: e.target.value})}
                      className="bg-white/5 border-white/20 text-white"
                      required
                    />
                  </div>
                  
                  {/* Question */}
                  <div className="space-y-2">
                    <Label htmlFor="question" className="text-white">Question</Label>
                    <Input
                      id="question"
                      value={selectedQuestion.question}
                      onChange={(e) => setSelectedQuestion({...selectedQuestion, question: e.target.value})}
                      className="bg-white/5 border-white/20 text-white"
                      required
                    />
                  </div>
                  
                  {/* Options */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center mb-1">
                      <Label className="text-white">Options</Label>
                      {selectedQuestion && selectedQuestion.options && Array.isArray(selectedQuestion.options) && selectedQuestion.options.length > 0 && (
                        <Button 
                          type="button"
                          size="sm"
                          onClick={addOption}
                          className="bg-blue-500/20 text-blue-300 border-blue-500/30 hover:bg-blue-500/30"
                        >
                          Add Option
                        </Button>
                      )}
                    </div>
                    
                    {selectedQuestion && selectedQuestion.options && Array.isArray(selectedQuestion.options) && selectedQuestion.options.length > 0 ? (
                      <div className="space-y-3">
                        {selectedQuestion.options.map((option, index) => (
                          <div key={index} className="flex items-center gap-2 p-3 bg-white/5 rounded-lg border border-white/10">
                            <Badge className="bg-white/10 text-white/80 border-white/20 min-w-[2rem] text-center">
                              {option.label}
                            </Badge>
                            <div className="flex-1">
                              <Input
                                value={option.text}
                                onChange={(e) => handleOptionChange(index, 'text', e.target.value)}
                                className="bg-white/5 border-white/20 text-white"
                                placeholder="Option text"
                                required
                              />
                            </div>
                            <div className="w-20">
                              <Input
                                type="number"
                                min="1"
                                value={option.weight.toString()}
                                onChange={(e) => handleOptionChange(index, 'weight', parseInt(e.target.value) || 1)}
                                className="bg-white/5 border-white/20 text-white text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                placeholder="Weight"
                                required
                              />
                            </div>
                            <div className="text-xs text-gray-400 min-w-[3rem]">
                              Weight
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-gray-400 space-y-2">
                        <p>No options available</p>
                        <Button 
                          type="button"
                          size="sm"
                          onClick={() => {
                            if (selectedQuestion) {
                              const newOptions = [
                                { label: 'A', text: 'Option 1', weight: 1 },
                                { label: 'B', text: 'Option 2', weight: 1 },
                                { label: 'C', text: 'Option 3', weight: 1 },
                                { label: 'D', text: 'Option 4', weight: 1 }
                              ];
                              setSelectedQuestion({
                                ...selectedQuestion,
                                options: newOptions
                              });
                            }
                          }}
                          className="bg-blue-500 hover:bg-blue-600 text-white border-0"
                        >
                          Add Default Options
                        </Button>
                      </div>
                    )}
                  
                  </div>
                  
                  {/* Question Weight */}
                  <div className="space-y-2">
                    <Label htmlFor="questionWeight" className="text-white">Question Weight</Label>
                    {selectedQuestion ? (
                      <Input
                        id="questionWeight"
                        type="number"
                        min="1"
                        value={selectedQuestion.weight}
                        onChange={(e) => setSelectedQuestion({...selectedQuestion, weight: parseInt(e.target.value || "1")})}
                        className="bg-white/5 border-white/20 text-white"
                        required
                      />
                    ) : (
                      <div className="text-gray-400">Loading...</div>
                    )}
                  </div>
                  
                  {/* Question Active Status */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg">
                      <div className="space-y-1">
                        <Label htmlFor="questionActive" className="text-white font-medium">Question Status</Label>
                        <p className="text-sm text-gray-400">
                          {selectedQuestion?.isActive !== false ? 'Question is currently active and visible to users' : 'Question is currently inactive and hidden from users'}
                        </p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`text-sm font-medium ${selectedQuestion?.isActive !== false ? 'text-green-400' : 'text-gray-400'}`}>
                          {selectedQuestion?.isActive !== false ? 'Active' : 'Inactive'}
                        </span>
                        <Switch
                          id="questionActive"
                          checked={selectedQuestion?.isActive !== false}
                          onCheckedChange={(checked) => {
                            if (selectedQuestion) {
                              setSelectedQuestion({...selectedQuestion, isActive: checked});
                            }
                          }}
                          className="data-[state=checked]:bg-green-500"
                        />
                      </div>
                    </div>
                  </div>
                  
                  </form>
                  </div>
                  
                  <DialogFooter className="flex-shrink-0 border-t border-white/10 pt-4">
                    <Button 
                      type="button" 
                      className="bg-gradient-security hover:opacity-90 text-white border-0"
                      onClick={() => {
                        console.log("Cancel button clicked");
                        setIsUpdateDialogOpen(false);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="button"
                      className="bg-gradient-security hover:opacity-90 text-white border-0"
                      onClick={() => {
                        console.log("Save Changes button clicked");
                        updateQuestion();
                      }}
                    >
                      Save Changes
                    </Button>
                  </DialogFooter>
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-300">No question selected or question ID is missing.</p>
                </div>
              )}
            </DialogContent>
          </Dialog>
          
          {/* Delete Confirmation Dialog */}
          <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
            <DialogContent className="bg-slate-900 text-white border-white/20">
              <DialogHeader>
                <DialogTitle className="text-white text-xl">Confirm Deletion</DialogTitle>
                <DialogDescription className="text-gray-300">
                  Are you sure you want to delete this question? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              
              {selectedQuestion && (
                <div className="p-4 bg-white/5 rounded-md border border-white/10 my-4">
                  <h4 className="font-medium text-white">{selectedQuestion.question}</h4>
                  <p className="text-gray-400 mt-1">Category: {selectedQuestion.complianceName}</p>
                </div>
              )}
              
              <DialogFooter>
                <Button 
                  type="button" 
                  className="bg-gradient-security hover:opacity-90 text-white border-0"
                  onClick={() => setDeleteConfirmOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="button"
                  className="bg-red-500 hover:bg-red-600 text-white border-0"
                  onClick={() => selectedQuestion && deleteQuestion(selectedQuestion._id)}
                >
                  Delete Question
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}