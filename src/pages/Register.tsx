import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, UserPlus } from "lucide-react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { toast } from "sonner";

const Register = () => {
  const [formData, setFormData] = useState({
    role: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    department: "",
    reason: "",
    password: ""
  });

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);

      // Update user profile with displayName as firstName + lastName
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: `${formData.firstName} ${formData.lastName}`
        });
      }

      // Save user data to Firestore database
      if (userCredential.user) {
        const userRef = doc(db, "users", userCredential.user.uid);
        await setDoc(userRef, {
          role: formData.role,
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          department: formData.department,
          reason: formData.reason,
          status: "pending",
          createdAt: new Date()
        });
      }

      toast.success("Registration successful! You can now log in.");
      setFormData({
        role: "",
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        department: "",
        reason: "",
        password: ""
      });

      // Redirect to login page after successful registration
      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);

    } catch (err: any) {
      const errorMessage = err.message || "Failed to register.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <img 
            src="https://i.ibb.co/1fgK6LDc/9f757fa6-349a-4388-b958-84594b83c836.png" 
            alt="MUT Innovation Lab" 
            className="h-16 w-auto mx-auto mb-4"
          />
          <h1 className="text-2xl font-bold text-primary-foreground mb-2">
            Request Access
          </h1>
          <p className="text-primary-foreground/80">
            Submit your application to join MUT Innovation Lab
          </p>
        </div>

        {/* Registration Card */}
        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Access Request Form
            </CardTitle>
            <CardDescription>
              Fill out the form below to request access to the system. Your application will be reviewed by the coordinator.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    placeholder="Enter your first name"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange("firstName", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    placeholder="Enter your last name"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange("lastName", e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Requesting Role</Label>
                <Select value={formData.role} onValueChange={(value) => handleInputChange("role", value)} required>
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Select the role you're applying for" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="coordinator">Coordinator</SelectItem>
                    <SelectItem value="lab-staff">Lab Staff</SelectItem>
                    <SelectItem value="intern">Intern</SelectItem>
                    <SelectItem value="lecturer">Lecturer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@mut.ac.za"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+27 XX XXX XXXX"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Create a strong password"
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">Department/Faculty</Label>
                <Input
                  id="department"
                  placeholder="e.g., Information Technology, Engineering, etc."
                  value={formData.department}
                  onChange={(e) => handleInputChange("department", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Reason for Access Request</Label>
                <Textarea
                  id="reason"
                  placeholder="Please explain why you need access to the Innovation Lab system and how you plan to contribute..."
                  value={formData.reason}
                  onChange={(e) => handleInputChange("reason", e.target.value)}
                  className="min-h-[100px]"
                  required
                />
              </div>

              {error && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md">
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-green-100 border border-green-200 text-green-800 px-4 py-3 rounded-md">
                  {success}
                </div>
              )}

              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">What happens next?</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Your application will be reviewed by the Innovation Lab coordinator</li>
                  <li>• You will receive an email notification about the status of your application</li>
                  <li>• If approved, you will receive login credentials and system access</li>
                  <li>• Processing time is typically 2-3 business days</li>
                </ul>
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? "Submitting..." : "Submit Access Request"}
              </Button>
            </form>

            <div className="mt-6 text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link to="/login" className="text-primary hover:underline">
                  Sign In
                </Link>
              </p>
              <Link 
                to="/" 
                className="inline-flex items-center text-sm text-muted-foreground hover:text-primary"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Homepage
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Register;
