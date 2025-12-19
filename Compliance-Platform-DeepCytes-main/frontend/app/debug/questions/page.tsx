'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { API_ENDPOINTS } from '@/lib/config';
import { useAuth } from '@/components/auth-provider';
import { toast } from "sonner";

interface DebugResults {
  timestamp: string;
  user: {
    id?: string;
    email?: string;
    userType?: string;
    isLoggedIn: boolean;
  };
  networkTest: {
    status?: number;
    ok?: boolean;
    statusText?: string;
    error?: string;
    endpoint?: string;
  };
  authTest: {
    status?: number;
    ok?: boolean;
    hasAccessToken: boolean;
    hasRefreshToken: boolean;
    tokenLength?: number;
    error?: string;
  };
  questionsTest: {
    status?: number;
    ok?: boolean;
    statusText?: string;
    endpoint?: string;
    dataType?: string;
    isArray?: boolean;
    questionsCount?: number;
    responseKeys?: string[];
    firstQuestionSample?: any;
    rawResponse?: any;
    error?: string;
  };
  errors: string[];
}

export default function QuestionDebugTool() {
  const [debugInfo, setDebugInfo] = useState<DebugResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const runDebugTest = async () => {
    setIsLoading(true);
    setDebugInfo(null);
    
    const debugResults: DebugResults = {
      timestamp: new Date().toISOString(),
      user: {
        id: user?.id,
        email: user?.email,
        userType: user?.userType,
        isLoggedIn: !!user
      },
      networkTest: {},
      authTest: {
        hasAccessToken: !!localStorage.getItem('accessToken'),
        hasRefreshToken: !!localStorage.getItem('refreshToken')
      },
      questionsTest: {},
      errors: []
    };

    try {
      // 2. Test network connectivity to backend
      try {
        const response = await fetch(`${API_ENDPOINTS.USER.QUESTIONS.split('/api')[0]}/api/health`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        debugResults.networkTest = {
          ...debugResults.networkTest,
          status: response.status,
          ok: response.ok,
          statusText: response.statusText
        };
      } catch (networkError) {
        const error = networkError as Error;
        debugResults.networkTest = {
          ...debugResults.networkTest,
          error: error.message,
          endpoint: API_ENDPOINTS.USER.QUESTIONS.split('/api')[0]
        };
        debugResults.errors.push(`Network error: ${error.message}`);
      }

      // 3. Test authentication endpoint
      try {
        const authResponse = await fetch(API_ENDPOINTS.AUTH.LOGIN.replace('/login', '/verify'), {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          }
        });
        debugResults.authTest = {
          ...debugResults.authTest,
          status: authResponse.status,
          ok: authResponse.ok,
          tokenLength: localStorage.getItem('accessToken')?.length || 0
        };
      } catch (authError) {
        const error = authError as Error;
        debugResults.authTest = {
          ...debugResults.authTest,
          error: error.message
        };
        debugResults.errors.push(`Auth test error: ${error.message}`);
      }

      // 4. Test questions endpoint
      try {
        console.log('Testing questions endpoint:', `${API_ENDPOINTS.USER.QUESTIONS}?userType=user&userId=${user?.id}`);
        
        const questionsResponse = await fetch(`${API_ENDPOINTS.USER.QUESTIONS}?userType=user&userId=${user?.id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          }
        });

        const questionsData = await questionsResponse.json();
        
        debugResults.questionsTest = {
          status: questionsResponse.status,
          ok: questionsResponse.ok,
          statusText: questionsResponse.statusText,
          endpoint: API_ENDPOINTS.USER.QUESTIONS,
          dataType: typeof questionsData,
          isArray: Array.isArray(questionsData),
          questionsCount: Array.isArray(questionsData) ? questionsData.length : 0,
          responseKeys: Object.keys(questionsData || {}),
          firstQuestionSample: Array.isArray(questionsData) && questionsData.length > 0 ? 
            {
              id: questionsData[0]._id,
              questionText: questionsData[0].question?.substring(0, 50) + '...',
              optionsCount: questionsData[0].options?.length,
              complianceName: questionsData[0].complianceName
            } : null,
          rawResponse: questionsData
        };

        if (!questionsResponse.ok) {
          debugResults.errors.push(`Questions API error: ${questionsData.error || 'Unknown error'}`);
        }

      } catch (questionsError) {
        const error = questionsError as Error;
        debugResults.questionsTest = {
          error: error.message
        };
        debugResults.errors.push(`Questions fetch error: ${error.message}`);
      }

      setDebugInfo(debugResults);
      
      if (debugResults.errors.length === 0) {
        toast.success("Debug test completed successfully!");
      } else {
        toast.error(`Debug test found ${debugResults.errors.length} issues`);
      }

    } catch (generalError) {
      const error = generalError as Error;
      debugResults.errors.push(`General error: ${error.message}`);
      setDebugInfo(debugResults);
      toast.error("Debug test failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Questions Debug Tool</CardTitle>
          <CardDescription>
            Diagnose why questions are not appearing on the user side
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={runDebugTest} disabled={isLoading} className="mb-4">
            {isLoading ? "Running Debug Test..." : "Run Debug Test"}
          </Button>

          {debugInfo && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">User Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                    {JSON.stringify(debugInfo.user, null, 2)}
                  </pre>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Network Test</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                    {JSON.stringify(debugInfo.networkTest, null, 2)}
                  </pre>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Authentication Test</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                    {JSON.stringify(debugInfo.authTest, null, 2)}
                  </pre>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Questions API Test</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                    {JSON.stringify(debugInfo.questionsTest, null, 2)}
                  </pre>
                </CardContent>
              </Card>

              {debugInfo.errors.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg text-red-600">Errors Found</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="list-disc list-inside space-y-1 text-red-600">
                      {debugInfo.errors.map((error: string, index: number) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
