import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  FolderOpen,
  Plus,
  Search,
  Filter,
  Calendar,
  User,
  TrendingUp
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

const Projects = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Mock data - this will come from Supabase
  const projects = [
    { 
      id: 1, 
      name: "Smart Campus IoT System", 
      manager: "John Doe", 
      status: "In Progress", 
      progress: 75,
      description: "Implementation of IoT sensors across campus for monitoring",
      startDate: "2024-01-01",
      endDate: "2024-06-30",
      team: ["John Doe", "Sarah Wilson", "Mike Johnson"]
    },
    { 
      id: 2, 
      name: "Student Portal Enhancement", 
      manager: "Jane Smith", 
      status: "Planning", 
      progress: 25,
      description: "Upgrading the student information management system",
      startDate: "2024-02-01",
      endDate: "2024-08-31",
      team: ["Jane Smith", "Tom Brown", "Lisa Davis"]
    },
    { 
      id: 3, 
      name: "AI Research Platform", 
      manager: "Mike Johnson", 
      status: "In Progress", 
      progress: 60,
      description: "Development of machine learning research environment",
      startDate: "2023-12-01",
      endDate: "2024-05-31",
      team: ["Mike Johnson", "Dr. Smith", "Alex Wang"]
    },
    { 
      id: 4, 
      name: "Campus Security System", 
      manager: "Sarah Wilson", 
      status: "Completed", 
      progress: 100,
      description: "Implementation of digital security monitoring",
      startDate: "2023-09-01",
      endDate: "2023-12-31",
      team: ["Sarah Wilson", "David Lee", "Emily Chen"]
    },
  ];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists()) {
            setUser(userDoc.data());
          } else {
            console.error("User data not found");
            setUser(null);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          setUser(null);
        }
      } else {
        navigate("/login");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.manager.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed": return "default";
      case "In Progress": return "secondary";
      case "Planning": return "outline";
      default: return "outline";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading user data...</p>
      </div>
    );
  }

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
                <h1 className="text-xl font-bold">Projects</h1>
                {user && (
                  <p className="text-sm text-muted-foreground">Welcome, {user.firstName || user.name || "User"}</p>
                )}
                {!user && (
                  <p className="text-sm text-muted-foreground">Manage innovation lab projects</p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button onClick={() => navigate('/dashboard')}>
                Back to Dashboard
              </Button>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Project
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Search and Filter Bar */}
        <div className="flex items-center space-x-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <Card key={project.id} className="shadow-card hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{project.name}</CardTitle>
                  <Badge variant={getStatusColor(project.status)}>
                    {project.status}
                  </Badge>
                </div>
                <CardDescription className="text-sm">
                  {project.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <User className="h-4 w-4 mr-2" />
                    Manager: {project.manager}
                  </div>
                  
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4 mr-2" />
                    {project.startDate} - {project.endDate}
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="flex items-center">
                        <TrendingUp className="h-4 w-4 mr-1" />
                        Progress
                      </span>
                      <span className="font-medium">{project.progress}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-2">Team Members</p>
                    <div className="flex flex-wrap gap-1">
                      {project.team.map((member, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {member}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      View Details
                    </Button>
                    <Button size="sm" className="flex-1">
                      Edit Project
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Projects;