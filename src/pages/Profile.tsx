import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, Camera, Mail, Phone, MapPin, Calendar, Award, BookOpen, Plus, Edit, Trash2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [certifications, setCertifications] = useState<any[]>([]);
  const [isCertDialogOpen, setIsCertDialogOpen] = useState(false);
  const [editingCert, setEditingCert] = useState<any>(null);
  const [certForm, setCertForm] = useState({
    title: '',
    issuer: '',
    issueDate: '',
    expiryDate: '',
    description: ''
  });

  // New state for profile picture file input
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Function to handle profile picture upload button click
  const handleUploadProfilePicture = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Function to handle file input change and upload to ImgBB
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) return;
    const file = event.target.files[0];

    const formData = new FormData();
    formData.append('image', file);

    try {
      const apiKey = 'fff91995b8dedfc03c798619b023fa21';
      const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        const imageUrl = data.data.url;

        // Update user profilePictureUrl in Firestore
        if (user) {
          const userRef = doc(db, "users", auth.currentUser!.uid);
          await updateDoc(userRef, {
            profilePictureUrl: imageUrl
          });

          // Update local state
          setUser(prev => ({
            ...prev,
            profilePictureUrl: imageUrl
          }));

          setFeedback({ type: 'success', message: 'Profile picture updated successfully!' });
          setShowFeedback(true);
        }
      } else {
        setFeedback({ type: 'error', message: 'Failed to upload image. Please try again.' });
        setShowFeedback(true);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      setFeedback({ type: 'error', message: 'Error uploading image. Please try again.' });
      setShowFeedback(true);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists()) {
            setUser(userDoc.data());
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

  // Auto-hide feedback modal after 3 seconds
  useEffect(() => {
    if (showFeedback) {
      const timer = setTimeout(() => {
        setShowFeedback(false);
        setFeedback(null);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [showFeedback]);

  const handleSavePersonalInfo = async () => {
    if (!user) return;

    const firstName = (document.getElementById('firstName') as HTMLInputElement)?.value;
    const lastName = (document.getElementById('lastName') as HTMLInputElement)?.value;
    const email = (document.getElementById('email') as HTMLInputElement)?.value;
    const phone = (document.getElementById('phone') as HTMLInputElement)?.value;
    const department = (document.getElementById('department') as HTMLInputElement)?.value;
    const bio = (document.getElementById('bio') as HTMLTextAreaElement)?.value;
    const skillsText = (document.getElementById('skills') as HTMLTextAreaElement)?.value;
    const skills = skillsText ? skillsText.split(',').map(skill => skill.trim()) : [];

    try {
      const userRef = doc(db, "users", auth.currentUser!.uid);
      await updateDoc(userRef, {
        firstName,
        lastName,
        email,
        phone,
        department,
        bio,
        skills
      });

      // Update local state
      setUser(prev => ({
        ...prev,
        firstName,
        lastName,
        email,
        phone,
        department,
        bio,
        skills
      }));

      setFeedback({ type: 'success', message: 'Profile updated successfully!' });
      setShowFeedback(true);
    } catch (error) {
      console.error('Error updating profile:', error);
      setFeedback({ type: 'error', message: 'Error updating profile. Please try again.' });
      setShowFeedback(true);
    }
  };

  const handleSaveProfessionalInfo = async () => {
    if (!user) return;

    const position = (document.getElementById('position') as HTMLInputElement)?.value;
    const employeeId = (document.getElementById('employeeId') as HTMLInputElement)?.value;
    const startDate = (document.getElementById('startDate') as HTMLInputElement)?.value;
    const supervisor = (document.getElementById('supervisor') as HTMLInputElement)?.value;
    const specializations = (document.getElementById('specializations') as HTMLTextAreaElement)?.value;

    try {
      const userRef = doc(db, "users", auth.currentUser!.uid);
      await updateDoc(userRef, {
        position,
        employeeId,
        startDate,
        supervisor,
        specializations
      });

      // Update local state
      setUser(prev => ({
        ...prev,
        position,
        employeeId,
        startDate,
        supervisor,
        specializations
      }));

      setFeedback({ type: 'success', message: 'Professional details updated successfully!' });
      setShowFeedback(true);
    } catch (error) {
      console.error('Error updating professional details:', error);
      setFeedback({ type: 'error', message: 'Error updating professional details. Please try again.' });
      setShowFeedback(true);
    }
  };

  // Certification management functions
  const handleAddCertification = () => {
    setEditingCert(null);
    setCertForm({
      title: '',
      issuer: '',
      issueDate: '',
      expiryDate: '',
      description: ''
    });
    setIsCertDialogOpen(true);
  };

  const handleEditCertification = (cert: any) => {
    setEditingCert(cert);
    setCertForm({
      title: cert.title || '',
      issuer: cert.issuer || '',
      issueDate: cert.issueDate || '',
      expiryDate: cert.expiryDate || '',
      description: cert.description || ''
    });
    setIsCertDialogOpen(true);
  };

  const handleDeleteCertification = async (certId: string) => {
    if (!user) return;

    const updatedCerts = certifications.filter(cert => cert.id !== certId);
    setCertifications(updatedCerts);

    try {
      const userRef = doc(db, "users", auth.currentUser!.uid);
      await updateDoc(userRef, {
        certifications: updatedCerts
      });

      setFeedback({ type: 'success', message: 'Certification deleted successfully!' });
      setShowFeedback(true);
    } catch (error) {
      console.error('Error deleting certification:', error);
      setFeedback({ type: 'error', message: 'Error deleting certification. Please try again.' });
      setShowFeedback(true);
    }
  };

  const handleSaveCertification = async () => {
    if (!user) return;

    const newCert = {
      id: editingCert ? editingCert.id : Date.now().toString(),
      title: certForm.title,
      issuer: certForm.issuer,
      issueDate: certForm.issueDate,
      expiryDate: certForm.expiryDate,
      description: certForm.description,
      type: editingCert ? editingCert.type : 'certification'
    };

    let updatedCerts;
    if (editingCert) {
      updatedCerts = certifications.map(cert =>
        cert.id === editingCert.id ? newCert : cert
      );
    } else {
      updatedCerts = [...certifications, newCert];
    }

    setCertifications(updatedCerts);

    try {
      const userRef = doc(db, "users", auth.currentUser!.uid);
      await updateDoc(userRef, {
        certifications: updatedCerts
      });

      setIsCertDialogOpen(false);
      setFeedback({ type: 'success', message: `Certification ${editingCert ? 'updated' : 'added'} successfully!` });
      setShowFeedback(true);
    } catch (error) {
      console.error('Error saving certification:', error);
      setFeedback({ type: 'error', message: 'Error saving certification. Please try again.' });
      setShowFeedback(true);
    }
  };

  // Load certifications from user data
  useEffect(() => {
    if (user?.certifications) {
      setCertifications(user.certifications);
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to="/dashboard">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-mut-primary">Profile</h1>
            <p className="text-muted-foreground">Manage your personal information and preferences</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Profile Overview */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center space-y-4">
                  <div className="relative">
                    <Avatar className="w-24 h-24">
                      <AvatarImage src={user?.profilePictureUrl || ""} alt="Profile picture" />
                      <AvatarFallback className="text-2xl bg-mut-primary text-white">JS</AvatarFallback>
                    </Avatar>
                    <Button
                      size="icon"
                      variant="outline"
                      className="absolute -bottom-2 -right-2 rounded-full w-8 h-8"
                      onClick={handleUploadProfilePicture}
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                      style={{ display: 'none' }}
                    />
                  </div>
                  <div className="text-center">
                    <h2 className="text-xl font-semibold">
                      {user?.firstName || user?.name || "User"} {user?.lastName || ""}
                    </h2>
                    <p className="text-muted-foreground">{user?.role || "Staff"}</p>
                    <Badge className="mt-2 bg-mut-secondary text-white">Active</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">QUICK INFO</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{user?.email || "user@mut.ac.za"}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{user?.phone || "+27 31 907 7000"}</span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{user?.department || "Innovation Lab, MUT"}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    Joined {user?.createdAt ? new Date(user.createdAt.toDate()).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }) : "Jan 2023"}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">SKILLS & EXPERTISE</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {user?.skills && user.skills.length > 0 ? (
                    user.skills.map((skill: string, index: number) => (
                      <Badge key={index} variant="secondary">{skill}</Badge>
                    ))
                  ) : (
                    <>
                      <Badge variant="secondary">React</Badge>
                      <Badge variant="secondary">TypeScript</Badge>
                      <Badge variant="secondary">Firebase</Badge>
                      <Badge variant="secondary">Project Management</Badge>
                      <Badge variant="secondary">UI/UX Design</Badge>
                      <Badge variant="secondary">Database Design</Badge>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Profile Details */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="personal" className="space-y-6">
              <TabsList>
                <TabsTrigger value="personal">Personal Info</TabsTrigger>
                <TabsTrigger value="professional">Professional</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
              </TabsList>

              {/* Personal Information */}
              <TabsContent value="personal">
                <Card>
                  <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input id="firstName" defaultValue={user?.firstName || user?.name || "John"} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input id="lastName" defaultValue={user?.lastName || "Smith"} />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input id="email" type="email" defaultValue={user?.email || "john.smith@mut.ac.za"} />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input id="phone" defaultValue={user?.phone || "+27 31 907 7000"} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="department">Department</Label>
                        <Input id="department" defaultValue={user?.department || "Innovation Lab"} />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        rows={4}
                        defaultValue={user?.bio || "Passionate software developer with expertise in web technologies and project management. Dedicated to innovation and helping students succeed."}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="skills">Skills & Expertise</Label>
                      <Textarea
                        id="skills"
                        rows={3}
                        placeholder="Enter your skills separated by commas (e.g., React, TypeScript, Firebase, Project Management)"
                        defaultValue={user?.skills ? user.skills.join(', ') : "React, TypeScript, Firebase, Project Management, UI/UX Design, Database Design"}
                      />
                    </div>

                    <Button className="bg-mut-primary hover:bg-mut-primary/90" onClick={handleSavePersonalInfo}>
                      Save Changes
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Professional Information */}
              <TabsContent value="professional">
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Professional Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="position">Position</Label>
                          <Input id="position" defaultValue={user?.position || "Senior Lab Staff"} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="employeeId">Employee ID</Label>
                          <Input id="employeeId" defaultValue={user?.employeeId || "MUT2023001"} />
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="startDate">Start Date</Label>
                          <Input id="startDate" type="date" defaultValue={user?.startDate || "2023-01-15"} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="supervisor">Supervisor</Label>
                          <Input id="supervisor" defaultValue={user?.supervisor || "Dr. Sarah Johnson"} />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="specializations">Specializations</Label>
                        <Textarea
                          id="specializations"
                          rows={3}
                          defaultValue={user?.specializations || "Web Development, Mobile Applications, Database Management, Student Mentoring, Project Coordination"}
                        />
                      </div>

                      <Button className="bg-mut-primary hover:bg-mut-primary/90" onClick={handleSaveProfessionalInfo}>
                        Save Changes
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Award className="h-5 w-5" />
                          Certifications & Achievements
                        </div>
                        <Dialog open={isCertDialogOpen} onOpenChange={setIsCertDialogOpen}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={handleAddCertification}>
                              <Plus className="h-4 w-4 mr-2" />
                              Add
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                              <DialogTitle>
                                {editingCert ? 'Edit Certification' : 'Add Certification'}
                              </DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                              <div className="grid gap-2">
                                <Label htmlFor="certTitle">Title</Label>
                                <Input
                                  id="certTitle"
                                  value={certForm.title}
                                  onChange={(e) => setCertForm(prev => ({ ...prev, title: e.target.value }))}
                                  placeholder="e.g., Google Cloud Professional Developer"
                                />
                              </div>
                              <div className="grid gap-2">
                                <Label htmlFor="certIssuer">Issuer</Label>
                                <Input
                                  id="certIssuer"
                                  value={certForm.issuer}
                                  onChange={(e) => setCertForm(prev => ({ ...prev, issuer: e.target.value }))}
                                  placeholder="e.g., Google Cloud"
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                  <Label htmlFor="certIssueDate">Issue Date</Label>
                                  <Input
                                    id="certIssueDate"
                                    type="date"
                                    value={certForm.issueDate}
                                    onChange={(e) => setCertForm(prev => ({ ...prev, issueDate: e.target.value }))}
                                  />
                                </div>
                                <div className="grid gap-2">
                                  <Label htmlFor="certExpiryDate">Expiry Date (Optional)</Label>
                                  <Input
                                    id="certExpiryDate"
                                    type="date"
                                    value={certForm.expiryDate}
                                    onChange={(e) => setCertForm(prev => ({ ...prev, expiryDate: e.target.value }))}
                                  />
                                </div>
                              </div>
                              <div className="grid gap-2">
                                <Label htmlFor="certDescription">Description (Optional)</Label>
                                <Textarea
                                  id="certDescription"
                                  value={certForm.description}
                                  onChange={(e) => setCertForm(prev => ({ ...prev, description: e.target.value }))}
                                  placeholder="Additional details about this certification..."
                                  rows={3}
                                />
                              </div>
                            </div>
                            <div className="flex justify-end gap-2">
                              <Button variant="outline" onClick={() => setIsCertDialogOpen(false)}>
                                Cancel
                              </Button>
                              <Button onClick={handleSaveCertification}>
                                {editingCert ? 'Update' : 'Add'} Certification
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {certifications.length > 0 ? (
                        <div className="space-y-4">
                          {certifications.map((cert: any) => (
                            <div key={cert.id} className="flex items-start gap-4 group">
                              <div className="flex-shrink-0">
                                {cert.type === 'achievement' ? (
                                  <Award className="h-5 w-5 text-mut-secondary mt-1" />
                                ) : (
                                  <BookOpen className="h-5 w-5 text-mut-primary mt-1" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium">{cert.title}</h4>
                                <p className="text-sm text-muted-foreground">
                                  {cert.issuer && `Issued by ${cert.issuer}`}
                                  {cert.issueDate && ` • Issued ${new Date(cert.issueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}`}
                                  {cert.expiryDate && ` • Expires ${new Date(cert.expiryDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}`}
                                </p>
                                {cert.description && (
                                  <p className="text-sm text-muted-foreground mt-1">{cert.description}</p>
                                )}
                              </div>
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditCertification(cert)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteCertification(cert.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-muted-foreground mb-2">No certifications yet</h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            Add your certifications and achievements to showcase your professional development.
                          </p>
                          <Button variant="outline" onClick={handleAddCertification}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Your First Certification
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Activity */}
              <TabsContent value="activity">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="flex items-start gap-4">
                        <div className="w-2 h-2 bg-mut-primary rounded-full mt-2"></div>
                        <div>
                          <p className="font-medium">Completed task: Update project documentation</p>
                          <p className="text-sm text-muted-foreground">2 hours ago</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="w-2 h-2 bg-mut-secondary rounded-full mt-2"></div>
                        <div>
                          <p className="font-medium">Assigned to invigilation duty</p>
                          <p className="text-sm text-muted-foreground">1 day ago</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="w-2 h-2 bg-mut-primary rounded-full mt-2"></div>
                        <div>
                          <p className="font-medium">Updated profile information</p>
                          <p className="text-sm text-muted-foreground">3 days ago</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                        <div>
                          <p className="font-medium">Project milestone achieved: Mobile App Phase 1</p>
                          <p className="text-sm text-muted-foreground">1 week ago</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="w-2 h-2 bg-mut-secondary rounded-full mt-2"></div>
                        <div>
                          <p className="font-medium">Mentored new intern orientation</p>
                          <p className="text-sm text-muted-foreground">2 weeks ago</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Animated Feedback Modal */}
      {showFeedback && feedback && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div
            className={`bg-white rounded-lg p-6 shadow-lg max-w-sm mx-4 transform transition-all duration-300 ease-in-out ${
              showFeedback ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  feedback.type === 'success'
                    ? 'bg-green-100 text-green-600'
                    : 'bg-red-100 text-red-600'
                }`}
              >
                {feedback.type === 'success' ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{feedback.message}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;