
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { User, Mail, Building, Edit, Camera, Save, X } from 'lucide-react';

const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    organization: '',
    organization_role: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      
      setProfile(data);
      setFormData({
        name: data.name || '',
        email: data.email || '',
        organization: data.organization || '',
        organization_role: data.organization_role || ''
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: formData.name,
          organization: formData.organization,
          organization_role: formData.organization_role
        })
        .eq('id', user?.id);

      if (error) throw error;
      
      toast.success('Profile updated successfully!');
      setIsEditing(false);
      fetchProfile();
    } catch (error: any) {
      toast.error('Failed to update profile: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    setUploading(true);

    try {
      // Create a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `profile-${user?.id}-${Date.now()}.${fileExt}`;

      // First, create the bucket if it doesn't exist (this will be handled by RLS)
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-images')
        .getPublicUrl(fileName);

      // Update profile with new image URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ profile_image: publicUrl })
        .eq('id', user?.id);

      if (updateError) throw updateError;

      toast.success('Profile image updated successfully!');
      fetchProfile();
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setFormData({
      name: profile?.name || '',
      email: profile?.email || '',
      organization: profile?.organization || '',
      organization_role: profile?.organization_role || ''
    });
  };

  if (loading) {
    return <div className="p-6">Loading profile...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Profile</h1>
        {!isEditing && (
          <Button 
            onClick={() => setIsEditing(true)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Edit className="h-4 w-4" />
            Edit Profile
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar Section */}
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Avatar className="h-20 w-20">
                <AvatarImage src={profile?.profile_image} alt={profile?.name} />
                <AvatarFallback className="bg-primary text-white text-lg">
                  {profile?.name?.charAt(0)?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              {isEditing && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full cursor-pointer">
                  <label htmlFor="profile-image" className="cursor-pointer">
                    <Camera className="h-6 w-6 text-white" />
                    <input
                      id="profile-image"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                      disabled={uploading}
                    />
                  </label>
                </div>
              )}
              {uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                </div>
              )}
            </div>
            <div>
              <h3 className="text-lg font-medium">{profile?.name}</h3>
              <p className="text-sm text-muted-foreground capitalize">{profile?.role}</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                <User className="h-4 w-4 inline mr-2" />
                Full Name
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter your full name"
                disabled={!isEditing}
                className={!isEditing ? "bg-muted" : ""}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">
                <Mail className="h-4 w-4 inline mr-2" />
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                disabled
                className="bg-muted"
                placeholder="Email cannot be changed"
              />
              <p className="text-xs text-muted-foreground">
                Email address cannot be changed. Contact support if needed.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="organization">
                <Building className="h-4 w-4 inline mr-2" />
                Organization
              </Label>
              <Input
                id="organization"
                value={formData.organization}
                onChange={(e) => handleInputChange('organization', e.target.value)}
                placeholder="Enter your organization"
                disabled={!isEditing}
                className={!isEditing ? "bg-muted" : ""}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="organization_role">Organization Role</Label>
              <Input
                id="organization_role"
                value={formData.organization_role}
                onChange={(e) => handleInputChange('organization_role', e.target.value)}
                placeholder="Enter your role in the organization"
                disabled={!isEditing}
                className={!isEditing ? "bg-muted" : ""}
              />
            </div>

            {isEditing && (
              <div className="flex gap-2">
                <Button type="submit" disabled={saving} className="flex-1">
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={cancelEdit}
                  className="flex-1"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Account Information */}
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-muted-foreground">Account Type:</span>
              <p className="text-foreground capitalize">{profile?.role}</p>
            </div>
            <div>
              <span className="font-medium text-muted-foreground">Member Since:</span>
              <p className="text-foreground">
                {profile?.created_at 
                  ? new Date(profile.created_at).toLocaleDateString()
                  : 'N/A'
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;
