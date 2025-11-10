import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Coffee, LogOut, CheckCircle } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, getDocs, addDoc, updateDoc, doc, Timestamp, orderBy, limit } from "firebase/firestore";
import { format } from "date-fns";
import { toast } from "sonner";

const AttendanceClock = () => {
  const [todayRecord, setTodayRecord] = useState<any>(null);
  const [onBreak, setOnBreak] = useState(false);
  const [breakStart, setBreakStart] = useState<Date | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    loadTodayRecord();
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const loadTodayRecord = async () => {
    if (!auth.currentUser) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const recordsQuery = query(
      collection(db, "attendance"),
      where("userId", "==", auth.currentUser.uid),
      where("date", ">=", Timestamp.fromDate(today)),
      where("date", "<", Timestamp.fromDate(tomorrow)),
      orderBy("date", "desc"),
      limit(1)
    );

    const snapshot = await getDocs(recordsQuery);
    if (!snapshot.empty) {
      setTodayRecord({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
    } else {
      setTodayRecord(null);
    }
  };

  const handleCheckIn = async () => {
    if (!auth.currentUser) return;

    try {
      await addDoc(collection(db, "attendance"), {
        userId: auth.currentUser.uid,
        date: Timestamp.now(),
        checkIn: Timestamp.now(),
        checkOut: null,
        breakDuration: 0,
        status: "present",
        notes: ""
      });

      toast.success("Checked in successfully!");
      await loadTodayRecord();
    } catch (error) {
      console.error("Error checking in:", error);
      toast.error("Failed to check in");
    }
  };

  const handleStartBreak = () => {
    setOnBreak(true);
    setBreakStart(new Date());
    toast.info("Break started");
  };

  const handleEndBreak = async () => {
    if (!todayRecord || !breakStart) return;

    const breakDuration = Math.floor((new Date().getTime() - breakStart.getTime()) / 60000);
    const totalBreak = (todayRecord.breakDuration || 0) + breakDuration;

    try {
      await updateDoc(doc(db, "attendance", todayRecord.id), {
        breakDuration: totalBreak
      });

      setOnBreak(false);
      setBreakStart(null);
      toast.success(`Break ended. Duration: ${breakDuration} minutes`);
      await loadTodayRecord();
    } catch (error) {
      console.error("Error ending break:", error);
      toast.error("Failed to end break");
    }
  };

  const handleCheckOut = async () => {
    if (!todayRecord) return;

    try {
      await updateDoc(doc(db, "attendance", todayRecord.id), {
        checkOut: Timestamp.now()
      });

      toast.success("Checked out successfully!");
      await loadTodayRecord();
    } catch (error) {
      console.error("Error checking out:", error);
      toast.error("Failed to check out");
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getWorkDuration = () => {
    if (!todayRecord?.checkIn) return "0h 0m";
    
    const startTime = todayRecord.checkIn.toDate().getTime();
    const endTime = todayRecord.checkOut ? todayRecord.checkOut.toDate().getTime() : currentTime.getTime();
    const totalMinutes = Math.floor((endTime - startTime) / 60000) - (todayRecord.breakDuration || 0);
    
    return formatDuration(Math.max(0, totalMinutes));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Time Clock
        </CardTitle>
        <CardDescription>{format(currentTime, "PPPP")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <div className="text-4xl font-bold text-foreground mb-2">
            {format(currentTime, "HH:mm:ss")}
          </div>
          {todayRecord && (
            <Badge variant="outline" className="text-lg">
              Working: {getWorkDuration()}
            </Badge>
          )}
        </div>

        {todayRecord && (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Check In</p>
              <p className="font-semibold">{todayRecord.checkIn ? format(todayRecord.checkIn.toDate(), "HH:mm") : "-"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Check Out</p>
              <p className="font-semibold">{todayRecord.checkOut ? format(todayRecord.checkOut.toDate(), "HH:mm") : "-"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Break Time</p>
              <p className="font-semibold">{formatDuration(todayRecord.breakDuration || 0)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Status</p>
              <Badge variant={onBreak ? "secondary" : "default"}>
                {onBreak ? "On Break" : todayRecord.checkOut ? "Checked Out" : "Working"}
              </Badge>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {!todayRecord ? (
            <Button onClick={handleCheckIn} className="w-full" size="lg">
              <CheckCircle className="h-5 w-5" />
              Check In
            </Button>
          ) : !todayRecord.checkOut ? (
            <>
              {!onBreak ? (
                <>
                  <Button onClick={handleStartBreak} variant="outline" className="w-full">
                    <Coffee className="h-4 w-4" />
                    Start Break
                  </Button>
                  <Button onClick={handleCheckOut} variant="destructive" className="w-full">
                    <LogOut className="h-4 w-4" />
                    Check Out
                  </Button>
                </>
              ) : (
                <Button onClick={handleEndBreak} className="w-full">
                  <Coffee className="h-4 w-4" />
                  End Break
                </Button>
              )}
            </>
          ) : (
            <div className="text-center text-muted-foreground py-4">
              <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
              <p>You've checked out for today</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AttendanceClock;
