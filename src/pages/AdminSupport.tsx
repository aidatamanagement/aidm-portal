
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare } from 'lucide-react';
import AdminChatDashboard from '@/components/AdminChatDashboard';

const AdminSupport = () => {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Support Management</h1>
        <p className="text-gray-600">Manage customer support chats and conversations</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MessageSquare className="h-5 w-5 mr-2" />
            Live Chat Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AdminChatDashboard />
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSupport;
