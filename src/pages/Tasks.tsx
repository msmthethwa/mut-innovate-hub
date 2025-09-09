import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import { useToast } from "@/hooks/use-toast";
import {
  CheckCircle,
  Clock,
  Plus,
  Search,
  Filter,
  Calendar as CalendarIcon,
  User,
  AlertCircle,
  SortAsc,
  SortDesc,
  Trash2,
  Archive,
  Download,
  BarChart3,
  Users,
  Tag,
  DollarSign,
  MoreVertical,
  Edit,
  Copy,
  Eye,
  Play,
  Pause,
  Square,
  Flag,
  Calendar,
  Timer,
  FileText,
  Paperclip,
  Send,
  Bell,
  Settings,
  Grid3X3,
  List,
  Calendar as CalendarView,
  TrendingUp,
  Target,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock3,
  Star,
  Bookmark,
  MessageSquare,
  Upload,
  Download as DownloadIcon,
  RefreshCw,
  Zap
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, collection, getDocs, addDoc, updateDoc, query, where, onSnapshot, orderBy, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

interface Task {
  id: string;
  title: string;
  description: string;
  assignedTo: string;
  assigneeName: string;
  projectId: string;
  projectName: string;
  status: string;
  priority: string;
  progress: number;
  dueDate: string;
  createdAt: any;
  updatedAt: any;
  category?: string;
  tags?: string[];
  estimatedHours?: number;
  actualHours?: number;
  startDate?: string;
  completedDate?: string;
  createdBy?: string;
  createdByName?: string;
  parentTaskId?: string;
  subtasks?: string[];
  dependencies?: string[];
  attachments?: string[];
  comments?: any[];
  archived?: boolean;
  template?: boolean;
  recurring?: boolean;
  recurringPattern?: string;
  reminderDate?: string;
  budget?: number;
  client?: string;
  labels?: string[];
  customFields?: Record<string, any>;
}

const Tasks = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [progressDraft, setProgressDraft] = useState<number>(0);
  const [messages, setMessages] = useState<any[]>([]);
  const [messageText, setMessageText] = useState("");
  
  // Advanced filtering and sorting states
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("dueDate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [viewMode, setViewMode] = useState<"list" | "grid" | "calendar" | "kanban">("list");
  const [showArchived, setShowArchived] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  
  // Bulk operations states
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  
  // Task editing states
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  
  // Time tracking states
  const [timeTracking, setTimeTracking] = useState<Record<string, { startTime: Date | null; elapsed: number }>>({});
  const [showTimeTracking, setShowTimeTracking] = useState(false);
  
  // Template states
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    assignedTo: "",
    projectId: "",
    priority: "Medium",
    dueDate: "",
    progress: 0,
    category: "",
    tags: [] as string[],
    estimatedHours: 0,
    startDate: "",
    budget: 0,
    client: "",
    labels: [] as string[]
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUser({ id: currentUser.uid, ...userData });
            await fetchTasks(currentUser.uid, userData.role);
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

  const fetchTasks = async (userId: string, userRole: string) => {
    try {
      let tasksQuery;
      if (userRole === 'coordinator') {
        // Coordinators can see all tasks
        tasksQuery = collection(db, "tasks");
      } else {
        // Staff and interns only see tasks assigned to them
        tasksQuery = query(collection(db, "tasks"), where("assignedTo", "==", userId));
      }
      
      const tasksSnapshot = await getDocs(tasksQuery);
      const tasksData: Task[] = tasksSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data() as any
      }));
      
      setTasks(tasksData);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      toast({
        title: "Error",
        description: "Failed to fetch tasks",
        variant: "destructive",
      });
    }
  };

  const fetchProjects = async () => {
    try {
      const projectsCollection = collection(db, "projects");
      const projectsSnapshot = await getDocs(projectsCollection);
      const projectsData = projectsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data() as any
      }));
      setProjects(projectsData);
    } catch (error) {
      console.error("Error fetching projects:", error);
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

  const handleCreateTask = async () => {
    if (!newTask.title || !newTask.description || !newTask.assignedTo || !newTask.projectId) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const assignedUser = users.find(u => u.id === newTask.assignedTo);
      const project = projects.find(p => p.id === newTask.projectId);
      
      await addDoc(collection(db, "tasks"), {
        ...newTask,
        assigneeName: `${assignedUser?.firstName} ${assignedUser?.lastName}`,
        projectName: project?.name,
        status: "Pending",
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      toast({
        title: "Success",
        description: "Task created successfully",
      });
      
      setShowCreateDialog(false);
      setNewTask({
        title: "",
        description: "",
        assignedTo: "",
        projectId: "",
        priority: "Medium",
        dueDate: "",
        progress: 0,
        category: "",
        tags: [],
        estimatedHours: 0,
        startDate: "",
        budget: 0,
        client: "",
        labels: []
      });
      
      await fetchTasks(user.id, user.role);
    } catch (error) {
      console.error("Error creating task:", error);
      toast({
        title: "Error",
        description: "Failed to create task",
        variant: "destructive",
      });
    }
  };

  const handleUpdateProgress = async (taskId: string, progress: number) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      const status = progress === 100 ? "Completed" : progress > 0 ? "In Progress" : "Pending";

      await updateDoc(doc(db, "tasks", taskId), {
        progress,
        status,
        updatedAt: new Date()
      });

      // Update project progress only for coordinators
      if (user?.role === 'coordinator') {
        await updateProjectProgress(task.projectId);
      }

      toast({
        title: "Success",
        description: "Task progress updated",
      });

      await fetchTasks(user.id, user.role);
    } catch (error) {
      console.error("Error updating task:", error);
      toast({
        title: "Error",
        description: "Failed to update task progress",
        variant: "destructive",
      });
    }
  };

  const handleUpdateStatus = async (taskId: string, newStatus: string) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      let progress = task.progress;
      if (newStatus === 'In Progress' && progress === 0) {
        progress = 10;
      } else if (newStatus === 'Completed') {
        progress = 100;
      }

      await updateDoc(doc(db, "tasks", taskId), {
        status: newStatus,
        progress,
        updatedAt: new Date()
      });

      // Update project progress only for coordinators
      if (user?.role === 'coordinator') {
        await updateProjectProgress(task.projectId);
      }

      toast({
        title: "Success",
        description: `Task marked as ${newStatus}`,
      });

      await fetchTasks(user.id, user.role);

      // Update selectedTask
      if (selectedTask && selectedTask.id === taskId) {
        setSelectedTask({ ...selectedTask, status: newStatus, progress });
      }
    } catch (error) {
      console.error("Error updating task status:", error);
      toast({
        title: "Error",
        description: "Failed to update task status",
        variant: "destructive",
      });
    }
  };

  const updateProjectProgress = async (projectId: string) => {
    try {
      const tasksQuery = query(collection(db, "tasks"), where("projectId", "==", projectId));
      const tasksSnapshot = await getDocs(tasksQuery);
      const projectTasks = tasksSnapshot.docs.map(doc => doc.data() as Task);

      if (projectTasks.length === 0) return;

      const totalProgress = projectTasks.reduce((sum, task) => sum + task.progress, 0);
      const averageProgress = Math.round(totalProgress / projectTasks.length);

      await updateDoc(doc(db, "projects", projectId), {
        progress: averageProgress,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error("Error updating project progress:", error);
    }
  };

  // Subscribe to chat messages for the selected task
  useEffect(() => {
    if (!selectedTask || !showDetailsDialog) return;
    const messagesRef = collection(db, "tasks", selectedTask.id, "messages");
    const q = query(messagesRef, orderBy("createdAt", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setMessages(msgs);
    });
    return () => unsubscribe();
  }, [selectedTask, showDetailsDialog]);

  const openTaskDetails = (task: Task) => {
    setSelectedTask(task);
    setProgressDraft(task.progress);
    setShowDetailsDialog(true);
  };

  const handleSendMessage = async () => {
    if (!selectedTask || !messageText.trim() || !user) return;
    try {
      await addDoc(collection(db, "tasks", selectedTask.id, "messages"), {
        text: messageText.trim(),
        userId: user.id,
        role: user.role,
        createdAt: serverTimestamp(),
      });
      setMessageText("");
    } catch (error) {
      console.error("Error sending message:", error);
      toast({ title: "Error", description: "Failed to send message", variant: "destructive" });
    }
  };

  const filteredTasks = tasks
    .filter(task => {
      // Search filter
      const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.assigneeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (task.tags && task.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())));
      
      // Status filter
      const matchesStatus = statusFilter === "all" || task.status.toLowerCase().replace(" ", "") === statusFilter;
      
      // Priority filter
      const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter;
      
      // Assignee filter
      const matchesAssignee = assigneeFilter === "all" || task.assignedTo === assigneeFilter;
      
      // Project filter
      const matchesProject = projectFilter === "all" || task.projectId === projectFilter;
      
      // Category filter
      const matchesCategory = categoryFilter === "all" || task.category === categoryFilter;
      
      // Archive filter
      const matchesArchive = showArchived ? task.archived : !task.archived;
      
      return matchesSearch && matchesStatus && matchesPriority && matchesAssignee && matchesProject && matchesCategory && matchesArchive;
    })
    .sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case "title":
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case "status":
          aValue = a.status;
          bValue = b.status;
          break;
        case "priority":
          const priorityOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
          aValue = priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
          bValue = priorityOrder[b.priority as keyof typeof priorityOrder] || 0;
          break;
        case "dueDate":
          aValue = new Date(a.dueDate);
          bValue = new Date(b.dueDate);
          break;
        case "createdAt":
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        case "progress":
          aValue = a.progress;
          bValue = b.progress;
          break;
        case "assignee":
          aValue = a.assigneeName.toLowerCase();
          bValue = b.assigneeName.toLowerCase();
          break;
        case "project":
          aValue = a.projectName.toLowerCase();
          bValue = b.projectName.toLowerCase();
          break;
        default:
          aValue = new Date(a.dueDate);
          bValue = new Date(b.dueDate);
      }
      
      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading tasks...</p>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed": return "default";
      case "In Progress": return "secondary";
      case "Pending": return "outline";
      default: return "outline";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High": return "destructive";
      case "Medium": return "secondary";
      case "Low": return "outline";
      default: return "outline";
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "High": return <AlertCircle className="h-4 w-4" />;
      case "Medium": return <Clock className="h-4 w-4" />;
      case "Low": return <CheckCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  // Advanced task management functions
  const handleEditTask = (task: Task) => {
    setEditTask(task);
    setShowEditDialog(true);
  };

  const handleSaveEditTask = async () => {
    if (!editTask) return;
    
    try {
      await updateDoc(doc(db, "tasks", editTask.id), {
        ...editTask,
        updatedAt: new Date()
      });
      
      toast({ title: "Success", description: "Task updated successfully" });
      setShowEditDialog(false);
      setEditTask(null);
      await fetchTasks(user.id, user.role);
    } catch (error) {
      console.error("Error updating task:", error);
      toast({ title: "Error", description: "Failed to update task", variant: "destructive" });
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await updateDoc(doc(db, "tasks", taskId), {
        archived: true,
        updatedAt: new Date()
      });
      toast({ title: "Success", description: "Task archived successfully" });
      await fetchTasks(user.id, user.role);
    } catch (error) {
      console.error("Error archiving task:", error);
      toast({ title: "Error", description: "Failed to archive task", variant: "destructive" });
    }
  };

  const handleRestoreTask = async (taskId: string) => {
    try {
      await updateDoc(doc(db, "tasks", taskId), {
        archived: false,
        updatedAt: new Date()
      });
      toast({ title: "Success", description: "Task restored successfully" });
      await fetchTasks(user.id, user.role);
    } catch (error) {
      console.error("Error restoring task:", error);
      toast({ title: "Error", description: "Failed to restore task", variant: "destructive" });
    }
  };

  const handleCloneTask = async (task: Task) => {
    try {
      const clonedTask = {
        ...task,
        title: `${task.title} (Copy)`,
        status: "Pending",
        progress: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      delete clonedTask.id;
      
      await addDoc(collection(db, "tasks"), clonedTask);
      toast({ title: "Success", description: "Task cloned successfully" });
      await fetchTasks(user.id, user.role);
    } catch (error) {
      console.error("Error cloning task:", error);
      toast({ title: "Error", description: "Failed to clone task", variant: "destructive" });
    }
  };

  // Bulk operations functions
  const handleSelectTask = (taskId: string) => {
    setSelectedTasks(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  const handleSelectAllTasks = () => {
    if (selectedTasks.length === filteredTasks.length) {
      setSelectedTasks([]);
    } else {
      setSelectedTasks(filteredTasks.map(t => t.id));
    }
  };

  const handleBulkStatusUpdate = async (status: string) => {
    try {
      const updatePromises = selectedTasks.map(taskId => 
        updateDoc(doc(db, "tasks", taskId), {
          status,
          updatedAt: new Date()
        })
      );
      await Promise.all(updatePromises);
      toast({ title: "Success", description: `Updated ${selectedTasks.length} tasks to ${status}` });
      setSelectedTasks([]);
      await fetchTasks(user.id, user.role);
    } catch (error) {
      console.error("Error updating tasks:", error);
      toast({ title: "Error", description: "Failed to update tasks", variant: "destructive" });
    }
  };

  const handleBulkArchive = async () => {
    try {
      const updatePromises = selectedTasks.map(taskId => 
        updateDoc(doc(db, "tasks", taskId), {
          archived: true,
          updatedAt: new Date()
        })
      );
      await Promise.all(updatePromises);
      toast({ title: "Success", description: `Archived ${selectedTasks.length} tasks` });
      setSelectedTasks([]);
      await fetchTasks(user.id, user.role);
    } catch (error) {
      console.error("Error archiving tasks:", error);
      toast({ title: "Error", description: "Failed to archive tasks", variant: "destructive" });
    }
  };

  // Time tracking functions
  const handleStartTimeTracking = (taskId: string) => {
    setTimeTracking(prev => ({
      ...prev,
      [taskId]: {
        startTime: new Date(),
        elapsed: prev[taskId]?.elapsed || 0
      }
    }));
  };

  const handleStopTimeTracking = (taskId: string) => {
    const tracking = timeTracking[taskId];
    if (tracking?.startTime) {
      const elapsed = tracking.elapsed + (Date.now() - tracking.startTime.getTime()) / 1000 / 60; // in minutes
      setTimeTracking(prev => ({
        ...prev,
        [taskId]: {
          startTime: null,
          elapsed: Math.round(elapsed)
        }
      }));
    }
  };

  // Analytics functions
  const calculateAnalytics = () => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === "Completed").length;
    const inProgressTasks = tasks.filter(t => t.status === "In Progress").length;
    const pendingTasks = tasks.filter(t => t.status === "Pending").length;
    const overdueTasks = tasks.filter(t => 
      t.status !== "Completed" && new Date(t.dueDate) < new Date()
    ).length;
    const averageProgress = tasks.reduce((sum, t) => sum + t.progress, 0) / totalTasks || 0;
    
    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      pendingTasks,
      overdueTasks,
      averageProgress: Math.round(averageProgress)
    };
  };

  // Export functions
  const handleExportTasks = () => {
    const csvContent = [
      ["Title", "Description", "Assignee", "Project", "Status", "Priority", "Progress", "Due Date", "Category", "Estimated Hours", "Actual Hours"],
      ...filteredTasks.map(task => [
        task.title,
        task.description,
        task.assigneeName,
        task.projectName,
        task.status,
        task.priority,
        task.progress,
        task.dueDate,
        task.category || "",
        task.estimatedHours || 0,
        task.actualHours || 0
      ])
    ].map(row => row.map(field => `"${field}"`).join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tasks-export-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    toast({ title: "Success", description: "Tasks exported successfully" });
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
                <h1 className="text-xl font-bold">Task Management</h1>
                <p className="text-sm text-muted-foreground">Manage project tasks and assignments</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={() => setShowAnalytics(!showAnalytics)}>
                <BarChart3 className="h-4 w-4 mr-2" />
                Analytics
              </Button>
              <Button variant="outline" onClick={handleExportTasks}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" onClick={() => navigate('/dashboard')}>
                Back to Dashboard
              </Button>
              {user?.role === 'coordinator' && (
                <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      New Task
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Create New Task</DialogTitle>
                      <DialogDescription>
                        Create a new task by filling out the form below.
                      </DialogDescription>
                    </DialogHeader>
                    <Tabs defaultValue="basic" className="w-full">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="basic">Basic Info</TabsTrigger>
                        <TabsTrigger value="details">Details</TabsTrigger>
                        <TabsTrigger value="advanced">Advanced</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="basic" className="space-y-4">
                        <div className="grid gap-4 py-4">
                          <div className="grid gap-2">
                            <Label htmlFor="title">Task Title *</Label>
                            <Input
                              id="title"
                              value={newTask.title}
                              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                              placeholder="Enter task title"
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="description">Description *</Label>
                            <Textarea
                              id="description"
                              value={newTask.description}
                              onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                              placeholder="Enter task description"
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="project">Project *</Label>
                            <Select value={newTask.projectId} onValueChange={(value) => setNewTask({ ...newTask, projectId: value })}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select project" />
                              </SelectTrigger>
                              <SelectContent>
                                {projects.map((project) => (
                                  <SelectItem key={project.id} value={project.id}>
                                    {project.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="assignee">Assign To *</Label>
                            <Select value={newTask.assignedTo} onValueChange={(value) => setNewTask({ ...newTask, assignedTo: value })}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select assignee" />
                              </SelectTrigger>
                              <SelectContent>
                                {users.filter(u => u.role === 'staff' || u.role === 'intern').map((user) => (
                                  <SelectItem key={user.id} value={user.id}>
                                    {user.firstName} {user.lastName} ({user.role})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                              <Label htmlFor="priority">Priority</Label>
                              <Select value={newTask.priority} onValueChange={(value) => setNewTask({ ...newTask, priority: value })}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Low">Low</SelectItem>
                                  <SelectItem value="Medium">Medium</SelectItem>
                                  <SelectItem value="High">High</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="dueDate">Due Date</Label>
                              <Input
                                id="dueDate"
                                type="date"
                                value={newTask.dueDate}
                                onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                              />
                            </div>
                          </div>
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="details" className="space-y-4">
                        <div className="grid gap-4 py-4">
                          <div className="grid gap-2">
                            <Label htmlFor="category">Category</Label>
                            <Input
                              id="category"
                              value={newTask.category}
                              onChange={(e) => setNewTask({ ...newTask, category: e.target.value })}
                              placeholder="e.g., Development, Testing, Documentation"
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="tags">Tags (comma-separated)</Label>
                            <Input
                              id="tags"
                              value={newTask.tags.join(", ")}
                              onChange={(e) => setNewTask({ ...newTask, tags: e.target.value.split(",").map(tag => tag.trim()).filter(tag => tag) })}
                              placeholder="e.g., urgent, frontend, bug-fix"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                              <Label htmlFor="estimatedHours">Estimated Hours</Label>
                              <Input
                                id="estimatedHours"
                                type="number"
                                value={newTask.estimatedHours}
                                onChange={(e) => setNewTask({ ...newTask, estimatedHours: Number(e.target.value) })}
                                placeholder="Enter estimated hours"
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="budget">Budget (R)</Label>
                              <Input
                                id="budget"
                                type="number"
                                value={newTask.budget}
                                onChange={(e) => setNewTask({ ...newTask, budget: Number(e.target.value) })}
                                placeholder="Enter budget"
                              />
                            </div>
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="client">Client/Sponsor</Label>
                            <Input
                              id="client"
                              value={newTask.client}
                              onChange={(e) => setNewTask({ ...newTask, client: e.target.value })}
                              placeholder="Enter client or sponsor name"
                            />
                          </div>
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="advanced" className="space-y-4">
                        <div className="grid gap-4 py-4">
                          <div className="grid gap-2">
                            <Label htmlFor="startDate">Start Date</Label>
                            <Input
                              id="startDate"
                              type="date"
                              value={newTask.startDate}
                              onChange={(e) => setNewTask({ ...newTask, startDate: e.target.value })}
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="labels">Labels (comma-separated)</Label>
                            <Input
                              id="labels"
                              value={newTask.labels.join(", ")}
                              onChange={(e) => setNewTask({ ...newTask, labels: e.target.value.split(",").map(label => label.trim()).filter(label => label) })}
                              placeholder="e.g., milestone, review, critical"
                            />
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateTask}>
                        Create Task
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
                Task Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{calculateAnalytics().totalTasks}</div>
                  <div className="text-sm text-muted-foreground">Total Tasks</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{calculateAnalytics().completedTasks}</div>
                  <div className="text-sm text-muted-foreground">Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{calculateAnalytics().inProgressTasks}</div>
                  <div className="text-sm text-muted-foreground">In Progress</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{calculateAnalytics().pendingTasks}</div>
                  <div className="text-sm text-muted-foreground">Pending</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{calculateAnalytics().averageProgress}%</div>
                  <div className="text-sm text-muted-foreground">Avg Progress</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{calculateAnalytics().overdueTasks}</div>
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
                  placeholder="Search tasks, assignees, projects, descriptions..."
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
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="inprogress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="onhold">On Hold</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
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
                  </SelectContent>
                </Select>

                <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Assignee" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Assignees</SelectItem>
                    {users.filter(u => u.role === 'staff' || u.role === 'intern').map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.firstName} {user.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={projectFilter} onValueChange={setProjectFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Projects</SelectItem>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dueDate">Due Date</SelectItem>
                    <SelectItem value="title">Title</SelectItem>
                    <SelectItem value="status">Status</SelectItem>
                    <SelectItem value="priority">Priority</SelectItem>
                    <SelectItem value="progress">Progress</SelectItem>
                    <SelectItem value="assignee">Assignee</SelectItem>
                    <SelectItem value="project">Project</SelectItem>
                    <SelectItem value="createdAt">Created Date</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                >
                  {sortOrder === "asc" ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                </Button>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="showArchived"
                    checked={showArchived}
                    onCheckedChange={(checked) => setShowArchived(checked as boolean)}
                  />
                  <Label htmlFor="showArchived" className="text-sm">Show Archived</Label>
                </div>
              </div>
            </div>

            {/* View Mode Toggle and Bulk Actions */}
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">View:</span>
                  <div className="flex border rounded-md">
                    <Button
                      variant={viewMode === "list" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("list")}
                      className="rounded-r-none"
                    >
                      <List className="h-4 w-4 mr-1" />
                      List
                    </Button>
                    <Button
                      variant={viewMode === "grid" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("grid")}
                      className="rounded-none border-x"
                    >
                      <Grid3X3 className="h-4 w-4 mr-1" />
                      Grid
                    </Button>
                    <Button
                      variant={viewMode === "kanban" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("kanban")}
                      className="rounded-none border-x"
                    >
                      <Target className="h-4 w-4 mr-1" />
                      Kanban
                    </Button>
                    <Button
                      variant={viewMode === "calendar" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("calendar")}
                      className="rounded-l-none"
                    >
                      <CalendarView className="h-4 w-4 mr-1" />
                      Calendar
                    </Button>
                  </div>
                </div>

                {user?.role === 'coordinator' && filteredTasks.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="selectAll"
                      checked={selectedTasks.length === filteredTasks.length}
                      onCheckedChange={handleSelectAllTasks}
                    />
                    <Label htmlFor="selectAll" className="text-sm">Select All</Label>
                    
                    {selectedTasks.length > 0 && (
                      <div className="flex items-center space-x-2 ml-4">
                        <span className="text-sm text-muted-foreground">
                          {selectedTasks.length} selected
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
                {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''} found
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tasks Display */}
        {viewMode === "list" && (
          <div className="space-y-4">
            {filteredTasks.map((task) => (
              <Card key={task.id} className="shadow-card hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-2 flex-1">
                      {user?.role === 'coordinator' && (
                        <Checkbox
                          checked={selectedTasks.includes(task.id)}
                          onCheckedChange={() => handleSelectTask(task.id)}
                          className="mt-1"
                        />
                      )}
                      <div className="flex-1">
                        <CardTitle className="text-lg line-clamp-1">{task.title}</CardTitle>
                        <CardDescription className="text-sm mt-1 line-clamp-2">
                          {task.description}
                        </CardDescription>
                        {task.template && (
                          <Badge variant="outline" className="text-xs mt-1 w-fit">
                            <Copy className="h-3 w-3 mr-1" />
                            Template
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={getPriorityColor(task.priority)} className="flex items-center gap-1">
                        {getPriorityIcon(task.priority)}
                        {task.priority}
                      </Badge>
                      <Badge variant={getStatusColor(task.status)}>
                        {task.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <User className="h-4 w-4 mr-2" />
                      <div>
                        <p className="font-medium">Assignee</p>
                        <p>{task.assigneeName}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center text-sm text-muted-foreground">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      <div>
                        <p className="font-medium">Due Date</p>
                        <p>{task.dueDate}</p>
                      </div>
                    </div>

                    <div className="text-sm text-muted-foreground">
                      <p className="font-medium">Project</p>
                      <p>{task.projectName}</p>
                    </div>

                    <div className="text-sm text-muted-foreground">
                      <p className="font-medium">Progress</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Progress value={task.progress} className="flex-1 h-2" />
                        <span className="text-xs font-medium">{task.progress}%</span>
                      </div>
                    </div>
                  </div>

                  {task.tags && task.tags.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-medium mb-2">Tags</p>
                      <div className="flex flex-wrap gap-1">
                        {task.tags.slice(0, 3).map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {task.tags.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{task.tags.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center space-x-2">
                      {task.assignedTo === user?.id && task.status === 'Pending' && (
                        <Button size="sm" onClick={() => handleUpdateStatus(task.id, 'In Progress')}>
                          <Play className="h-4 w-4 mr-1" />
                          Start
                        </Button>
                      )}
                      {task.assignedTo === user?.id && task.status === 'In Progress' && (
                        <Button size="sm" onClick={() => handleUpdateStatus(task.id, 'Completed')}>
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Complete
                        </Button>
                      )}
                      {timeTracking[task.id] && (
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => timeTracking[task.id]?.startTime ? handleStopTimeTracking(task.id) : handleStartTimeTracking(task.id)}
                          >
                            {timeTracking[task.id]?.startTime ? <Pause className="h-4 w-4 mr-1" /> : <Play className="h-4 w-4 mr-1" />}
                            {timeTracking[task.id]?.startTime ? 'Stop' : 'Start'} Timer
                          </Button>
                          <span className="text-xs text-muted-foreground">
                            {Math.floor((timeTracking[task.id]?.elapsed || 0) / 60)}h {Math.floor((timeTracking[task.id]?.elapsed || 0) % 60)}m
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Dialog open={showDetailsDialog && selectedTask?.id === task.id} onOpenChange={(open) => {
                        if (!open) {
                          setShowDetailsDialog(false);
                          setSelectedTask(null);
                          setMessages([]);
                        }
                      }}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => openTaskDetails(task)}>
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[900px] max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Task Details</DialogTitle>
                          </DialogHeader>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-2">
                            <div className="space-y-3 text-sm">
                              <div>
                                <p className="font-medium">Title</p>
                                <p>{selectedTask?.title}</p>
                              </div>
                              <div>
                                <p className="font-medium">Description</p>
                                <p className="whitespace-pre-wrap">{selectedTask?.description}</p>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <p className="font-medium">Project</p>
                                  <p>{selectedTask?.projectName}</p>
                                </div>
                                <div>
                                  <p className="font-medium">Priority</p>
                                  <Badge variant={getPriorityColor(selectedTask?.priority || "")}>
                                    {selectedTask?.priority}
                                  </Badge>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <p className="font-medium">Assignee</p>
                                  <p>{selectedTask?.assigneeName}</p>
                                </div>
                                <div>
                                  <p className="font-medium">Due Date</p>
                                  <p>{selectedTask?.dueDate}</p>
                                </div>
                              </div>
                              <div>
                                <p className="font-medium">Progress</p>
                                <div className="flex items-center gap-3 mt-1">
                                  <Progress value={selectedTask?.progress || 0} className="flex-1" />
                                  <span className="text-xs font-medium">{selectedTask?.progress}%</span>
                                </div>
                              </div>
                              {(user?.role === 'coordinator' || selectedTask?.assignedTo === user?.id) && (
                                <div className="mt-2">
                                  {selectedTask?.assignedTo === user?.id && selectedTask?.status === 'Pending' && (
                                    <Button size="sm" onClick={() => handleUpdateStatus(selectedTask.id, 'In Progress')} className="mr-2">Start Task</Button>
                                  )}
                                  {selectedTask?.assignedTo === user?.id && selectedTask?.status === 'In Progress' && (
                                    <Button size="sm" onClick={() => handleUpdateStatus(selectedTask.id, 'Completed')} className="mr-2">Mark as Done</Button>
                                  )}
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col h-full">
                              <p className="font-medium text-sm mb-2">Discussion</p>
                              <div className="border rounded-md p-3 max-h-[300px] overflow-auto space-y-3 bg-muted/30">
                                {messages.length === 0 && (
                                  <p className="text-xs text-muted-foreground">No messages yet. Start the conversation.</p>
                                )}
                                {messages.map((msg) => {
                                  const sender = users.find(u => u.id === msg.userId);
                                  const senderName = sender ? `${sender.firstName} ${sender.lastName}` : msg.role || 'User';
                                  const isMine = msg.userId === user?.id;
                                  return (
                                    <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                                      <div className={`rounded-lg px-3 py-2 text-sm max-w-[75%] ${isMine ? 'bg-primary text-primary-foreground' : 'bg-accent'}`}>
                                        <div className="text-[10px] opacity-80 mb-0.5">{senderName} • {msg.role}</div>
                                        <div>{msg.text}</div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                              <div className="flex items-center gap-2 mt-2">
                                <Input placeholder="Type a message" value={messageText} onChange={(e) => setMessageText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSendMessage(); } }} />
                                <Button onClick={handleSendMessage}>
                                  <Send className="h-4 w-4" />
                                </Button>
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
                            <DropdownMenuItem onClick={() => handleEditTask(task)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleCloneTask(task)}>
                              <Copy className="h-4 w-4 mr-2" />
                              Clone
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => task.archived ? handleRestoreTask(task.id) : handleDeleteTask(task.id)}
                              className={task.archived ? "text-green-600" : "text-red-600"}
                            >
                              {task.archived ? (
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

        {/* Grid View */}
        {viewMode === "grid" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTasks.map((task) => (
              <Card key={task.id} className="shadow-card hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-2 flex-1">
                      {user?.role === 'coordinator' && (
                        <Checkbox
                          checked={selectedTasks.includes(task.id)}
                          onCheckedChange={() => handleSelectTask(task.id)}
                          className="mt-1"
                        />
                      )}
                      <div className="flex-1">
                        <CardTitle className="text-lg line-clamp-1">{task.title}</CardTitle>
                        <CardDescription className="text-sm mt-1 line-clamp-2">
                          {task.description}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Badge variant={getPriorityColor(task.priority)} className="text-xs">
                        {getPriorityIcon(task.priority)}
                        <span className="ml-1">{task.priority}</span>
                      </Badge>
                      <Badge variant={getStatusColor(task.status)}>
                        {task.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <User className="h-4 w-4 mr-2" />
                      <span>{task.assigneeName}</span>
                    </div>
                    
                    <div className="flex items-center text-sm text-muted-foreground">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      <span>{task.dueDate}</span>
                    </div>

                    <div className="text-sm text-muted-foreground">
                      <p className="font-medium">Project</p>
                      <p>{task.projectName}</p>
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="font-medium">Progress</span>
                        <span>{task.progress}%</span>
                      </div>
                      <Progress value={task.progress} className="h-2" />
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => openTaskDetails(task)}>
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      {user?.role === 'coordinator' && (
                        <Button variant="outline" size="sm" onClick={() => handleEditTask(task)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Kanban View */}
        {viewMode === "kanban" && (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {["Pending", "In Progress", "Completed", "On Hold"].map((status) => (
              <div key={status} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">{status}</h3>
                  <Badge variant="outline">{filteredTasks.filter(t => t.status === status).length}</Badge>
                </div>
                <div className="space-y-3 min-h-[400px]">
                  {filteredTasks
                    .filter(task => task.status === status)
                    .map((task) => (
                      <Card key={task.id} className="shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => openTaskDetails(task)}>
                        <CardContent className="p-4">
                          <div className="space-y-2">
                            <div className="flex items-start justify-between">
                              <h4 className="font-medium text-sm line-clamp-2">{task.title}</h4>
                              <Badge variant={getPriorityColor(task.priority)} className="text-xs">
                                {task.priority}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>{task.assigneeName}</span>
                              <span>{task.dueDate}</span>
                            </div>
                            <Progress value={task.progress} className="h-1" />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Calendar View */}
        {viewMode === "calendar" && (
          <Card>
            <CardContent className="p-6">
              <div className="text-center py-12">
                <CalendarView className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground">Calendar View</h3>
                <p className="text-sm text-muted-foreground">Calendar view coming soon</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {filteredTasks.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No tasks found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || statusFilter !== "all" || priorityFilter !== "all" || assigneeFilter !== "all" || projectFilter !== "all"
                  ? "Try adjusting your search or filter criteria."
                  : "Get started by creating your first task."}
              </p>
              {user?.role === 'coordinator' && (
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Task
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Edit Task Dialog */}
        {user?.role === 'coordinator' && editTask && (
          <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
            <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Task</DialogTitle>
              </DialogHeader>
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="advanced">Advanced</TabsTrigger>
                </TabsList>
                
                <TabsContent value="basic" className="space-y-4">
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="edit-title">Task Title *</Label>
                      <Input
                        id="edit-title"
                        value={editTask.title}
                        onChange={(e) => setEditTask({ ...editTask, title: e.target.value })}
                        placeholder="Enter task title"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="edit-description">Description *</Label>
                      <Textarea
                        id="edit-description"
                        value={editTask.description}
                        onChange={(e) => setEditTask({ ...editTask, description: e.target.value })}
                        placeholder="Enter task description"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="edit-project">Project *</Label>
                      <Select value={editTask.projectId} onValueChange={(value) => setEditTask({ ...editTask, projectId: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select project" />
                        </SelectTrigger>
                        <SelectContent>
                          {projects.map((project) => (
                            <SelectItem key={project.id} value={project.id}>
                              {project.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="edit-assignee">Assign To *</Label>
                      <Select value={editTask.assignedTo} onValueChange={(value) => setEditTask({ ...editTask, assignedTo: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select assignee" />
                        </SelectTrigger>
                        <SelectContent>
                          {users.filter(u => u.role === 'staff' || u.role === 'intern').map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.firstName} {user.lastName} ({user.role})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="edit-priority">Priority</Label>
                        <Select value={editTask.priority} onValueChange={(value) => setEditTask({ ...editTask, priority: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Low">Low</SelectItem>
                            <SelectItem value="Medium">Medium</SelectItem>
                            <SelectItem value="High">High</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="edit-dueDate">Due Date</Label>
                        <Input
                          id="edit-dueDate"
                          type="date"
                          value={editTask.dueDate}
                          onChange={(e) => setEditTask({ ...editTask, dueDate: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="details" className="space-y-4">
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="edit-category">Category</Label>
                      <Input
                        id="edit-category"
                        value={editTask.category || ""}
                        onChange={(e) => setEditTask({ ...editTask, category: e.target.value })}
                        placeholder="e.g., Development, Testing, Documentation"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="edit-tags">Tags (comma-separated)</Label>
                      <Input
                        id="edit-tags"
                        value={(editTask.tags || []).join(", ")}
                        onChange={(e) => setEditTask({ ...editTask, tags: e.target.value.split(",").map(tag => tag.trim()).filter(tag => tag) })}
                        placeholder="e.g., urgent, frontend, bug-fix"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="edit-estimatedHours">Estimated Hours</Label>
                        <Input
                          id="edit-estimatedHours"
                          type="number"
                          value={editTask.estimatedHours || 0}
                          onChange={(e) => setEditTask({ ...editTask, estimatedHours: Number(e.target.value) })}
                          placeholder="Enter estimated hours"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="edit-budget">Budget (R)</Label>
                        <Input
                          id="edit-budget"
                          type="number"
                          value={editTask.budget || 0}
                          onChange={(e) => setEditTask({ ...editTask, budget: Number(e.target.value) })}
                          placeholder="Enter budget"
                        />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="edit-client">Client/Sponsor</Label>
                      <Input
                        id="edit-client"
                        value={editTask.client || ""}
                        onChange={(e) => setEditTask({ ...editTask, client: e.target.value })}
                        placeholder="Enter client or sponsor name"
                      />
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="advanced" className="space-y-4">
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="edit-startDate">Start Date</Label>
                      <Input
                        id="edit-startDate"
                        type="date"
                        value={editTask.startDate || ""}
                        onChange={(e) => setEditTask({ ...editTask, startDate: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="edit-labels">Labels (comma-separated)</Label>
                      <Input
                        id="edit-labels"
                        value={(editTask.labels || []).join(", ")}
                        onChange={(e) => setEditTask({ ...editTask, labels: e.target.value.split(",").map(label => label.trim()).filter(label => label) })}
                        placeholder="e.g., milestone, review, critical"
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => { setShowEditDialog(false); setEditTask(null); }}>
                  Cancel
                </Button>
                <Button onClick={handleSaveEditTask}>
                  Save Changes
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
};

export default Tasks;