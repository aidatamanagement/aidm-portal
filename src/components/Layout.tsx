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
import { Moon, Sun, Home, FileText, FolderOpen, MessageSquare } from 'lucide-react';
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
    { name: 'Services', href: '/services', icon: FileText },
    { name: 'Files', href: '/files', icon: FolderOpen },
    { name: 'Prompts', href: '/prompts-intro', icon: MessageSquare },
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
      </header>

      {/* Main Content Area with Sidebar */}
      <div className="flex flex-1">
        {/* Sidebar */}
        <div className="w-[164px] bg-white border-r border-[#eef0f3] flex flex-col sticky top-16 h-screen">
          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-[17px]">
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
          
          {/* Need Help Card - Bottom of Sidebar */}
          <div className="p-4">
            <div 
              className="bg-[#026242] rounded-[17px] p-4 text-white relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #026242 0%, #026242 100%)'
              }}
            >
              {/* Orbital patterns in background */}
              <div className="absolute top-0 left-0 w-16 h-16 opacity-10">
                <div className="absolute top-1 left-1 w-4 h-4 border border-[#4E917B] rounded-full" style={{ borderStyle: 'dashed', borderWidth: '1px' }}></div>
                <div className="absolute top-2 left-2 w-8 h-8 border border-[#4E917B] rounded-full" style={{ borderStyle: 'dashed', borderWidth: '1px' }}></div>
                <div className="absolute top-3 left-3 w-12 h-12 border border-[#4E917B] rounded-full" style={{ borderStyle: 'dashed', borderWidth: '1px' }}></div>
              </div>
              
              <div className="absolute bottom-0 right-0 w-16 h-16 opacity-10">
                <div className="absolute bottom-1 right-1 w-4 h-4 border border-[#4E917B] rounded-full" style={{ borderStyle: 'dashed', borderWidth: '1px' }}></div>
                <div className="absolute bottom-2 right-2 w-8 h-8 border border-[#4E917B] rounded-full" style={{ borderStyle: 'dashed', borderWidth: '1px' }}></div>
                <div className="absolute bottom-3 right-3 w-12 h-12 border border-[#4E917B] rounded-full" style={{ borderStyle: 'dashed', borderWidth: '1px' }}></div>
              </div>
              
              {/* Content */}
              <div className="relative z-10">
                {/* Help Icon */}
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center mb-3">
                  <span className="text-[#026242] font-bold text-lg">?</span>
                </div>
                
                {/* Text Content */}
                <h3 
                  className="text-white font-bold text-sm mb-1"
                  style={{ fontFamily: '"SF Pro Text", sans-serif' }}
                >
                  Need Help?
                </h3>
                <p 
                  className="text-white text-xs mb-4 opacity-90"
                  style={{ fontFamily: '"SF Pro Text", sans-serif' }}
                >
                  Take a quick tour
                </p>
                
                {/* Button */}
                <button 
                  className="w-full bg-gray-300 text-gray-500 rounded-full py-2 px-3 text-xs font-medium cursor-not-allowed"
                  style={{ fontFamily: '"SF Pro Text", sans-serif' }}
                  disabled={true}
                >
                  Click for tour
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>

      {/* Chat Support */}
      <ChatSupport />
    </div>
  );
};

export default Layout;
