import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Bell,
  X,
  CheckCircle,
  Clock,
  AlertTriangle,
  Info,
  Settings,
  Trash2,
  MessageSquare,
  FolderOpen,
  Users,
  Calendar,
  TrendingUp,
  Shield,
  UserCheck,
  UserX
} from "lucide-react";
import { collection, query, where, orderBy, getDocs, doc, updateDoc, deleteDoc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { formatDistanceToNow } from "date-fns";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  timestamp: Date;
  actionUrl?: string;
  actionText?: string;
}

interface NotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationsPanel = ({ isOpen, onClose }: NotificationsPanelProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && auth.currentUser) {
      setupRealtimeNotifications();
    }
  }, [isOpen]);

  const setupRealtimeNotifications = () => {
    if (!auth.currentUser) return;

    const notificationsQuery = query(
      collection(db, "notifications"),
      where("userId", "==", auth.currentUser.uid),
      orderBy("timestamp", "desc")
    );
    
    const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
      const notificationsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date()
      })) as Notification[];

      setNotifications(notificationsData);
      setLoading(false);
    }, (error) => {
      console.error("Error in realtime notifications:", error);
      fetchNotifications(); // Fallback to regular fetch
    });

    return unsubscribe;
  };

  const fetchNotifications = async () => {
    if (!auth.currentUser) return;

    try {
      const notificationsQuery = query(
        collection(db, "notifications"),
        where("userId", "==", auth.currentUser.uid),
        orderBy("timestamp", "desc")
      );
      
      const notificationsSnapshot = await getDocs(notificationsQuery);
      const notificationsData = notificationsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date()
      })) as Notification[];

      setNotifications(notificationsData);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await updateDoc(doc(db, "notifications", notificationId), {
        read: true
      });
      
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, read: true }
            : notif
        )
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await deleteDoc(doc(db, "notifications", notificationId));
      setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const markAllAsRead = async () => {
    const unreadNotifications = notifications.filter(notif => !notif.read);
    
    try {
      await Promise.all(
        unreadNotifications.map(notif => 
          updateDoc(doc(db, "notifications", notif.id), { read: true })
        )
      );
      
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, read: true }))
      );
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const getTypeIcon = (type: string, metadata?: any) => {
    // Use metadata to determine more specific icons
    if (metadata?.type) {
      switch (metadata.type) {
        case 'task_assignment':
        case 'task_chat':
          return <CheckCircle className="h-5 w-5 text-accent" />;
        case 'project_update':
        case 'project_progress':
          return <FolderOpen className="h-5 w-5 text-primary" />;
        case 'invigilation_assignment':
        case 'invigilation_assigned':
        case 'invigilation_cancelled':
          return <Calendar className="h-5 w-5 text-destructive" />;
        case 'learning_progress':
        case 'team_learning_progress':
          return <TrendingUp className="h-5 w-5 text-accent" />;
        case 'access_request_pending':
        case 'access_request_approved':
        case 'access_request_rejected':
          return <Users className="h-5 w-5 text-warning" />;
        case 'account_active':
          return <UserCheck className="h-5 w-5 text-accent" />;
        case 'account_inactive':
          return <UserX className="h-5 w-5 text-destructive" />;
        default:
          break;
      }
    }
    
    // Fallback to type-based icons
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-accent" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-destructive" />;
      case 'error':
        return <X className="h-5 w-5 text-destructive" />;
      default:
        return <Info className="h-5 w-5 text-primary" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'border-l-accent';
      case 'warning':
        return 'border-l-destructive';
      case 'error':
        return 'border-l-destructive';
      default:
        return 'border-l-primary';
    }
  };

  const unreadCount = notifications.filter(notif => !notif.read).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="fixed right-4 top-16 w-96 max-w-[calc(100vw-2rem)] bg-card border border-border rounded-lg shadow-elegant"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bell className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Notifications</CardTitle>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {unreadCount}
                </Badge>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={markAllAsRead}
                disabled={unreadCount === 0}
                className="text-xs"
              >
                Mark all read
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <ScrollArea className="h-96">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No notifications yet</p>
                <p className="text-sm">You're all caught up!</p>
              </div>
            ) : (
              <div className="space-y-1">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border-l-4 ${getTypeColor(notification.type)} ${
                      !notification.read ? 'bg-muted/50' : ''
                    } hover:bg-muted/30 transition-colors`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        {getTypeIcon(notification.type, (notification as any).metadata)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <h4 className={`text-sm font-medium ${
                              !notification.read ? 'text-foreground' : 'text-muted-foreground'
                            }`}>
                              {notification.title}
                            </h4>
                            {!notification.read && (
                              <div className="h-2 w-2 bg-primary rounded-full"></div>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                          </p>
                          {notification.actionUrl && notification.actionText && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="mt-2 h-7 text-xs"
                              onClick={() => {
                                markAsRead(notification.id);
                                // Navigate to actionUrl
                                window.location.href = notification.actionUrl;
                              }}
                            >
                              {notification.actionText}
                            </Button>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 ml-2">
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => markAsRead(notification.id)}
                          >
                            <CheckCircle className="h-3 w-3" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                          onClick={() => deleteNotification(notification.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </div>
    </div>
  );
};


export default NotificationsPanel;