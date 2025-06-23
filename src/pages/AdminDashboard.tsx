import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useRealtimeAdminStats } from '@/hooks/useRealtimeAdminStats';
import { Link } from 'react-router-dom';
import { Users, Zap, BookOpen, FileText, TrendingUp, Award, Calendar } from 'lucide-react';

const AdminDashboard = () => {
  const { data: stats, isLoading, error, isFetching } = useRealtimeAdminStats();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    console.error('Admin dashboard error:', error);
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-destructive mb-4">Error loading dashboard data</p>
          <p className="text-sm text-muted-foreground mb-4">{error.message}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  console.log('Dashboard stats:', stats);

  return (
    <div className="space-y-8">
      {/* Real-time indicator */}

      {/* Welcome Header */}
      <div className="relative bg-gradient-to-r from-primary to-green-600 rounded-2xl p-8 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-2">Welcome to Admin Portal</h1>
          <p className="text-green-100 text-lg max-w-2xl">
            Manage students, courses, services, and monitor platform performance from your central command center.
          </p>
        </div>
        <div className="absolute top-4 right-4 opacity-20">
          <div className="w-32 h-32 rounded-full border-4 border-white/30"></div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Students</p>
                <p className="text-3xl font-bold text-primary">{stats?.totalStudents || 0}</p>
                <p className="text-xs text-green-600 mt-1">Active learners</p>
              </div>
              <Users className="h-12 w-12 text-primary opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Services</p>
                <p className="text-3xl font-bold text-blue-600">{stats?.activeServices || 0}</p>
                <p className="text-xs text-blue-500 mt-1">Available offerings</p>
              </div>
              <Zap className="h-12 w-12 text-blue-500 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Courses</p>
                <p className="text-3xl font-bold text-purple-600">{stats?.totalCourses || 0}</p>
                <p className="text-xs text-purple-500 mt-1">Learning paths</p>
              </div>
              <BookOpen className="h-12 w-12 text-purple-500 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Files Shared</p>
                <p className="text-3xl font-bold text-orange-600">{stats?.totalFiles || 0}</p>
                <p className="text-xs text-orange-500 mt-1">Resources available</p>
              </div>
              <FileText className="h-12 w-12 text-orange-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-primary" />
                <CardTitle> Recent Enrollments</CardTitle>
              </div>
              <Link to="/admin/students">
                <Button variant="outline" size="sm">View All</Button>
              </Link>
            </div>
            <CardDescription>Latest students who joined the platform</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.recentStudents && stats.recentStudents.length > 0 ? (
                stats.recentStudents.map((student: any) => (
                  <div key={student.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {student.name?.charAt(0)?.toUpperCase() || student.email?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-sm">{student.name || 'Unknown User'}</p>
                        <p className="text-xs text-muted-foreground">{student.email}</p>
                        <p className="text-xs text-muted-foreground">
                          Joined {new Date(student.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs capitalize">
                      Student
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="text-center py-6">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No recent enrollments</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <CardTitle>Performance Overview</CardTitle>
            </div>
            <CardDescription>Key metrics at a glance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="text-center p-6 bg-gradient-to-r from-primary/10 to-green-100 dark:to-green-900/20 rounded-lg">
                <Award className="h-8 w-8 text-primary mx-auto mb-2" />
                <p className="text-2xl font-bold text-primary">{stats?.completionRate || 0}%</p>
                <p className="text-sm text-muted-foreground">Course Completion Rate</p>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Completed Lessons</span>
                  <span className="text-sm text-primary font-semibold">{stats?.completedLessons || 0}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300" 
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
              <Button variant="outline" className="w-full h-20 flex flex-col space-y-2 hover:bg-primary hover:text-white transition-colors">
                <Users className="h-6 w-6" />
                <span className="text-xs">Add Student</span>
              </Button>
            </Link>
            <Link to="/admin/courses">
              <Button variant="outline" className="w-full h-20 flex flex-col space-y-2 hover:bg-primary hover:text-white transition-colors">
                <BookOpen className="h-6 w-6" />
                <span className="text-xs">Manage Courses</span>
              </Button>
            </Link>
            <Link to="/admin/services">
              <Button variant="outline" className="w-full h-20 flex flex-col space-y-2 hover:bg-primary hover:text-white transition-colors">
                <Zap className="h-6 w-6" />
                <span className="text-xs">Manage Services</span>
              </Button>
            </Link>
            <Link to="/admin/files">
              <Button variant="outline" className="w-full h-20 flex flex-col space-y-2 hover:bg-primary hover:text-white transition-colors">
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
