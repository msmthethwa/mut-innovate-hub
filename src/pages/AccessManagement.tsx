import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import { UserCheck, UserX, Users, ArrowLeft, Clock, CheckCircle, XCircle } from "lucide-react";
import { Link } from "react-router-dom";

interface UserRequest {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  department: string;
  reason: string;
  status: string;
  createdAt: any;
  rejectionReason?: string;
}

const AccessManagement = () => {
  const [requests, setRequests] = useState<UserRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<UserRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [actionType, setActionType] = useState<"approve" | "reject">("approve");

  const predefinedReasons = [
    "Insufficient information provided",
    "Invalid department/faculty",
    "Role not suitable for current needs",
    "Missing required documentation",
    "Duplicate application",
    "Other (specify below)"
  ];

  useEffect(() => {
    fetchUserRequests();
  }, []);

  const fetchUserRequests = async () => {
    try {
      const q = query(collection(db, "users"));
      const querySnapshot = await getDocs(q);
      
      const userRequests: UserRequest[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        userRequests.push({
          id: doc.id,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          role: data.role,
          department: data.department,
          reason: data.reason,
          status: data.status || "pending",
          createdAt: data.createdAt,
          rejectionReason: data.rejectionReason
        });
      });

      // Sort by creation date (newest first)
      userRequests.sort((a, b) => {
        if (b.createdAt && a.createdAt) {
          return b.createdAt.toDate() - a.createdAt.toDate();
        }
        return 0;
      });

      setRequests(userRequests);
    } catch (error) {
      console.error("Error fetching user requests:", error);
      toast.error("Failed to fetch user requests");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId: string) => {
    try {
      await updateDoc(doc(db, "users", userId), {
        status: "approved",
        reviewedAt: new Date(),
        rejectionReason: null
      });

      setRequests(prev => 
        prev.map(req => 
          req.id === userId 
            ? { ...req, status: "approved", rejectionReason: undefined }
            : req
        )
      );

      toast.success("User access approved successfully");
      setShowDialog(false);
    } catch (error) {
      console.error("Error approving user:", error);
      toast.error("Failed to approve user access");
    }
  };

  const handleReject = async (userId: string) => {
    const finalReason = rejectionReason === "Other (specify below)" ? customReason : rejectionReason;
    
    if (!finalReason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }

    try {
      await updateDoc(doc(db, "users", userId), {
        status: "rejected",
        rejectionReason: finalReason,
        reviewedAt: new Date()
      });

      setRequests(prev => 
        prev.map(req => 
          req.id === userId 
            ? { ...req, status: "rejected", rejectionReason: finalReason }
            : req
        )
      );

      toast.success("User access rejected");
      setShowDialog(false);
      setRejectionReason("");
      setCustomReason("");
    } catch (error) {
      console.error("Error rejecting user:", error);
      toast.error("Failed to reject user access");
    }
  };

  const openDialog = (request: UserRequest, type: "approve" | "reject") => {
    setSelectedRequest(request);
    setActionType(type);
    setShowDialog(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
    }
  };

  const getRequestCounts = () => {
    const pending = requests.filter(req => req.status === "pending" || !req.status).length;
    const approved = requests.filter(req => req.status === "approved").length;
    const rejected = requests.filter(req => req.status === "rejected").length;
    return { pending, approved, rejected };
  };

  const counts = getRequestCounts();

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Users className="h-8 w-8" />
              Access Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Review and manage user access requests
            </p>
          </div>
          <Link to="/dashboard">
            <Button variant="outline" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{counts.pending}</p>
                  <p className="text-sm text-muted-foreground">Pending Requests</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{counts.approved}</p>
                  <p className="text-sm text-muted-foreground">Approved Users</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-red-100 rounded-lg">
                  <XCircle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{counts.rejected}</p>
                  <p className="text-sm text-muted-foreground">Rejected Requests</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* User Requests Table */}
        <Card>
          <CardHeader>
            <CardTitle>User Access Requests</CardTitle>
            <CardDescription>
              Review and manage all user access requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {requests.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No user requests found
                </div>
              ) : (
                requests.map((request) => (
                  <div key={request.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div>
                          <h3 className="font-semibold">{request.firstName} {request.lastName}</h3>
                          <p className="text-sm text-muted-foreground">{request.email}</p>
                        </div>
                        {getStatusBadge(request.status)}
                      </div>
                      <div className="flex gap-2">
                        {request.status === "pending" || !request.status ? (
                          <>
                            <Button
                              onClick={() => openDialog(request, "approve")}
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <UserCheck className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              onClick={() => openDialog(request, "reject")}
                              size="sm"
                              variant="destructive"
                            >
                              <UserX className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </>
                        ) : (
                          <div className="text-sm text-muted-foreground">
                            {request.status === "approved" ? "✓ Approved" : "✗ Rejected"}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Role:</span> {request.role}
                      </div>
                      <div>
                        <span className="font-medium">Department:</span> {request.department}
                      </div>
                      <div>
                        <span className="font-medium">Applied:</span>{" "}
                        {request.createdAt ? new Date(request.createdAt.toDate()).toLocaleDateString() : "N/A"}
                      </div>
                    </div>
                    
                    <div>
                      <span className="font-medium text-sm">Reason for Access:</span>
                      <p className="text-sm text-muted-foreground mt-1">{request.reason}</p>
                    </div>

                    {request.status === "rejected" && request.rejectionReason && (
                      <div className="bg-red-50 p-3 rounded border border-red-100">
                        <span className="font-medium text-sm text-red-800">Rejection Reason:</span>
                        <p className="text-sm text-red-700 mt-1">{request.rejectionReason}</p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Action Dialog */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {actionType === "approve" ? "Approve" : "Reject"} Access Request
              </DialogTitle>
              <DialogDescription>
                {actionType === "approve" 
                  ? `Are you sure you want to approve access for ${selectedRequest?.firstName} ${selectedRequest?.lastName}?`
                  : `Please provide a reason for rejecting ${selectedRequest?.firstName} ${selectedRequest?.lastName}'s access request.`
                }
              </DialogDescription>
            </DialogHeader>
            
            {actionType === "reject" && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Reason for rejection:</label>
                  <Select value={rejectionReason} onValueChange={setRejectionReason}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select a reason" />
                    </SelectTrigger>
                    <SelectContent>
                      {predefinedReasons.map((reason) => (
                        <SelectItem key={reason} value={reason}>
                          {reason}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {rejectionReason === "Other (specify below)" && (
                  <div>
                    <label className="text-sm font-medium">Custom reason:</label>
                    <Textarea
                      value={customReason}
                      onChange={(e) => setCustomReason(e.target.value)}
                      placeholder="Please provide a detailed reason..."
                      className="mt-1"
                    />
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (actionType === "approve") {
                    handleApprove(selectedRequest!.id);
                  } else {
                    handleReject(selectedRequest!.id);
                  }
                }}
                className={actionType === "approve" ? "bg-green-600 hover:bg-green-700" : ""}
                variant={actionType === "reject" ? "destructive" : "default"}
              >
                {actionType === "approve" ? "Approve" : "Reject"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AccessManagement;