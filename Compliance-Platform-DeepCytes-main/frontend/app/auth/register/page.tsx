'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Shield, ArrowLeft, Mail, Lock, User, Building2, Phone, CheckCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { toast } from '@/hooks/use-toast';
import { API_ENDPOINTS } from '@/lib/config';

type RegistrationStep = 'email' | 'otp' | 'details' | 'complete';

interface FormData {
  email: string;
  otp: string;
  name: string;
  password: string;
  confirmPassword: string;
  userType: 'user' | 'company';
  companyName: string;
  phone: string;
  department: string;
  companyCode: string;
}

export default function RegisterPage() {
  const [currentStep, setCurrentStep] = useState<RegistrationStep>('email');
  const [formData, setFormData] = useState<FormData>({
    email: '',
    otp: '',
    name: '',
    password: '',
    confirmPassword: '',
    userType: 'user',
    companyName: '',
    phone: '',
    department: '',
    companyCode: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const router = useRouter();

  // Step 1: Send OTP
  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    // Validate companyCode is required only for company users
    if (formData.userType === 'company' && !formData.companyCode) {
      toast({
        title: "Validation Error", 
        description: "Company code is required for company registration",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const requestBody: any = { email: formData.email };
      
      // Include userType and companyCode
      if (formData.userType) {
        requestBody.userType = formData.userType;
      }
      if (formData.companyCode) {
        requestBody.companyCode = formData.companyCode;
      }

      const response = await fetch(API_ENDPOINTS.AUTH.SEND_OTP, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      
      if (response.ok) {
        setOtpSent(true);
        setCurrentStep('otp');
        setResendCooldown(60); // 60 seconds cooldown
        
        // Start cooldown timer
        const timer = setInterval(() => {
          setResendCooldown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        toast({
          title: data.isResend ? "New OTP Sent" : "OTP Sent",
          description: data.isResend 
            ? "A new verification code has been sent to your email" 
            : "Please check your email for the verification code",
        });
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to send OTP",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send OTP. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.otp || formData.otp.length !== 6) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid 6-digit OTP",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.AUTH.VERIFY_OTP, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: formData.email, 
          otp: formData.otp 
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setCurrentStep('details');
        toast({
          title: "Email Verified",
          description: "Please complete your registration details",
        });
      } else {
        toast({
          title: "Verification Failed",
          description: data.error || "Invalid OTP",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to verify OTP. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Complete Registration
  const handleCompleteRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Name is required",
        variant: "destructive",
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Validation Error",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Validation Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (formData.userType === 'company') {
      if (!formData.companyName.trim()) {
        toast({
          title: "Validation Error",
          description: "Company name is required for company accounts",
          variant: "destructive",
        });
        return;
      }
      if (!formData.companyCode || formData.companyCode.length !== 6) {
        toast({
          title: "Validation Error",
          description: "Please provide a valid 6-digit company code",
          variant: "destructive",
        });
        return;
      }
    }

    setIsLoading(true);
    try {
      const registrationData = {
        email: formData.email,
        password: formData.password,
        userType: formData.userType,
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        companyName: formData.companyName.trim(),
        department: formData.department.trim(),
        companyCode: formData.companyCode.trim(),
      };

      const response = await fetch(API_ENDPOINTS.AUTH.COMPLETE_REGISTRATION, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registrationData),
      });

      const data = await response.json();
      
      if (response.ok) {
        setCurrentStep('complete');
        toast({
          title: "Registration Complete",
          description: "Your account has been created successfully!",
        });
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push('/auth/login');
        }, 3000);
      } else {
        toast({
          title: "Registration Failed",
          description: data.error || "Failed to complete registration",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to complete registration. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleResendOTP = () => {
    if (resendCooldown > 0) return;
    handleSendOTP(new Event('submit') as any);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'email':
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <form onSubmit={handleSendOTP} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email address"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-gray-400"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-white">Account Type</Label>
                <RadioGroup
                  value={formData.userType}
                  onValueChange={(value) => handleInputChange('userType', value)}
                  className="flex space-x-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="user" id="user" className="border-white/20 text-white" />
                    <Label htmlFor="user" className="text-white cursor-pointer">Individual User</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="company" id="company" className="border-white/20 text-white" />
                    <Label htmlFor="company" className="text-white cursor-pointer">Company</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyCode" className="text-white">
                  Company Code {formData.userType === 'company' ? '' : '(Optional)'}
                </Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="companyCode"
                    type="text"
                    placeholder={formData.userType === 'company' ? "Enter your company code" : "Enter company code (optional)"}
                    value={formData.companyCode}
                    onChange={(e) => handleInputChange('companyCode', e.target.value)}
                    className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-gray-400"
                    required={formData.userType === 'company'}
                  />
                </div>
                <p className="text-xs text-gray-400">
                  {formData.userType === 'company' 
                    ? 'Enter the unique company code for your organization'
                    : 'Optional: Enter the company code where you work or are associated with'
                  }
                </p>
              </div>
              
              <Button
                type="submit"
                className="w-full bg-gradient-security hover:opacity-90 text-white border-0"
                disabled={isLoading}
              >
                {isLoading ? 'Sending OTP...' : 'Send Verification Code'}
              </Button>
            </form>
          </motion.div>
        );

      case 'otp':
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div className="text-center mb-6">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-blue-500/20 rounded-full">
                  <Mail className="h-8 w-8 text-blue-400" />
                </div>
              </div>
              <p className="text-gray-300">
                We've sent a verification code to <br />
                <span className="text-white font-medium">{formData.email}</span>
              </p>
            </div>

            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp" className="text-white">Verification Code</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={formData.otp}
                  onChange={(e) => handleInputChange('otp', e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="text-center text-lg tracking-widest bg-white/5 border-white/20 text-white placeholder:text-gray-400"
                  maxLength={6}
                  required
                />
              </div>
              
              <Button
                type="submit"
                className="w-full bg-gradient-security hover:opacity-90 text-white border-0"
                disabled={isLoading || formData.otp.length !== 6}
              >
                {isLoading ? 'Verifying...' : 'Verify Code'}
              </Button>
              
              <div className="text-center">
                <Button
                  type="button"
                  variant="ghost"
                  className="text-gray-400 hover:text-white"
                  onClick={handleResendOTP}
                  disabled={resendCooldown > 0}
                >
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
                </Button>
              </div>
            </form>
          </motion.div>
        );

      case 'details':
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <form onSubmit={handleCompleteRegistration} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-white">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-gray-400"
                    required
                  />
                </div>
              </div>

              {formData.userType === 'company' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="companyName" className="text-white">Company Name</Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="companyName"
                        type="text"
                        placeholder="Enter company name"
                        value={formData.companyName}
                        onChange={(e) => handleInputChange('companyName', e.target.value)}
                        className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-gray-400"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="department" className="text-white">Department (Optional)</Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="department"
                        type="text"
                        placeholder="Enter department"
                        value={formData.department}
                        onChange={(e) => handleInputChange('department', e.target.value)}
                        className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-gray-400"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-white">Phone (Optional)</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Enter phone number"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-gray-400"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-white">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Create password (min 6 characters)"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-gray-400"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-white">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-gray-400"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-security hover:opacity-90 text-white border-0"
                disabled={isLoading}
              >
                {isLoading ? 'Creating Account...' : 'Complete Registration'}
              </Button>
            </form>
          </motion.div>
        );

      case 'complete':
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-6"
          >
            <div className="flex justify-center">
              <div className="p-4 bg-green-500/20 rounded-full">
                <CheckCircle className="h-12 w-12 text-green-400" />
              </div>
            </div>
            
            <div>
              <h3 className="text-2xl font-bold text-white mb-2">Registration Complete!</h3>
              <p className="text-gray-300">
                Your account has been created successfully.
                <br />
                Redirecting to login page...
              </p>
            </div>
            
            <Button
              onClick={() => router.push('/auth/login')}
              className="bg-gradient-security hover:opacity-90 text-white border-0"
            >
              Go to Login
            </Button>
          </motion.div>
        );

      default:
        return null;
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 'email': return 'Get Started';
      case 'otp': return 'Verify Email';
      case 'details': return 'Complete Profile';
      case 'complete': return 'Welcome!';
      default: return 'Register';
    }
  };

  const getStepDescription = () => {
    switch (currentStep) {
      case 'email': return 'Enter your email to begin registration';
      case 'otp': return 'Check your email for the verification code';
      case 'details': return 'Fill in your details to complete registration';
      case 'complete': return 'Your account is ready to use';
      default: return 'Create your account';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        <Link href="/" className="flex items-center text-white/70 hover:text-white transition-colors">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-gradient-security rounded-full">
                  <Shield className="h-8 w-8 text-white" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-white">{getStepTitle()}</CardTitle>
              <CardDescription className="text-gray-300">
                {getStepDescription()}
              </CardDescription>
              
              {/* Progress indicator */}
              {currentStep !== 'complete' && (
                <div className="flex justify-center mt-4">
                  <div className="flex space-x-2">
                    {['email', 'otp', 'details'].map((step, index) => (
                      <div
                        key={step}
                        className={`h-2 w-8 rounded-full ${
                          ['email', 'otp', 'details'].indexOf(currentStep) >= index
                            ? 'bg-blue-400'
                            : 'bg-white/20'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </CardHeader>
            
            <CardContent>
              <AnimatePresence mode="wait">
                {renderStepContent()}
              </AnimatePresence>

              {currentStep !== 'complete' && (
                <div className="mt-6 text-center">
                  <p className="text-gray-300">
                    Already have an account?{' '}
                    <Link href="/auth/login" className="text-blue-400 hover:text-blue-300">
                      Sign in
                    </Link>
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}