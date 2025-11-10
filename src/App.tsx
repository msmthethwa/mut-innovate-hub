import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import LearnMore from "./pages/LearnMore";
import ProtectedRoute from "./components/ProtectedRoute";
import Projects from "./pages/Projects";
import Tasks from "./pages/Tasks";
import Invigilations from "./pages/Invigilations";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import AccessManagement from "./pages/AccessManagement";
import LearningProgress from "./pages/LearningProgress";
import ExamSchedule from "./pages/ExamSchedule";
import Attendance from "./pages/Attendance";
import NotFound from "./pages/NotFound";
import Help from "./pages/Help";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/learn-more" element={<LearnMore />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
          <Route path="/tasks" element={<ProtectedRoute><Tasks /></ProtectedRoute>} />
          <Route path="/invigilations" element={<ProtectedRoute><Invigilations /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/access-management" element={<ProtectedRoute><AccessManagement /></ProtectedRoute>} />
          <Route path="/learning" element={<ProtectedRoute><LearningProgress /></ProtectedRoute>} />
          <Route path="/schedule" element={<ProtectedRoute><ExamSchedule /></ProtectedRoute>} />
          <Route path="/attendance" element={<ProtectedRoute><Attendance /></ProtectedRoute>} />
          <Route path="/help" element={<Help />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
