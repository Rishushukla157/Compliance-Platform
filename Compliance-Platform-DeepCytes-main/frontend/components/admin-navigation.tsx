'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  Crown, 
  FileText, 
  Users, 
  BarChart3, 
  Settings, 
  LogOut,
  Menu,
  X,
  Building2,
  Plus,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/components/auth-provider';
import { useRouter, usePathname } from 'next/navigation';

export function AdminNavigation() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);

  // Handle navigation with loading state
  const handleNavigation = (href: string, e: React.MouseEvent) => {
    e.preventDefault();
    
    // Don't navigate if already on the current page
    if (pathname === href) {
      return;
    }
    
    setIsNavigating(true);
    setNavigatingTo(href);
    
    // Navigate to the new page
    router.push(href);
  };

  // Reset loading state when pathname changes
  useEffect(() => {
    setIsNavigating(false);
    setNavigatingTo(null);
  }, [pathname]);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const navigationItems = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: BarChart3 },
    { name: 'Add Question', href: '/admin/add-question', icon: Plus },
    { name: 'Manage Questions', href: '/admin/manage-questions', icon: FileText },
    { name: 'Add User', href: '/admin/add-user', icon: Users },
    { name: 'Manage Users', href: '/admin/manage-users', icon: Users },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
  ];

  return (
    <nav className="bg-white/5 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-blue-400" />
              <span className="text-2xl font-bold text-white">SecureCheck</span>
            </div>
            <Badge variant="secondary" className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-xs px-2 py-1 cursor-default">
              Admin
            </Badge>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navigationItems.map((item) => {
              const isCurrentPage = pathname === item.href;
              const isLoadingThisPage = navigatingTo === item.href;
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={(e) => handleNavigation(item.href, e)}
                  className={`flex items-center justify-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 text-sm font-medium whitespace-nowrap ${
                    isCurrentPage 
                      ? 'bg-white/20 text-white' 
                      : 'text-gray-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {isLoadingThisPage ? (
                    <Loader2 className="h-4 w-4 flex-shrink-0 animate-spin" />
                  ) : (
                    <item.icon className="h-4 w-4 flex-shrink-0" />
                  )}
                  <span className="leading-none">{item.name}</span>
                </Link>
              );
            })}
          </div>

          {/* User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Crown className="h-6 w-6 text-yellow-400" />
              <div className="text-white">
                <div className="font-semibold">{user?.name}</div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-gray-300 hover:text-white hover:bg-white/10"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-white"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden py-4 border-t border-white/10"
          >
            <div className="space-y-2">
              {navigationItems.map((item) => {
                const isCurrentPage = pathname === item.href;
                const isLoadingThisPage = navigatingTo === item.href;
                
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={(e) => {
                      handleNavigation(item.href, e);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`flex items-center space-x-2 transition-colors py-2 px-2 rounded-lg ${
                      isCurrentPage 
                        ? 'bg-white/20 text-white' 
                        : 'text-gray-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {isLoadingThisPage ? (
                      <Loader2 className="h-4 w-4 flex-shrink-0 animate-spin" />
                    ) : (
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                    )}
                    <span className="leading-none">{item.name}</span>
                  </Link>
                );
              })}
              <div className="pt-4 border-t border-white/10">
                <div className="flex items-center space-x-2 mb-2">
                  <Crown className="h-6 w-6 text-yellow-400" />
                  <div className="text-white">
                    <div className="font-semibold">{user?.name}</div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-gray-300 hover:text-white hover:bg-white/10 w-full justify-start"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </nav>
  );
}