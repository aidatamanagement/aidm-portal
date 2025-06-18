
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Courses from "./pages/Courses";
import CourseDetail from "./pages/CourseDetail";
import LessonViewer from "./pages/LessonViewer";
import Services from "./pages/Services";
import Files from "./pages/Files";
import Prompts from "./pages/Prompts";
import Support from "./pages/Support";
import NotFound from "./pages/NotFound";
import Layout from "./components/Layout";
import AdminLayout from "./components/AdminLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import AdminDashboard from "./pages/AdminDashboard";
import AdminStudents from "./pages/AdminStudents";
import AdminStudentDetail from "./pages/AdminStudentDetail";
import AdminCourses from "./pages/AdminCourses";
import AdminServices from "./pages/AdminServices";
import AdminAddUser from "./pages/AdminAddUser";
import AdminFiles from "./pages/AdminFiles";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              
              {/* Protected User Routes */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              } />
              
              <Route path="/profile" element={
                <ProtectedRoute>
                  <Layout>
                    <Profile />
                  </Layout>
                </ProtectedRoute>
              } />
              
              <Route path="/courses" element={
                <ProtectedRoute>
                  <Layout>
                    <Courses />
                  </Layout>
                </ProtectedRoute>
              } />
              
              <Route path="/courses/:id" element={
                <ProtectedRoute>
                  <Layout>
                    <CourseDetail />
                  </Layout>
                </ProtectedRoute>
              } />
              
              <Route path="/courses/:courseId/lessons/:lessonId" element={
                <ProtectedRoute>
                  <Layout>
                    <LessonViewer />
                  </Layout>
                </ProtectedRoute>
              } />
              
              <Route path="/services" element={
                <ProtectedRoute>
                  <Layout>
                    <Services />
                  </Layout>
                </ProtectedRoute>
              } />
              
              <Route path="/files" element={
                <ProtectedRoute>
                  <Layout>
                    <Files />
                  </Layout>
                </ProtectedRoute>
              } />
              
              <Route path="/prompts" element={
                <ProtectedRoute>
                  <Layout>
                    <Prompts />
                  </Layout>
                </ProtectedRoute>
              } />
              
              <Route path="/support" element={
                <ProtectedRoute>
                  <Layout>
                    <Support />
                  </Layout>
                </ProtectedRoute>
              } />

              {/* Admin Routes */}
              <Route path="/admin" element={
                <AdminRoute>
                  <AdminLayout>
                    <AdminDashboard />
                  </AdminLayout>
                </AdminRoute>
              } />
              
              <Route path="/admin/dashboard" element={
                <AdminRoute>
                  <AdminLayout>
                    <AdminDashboard />
                  </AdminLayout>
                </AdminRoute>
              } />
              
              <Route path="/admin/students" element={
                <AdminRoute>
                  <AdminLayout>
                    <AdminStudents />
                  </AdminLayout>
                </AdminRoute>
              } />
              
              <Route path="/admin/students/:id" element={
                <AdminRoute>
                  <AdminLayout>
                    <AdminStudentDetail />
                  </AdminLayout>
                </AdminRoute>
              } />
              
              <Route path="/admin/courses" element={
                <AdminRoute>
                  <AdminLayout>
                    <AdminCourses />
                  </AdminLayout>
                </AdminRoute>
              } />
              
              <Route path="/admin/services" element={
                <AdminRoute>
                  <AdminLayout>
                    <AdminServices />
                  </AdminLayout>
                </AdminRoute>
              } />
              
              <Route path="/admin/add-user" element={
                <AdminRoute>
                  <AdminLayout>
                    <AdminAddUser />
                  </AdminLayout>
                </AdminRoute>
              } />
              
              <Route path="/admin/files" element={
                <AdminRoute>
                  <AdminLayout>
                    <AdminFiles />
                  </AdminLayout>
                </AdminRoute>
              } />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
