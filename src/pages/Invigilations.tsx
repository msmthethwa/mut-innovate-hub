import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Calendar,
  Clock,
  Plus,
  Search,
  Filter,
  User,
  MapPin,
  BookOpen,
  Users
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const Invigilations = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Mock data - this will come from Supabase
  const invigilations = [
    { 
      id: 1, 
      subject: "Data Structures & Algorithms", 
      date: "2024-01-20", 
      time: "09:00 - 12:00", 
      venue: "Computer Lab A",
      invigilator: "Dr. Smith",
      lecturer: "Prof. Johnson",
      studentCount: 45,
      status: "Confirmed",
      type: "Final Exam",
      notes: "Calculators not allowed"
    },
    { 
      id: 2, 
      subject: "Web Development", 
      date: "2024-01-22", 
      time: "14:00 - 17:00", 
      venue: "Computer Lab B",
      invigilator: "Sarah Wilson",
      lecturer: "Dr. Brown",
      studentCount: 32,
      status: "Pending",
      type: "Practical Test",
      notes: "Laptops required for practical component"
    },
    { 
      id: 3, 
      subject: "Database Management", 
      date: "2024-01-25", 
      time: "10:00 - 13:00", 
      venue: "Lecture Hall 1",
      invigilator: "Mike Johnson",
      lecturer: "Dr. Davis",
      studentCount: 60,
      status: "Confirmed",
      type: "Mid-term Exam",
      notes: "Written exam only"
    },
    { 
      id: 4, 
      subject: "Mobile App Development", 
      date: "2024-01-28", 
      time: "09:00 - 11:00", 
      venue: "Computer Lab C",
      invigilator: "Tom Brown",
      lecturer: "Prof. Wilson",
      studentCount: 25,
      status: "Requested",
      type: "Quiz",
      notes: "Android Studio setup required"
    },
    { 
      id: 5, 
      subject: "Artificial Intelligence", 
      date: "2024-01-30", 
      time: "14:30 - 17:30", 
      venue: "Computer Lab A",
      invigilator: "Lisa Davis",
      lecturer: "Dr. Smith",
      studentCount: 38,
      status: "Confirmed",
      type: "Final Project",
      notes: "Students will present their AI projects"
    },
  ];

  const filteredInvigilations = invigilations.filter(invigilation => {
    const matchesSearch = invigilation.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invigilation.invigilator.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invigilation.lecturer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || invigilation.status.toLowerCase() === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Confirmed": return "default";
      case "Pending": return "secondary";
      case "Requested": return "outline";
      default: return "outline";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Final Exam": return "destructive";
      case "Mid-term Exam": return "secondary";
      case "Practical Test": return "default";
      case "Quiz": return "outline";
      case "Final Project": return "default";
      default: return "outline";
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
                src="https://i.ibb.co/HfwCH8cD/Innovation-Lab-Logo.png" 
                alt="MUT Innovation Lab" 
                className="h-10 w-auto"
              />
              <div>
                <h1 className="text-xl font-bold">Invigilations</h1>
                <p className="text-sm text-muted-foreground">Manage exam invigilation assignments</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button onClick={() => navigate('/dashboard')}>
                Back to Dashboard
              </Button>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Request Invigilation
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
              placeholder="Search invigilations..."
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
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="requested">Requested</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            More Filters
          </Button>
        </div>

        {/* Invigilations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredInvigilations.map((invigilation) => (
            <Card key={invigilation.id} className="shadow-card hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{invigilation.subject}</CardTitle>
                  <div className="flex flex-col gap-1">
                    <Badge variant={getStatusColor(invigilation.status)}>
                      {invigilation.status}
                    </Badge>
                    <Badge variant={getTypeColor(invigilation.type)} className="text-xs">
                      {invigilation.type}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center text-sm">
                    <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="font-medium">{invigilation.date}</span>
                  </div>
                  
                  <div className="flex items-center text-sm">
                    <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>{invigilation.time}</span>
                  </div>

                  <div className="flex items-center text-sm">
                    <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>{invigilation.venue}</span>
                  </div>

                  <div className="flex items-center text-sm">
                    <User className="h-4 w-4 mr-2 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Invigilator: {invigilation.invigilator}</p>
                      <p className="text-muted-foreground">Lecturer: {invigilation.lecturer}</p>
                    </div>
                  </div>

                  <div className="flex items-center text-sm">
                    <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>{invigilation.studentCount} students</span>
                  </div>

                  {invigilation.notes && (
                    <div className="bg-muted/50 p-3 rounded-lg">
                      <div className="flex items-start text-sm">
                        <BookOpen className="h-4 w-4 mr-2 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="font-medium mb-1">Notes:</p>
                          <p className="text-muted-foreground">{invigilation.notes}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      View Details
                    </Button>
                    <Button size="sm" className="flex-1">
                      {invigilation.status === "Requested" ? "Assign" : "Edit"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredInvigilations.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground">No invigilations found</h3>
            <p className="text-sm text-muted-foreground">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Invigilations;