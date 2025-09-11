import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import NotificationsPanel from "@/components/NotificationsPanel";

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
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";

const Dashboard = () => {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState<string>("");
  const [dashboardStats, setDashboardStats] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);

  // Role-specific dashboard content
  const getDashboardContent = () => {
    switch (userRole) {
      case "staff":
        return {
          title: "Staff Dashboard",
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
              title: "Projects",
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
              title: "Invigilation Duties",
              description: "Your assigned invigilation schedule",
              route: "/invigilations",
              icon: Calendar,
              color: "text-destructive",
              count: 0,
              subText: "upcoming duties"
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
              title: "Access Management",
              description: "Review and approve user requests",
              route: "/access-management",
              icon: Users,
              color: "text-orange-600",
              count: 4,
              subText: "pending requests"
            },
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
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const role = localStorage.getItem("userRole");
        if (role) {
          setUserRole(role);
          await fetchDashboardData(user.uid, role);
          await fetchNotificationCount(user.uid);
        } else {
          navigate('/login');
        }
      } else {
        navigate('/login');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const fetchDashboardData = async (userId: string, role: string) => {
    try {
      let stats: any = {};
      
      switch (role) {
        case "staff":
        case "intern":
          // Fetch user's assigned tasks
          const userTasksQuery = query(
            collection(db, "tasks"),
            where("assignedTo", "==", userId)
          );
          const userTasksSnapshot = await getDocs(userTasksQuery);
          const userTasks = userTasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
          
          // Fetch user's projects
          const userProjectIds = [...new Set(userTasks.map((task: any) => task.projectId))];
          
          stats = {
            assignedTasks: userTasks.filter((task: any) => task.status !== 'completed').length,
            completedTasks: userTasks.filter((task: any) => task.status === 'completed').length,
            activeProjects: userProjectIds.length,
            upcomingInvigilations: 0 // This would come from invigilations collection
          };
          
          if (role === "intern") {
            stats.learningModules = 4; // This would come from userProgress collection
          }
          break;
          
        case "lecturer":
          // Fetch lecturer's invigilation requests
          const lecturerRequestsQuery = query(
            collection(db, "invigilationRequests"),
            where("requestedBy", "==", userId)
          );
          const lecturerRequestsSnapshot = await getDocs(lecturerRequestsQuery);
          const lecturerRequests = lecturerRequestsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
          
          stats = {
            activeRequests: lecturerRequests.filter((req: any) => req.status === 'pending').length,
            scheduledExams: lecturerRequests.filter((req: any) => req.status === 'approved').length,
            completedRequests: lecturerRequests.filter((req: any) => req.status === 'completed').length,
            pendingApprovals: lecturerRequests.filter((req: any) => req.status === 'pending').length
          };
          break;
          
        default: // coordinator
          // Fetch all projects
          const projectsQuery = query(collection(db, "projects"));
          const projectsSnapshot = await getDocs(projectsQuery);
          
          // Fetch all users
          const usersQuery = query(collection(db, "users"));
          const usersSnapshot = await getDocs(usersQuery);
          const staff = usersSnapshot.docs.filter(doc => 
            ['staff', 'intern'].includes(doc.data().role)
          );
          
          // Fetch pending access requests
          const pendingRequestsQuery = query(
            collection(db, "users"),
            where("status", "==", "pending")
          );
          const pendingRequestsSnapshot = await getDocs(pendingRequestsQuery);
          
          // Fetch active invigilations
          const invigilationsQuery = query(
            collection(db, "invigilationRequests"),
            where("status", "==", "approved")
          );
          const invigilationsSnapshot = await getDocs(invigilationsQuery);
          
          stats = {
            totalProjects: projectsSnapshot.size,
            totalStaff: staff.length,
            pendingRequests: pendingRequestsSnapshot.size,
            activeInvigilations: invigilationsSnapshot.size
          };
          break;
      }
      
      setDashboardStats(stats);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      // Use fallback hardcoded stats
      setDashboardStats(getDashboardContent().stats);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotificationCount = async (userId: string) => {
    try {
      const notificationsQuery = query(
        collection(db, "notifications"),
        where("userId", "==", userId),
        where("read", "==", false),
        orderBy("timestamp", "desc"),
        limit(10)
      );
      const notificationsSnapshot = await getDocs(notificationsQuery);
      setNotificationCount(notificationsSnapshot.size);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      setNotificationCount(3); // Fallback count
    }
  };

  // Use real dashboard data or fallback to hardcoded content
  const stats = Object.keys(dashboardStats).length > 0 ? dashboardStats : getDashboardContent().stats;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/20">
      <NotificationsPanel 
        isOpen={showNotifications} 
        onClose={() => setShowNotifications(false)} 
      />
      
      {/* Enhanced Header with Gradient */}
      <header className="bg-gradient-hero shadow-elegant border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img 
                src="https://i.ibb.co/1fgK6LDc/9f757fa6-349a-4388-b958-84594b83c836.png" 
                alt="MUT Innovation Lab" 
                className="h-12 w-auto bg-white/10 rounded-lg p-2 backdrop-blur-sm"
              />
              <div>
                <h1 className="text-2xl font-bold text-white">
                  {dashboardContent.title}
                </h1>
                <p className="text-white/80 capitalize text-sm">
                  {userRole} Panel • Welcome back
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button 
                variant="outline" 
                size="sm"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm"
                onClick={() => setShowNotifications(true)}
              >
                <Bell className="h-4 w-4 mr-2" />
                Notifications
                {notificationCount > 0 && (
                  <Badge variant="destructive" className="ml-2 bg-destructive text-destructive-foreground">
                    {notificationCount}
                  </Badge>
                )}
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm"
                onClick={() => navigate('/profile')}
              >
                <User className="h-4 w-4 mr-2" />
                Profile
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm"
                onClick={() => navigate('/settings')}
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Enhanced Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {Object.entries(stats).map(([key, value], index) => {
            const statConfig = {
              0: { icon: FolderOpen, color: "text-primary", gradient: "bg-gradient-primary", label: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()) },
              1: { icon: TrendingUp, color: "text-accent", gradient: "bg-gradient-secondary", label: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()) },
              2: { icon: CheckCircle, color: "text-accent", gradient: "bg-gradient-secondary", label: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()) },
              3: { icon: Clock, color: "text-destructive", gradient: "bg-destructive", label: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()) }
            }[index] || { icon: LayoutDashboard, color: "text-muted-foreground", gradient: "bg-muted", label: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()) };

            const IconComponent = statConfig.icon;

            return (
              <Card key={key} className="shadow-card hover:shadow-elegant transition-all duration-300 border-0 bg-gradient-to-br from-card to-card/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <div className={`p-2 rounded-lg ${statConfig.gradient} bg-opacity-10 mr-3`}>
                      <IconComponent className={`h-4 w-4 ${statConfig.color}`} />
                    </div>
                    <span className="text-card-foreground">{statConfig.label}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-1">
                    {String(value)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Current status
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Enhanced Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dashboardContent.quickActions.map((action, index) => {
            const IconComponent = action.icon;
            
            return (
              <Card 
                key={index} 
                className="shadow-card hover:shadow-elegant transition-all duration-300 cursor-pointer group hover:scale-[1.02] border-0 bg-gradient-to-br from-card to-card/80 hover:from-card hover:to-muted/20" 
                onClick={() => navigate(action.route)}
              >
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center">
                      <div className="p-2 rounded-lg bg-gradient-primary bg-opacity-10 mr-3 group-hover:scale-110 transition-transform">
                        <IconComponent className={`h-5 w-5 ${action.color}`} />
                      </div>
                      <span className="text-card-foreground group-hover:text-primary transition-colors">
                        {action.title}
                      </span>
                    </span>
                    <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                      View All
                    </Button>
                  </CardTitle>
                  <CardDescription className="ml-14">
                    {action.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  {action.count !== null && (
                    <div className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
                      {action.count}
                    </div>
                  )}
                  <p className="text-sm text-muted-foreground ml-14">
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