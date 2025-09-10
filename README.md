# MUT Innovate Hub

## Overview

MUT Innovate Hub is a comprehensive web platform designed to empower innovation and collaboration at Mangosuthu University of Technology (MUT). This platform serves as a centralized hub for managing academic projects, tracking learning progress, coordinating examination invigilation, and facilitating seamless collaboration among students, staff, lecturers, and coordinators.

## 🎯 Purpose

The platform addresses the need for streamlined academic project management and collaboration within the MUT community. It provides role-based access to specialized tools that enhance productivity, ensure academic integrity, and foster innovation through structured workflows and real-time collaboration features.

## ✨ Key Features

### 🔐 Role-Based Access Control
- **Coordinator**: Oversees all platform activities, manages user access, and coordinates projects
- **Lecturer**: Requests invigilation services and manages examination schedules
- **Staff**: Handles assigned tasks, participates in projects, and performs invigilation duties
- **Intern**: Focuses on learning modules, assists in projects, and tracks personal development

### 📊 Dashboard Analytics
- Personalized dashboards with role-specific metrics and insights
- Real-time statistics on projects, tasks, and performance indicators
- Quick access to frequently used features and pending actions

### 🎯 Project Management
- Create and manage innovation projects
- Assign tasks to team members with deadlines and priorities
- Track project progress with milestone management
- Collaborative workspace for team communication

### ✅ Task Management
- Organize academic and project-related tasks
- Intelligent scheduling and deadline tracking
- Progress monitoring with completion status updates
- Task assignment and delegation capabilities

### 👥 Invigilation System
- Request invigilation services for examinations
- Automated scheduling and assignment of invigilators
- Real-time status tracking of invigilation requests
- Academic integrity assurance through systematic monitoring

### 📈 Learning Progress Tracking
- Personalized learning paths and module tracking
- Skill development monitoring and goal setting
- Progress analytics and performance insights
- Achievement tracking and certification management

### 🔔 Notification System
- Real-time notifications for task updates, deadlines, and approvals
- Customizable notification preferences
- In-app notification panel with read/unread status

## 🛠️ Technology Stack

### Frontend
- **React 18** - Modern JavaScript library for building user interfaces
- **TypeScript** - Type-safe JavaScript for better development experience
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Modern UI component library built on Radix UI
- **React Router** - Declarative routing for React applications
- **React Query** - Powerful data synchronization for React

### Backend & Infrastructure
- **Firebase Authentication** - Secure user authentication and authorization
- **Firestore** - NoSQL cloud database for real-time data synchronization
- **Firebase Hosting** - Fast, secure web hosting

### Additional Libraries
- **Lucide React** - Beautiful & consistent icon toolkit
- **Recharts** - Composable charting library built on React components
- **React Hook Form** - Performant forms with easy validation
- **Zod** - TypeScript-first schema validation
- **Date-fns** - Modern JavaScript date utility library
- **Sonner** - Toast notifications for React

## 🚀 Getting Started

### Prerequisites
- Node.js (version 16 or higher)
- npm or yarn package manager
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <YOUR_GIT_URL>
   cd mut-innovate-hub
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   - The Firebase configuration is already set up in `src/lib/firebase.ts`
   - No additional environment variables are required for basic functionality

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Build for production**
   ```bash
   npm run build
   ```

6. **Preview production build**
   ```bash
   npm run preview
   ```

## 📁 Project Structure

```
mut-innovate-hub/
├── public/                 # Static assets
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── ui/            # shadcn/ui components
│   │   └── ...            # Custom components
│   ├── pages/             # Page components
│   │   ├── Dashboard.tsx
│   │   ├── Login.tsx
│   │   ├── Projects.tsx
│   │   └── ...
│   ├── lib/               # Utility libraries
│   │   ├── firebase.ts    # Firebase configuration
│   │   └── utils.ts       # Helper functions
│   ├── hooks/             # Custom React hooks
│   └── ...
├── package.json
├── vite.config.ts
├── tailwind.config.ts
└── README.md
```

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run build:dev` - Build for development
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

## 🎨 UI/UX Design

The platform features a modern, responsive design with:
- **Dark/Light Mode Support** - Automatic theme switching
- **Mobile-First Approach** - Fully responsive across all devices
- **Accessibility** - WCAG compliant components
- **Consistent Design System** - Unified color palette and typography
- **Smooth Animations** - Enhanced user experience with transitions

## 🔒 Security Features

- **Firebase Authentication** - Secure login and user management
- **Role-Based Access Control** - Granular permissions system
- **Data Validation** - Client and server-side validation
- **Secure API Calls** - Protected Firebase operations
- **Session Management** - Automatic session handling

## 📊 Data Management

- **Real-time Synchronization** - Live updates across all connected clients
- **Offline Support** - Basic offline functionality with sync on reconnect
- **Data Persistence** - Reliable data storage with Firebase Firestore
- **Query Optimization** - Efficient data fetching and caching

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is proprietary software developed for Mangosuthu University of Technology.

## 🆘 Support

For technical support or questions about the platform:
- Contact the MUT Innovation Lab team
- Check the documentation for common issues
- Report bugs through the platform's feedback system

## 🚀 Future Enhancements

- [ ] Mobile application development
- [ ] Advanced analytics and reporting
- [ ] Integration with learning management systems
- [ ] AI-powered task recommendations
- [ ] Enhanced collaboration features
- [ ] API endpoints for third-party integrations

---

**Built with ❤️ for the MUT Community**
