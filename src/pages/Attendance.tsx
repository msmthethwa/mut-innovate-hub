import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Clock, Calendar as CalendarIcon, UserCheck, UserX, FileText, ArrowLeft, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, getDocs, updateDoc, doc, orderBy, Timestamp } from "firebase/firestore";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import AttendanceClock from "@/components/AttendanceClock";
import LeaveRequestForm from "@/components/LeaveRequestForm";
import { sendNotification } from "@/lib/notificationService";

const Attendance = () => {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<string>("all");
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const userDoc = await getDocs(query(collection(db, "users"), where("email", "==", user.email)));
        if (!userDoc.empty) {
          const role = userDoc.docs[0].data().role;
          setUserRole(role);
          
          if (role === "coordinator") {
            await loadUsers();
            await loadAttendanceRecords();
            await loadLeaveRequests();
          }
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [selectedDate, filterStatus, selectedUser]);

  const loadUsers = async () => {
    const usersQuery = query(collection(db, "users"), where("role", "in", ["staff", "intern"]));
    const snapshot = await getDocs(usersQuery);
    setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const loadAttendanceRecords = async () => {
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);

    let attendanceQuery = query(
      collection(db, "attendance"),
      where("date", ">=", Timestamp.fromDate(startOfDay)),
      where("date", "<=", Timestamp.fromDate(endOfDay)),
      orderBy("date", "desc")
    );

    const snapshot = await getDocs(attendanceQuery);
    let records = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));

    if (selectedUser !== "all") {
      records = records.filter(r => r.userId === selectedUser);
    }

    if (filterStatus !== "all") {
      records = records.filter(r => r.status === filterStatus);
    }

    setAttendanceRecords(records);
  };

  const loadLeaveRequests = async () => {
    let leaveQuery = query(collection(db, "leave_requests"), orderBy("requestedAt", "desc"));
    const snapshot = await getDocs(leaveQuery);
    let requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));

    if (filterStatus !== "all") {
      requests = requests.filter(r => r.status === filterStatus);
    }

    if (selectedUser !== "all") {
      requests = requests.filter(r => r.userId === selectedUser);
    }

    setLeaveRequests(requests);
  };

  const handleLeaveRequestAction = async (requestId: string, action: "approved" | "rejected", reason?: string) => {
    try {
      const requestRef = doc(db, "leave_requests", requestId);
      await updateDoc(requestRef, {
        status: action,
        reviewedBy: auth.currentUser?.uid,
        reviewedAt: Timestamp.now(),
        rejectionReason: action === "rejected" ? reason : null
      });

      const request = leaveRequests.find(r => r.id === requestId);
      if (request) {
        await sendNotification({
          userId: request.userId,
          title: `Leave Request ${action === "approved" ? "Approved" : "Rejected"}`,
          message: action === "approved" 
            ? `Your leave request from ${format(request.startDate.toDate(), "PPP")} to ${format(request.endDate.toDate(), "PPP")} has been approved.`
            : `Your leave request has been rejected. Reason: ${reason}`,
          type: action === "approved" ? "success" : "warning"
        });
      }

      toast.success(`Leave request ${action}`);
      await loadLeaveRequests();
    } catch (error) {
      console.error("Error updating leave request:", error);
      toast.error("Failed to update leave request");
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getStatusBadge = (status: string) => {
    const variants: any = {
      present: "default",
      absent: "destructive",
      leave: "secondary",
      pending: "outline",
      approved: "default",
      rejected: "destructive"
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Staff/Intern View
  if (userRole !== "coordinator") {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto p-6">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Attendance</h1>
              <p className="text-muted-foreground">Track your work hours and request leaves</p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <AttendanceClock />
            <LeaveRequestForm />
          </div>
        </div>
      </div>
    );
  }

  // Coordinator View
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Attendance Management</h1>
              <p className="text-muted-foreground">Monitor staff and intern attendance</p>
            </div>
          </div>
          <Button variant="outline" onClick={() => toast.info("Export feature coming soon")}>
            <Download className="h-4 w-4" />
            Export Report
          </Button>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(selectedDate, "PPP")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={selectedDate} onSelect={(date) => date && setSelectedDate(date)} initialFocus className="pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex-1 min-w-[200px]">
              <Label>User</Label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  {users.map(user => (
                    <SelectItem key={user.id} value={user.id}>{user.name || user.email}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <Label>Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="present">Present</SelectItem>
                  <SelectItem value="absent">Absent</SelectItem>
                  <SelectItem value="leave">On Leave</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Attendance Records */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Daily Attendance</CardTitle>
            <CardDescription>Attendance records for {format(selectedDate, "PPP")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Check In</TableHead>
                  <TableHead>Break Duration</TableHead>
                  <TableHead>Check Out</TableHead>
                  <TableHead>Total Hours</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendanceRecords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">No records found</TableCell>
                  </TableRow>
                ) : (
                  attendanceRecords.map((record) => {
                    const user = users.find(u => u.id === record.userId);
                    const totalMinutes = record.checkOut && record.checkIn 
                      ? (record.checkOut.toDate().getTime() - record.checkIn.toDate().getTime()) / 60000 - (record.breakDuration || 0)
                      : 0;
                    
                    return (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">{user?.name || user?.email || "Unknown"}</TableCell>
                        <TableCell>{record.checkIn ? format(record.checkIn.toDate(), "HH:mm") : "-"}</TableCell>
                        <TableCell>{record.breakDuration ? formatDuration(record.breakDuration) : "-"}</TableCell>
                        <TableCell>{record.checkOut ? format(record.checkOut.toDate(), "HH:mm") : "-"}</TableCell>
                        <TableCell>{totalMinutes > 0 ? formatDuration(totalMinutes) : "-"}</TableCell>
                        <TableCell>{getStatusBadge(record.status)}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{record.notes || "-"}</TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Leave Requests */}
        <Card>
          <CardHeader>
            <CardTitle>Leave Requests</CardTitle>
            <CardDescription>Manage staff and intern leave requests</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Proof</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaveRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">No leave requests</TableCell>
                  </TableRow>
                ) : (
                  leaveRequests.map((request) => {
                    const user = users.find(u => u.id === request.userId);
                    return (
                      <TableRow key={request.id}>
                        <TableCell className="font-medium">{user?.name || user?.email || "Unknown"}</TableCell>
                        <TableCell>{format(request.startDate.toDate(), "PP")}</TableCell>
                        <TableCell>{format(request.endDate.toDate(), "PP")}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{request.reason}</TableCell>
                        <TableCell>
                          {request.proofUrl ? (
                            <Button variant="ghost" size="sm" onClick={() => window.open(request.proofUrl, "_blank")}>
                              <FileText className="h-4 w-4" />
                            </Button>
                          ) : "-"}
                        </TableCell>
                        <TableCell>{getStatusBadge(request.status)}</TableCell>
                        <TableCell>
                          {request.status === "pending" && (
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => handleLeaveRequestAction(request.id, "approved")}>
                                Approve
                              </Button>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button size="sm" variant="destructive">Reject</Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Reject Leave Request</DialogTitle>
                                    <DialogDescription>Please provide a reason for rejection</DialogDescription>
                                  </DialogHeader>
                                  <Textarea id={`reason-${request.id}`} placeholder="Enter rejection reason..." />
                                  <Button onClick={() => {
                                    const reason = (document.getElementById(`reason-${request.id}`) as HTMLTextAreaElement)?.value;
                                    handleLeaveRequestAction(request.id, "rejected", reason);
                                  }}>
                                    Confirm Rejection
                                  </Button>
                                </DialogContent>
                              </Dialog>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Attendance;
