
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useRealtimeAdminStats } from '@/hooks/useRealtimeAdminStats';
import { Link } from 'react-router-dom';
import { Users, Zap, BookOpen, FileText, TrendingUp, Award, Calendar } from 'lucide-react';

const AdminDashboard = () => {
  const { data: stats, isLoading, error } = useRealtimeAdminStats();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0D5C4B]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-destructive mb-4">Error loading dashboard data</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="relative bg-gradient-to-r from-[#0D5C4B] to-green-600 rounded-2xl p-8 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-2">Welcome to Admin Portal</h1>
          <p className="text-green-100 text-lg max-w-2xl">
            Manage students, courses, services, and monitor platform performance from your central command center.
          </p>
          <div className="flex items-center mt-4 space-x-2">
            <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></div>
            <span className="text-green-100 text-sm">Real-time updates enabled</span>
          </div>
        </div>
        <div className="absolute top-4 right-4 opacity-20">
          <div className="w-32 h-32 rounded-full border-4 border-white/30"></div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-[#0D5C4B] transition-all duration-300 hover:shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Students</p>
                <p className="text-3xl font-bold text-[#0D5C4B]">{stats?.totalStudents}</p>
                <p className="text-xs text-green-600 mt-1">Active learners</p>
              </div>
              <Users className="h-12 w-12 text-[#0D5C4B] opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500 transition-all duration-300 hover:shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Services</p>
                <p className="text-3xl font-bold text-blue-600">{stats?.activeServices}</p>
                <p className="text-xs text-blue-500 mt-1">Available offerings</p>
              </div>
              <Zap className="h-12 w-12 text-blue-500 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 transition-all duration-300 hover:shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Courses</p>
                <p className="text-3xl font-bold text-purple-600">{stats?.totalCourses}</p>
                <p className="text-xs text-purple-500 mt-1">Learning paths</p>
              </div>
              <BookOpen className="h-12 w-12 text-purple-500 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500 transition-all duration-300 hover:shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Files Shared</p>
                <p className="text-3xl font-bold text-orange-600">{stats?.totalFiles}</p>
                <p className="text-xs text-orange-500 mt-1">Resources available</p>
              </div>
              <FileText className="h-12 w-12 text-orange-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-[#0D5C4B]" />
                <CardTitle>Recent Enrollments</CardTitle>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              </div>
              <Link to="/admin/students">
                <Button variant="outline" size="sm">View All</Button>
              </Link>
            </div>
            <CardDescription>Latest student service assignments (real-time)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-80 overflow-y-auto">
              {stats?.recentEnrollments?.slice(0, 5).map((enrollment: any) => (
                <div key={enrollment.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-[#0D5C4B] rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {enrollment.profiles?.name?.charAt(0)?.toUpperCase() || 'U'}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-sm">{enrollment.profiles?.name}</p>
                      <p className="text-xs text-muted-foreground">{enrollment.services?.title}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs capitalize">
                    {enrollment.status}
                  </Badge>
                </div>
              ))}
              {(!stats?.recentEnrollments || stats.recentEnrollments.length === 0) && (
                <div className="text-center py-6">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No recent enrollments</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Performance Overview */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-[#0D5C4B]" />
              <CardTitle>Performance Overview</CardTitle>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </div>
            <CardDescription>Key metrics at a glance (real-time)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="text-center p-6 bg-gradient-to-r from-[#0D5C4B]/10 to-green-100 rounded-lg transition-all duration-300">
                <Award className="h-8 w-8 text-[#0D5C4B] mx-auto mb-2" />
                <p className="text-2xl font-bold text-[#0D5C4B]">{stats?.completionRate}%</p>
                <p className="text-sm text-muted-foreground">Course Completion Rate</p>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Completed Lessons</span>
                  <span className="text-sm text-[#0D5C4B] font-semibold">{stats?.completedLessons}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-[#0D5C4B] h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min(stats?.completionRate || 0, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link to="/admin/add-user">
              <Button variant="outline" className="w-full h-20 flex flex-col space-y-2 hover:bg-[#0D5C4B] hover:text-white transition-colors">
                <Users className="h-6 w-6" />
                <span className="text-xs">Add Student</span>
              </Button>
            </Link>
            <Link to="/admin/courses">
              <Button variant="outline" className="w-full h-20 flex flex-col space-y-2 hover:bg-[#0D5C4B] hover:text-white transition-colors">
                <BookOpen className="h-6 w-6" />
                <span className="text-xs">Manage Courses</span>
              </Button>
            </Link>
            <Link to="/admin/services">
              <Button variant="outline" className="w-full h-20 flex flex-col space-y-2 hover:bg-[#0D5C4B] hover:text-white transition-colors">
                <Zap className="h-6 w-6" />
                <span className="text-xs">Manage Services</span>
              </Button>
            </Link>
            <Link to="/admin/files">
              <Button variant="outline" className="w-full h-20 flex flex-col space-y-2 hover:bg-[#0D5C4B] hover:text-white transition-colors">
                <FileText className="h-6 w-6" />
                <span className="text-xs">Share Files</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
