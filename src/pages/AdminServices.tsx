import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Zap, Plus, Users, Search, Filter, ArrowUpDown, Edit, Trash2, AlertTriangle } from 'lucide-react';

const AdminServices = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedService, setSelectedService] = useState<string>('');
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  
  // Assignment table filters and search
  const [assignmentSearchTerm, setAssignmentSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [serviceFilter, setServiceFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('date-desc');

  // Service form states
  const [serviceFormOpen, setServiceFormOpen] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  const [serviceTitle, setServiceTitle] = useState('');
  const [serviceDescription, setServiceDescription] = useState('');
  const [serviceType, setServiceType] = useState('');
  const [serviceStatus, setServiceStatus] = useState('active');
  const [deleteServiceId, setDeleteServiceId] = useState<string | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // Assigned students modal states
  const [assignedStudentsModalOpen, setAssignedStudentsModalOpen] = useState(false);
  const [selectedServiceForStudents, setSelectedServiceForStudents] = useState<any>(null);
  const [studentsSearchTerm, setStudentsSearchTerm] = useState('');
  const [unassignConfirmOpen, setUnassignConfirmOpen] = useState(false);
  const [studentToUnassign, setStudentToUnassign] = useState<any>(null);
  const [unassignConfirmText, setUnassignConfirmText] = useState('');

  // Set up real-time subscriptions
  useEffect(() => {
    console.log('Setting up real-time subscriptions for AdminServices');

    const userServicesChannel = supabase
      .channel('admin-user-services-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_services'
        },
        (payload) => {
          console.log('Real-time user services change:', payload);
          queryClient.invalidateQueries({ queryKey: ['admin-services'] });
          queryClient.invalidateQueries({ queryKey: ['admin-user-services'] });
          queryClient.invalidateQueries({ queryKey: ['admin-service-assignment-counts'] });
        }
      )
      .subscribe();

    const servicesChannel = supabase
      .channel('admin-services-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'services'
        },
        (payload) => {
          console.log('Real-time services change:', payload);
          queryClient.invalidateQueries({ queryKey: ['admin-services'] });
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up AdminServices real-time subscriptions');
      supabase.removeChannel(userServicesChannel);
      supabase.removeChannel(servicesChannel);
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
          profiles!fk_user_services_user_id(name, email),
          services!user_services_service_id_fkey(title)
        `);

      if (error) {
        console.error('Error fetching user services:', error);
        throw error;
      }
      
      console.log('User services data:', data);
      return data || [];
    },
  });

  // Get service assignment counts
  const { data: serviceAssignmentCounts } = useQuery({
    queryKey: ['admin-service-assignment-counts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_services')
        .select('service_id, status');

      if (error) {
        console.error('Error fetching service assignment counts:', error);
        throw error;
      }
      
      // Count assignments per service
      const counts: { [key: string]: number } = {};
      data?.forEach((assignment) => {
        const serviceId = assignment.service_id;
        if (assignment.status === 'active') {
          counts[serviceId] = (counts[serviceId] || 0) + 1;
        }
      });
      
      console.log('Service assignment counts:', counts);
      return counts;
    },
  });

  // Filter and sort assignments
  const filteredAndSortedAssignments = useMemo(() => {
    if (!userServices) return [];

    let filtered = userServices.filter((assignment: any) => {
      // Search filter
      const matchesSearch = assignmentSearchTerm === '' || 
        assignment.profiles?.name?.toLowerCase().includes(assignmentSearchTerm.toLowerCase()) ||
        assignment.profiles?.email?.toLowerCase().includes(assignmentSearchTerm.toLowerCase()) ||
        assignment.services?.title?.toLowerCase().includes(assignmentSearchTerm.toLowerCase());

      // Status filter
      const matchesStatus = statusFilter === 'all' || assignment.status === statusFilter;

      // Service filter
      const matchesService = serviceFilter === 'all' || assignment.service_id === serviceFilter;

      return matchesSearch && matchesStatus && matchesService;
    });

    // Sort assignments
    filtered.sort((a: any, b: any) => {
      switch (sortBy) {
        case 'name-asc':
          return (a.profiles?.name || '').localeCompare(b.profiles?.name || '');
        case 'name-desc':
          return (b.profiles?.name || '').localeCompare(a.profiles?.name || '');
        case 'service-asc':
          return (a.services?.title || '').localeCompare(b.services?.title || '');
        case 'service-desc':
          return (b.services?.title || '').localeCompare(a.services?.title || '');
        case 'status-asc':
          return a.status.localeCompare(b.status);
        case 'status-desc':
          return b.status.localeCompare(a.status);
        case 'date-asc':
          return new Date(a.assigned_at).getTime() - new Date(b.assigned_at).getTime();
        case 'date-desc':
        default:
          return new Date(b.assigned_at).getTime() - new Date(a.assigned_at).getTime();
      }
    });

    return filtered;
  }, [userServices, assignmentSearchTerm, statusFilter, serviceFilter, sortBy]);

  const createServiceMutation = useMutation({
    mutationFn: async (serviceData: any) => {
      const { error } = await supabase
        .from('services')
        .insert(serviceData);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Service created successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-services'] });
      resetServiceForm();
      setServiceFormOpen(false);
    },
    onError: (error: any) => {
      toast.error(`Failed to create service: ${error.message}`);
    },
  });

  const updateServiceMutation = useMutation({
    mutationFn: async ({ id, serviceData }: { id: string; serviceData: any }) => {
      const { error } = await supabase
        .from('services')
        .update(serviceData)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Service updated successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-services'] });
      resetServiceForm();
      setServiceFormOpen(false);
    },
    onError: (error: any) => {
      toast.error(`Failed to update service: ${error.message}`);
    },
  });

  const deleteServiceMutation = useMutation({
    mutationFn: async (serviceId: string) => {
      // First, delete all user service assignments
      const { error: userServicesError } = await supabase
        .from('user_services')
        .delete()
        .eq('service_id', serviceId);

      if (userServicesError) throw userServicesError;

      // Then delete the service
      const { error: serviceError } = await supabase
        .from('services')
        .delete()
        .eq('id', serviceId);

      if (serviceError) throw serviceError;
    },
    onSuccess: () => {
      toast.success('Service deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-services'] });
      queryClient.invalidateQueries({ queryKey: ['admin-user-services'] });
      queryClient.invalidateQueries({ queryKey: ['admin-service-assignment-counts'] });
      setDeleteServiceId(null);
      setDeleteConfirmText('');
    },
    onError: (error: any) => {
      toast.error(`Failed to delete service: ${error.message}`);
    },
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
      queryClient.invalidateQueries({ queryKey: ['admin-service-assignment-counts'] });
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
      queryClient.invalidateQueries({ queryKey: ['admin-service-assignment-counts'] });
    },
    onError: (error: any) => {
      toast.error(`Failed to unassign service: ${error.message}`);
    },
  });

  const getAssignedStudentCount = (serviceId: string) => {
    return serviceAssignmentCounts?.[serviceId] || 0;
  };

  const getAssignedStudentsForService = (serviceId: string) => {
    return userServices?.filter(assignment => 
      assignment.service_id === serviceId && assignment.status === 'active'
    ) || [];
  };

  const handleShowAssignedStudents = (service: any) => {
    setSelectedServiceForStudents(service);
    setStudentsSearchTerm('');
    setAssignedStudentsModalOpen(true);
  };

  const handleUnassignClick = (assignment: any) => {
    setStudentToUnassign(assignment);
    setUnassignConfirmText('');
    setUnassignConfirmOpen(true);
  };

  const confirmUnassignStudent = () => {
    if (studentToUnassign) {
      unassignServiceMutation.mutate(studentToUnassign.id);
      setUnassignConfirmOpen(false);
      setStudentToUnassign(null);
      setUnassignConfirmText('');
    }
  };

  const filterAssignedStudents = (assignments: any[]) => {
    if (!studentsSearchTerm) return assignments;
    
    return assignments.filter(assignment =>
      assignment.profiles?.name?.toLowerCase().includes(studentsSearchTerm.toLowerCase()) ||
      assignment.profiles?.email?.toLowerCase().includes(studentsSearchTerm.toLowerCase())
    );
  };

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

  const clearAssignmentFilters = () => {
    setAssignmentSearchTerm('');
    setStatusFilter('all');
    setServiceFilter('all');
    setSortBy('date-desc');
  };

  const resetServiceForm = () => {
    setServiceTitle('');
    setServiceDescription('');
    setServiceType('');
    setServiceStatus('active');
    setEditingService(null);
  };

  const handleCreateService = () => {
    resetServiceForm();
    setServiceFormOpen(true);
  };

  const handleEditService = (service: any) => {
    setEditingService(service);
    setServiceTitle(service.title || '');
    setServiceDescription(service.description || '');
    setServiceType(service.type || '');
    setServiceStatus(service.status || 'active');
    setServiceFormOpen(true);
  };

  const handleSubmitService = () => {
    if (!serviceTitle.trim()) {
      toast.error('Service title is required');
      return;
    }

    if (!serviceType.trim()) {
      toast.error('Service type is required');
      return;
    }

    const serviceData = {
      title: serviceTitle.trim(),
      description: serviceDescription.trim() || null,
      type: serviceType.trim(),
      status: serviceStatus
    };

    if (editingService) {
      updateServiceMutation.mutate({ id: editingService.id, serviceData });
    } else {
      createServiceMutation.mutate(serviceData);
    }
  };

  const handleDeleteService = (serviceId: string) => {
    setDeleteServiceId(serviceId);
    setDeleteConfirmText('');
  };

  const confirmDeleteService = () => {
    const service = services?.find(s => s.id === deleteServiceId);
    if (!service) return;

    if (deleteConfirmText !== service.title) {
      toast.error('Please type the service title to confirm deletion');
      return;
    }

    deleteServiceMutation.mutate(deleteServiceId!);
  };

  if (servicesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0D5C4B]"></div>
      </div>
    );
  }

  const serviceToDelete = services?.find(s => s.id === deleteServiceId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-[#0D5C4B]">Service Management</h1>
          <p className="text-muted-foreground">Manage services and student assignments</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={handleCreateService} className="bg-[#0D5C4B] hover:bg-green-700">
            <Plus className="h-4 w-4 mr-2" />
            Create Service
          </Button>
        <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
          <DialogTrigger asChild>
              <Button variant="outline">
                <Users className="h-4 w-4 mr-2" />
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
          const assignedCount = getAssignedStudentCount(service.id);
          
          return (
            <Card key={service.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-2">
                    <Zap className="h-5 w-5 text-[#0D5C4B]" />
                    <CardTitle className="text-lg">{service.title}</CardTitle>
                  </div>
                  <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="capitalize">
                    {service.type}
                  </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditService(service)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteService(service.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {service.description && (
                  <CardDescription>{service.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Assigned Students:</span>
                    <div 
                      className="flex items-center space-x-1 cursor-pointer hover:bg-gray-100 rounded-md px-2 py-1 transition-colors"
                      onClick={() => handleShowAssignedStudents(service)}
                      title="Click to view assigned students"
                    >
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-[#0D5C4B] text-lg">{assignedCount}</span>
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

      {/* Service Form Modal */}
      <Dialog open={serviceFormOpen} onOpenChange={setServiceFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingService ? 'Edit Service' : 'Create New Service'}</DialogTitle>
            <DialogDescription>
              {editingService ? 'Update the service details below.' : 'Fill in the details to create a new service.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="serviceTitle">Service Title</Label>
              <Input
                id="serviceTitle"
                value={serviceTitle}
                onChange={(e) => setServiceTitle(e.target.value)}
                placeholder="Enter service title"
              />
            </div>
            <div>
              <Label htmlFor="serviceDescription">Description</Label>
              <Textarea
                id="serviceDescription"
                value={serviceDescription}
                onChange={(e) => setServiceDescription(e.target.value)}
                placeholder="Enter service description (optional)"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="serviceType">Service Type</Label>
              <Input
                id="serviceType"
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
                placeholder="e.g., consulting, training, support"
              />
            </div>
            <div>
              <Label htmlFor="serviceStatus">Status</Label>
              <Select value={serviceStatus} onValueChange={setServiceStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setServiceFormOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitService}
              disabled={createServiceMutation.isPending || updateServiceMutation.isPending}
              className="bg-[#0D5C4B] hover:bg-green-700"
            >
              {(createServiceMutation.isPending || updateServiceMutation.isPending) 
                ? (editingService ? 'Updating...' : 'Creating...') 
                : (editingService ? 'Update Service' : 'Create Service')
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteServiceId} onOpenChange={() => setDeleteServiceId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <span>Delete Service</span>
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                This action <strong>cannot be undone</strong>. This will permanently delete the service 
                "<strong>{serviceToDelete?.title}</strong>" and remove all student assignments.
              </p>
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-800 font-medium mb-2">
                  This will also delete:
                </p>
                <ul className="text-sm text-red-700 list-disc list-inside space-y-1">
                  <li>All student assignments for this service</li>
                  <li>Service history and data</li>
                </ul>
              </div>
              <div>
                <Label htmlFor="confirmDelete" className="text-sm font-medium">
                  Type <code className="bg-gray-100 px-1 rounded">{serviceToDelete?.title}</code> to confirm:
                </Label>
                <Input
                  id="confirmDelete"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="Type the service title here"
                  className="mt-1"
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteConfirmText('')}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteService}
              disabled={deleteConfirmText !== serviceToDelete?.title || deleteServiceMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteServiceMutation.isPending ? 'Deleting...' : 'Delete Service'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Assigned Students Modal */}
      <Dialog open={assignedStudentsModalOpen} onOpenChange={setAssignedStudentsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-[#0D5C4B]" />
              <span>Students Assigned to "{selectedServiceForStudents?.title}"</span>
            </DialogTitle>
            <DialogDescription>
              View all students currently assigned to this service
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedServiceForStudents && (() => {
              const assignedStudents = getAssignedStudentsForService(selectedServiceForStudents.id);
              const filteredStudents = filterAssignedStudents(assignedStudents);
              
              return assignedStudents.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Students Assigned</h3>
                  <p className="text-gray-600">
                    This service has no active student assignments.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      {filteredStudents.length} of {assignedStudents.length} student{assignedStudents.length !== 1 ? 's' : ''} {filteredStudents.length !== assignedStudents.length ? 'shown' : 'assigned'}
                    </div>
                  </div>
                  
                  {/* Search Input */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search students by name or email..."
                      value={studentsSearchTerm}
                      onChange={(e) => setStudentsSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  <div className="max-h-96 overflow-y-auto space-y-2">
                    {filteredStudents.length === 0 ? (
                      <div className="text-center py-4 text-gray-500">
                        No students match your search criteria
                      </div>
                    ) : (
                      filteredStudents.map((assignment: any) => (
                        <div key={assignment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-[#0D5C4B] rounded-full flex items-center justify-center">
                              <span className="text-white font-medium text-sm">
                                {assignment.profiles?.name?.charAt(0)?.toUpperCase() || 'U'}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {assignment.profiles?.name || 'Unknown User'}
                              </p>
                              <p className="text-sm text-gray-600">
                                {assignment.profiles?.email || 'No email'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <Badge variant={assignment.status === 'active' ? 'default' : 'secondary'}>
                              {assignment.status}
                            </Badge>
                            <div className="text-xs text-gray-500">
                              Assigned {new Date(assignment.assigned_at).toLocaleDateString()}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUnassignClick(assignment)}
                              disabled={unassignServiceMutation.isPending}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              Unassign
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignedStudentsModalOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unassign Confirmation Dialog */}
      <AlertDialog open={unassignConfirmOpen} onOpenChange={setUnassignConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unassign Student</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to unassign "<strong>{studentToUnassign?.profiles?.name}</strong>" from the service "<strong>{selectedServiceForStudents?.title}</strong>"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
              <p className="text-sm text-yellow-800">
                This will remove the student's access to this service. This action can be reversed by reassigning the service later.
              </p>
            </div>
            <div>
              <Label htmlFor="confirmUnassign">
                Type <code className="bg-gray-100 px-1 rounded">OK</code> to confirm:
              </Label>
              <Input
                id="confirmUnassign"
                value={unassignConfirmText}
                onChange={(e) => setUnassignConfirmText(e.target.value)}
                placeholder="Type OK to confirm"
                className="mt-1"
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setUnassignConfirmOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmUnassignStudent}
              disabled={unassignConfirmText !== 'OK' || unassignServiceMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {unassignServiceMutation.isPending ? 'Unassigning...' : 'Unassign Student'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Service Assignments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Current Service Assignments</CardTitle>
          <CardDescription>View and manage student service assignments</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Assignment Filters and Search */}
          <div className="mb-4 space-y-4">
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-64">
                <label className="text-sm font-medium mb-2 block">Search Assignments</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by student name, email, or service..."
                    value={assignmentSearchTerm}
                    onChange={(e) => setAssignmentSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="min-w-32">
                <label className="text-sm font-medium mb-2 block">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="min-w-48">
                <label className="text-sm font-medium mb-2 block">Service</label>
                <Select value={serviceFilter} onValueChange={setServiceFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Services</SelectItem>
                    {services?.map((service) => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="min-w-40">
                <label className="text-sm font-medium mb-2 block">Sort By</label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date-desc">Date (Newest)</SelectItem>
                    <SelectItem value="date-asc">Date (Oldest)</SelectItem>
                    <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                    <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                    <SelectItem value="service-asc">Service (A-Z)</SelectItem>
                    <SelectItem value="service-desc">Service (Z-A)</SelectItem>
                    <SelectItem value="status-asc">Status (A-Z)</SelectItem>
                    <SelectItem value="status-desc">Status (Z-A)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                variant="outline" 
                onClick={clearAssignmentFilters}
                className="h-10"
              >
                <Filter className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto border rounded-md">
          <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assigned Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
                {filteredAndSortedAssignments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      {userServices?.length === 0 ? 'No service assignments found' : 'No assignments match your filters'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAndSortedAssignments.map((assignment: any) => (
                <TableRow key={assignment.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{assignment.profiles?.name || 'Unknown User'}</p>
                      <p className="text-sm text-muted-foreground">{assignment.profiles?.email || 'No email'}</p>
                    </div>
                  </TableCell>
                  <TableCell>{assignment.services?.title || 'Unknown Service'}</TableCell>
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
                          onClick={() => handleUnassignClick(assignment)}
                      disabled={unassignServiceMutation.isPending}
                    >
                      Unassign
                    </Button>
                  </TableCell>
                </TableRow>
                  ))
                )}
            </TableBody>
          </Table>
          </div>
          {filteredAndSortedAssignments.length > 0 && (
            <div className="mt-2 text-sm text-muted-foreground text-center">
              Showing {filteredAndSortedAssignments.length} of {userServices?.length || 0} assignment{(userServices?.length || 0) !== 1 ? 's' : ''}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminServices;
