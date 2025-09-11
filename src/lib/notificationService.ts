import { collection, addDoc, query, where, getDocs, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface NotificationData {
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  actionUrl?: string;
  actionText?: string;
  metadata?: Record<string, any>;
}

export class NotificationService {
  
  // Create notifications for task assignments
  static async createTaskAssignmentNotification(taskData: {
    taskId: string;
    taskTitle: string;
    projectName: string;
    assignedToId: string;
    assignedToName: string;
    assignedById: string;
    assignedByName: string;
    dueDate: string;
  }) {
    const notification: NotificationData = {
      title: "New Task Assigned",
      message: `You have been assigned to "${taskData.taskTitle}" in project "${taskData.projectName}". Due: ${new Date(taskData.dueDate).toLocaleDateString()}`,
      type: "info",
      actionUrl: "/tasks",
      actionText: "View Task",
      metadata: {
        taskId: taskData.taskId,
        type: "task_assignment",
        assignedById: taskData.assignedById
      }
    };

    await this.createNotification(taskData.assignedToId, notification);
    
    // Also notify coordinators about task assignment
    await this.notifyCoordinators({
      title: "Task Assigned",
      message: `Task "${taskData.taskTitle}" has been assigned to ${taskData.assignedToName}`,
      type: "info",
      actionUrl: "/tasks",
      actionText: "View Tasks",
      metadata: {
        taskId: taskData.taskId,
        type: "task_assignment_admin",
        assignedToId: taskData.assignedToId
      }
    });
  }

  // Create notifications for project updates
  static async createProjectUpdateNotification(projectData: {
    projectId: string;
    projectName: string;
    updateType: string;
    updatedById: string;
    updatedByName: string;
    teamMembers: string[];
    progress?: number;
  }) {
    const notification: NotificationData = {
      title: "Project Updated",
      message: `Project "${projectData.projectName}" has been updated by ${projectData.updatedByName}${projectData.progress ? ` - Progress: ${projectData.progress}%` : ''}`,
      type: "info",
      actionUrl: "/projects",
      actionText: "View Project",
      metadata: {
        projectId: projectData.projectId,
        type: "project_update",
        updatedById: projectData.updatedById
      }
    };

    // Notify all team members except the updater
    for (const memberId of projectData.teamMembers) {
      if (memberId !== projectData.updatedById) {
        await this.createNotification(memberId, notification);
      }
    }

    // Notify coordinators
    await this.notifyCoordinators({
      title: "Project Progress Updated",
      message: `Project "${projectData.projectName}" progress updated to ${projectData.progress}% by ${projectData.updatedByName}`,
      type: "info",
      actionUrl: "/projects",
      actionText: "View Projects",
      metadata: {
        projectId: projectData.projectId,
        type: "project_progress",
        updatedById: projectData.updatedById
      }
    });
  }

  // Create notifications for learning progress updates
  static async createLearningProgressNotification(userData: {
    userId: string;
    userName: string;
    skillName: string;
    milestone: string;
    progress: number;
  }) {
    const notification: NotificationData = {
      title: "Learning Milestone Achieved!",
      message: `Congratulations! You've reached ${userData.milestone} in ${userData.skillName} - ${userData.progress}% complete`,
      type: "success",
      actionUrl: "/learning",
      actionText: "View Progress",
      metadata: {
        type: "learning_progress",
        skillName: userData.skillName,
        milestone: userData.milestone
      }
    };

    await this.createNotification(userData.userId, notification);

    // Notify coordinators about learning progress
    await this.notifyCoordinators({
      title: "Learning Progress Update",
      message: `${userData.userName} has achieved ${userData.milestone} in ${userData.skillName}`,
      type: "success",
      actionUrl: "/access-management",
      actionText: "View Team Progress",
      metadata: {
        userId: userData.userId,
        type: "team_learning_progress",
        skillName: userData.skillName
      }
    });
  }

  // Create notifications for invigilation assignments
  static async createInvigilationAssignmentNotification(invigilationData: {
    requestId: string;
    examTitle: string;
    examDate: string;
    examTime: string;
    venue: string;
    assignedToId: string;
    assignedToName: string;
    requesterId: string;
    requesterName: string;
  }) {
    const notification: NotificationData = {
      title: "Invigilation Duty Assigned",
      message: `You have been assigned to invigilate "${invigilationData.examTitle}" on ${new Date(invigilationData.examDate).toLocaleDateString()} at ${invigilationData.examTime} in ${invigilationData.venue}`,
      type: "warning",
      actionUrl: "/invigilations",
      actionText: "View Details",
      metadata: {
        requestId: invigilationData.requestId,
        type: "invigilation_assignment",
        examDate: invigilationData.examDate
      }
    };

    await this.createNotification(invigilationData.assignedToId, notification);

    // Notify lecturer that assignment is complete
    const lecturerNotification: NotificationData = {
      title: "Invigilation Request Assigned",
      message: `Your invigilation request for "${invigilationData.examTitle}" has been assigned to ${invigilationData.assignedToName}`,
      type: "success",
      actionUrl: "/invigilations",
      actionText: "View Request",
      metadata: {
        requestId: invigilationData.requestId,
        type: "invigilation_assigned",
        assignedToId: invigilationData.assignedToId
      }
    };

    await this.createNotification(invigilationData.requesterId, lecturerNotification);
  }

  // Create notifications for invigilation cancellations
  static async createInvigilationCancellationNotification(cancellationData: {
    requestId: string;
    examTitle: string;
    examDate: string;
    cancelledById: string;
    cancelledByName: string;
    reason: string;
    affectedUsers: string[];
    requesterId: string;
  }) {
    const notification: NotificationData = {
      title: "Invigilation Cancelled",
      message: `The invigilation for "${cancellationData.examTitle}" on ${new Date(cancellationData.examDate).toLocaleDateString()} has been cancelled. Reason: ${cancellationData.reason}`,
      type: "warning",
      actionUrl: "/invigilations",
      actionText: "View Updated Schedule",
      metadata: {
        requestId: cancellationData.requestId,
        type: "invigilation_cancelled",
        reason: cancellationData.reason
      }
    };

    // Notify all affected users
    for (const userId of cancellationData.affectedUsers) {
      await this.createNotification(userId, notification);
    }

    // Notify the requester
    await this.createNotification(cancellationData.requesterId, notification);
  }

  // Create notifications for task chat messages
  static async createTaskChatNotification(chatData: {
    taskId: string;
    taskTitle: string;
    senderId: string;
    senderName: string;
    senderRole: string;
    message: string;
    participantIds: string[];
  }) {
    const notification: NotificationData = {
      title: "New Message in Task",
      message: `${chatData.senderName} replied in "${chatData.taskTitle}": ${chatData.message.substring(0, 100)}${chatData.message.length > 100 ? '...' : ''}`,
      type: "info",
      actionUrl: "/tasks",
      actionText: "View Conversation",
      metadata: {
        taskId: chatData.taskId,
        type: "task_chat",
        senderId: chatData.senderId
      }
    };

    // Notify all participants except the sender
    for (const participantId of chatData.participantIds) {
      if (participantId !== chatData.senderId) {
        await this.createNotification(participantId, notification);
      }
    }

    // If sender is staff/intern, also notify coordinators
    if (['staff', 'intern'].includes(chatData.senderRole)) {
      await this.notifyCoordinators({
        title: "Task Discussion Update",
        message: `${chatData.senderName} posted in task "${chatData.taskTitle}"`,
        type: "info",
        actionUrl: "/tasks",
        actionText: "View Discussion",
        metadata: {
          taskId: chatData.taskId,
          type: "task_chat_admin",
          senderId: chatData.senderId
        }
      });
    }
  }

  // Create notifications for access requests
  static async createAccessRequestNotification(requestData: {
    requestId: string;
    requesterName: string;
    requesterEmail: string;
    requestedRole: string;
    status: 'pending' | 'approved' | 'rejected';
    reason?: string;
  }) {
    if (requestData.status === 'pending') {
      // Notify coordinators about new access request
      await this.notifyCoordinators({
        title: "New Access Request",
        message: `${requestData.requesterName} (${requestData.requesterEmail}) has requested ${requestData.requestedRole} access`,
        type: "warning",
        actionUrl: "/access-management",
        actionText: "Review Request",
        metadata: {
          requestId: requestData.requestId,
          type: "access_request_pending"
        }
      });
    } else {
      // Notify the requester about decision
      const notification: NotificationData = {
        title: `Access Request ${requestData.status.charAt(0).toUpperCase() + requestData.status.slice(1)}`,
        message: requestData.status === 'approved' 
          ? `Your request for ${requestData.requestedRole} access has been approved. Welcome to MUT Innovation Lab!`
          : `Your request for ${requestData.requestedRole} access has been rejected. ${requestData.reason || ''}`,
        type: requestData.status === 'approved' ? 'success' : 'error',
        actionUrl: requestData.status === 'approved' ? "/" : "/help",
        actionText: requestData.status === 'approved' ? "Go to Dashboard" : "Get Help",
        metadata: {
          requestId: requestData.requestId,
          type: `access_request_${requestData.status}`,
          reason: requestData.reason
        }
      };

      // Get user by email to send notification
      const usersQuery = query(collection(db, "users"), where("email", "==", requestData.requesterEmail));
      const usersSnapshot = await getDocs(usersQuery);
      
      if (!usersSnapshot.empty) {
        const userData = usersSnapshot.docs[0];
        await this.createNotification(userData.id, notification);
      }
    }
  }

  // Create notifications for account status changes
  static async createAccountStatusNotification(statusData: {
    userId: string;
    userName: string;
    status: 'active' | 'inactive';
    reason?: string;
  }) {
    const notification: NotificationData = {
      title: statusData.status === 'inactive' ? "Account Deactivated" : "Account Activated",
      message: statusData.status === 'inactive'
        ? `Your account has been deactivated. ${statusData.reason || 'Please contact your coordinator for more information.'}`
        : "Your account has been reactivated. Welcome back to MUT Innovation Lab!",
      type: statusData.status === 'inactive' ? 'error' : 'success',
      actionUrl: statusData.status === 'inactive' ? "/help" : "/",
      actionText: statusData.status === 'inactive' ? "Get Help" : "Go to Dashboard",
      metadata: {
        type: `account_${statusData.status}`,
        reason: statusData.reason
      }
    };

    await this.createNotification(statusData.userId, notification);
  }

  // Helper function to create a single notification
  static async createNotification(userId: string, notificationData: NotificationData) {
    try {
      await addDoc(collection(db, "notifications"), {
        userId,
        title: notificationData.title,
        message: notificationData.message,
        type: notificationData.type,
        read: false,
        timestamp: serverTimestamp(),
        actionUrl: notificationData.actionUrl,
        actionText: notificationData.actionText,
        metadata: notificationData.metadata || {}
      });
    } catch (error) {
      console.error("Error creating notification:", error);
    }
  }

  // Helper function to notify all coordinators
  static async notifyCoordinators(notificationData: NotificationData) {
    try {
      const coordinatorsQuery = query(
        collection(db, "users"),
        where("role", "==", "coordinator"),
        where("status", "==", "approved")
      );
      const coordinatorsSnapshot = await getDocs(coordinatorsQuery);
      
      for (const coordinatorDoc of coordinatorsSnapshot.docs) {
        await this.createNotification(coordinatorDoc.id, notificationData);
      }
    } catch (error) {
      console.error("Error notifying coordinators:", error);
    }
  }

  // Helper function to notify lecturers
  static async notifyLecturers(notificationData: NotificationData) {
    try {
      const lecturersQuery = query(
        collection(db, "users"),
        where("role", "==", "lecturer"),
        where("status", "==", "approved")
      );
      const lecturersSnapshot = await getDocs(lecturersQuery);
      
      for (const lecturerDoc of lecturersSnapshot.docs) {
        await this.createNotification(lecturerDoc.id, notificationData);
      }
    } catch (error) {
      console.error("Error notifying lecturers:", error);
    }
  }

  // Helper function to get team members from a project
  static async getProjectTeamMembers(projectId: string): Promise<string[]> {
    try {
      const tasksQuery = query(collection(db, "tasks"), where("projectId", "==", projectId));
      const tasksSnapshot = await getDocs(tasksQuery);
      
      const teamMembers = new Set<string>();
      tasksSnapshot.docs.forEach(doc => {
        const taskData = doc.data();
        if (taskData.assignedTo) {
          teamMembers.add(taskData.assignedTo);
        }
      });

      return Array.from(teamMembers);
    } catch (error) {
      console.error("Error getting project team members:", error);
      return [];
    }
  }

  // Helper function to get task participants (for chat notifications)
  static async getTaskParticipants(taskId: string): Promise<string[]> {
    try {
      const messagesQuery = query(collection(db, "tasks", taskId, "messages"));
      const messagesSnapshot = await getDocs(messagesQuery);
      
      const participants = new Set<string>();
      messagesSnapshot.docs.forEach(doc => {
        const messageData = doc.data();
        if (messageData.userId) {
          participants.add(messageData.userId);
        }
      });

      // Also include task assignee
      const tasksQuery = query(collection(db, "tasks"), where("__name__", "==", taskId));
      const tasksSnapshot = await getDocs(tasksQuery);
      
      if (!tasksSnapshot.empty) {
        const taskData = tasksSnapshot.docs[0].data();
        if (taskData.assignedTo) {
          participants.add(taskData.assignedTo);
        }
        if (taskData.createdBy) {
          participants.add(taskData.createdBy);
        }
      }

      return Array.from(participants);
    } catch (error) {
      console.error("Error getting task participants:", error);
      return [];
    }
  }
}