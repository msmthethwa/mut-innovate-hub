import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Calendar,
  Clock,
  Search,
  Filter,
  User,
  MapPin,
  BookOpen,
  Users,
  ChevronLeft,
  ChevronRight,
  Plus,
  Eye,
  Edit,
  Trash2,
  Download
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { db, auth } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy, onSnapshot, doc, updateDoc, deleteDoc, serverTimestamp, addDoc } from "firebase/firestore";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";

type ExamSchedule = {
  id: string;
  subject: string;
  date: string;
  time: string;
  venue: string;
  lecturer: string;
  userId: string;
  studentCount: number;
  invigilatorCount?: number;
  status: "Scheduled" | "Completed" | "Cancelled" | "Postponed";
  type: "Final Exam" | "Mid-term Exam" | "Practical Test" | "Quiz" | "Final Project" | string;
  notes?: string;
  assignedInvigilators?: string[];
  createdAt?: any;
  updatedAt?: any;
};

type InvigilationRequest = {
  subject: string;
  date: string;
  time: string;
  venue: string;
  lecturer: string;
  userId: string;
  studentCount: number;
  invigilatorCount: number;
  status: "Requested";
  type: string;
  notes: string;
  assignedInvigilators: string[];
};

const emptyForm: InvigilationRequest = {
  subject: "",
  date: "",
  time: "",
  venue: "",
  lecturer: "",
  userId: "",
  studentCount: 0,
  invigilatorCount: 1,
  status: "Requested",
  type: "Final Exam",
  notes: "",
  assignedInvigilators: [],
};

const ExamSchedule = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [exams, setExams] = useState<ExamSchedule[]>([]);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selected, setSelected] = useState<ExamSchedule | null>(null);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userRole, setUserRole] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [form, setForm] = useState<InvigilationRequest>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [invigilatorNames, setInvigilatorNames] = useState<Record<string, string>>({});

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        setUserName(user.displayName || user.email || "");
        try {
          const userDoc = await getDocs(query(collection(db, "users"), where("__name__", "==", user.uid)));
          if (!userDoc.empty) {
            const userData = userDoc.docs[0].data();
            setUserRole(userData.role || "");
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      } else {
        setCurrentUser(null);
        setUserRole("");
        setUserName("");
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    
    // Fetch approved invigilation requests as scheduled exams
    // Using a more efficient query approach to avoid index issues
    const q = query(
      collection(db, "invigilations"), 
      where("status", "in", ["Assigned", "Confirmed"]),
      orderBy("date", "asc")
    );
    
    const unsub = onSnapshot(q, (snap) => {
      const items: ExamSchedule[] = snap.docs.map((d) => {
        const data = d.data() as any;
        return {
          id: d.id,
          subject: data.subject,
          date: data.date,
          time: data.time,
          venue: data.venue,
          lecturer: data.lecturer,
          userId: data.userId,
          studentCount: data.studentCount,
          invigilatorCount: data.invigilatorCount,
          status: "Scheduled" as const, // All items from this query are scheduled
          type: data.type,
          notes: data.notes,
          assignedInvigilators: data.assignedInvigilators,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        };
      });
      setExams(items);
    }, (error) => {
      console.error("Error fetching exam schedule:", error);
      // Fallback: fetch all invigilations and filter client-side if index is not ready
      const fallbackQuery = query(collection(db, "invigilations"), orderBy("date", "asc"));
      onSnapshot(fallbackQuery, (snap) => {
        const items = snap.docs
          .map((d) => {
            const data = d.data() as any;
            return {
              id: d.id,
              subject: data.subject,
              date: data.date,
              time: data.time,
              venue: data.venue,
              lecturer: data.lecturer,
              userId: data.userId,
              studentCount: data.studentCount,
              invigilatorCount: data.invigilatorCount,
              status: "Scheduled" as const,
              type: data.type,
              notes: data.notes,
              assignedInvigilators: data.assignedInvigilators,
              createdAt: data.createdAt,
              updatedAt: data.updatedAt
            };
          })
          .filter(item => item.status === "Scheduled");
        setExams(items);
      });
    });
    return () => unsub();
  }, [currentUser]);

  const filteredExams = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return exams.filter((exam) => {
      // Role-based filtering
      let matchesRole = false;
      
      if (userRole === "admin" || userRole === "coordinator") {
        matchesRole = true;
      } else if (userRole === "lecturer") {
        matchesRole = exam.userId === currentUser?.uid;
      } else if (userRole === "staff" || userRole === "intern") {
        matchesRole = exam.assignedInvigilators?.includes(currentUser?.uid || "") || false;
      }
      
      // Only show Mid-term Exam and Final Exam types
      const matchesExamType = exam.type === "Mid-term Exam" || exam.type === "Final Exam";
      
      const matchesSearch =
        exam.subject.toLowerCase().includes(term) ||
        exam.lecturer.toLowerCase().includes(term) ||
        exam.venue.toLowerCase().includes(term);
      const matchesStatus = statusFilter === "all" || exam.status.toLowerCase() === statusFilter;
      const matchesType = typeFilter === "all" || exam.type.toLowerCase() === typeFilter;
      
      return matchesRole && matchesExamType && matchesSearch && matchesStatus && matchesType;
    });
  }, [exams, searchTerm, statusFilter, typeFilter, userRole, currentUser]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Scheduled": return "default";
      case "Completed": return "secondary";
      case "Cancelled": return "destructive";
      case "Postponed": return "outline";
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getUpcomingExams = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return filteredExams.filter(exam => {
      const examDate = new Date(exam.date);
      return examDate >= today && exam.status === "Scheduled";
    }).slice(0, 5);
  };

  const getTodayExams = () => {
    const today = new Date().toISOString().split('T')[0];
    return filteredExams.filter(exam => exam.date === today && exam.status === "Scheduled");
  };


  const handleCancelExam = async (examId: string) => {
    try {
      await updateDoc(doc(db, "invigilations", examId), {
        status: "Cancelled",
        updatedAt: serverTimestamp()
      });
      toast({ title: "Exam cancelled", description: "The exam has been cancelled." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to cancel exam.", variant: "destructive" as any });
    }
  };

  // Auto-completion function to mark exams as completed when end time is reached
  const checkAndMarkCompletedExams = async () => {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes(); // Convert to minutes for comparison
    const currentDate = now.toISOString().split('T')[0];

    for (const exam of exams) {
      if (exam.status === "Scheduled" && exam.date === currentDate) {
        try {
          // Parse the time range (e.g., "09:00 - 12:00")
          const timeParts = exam.time.split(' - ');
          if (timeParts.length === 2) {
            const endTimeStr = timeParts[1].trim();
            const [endHour, endMinute] = endTimeStr.split(':').map(Number);
            const endTime = endHour * 60 + endMinute;

            // If current time is past the exam end time, mark as completed
            if (currentTime > endTime) {
              await updateDoc(doc(db, "invigilations", exam.id), {
                status: "Completed",
                updatedAt: serverTimestamp()
              });
              console.log(`Auto-marked exam ${exam.subject} as completed`);
            }
          }
        } catch (error) {
          console.error(`Error auto-marking exam ${exam.id} as completed:`, error);
        }
      }
    }
  };

  // Set up auto-completion check every minute
  useEffect(() => {
    const interval = setInterval(checkAndMarkCompletedExams, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [exams]);

  // Fetch invigilator names from users collection
  useEffect(() => {
    const fetchInvigilatorNames = async () => {
      try {
        const namesMap: Record<string, string> = {};
        
        // Get all unique invigilator IDs from exams
        const invigilatorIds = new Set<string>();
        exams.forEach(exam => {
          if (exam.assignedInvigilators) {
            exam.assignedInvigilators.forEach(id => invigilatorIds.add(id));
          }
        });

        // Fetch user details for each invigilator ID
        for (const id of invigilatorIds) {
          try {
            const userDoc = await getDocs(query(collection(db, "users"), where("__name__", "==", id)));
            if (!userDoc.empty) {
              const userData = userDoc.docs[0].data();
              const firstName = userData.firstName || "";
              const lastName = userData.lastName || "";
              const fullName = firstName && lastName ? `${firstName} ${lastName}` : (userData.displayName || userData.email || id);
              namesMap[id] = fullName;
            } else {
              namesMap[id] = id; // Fallback to ID if user not found
            }
          } catch (error) {
            console.error(`Error fetching user ${id}:`, error);
            namesMap[id] = id; // Fallback to ID on error
          }
        }
        
        setInvigilatorNames(namesMap);
      } catch (error) {
        console.error("Error fetching invigilator names:", error);
      }
    };

    if (exams.length > 0) {
      fetchInvigilatorNames();
    }
  }, [exams]);

  const exportSchedule = () => {
    const csvContent = [
      ["Subject", "Date", "Time", "Venue", "Lecturer", "Type", "Status", "Students", "Invigilators"],
      ...filteredExams.map(exam => [
        exam.subject,
        exam.date,
        exam.time,
        exam.venue,
        exam.lecturer,
        exam.type,
        exam.status,
        exam.studentCount,
        exam.invigilatorCount || 1
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `exam-schedule-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast({ title: "Schedule exported", description: "Exam schedule has been downloaded as CSV." });
  };

  function resetForm() {
    setForm(emptyForm);
    setErrors({});
  }

  async function submitEdit() {
    if (!selected) return;
    try {
      const e = validate(form);
      setErrors(e);
      if (Object.keys(e).length) return;
      
      const ref = doc(db, "invigilations", selected.id);
      const payload = { 
        ...form, 
        studentCount: Number(form.studentCount) || 0, 
        invigilatorCount: Number(form.invigilatorCount) || 1, 
        updatedAt: serverTimestamp() 
      } as any;
      await updateDoc(ref, payload);
      setIsEditOpen(false);
      setSelected(null);
      toast({ title: "Updated", description: "Exam request updated successfully." });
    } catch (e) {
      toast({ title: "Failed to update", description: "Please try again.", variant: "destructive" as any });
    }
  }

  function validate(values: InvigilationRequest) {
    const e: Record<string, string> = {};
    if (!values.subject.trim()) e.subject = "Subject is required";
    if (!values.date) e.date = "Date is required";
    if (!values.time.trim()) e.time = "Time is required";
    if (!values.venue.trim()) e.venue = "Venue is required";
    if (values.studentCount == null || isNaN(Number(values.studentCount)) || Number(values.studentCount) < 0) e.studentCount = "Students must be 0 or more";
    if (values.invigilatorCount == null || isNaN(Number(values.invigilatorCount)) || Number(values.invigilatorCount) < 1) e.invigilatorCount = "Invigilators must be at least 1";
    return e;
  }

  async function checkVenueAvailability(venue: string, date: string, time: string, excludeId?: string) {
    const conflicts = exams.filter(exam => 
      exam.venue === venue && 
      exam.date === date && 
      exam.status === "Scheduled" &&
      exam.id !== excludeId &&
      overlaps(exam.date, exam.time, date, time)
    );
    return conflicts.length === 0;
  }

  function parseTimeRange(range: string) {
    const [start, end] = range.split("-").map((s) => s.trim());
    const toMinutes = (t: string) => {
      const [h, m] = t.split(":").map(Number);
      return h * 60 + m;
    };
    return { start: toMinutes(start || "00:00"), end: toMinutes(end || start || "00:00") };
  }

  function overlaps(aDate: string, aTime: string, bDate: string, bTime: string) {
    if (aDate !== bDate) return false;
    const a = parseTimeRange(aTime);
    const b = parseTimeRange(bTime);
    return a.start < b.end && b.start < a.end;
  }

  async function submitCreate() {
    if (!currentUser) {
      toast({ title: "Authentication required", description: "Please log in to create a request.", variant: "destructive" as any });
      return;
    }
    try {
      const merged = { ...form, lecturer: userName, userId: currentUser.uid };
      const e = validate(merged);
      setErrors(e);
      if (Object.keys(e).length) return;
      
      // Check venue availability
      const venueAvailable = await checkVenueAvailability(merged.venue, merged.date, merged.time);
      if (!venueAvailable) {
        toast({ 
          title: "Venue not available", 
          description: "The selected venue is not available at this time. Please choose a different venue or time slot.", 
          variant: "destructive" as any 
        });
        return;
      }
      
      const payload = {
        ...merged,
        studentCount: Number(form.studentCount) || 0,
        invigilatorCount: Number(form.invigilatorCount) || 1,
        assignedInvigilators: [],
        status: "Requested",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      } as any;
      await addDoc(collection(db, "invigilations"), payload);
      setIsCreateOpen(false);
      resetForm();
      toast({ title: "Request submitted", description: "Your invigilation request has been created." });
    } catch (e) {
      toast({ title: "Failed to submit", description: "Please try again.", variant: "destructive" as any });
    }
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
                <h1 className="text-xl font-bold">
                  {userRole === "lecturer" ? "My Exam Schedule" : 
                   userRole === "staff" || userRole === "intern" ? "My Invigilation Schedule" : 
                   "Exam Schedule"}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {userRole === "lecturer"
                    ? "View and manage your scheduled examinations"
                    : userRole === "staff" || userRole === "intern"
                    ? "View your assigned invigilation duties"
                    : "Manage all scheduled examinations"}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={exportSchedule}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              {(userRole === "lecturer" || userRole === "admin" || userRole === "coordinator") && (
                <Dialog open={isCreateOpen} onOpenChange={(o) => { setIsCreateOpen(o); if (!o) resetForm(); }}>
                  <DialogTrigger asChild>
                    <Button onClick={() => setIsCreateOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Request Invigilator
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Request Invigilator for Exam</DialogTitle>
                      <DialogDescription>Fill in the exam details to create an invigilation request.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-3">
                      <div>
                        <label className="text-sm font-medium">Subject</label>
                        <Input 
                          value={form.subject} 
                          onChange={(e) => setForm({ ...form, subject: e.target.value })} 
                          placeholder="e.g., Data Structures & Algorithms" 
                        />
                        {errors.subject && <p className="text-xs text-destructive mt-1">{errors.subject}</p>}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-sm font-medium">Date</label>
                          <Input 
                            type="date" 
                            value={form.date} 
                            onChange={(e) => setForm({ ...form, date: e.target.value })} 
                          />
                          {errors.date && <p className="text-xs text-destructive mt-1">{errors.date}</p>}
                        </div>
                        <div>
                          <label className="text-sm font-medium">Time</label>
                          <Input 
                            value={form.time} 
                            onChange={(e) => setForm({ ...form, time: e.target.value })} 
                            placeholder="09:00 - 12:00" 
                          />
                          {errors.time && <p className="text-xs text-destructive mt-1">{errors.time}</p>}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-sm font-medium">Venue</label>
                          <Input 
                            value={form.venue} 
                            onChange={(e) => setForm({ ...form, venue: e.target.value })} 
                            placeholder="Computer Lab A" 
                          />
                          {errors.venue && <p className="text-xs text-destructive mt-1">{errors.venue}</p>}
                        </div>
                        <div>
                          <label className="text-sm font-medium">Students</label>
                          <Input 
                            type="number" 
                            min={0} 
                            value={form.studentCount} 
                            onChange={(e) => setForm({ ...form, studentCount: Number(e.target.value) })} 
                          />
                          {errors.studentCount && <p className="text-xs text-destructive mt-1">{errors.studentCount}</p>}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-sm font-medium">Invigilators needed</label>
                          <Input 
                            type="number" 
                            min={1} 
                            value={form.invigilatorCount} 
                            onChange={(e) => setForm({ ...form, invigilatorCount: Number(e.target.value) })} 
                          />
                          {errors.invigilatorCount && <p className="text-xs text-destructive mt-1">{errors.invigilatorCount}</p>}
                        </div>
                        <div>
                          <label className="text-sm font-medium">Type</label>
                          <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Final Exam">Final Exam</SelectItem>
                              <SelectItem value="Mid-term Exam">Mid-term Exam</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Notes</label>
                        <Textarea 
                          value={form.notes || ""} 
                          onChange={(e) => setForm({ ...form, notes: e.target.value })} 
                          placeholder="Additional information or constraints" 
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => { setIsCreateOpen(false); resetForm(); }}>Cancel</Button>
                      <Button onClick={submitCreate}>Submit Request</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
              <Button onClick={() => navigate('/dashboard')}>
                Back to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Exams</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredExams.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {filteredExams.filter(e => e.status === "Scheduled").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Today</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {getTodayExams().length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {getUpcomingExams().length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter Bar */}
        <div className="flex items-center space-x-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search exams..."
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
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="postponed">Postponed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="final exam">Final Exam</SelectItem>
              <SelectItem value="mid-term exam">Mid-term Exam</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex border rounded-md">
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="rounded-r-none"
            >
              List
            </Button>
            <Button
              variant={viewMode === "calendar" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("calendar")}
              className="rounded-l-none"
            >
              Calendar
            </Button>
          </div>
        </div>

        {/* Exams Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredExams.map((exam) => (
            <Card key={exam.id} className="shadow-card hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{exam.subject}</CardTitle>
                  <div className="flex flex-col gap-1">
                    <Badge variant={getStatusColor(exam.status)}>
                      {exam.status}
                    </Badge>
                    <Badge variant={getTypeColor(exam.type)} className="text-xs">
                      {exam.type}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center text-sm">
                    <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="font-medium">{formatDate(exam.date)}</span>
                  </div>
                  
                  <div className="flex items-center text-sm">
                    <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>{exam.time}</span>
                  </div>

                  <div className="flex items-center text-sm">
                    <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>{exam.venue}</span>
                  </div>

                  <div className="flex items-center text-sm">
                    <User className="h-4 w-4 mr-2 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Invigilators: {exam.invigilatorCount || 1}</p>
                      <p className="text-muted-foreground">Lecturer: {exam.lecturer}</p>
                    </div>
                  </div>

                  <div className="flex items-center text-sm">
                    <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>{exam.studentCount} students</span>
                  </div>

                  {(exam.assignedInvigilators && exam.assignedInvigilators.length > 0) && (
                    <div className="text-sm">
                      <p className="font-medium">{exam.assignedInvigilators.length} Invigilator{exam.assignedInvigilators.length !== 1 ? 's' : ''} Assigned</p>
                    </div>
                  )}

                  {exam.notes && (
                    <div className="bg-muted/50 p-3 rounded-lg">
                      <div className="flex items-start text-sm">
                        <BookOpen className="h-4 w-4 mr-2 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="font-medium mb-1">Notes:</p>
                          <p className="text-muted-foreground">{exam.notes}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Dialog open={isDetailsOpen && selected?.id === exam.id} onOpenChange={(o) => { if (!o) { setIsDetailsOpen(false); setSelected(null); } }}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => { setSelected(exam); setIsDetailsOpen(true); }}>
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
                        <DialogHeader className="pb-4 flex-shrink-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <DialogTitle className="text-xl font-semibold text-foreground">{exam.subject}</DialogTitle>
                              <DialogDescription className="text-sm text-muted-foreground mt-1">
                                {exam.type}
                              </DialogDescription>
                            </div>
                            <Badge variant={getStatusColor(exam.status)} className="ml-4">
                              {exam.status}
                            </Badge>
                          </div>
                        </DialogHeader>

                        <div className="flex-1 overflow-y-auto space-y-6 pr-1">
                          {/* Basic Information Section */}
                          <div className="bg-muted/30 rounded-lg p-4">
                            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center">
                              <BookOpen className="h-4 w-4 mr-2" />
                              Exam Details
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="flex items-center text-sm">
                                <Calendar className="h-4 w-4 mr-3 text-muted-foreground" />
                                <div>
                                  <p className="font-medium text-foreground">{formatDate(exam.date)}</p>
                                  <p className="text-xs text-muted-foreground">Date</p>
                                </div>
                              </div>
                              <div className="flex items-center text-sm">
                                <Clock className="h-4 w-4 mr-3 text-muted-foreground" />
                                <div>
                                  <p className="font-medium text-foreground">{exam.time}</p>
                                  <p className="text-xs text-muted-foreground">Time</p>
                                </div>
                              </div>
                              <div className="flex items-center text-sm">
                                <MapPin className="h-4 w-4 mr-3 text-muted-foreground" />
                                <div>
                                  <p className="font-medium text-foreground">{exam.venue}</p>
                                  <p className="text-xs text-muted-foreground">Venue</p>
                                </div>
                              </div>
                              <div className="flex items-center text-sm">
                                <Users className="h-4 w-4 mr-3 text-muted-foreground" />
                                <div>
                                  <p className="font-medium text-foreground">{exam.studentCount} students</p>
                                  <p className="text-xs text-muted-foreground">Expected attendance</p>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Personnel Information Section */}
                          <div className="bg-muted/30 rounded-lg p-4">
                            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center">
                              <User className="h-4 w-4 mr-2" />
                              Personnel
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="flex items-center text-sm">
                                <User className="h-4 w-4 mr-3 text-muted-foreground" />
                                <div>
                                  <p className="font-medium text-foreground">{exam.lecturer}</p>
                                  <p className="text-xs text-muted-foreground">Lecturer</p>
                                </div>
                              </div>
                              <div className="flex items-center text-sm">
                                <User className="h-4 w-4 mr-3 text-muted-foreground" />
                                <div>
                                  <p className="font-medium text-foreground">{exam.invigilatorCount || 1} needed</p>
                                  <p className="text-xs text-muted-foreground">Invigilators required</p>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Assigned Invigilators Section */}
                          {(exam.assignedInvigilators && exam.assignedInvigilators.length > 0) && (
                            <div className="bg-muted/30 rounded-lg p-4">
                              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center">
                                <Users className="h-4 w-4 mr-2" />
                                Assigned Invigilators ({exam.assignedInvigilators.length})
                              </h3>
                              <div className="space-y-3">
                                {exam.assignedInvigilators.map((id) => (
                                  <div key={id} className="flex items-center justify-between bg-background rounded-md p-3 border">
                                    <div>
                                      <p className="font-medium text-foreground">{invigilatorNames[id] || id}</p>
                                      <p className="text-xs text-muted-foreground">Invigilator</p>
                                    </div>
                                    <Badge variant="outline" className="text-xs">
                                      Assigned
                                    </Badge>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Notes Section */}
                          {exam.notes && (
                            <div className="bg-muted/30 rounded-lg p-4">
                              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center">
                                <BookOpen className="h-4 w-4 mr-2" />
                                Additional Notes
                              </h3>
                              <div className="bg-background rounded-md p-3 border">
                                <p className="text-sm text-muted-foreground leading-relaxed">{exam.notes}</p>
                              </div>
                            </div>
                          )}
                        </div>

                        <DialogFooter className="pt-6">
                          {(userRole === "lecturer" || userRole === "admin" || userRole === "coordinator") && exam.status === "Scheduled" && (
                            <Button variant="destructive" onClick={() => handleCancelExam(exam.id)}>
                              Cancel Exam
                            </Button>
                          )}
                          <Button variant="outline" onClick={() => { setIsDetailsOpen(false); setSelected(null); }}>
                            Close
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    
                    {/* Edit Button for lecturers */}
                    {(userRole === "lecturer" || userRole === "admin" || userRole === "coordinator") && exam.status === "Scheduled" && (
                      <Dialog open={isEditOpen && selected?.id === exam.id} onOpenChange={(o) => { if (!o) { setIsEditOpen(false); setSelected(null); } }}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="flex-1" onClick={() => { 
                            setSelected(exam); 
                            setForm({
                              subject: exam.subject,
                              date: exam.date,
                              time: exam.time,
                              venue: exam.venue,
                              lecturer: exam.lecturer,
                              userId: exam.userId,
                              studentCount: exam.studentCount,
                              invigilatorCount: exam.invigilatorCount || 1,
                              status: "Requested",
                              type: exam.type,
                              notes: exam.notes || "",
                              assignedInvigilators: exam.assignedInvigilators || []
                            });
                            setIsEditOpen(true); 
                          }}>
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit Exam Request</DialogTitle>
                            <DialogDescription>Update exam details and save changes.</DialogDescription>
                          </DialogHeader>
                          <div className="grid gap-3">
                            <div>
                              <label className="text-sm font-medium">Subject</label>
                              <Input 
                                value={form.subject} 
                                onChange={(e) => setForm({ ...form, subject: e.target.value })} 
                                placeholder="e.g., Data Structures & Algorithms" 
                              />
                              {errors.subject && <p className="text-xs text-destructive mt-1">{errors.subject}</p>}
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="text-sm font-medium">Date</label>
                                <Input 
                                  type="date" 
                                  value={form.date} 
                                  onChange={(e) => setForm({ ...form, date: e.target.value })} 
                                />
                                {errors.date && <p className="text-xs text-destructive mt-1">{errors.date}</p>}
                              </div>
                              <div>
                                <label className="text-sm font-medium">Time</label>
                                <Input 
                                  value={form.time} 
                                  onChange={(e) => setForm({ ...form, time: e.target.value })} 
                                  placeholder="09:00 - 12:00" 
                                />
                                {errors.time && <p className="text-xs text-destructive mt-1">{errors.time}</p>}
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="text-sm font-medium">Venue</label>
                                <Input 
                                  value={form.venue} 
                                  onChange={(e) => setForm({ ...form, venue: e.target.value })} 
                                  placeholder="Computer Lab A" 
                                />
                                {errors.venue && <p className="text-xs text-destructive mt-1">{errors.venue}</p>}
                              </div>
                              <div>
                                <label className="text-sm font-medium">Students</label>
                                <Input 
                                  type="number" 
                                  min={0} 
                                  value={form.studentCount} 
                                  onChange={(e) => setForm({ ...form, studentCount: Number(e.target.value) })} 
                                />
                                {errors.studentCount && <p className="text-xs text-destructive mt-1">{errors.studentCount}</p>}
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="text-sm font-medium">Invigilators needed</label>
                                <Input 
                                  type="number" 
                                  min={1} 
                                  value={form.invigilatorCount} 
                                  onChange={(e) => setForm({ ...form, invigilatorCount: Number(e.target.value) })} 
                                />
                                {errors.invigilatorCount && <p className="text-xs text-destructive mt-1">{errors.invigilatorCount}</p>}
                              </div>
                              <div>
                                <label className="text-sm font-medium">Type</label>
                                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Final Exam">Final Exam</SelectItem>
                                    <SelectItem value="Mid-term Exam">Mid-term Exam</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <div>
                              <label className="text-sm font-medium">Notes</label>
                              <Textarea 
                                value={form.notes || ""} 
                                onChange={(e) => setForm({ ...form, notes: e.target.value })} 
                                placeholder="Additional information or constraints" 
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => { setIsEditOpen(false); setSelected(null); }}>Cancel</Button>
                            <Button onClick={submitEdit}>Save Changes</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredExams.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground">No exams found</h3>
            <p className="text-sm text-muted-foreground">
              {userRole === "staff" || userRole === "intern" 
                ? "You don't have any assigned invigilation duties yet." 
                : "Try adjusting your search or filter criteria"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExamSchedule;

