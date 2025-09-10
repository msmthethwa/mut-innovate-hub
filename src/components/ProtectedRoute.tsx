import { ReactNode, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

type ProtectedRouteProps = {
  children: ReactNode;
};

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const location = useLocation();
  const [initializing, setInitializing] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isActive, setIsActive] = useState<boolean | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setStatus((data.status as string) || "pending");
            setIsActive(data.isActive !== false);
          } else {
            setStatus(null);
            setIsActive(null);
          }
        } catch {
          setStatus(null);
          setIsActive(null);
        }
      }
      setInitializing(false);
    });
    return () => unsubscribe();
  }, []);

  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Checking access...
      </div>
    );
  }

  // Not signed in
  if (!currentUser) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Email must be verified
  if (!currentUser.emailVerified) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location, message: "Please verify your email before accessing the dashboard." }}
      />
    );
  }

  // Must be approved and active
  if (status !== "approved" || isActive === false) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;


