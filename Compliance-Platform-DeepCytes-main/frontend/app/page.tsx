'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  Users, 
  Building2, 
  Crown, 
  CheckCircle, 
  ArrowRight, 
  Lock, 
  Globe, 
  Award,
  TrendingUp,
  Eye,
  Zap
} from 'lucide-react';
import Link from 'next/link';

const features = [
  {
    icon: Shield,
    title: 'Personal Security Assessment',
    description: 'Individual users can assess their personal security posture with tailored questions',
    userType: 'Naive User',
    color: 'bg-blue-500',
  },
  {
    icon: Building2,
    title: 'Enterprise Compliance',
    description: 'Companies get comprehensive compliance reports and security recommendations',
    userType: 'Company User',
    color: 'bg-green-500',
  },
  {
    icon: Crown,
    title: 'Admin Dashboard',
    description: 'Full platform management with question weighting and analytics',
    userType: 'Admin User',
    color: 'bg-purple-500',
  },
];

const stats = [
  { label: 'Security Assessments', value: '10,000+', icon: Shield },
  { label: 'Companies Protected', value: '500+', icon: Building2 },
  { label: 'Compliance Reports', value: '25,000+', icon: CheckCircle },
  { label: 'Security Score Avg', value: '85%', icon: TrendingUp },
];

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Navigation */}
      <nav className="relative z-50 bg-white/5 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-blue-400" />
              <span className="text-2xl font-bold text-white">SecureCheck</span>
              <Badge variant="secondary" className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                by DeepCytes
              </Badge>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/auth/login">
                <Button variant="ghost" className="text-white hover:bg-white/10">
                  Sign In
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button className="bg-gradient-security hover:opacity-90 text-white border-0">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-green-600/20 animate-pulse-slow" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6">
              Secure Your
              <span className="text-gradient block">Digital Future</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-4xl mx-auto leading-relaxed">
              Comprehensive security compliance platform that helps individuals and organizations 
              assess, improve, and maintain their security posture with intelligent reporting and gamification.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/register">
                <Button size="lg" className="bg-gradient-security hover:opacity-90 text-white border-0 px-8 py-6 text-lg">
                  Start Free Assessment
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-black/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-gradient-security rounded-full">
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-white mb-2">{stat.value}</div>
                <div className="text-gray-400">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
              Three Levels of Security
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Whether you're an individual, company, or platform administrator, 
              we have the right tools for your security needs.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
              >
                <Card className="bg-white/5 backdrop-blur-md border-white/10 hover:bg-white/10 transition-all duration-300 h-full">
                  <CardHeader>
                    <div className="flex items-center space-x-3 mb-4">
                      <div className={`p-3 ${feature.color} rounded-lg`}>
                        <feature.icon className="h-6 w-6 text-white" />
                      </div>
                      <Badge variant="secondary" className="bg-white/10 text-white border-white/20">
                        {feature.userType}
                      </Badge>
                    </div>
                    <CardTitle className="text-white text-xl">{feature.title}</CardTitle>
                    <CardDescription className="text-gray-300 text-base">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="ghost" className="text-blue-400 hover:bg-blue-400/10 w-full">
                      Learn More
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Benefits */}
      <section className="py-20 bg-gradient-to-r from-green-900/20 to-blue-900/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                Why Choose SecureCheck?
              </h2>
              <div className="space-y-6">
                {[
                  {
                    icon: Zap,
                    title: 'Instant Assessment',
                    description: 'Get immediate security scores and recommendations'
                  },
                  {
                    icon: Award,
                    title: 'Gamified Experience',
                    description: 'Leaderboards and achievements to motivate improvement'
                  },
                  {
                    icon: Globe,
                    title: 'Compliance Ready',
                    description: 'GDPR, HIPAA, ISO27001 compliance tracking'
                  },
                  {
                    icon: Lock,
                    title: 'Enterprise Grade',
                    description: 'Bank-level security for your sensitive data'
                  }
                ].map((benefit, index) => (
                  <motion.div
                    key={benefit.title}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className="flex items-center space-x-4"
                  >
                    <div className="p-2 bg-gradient-security rounded-lg">
                      <benefit.icon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">{benefit.title}</h3>
                      <p className="text-gray-300">{benefit.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="bg-gradient-security rounded-2xl p-8 animate-float">
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-medium">Security Score</span>
                    <span className="text-green-400 font-bold">92%</span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-3">
                    <div className="bg-gradient-to-r from-green-400 to-green-500 h-3 rounded-full w-[92%]" />
                  </div>
                  <div className="text-gray-300 text-sm">
                    Excellent security posture with minor improvements needed
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Ready to Secure Your Future?
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Join thousands of users and companies who trust SecureCheck for their security compliance.
            </p>
            <Link href="/auth/register">
              <Button size="lg" className="bg-gradient-security hover:opacity-90 text-white border-0 px-12 py-6 text-lg">
                Start Your Free Assessment
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black/40 border-t border-white/10 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <Shield className="h-6 w-6 text-blue-400" />
                <span className="text-xl font-bold text-white">SecureCheck</span>
              </div>
              <p className="text-gray-400 mb-4">
                Comprehensive security compliance platform powered by DeepCytes.
              </p>
              <div className="text-gray-500 text-sm">
                © 2025 DeepCytes. All rights reserved.
              </div>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Platform</h3>
              <div className="space-y-2 text-gray-400">
                <div>Personal Assessment</div>
                <div>Enterprise Solutions</div>
                <div>Admin Dashboard</div>
                <div>API Access</div>
              </div>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Support</h3>
              <div className="space-y-2 text-gray-400">
                <div>Documentation</div>
                <div>Help Center</div>
                <div>Contact Support</div>
                <div>Status Page</div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}