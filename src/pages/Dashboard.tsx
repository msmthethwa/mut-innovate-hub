import { useState } from "react";
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
import { useLocation } from "react-router-dom";

const Dashboard = () => {
  const location = useLocation();
  const [userRole] = useState<string>("coordinator"); // This will come from authentication

  // Mock data - this will come from Supabase
  const stats = {
    totalProjects: 12,
    activeProjects: 8,
    completedTasks: 45,
    pendingTasks: 23,
    totalStaff: 15,
    upcomingInvigilations: 3
  };

  const recentProjects = [
    { id: 1, name: "Smart Campus IoT System", manager: "John Doe", status: "In Progress", progress: 75 },
    { id: 2, name: "Student Portal Enhancement", manager: "Jane Smith", status: "Planning", progress: 25 },
    { id: 3, name: "AI Research Platform", manager: "Mike Johnson", status: "In Progress", progress: 60 },
  ];

  const recentTasks = [
    { id: 1, title: "Database Design Review", assignee: "Sarah Wilson", status: "Pending", dueDate: "2024-01-15" },
    { id: 2, title: "API Documentation", assignee: "Tom Brown", status: "In Progress", dueDate: "2024-01-18" },
    { id: 3, title: "Testing Phase", assignee: "Lisa Davis", status: "Completed", dueDate: "2024-01-12" },
  ];

  const upcomingInvigilations = [
    { id: 1, subject: "Data Structures", date: "2024-01-20", time: "09:00", invigilator: "Dr. Smith" },
    { id: 2, subject: "Web Development", date: "2024-01-22", time: "14:00", invigilator: "Prof. Johnson" },
  ];

  return (
    <div className="min-h-screen bg-muted/20">
      {/* Header */}
      <header className="bg-card shadow-sm border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img 
                src="https://i.ibb.co/HfwCH8cD/Innovation-Lab-Logo.png" 
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

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Projects */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Recent Projects
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  New Project
                </Button>
              </CardTitle>
              <CardDescription>
                Overview of current projects and their progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentProjects.map((project) => (
                  <div key={project.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{project.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        Manager: {project.manager}
                      </p>
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span>Progress</span>
                          <span>{project.progress}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${project.progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    <Badge 
                      variant={project.status === "In Progress" ? "default" : "secondary"}
                      className="ml-4"
                    >
                      {project.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Tasks */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Recent Tasks</CardTitle>
              <CardDescription>
                Latest task assignments and updates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentTasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{task.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        Assigned to: {task.assignee}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Due: {task.dueDate}
                      </p>
                    </div>
                    <Badge 
                      variant={
                        task.status === "Completed" ? "default" :
                        task.status === "In Progress" ? "secondary" : "outline"
                      }
                    >
                      {task.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Invigilations */}
          <Card className="shadow-card lg:col-span-2">
            <CardHeader>
              <CardTitle>Upcoming Invigilations</CardTitle>
              <CardDescription>
                Scheduled invigilation assignments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {upcomingInvigilations.map((exam) => (
                  <div key={exam.id} className="p-4 border rounded-lg bg-muted/20">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{exam.subject}</h4>
                      <Badge variant="outline">{exam.date}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Time: {exam.time}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Invigilator: {exam.invigilator}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;