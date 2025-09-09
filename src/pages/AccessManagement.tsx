import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { collection, query, where, getDocs, doc, updateDoc, getDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { toast } from "sonner";
import { UserCheck, UserX, Users, ArrowLeft, Clock, CheckCircle, XCircle, Search, Filter, Download, Eye, UserCog, Shield, Ban, CheckSquare, Square } from "lucide-react";
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
  isActive?: boolean;
  lastLogin?: any;
  reviewedAt?: any;
  reviewedBy?: string;
}

const AccessManagement = () => {
  const [requests, setRequests] = useState<UserRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<UserRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<UserRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [actionType, setActionType] = useState<"approve" | "reject" | "activate" | "deactivate">("approve");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showUserDetails, setShowUserDetails] = useState(false);

  const predefinedReasons = [
    "Insufficient information provided",
    "Invalid department/faculty",
    "Role not suitable for current needs",
    "Missing required documentation",
    "Duplicate application",
    "Other (specify below)"
  ];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        fetchUserRequests(user.uid);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    filterRequests();
  }, [requests, searchTerm, statusFilter, roleFilter]);

  const fetchUserRequests = async (currentUserId: string) => {
    try {
      const q = query(collection(db, "users"));
      const querySnapshot = await getDocs(q);
      
      const userRequests: UserRequest[] = [];
      querySnapshot.forEach((doc) => {
        // Skip the current logged-in user
        if (doc.id === currentUserId) return;
        
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
          rejectionReason: data.rejectionReason,
          isActive: data.isActive !== false, // Default to true if not set
          lastLogin: data.lastLogin,
          reviewedAt: data.reviewedAt,
          reviewedBy: data.reviewedBy
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

  const filterRequests = () => {
    let filtered = requests;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.department.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      if (statusFilter === "active") {
        filtered = filtered.filter(user => user.isActive === true);
      } else if (statusFilter === "inactive") {
        filtered = filtered.filter(user => user.isActive === false);
      } else {
        filtered = filtered.filter(user => user.status === statusFilter);
      }
    }

    // Role filter
    if (roleFilter !== "all") {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    setFilteredRequests(filtered);
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

  const handleActivateUser = async (userId: string) => {
    try {
      await updateDoc(doc(db, "users", userId), {
        isActive: true,
        lastUpdated: new Date()
      });

      setRequests(prev => 
        prev.map(req => 
          req.id === userId 
            ? { ...req, isActive: true }
            : req
        )
      );

      toast.success("User activated successfully");
    } catch (error) {
      console.error("Error activating user:", error);
      toast.error("Failed to activate user");
    }
  };

  const handleDeactivateUser = async (userId: string) => {
    try {
      await updateDoc(doc(db, "users", userId), {
        isActive: false,
        lastUpdated: new Date()
      });

      setRequests(prev => 
        prev.map(req => 
          req.id === userId 
            ? { ...req, isActive: false }
            : req
        )
      );

      toast.success("User deactivated successfully");
    } catch (error) {
      console.error("Error deactivating user:", error);
      toast.error("Failed to deactivate user");
    }
  };

  const handleBulkAction = async (action: "activate" | "deactivate" | "approve" | "reject") => {
    if (selectedUsers.length === 0) {
      toast.error("Please select users to perform bulk action");
      return;
    }

    try {
      const promises = selectedUsers.map(userId => {
        switch (action) {
          case "activate":
            return updateDoc(doc(db, "users", userId), { isActive: true, lastUpdated: new Date() });
          case "deactivate":
            return updateDoc(doc(db, "users", userId), { isActive: false, lastUpdated: new Date() });
          case "approve":
            return updateDoc(doc(db, "users", userId), { status: "approved", reviewedAt: new Date() });
          case "reject":
            return updateDoc(doc(db, "users", userId), { status: "rejected", reviewedAt: new Date() });
        }
      });

      await Promise.all(promises);

      setRequests(prev => 
        prev.map(req => 
          selectedUsers.includes(req.id) 
            ? { 
                ...req, 
                isActive: action === "activate" ? true : action === "deactivate" ? false : req.isActive,
                status: action === "approve" ? "approved" : action === "reject" ? "rejected" : req.status
              }
            : req
        )
      );

      toast.success(`${selectedUsers.length} users ${action}d successfully`);
      setSelectedUsers([]);
      setShowBulkActions(false);
    } catch (error) {
      console.error(`Error performing bulk ${action}:`, error);
      toast.error(`Failed to ${action} users`);
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const selectAllUsers = () => {
    setSelectedUsers(filteredRequests.map(user => user.id));
  };

  const deselectAllUsers = () => {
    setSelectedUsers([]);
  };

  const openDialog = (request: UserRequest, type: "approve" | "reject" | "activate" | "deactivate") => {
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

  const getActiveStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
        <CheckCircle className="h-3 w-3 mr-1" />Active
      </Badge>
    ) : (
      <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">
        <Ban className="h-3 w-3 mr-1" />Inactive
      </Badge>
    );
  };

  const getRequestCounts = () => {
    const pending = requests.filter(req => req.status === "pending" || !req.status).length;
    const approved = requests.filter(req => req.status === "approved").length;
    const rejected = requests.filter(req => req.status === "rejected").length;
    const active = requests.filter(req => req.isActive === true).length;
    const inactive = requests.filter(req => req.isActive === false).length;
    return { pending, approved, rejected, active, inactive };
  };

  const counts = getRequestCounts();

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {[1, 2, 3, 4, 5].map(i => (
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
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <UserCheck className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{counts.active}</p>
                  <p className="text-sm text-muted-foreground">Active Users</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Ban className="h-6 w-6 text-gray-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{counts.inactive}</p>
                  <p className="text-sm text-muted-foreground">Inactive Users</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Search & Filter Users</CardTitle>
            <CardDescription>
              Find and manage users with advanced filtering options
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>

              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="coordinator">Coordinator</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="student">Student</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex gap-2">
                <Button
                  onClick={() => setShowBulkActions(!showBulkActions)}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <CheckSquare className="h-4 w-4" />
                  Bulk Actions
                </Button>
                <Button
                  onClick={() => {
                    // Export functionality would go here
                    toast.info("Export functionality coming soon");
                  }}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Export
                </Button>
              </div>
            </div>

            {showBulkActions && (
              <div className="border rounded-lg p-4 bg-muted/50">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <Button
                      onClick={selectAllUsers}
                      variant="outline"
                      size="sm"
                    >
                      Select All
                    </Button>
                    <Button
                      onClick={deselectAllUsers}
                      variant="outline"
                      size="sm"
                    >
                      Deselect All
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      {selectedUsers.length} users selected
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleBulkAction("activate")}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Activate Selected
                    </Button>
                    <Button
                      onClick={() => handleBulkAction("deactivate")}
                      size="sm"
                      variant="destructive"
                    >
                      Deactivate Selected
                    </Button>
                    <Button
                      onClick={() => handleBulkAction("approve")}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Approve Selected
                    </Button>
                    <Button
                      onClick={() => handleBulkAction("reject")}
                      size="sm"
                      variant="destructive"
                    >
                      Reject Selected
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* User Requests Table */}
        <Card>
          <CardHeader>
            <CardTitle>User Management</CardTitle>
            <CardDescription>
              Review and manage all user access requests and status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredRequests.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {requests.length === 0 ? "No user requests found" : "No users match your filters"}
                </div>
              ) : (
                filteredRequests.map((request) => (
                  <div key={request.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {showBulkActions && (
                          <Checkbox
                            checked={selectedUsers.includes(request.id)}
                            onCheckedChange={() => toggleUserSelection(request.id)}
                          />
                        )}
                        <div>
                          <h3 className="font-semibold">{request.firstName} {request.lastName}</h3>
                          <p className="text-sm text-muted-foreground">{request.email}</p>
                        </div>
                        <div className="flex gap-2">
                          {getStatusBadge(request.status)}
                          {getActiveStatusBadge(request.isActive || false)}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => {
                            setSelectedRequest(request);
                            setShowUserDetails(true);
                          }}
                          size="sm"
                          variant="outline"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        
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
                          <>
                            {request.isActive ? (
                              <Button
                                onClick={() => openDialog(request, "deactivate")}
                                size="sm"
                                variant="destructive"
                              >
                                <Ban className="h-4 w-4 mr-1" />
                                Deactivate
                              </Button>
                            ) : (
                              <Button
                                onClick={() => openDialog(request, "activate")}
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <UserCheck className="h-4 w-4 mr-1" />
                                Activate
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
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
                      <div>
                        <span className="font-medium">Last Login:</span>{" "}
                        {request.lastLogin ? new Date(request.lastLogin.toDate()).toLocaleDateString() : "Never"}
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
                {actionType === "approve" ? "Approve" : 
                 actionType === "reject" ? "Reject" :
                 actionType === "activate" ? "Activate" : "Deactivate"} User
              </DialogTitle>
              <DialogDescription>
                {actionType === "approve" 
                  ? `Are you sure you want to approve access for ${selectedRequest?.firstName} ${selectedRequest?.lastName}?`
                  : actionType === "reject"
                  ? `Please provide a reason for rejecting ${selectedRequest?.firstName} ${selectedRequest?.lastName}'s access request.`
                  : actionType === "activate"
                  ? `Are you sure you want to activate ${selectedRequest?.firstName} ${selectedRequest?.lastName}?`
                  : `Are you sure you want to deactivate ${selectedRequest?.firstName} ${selectedRequest?.lastName}?`
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
                  } else if (actionType === "reject") {
                    handleReject(selectedRequest!.id);
                  } else if (actionType === "activate") {
                    handleActivateUser(selectedRequest!.id);
                    setShowDialog(false);
                  } else if (actionType === "deactivate") {
                    handleDeactivateUser(selectedRequest!.id);
                    setShowDialog(false);
                  }
                }}
                className={
                  actionType === "approve" || actionType === "activate" 
                    ? "bg-green-600 hover:bg-green-700" 
                    : ""
                }
                variant={actionType === "reject" || actionType === "deactivate" ? "destructive" : "default"}
              >
                {actionType === "approve" ? "Approve" : 
                 actionType === "reject" ? "Reject" :
                 actionType === "activate" ? "Activate" : "Deactivate"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* User Details Dialog */}
        <Dialog open={showUserDetails} onOpenChange={setShowUserDetails}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>User Details</DialogTitle>
              <DialogDescription>
                Complete information for {selectedRequest?.firstName} {selectedRequest?.lastName}
              </DialogDescription>
            </DialogHeader>
            
            {selectedRequest && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                    <p className="text-sm">{selectedRequest.firstName} {selectedRequest.lastName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Email</label>
                    <p className="text-sm">{selectedRequest.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Role</label>
                    <p className="text-sm capitalize">{selectedRequest.role}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Department</label>
                    <p className="text-sm">{selectedRequest.department}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                    <div className="flex gap-2">
                      {getStatusBadge(selectedRequest.status)}
                      {getActiveStatusBadge(selectedRequest.isActive || false)}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Applied Date</label>
                    <p className="text-sm">
                      {selectedRequest.createdAt ? new Date(selectedRequest.createdAt.toDate()).toLocaleDateString() : "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Last Login</label>
                    <p className="text-sm">
                      {selectedRequest.lastLogin ? new Date(selectedRequest.lastLogin.toDate()).toLocaleDateString() : "Never"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Reviewed Date</label>
                    <p className="text-sm">
                      {selectedRequest.reviewedAt ? new Date(selectedRequest.reviewedAt.toDate()).toLocaleDateString() : "Not reviewed"}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Reason for Access</label>
                  <p className="text-sm mt-1 p-3 bg-muted rounded-lg">{selectedRequest.reason}</p>
                </div>

                {selectedRequest.status === "rejected" && selectedRequest.rejectionReason && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Rejection Reason</label>
                    <p className="text-sm mt-1 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800">
                      {selectedRequest.rejectionReason}
                    </p>
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowUserDetails(false)}>
                    Close
                  </Button>
                  {selectedRequest.status === "pending" || !selectedRequest.status ? (
                    <>
                      <Button
                        onClick={() => {
                          setShowUserDetails(false);
                          openDialog(selectedRequest, "approve");
                        }}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <UserCheck className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        onClick={() => {
                          setShowUserDetails(false);
                          openDialog(selectedRequest, "reject");
                        }}
                        variant="destructive"
                      >
                        <UserX className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </>
                  ) : (
                    <>
                      {selectedRequest.isActive ? (
                        <Button
                          onClick={() => {
                            setShowUserDetails(false);
                            openDialog(selectedRequest, "deactivate");
                          }}
                          variant="destructive"
                        >
                          <Ban className="h-4 w-4 mr-1" />
                          Deactivate
                        </Button>
                      ) : (
                        <Button
                          onClick={() => {
                            setShowUserDetails(false);
                            openDialog(selectedRequest, "activate");
                          }}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <UserCheck className="h-4 w-4 mr-1" />
                          Activate
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AccessManagement;