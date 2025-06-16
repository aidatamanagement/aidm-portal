import React, { useEffect, useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
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
import { Moon, Sun, Home, Zap, FileText, MessageSquare } from 'lucide-react';
import ChatSupport from './ChatSupport';
import Dock from './Dock';
import { supabase } from '@/integrations/supabase/client';

const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const [profile, setProfile] = useState<any>(null);
  
  const navigation = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Services', href: '/services' },
    { name: 'Files', href: '/files' },
    { name: 'Prompts', href: '/prompts' },

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

  const dockItems = [
    {
      icon: <Home size={18} />,
      label: 'Dashboard',
      onClick: () => navigate('/dashboard'),
      isActive: isActive('/dashboard'),
    },
    {
      icon: <Zap size={18} />,
      label: 'Services',
      onClick: () => navigate('/services'),
      isActive: isActive('/services'),
    },
    {
      icon: <FileText size={18} />,
      label: 'Files',
      onClick: () => navigate('/files'),
      isActive: isActive('/files'),
    },
    {
      icon: <MessageSquare size={18} />,
      label: 'Prompts',
      onClick: () => navigate('/prompts'),
      isActive: isActive('/prompts'),
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link to="/dashboard" className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-lg">AI</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-xl text-foreground">AIDM</span>
                  <span className="text-xs text-muted-foreground">AI Data Management</span>
                </div>
              </Link>
            </div>

            {/* Animated Dock Navigation - Hidden on mobile, shown on desktop */}
            <div className="hidden md:block">
              <Dock 
                items={dockItems}
                panelHeight={68}
                baseItemSize={50}
                magnification={70}
              />
            </div>

            {/* Mobile Navigation - Only shown on mobile */}
            <nav className="md:hidden flex space-x-1">
              {dockItems.map((item) => (
                <Button
                  key={item.label}
                  variant={item.isActive ? "default" : "ghost"}
                  size="sm"
                  onClick={item.onClick}
                  className="flex items-center space-x-1"
                >
                  {item.icon}
                  <span className="sr-only">{item.label}</span>
                </Button>
              ))}
            </nav>

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
                  <DropdownMenuItem asChild>
                    <Link to="/support">Support</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Chat Support */}
      <ChatSupport />
    </div>
  );
};

export default Layout;
