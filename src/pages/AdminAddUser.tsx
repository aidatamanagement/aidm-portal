
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { UserPlus, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const AdminAddUser = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    organization: '',
    organization_role: '',
    role: 'student'
  });

  const createUserMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: data.email,
        password: data.password,
        email_confirm: true,
        user_metadata: {
          name: data.name,
          organization: data.organization,
          organization_role: data.organization_role,
          role: data.role
        }
      });

      if (authError) throw authError;

      // Update profile with additional info
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          name: data.name,
          organization: data.organization,
          organization_role: data.organization_role,
          role: data.role
        })
        .eq('id', authData.user.id);

      if (profileError) throw profileError;

      return authData.user;
    },
    onSuccess: (user) => {
      toast.success('User created successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-students'] });
      navigate(`/admin/students/${user.id}`);
    },
    onError: (error: any) => {
      toast.error(`Failed to create user: ${error.message}`);
      console.error('Create user error:', error);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.password) {
      toast.error('Please fill in all required fields');
      return;
    }

    createUserMutation.mutate(formData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link to="/admin/students">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-[#0D5C4B]">Add New User</h1>
          <p className="text-muted-foreground">Create a new student or admin account</p>
        </div>
      </div>

      {/* Form */}
      <Card className="max-w-2xl">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <UserPlus className="h-5 w-5 text-[#0D5C4B]" />
            <CardTitle>User Information</CardTitle>
          </div>
          <CardDescription>
            Fill in the details to create a new user account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter full name"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Enter email address"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                placeholder="Enter password (min 6 characters)"
                minLength={6}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="organization">Organization</Label>
                <Input
                  id="organization"
                  value={formData.organization}
                  onChange={(e) => handleInputChange('organization', e.target.value)}
                  placeholder="Company or organization"
                />
              </div>
              
              <div>
                <Label htmlFor="organization_role">Role in Organization</Label>
                <Input
                  id="organization_role"
                  value={formData.organization_role}
                  onChange={(e) => handleInputChange('organization_role', e.target.value)}
                  placeholder="Job title or position"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="role">System Role</Label>
              <Select value={formData.role} onValueChange={(value) => handleInputChange('role', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex space-x-4">
              <Button
                type="submit"
                className="bg-[#0D5C4B] hover:bg-green-700"
                disabled={createUserMutation.isPending}
              >
                {createUserMutation.isPending ? 'Creating User...' : 'Create User'}
              </Button>
              
              <Link to="/admin/students">
                <Button variant="outline">Cancel</Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAddUser;
