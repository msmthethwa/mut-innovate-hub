import { useEffect, useMemo, useState } from "react";
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
  Plus,
  Search,
  Filter,
  User,
  MapPin,
  BookOpen,
  Users,
  Bell
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { db, auth } from "@/lib/firebase";
import { addDoc, collection, doc, onSnapshot, orderBy, query, serverTimestamp, updateDoc, getDoc, getDocs, where } from "firebase/firestore";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";

type Invigilation = {
  id: string;
  subject: string;
  date: string;
  time: string;
  venue: string;
  lecturer: string;
  userId: string;
  studentCount: number;
  invigilatorCount?: number;
  status: "Confirmed" | "Pending" | "Requested" | "Assigned";
  type: "Final Exam" | "Mid-term Exam" | "Practical Test" | "Quiz" | "Final Project" | string;
  notes?: string;
  assignedInvigilators?: string[];
  assignmentHistory?: { at: any; by: string; action: string; assigned: string[] }[];
};

const emptyForm: Omit<Invigilation, "id"> = {
  subject: "",
  date: "",
  time: "",
  venue: "",
  lecturer: "",
  userId: "",
  studentCount: 0,
  invigilatorCount: 1,
  status: "Requested",
  type: "Practical Test",
  notes: "",
  assignedInvigilators: [],
};

const Invigilations = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [invigilations, setInvigilations] = useState<Invigilation[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [isAssignedTasksOpen, setIsAssignedTasksOpen] = useState(false);
  const [selected, setSelected] = useState<Invigilation | null>(null);
  const [form, setForm] = useState<Omit<Invigilation, "id">>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userRole, setUserRole] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [userAssignedTasks, setUserAssignedTasks] = useState<Invigilation[]>([]);
  const [invigilatorNames, setInvigilatorNames] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!currentUser) return;
    const q = query(collection(db, "invigilations"), orderBy("date", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      const items: Invigilation[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      setInvigilations(items);
    });
    return () => unsub();
  }, [currentUser]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        setUserName(user.displayName || user.email || "");
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
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

  // Filter assigned tasks for staff/intern
  useEffect(() => {
    if (currentUser && (userRole === "staff" || userRole === "intern")) {
      const assignedTasks = invigilations.filter(inv => 
        inv.assignedInvigilators && 
        inv.assignedInvigilators.includes(currentUser.uid) &&
        inv.status === "Assigned"
      );
      setUserAssignedTasks(assignedTasks);
    }
  }, [invigilations, currentUser, userRole]);

  // Auto-completion function to mark invigilations as completed when end time is reached
  const checkAndMarkCompletedInvigilations = async () => {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes(); // Convert to minutes for comparison
    const currentDate = now.toISOString().split('T')[0];

    for (const invigilation of invigilations) {
      if ((invigilation.status === "Assigned" || invigilation.status === "Confirmed") && invigilation.date === currentDate) {
        try {
          // Parse the time range (e.g., "09:00 - 12:00")
          const timeParts = invigilation.time.split(' - ');
          if (timeParts.length === 2) {
            const endTimeStr = timeParts[1].trim();
            const [endHour, endMinute] = endTimeStr.split(':').map(Number);
            const endTime = endHour * 60 + endMinute;

            // If current time is past the invigilation end time, mark as completed
            if (currentTime > endTime) {
              await updateDoc(doc(db, "invigilations", invigilation.id), {
                status: "Completed",
                updatedAt: serverTimestamp()
              });
              console.log(`Auto-marked invigilation ${invigilation.subject} as completed`);
            }
          }
        } catch (error) {
          console.error(`Error auto-marking invigilation ${invigilation.id} as completed:`, error);
        }
      }
    }
  };

  // Set up auto-completion check every minute
  useEffect(() => {
    const interval = setInterval(checkAndMarkCompletedInvigilations, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [invigilations]);

  // Fetch invigilator names from users collection
  useEffect(() => {
    const fetchInvigilatorNames = async () => {
      try {
        const namesMap: Record<string, string> = {};
        
        // Get all unique invigilator IDs from invigilations
        const invigilatorIds = new Set<string>();
        invigilations.forEach(inv => {
          if (inv.assignedInvigilators) {
            inv.assignedInvigilators.forEach(id => invigilatorIds.add(id));
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

    if (invigilations.length > 0) {
      fetchInvigilatorNames();
    }
  }, [invigilations]);

  function resetForm() {
    setForm(emptyForm);
    setErrors({});
  }

  function validate(values: Omit<Invigilation, "id">) {
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
    const conflicts = invigilations.filter(inv => 
      inv.venue === venue && 
      inv.date === date && 
      inv.status === "Confirmed" &&
      inv.id !== excludeId &&
      overlaps(inv.date, inv.time, date, time)
    );
    return conflicts.length === 0;
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

  async function submitEdit() {
    if (!selected) return;
    try {
      // Block lecturer editing if there are assignments
      if (userRole !== "admin" && selected.assignedInvigilators && selected.assignedInvigilators.length > 0) {
        toast({ title: "Edit blocked", description: "This request already has assigned invigilators.", variant: "destructive" as any });
        return;
      }
      const e = validate(form);
      setErrors(e);
      if (Object.keys(e).length) return;
      const ref = doc(db, "invigilations", selected.id);
      const payload = { ...form, studentCount: Number(form.studentCount) || 0, invigilatorCount: Number(form.invigilatorCount) || 1, updatedAt: serverTimestamp() } as any;
      await updateDoc(ref, payload);
      setIsEditOpen(false);
      setSelected(null);
      toast({ title: "Updated", description: "Invigilation updated successfully." });
    } catch (e) {
      toast({ title: "Failed to update", description: "Please try again.", variant: "destructive" as any });
    }
  }

  const handleCancelInvigilation = async (invigilationId: string) => {
    try {
      await updateDoc(doc(db, "invigilations", invigilationId), {
        status: "Cancelled",
        updatedAt: serverTimestamp()
      });
      toast({ title: "Invigilation cancelled", description: "The invigilation request has been cancelled." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to cancel invigilation.", variant: "destructive" as any });
    }
  };

  const filteredInvigilations = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return invigilations.filter((invigilation) => {
      // Role-based filtering: 
      // - Admin/Coordinator see all requests
      // - Lecturers see only their own requests (excluding Final Exam and Mid-term Exam)
      // - Staff/Intern see only tasks assigned to them
      let matchesRole = false;
      let matchesType = true; // Default to true for non-lecturers
      
      if (userRole === "admin" || userRole === "coordinator") {
        matchesRole = true;
      } else if (userRole === "lecturer") {
        matchesRole = invigilation.userId === currentUser?.uid;
        // Exclude Final Exam and Mid-term Exam for lecturers (these should only be in Exam Schedule)
        matchesType = invigilation.type !== "Final Exam" && invigilation.type !== "Mid-term Exam";
      } else if (userRole === "staff" || userRole === "intern") {
        matchesRole = invigilation.assignedInvigilators?.includes(currentUser?.uid || "") || false;
      }
      
      const matchesSearch =
        invigilation.subject.toLowerCase().includes(term) ||
        invigilation.lecturer.toLowerCase().includes(term) ||
        invigilation.venue.toLowerCase().includes(term);
      const matchesStatus = statusFilter === "all" || invigilation.status.toLowerCase() === statusFilter;
      return matchesRole && matchesType && matchesSearch && matchesStatus;
    });
  }, [invigilations, searchTerm, statusFilter, userRole, currentUser]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Assigned": return "default";
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

  // Coordinator assignment dialog state
  type Staff = { id: string; userId?: string; name?: string; email?: string; active?: boolean; available?: boolean };
  const [staffPool, setStaffPool] = useState<Staff[]>([]);
  const [assignWorking, setAssignWorking] = useState(false);
  const [assignStatus, setAssignStatus] = useState<Invigilation["status"]>("Requested");
  const [assignedIds, setAssignedIds] = useState<string[]>([]);
  const [idToName, setIdToName] = useState<Record<string, string>>({});
  const [idToEmail, setIdToEmail] = useState<Record<string, string>>({});

  useEffect(() => {
    (async () => {
      try {
        const map: Record<string, string> = {};
        // Load staff names
        const staffSnap = await getDocs(query(collection(db, "staff")));
        staffSnap.docs.forEach((d) => {
          const data = d.data() as any;
          const key = (data.userId as string) || d.id;
          const firstName = data.firstName || "";
          const lastName = data.lastName || "";
          const name = firstName && lastName ? `${firstName} ${lastName}` : (data.name || data.email || key);
          const email = data.email || "";
          if (key && !map[key]) map[key] = name;
          if (key && email) setIdToEmail(prev => ({ ...prev, [key]: email }));
        });
        // Load users with staff/intern role as fallback (only active and approved users)
        const usersSnap = await getDocs(query(collection(db, "users"), where("role", "in", ["staff", "intern"])));
        usersSnap.docs.forEach((d) => {
          const data = d.data() as any;
          const key = d.id;
          
          // Only include users who are approved and active
          const status = data.status || "pending";
          const isActive = data.isActive !== false; // Default to true if not set
          
          if (status === "approved" && isActive) {
            const firstName = data.firstName || "";
            const lastName = data.lastName || "";
            const name = firstName && lastName ? `${firstName} ${lastName}` : (data.name || data.displayName || data.email || key);
            const email = data.email || "";
            if (key && !map[key]) map[key] = name;
            if (key && email) setIdToEmail(prev => ({ ...prev, [key]: email }));
          }
        });
        setIdToName(map);
      } catch (e) {
        // ignore name loading errors in UI
      }
    })();
  }, []);

  async function loadStaff() {
    // First try to load from staff collection
    const snap = await getDocs(query(collection(db, "staff"), where("active", "==", true)));
    let list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
    
    // If no staff found, fallback to users collection with active and approved users
    if (list.length === 0) {
      const usersSnap = await getDocs(query(collection(db, "users"), where("role", "in", ["staff", "intern"])));
      list = usersSnap.docs
        .map((d) => ({ id: d.id, userId: d.id, ...(d.data() as any) }))
        .filter(user => {
          // Only include users who are approved and active
          const status = user.status || "pending";
          const isActive = user.isActive !== false; // Default to true if not set
          return status === "approved" && isActive;
        });
    }
    
    setStaffPool(list);
    return list as Staff[];
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

  async function handleAutoAssign(inv: Invigilation) {
    setAssignWorking(true);
    try {
      let freshPool = await loadStaff();
      if (!freshPool || freshPool.length === 0) {
        // Fallback: derive pool from users collection by role (only active and approved users)
        const usersSnap = await getDocs(query(collection(db, "users"), where("role", "in", ["staff", "intern"])));
        freshPool = usersSnap.docs
          .map((d) => ({ id: d.id, userId: d.id, ...(d.data() as any) }))
          .filter(user => {
            // Only include users who are approved and active
            const status = user.status || "pending";
            const isActive = user.isActive !== false; // Default to true if not set
            return status === "approved" && isActive;
          }) as Staff[];
      }
      const needed = inv.invigilatorCount || 1;
      const available = freshPool.filter((s) => (s as any).available !== false);
      const shuffled = [...available].sort(() => Math.random() - 0.5);
      const chosen: string[] = [];
      for (const s of shuffled) {
        const sid = s.userId || s.id;
        const conflict = invigilations.some((other) =>
          (other.assignedInvigilators || []).includes(sid) && overlaps(inv.date, inv.time, other.date, other.time)
        );
        if (!conflict) chosen.push(sid);
        if (chosen.length >= needed) break;
      }
      setAssignedIds(chosen);
      toast({ title: "Auto-assign complete", description: `Selected ${chosen.length}/${needed}` });
    } finally {
      setAssignWorking(false);
    }
  }

  async function toggleAvailability(staffId: string, next: boolean) {
    await updateDoc(doc(db, "staff", staffId), { available: next });
    await loadStaff();
  }

  async function saveAssignment() {
    if (!selected) return;
    
    // Check if we have enough invigilators
    const needed = selected.invigilatorCount || 1;
    if (assignedIds.length === 0) {
      toast({ 
        title: "No invigilators assigned", 
        description: "Please assign at least one invigilator before saving.", 
        variant: "destructive" as any 
      });
      return;
    }
    
    const ref = doc(db, "invigilations", selected.id);
    const newStatus = assignedIds.length >= needed ? "Assigned" : "Pending";
    const historyEntry = { at: new Date(), by: currentUser?.uid || "", action: "assign", assigned: assignedIds };
    await updateDoc(ref, {
      assignedInvigilators: assignedIds,
      status: newStatus,
      assignmentHistory: [...(selected.assignmentHistory || []), historyEntry],
      updatedAt: serverTimestamp(),
    } as any);
    setIsAssignOpen(false);
    setSelected(null);
    toast({ title: "Assignments saved", description: `Assigned ${assignedIds.length}/${needed} invigilators. Status updated to ${newStatus}.` });
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
                  {userRole === "lecturer" ? "Invigilation Requests" : 
                   userRole === "staff" || userRole === "intern" ? "My Invigilation Tasks" : 
                   "Manage Invigilation Assignments"}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {userRole === "lecturer"
                    ? "View and manage your invigilation requests"
                    : userRole === "staff" || userRole === "intern"
                    ? "View your assigned invigilation tasks"
                    : "Manage invigilation assignments"}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button onClick={() => navigate('/dashboard')}>
                Back to Dashboard
              </Button>
              
              {/* Show assigned tasks notification for staff/intern */}
              {(userRole === "staff" || userRole === "intern") && userAssignedTasks.length > 0 && (
                <Dialog open={isAssignedTasksOpen} onOpenChange={setIsAssignedTasksOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="relative">
                      <Bell className="h-4 w-4 mr-2" />
                      My Tasks ({userAssignedTasks.length})
                      {userAssignedTasks.length > 0 && (
                        <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                          {userAssignedTasks.length}
                        </span>
                      )}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>My Assigned Invigilation Tasks</DialogTitle>
                      <DialogDescription>
                        You have {userAssignedTasks.length} assigned invigilation task{userAssignedTasks.length !== 1 ? 's' : ''}.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      {userAssignedTasks.map((task) => (
                        <Card key={task.id}>
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <CardTitle className="text-lg">{task.subject}</CardTitle>
                              <Badge variant={getStatusColor(task.status)}>
                                {task.status}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              <div className="flex items-center text-sm">
                                <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                                <span className="font-medium">{task.date}</span>
                              </div>
                              
                              <div className="flex items-center text-sm">
                                <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                                <span>{task.time}</span>
                              </div>

                              <div className="flex items-center text-sm">
                                <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                                <span>{task.venue}</span>
                              </div>

                              <div className="flex items-center text-sm">
                                <User className="h-4 w-4 mr-2 text-muted-foreground" />
                                <span>Lecturer: {task.lecturer}</span>
                              </div>

                              {task.notes && (
                                <div className="bg-muted/50 p-3 rounded-lg mt-2">
                                  <div className="flex items-start text-sm">
                                    <BookOpen className="h-4 w-4 mr-2 text-muted-foreground mt-0.5" />
                                    <div>
                                      <p className="font-medium mb-1">Notes:</p>
                                      <p className="text-muted-foreground">{task.notes}</p>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    <DialogFooter>
                      <Button onClick={() => setIsAssignedTasksOpen(false)}>Close</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
              
              {userRole !== "coordinator" && userRole !== "staff" && userRole !== "intern" && (
                <Dialog open={isCreateOpen} onOpenChange={(o) => { setIsCreateOpen(o); if (!o) resetForm(); }}>
                  <DialogTrigger asChild>
                    <Button onClick={() => setIsCreateOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Request Invigilation
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Request Invigilation</DialogTitle>
                    <DialogDescription>Fill in the exam details to create a request.</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-3">
                    <div>
                      <label className="text-sm font-medium">Subject</label>
                      <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="e.g., Data Structures & Algorithms" />
                      {errors.subject && <p className="text-xs text-destructive mt-1">{errors.subject}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm font-medium">Date</label>
                        <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                        {errors.date && <p className="text-xs text-destructive mt-1">{errors.date}</p>}
                      </div>
                      <div>
                        <label className="text-sm font-medium">Time</label>
                        <Input value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} placeholder="09:00 - 12:00" />
                        {errors.time && <p className="text-xs text-destructive mt-1">{errors.time}</p>}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm font-medium">Venue</label>
                        <Input value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} placeholder="Computer Lab A" />
                        {errors.venue && <p className="text-xs text-destructive mt-1">{errors.venue}</p>}
                      </div>
                      <div>
                        <label className="text-sm font-medium">Students</label>
                        <Input type="number" min={0} value={form.studentCount} onChange={(e) => setForm({ ...form, studentCount: Number(e.target.value) })} />
                        {errors.studentCount && <p className="text-xs text-destructive mt-1">{errors.studentCount}</p>}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm font-medium">Invigilators needed</label>
                        <Input type="number" min={1} value={form.invigilatorCount} onChange={(e) => setForm({ ...form, invigilatorCount: Number(e.target.value) })} />
                        {errors.invigilatorCount && <p className="text-xs text-destructive mt-1">{errors.invigilatorCount}</p>}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm font-medium">Type</label>
                        <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            {userRole === "lecturer" ? (
                              // Lecturers can only create Practical Test, Quiz, and Final Project requests
                              // Final Exam and Mid-term Exam should be created through Exam Schedule page
                              <>
                                <SelectItem value="Practical Test">Practical Test</SelectItem>
                                <SelectItem value="Quiz">Quiz</SelectItem>
                                <SelectItem value="Final Project">Final Project</SelectItem>
                              </>
                            ) : (
                              // Admin/Coordinator can create all types
                              <>
                                <SelectItem value="Final Exam">Final Exam</SelectItem>
                                <SelectItem value="Mid-term Exam">Mid-term Exam</SelectItem>
                                <SelectItem value="Practical Test">Practical Test</SelectItem>
                                <SelectItem value="Quiz">Quiz</SelectItem>
                                <SelectItem value="Final Project">Final Project</SelectItem>
                              </>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      {/* Status hidden for lecturers; shown only to admin/coordinator in future */}
                    </div>
                    <div>
                      <label className="text-sm font-medium">Notes</label>
                      <Textarea value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Additional information or constraints" />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => { setIsCreateOpen(false); resetForm(); }}>Cancel</Button>
                    <Button onClick={submitCreate}>Submit Request</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Search and Filter Bar - Only show for admin/coordinator/lecturer */}
        {(userRole === "admin" || userRole === "coordinator" || userRole === "lecturer") && (
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
                <SelectItem value="assigned">Assigned</SelectItem>
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
        )}

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
                      <p className="font-medium">Invigilators needed: {invigilation.invigilatorCount || 1}</p>
                      <p className="text-muted-foreground">Lecturer: {invigilation.lecturer}</p>
                    </div>
                  </div>

                  <div className="flex items-center text-sm">
                    <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>{invigilation.studentCount} students</span>
                  </div>

                  {(invigilation.assignedInvigilators && invigilation.assignedInvigilators.length > 0) && (
                    <div className="text-sm">
                      <p className="font-medium">{invigilation.assignedInvigilators.length} Invigilator{invigilation.assignedInvigilators.length !== 1 ? 's' : ''} Assigned</p>
                    </div>
                  )}

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
                    <Dialog open={isDetailsOpen && selected?.id === String(invigilation.id)} onOpenChange={(o) => { if (!o) { setIsDetailsOpen(false); setSelected(null); } }}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => { setSelected(invigilation as any); setIsDetailsOpen(true); }}>
                          View Details
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
                        <DialogHeader className="pb-4 flex-shrink-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <DialogTitle className="text-xl font-semibold text-foreground">{invigilation.subject}</DialogTitle>
                              <DialogDescription className="text-sm text-muted-foreground mt-1">
                                {invigilation.type}
                              </DialogDescription>
                            </div>
                            <Badge variant={getStatusColor(invigilation.status)} className="ml-4">
                              {invigilation.status}
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
                                  <p className="font-medium text-foreground">{invigilation.date}</p>
                                  <p className="text-xs text-muted-foreground">Date</p>
                                </div>
                              </div>
                              <div className="flex items-center text-sm">
                                <Clock className="h-4 w-4 mr-3 text-muted-foreground" />
                                <div>
                                  <p className="font-medium text-foreground">{invigilation.time}</p>
                                  <p className="text-xs text-muted-foreground">Time</p>
                                </div>
                              </div>
                              <div className="flex items-center text-sm">
                                <MapPin className="h-4 w-4 mr-3 text-muted-foreground" />
                                <div>
                                  <p className="font-medium text-foreground">{invigilation.venue}</p>
                                  <p className="text-xs text-muted-foreground">Venue</p>
                                </div>
                              </div>
                              <div className="flex items-center text-sm">
                                <Users className="h-4 w-4 mr-3 text-muted-foreground" />
                                <div>
                                  <p className="font-medium text-foreground">{invigilation.studentCount} students</p>
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
                                  <p className="font-medium text-foreground">{invigilation.lecturer}</p>
                                  <p className="text-xs text-muted-foreground">Lecturer</p>
                                </div>
                              </div>
                              <div className="flex items-center text-sm">
                                <User className="h-4 w-4 mr-3 text-muted-foreground" />
                                <div>
                                  <p className="font-medium text-foreground">{invigilation.invigilatorCount || 1} needed</p>
                                  <p className="text-xs text-muted-foreground">Invigilators required</p>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Assigned Invigilators Section */}
                          {(invigilation.assignedInvigilators && invigilation.assignedInvigilators.length > 0) && (
                            <div className="bg-muted/30 rounded-lg p-4">
                              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center">
                                <Users className="h-4 w-4 mr-2" />
                                Assigned Invigilators ({invigilation.assignedInvigilators.length})
                              </h3>
                              <div className="space-y-3">
                                {invigilation.assignedInvigilators.map((id) => (
                                  <div key={id} className="flex items-center justify-between bg-background rounded-md p-3 border">
                                    <div>
                                      <p className="font-medium text-foreground">{invigilatorNames[id] || id}</p>
                                      {idToEmail[id] && <p className="text-xs text-muted-foreground">{idToEmail[id]}</p>}
                                    </div>
                                    <Badge variant="outline" className="text-xs">
                                      Assigned
                                    </Badge>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Assignment History Section */}
                          {invigilation.assignmentHistory && invigilation.assignmentHistory.length > 0 && (
                            <div className="bg-muted/30 rounded-lg p-4">
                              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center">
                                <Clock className="h-4 w-4 mr-2" />
                                Assignment History
                              </h3>
                              <div className="space-y-3 max-h-40 overflow-auto">
                                {invigilation.assignmentHistory.map((h, idx) => (
                                  <div key={idx} className="bg-background rounded-md p-3 border">
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <p className="text-sm font-medium text-foreground capitalize">{h.action}</p>
                                        <p className="text-xs text-muted-foreground">
                                          By: {idToName[h.by] || h.by}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                          {h.at instanceof Date ? h.at.toLocaleString() : 'Unknown date'}
                                        </p>
                                      </div>
                                      <div className="text-right">
                                        <p className="text-xs text-muted-foreground">
                                          {h.assigned?.length || 0} assigned
                                        </p>
                                      </div>
                                    </div>
                                    {h.assigned && h.assigned.length > 0 && (
                                      <div className="mt-2 pt-2 border-t">
                                        <p className="text-xs text-muted-foreground">
                                          {(h.assigned || []).map(id => invigilatorNames[id] || id).join(', ')}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Notes Section */}
                          {invigilation.notes && (
                            <div className="bg-muted/30 rounded-lg p-4">
                              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center">
                                <BookOpen className="h-4 w-4 mr-2" />
                                Additional Notes
                              </h3>
                              <div className="bg-background rounded-md p-3 border">
                                <p className="text-sm text-muted-foreground leading-relaxed">{invigilation.notes}</p>
                              </div>
                            </div>
                          )}
                        </div>

                        <DialogFooter className="pt-6">
                          {(userRole === "lecturer" || userRole === "admin" || userRole === "coordinator") && 
                           (invigilation.status === "Requested" || invigilation.status === "Pending") && (
                            <Button variant="destructive" onClick={() => handleCancelInvigilation(invigilation.id)}>
                              Cancel Request
                            </Button>
                          )}
                          <Button variant="outline" onClick={() => { setIsDetailsOpen(false); setSelected(null); }}>
                            Close
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    {(userRole === "admin" || userRole === "coordinator") ? (
                      <Dialog open={isAssignOpen && selected?.id === String(invigilation.id)} onOpenChange={(o) => { if (!o) { setIsAssignOpen(false); setSelected(null); } }}>
                        <DialogTrigger asChild>
                          <Button size="sm" className="flex-1" onClick={() => { setSelected(invigilation as any); setAssignedIds(invigilation.assignedInvigilators || []); setAssignStatus(invigilation.status); setIsAssignOpen(true); }}>
                            Assign
                          </Button>
                        </DialogTrigger>
                      <DialogContent className="max-w-sm md:max-w-2xl lg:max-w-4xl max-h-[80vh] p-4 md:p-6 bg-white rounded-lg shadow-lg flex flex-col">
                        <DialogHeader className="flex-shrink-0 pb-4">
                          <DialogTitle className="text-lg md:text-2xl font-semibold mb-2">Assign Invigilators</DialogTitle>
                          <DialogDescription className="text-sm text-gray-600 mb-4 md:mb-6">Randomize or manually adjust assignments. Manage availability as needed.</DialogDescription>
                        </DialogHeader>
                        <div className="flex-1 overflow-y-auto space-y-4 md:space-y-6 pr-1">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-4 gap-3">
                            <div>
                              <p className="text-sm font-medium text-gray-700">Needed: {invigilation.invigilatorCount || 1}</p>
                              <p className="text-sm font-medium text-gray-700">Assigned: {assignedIds.length}</p>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                              <Button variant="outline" onClick={() => handleAutoAssign(invigilation)} disabled={assignWorking} className="px-3 md:px-4 py-2 text-sm font-medium rounded-md hover:bg-gray-100 transition w-full sm:w-auto">
                                Auto-assign
                              </Button>
                              <Badge variant={getStatusColor(assignStatus)} className="text-sm md:text-base font-semibold px-3 py-1 rounded-full self-center sm:self-auto">
                                {assignStatus}
                              </Badge>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                            {staffPool.length > 0 && (
                              <div className="lg:col-span-1">
                                <p className="text-sm font-semibold mb-3 text-gray-800">Available Staff</p>
                                <div className="space-y-3 max-h-48 md:max-h-64 lg:max-h-96 overflow-auto border border-gray-200 rounded-lg p-3 md:p-4 bg-gray-50">
                                  {staffPool.map((s) => (
                                    <div key={s.id} className="flex flex-col sm:flex-row sm:items-center justify-between bg-white rounded-md p-3 shadow-sm hover:shadow-md transition gap-3">
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">{s.name || s.email || s.id}</p>
                                        <p className={`text-xs ${s.available === false ? "text-red-500" : "text-green-600"}`}>
                                          {s.available === false ? "Unavailable" : "Available"}
                                        </p>
                                      </div>
                                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                                        <Button size="sm" variant="outline" onClick={() => setAssignedIds((prev) => prev.includes(s.id) ? prev : [...prev, s.id])} className="px-3 py-1 rounded-md text-sm font-medium hover:bg-gray-100 transition w-full sm:w-auto">
                                          Add
                                        </Button>
                                        <Button size="sm" variant="ghost" onClick={() => toggleAvailability(s.id, !(s.available !== false))} className="px-3 py-1 rounded-md text-sm font-medium hover:bg-gray-100 transition w-full sm:w-auto">
                                          {(s.available !== false) ? "Mark Unavailable" : "Mark Available"}
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            <div className="lg:col-span-1">
                              <p className="text-sm font-semibold mb-3 text-gray-800">Assigned</p>
                              <div className="space-y-3 max-h-48 md:max-h-64 lg:max-h-96 overflow-auto border border-gray-200 rounded-lg p-3 md:p-4 bg-gray-50">
                                {assignedIds.map((id) => (
                                  <div key={id} className="flex flex-col sm:flex-row sm:items-center justify-between bg-white rounded-md p-3 shadow-sm hover:shadow-md transition gap-3">
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-semibold text-gray-900 truncate">{invigilatorNames[id] || id}</p>
                                      {idToEmail[id] && <p className="text-xs text-gray-500 truncate">{idToEmail[id]}</p>}
                                    </div>
                                    <Button size="sm" variant="outline" onClick={() => setAssignedIds((prev) => prev.filter((x) => x !== id))} className="px-3 py-1 rounded-md text-sm font-medium hover:bg-gray-100 transition w-full sm:w-auto">
                                      Remove
                                    </Button>
                                  </div>
                                ))}
                                {assignedIds.length === 0 && <p className="text-xs text-gray-500">No one assigned</p>}
                              </div>
                            </div>
                          </div>
                          {selected?.assignmentHistory && selected.assignmentHistory.length > 0 && (
                            <div>
                              <p className="text-sm font-semibold mb-2 text-gray-800">Assignment History</p>
                              <div className="text-xs text-gray-500 space-y-2 max-h-32 md:max-h-48 overflow-auto border border-gray-200 rounded-lg p-3 bg-gray-50">
                                {selected.assignmentHistory.map((h, idx) => (
                                  <div key={idx} className="border-b border-gray-200 pb-1 last:border-0">
                                    <div className="text-xs">
                                      <span className="capitalize font-medium">{h.action}</span> • By: {idToName[h.by] || h.by} • Assigned: {(h.assigned || []).length}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <DialogFooter className="flex-shrink-0 pt-4 md:pt-6 flex flex-col sm:flex-row justify-end gap-3 sm:space-x-4">
                          <Button variant="outline" onClick={() => { setIsAssignOpen(false); setSelected(null); }} className="px-4 md:px-5 py-2 rounded-md font-medium hover:bg-gray-100 transition w-full sm:w-auto">
                            Cancel
                          </Button>
                          <Button onClick={saveAssignment} className="px-4 md:px-5 py-2 rounded-md font-semibold bg-primary text-white hover:bg-primary/90 transition w-full sm:w-auto">
                            Save
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                      </Dialog>
                    ) : (
                      (userRole === "lecturer") && (
                        <Dialog open={isEditOpen && selected?.id === String(invigilation.id)} onOpenChange={(o) => { if (!o) { setIsEditOpen(false); setSelected(null); } }}>
                          <DialogTrigger asChild>
                            <Button size="sm" className="flex-1" onClick={() => { setSelected(invigilation as any); setForm({ subject: invigilation.subject, date: invigilation.date, time: invigilation.time, venue: invigilation.venue, lecturer: invigilation.lecturer, userId: invigilation.userId, studentCount: invigilation.studentCount, invigilatorCount: invigilation.invigilatorCount || 1, status: invigilation.status, type: invigilation.type, notes: invigilation.notes || "", assignedInvigilators: invigilation.assignedInvigilators || [] }); setIsEditOpen(true); }}>
                              Edit
                            </Button>
                          </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit Invigilation</DialogTitle>
                            <DialogDescription>Update details and save changes.</DialogDescription>
                          </DialogHeader>
                          <div className="grid gap-3">
                            <div>
                              <label className="text-sm font-medium">Subject</label>
                              <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="text-sm font-medium">Date</label>
                                <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                              </div>
                              <div>
                                <label className="text-sm font-medium">Time</label>
                                <Input value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="text-sm font-medium">Venue</label>
                                <Input value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} />
                              </div>
                              {/* Lecturer field hidden for lecturers; coordinators can manage in admin tools */}
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="text-sm font-medium">Students</label>
                                <Input type="number" min={0} value={form.studentCount} onChange={(e) => setForm({ ...form, studentCount: Number(e.target.value) })} />
                              </div>
                              <div>
                                <label className="text-sm font-medium">Invigilators needed</label>
                                <Input type="number" min={1} value={form.invigilatorCount} onChange={(e) => setForm({ ...form, invigilatorCount: Number(e.target.value) })} />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="text-sm font-medium">Type</label>
                                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {userRole === "lecturer" ? (
                                      // Lecturers can only edit Practical Test, Quiz, and Final Project requests
                                      // Final Exam and Mid-term Exam should be managed through Exam Schedule page
                                      <>
                                        <SelectItem value="Practical Test">Practical Test</SelectItem>
                                        <SelectItem value="Quiz">Quiz</SelectItem>
                                        <SelectItem value="Final Project">Final Project</SelectItem>
                                      </>
                                    ) : (
                                      // Admin/Coordinator can edit all types
                                      <>
                                        <SelectItem value="Final Exam">Final Exam</SelectItem>
                                        <SelectItem value="Mid-term Exam">Mid-term Exam</SelectItem>
                                        <SelectItem value="Practical Test">Practical Test</SelectItem>
                                        <SelectItem value="Quiz">Quiz</SelectItem>
                                        <SelectItem value="Final Project">Final Project</SelectItem>
                                      </>
                                    )}
                                  </SelectContent>
                                </Select>
                              </div>
                              {/* Status hidden for lecturers; coordinator can manage elsewhere */}
                            </div>
                            <div>
                              <label className="text-sm font-medium">Notes</label>
                              <Textarea value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => { setIsEditOpen(false); setSelected(null); }}>Cancel</Button>
                            <Button onClick={submitEdit}>Save Changes</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      )
                    )}
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
            <p className="text-sm text-muted-foreground">
              {userRole === "staff" || userRole === "intern" 
                ? "You don't have any assigned invigilation tasks yet." 
                : "Try adjusting your search or filter criteria"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Invigilations;