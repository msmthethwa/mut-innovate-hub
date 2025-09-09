import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { useToast } from "@/hooks/use-toast";
import {
  CheckCircle,
  Clock,
  Plus,
  Search,
  Filter,
  Calendar,
  User,
  AlertCircle
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
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    assignedTo: "",
    projectId: "",
    priority: "Medium",
    dueDate: "",
    progress: 0
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
      const usersData = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data() as any
      }));
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
        progress: 0
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

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.assigneeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.projectName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || task.status.toLowerCase().replace(" ", "") === statusFilter;
    return matchesSearch && matchesStatus;
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
                <h1 className="text-xl font-bold">Tasks</h1>
                <p className="text-sm text-muted-foreground">Manage project tasks and assignments</p>
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
                      New Task
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Create New Task</DialogTitle>
                      <DialogDescription>
                        Create a new task by filling out the form below.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="title">Task Title</Label>
                        <Input
                          id="title"
                          value={newTask.title}
                          onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                          placeholder="Enter task title"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={newTask.description}
                          onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                          placeholder="Enter task description"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="project">Project</Label>
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
                        <Label htmlFor="assignee">Assign To</Label>
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
        {/* Search and Filter Bar */}
        <div className="flex items-center space-x-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="inprogress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            More Filters
          </Button>
        </div>

        {/* Tasks List */}
        <div className="space-y-4">
          {filteredTasks.map((task) => (
            <Card key={task.id} className="shadow-card hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{task.title}</CardTitle>
                    <CardDescription className="text-sm mt-1">
                      {task.description}
                    </CardDescription>
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
                    <Calendar className="h-4 w-4 mr-2" />
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
                      <div className="flex-1 bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${task.progress}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium">{task.progress}%</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex gap-2 ml-auto">
                    <Dialog open={showDetailsDialog && selectedTask?.id === task.id} onOpenChange={(open) => {
                      if (!open) {
                        setShowDetailsDialog(false);
                        setSelectedTask(null);
                        setMessages([]);
                      }
                    }}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => openTaskDetails(task)}>
                          View Details
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[900px]">
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
                                <p>{selectedTask?.priority}</p>
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
                                <div className="flex-1 bg-muted rounded-full h-2">
                                  <div className="bg-primary h-2 rounded-full transition-all duration-300" style={{ width: `${selectedTask?.progress ?? 0}%` }} />
                                </div>
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
                              <Button onClick={handleSendMessage}>Send</Button>
                            </div>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    {user?.role === 'coordinator' && (
                      <Button size="sm">
                        Edit Task
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredTasks.length === 0 && (
          <div className="text-center py-12">
            <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground">No tasks found</h3>
            <p className="text-sm text-muted-foreground">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Tasks;