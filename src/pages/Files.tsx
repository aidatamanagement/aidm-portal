import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ChevronRight, Plus, Upload } from 'lucide-react';
import FolderExplorer from '@/components/FolderExplorer';

const Files = () => {
  const { user } = useAuth();

  if (!user) {
    return <div className="p-6">Please log in to view your files.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div 
        className="bg-[#F9F9F9] rounded-[10px] p-8 border border-[#D9D9D9]"
        style={{ fontFamily: '"SF Pro Text", sans-serif' }}
      >
        {/* Breadcrumb Navigation */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Link 
              to="/dashboard" 
              className="text-[14px] text-slate-600 tracking-[-0.084px] hover:text-slate-800 transition-colors"
              style={{ fontFamily: '"SF Pro Text", sans-serif', lineHeight: '20px' }}
            >
              Home
            </Link>
            <ChevronRight className="h-5 w-5 text-slate-600" />
            <span 
              className="text-[14px] text-slate-600 tracking-[-0.084px]"
              style={{ fontFamily: '"SF Pro Text", sans-serif', lineHeight: '20px' }}
            >
              File Manager
            </span>
            <ChevronRight className="h-5 w-5 text-slate-600" />
            <span 
              className="text-[14px] text-[#026242] font-semibold tracking-[-0.084px]"
              style={{ fontFamily: '"SF Pro Text", sans-serif', lineHeight: '20px' }}
            >
              My Files
            </span>
          </div>
          
          {/* Add Button */}
          <Button 
            variant="outline" 
            size="icon"
            className="h-8 w-8 rounded-full border-slate-300 hover:bg-slate-50"
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>

        {/* Title and Upload Button */}
        <div className="flex items-center justify-between">
          <h1 
            className="text-[30px] font-bold text-slate-800 tracking-[-0.39px] leading-[38px]"
            style={{ fontFamily: 'Helvetica, sans-serif' }}
          >
            File Manager
          </h1>
          
          <Button 
            className="bg-[#026242] hover:bg-[#026242]/90 text-white px-4 py-2.5 rounded-[200px] flex items-center gap-2"
            style={{ fontFamily: '"SF Pro Text", sans-serif', fontSize: '14px', lineHeight: '20px', letterSpacing: '-0.084px' }}
          >
            <Upload className="h-5 w-5" />
            Upload File
          </Button>
        </div>
      </div>

      {/* File Explorer */}
      <FolderExplorer studentId={user.id} isAdmin={false} />
    </div>
  );
};

export default Files;
