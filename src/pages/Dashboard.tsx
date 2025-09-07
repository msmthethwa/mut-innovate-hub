import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard,
  FolderOpen,
  Users,
  Calendar,
  Settings,
  Bell,
  Plus,
  TrendingUp,
  Clock,
  CheckCircle
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

const Dashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [userRole] = useState<string>("coordinator"); // This will come from authentication

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigate('/login');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  // Mock data - this will come from Supabase
  const stats = {
    totalProjects: 12,
    activeProjects: 8,
    completedTasks: 45,
    pendingTasks: 23,
    totalStaff: 15,
    upcomingInvigilations: 3
  };

  return (
    <div className="min-h-screen bg-muted/20">
      {/* Header */}
      <header className="bg-card shadow-sm border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img 
                src="https://i.ibb.co/1fgK6LDc/9f757fa6-349a-4388-b958-84594b83c836.png" 
                alt="MUT Innovation Lab" 
                className="h-10 w-auto"
              />
              <div>
                <h1 className="text-xl font-bold">Dashboard</h1>
                <p className="text-sm text-muted-foreground capitalize">{userRole} Panel</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm">
                <Bell className="h-4 w-4 mr-2" />
                Notifications
                <Badge variant="destructive" className="ml-2">3</Badge>
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <FolderOpen className="h-4 w-4 mr-2 text-primary" />
                Total Projects
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalProjects}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+2</span> from last month
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <TrendingUp className="h-4 w-4 mr-2 text-accent" />
                Active Projects
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeProjects}</div>
              <p className="text-xs text-muted-foreground">
                Currently in progress
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                Completed Tasks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completedTasks}</div>
              <p className="text-xs text-muted-foreground">
                This month
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Clock className="h-4 w-4 mr-2 text-destructive" />
                Pending Tasks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingTasks}</div>
              <p className="text-xs text-muted-foreground">
                Require attention
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Projects Quick Access */}
          <Card className="shadow-card hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/projects')}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <FolderOpen className="h-5 w-5 mr-2 text-primary" />
                  Projects
                </span>
                <Button variant="ghost" size="sm">
                  View All
                </Button>
              </CardTitle>
              <CardDescription>
                Manage innovation lab projects
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary mb-2">{stats.totalProjects}</div>
              <p className="text-sm text-muted-foreground">
                {stats.activeProjects} currently active
              </p>
            </CardContent>
          </Card>

          {/* Tasks Quick Access */}
          <Card className="shadow-card hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/tasks')}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2 text-accent" />
                  Tasks
                </span>
                <Button variant="ghost" size="sm">
                  View All
                </Button>
              </CardTitle>
              <CardDescription>
                Track task assignments and progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent mb-2">{stats.completedTasks}</div>
              <p className="text-sm text-muted-foreground">
                {stats.pendingTasks} pending tasks
              </p>
            </CardContent>
          </Card>

          {/* Invigilations Quick Access */}
          <Card className="shadow-card hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/invigilations')}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-destructive" />
                  Invigilations
                </span>
                <Button variant="ghost" size="sm">
                  View All
                </Button>
              </CardTitle>
              <CardDescription>
                Manage exam invigilation schedules
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive mb-2">{stats.upcomingInvigilations}</div>
              <p className="text-sm text-muted-foreground">
                Upcoming this week
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;