import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

const Tasks = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Mock data - this will come from Supabase
  const tasks = [
    { 
      id: 1, 
      title: "Database Design Review", 
      description: "Review and optimize the database schema for the IoT system",
      assignee: "Sarah Wilson", 
      project: "Smart Campus IoT System",
      status: "Pending", 
      priority: "High",
      dueDate: "2024-01-15",
      createdDate: "2024-01-08"
    },
    { 
      id: 2, 
      title: "API Documentation", 
      description: "Create comprehensive API documentation for student portal",
      assignee: "Tom Brown", 
      project: "Student Portal Enhancement",
      status: "In Progress", 
      priority: "Medium",
      dueDate: "2024-01-18",
      createdDate: "2024-01-05"
    },
    { 
      id: 3, 
      title: "Testing Phase", 
      description: "Conduct comprehensive testing of security system",
      assignee: "Lisa Davis", 
      project: "Campus Security System",
      status: "Completed", 
      priority: "High",
      dueDate: "2024-01-12",
      createdDate: "2024-01-01"
    },
    { 
      id: 4, 
      title: "UI Component Development", 
      description: "Develop reusable UI components for the research platform",
      assignee: "Alex Wang", 
      project: "AI Research Platform",
      status: "In Progress", 
      priority: "Medium",
      dueDate: "2024-01-20",
      createdDate: "2024-01-10"
    },
    { 
      id: 5, 
      title: "Performance Optimization", 
      description: "Optimize application performance and loading times",
      assignee: "Mike Johnson", 
      project: "Student Portal Enhancement",
      status: "Pending", 
      priority: "Low",
      dueDate: "2024-01-25",
      createdDate: "2024-01-12"
    },
  ];

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.assignee.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.project.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || task.status.toLowerCase().replace(" ", "") === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Task
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
                      <p>{task.assignee}</p>
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
                    <p>{task.project}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                    <Button size="sm">
                      Edit Task
                    </Button>
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