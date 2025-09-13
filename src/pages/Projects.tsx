import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { NotificationService } from "@/lib/notificationService";
import {
  FolderOpen,
  Plus,
  Search,
  Filter,
  Calendar,
  User,
  TrendingUp,
  SortAsc,
  SortDesc,
  Trash2,
  Archive,
  Download,
  BarChart3,
  Users,
  Tag,
  DollarSign,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  MoreVertical,
  Edit,
  Copy,
  Eye
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
  category?: string;
  priority?: 'Low' | 'Medium' | 'High' | 'Critical';
  budget?: number;
  tags?: string[];
  archived?: boolean;
  template?: boolean;
  client?: string;
  estimatedHours?: number;
  actualHours?: number;
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
  
  // Filtering and sorting states
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [viewMode, setViewMode] = useState<"grid" | "list" | "timeline">("grid");
  const [showArchived, setShowArchived] = useState(false);
  
  // Team management states
  const [showTeamDialog, setShowTeamDialog] = useState(false);
  const [availableMembers, setAvailableMembers] = useState<any[]>([]);
  
  // Analytics states
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  
  // Bulk operations states
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
    manager: "",
    startDate: "",
    endDate: "",
    status: "Planning",
    team: [] as string[],
    category: "",
    priority: "Medium" as 'Low' | 'Medium' | 'High' | 'Critical',
    budget: 0,
    tags: [] as string[],
    client: "",
    estimatedHours: 0
  });

  const [editProject, setEditProject] = useState({
    name: "",
    description: "",
    manager: "",
    startDate: "",
    endDate: "",
    status: "Planning",
    team: [] as string[],
    category: "",
    priority: "Medium" as 'Low' | 'Medium' | 'High' | 'Critical',
    budget: 0,
    tags: [] as string[],
    client: "",
    estimatedHours: 0
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
      team: project.team || [],
      category: project.category || "",
      priority: project.priority || "Medium",
      budget: project.budget || 0,
      tags: project.tags || [],
      client: project.client || "",
      estimatedHours: project.estimatedHours || 0
    });
    setShowEditDialog(true);
  };

  const handleEditProjectSave = async () => {
    if (!selectedProject || !user) return;
    try {
      await updateDoc(doc(db, "projects", selectedProject.id), {
        ...editProject,
        updatedAt: new Date()
      });

      // Create notification for project update
      const teamMembers = await NotificationService.getProjectTeamMembers(selectedProject.id);
      await NotificationService.createProjectUpdateNotification({
        projectId: selectedProject.id,
        projectName: selectedProject.name,
        updateType: "details",
        updatedById: user.id,
        updatedByName: `${user.firstName} ${user.lastName}`,
        teamMembers
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
      const usersData = usersSnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data() as any
        }))
        .filter(user => {
          // Only include users who are approved and active
          const status = user.status || "pending";
          const isActive = user.isActive !== false; // Default to true if not set
          return status === "approved" && isActive;
        });
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
        team: [],
        category: "",
        priority: "Medium",
        budget: 0,
        tags: [],
        client: "",
        estimatedHours: 0
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

  const filteredProjects = projects
    .filter(project => {
      // Search filter
      const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.manager.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (project.tags && project.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())));
      
      // Status filter
      const matchesStatus = statusFilter === "all" || project.status === statusFilter;
      
      // Priority filter
      const matchesPriority = priorityFilter === "all" || project.priority === priorityFilter;
      
      // Category filter
      const matchesCategory = categoryFilter === "all" || project.category === categoryFilter;
      
      // Archive filter
      const matchesArchive = showArchived ? project.archived : !project.archived;
      
      return matchesSearch && matchesStatus && matchesPriority && matchesCategory && matchesArchive;
    })
    .sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case "name":
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case "status":
          aValue = a.status;
          bValue = b.status;
          break;
        case "progress":
          aValue = a.progress;
          bValue = b.progress;
          break;
        case "startDate":
          aValue = new Date(a.startDate);
          bValue = new Date(b.startDate);
          break;
        case "endDate":
          aValue = new Date(a.endDate);
          bValue = new Date(b.endDate);
          break;
        case "priority":
          const priorityOrder = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
          aValue = priorityOrder[a.priority || 'Medium'];
          bValue = priorityOrder[b.priority || 'Medium'];
          break;
        case "manager":
          aValue = a.manager.toLowerCase();
          bValue = b.manager.toLowerCase();
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }
      
      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed": return "default";
      case "In Progress": return "secondary";
      case "Planning": return "outline";
      default: return "outline";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Critical": return "destructive";
      case "High": return "destructive";
      case "Medium": return "secondary";
      case "Low": return "outline";
      default: return "outline";
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "Critical": return <AlertTriangle className="h-3 w-3" />;
      case "High": return <AlertTriangle className="h-3 w-3" />;
      case "Medium": return <Clock className="h-3 w-3" />;
      case "Low": return <CheckCircle className="h-3 w-3" />;
      default: return <Clock className="h-3 w-3" />;
    }
  };

  // Project management functions
  const handleDeleteProject = async (projectId: string) => {
    try {
      await updateDoc(doc(db, "projects", projectId), {
        archived: true,
        updatedAt: new Date()
      });
      toast({ title: "Success", description: "Project archived successfully" });
      await fetchProjects();
    } catch (error) {
      console.error("Error archiving project:", error);
      toast({ title: "Error", description: "Failed to archive project", variant: "destructive" });
    }
  };

  const handleRestoreProject = async (projectId: string) => {
    try {
      await updateDoc(doc(db, "projects", projectId), {
        archived: false,
        updatedAt: new Date()
      });
      toast({ title: "Success", description: "Project restored successfully" });
      await fetchProjects();
    } catch (error) {
      console.error("Error restoring project:", error);
      toast({ title: "Error", description: "Failed to restore project", variant: "destructive" });
    }
  };

  const handleCloneProject = async (project: Project) => {
    try {
      const clonedProject = {
        ...project,
        name: `${project.name} (Copy)`,
        status: "Planning",
        progress: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      delete clonedProject.id;
      
      await addDoc(collection(db, "projects"), clonedProject);
      toast({ title: "Success", description: "Project cloned successfully" });
      await fetchProjects();
    } catch (error) {
      console.error("Error cloning project:", error);
      toast({ title: "Error", description: "Failed to clone project", variant: "destructive" });
    }
  };

  const calculateAnalytics = () => {
    const totalProjects = projects.length;
    const completedProjects = projects.filter(p => p.status === "Completed").length;
    const inProgressProjects = projects.filter(p => p.status === "In Progress").length;
    const planningProjects = projects.filter(p => p.status === "Planning").length;
    const averageProgress = projects.reduce((sum, p) => sum + p.progress, 0) / totalProjects || 0;
    const overdueProjects = projects.filter(p => 
      p.status !== "Completed" && new Date(p.endDate) < new Date()
    ).length;
    
    return {
      totalProjects,
      completedProjects,
      inProgressProjects,
      planningProjects,
      averageProgress: Math.round(averageProgress),
      overdueProjects
    };
  };

  // Bulk operations functions
  const handleSelectProject = (projectId: string) => {
    setSelectedProjects(prev => 
      prev.includes(projectId) 
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    );
  };

  const handleSelectAllProjects = () => {
    if (selectedProjects.length === filteredProjects.length) {
      setSelectedProjects([]);
    } else {
      setSelectedProjects(filteredProjects.map(p => p.id));
    }
  };

  const handleBulkStatusUpdate = async (status: string) => {
    try {
      const updatePromises = selectedProjects.map(projectId => 
        updateDoc(doc(db, "projects", projectId), {
          status,
          updatedAt: new Date()
        })
      );
      await Promise.all(updatePromises);
      toast({ title: "Success", description: `Updated ${selectedProjects.length} projects to ${status}` });
      setSelectedProjects([]);
      await fetchProjects();
    } catch (error) {
      console.error("Error updating projects:", error);
      toast({ title: "Error", description: "Failed to update projects", variant: "destructive" });
    }
  };

  const handleBulkArchive = async () => {
    try {
      const updatePromises = selectedProjects.map(projectId => 
        updateDoc(doc(db, "projects", projectId), {
          archived: true,
          updatedAt: new Date()
        })
      );
      await Promise.all(updatePromises);
      toast({ title: "Success", description: `Archived ${selectedProjects.length} projects` });
      setSelectedProjects([]);
      await fetchProjects();
    } catch (error) {
      console.error("Error archiving projects:", error);
      toast({ title: "Error", description: "Failed to archive projects", variant: "destructive" });
    }
  };

  const handleCreateTemplate = async () => {
    if (!templateName.trim()) {
      toast({ title: "Error", description: "Please enter a template name", variant: "destructive" });
      return;
    }

    try {
      const templateProject = {
        ...newProject,
        name: templateName,
        template: true,
        status: "Planning",
        progress: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await addDoc(collection(db, "projects"), templateProject);
      toast({ title: "Success", description: "Project template created successfully" });
      setShowTemplateDialog(false);
      setTemplateName("");
      await fetchProjects();
    } catch (error) {
      console.error("Error creating template:", error);
      toast({ title: "Error", description: "Failed to create template", variant: "destructive" });
    }
  };

  const handleExportProjects = () => {
    const csvContent = [
      ["Name", "Description", "Manager", "Status", "Priority", "Progress", "Start Date", "End Date", "Category", "Budget", "Client"],
      ...filteredProjects.map(project => [
        project.name,
        project.description,
        project.manager,
        project.status,
        project.priority || "",
        project.progress,
        project.startDate,
        project.endDate,
        project.category || "",
        project.budget || 0,
        project.client || ""
      ])
    ].map(row => row.map(field => `"${field}"`).join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `projects-export-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    toast({ title: "Success", description: "Projects exported successfully" });
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
                <h1 className="text-xl font-bold">Project Management</h1>
                {user && (
                  <p className="text-sm text-muted-foreground">Welcome, {user.firstName || user.name || "User"}</p>
                )}
                {!user && (
                  <p className="text-sm text-muted-foreground">Manage innovation lab projects</p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={() => setShowAnalytics(!showAnalytics)}>
                <BarChart3 className="h-4 w-4 mr-2" />
                Analytics
              </Button>
              <Button variant="outline" onClick={handleExportProjects}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              {user?.role === 'coordinator' && (
                <Button variant="outline" onClick={() => setShowTemplateDialog(true)}>
                  <Copy className="h-4 w-4 mr-2" />
                  Save as Template
                </Button>
              )}
              <Button variant="outline" onClick={() => navigate('/dashboard')}>
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
                  <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Create New Project</DialogTitle>
                    </DialogHeader>
                    <Tabs defaultValue="basic" className="w-full">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="basic">Basic Info</TabsTrigger>
                        <TabsTrigger value="details">Details</TabsTrigger>
                        <TabsTrigger value="team">Team & Budget</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="basic" className="space-y-4">
                        <div className="grid gap-4 py-4">
                          <div className="grid gap-2">
                            <Label htmlFor="name">Project Name *</Label>
                            <Input
                              id="name"
                              value={newProject.name}
                              onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                              placeholder="Enter project name"
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="description">Description *</Label>
                            <Textarea
                              id="description"
                              value={newProject.description}
                              onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                              placeholder="Enter project description"
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="manager">Manager *</Label>
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
                                <SelectItem value="On Hold">On Hold</SelectItem>
                                <SelectItem value="Cancelled">Cancelled</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="details" className="space-y-4">
                        <div className="grid gap-4 py-4">
                          <div className="grid gap-2">
                            <Label htmlFor="category">Category</Label>
                            <Input
                              id="category"
                              value={newProject.category}
                              onChange={(e) => setNewProject({ ...newProject, category: e.target.value })}
                              placeholder="e.g., Research, Development, Innovation"
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="priority">Priority</Label>
                            <Select value={newProject.priority} onValueChange={(value: any) => setNewProject({ ...newProject, priority: value })}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Low">Low</SelectItem>
                                <SelectItem value="Medium">Medium</SelectItem>
                                <SelectItem value="High">High</SelectItem>
                                <SelectItem value="Critical">Critical</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="client">Client/Sponsor</Label>
                            <Input
                              id="client"
                              value={newProject.client}
                              onChange={(e) => setNewProject({ ...newProject, client: e.target.value })}
                              placeholder="Enter client or sponsor name"
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="tags">Tags (comma-separated)</Label>
                            <Input
                              id="tags"
                              value={newProject.tags.join(", ")}
                              onChange={(e) => setNewProject({ ...newProject, tags: e.target.value.split(",").map(tag => tag.trim()).filter(tag => tag) })}
                              placeholder="e.g., AI, Web Development, Research"
                            />
                          </div>
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="team" className="space-y-4">
                        <div className="grid gap-4 py-4">
                          <div className="grid gap-2">
                            <Label htmlFor="budget">Budget (R)</Label>
                            <Input
                              id="budget"
                              type="number"
                              value={newProject.budget}
                              onChange={(e) => setNewProject({ ...newProject, budget: Number(e.target.value) })}
                              placeholder="Enter project budget"
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="estimatedHours">Estimated Hours</Label>
                            <Input
                              id="estimatedHours"
                              type="number"
                              value={newProject.estimatedHours}
                              onChange={(e) => setNewProject({ ...newProject, estimatedHours: Number(e.target.value) })}
                              placeholder="Enter estimated hours"
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label>Team Members</Label>
                            <div className="space-y-2 max-h-32 overflow-y-auto border rounded-md p-2">
                              {users.filter(u => u.role !== 'lecturer' && u.role !== 'coordinator').map((user) => (
                                <div key={user.id} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`team-${user.id}`}
                                    checked={newProject.team.includes(`${user.firstName} ${user.lastName}`)}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        setNewProject({
                                          ...newProject,
                                          team: [...newProject.team, `${user.firstName} ${user.lastName}`]
                                        });
                                      } else {
                                        setNewProject({
                                          ...newProject,
                                          team: newProject.team.filter(member => member !== `${user.firstName} ${user.lastName}`)
                                        });
                                      }
                                    }}
                                  />
                                  <Label htmlFor={`team-${user.id}`} className="text-sm">
                                    {user.firstName} {user.lastName} ({user.role})
                                  </Label>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
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
        {/* Analytics Dashboard */}
        {showAnalytics && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Project Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{calculateAnalytics().totalProjects}</div>
                  <div className="text-sm text-muted-foreground">Total Projects</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{calculateAnalytics().completedProjects}</div>
                  <div className="text-sm text-muted-foreground">Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{calculateAnalytics().inProgressProjects}</div>
                  <div className="text-sm text-muted-foreground">In Progress</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{calculateAnalytics().planningProjects}</div>
                  <div className="text-sm text-muted-foreground">Planning</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{calculateAnalytics().averageProgress}%</div>
                  <div className="text-sm text-muted-foreground">Avg Progress</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{calculateAnalytics().overdueProjects}</div>
                  <div className="text-sm text-muted-foreground">Overdue</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search and Filter Bar */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search projects, managers, descriptions, tags..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="Planning">Planning</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="On Hold">On Hold</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priority</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Critical">Critical</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="Research">Research</SelectItem>
                    <SelectItem value="Development">Development</SelectItem>
                    <SelectItem value="Innovation">Innovation</SelectItem>
                    <SelectItem value="Training">Training</SelectItem>
                    <SelectItem value="Consulting">Consulting</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="status">Status</SelectItem>
                    <SelectItem value="progress">Progress</SelectItem>
                    <SelectItem value="startDate">Start Date</SelectItem>
                    <SelectItem value="endDate">End Date</SelectItem>
                    <SelectItem value="priority">Priority</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                >
                  {sortOrder === "asc" ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                </Button>

                {user?.role === 'coordinator' && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="showArchived"
                      checked={showArchived}
                      onCheckedChange={(checked) => setShowArchived(checked as boolean)}
                    />
                    <Label htmlFor="showArchived" className="text-sm">Show Archived</Label>
                  </div>
                )}
              </div>
            </div>

            {/* View Mode Toggle and Bulk Actions */}
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">View:</span>
                  <div className="flex border rounded-md">
                    <Button
                      variant={viewMode === "grid" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("grid")}
                      className="rounded-r-none"
                    >
                      Grid
                    </Button>
                    <Button
                      variant={viewMode === "list" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("list")}
                      className="rounded-none border-x"
                    >
                      List
                    </Button>
                    <Button
                      variant={viewMode === "timeline" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("timeline")}
                      className="rounded-l-none"
                    >
                      Timeline
                    </Button>
                  </div>
                </div>

                {user?.role === 'coordinator' && filteredProjects.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="selectAll"
                      checked={selectedProjects.length === filteredProjects.length}
                      onCheckedChange={handleSelectAllProjects}
                    />
                    <Label htmlFor="selectAll" className="text-sm">Select All</Label>
                    
                    {selectedProjects.length > 0 && (
                      <div className="flex items-center space-x-2 ml-4">
                        <span className="text-sm text-muted-foreground">
                          {selectedProjects.length} selected
                        </span>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                              Bulk Actions
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => handleBulkStatusUpdate("In Progress")}>
                              Mark as In Progress
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleBulkStatusUpdate("Completed")}>
                              Mark as Completed
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleBulkStatusUpdate("On Hold")}>
                              Mark as On Hold
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleBulkArchive} className="text-red-600">
                              Archive Selected
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                {filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''} found
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Projects Display */}
        {viewMode === "grid" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <Card key={project.id} className="shadow-card hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-2 flex-1">
                      {user?.role === 'coordinator' && (
                        <Checkbox
                          checked={selectedProjects.includes(project.id)}
                          onCheckedChange={() => handleSelectProject(project.id)}
                          className="mt-1"
                        />
                      )}
                      <div className="flex-1">
                        <CardTitle className="text-lg line-clamp-1">{project.name}</CardTitle>
                        {project.template && (
                          <Badge variant="outline" className="text-xs mt-1">
                            <Copy className="h-3 w-3 mr-1" />
                            Template
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      {project.priority && (
                        <Badge variant={getPriorityColor(project.priority)} className="text-xs">
                          {getPriorityIcon(project.priority)}
                          <span className="ml-1">{project.priority}</span>
                        </Badge>
                      )}
                      <Badge variant={getStatusColor(project.status)}>
                        {project.status}
                      </Badge>
                    </div>
                  </div>
                  <CardDescription className="text-sm line-clamp-2">
                    {project.description}
                  </CardDescription>
                  {project.category && (
                    <Badge variant="outline" className="w-fit text-xs">
                      <Tag className="h-3 w-3 mr-1" />
                      {project.category}
                    </Badge>
                  )}
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

                    {project.budget && project.budget > 0 && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <DollarSign className="h-4 w-4 mr-2" />
                        Budget: R{project.budget.toLocaleString()}
                      </div>
                    )}

                    <div>
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="flex items-center">
                          <TrendingUp className="h-4 w-4 mr-1" />
                          Progress
                        </span>
                        <span className="font-medium">{project.progress}%</span>
                      </div>
                      <Progress value={project.progress} className="h-2" />
                    </div>

                    {project.tags && project.tags.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2">Tags</p>
                        <div className="flex flex-wrap gap-1">
                          {project.tags.slice(0, 3).map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {project.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{project.tags.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    <div>
                      <p className="text-sm font-medium mb-2">Team Members ({project.team?.length || 0})</p>
                      <div className="flex flex-wrap gap-1">
                        {project.team?.slice(0, 3).map((member, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {member}
                          </Badge>
                        ))}
                        {project.team && project.team.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{project.team.length - 3} more
                          </Badge>
                        )}
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
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Project Details</DialogTitle>
                          </DialogHeader>
                          <div className="grid gap-4 py-2">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="font-medium text-sm text-muted-foreground">Name</p>
                                <p className="text-lg">{selectedProject?.name}</p>
                              </div>
                              <div>
                                <p className="font-medium text-sm text-muted-foreground">Status</p>
                                <Badge variant={getStatusColor(selectedProject?.status || "")}>
                                  {selectedProject?.status}
                                </Badge>
                              </div>
                            </div>
                            
                            <div>
                              <p className="font-medium text-sm text-muted-foreground">Description</p>
                              <p className="whitespace-pre-wrap">{selectedProject?.description}</p>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="font-medium text-sm text-muted-foreground">Manager</p>
                                <p>{selectedProject?.manager}</p>
                              </div>
                              <div>
                                <p className="font-medium text-sm text-muted-foreground">Priority</p>
                                <Badge variant={getPriorityColor(selectedProject?.priority || "")}>
                                  {selectedProject?.priority}
                                </Badge>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="font-medium text-sm text-muted-foreground">Start Date</p>
                                <p>{selectedProject?.startDate}</p>
                              </div>
                              <div>
                                <p className="font-medium text-sm text-muted-foreground">End Date</p>
                                <p>{selectedProject?.endDate}</p>
                              </div>
                            </div>

                            {selectedProject?.budget && selectedProject.budget > 0 && (
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <p className="font-medium text-sm text-muted-foreground">Budget</p>
                                  <p>R{selectedProject.budget.toLocaleString()}</p>
                                </div>
                                <div>
                                  <p className="font-medium text-sm text-muted-foreground">Estimated Hours</p>
                                  <p>{selectedProject.estimatedHours || 0} hours</p>
                                </div>
                              </div>
                            )}

                            {selectedProject?.client && (
                              <div>
                                <p className="font-medium text-sm text-muted-foreground">Client/Sponsor</p>
                                <p>{selectedProject.client}</p>
                              </div>
                            )}

                            {selectedProject?.category && (
                              <div>
                                <p className="font-medium text-sm text-muted-foreground">Category</p>
                                <Badge variant="outline">{selectedProject.category}</Badge>
                              </div>
                            )}

                            {selectedProject?.tags && selectedProject.tags.length > 0 && (
                              <div>
                                <p className="font-medium text-sm text-muted-foreground">Tags</p>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {selectedProject.tags.map((tag, idx) => (
                                    <Badge key={idx} variant="secondary" className="text-xs">{tag}</Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            {selectedProject?.team && selectedProject.team.length > 0 && (
                              <div>
                                <p className="font-medium text-sm text-muted-foreground">Team Members</p>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {selectedProject.team.map((member, idx) => (
                                    <Badge key={idx} variant="outline" className="text-xs">{member}</Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div>
                              <p className="font-medium text-sm text-muted-foreground">Progress</p>
                              <div className="flex items-center space-x-2 mt-1">
                                <Progress value={selectedProject?.progress || 0} className="flex-1" />
                                <span className="text-sm font-medium">{selectedProject?.progress || 0}%</span>
                              </div>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      
                      {user?.role === 'coordinator' && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditProject(project)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleCloneProject(project)}>
                              <Copy className="h-4 w-4 mr-2" />
                              Clone
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => project.archived ? handleRestoreProject(project.id) : handleDeleteProject(project.id)}
                              className={project.archived ? "text-green-600" : "text-red-600"}
                            >
                              {project.archived ? (
                                <>
                                  <Archive className="h-4 w-4 mr-2" />
                                  Restore
                                </>
                              ) : (
                                <>
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Archive
                                </>
                              )}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* List View */}
        {viewMode === "list" && (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b">
                    <tr className="text-left">
                      <th className="p-4 font-medium">Project</th>
                      <th className="p-4 font-medium">Status</th>
                      <th className="p-4 font-medium">Priority</th>
                      <th className="p-4 font-medium">Manager</th>
                      <th className="p-4 font-medium">Progress</th>
                      <th className="p-4 font-medium">Due Date</th>
                      <th className="p-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProjects.map((project) => (
                      <tr key={project.id} className="border-b hover:bg-muted/50">
                        <td className="p-4">
                          <div>
                            <div className="font-medium">{project.name}</div>
                            <div className="text-sm text-muted-foreground line-clamp-1">{project.description}</div>
                            {project.category && (
                              <Badge variant="outline" className="text-xs mt-1">
                                {project.category}
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge variant={getStatusColor(project.status)}>
                            {project.status}
                          </Badge>
                        </td>
                        <td className="p-4">
                          {project.priority && (
                            <Badge variant={getPriorityColor(project.priority)}>
                              {getPriorityIcon(project.priority)}
                              <span className="ml-1">{project.priority}</span>
                            </Badge>
                          )}
                        </td>
                        <td className="p-4 text-sm">{project.manager}</td>
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            <Progress value={project.progress} className="w-16" />
                            <span className="text-sm font-medium">{project.progress}%</span>
                          </div>
                        </td>
                        <td className="p-4 text-sm">{project.endDate}</td>
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            <Button variant="outline" size="sm" onClick={() => openProjectDetails(project)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            {user?.role === 'coordinator' && (
                              <>
                                <Button variant="outline" size="sm" onClick={() => openEditProject(project)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm">
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleCloneProject(project)}>
                                      <Copy className="h-4 w-4 mr-2" />
                                      Clone
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                      onClick={() => project.archived ? handleRestoreProject(project.id) : handleDeleteProject(project.id)}
                                      className={project.archived ? "text-green-600" : "text-red-600"}
                                    >
                                      {project.archived ? (
                                        <>
                                          <Archive className="h-4 w-4 mr-2" />
                                          Restore
                                        </>
                                      ) : (
                                        <>
                                          <Trash2 className="h-4 w-4 mr-2" />
                                          Archive
                                        </>
                                      )}
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Timeline View */}
        {viewMode === "timeline" && (
          <div className="space-y-4">
            {filteredProjects.map((project) => (
              <Card key={project.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold">{project.name}</h3>
                        <Badge variant={getStatusColor(project.status)}>
                          {project.status}
                        </Badge>
                        {project.priority && (
                          <Badge variant={getPriorityColor(project.priority)}>
                            {getPriorityIcon(project.priority)}
                            <span className="ml-1">{project.priority}</span>
                          </Badge>
                        )}
                      </div>
                      <p className="text-muted-foreground mb-4 line-clamp-2">{project.description}</p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Manager:</span>
                          <p>{project.manager}</p>
                        </div>
                        <div>
                          <span className="font-medium">Duration:</span>
                          <p>{project.startDate} - {project.endDate}</p>
                        </div>
                        <div>
                          <span className="font-medium">Progress:</span>
                          <div className="flex items-center space-x-2">
                            <Progress value={project.progress} className="w-20" />
                            <span>{project.progress}%</span>
                          </div>
                        </div>
                        <div>
                          <span className="font-medium">Team:</span>
                          <p>{project.team?.length || 0} members</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <Button variant="outline" size="sm" onClick={() => openProjectDetails(project)}>
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      {user?.role === 'coordinator' && (
                        <Button variant="outline" size="sm" onClick={() => openEditProject(project)}>
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {filteredProjects.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No projects found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || statusFilter !== "all" || priorityFilter !== "all" || categoryFilter !== "all"
                  ? "Try adjusting your search or filter criteria."
                  : "Get started by creating your first project."}
              </p>
              {user?.role === 'coordinator' && (
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Project
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Edit Project Dialog */}
        {user?.role === 'coordinator' && (
          <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
            <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Project</DialogTitle>
              </DialogHeader>
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="team">Team & Budget</TabsTrigger>
                </TabsList>
                
                <TabsContent value="basic" className="space-y-4">
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="edit-name">Project Name *</Label>
                      <Input
                        id="edit-name"
                        value={editProject.name}
                        onChange={(e) => setEditProject({ ...editProject, name: e.target.value })}
                        placeholder="Enter project name"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="edit-description">Description *</Label>
                      <Textarea
                        id="edit-description"
                        value={editProject.description}
                        onChange={(e) => setEditProject({ ...editProject, description: e.target.value })}
                        placeholder="Enter project description"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="edit-manager">Manager *</Label>
                      <Select value={editProject.manager} onValueChange={(value) => setEditProject({ ...editProject, manager: value })}>
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
                        <Label htmlFor="edit-startDate">Start Date</Label>
                        <Input
                          id="edit-startDate"
                          type="date"
                          value={editProject.startDate}
                          onChange={(e) => setEditProject({ ...editProject, startDate: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="edit-endDate">End Date</Label>
                        <Input
                          id="edit-endDate"
                          type="date"
                          value={editProject.endDate}
                          onChange={(e) => setEditProject({ ...editProject, endDate: e.target.value })}
                        />
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
                          <SelectItem value="On Hold">On Hold</SelectItem>
                          <SelectItem value="Cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="details" className="space-y-4">
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="edit-category">Category</Label>
                      <Input
                        id="edit-category"
                        value={editProject.category}
                        onChange={(e) => setEditProject({ ...editProject, category: e.target.value })}
                        placeholder="e.g., Research, Development, Innovation"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="edit-priority">Priority</Label>
                      <Select value={editProject.priority} onValueChange={(value: any) => setEditProject({ ...editProject, priority: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Low">Low</SelectItem>
                          <SelectItem value="Medium">Medium</SelectItem>
                          <SelectItem value="High">High</SelectItem>
                          <SelectItem value="Critical">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="edit-client">Client/Sponsor</Label>
                      <Input
                        id="edit-client"
                        value={editProject.client}
                        onChange={(e) => setEditProject({ ...editProject, client: e.target.value })}
                        placeholder="Enter client or sponsor name"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="edit-tags">Tags (comma-separated)</Label>
                      <Input
                        id="edit-tags"
                        value={editProject.tags.join(", ")}
                        onChange={(e) => setEditProject({ ...editProject, tags: e.target.value.split(",").map(tag => tag.trim()).filter(tag => tag) })}
                        placeholder="e.g., AI, Web Development, Research"
                      />
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="team" className="space-y-4">
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="edit-budget">Budget (R)</Label>
                      <Input
                        id="edit-budget"
                        type="number"
                        value={editProject.budget}
                        onChange={(e) => setEditProject({ ...editProject, budget: Number(e.target.value) })}
                        placeholder="Enter project budget"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="edit-estimatedHours">Estimated Hours</Label>
                      <Input
                        id="edit-estimatedHours"
                        type="number"
                        value={editProject.estimatedHours}
                        onChange={(e) => setEditProject({ ...editProject, estimatedHours: Number(e.target.value) })}
                        placeholder="Enter estimated hours"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Team Members</Label>
                      <div className="space-y-2 max-h-32 overflow-y-auto border rounded-md p-2">
                        {users.filter(u => u.role !== 'lecturer' && u.role !== 'coordinator').map((user) => (
                          <div key={user.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`edit-team-${user.id}`}
                              checked={editProject.team.includes(`${user.firstName} ${user.lastName}`)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setEditProject({
                                    ...editProject,
                                    team: [...editProject.team, `${user.firstName} ${user.lastName}`]
                                  });
                                } else {
                                  setEditProject({
                                    ...editProject,
                                    team: editProject.team.filter(member => member !== `${user.firstName} ${user.lastName}`)
                                  });
                                }
                              }}
                            />
                            <Label htmlFor={`edit-team-${user.id}`} className="text-sm">
                              {user.firstName} {user.lastName} ({user.role})
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => { setShowEditDialog(false); setSelectedProject(null); }}>
                  Cancel
                </Button>
                <Button onClick={handleEditProjectSave}>
                  Save Changes
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Template Dialog */}
        <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Save as Template</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="templateName">Template Name</Label>
                <Input
                  id="templateName"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="Enter template name"
                />
              </div>
              <div className="text-sm text-muted-foreground">
                This will create a reusable template based on the current project form.
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowTemplateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateTemplate}>
                Create Template
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Projects;