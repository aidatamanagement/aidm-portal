
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Zap, Plus, Users, Search } from 'lucide-react';

const AdminServices = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedService, setSelectedService] = useState<string>('');
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);

  // Set up real-time subscriptions
  useEffect(() => {
    console.log('Setting up real-time subscriptions for AdminServices');

    const userServicesChannel = supabase
      .channel('admin_services_user_services')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_services'
        },
        (payload) => {
          console.log('User services change detected in AdminServices:', payload);
          queryClient.invalidateQueries({ queryKey: ['admin-user-services'] });
        }
      )
      .subscribe();

    const servicesChannel = supabase
      .channel('admin_services_services')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'services'
        },
        (payload) => {
          console.log('Services change detected in AdminServices:', payload);
          queryClient.invalidateQueries({ queryKey: ['admin-services'] });
        }
      )
      .subscribe();

    const profilesChannel = supabase
      .channel('admin_services_profiles')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles'
        },
        (payload) => {
          console.log('Profiles change detected in AdminServices:', payload);
          queryClient.invalidateQueries({ queryKey: ['admin-students-list'] });
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up AdminServices real-time subscriptions');
      supabase.removeChannel(userServicesChannel);
      supabase.removeChannel(servicesChannel);
      supabase.removeChannel(profilesChannel);
    };
  }, [queryClient]);

  const { data: services, isLoading: servicesLoading } = useQuery({
    queryKey: ['admin-services'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const { data: students } = useQuery({
    queryKey: ['admin-students-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email')
        .eq('role', 'student')
        .order('name');

      if (error) throw error;
      return data || [];
    },
  });

  const { data: userServices } = useQuery({
    queryKey: ['admin-user-services'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_services')
        .select(`
          *,
          profiles (name, email),
          services (title)
        `);

      if (error) throw error;
      return data || [];
    },
    refetchInterval: 2000, // Backup polling every 2 seconds
  });

  const assignServiceMutation = useMutation({
    mutationFn: async ({ serviceId, studentId }: { serviceId: string; studentId: string }) => {
      const { error } = await supabase
        .from('user_services')
        .insert({
          service_id: serviceId,
          user_id: studentId,
          status: 'active'
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Service assigned successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-user-services'] });
      setAssignDialogOpen(false);
      setSelectedService('');
      setSelectedStudent('');
    },
    onError: (error: any) => {
      toast.error(`Failed to assign service: ${error.message}`);
    },
  });

  const unassignServiceMutation = useMutation({
    mutationFn: async (userServiceId: string) => {
      const { error } = await supabase
        .from('user_services')
        .delete()
        .eq('id', userServiceId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Service unassigned successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-user-services'] });
    },
    onError: (error: any) => {
      toast.error(`Failed to unassign service: ${error.message}`);
    },
  });

  const filteredServices = services?.filter(service =>
    service.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAssignService = () => {
    if (!selectedService || !selectedStudent) {
      toast.error('Please select both a service and a student');
      return;
    }

    assignServiceMutation.mutate({
      serviceId: selectedService,
      studentId: selectedStudent
    });
  };

  if (servicesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0D5C4B]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-3xl font-bold text-[#0D5C4B]">Service Management</h1>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          </div>
          <p className="text-muted-foreground">Manage services and student assignments (real-time)</p>
        </div>
        <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#0D5C4B] hover:bg-green-700">
              <Plus className="h-4 w-4 mr-2" />
              Assign Service
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign Service to Student</DialogTitle>
              <DialogDescription>
                Select a service and student to create a new assignment.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Service</label>
                <Select value={selectedService} onValueChange={setSelectedService}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a service" />
                  </SelectTrigger>
                  <SelectContent>
                    {services?.map((service) => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.title} ({service.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Student</label>
                <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a student" />
                  </SelectTrigger>
                  <SelectContent>
                    {students?.map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.name} - {student.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex space-x-2">
                <Button 
                  onClick={handleAssignService}
                  disabled={assignServiceMutation.isPending}
                  className="bg-[#0D5C4B] hover:bg-green-700"
                >
                  {assignServiceMutation.isPending ? 'Assigning...' : 'Assign Service'}
                </Button>
                <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="h-5 w-5" />
            <span>Search Services</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Search by service name or type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </CardContent>
      </Card>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredServices?.map((service) => {
          const assignedCount = userServices?.filter(us => us.service_id === service.id).length || 0;
          
          return (
            <Card key={service.id} className="hover:shadow-md transition-all duration-300">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-2">
                    <Zap className="h-5 w-5 text-[#0D5C4B]" />
                    <CardTitle className="text-lg">{service.title}</CardTitle>
                  </div>
                  <Badge variant="outline" className="capitalize">
                    {service.type}
                  </Badge>
                </div>
                {service.description && (
                  <CardDescription>{service.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Assigned Students:</span>
                    <div className="flex items-center space-x-1">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium transition-all duration-300">{assignedCount}</span>
                    </div>
                  </div>
                  <Badge variant={service.status === 'active' ? 'default' : 'secondary'}>
                    {service.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Service Assignments Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <CardTitle>Current Service Assignments</CardTitle>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          </div>
          <CardDescription>View and manage student service assignments (real-time updates)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-h-96 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assigned Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userServices?.map((assignment: any) => (
                  <TableRow key={assignment.id} className="hover:bg-accent/50 transition-colors">
                    <TableCell>
                      <div>
                        <p className="font-medium">{assignment.profiles?.name}</p>
                        <p className="text-sm text-muted-foreground">{assignment.profiles?.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>{assignment.services?.title}</TableCell>
                    <TableCell>
                      <Badge variant={assignment.status === 'active' ? 'default' : 'secondary'}>
                        {assignment.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(assignment.assigned_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => unassignServiceMutation.mutate(assignment.id)}
                        disabled={unassignServiceMutation.isPending}
                      >
                        Unassign
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminServices;
