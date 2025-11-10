import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, FileUp, Send } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, getDocs, addDoc, Timestamp, orderBy } from "firebase/firestore";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { sendNotification } from "@/lib/notificationService";

const LeaveRequestForm = () => {
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [reason, setReason] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadMyRequests();
  }, []);

  const loadMyRequests = async () => {
    if (!auth.currentUser) return;

    const requestsQuery = query(
      collection(db, "leave_requests"),
      where("userId", "==", auth.currentUser.uid),
      orderBy("requestedAt", "desc")
    );

    const snapshot = await getDocs(requestsQuery);
    setMyRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!startDate || !endDate || !reason.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (startDate > endDate) {
      toast.error("End date must be after start date");
      return;
    }

    setLoading(true);
    try {
      let proofUrl = "";
      
      // In a real app, upload the file to storage here
      if (proofFile) {
        // Simulated upload - in production, use Firebase Storage
        proofUrl = `proof_${Date.now()}_${proofFile.name}`;
        toast.info("File upload simulation - integrate with Firebase Storage");
      }

      await addDoc(collection(db, "leave_requests"), {
        userId: auth.currentUser?.uid,
        startDate: Timestamp.fromDate(startDate),
        endDate: Timestamp.fromDate(endDate),
        reason: reason.trim(),
        proofUrl,
        status: "pending",
        requestedAt: Timestamp.now(),
        reviewedBy: null,
        reviewedAt: null,
        rejectionReason: null
      });

      // Notify coordinator
      const coordinators = await getDocs(query(collection(db, "users"), where("role", "==", "coordinator")));
      for (const coordinatorDoc of coordinators.docs) {
        await sendNotification({
          userId: coordinatorDoc.id,
          title: "New Leave Request",
          message: `A staff member has requested leave from ${format(startDate, "PP")} to ${format(endDate, "PP")}`,
          type: "info",
          actionUrl: "/attendance",
          actionText: "Review Request"
        });
      }

      toast.success("Leave request submitted successfully");
      setStartDate(undefined);
      setEndDate(undefined);
      setReason("");
      setProofFile(null);
      await loadMyRequests();
    } catch (error) {
      console.error("Error submitting leave request:", error);
      toast.error("Failed to submit leave request");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: any = {
      pending: "outline",
      approved: "default",
      rejected: "destructive"
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5" />
          Request Leave
        </CardTitle>
        <CardDescription>Submit a day-off or leave request</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !startDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={startDate} onSelect={setStartDate} disabled={(date) => date < new Date()} initialFocus className="pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !endDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={endDate} onSelect={setEndDate} disabled={(date) => date < new Date()} initialFocus className="pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason</Label>
            <Textarea id="reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Explain why you need leave..." rows={3} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="proof">Supporting Document (Optional)</Label>
            <div className="flex gap-2">
              <Input id="proof" type="file" onChange={(e) => setProofFile(e.target.files?.[0] || null)} accept=".pdf,.jpg,.jpeg,.png" />
              {proofFile && (
                <Button type="button" variant="ghost" size="icon" onClick={() => setProofFile(null)}>
                  ×
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">Upload doctor's note or other supporting documents</p>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            <Send className="h-4 w-4" />
            {loading ? "Submitting..." : "Submit Request"}
          </Button>
        </form>

        <div className="pt-4 border-t">
          <h4 className="font-semibold mb-2">My Requests</h4>
          {myRequests.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No requests yet</p>
          ) : (
            <div className="space-y-2">
              {myRequests.slice(0, 3).map((request) => (
                <div key={request.id} className="p-3 border rounded-lg space-y-1">
                  <div className="flex justify-between items-start">
                    <div className="text-sm">
                      <p className="font-medium">{format(request.startDate.toDate(), "PP")} - {format(request.endDate.toDate(), "PP")}</p>
                      <p className="text-muted-foreground text-xs">{request.reason}</p>
                    </div>
                    {getStatusBadge(request.status)}
                  </div>
                  {request.status === "rejected" && request.rejectionReason && (
                    <p className="text-xs text-destructive">Reason: {request.rejectionReason}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default LeaveRequestForm;
