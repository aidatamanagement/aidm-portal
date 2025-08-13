import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ArrowLeft, User, Zap, X, Shield, Mail, Building, Briefcase, Edit3, Save, AlertTriangle, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import AssignServiceModal from '@/components/AssignServiceModal';
import FolderExplorer from '@/components/FolderExplorer';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const AdminStudentDetail = () => {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [editMode, setEditMode] = useState(false);
  const [showAssignService, setShowAssignService] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    organization: '',
    organization_role: ''
  });

  // Service removal confirmation states
  const [removeServiceDialog, setRemoveServiceDialog] = useState({
    isOpen: false,
    service: null as any,
    confirmText: ''
  });



  // Services view mode
  const [servicesViewMode, setServicesViewMode] = useState<'list' | 'badges'>('list');

  const { data: student, isLoading } = useQuery({
    queryKey: ['admin-student', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: userServices } = useQuery({
    queryKey: ['admin-student-services', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_services')
        .select(`
          id,
          status,
          assigned_at,
          service_id,
          services:user_services_service_id_fkey (
            id,
            title,
            type,
            description
          )
        `)
        .eq('user_id', id);

      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });



  React.useEffect(() => {
    if (student) {
      setFormData({
        name: student.name || '',
        email: student.email || '',
        organization: student.organization || '',
        organization_role: student.organization_role || ''
      });
    }
  }, [student]);

  const updateStudentMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Student updated successfully');
      setEditMode(false);
      queryClient.invalidateQueries({ queryKey: ['admin-student', id] });
    },
    onError: (error) => {
      toast.error('Failed to update student');
      console.error('Update error:', error);
    },
  });

  const removeServiceMutation = useMutation({
    mutationFn: async (serviceId: string) => {
      const { error } = await supabase
        .from('user_services')
        .delete()
        .eq('user_id', id)
        .eq('service_id', serviceId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Service removed successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-student-services', id] });
    },
    onError: (error) => {
      toast.error('Failed to remove service');
      console.error('Remove service error:', error);
    },
  });



  const handleSave = () => {
    updateStudentMutation.mutate(formData);
  };





  const handleRemoveServiceClick = (userService: any) => {
    setRemoveServiceDialog({
      isOpen: true,
      service: userService,
      confirmText: ''
    });
  };

  const confirmRemoveService = () => {
    const serviceName = removeServiceDialog.service?.services?.title;
    if (removeServiceDialog.confirmText !== serviceName) {
      toast.error('Please type the service name to confirm removal');
      return;
    }

    if (removeServiceDialog.service) {
      removeServiceMutation.mutate(removeServiceDialog.service.service_id);
      setRemoveServiceDialog({
        isOpen: false,
        service: null,
        confirmText: ''
      });
    }
  };



  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0D5C4B]"></div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="text-center py-8">
        <p className="text-lg font-semibold text-muted-foreground">Student not found</p>
      </div>
    );
  }

  const assignedServiceIds = userServices?.map(us => us.service_id).filter(Boolean) || [];
  
  // Check if this is an admin user
  const isAdmin = student.role === 'admin';
  const themeColor = isAdmin ? 'bg-blue-600' : 'bg-primary';
  const themeColorHover = isAdmin ? 'hover:bg-blue-700' : 'hover:bg-primary/90';
  const textThemeColor = isAdmin ? 'text-blue-600' : 'text-primary';
  const borderThemeColor = isAdmin ? 'border-blue-600' : 'border-primary';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link to="/admin/students">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex items-center space-x-4">
          {student.profile_image && (
            <img 
              src={student.profile_image} 
              alt={student.name}
              className={`w-16 h-16 rounded-full object-cover border-2 ${borderThemeColor}`}
            />
          )}
          <div>
            <div className="flex items-center space-x-3">
              <h1 className={`text-3xl font-bold ${textThemeColor}`}>{student.name}</h1>
              {isAdmin && (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  <Shield className="h-4 w-4 mr-1" />
                  Admin
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">
              {isAdmin ? 'Manage admin profile and assignments' : 'Manage student profile and assignments'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Student Profile */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <User className={`h-5 w-5 ${textThemeColor}`} />
                <CardTitle>Profile Information</CardTitle>
              </div>
              <Button
                variant={editMode ? "default" : "outline"}
                onClick={() => editMode ? handleSave() : setEditMode(true)}
                disabled={updateStudentMutation.isPending}
                className={editMode ? `${themeColor} ${themeColorHover} text-white` : ''}
              >
                {editMode ? 'Save Changes' : 'Edit Profile'}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  disabled={!editMode}
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  disabled={!editMode}
                />
              </div>
              <div>
                <Label htmlFor="organization">Organization</Label>
                <Input
                  id="organization"
                  value={formData.organization}
                  onChange={(e) => setFormData({...formData, organization: e.target.value})}
                  disabled={!editMode}
                />
              </div>
              <div>
                <Label htmlFor="organization_role">Role in Organization</Label>
                <Input
                  id="organization_role"
                  value={formData.organization_role}
                  onChange={(e) => setFormData({...formData, organization_role: e.target.value})}
                  disabled={!editMode}
                />
              </div>
            </div>
          </CardContent>
        </Card>


      </div>

      {/* Services */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Zap className={`h-5 w-5 ${textThemeColor}`} />
              <CardTitle>Assigned Services ({userServices?.length || 0})</CardTitle>
              {userServices?.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setServicesViewMode(servicesViewMode === 'list' ? 'badges' : 'list')}
                  className="h-6 px-2 text-xs"
                >
                  {servicesViewMode === 'list' ? 'Compact' : 'Detailed'}
                </Button>
              )}
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowAssignService(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Assign Service
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {userServices?.length ? (
            servicesViewMode === 'list' ? (
              <div className="space-y-2">
                {userServices.map((userService: any) => (
                  <div key={userService.id} className="flex items-center justify-between py-2 px-3 bg-accent/30 rounded-md hover:bg-accent/50 transition-colors">
                    <div className="flex items-center space-x-3 flex-1">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium text-sm">{userService.services?.title}</h4>
                          <Badge variant="outline" className="text-xs capitalize">
                            {userService.services?.type}
                          </Badge>
                        </div>
                        {userService.services?.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                            {userService.services.description}
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(userService.assigned_at).toLocaleDateString()}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveServiceClick(userService)}
                      disabled={removeServiceMutation.isPending}
                      className="ml-2 h-8 w-8 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {userServices.map((userService: any) => (
                  <div key={userService.id} className="group relative">
                    <Badge 
                      variant="secondary" 
                      className="pr-6 cursor-pointer hover:bg-accent"
                      title={`${userService.services?.title} - ${userService.services?.type} - Assigned: ${new Date(userService.assigned_at).toLocaleDateString()}`}
                    >
                      {userService.services?.title}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveServiceClick(userService)}
                      disabled={removeServiceMutation.isPending}
                      className="absolute -top-1 -right-1 h-5 w-5 p-0 rounded-full bg-red-100 hover:bg-red-200 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3 text-red-600" />
                    </Button>
                  </div>
                ))}
              </div>
            )
          ) : (
            <div className="text-center py-6">
              <Zap className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No services assigned</p>
            </div>
          )}
        </CardContent>
      </Card>



      {/* Files Section */}
      <FolderExplorer 
        studentId={id!} 
        studentName={student.name}
        isAdmin={true}
      />

      {/* Modals */}
      <AssignServiceModal
        open={showAssignService}
        onOpenChange={setShowAssignService}
        studentId={id!}
        assignedServiceIds={assignedServiceIds}
      />

      {/* Service Removal Confirmation Dialog */}
      <AlertDialog open={removeServiceDialog.isOpen} onOpenChange={() => setRemoveServiceDialog({
        isOpen: false,
        service: null,
        confirmText: ''
      })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <span>Remove Service</span>
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                Are you sure you want to remove the service 
                "<strong>{removeServiceDialog.service?.services?.title}</strong>" from this student?
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <p className="text-sm text-yellow-800">
                  This will remove the student's access to this service. This action can be reversed by reassigning the service later.
                </p>
              </div>
              <div>
                <Label htmlFor="confirmRemove" className="text-sm font-medium">
                  Type <code className="bg-gray-100 px-1 rounded">{removeServiceDialog.service?.services?.title}</code> to confirm:
                </Label>
                <Input
                  id="confirmRemove"
                  value={removeServiceDialog.confirmText}
                  onChange={(e) => setRemoveServiceDialog(prev => ({
                    ...prev,
                    confirmText: e.target.value
                  }))}
                  placeholder="Type the service title here"
                  className="mt-1"
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRemoveServiceDialog({
              isOpen: false,
              service: null,
              confirmText: ''
            })}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRemoveService}
              disabled={removeServiceDialog.confirmText !== removeServiceDialog.service?.services?.title || removeServiceMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {removeServiceMutation.isPending ? 'Removing...' : 'Remove Service'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>


    </div>
  );
};

export default AdminStudentDetail;
