
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Lock, CheckCircle, Clock } from 'lucide-react';

const Services = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [services, setServices] = useState<any[]>([]);
  const [userServices, setUserServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchServices();
      fetchUserServices();
    }
  }, [user]);

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('title');

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserServices = async () => {
    try {
      const { data, error } = await supabase
        .from('user_services')
        .select('*')
        .eq('user_id', user?.id);

      if (error) throw error;
      setUserServices(data || []);
    } catch (error) {
      console.error('Error fetching user services:', error);
    }
  };

  const getUserServiceStatus = (serviceId: string) => {
    const userService = userServices.find(us => us.service_id === serviceId);
    return userService?.status || 'locked';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      default:
        return <Lock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      default:
        return <Badge variant="outline" className="bg-gray-100 text-gray-600">Locked</Badge>;
    }
  };

  const handleServiceClick = (service: any, status: string) => {
    if (status === 'locked') return;
    
    // If it's AI Leadership Training service, navigate to courses
    if (service.title?.toLowerCase().includes('leadership') || service.title?.toLowerCase().includes('training')) {
      navigate('/courses');
    } else {
      // Handle other services as needed
      console.log('Accessing service:', service.title);
    }
  };

  if (loading) {
    return <div className="p-6">Loading services...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Services</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service) => {
          const status = getUserServiceStatus(service.id);
          const isLocked = status === 'locked';

          return (
            <Card 
              key={service.id} 
              className={`hover:shadow-md transition-shadow ${
                isLocked ? 'opacity-60' : 'cursor-pointer'
              }`}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(status)}
                    <CardTitle className="text-lg">{service.title}</CardTitle>
                  </div>
                  {getStatusBadge(status)}
                </div>
                {service.description && (
                  <CardDescription>{service.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <span className="text-sm font-medium text-gray-700">Type: </span>
                    <span className="text-sm text-gray-600 capitalize">{service.type}</span>
                  </div>

                  <Button 
                    className="w-full" 
                    disabled={isLocked}
                    variant={isLocked ? "outline" : "default"}
                    onClick={() => handleServiceClick(service, status)}
                  >
                    {isLocked ? (
                      <>
                        <Lock className="h-4 w-4 mr-2" />
                        Locked
                      </>
                    ) : status === 'pending' ? (
                      'View Details'
                    ) : (
                      'Access Service'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {services.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <CheckCircle className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No services available</h3>
            <p className="text-gray-600">Check back later for new services.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Services;
