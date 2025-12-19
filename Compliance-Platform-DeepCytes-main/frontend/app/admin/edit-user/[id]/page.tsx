'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
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

export default function EditUser({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [userData, setUserData] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    companyName: '',
    department: '',
    userType: '',
    isActive: true
  });
  
  // Check if user is authenticated and has admin permissions
  useEffect(() => {
    if (typeof window !== 'undefined' && (!user || user?.userType !== 'admin')) {
      router.push('/auth/login');
    }
  }, [user, router]);

  // Fetch user data
  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_ENDPOINTS.ADMIN.GET_USER}/${params.id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch user data');
        }
        
        const data = await response.json();
        setUserData(data.user);
        setFormData({
          name: data.user.profile?.name || '',
          phone: data.user.profile?.phone || '',
          companyName: data.user.profile?.companyName || '',
          department: data.user.profile?.department || '',
          userType: data.user.userType,
          isActive: data.user.profile?.isActive !== false
        });
      } catch (error) {
        console.error('Error fetching user:', error);
        toast.error('Failed to load user data');
        router.push('/admin/manage-users');
      } finally {
        setLoading(false);
      }
    };
    
    if (params.id) {
      fetchUser();
    }
  }, [params.id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSelectChange = (value: string) => {
    setFormData({
      ...formData,
      userType: value
    });
  };

  const handleActiveChange = (checked: boolean) => {
    setFormData({
      ...formData,
      isActive: checked
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    
    try {
      const response = await fetch(`${API_ENDPOINTS.ADMIN.UPDATE_USER}/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          companyName: formData.companyName,
          department: formData.department,
          userType: formData.userType,
          isActive: formData.isActive
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update user');
      }
      
      toast.success('User updated successfully');
      router.push('/admin/manage-users');
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast.error(error.message || 'Error updating user');
    } finally {
      setUpdating(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <AdminNavigation />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Edit User</h1>
          <p className="text-gray-300">Update user information and settings</p>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-400"></div>
          </div>
        ) : !userData ? (
          <div className="text-center py-10">
            <p className="text-white text-lg">User not found</p>
            <Button
              onClick={() => router.push('/admin/manage-users')}
              className="bg-gradient-security hover:opacity-90 text-white border-0"
            >
              Back to User Management
            </Button>
          </div>
        ) : (
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader>
              <CardTitle className="text-white">User Information</CardTitle>
              <CardDescription className="text-gray-300">
                Edit the user details below
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white">Email Address</Label>
                    <Input
                      id="email"
                      value={userData.email}
                      disabled
                      className="bg-white/10 border-white/20 text-gray-400"
                    />
                    <p className="text-xs text-gray-400">Email cannot be changed</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-white">Full Name</Label>
                    <Input
                      id="name"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-white">Phone Number</Label>
                    <Input
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="userType" className="text-white">User Type</Label>
                    <Select 
                      value={formData.userType} 
                      onValueChange={handleSelectChange}
                      disabled={user?.userType !== 'admin'}
                    >
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
                        <SelectValue placeholder="Select user type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">Individual User</SelectItem>
                        <SelectItem value="company">Company</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    {user?.userType !== 'admin' && (
                      <p className="text-xs text-gray-400">Only admins can change user types</p>
                    )}
                  </div>
                  
                  {formData.userType === 'company' && (
                    <div className="space-y-2">
                      <Label htmlFor="companyName" className="text-white">Company Name</Label>
                      <Input
                        id="companyName"
                        name="companyName"
                        value={formData.companyName}
                        onChange={handleInputChange}
                        className="bg-white/10 border-white/20 text-white"
                      />
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="department" className="text-white">Department</Label>
                    <Input
                      id="department"
                      name="department"
                      value={formData.department}
                      onChange={handleInputChange}
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-white">Account Status</Label>
                    <p className="text-gray-400 text-sm">Set whether this account is active</p>
                  </div>
                  <Switch
                    checked={formData.isActive}
                    onCheckedChange={handleActiveChange}
                  />
                </div>
                
                <div className="pt-4 border-t border-white/10">
                  <div className="flex flex-col space-y-2">
                    <div className="text-gray-300 text-sm">
                      <span className="font-medium">User ID:</span> {userData._id}
                    </div>
                    <div className="text-gray-300 text-sm">
                      <span className="font-medium">Created:</span> {new Date(userData.createdAt).toLocaleDateString()}
                    </div>
                    {userData.lastLogin && (
                      <div className="text-gray-300 text-sm">
                        <span className="font-medium">Last Login:</span> {new Date(userData.lastLogin).toLocaleDateString()} {new Date(userData.lastLogin).toLocaleTimeString()}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3">
                  <Button
                    type="button"
                    className="bg-gradient-security hover:opacity-90 text-white border-0"
                    onClick={() => router.push('/admin/manage-users')}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={updating}
                    className="bg-gradient-security hover:opacity-90 text-white border-0"
                  >
                    {updating ? 'Saving Changes...' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
