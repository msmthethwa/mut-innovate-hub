import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, LogIn } from "lucide-react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { toast } from "sonner";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      // Fetch user data from Firestore
      const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        // Check user status
        const status = userData.status || "pending";
        
        if (status === "pending") {
          toast.error("Your access request is still pending approval. Please wait for coordinator review.");
          setError("Your access request is still pending approval. Please wait for coordinator review.");
          setLoading(false);
          return;
        } else if (status === "rejected") {
          const reason = userData.rejectionReason || "No reason provided";
          toast.error(`Your access request was rejected. Reason: ${reason}`);
          setError(`Your access request was rejected. Reason: ${reason}`);
          setLoading(false);
          return;
        } else if (status === "approved") {
          localStorage.setItem("userRole", userData.role);
          toast.success("Login successful! Welcome back.");
          console.log("User logged in:", userCredential.user);

          // Redirect to dashboard after successful login
          setTimeout(() => {
            navigate("/dashboard");
          }, 1000);
        } else {
          toast.error("Unknown account status. Please contact administrator.");
          setLoading(false);
          return;
        }
      } else {
        toast.error("User data not found. Please contact administrator.");
        setLoading(false);
        return;
      }

    } catch (err: any) {
      const errorMessage = err.message || "Failed to log in.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <img 
            src="https://i.ibb.co/1fgK6LDc/9f757fa6-349a-4388-b958-84594b83c836.png" 
            alt="MUT Innovation Lab" 
            className="h-16 w-auto mx-auto mb-4"
          />
          <h1 className="text-2xl font-bold text-primary-foreground mb-2">
            MUT Innovation Lab
          </h1>
          <p className="text-primary-foreground/80">
            Sign in to access your dashboard
          </p>
        </div>

        {/* Login Card */}
        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LogIn className="h-5 w-5" />
              Sign In
            </CardTitle>
            <CardDescription>
              Enter your credentials to access the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@mut.ac.za"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {error && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? "Signing In..." : "Sign In"}
              </Button>
            </form>

            <div className="mt-6 text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Don't have an account?{" "}
                <Link to="/register" className="text-primary hover:underline">
                  Request Access
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

export default Login;