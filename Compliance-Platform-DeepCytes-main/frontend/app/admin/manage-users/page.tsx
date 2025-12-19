'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertTriangle, Edit, Trash2, Search, Users, Building2, Shield } from 'lucide-react';
import { AdminNavigation } from '@/components/admin-navigation';
import { useAuth } from '@/components/auth-provider';
import { toast } from 'sonner';
import { API_ENDPOINTS } from '@/lib/config';

interface User {
  _id: string;
  email: string;
  userType: 'user' | 'company' | 'admin';
  profile: {
    name: string;
    phone?: string;
    companyName?: string;
    department?: string;
    isActive: boolean;
  };
  lastLogin?: string;
  createdAt: string;
}

export default function ManageUsers() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeTab, setActiveTab] = useState(searchParams.get('type') === 'company' ? 'companies' : 'individuals');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  // Check if user is authenticated and has admin permissions
  if (typeof window !== 'undefined' && (!user || user.userType !== 'admin')) {
    router.push('/auth/login');
    return null;
  }

  // Function to refresh the access token using the refresh token
  const refreshTokens = async (): Promise<boolean> => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        console.error('No refresh token found in localStorage');
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

  // Function to make authenticated requests with token refresh capability
  const authenticatedFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
    const updatedOptions = { 
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        ...(options.headers || {})
      }
    };

    let response = await fetch(url, updatedOptions);

    if (response.status === 403) {
      const refreshed = await refreshTokens();
      
      if (refreshed) {
        const retryOptions = { 
          ...options,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            ...(options.headers || {})
          }
        };
        
        response = await fetch(url, retryOptions);
      }
    }

    return response;
  };

  const fetchUsers = async () => {
    setLoading(true);
    setError(false);
    
    try {
      const response = await authenticatedFetch(API_ENDPOINTS.ADMIN.USERS);
      
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          toast.error('Session expired. Please log in again.');
          router.push('/auth/login');
          return;
        }
        throw new Error('Failed to fetch users');
      }
      
      const data = await response.json();
      setUsers(data.users || []);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(true);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchUsers();
  }, []);
  
  useEffect(() => {
    if (activeTab === 'individuals') {
      setFilteredUsers(
        users.filter(user => 
          user.userType === 'user' && 
          (user.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
           user.profile?.name?.toLowerCase().includes(searchTerm.toLowerCase()))
        )
      );
    } else if (activeTab === 'companies') {
      setFilteredUsers(
        users.filter(user => 
          user.userType === 'company' && 
          (user.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
           user.profile?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           user.profile?.companyName?.toLowerCase().includes(searchTerm.toLowerCase()))
        )
      );
    } else if (activeTab === 'admins') {
      setFilteredUsers(
        users.filter(user => 
          user.userType === 'admin' && 
          (user.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
           user.profile?.name?.toLowerCase().includes(searchTerm.toLowerCase()))
        )
      );
    }
  }, [users, searchTerm, activeTab]);
  
  const handleEdit = (user: User) => {
    router.push(`/admin/edit-user/${user._id}`);
  };
  
  const handleDeleteConfirm = async () => {
    if (!selectedUser) return;
    
    try {
      const response = await authenticatedFetch(`${API_ENDPOINTS.ADMIN.DELETE_USER}/${selectedUser._id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete user');
      }
      
      toast.success('User deleted successfully');
      fetchUsers();
    } catch (err) {
      console.error('Error deleting user:', err);
      toast.error('Failed to delete user');
    } finally {
      setIsDeleteDialogOpen(false);
      setSelectedUser(null);
    }
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <AdminNavigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Manage Users
            </h1>
            <p className="text-gray-300">
              View and manage all users in the platform
            </p>
          </div>
          <Button 
            onClick={() => router.push('/admin/add-user')}
            className="bg-gradient-security hover:opacity-90 text-white border-0"
          >
            Add New User
          </Button>
        </div>
        
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-white">User Management</CardTitle>
                <CardDescription className="text-gray-300">
                  Manage all user accounts and their access permissions
                </CardDescription>
              </div>
              
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white/10 border-white/20 text-white w-full md:w-[250px]"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList className="bg-white/10 border-white/20">
                <TabsTrigger value="individuals" className="data-[state=active]:bg-white/20">
                  <Users className="h-4 w-4 mr-2" />
                  Individual Users
                </TabsTrigger>
                <TabsTrigger value="companies" className="data-[state=active]:bg-white/20">
                  <Building2 className="h-4 w-4 mr-2" />
                  Companies
                </TabsTrigger>
                <TabsTrigger value="admins" className="data-[state=active]:bg-white/20">
                  <Shield className="h-4 w-4 mr-2" />
                  Admins
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="individuals" className="space-y-4">
                {loading ? (
                  <div className="flex justify-center py-10">
                    <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-400"></div>
                  </div>
                ) : error ? (
                  <div className="text-center py-10">
                    <AlertTriangle className="h-10 w-10 text-red-400 mx-auto mb-2" />
                    <p className="text-gray-300">Error loading users</p>
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-gray-300">No users found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="text-left py-3 px-4 text-gray-300">Name</th>
                          <th className="text-left py-3 px-4 text-gray-300">Email</th>
                          <th className="text-left py-3 px-4 text-gray-300">Department</th>
                          <th className="text-left py-3 px-4 text-gray-300">Joined</th>
                          <th className="text-left py-3 px-4 text-gray-300">Status</th>
                          <th className="text-right py-3 px-4 text-gray-300">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.map((user) => (
                          <tr key={user._id} className="border-b border-white/10">
                            <td className="py-3 px-4 text-white">{user.profile?.name || 'N/A'}</td>
                            <td className="py-3 px-4 text-gray-300">{user.email}</td>
                            <td className="py-3 px-4 text-gray-300">{user.profile?.department || 'N/A'}</td>
                            <td className="py-3 px-4 text-gray-400">{formatDate(user.createdAt)}</td>
                            <td className="py-3 px-4">
                              <Badge className={user.profile?.isActive ? 
                                "bg-green-500/20 text-green-300 border-green-500/30" : 
                                "bg-red-500/20 text-red-300 border-red-500/30"}>
                                {user.profile?.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex justify-end space-x-2">
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="text-blue-400 hover:bg-blue-400/10"
                                  onClick={() => handleEdit(user)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="text-red-400 hover:bg-red-400/10"
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setIsDeleteDialogOpen(true);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="companies" className="space-y-4">
                {loading ? (
                  <div className="flex justify-center py-10">
                    <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-400"></div>
                  </div>
                ) : error ? (
                  <div className="text-center py-10">
                    <AlertTriangle className="h-10 w-10 text-red-400 mx-auto mb-2" />
                    <p className="text-gray-300">Error loading companies</p>
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-gray-300">No companies found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="text-left py-3 px-4 text-gray-300">Company</th>
                          <th className="text-left py-3 px-4 text-gray-300">Contact</th>
                          <th className="text-left py-3 px-4 text-gray-300">Email</th>
                          <th className="text-left py-3 px-4 text-gray-300">Joined</th>
                          <th className="text-left py-3 px-4 text-gray-300">Status</th>
                          <th className="text-right py-3 px-4 text-gray-300">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.map((user) => (
                          <tr key={user._id} className="border-b border-white/10">
                            <td className="py-3 px-4 text-white">{user.profile?.companyName || 'N/A'}</td>
                            <td className="py-3 px-4 text-white">{user.profile?.name || 'N/A'}</td>
                            <td className="py-3 px-4 text-gray-300">{user.email}</td>
                            <td className="py-3 px-4 text-gray-400">{formatDate(user.createdAt)}</td>
                            <td className="py-3 px-4">
                              <Badge className={user.profile?.isActive ? 
                                "bg-green-500/20 text-green-300 border-green-500/30" : 
                                "bg-red-500/20 text-red-300 border-red-500/30"}>
                                {user.profile?.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex justify-end space-x-2">
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="text-blue-400 hover:bg-blue-400/10"
                                  onClick={() => handleEdit(user)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="text-red-400 hover:bg-red-400/10"
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setIsDeleteDialogOpen(true);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="admins" className="space-y-4">
                {loading ? (
                  <div className="flex justify-center py-10">
                    <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-400"></div>
                  </div>
                ) : error ? (
                  <div className="text-center py-10">
                    <AlertTriangle className="h-10 w-10 text-red-400 mx-auto mb-2" />
                    <p className="text-gray-300">Error loading admins</p>
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-gray-300">No admins found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="text-left py-3 px-4 text-gray-300">Name</th>
                          <th className="text-left py-3 px-4 text-gray-300">Email</th>
                          <th className="text-left py-3 px-4 text-gray-300">Last Login</th>
                          <th className="text-left py-3 px-4 text-gray-300">Joined</th>
                          <th className="text-left py-3 px-4 text-gray-300">Status</th>
                          <th className="text-right py-3 px-4 text-gray-300">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.map((user) => (
                          <tr key={user._id} className="border-b border-white/10">
                            <td className="py-3 px-4 text-white">{user.profile?.name || 'N/A'}</td>
                            <td className="py-3 px-4 text-gray-300">{user.email}</td>
                            <td className="py-3 px-4 text-gray-400">{user.lastLogin ? formatDate(user.lastLogin) : 'Never'}</td>
                            <td className="py-3 px-4 text-gray-400">{formatDate(user.createdAt)}</td>
                            <td className="py-3 px-4">
                              <Badge className={user.profile?.isActive ? 
                                "bg-green-500/20 text-green-300 border-green-500/30" : 
                                "bg-red-500/20 text-red-300 border-red-500/30"}>
                                {user.profile?.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex justify-end space-x-2">
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="text-blue-400 hover:bg-blue-400/10"
                                  onClick={() => handleEdit(user)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="text-red-400 hover:bg-red-400/10"
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setIsDeleteDialogOpen(true);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-slate-900 border-white/20 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Delete User</DialogTitle>
            <DialogDescription className="text-gray-300">
              Are you sure you want to delete this user? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          {selectedUser && (
            <div className="p-4 bg-white/10 rounded-lg my-2">
              <p><span className="text-gray-300">Name:</span> <span className="text-white">{selectedUser.profile?.name}</span></p>
              <p><span className="text-gray-300">Email:</span> <span className="text-white">{selectedUser.email}</span></p>
              <p><span className="text-gray-300">Type:</span> <span className="text-white capitalize">{selectedUser.userType}</span></p>
            </div>
          )}
          
          <DialogFooter>
            <Button
              className="bg-gradient-security hover:opacity-90 text-white border-0"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeleteConfirm}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
