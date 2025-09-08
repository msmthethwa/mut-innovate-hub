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
  CheckCircle,
  User
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

const Dashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState<string>("");

  // Role-specific dashboard content
  const getDashboardContent = () => {
    switch (userRole) {
      case "lab-staff":
        return {
          title: "Lab Staff Dashboard",
          stats: {
            assignedTasks: 8,
            completedTasks: 15,
            activeProjects: 3,
            upcomingInvigilations: 2
          },
          quickActions: [
            {
              title: "My Tasks",
              description: "View and update your assigned tasks",
              route: "/tasks",
              icon: CheckCircle,
              color: "text-accent",
              count: 8,
              subText: "tasks pending"
            },
            {
              title: "My Projects",
              description: "Projects you're currently working on",
              route: "/projects",
              icon: FolderOpen,
              color: "text-primary",
              count: 3,
              subText: "active projects"
            },
            {
              title: "Invigilation Duties",
              description: "Your assigned invigilation schedule",
              route: "/invigilations",
              icon: Calendar,
              color: "text-destructive",
              count: 2,
              subText: "upcoming duties"
            }
          ]
        };
      case "intern":
        return {
          title: "Intern Dashboard",
          stats: {
            assignedTasks: 5,
            completedTasks: 8,
            activeProjects: 2,
            learningModules: 4
          },
          quickActions: [
            {
              title: "My Tasks",
              description: "View your assigned learning tasks",
              route: "/tasks",
              icon: CheckCircle,
              color: "text-accent",
              count: 5,
              subText: "tasks assigned"
            },
            {
              title: "Projects",
              description: "Projects you're assisting with",
              route: "/projects",
              icon: FolderOpen,
              color: "text-primary",
              count: 2,
              subText: "active projects"
            },
            {
              title: "Learning Progress",
              description: "Track your skill development",
              route: "/learning",
              icon: TrendingUp,
              color: "text-green-600",
              count: 4,
              subText: "modules completed"
            }
          ]
        };
      case "lecturer":
        return {
          title: "Lecturer Dashboard",
          stats: {
            activeRequests: 3,
            scheduledExams: 5,
            completedRequests: 12,
            pendingApprovals: 1
          },
          quickActions: [
            {
              title: "Request Invigilator",
              description: "Request staff for exam invigilation",
              route: "/invigilations",
              icon: Plus,
              color: "text-primary",
              count: null,
              subText: "create new request"
            },
            {
              title: "My Requests",
              description: "View your invigilation requests",
              route: "/invigilations",
              icon: Calendar,
              color: "text-accent",
              count: 3,
              subText: "active requests"
            },
            {
              title: "Exam Schedule",
              description: "View your scheduled examinations",
              route: "/schedule",
              icon: Clock,
              color: "text-destructive",
              count: 5,
              subText: "upcoming exams"
            }
          ]
        };
      default: // coordinator
        return {
          title: "Coordinator Dashboard",
          stats: {
            totalProjects: 12,
            totalStaff: 15,
            pendingRequests: 4,
            activeInvigilations: 8
          },
          quickActions: [
            {
              title: "Projects",
              description: "Manage innovation lab projects",
              route: "/projects",
              icon: FolderOpen,
              color: "text-primary",
              count: 12,
              subText: "total projects"
            },
            {
              title: "Tasks",
              description: "Track task assignments and progress",
              route: "/tasks",
              icon: CheckCircle,
              color: "text-accent",
              count: 45,
              subText: "completed tasks"
            },
            {
              title: "Invigilations",
              description: "View all invigilation requests",
              route: "/invigilations",
              icon: Calendar,
              color: "text-destructive",
              count: 8,
              subText: "active assignments"
            }
          ]
        };
    }
  };

  const dashboardContent = getDashboardContent();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const role = localStorage.getItem("userRole");
        if (role) {
          setUserRole(role);
        } else {
          navigate('/login');
        }
      } else {
        navigate('/login');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  // Mock data - this will come from Supabase
  const stats = dashboardContent.stats;

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
                <h1 className="text-xl font-bold">{dashboardContent.title}</h1>
                <p className="text-sm text-muted-foreground capitalize">{userRole} Panel</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm">
                <Bell className="h-4 w-4 mr-2" />
                Notifications
                <Badge variant="destructive" className="ml-2">3</Badge>
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate('/profile')}>
                <User className="h-4 w-4 mr-2" />
                Profile
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate('/settings')}>
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
          {Object.entries(stats).map(([key, value], index) => {
            const statConfig = {
              0: { icon: FolderOpen, color: "text-primary", label: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()) },
              1: { icon: TrendingUp, color: "text-accent", label: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()) },
              2: { icon: CheckCircle, color: "text-green-600", label: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()) },
              3: { icon: Clock, color: "text-destructive", label: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()) }
            }[index] || { icon: LayoutDashboard, color: "text-muted-foreground", label: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()) };

            const IconComponent = statConfig.icon;

            return (
              <Card key={key} className="shadow-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <IconComponent className={`h-4 w-4 mr-2 ${statConfig.color}`} />
                    {statConfig.label}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{value}</div>
                  <p className="text-xs text-muted-foreground">
                    Current status
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {dashboardContent.quickActions.map((action, index) => {
            const IconComponent = action.icon;
            
            return (
              <Card 
                key={index} 
                className="shadow-card hover:shadow-lg transition-shadow cursor-pointer" 
                onClick={() => navigate(action.route)}
              >
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center">
                      <IconComponent className={`h-5 w-5 mr-2 ${action.color}`} />
                      {action.title}
                    </span>
                    <Button variant="ghost" size="sm">
                      View All
                    </Button>
                  </CardTitle>
                  <CardDescription>
                    {action.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {action.count !== null && (
                    <div className={`text-2xl font-bold ${action.color} mb-2`}>
                      {action.count}
                    </div>
                  )}
                  <p className="text-sm text-muted-foreground">
                    {action.subText}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;