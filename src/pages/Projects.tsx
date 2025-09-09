import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
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
import { doc, getDoc, collection, getDocs, addDoc, updateDoc, query, where } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

interface Project {
  id: string;
  name: string;
  manager: string;
  status: string;
  progress: number;
  description: string;
  startDate: string;
  endDate: string;
  team: string[];
  createdAt: any;
  updatedAt: any;
}

const Projects = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
    manager: "",
    startDate: "",
    endDate: "",
    status: "Planning",
    team: [] as string[]
  });

  const [editProject, setEditProject] = useState({
    name: "",
    description: "",
    manager: "",
    startDate: "",
    endDate: "",
    status: "Planning",
    team: [] as string[]
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists()) {
            setUser(userDoc.data());
            await fetchProjects();
            await fetchUsers();
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

  const fetchProjects = async () => {
    try {
      const projectsCollection = collection(db, "projects");
      const projectsSnapshot = await getDocs(projectsCollection);
      const projectsData: Project[] = projectsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data() as any
      }));
      
      // Calculate progress based on tasks
      const updatedProjects = await Promise.all(
        projectsData.map(async (project) => {
          const tasksQuery = query(collection(db, "tasks"), where("projectId", "==", project.id));
          const tasksSnapshot = await getDocs(tasksQuery);
          const tasks = tasksSnapshot.docs.map(doc => doc.data());
          
          if (tasks.length > 0) {
            const totalProgress = tasks.reduce((sum, task) => sum + (task.progress || 0), 0);
            const averageProgress = Math.round(totalProgress / tasks.length);
            return { ...project, progress: averageProgress };
          }
          
          return project;
        })
      );
      
      setProjects(updatedProjects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      toast({
        title: "Error",
        description: "Failed to fetch projects",
        variant: "destructive",
      });
    }
  };

  const openProjectDetails = (project: Project) => {
    setSelectedProject(project);
    setShowDetailsDialog(true);
  };

  const openEditProject = (project: Project) => {
    setSelectedProject(project);
    setEditProject({
      name: project.name,
      description: project.description,
      manager: project.manager,
      startDate: project.startDate,
      endDate: project.endDate,
      status: project.status,
      team: project.team || []
    });
    setShowEditDialog(true);
  };

  const handleEditProjectSave = async () => {
    if (!selectedProject) return;
    try {
      await updateDoc(doc(db, "projects", selectedProject.id), {
        ...editProject,
        updatedAt: new Date()
      });
      toast({ title: "Success", description: "Project updated successfully" });
      setShowEditDialog(false);
      setSelectedProject(null);
      await fetchProjects();
    } catch (error) {
      console.error("Error updating project:", error);
      toast({ title: "Error", description: "Failed to update project", variant: "destructive" });
    }
  };

  const fetchUsers = async () => {
    try {
      const usersCollection = collection(db, "users");
      const usersSnapshot = await getDocs(usersCollection);
      const usersData = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data() as any
      }));
      setUsers(usersData);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const handleCreateProject = async () => {
    if (!newProject.name || !newProject.description || !newProject.manager) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      await addDoc(collection(db, "projects"), {
        ...newProject,
        progress: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      toast({
        title: "Success",
        description: "Project created successfully",
      });
      
      setShowCreateDialog(false);
      setNewProject({
        name: "",
        description: "",
        manager: "",
        startDate: "",
        endDate: "",
        status: "Planning",
        team: []
      });
      
      await fetchProjects();
    } catch (error) {
      console.error("Error creating project:", error);
      toast({
        title: "Error",
        description: "Failed to create project",
        variant: "destructive",
      });
    }
  };

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
                src="https://i.ibb.co/1fgK6LDc/9f757fa6-349a-4388-b958-84594b83c836.png" 
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
              {user?.role === 'coordinator' && (
                <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      New Project
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Create New Project</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="name">Project Name</Label>
                        <Input
                          id="name"
                          value={newProject.name}
                          onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                          placeholder="Enter project name"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={newProject.description}
                          onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                          placeholder="Enter project description"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="manager">Manager</Label>
                        <Select value={newProject.manager} onValueChange={(value) => setNewProject({ ...newProject, manager: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select manager" />
                          </SelectTrigger>
                          <SelectContent>
                            {users.filter(u => u.role === 'coordinator').map((user) => (
                              <SelectItem key={user.id} value={`${user.firstName} ${user.lastName}`}>
                                {user.firstName} {user.lastName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="startDate">Start Date</Label>
                          <Input
                            id="startDate"
                            type="date"
                            value={newProject.startDate}
                            onChange={(e) => setNewProject({ ...newProject, startDate: e.target.value })}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="endDate">End Date</Label>
                          <Input
                            id="endDate"
                            type="date"
                            value={newProject.endDate}
                            onChange={(e) => setNewProject({ ...newProject, endDate: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="status">Status</Label>
                        <Select value={newProject.status} onValueChange={(value) => setNewProject({ ...newProject, status: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Planning">Planning</SelectItem>
                            <SelectItem value="In Progress">In Progress</SelectItem>
                            <SelectItem value="Completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateProject}>
                        Create Project
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
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
                    <Dialog open={showDetailsDialog && selectedProject?.id === project.id} onOpenChange={(open) => {
                      if (!open) {
                        setShowDetailsDialog(false);
                        setSelectedProject(null);
                      }
                    }}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => openProjectDetails(project)}>
                          View Details
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                          <DialogTitle>Project Details</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-3 py-2 text-sm">
                          <div>
                            <p className="font-medium">Name</p>
                            <p>{selectedProject?.name}</p>
                          </div>
                          <div>
                            <p className="font-medium">Description</p>
                            <p className="whitespace-pre-wrap">{selectedProject?.description}</p>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="font-medium">Manager</p>
                              <p>{selectedProject?.manager}</p>
                            </div>
                            <div>
                              <p className="font-medium">Status</p>
                              <p>{selectedProject?.status}</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="font-medium">Start</p>
                              <p>{selectedProject?.startDate}</p>
                            </div>
                            <div>
                              <p className="font-medium">End</p>
                              <p>{selectedProject?.endDate}</p>
                            </div>
                          </div>
                          <div>
                            <p className="font-medium">Team</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {selectedProject?.team?.map((member, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">{member}</Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    {user?.role === 'coordinator' && (
                      <Dialog open={showEditDialog && selectedProject?.id === project.id} onOpenChange={(open) => {
                        if (!open) {
                          setShowEditDialog(false);
                          setSelectedProject(null);
                        }
                      }}>
                        <DialogTrigger asChild>
                          <Button size="sm" className="flex-1" onClick={() => openEditProject(project)}>
                            Edit Project
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                          <DialogHeader>
                            <DialogTitle>Edit Project</DialogTitle>
                          </DialogHeader>
                          <div className="grid gap-4 py-2">
                            <div className="grid gap-2">
                              <Label htmlFor="edit-name">Name</Label>
                              <Input id="edit-name" value={editProject.name} onChange={(e) => setEditProject({ ...editProject, name: e.target.value })} />
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="edit-description">Description</Label>
                              <Textarea id="edit-description" value={editProject.description} onChange={(e) => setEditProject({ ...editProject, description: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="grid gap-2">
                                <Label htmlFor="edit-start">Start Date</Label>
                                <Input id="edit-start" type="date" value={editProject.startDate} onChange={(e) => setEditProject({ ...editProject, startDate: e.target.value })} />
                              </div>
                              <div className="grid gap-2">
                                <Label htmlFor="edit-end">End Date</Label>
                                <Input id="edit-end" type="date" value={editProject.endDate} onChange={(e) => setEditProject({ ...editProject, endDate: e.target.value })} />
                              </div>
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="edit-status">Status</Label>
                              <Select value={editProject.status} onValueChange={(value) => setEditProject({ ...editProject, status: value })}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Planning">Planning</SelectItem>
                                  <SelectItem value="In Progress">In Progress</SelectItem>
                                  <SelectItem value="Completed">Completed</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => { setShowEditDialog(false); setSelectedProject(null); }}>Cancel</Button>
                            <Button onClick={handleEditProjectSave}>Save Changes</Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
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