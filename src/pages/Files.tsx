import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import FolderExplorer from '@/components/FolderExplorer';

const Files = () => {
  const { user } = useAuth();

  if (!user) {
    return <div className="p-6">Please log in to view your files.</div>;
  }

  return (
    <div className="space-y-6">
      <FolderExplorer studentId={user.id} isAdmin={false} />
    </div>
  );
};

export default Files;
