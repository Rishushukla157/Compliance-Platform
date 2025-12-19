'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/components/auth-provider';
import { toast } from '@/hooks/use-toast';
import { 
  Users, 
  Search, 
  Filter,
  Mail,
  Phone,
  User,
  Shield,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  MapPin,
  Calendar,
  Download
} from 'lucide-react';
import { CompanyNavigation } from '@/components/company-navigation';
import { API_ENDPOINTS } from '@/lib/config';

interface Employee {
  id: string;
  name: string;
  email: string;
  department: string;
  role: string;
  securityScore: number;
  quizScore: number;
  status: string;
  lastAssessment: string;
  weakAreas: string[];
  avatarUrl?: string;
}

export default function CompanyEmployees() {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [departments, setDepartments] = useState<string[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const fetchEmployees = async () => {
      if (!user?.companyName) return;

      try {
        setLoading(true);
        const res = await fetch(API_ENDPOINTS.COMPANY.EMPLOYEES, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          }
        });
        
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const data = await res.json();
        console.log("Fetched employees:", data);

        setEmployees(data.employees || []);
        
        // Extract unique departments
        const uniqueDepts = [...new Set(data.employees?.map((emp: Employee) => emp.department) || [])];
        setDepartments(uniqueDepts);
        
      } catch (err) {
        console.error('Error fetching employees:', err);
        toast({
          title: "Error",
          description: "Failed to fetch employee data",
          variant: "destructive"
        });
        setEmployees([]);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchEmployees();
    }
  }, [user]);

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-500';
    if (score >= 70) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'needs-attention': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'at-risk': return 'bg-red-500/20 text-red-300 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const filteredEmployees = employees.filter((employee) => {
    const name = employee.name || '';
    const email = employee.email || '';
    const dept = employee.department || '';

    const matchesSearch =
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDepartment =
      selectedDepartment === 'all' || dept === selectedDepartment;

    return matchesSearch && matchesDepartment;
  });

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
              Employee Management
            </h1>
            <p className="text-gray-300">
              Monitor and manage your company's employee security performance
            </p>
          </div>
          
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">
                Total Employees
              </CardTitle>
              <Users className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {employees.length}
              </div>
              <p className="text-xs text-gray-400">
                Across {departments.length} departments
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">
                Average Score
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {employees.length > 0 
                  ? Math.round(employees.reduce((sum, emp) => sum + emp.securityScore, 0) / employees.length)
                  : 0}%
              </div>
              <p className="text-xs text-gray-400">
                Company average
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">
                Compliant
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">
                {employees.filter(emp => emp.status === 'compliant').length}
              </div>
              <p className="text-xs text-gray-400">
                Employees
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">
                Need Attention
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-400">
                {employees.filter(emp => emp.status === 'needs-attention' || emp.status === 'at-risk').length}
              </div>
              <p className="text-xs text-gray-400">
                Employees
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <Card className="bg-white/10 backdrop-blur-md border-white/20 mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search employees by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white/10 border-white/20 text-white placeholder-gray-400"
                />
              </div>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="px-4 py-2 bg-white/10 border border-white/20 rounded-md text-white"
              >
                <option value="all">All Departments</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Employee Grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-400"></div>
          </div>
        ) : filteredEmployees.length === 0 ? (
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardContent className="py-12 text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No Employees Found</h3>
              <p className="text-gray-400">
                {searchTerm || selectedDepartment !== 'all' 
                  ? 'Try adjusting your search or filter criteria.' 
                  : 'No employees have been registered yet.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEmployees.map((employee) => (
              <motion.div
                key={employee.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="bg-white/10 backdrop-blur-md border-white/20">
                  <CardHeader className="pb-3">
                    <div className="flex items-center space-x-3">
                      {employee.avatarUrl ? (
                        <img
                          src={employee.avatarUrl}
                          alt={employee.name}
                          className="w-10 h-10 rounded-full object-cover border border-white/30"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gradient-security rounded-full flex items-center justify-center text-white font-semibold">
                          {typeof employee.name === 'string' && employee.name.trim()
                            ? employee.name
                                .trim()
                                .split(' ')
                                .map((word: string) => word[0].toUpperCase())
                                .join('')
                                .slice(0, 2)
                            : 'NA'}
                        </div>
                      )}
                      <div className="flex-1">
                        <CardTitle className="text-white text-sm">{employee.name}</CardTitle>
                        <p className="text-gray-400 text-xs">{employee.role}</p>
                      </div>
                      <Badge className={getStatusColor(employee.status)}>
                        {employee.status.replace('-', ' ')}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-gray-400 text-xs">Security Score</p>
                        <p className={`font-semibold ${getScoreColor(employee.securityScore)}`}>
                          {employee.securityScore}%
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs">Quiz Score</p>
                        <p className={`font-semibold ${getScoreColor(employee.quizScore)}`}>
                          {employee.quizScore}%
                        </p>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-gray-400 text-xs mb-1">Department</p>
                      <Badge variant="outline" className="border-white/20 text-white">
                        {employee.department}
                      </Badge>
                    </div>

                    <div>
                      <p className="text-gray-400 text-xs mb-1">Weak Areas</p>
                      <div className="flex flex-wrap gap-1">
                        {(employee.weakAreas || []).map((area: string, idx: number) => (
                          <Badge key={idx} className="bg-red-500/20 text-red-300 border-red-500/30 text-xs">
                            {area}
                          </Badge>
                        ))}
                        {(!employee.weakAreas || employee.weakAreas.length === 0) && (
                          <span className="text-gray-500 text-xs">No weak areas identified</span>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-2">
                      <p className="text-gray-400 text-xs">Last: {employee.lastAssessment}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
