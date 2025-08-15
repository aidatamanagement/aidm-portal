import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/components/ThemeProvider';
import { Moon, Sun, Home, FolderOpen } from 'lucide-react';
import ChatSupport from './ChatSupport';
import { supabase } from '@/integrations/supabase/client';
import { Logo } from '@/components/Logo';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const [profile, setProfile] = useState<any>(null);
  
  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'File Manager', href: '/files', icon: FolderOpen },
  ];



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
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const isActive = (path: string) => location.pathname === path;

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header - Full Width */}
      <header className="bg-card border-b border-border sticky top-0 z-50 w-full">
        <div className="flex justify-between items-center h-16 px-6">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/dashboard" className="flex items-center space-x-3">
              <Logo className="h-6" />
            </Link>
          </div>

          {/* User Menu & Theme Toggle */}
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={profile?.profile_image} alt="Profile" />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {profile?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {profile?.name || user?.user_metadata?.name || 'User'}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile">Profile</Link>
                </DropdownMenuItem>
                {profile?.role === 'admin' && (
                  <DropdownMenuItem asChild>
                    <Link to="/admin">Admin Portal</Link>
                  </DropdownMenuItem>
                )}

                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content Area with Sidebar */}
      <div className="flex flex-1">
        {/* Sidebar */}
        <div className="w-[164px] bg-white border-r border-[#eef0f3] flex flex-col sticky top-16 h-[calc(100vh-64px)] overflow-hidden">
          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-[17px] overflow-hidden">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center gap-2 px-2 py-2 rounded-[10px] text-[14px] font-normal transition-colors ${
                    isActive(item.href)
                      ? 'bg-[#026242] text-white'
                      : 'text-[#000000] hover:bg-gray-50'
                  }`}
                  style={{
                    fontFamily: '"SF Pro Text", sans-serif',
                    lineHeight: '20px'
                  }}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}


                    </nav>
        </div>

        {/* Main Content */}
        <main className="flex-1 p-8 pb-20">
          {children}
        </main>
      </div>

      {/* Fixed Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
        <div className="flex justify-between items-center h-16 px-6">
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              © 2025 AI Data Management
            </span>
          </div>
                    <div className="flex items-center space-x-4">
            <a 
              href="https://www.aidatamanagement.com/privacy-policy" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              Privacy Policy
            </a>
            <a
              href="https://www.aidatamanagement.com/terms-and-conditions"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              Terms of Service
            </a>
          </div>
        </div>
      </footer>

      {/* Chat Support */}
      <ChatSupport />
    </div>
  );
};

export default Layout;
