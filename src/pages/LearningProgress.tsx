import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeft, 
  BookOpen, 
  Trophy, 
  Target, 
  Clock,
  CheckCircle,
  PlayCircle,
  Lock,
  Award,
  TrendingUp
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

interface LearningModule {
  id: string;
  title: string;
  description: string;
  category: string;
  duration: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  status: 'locked' | 'available' | 'in-progress' | 'completed';
  progress: number;
  points: number;
  prerequisites?: string[];
}

interface UserProgress {
  totalPoints: number;
  completedModules: number;
  totalModules: number;
  currentLevel: number;
  skillAreas: {
    technical: number;
    research: number;
    communication: number;
    leadership: number;
  };
}

const LearningProgress = () => {
  const navigate = useNavigate();
  const [modules, setModules] = useState<LearningModule[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = ['all', 'Technical Skills', 'Research Methods', 'Communication', 'Leadership', 'Innovation'];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await fetchLearningData(user.uid);
      } else {
        navigate('/login');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const fetchLearningData = async (userId: string) => {
    try {
      // Fetch learning modules
      const modulesQuery = query(collection(db, "learningModules"));
      const modulesSnapshot = await getDocs(modulesQuery);
      const modulesData = modulesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as LearningModule[];

      // Fetch user progress
      const progressQuery = query(
        collection(db, "userProgress"),
        where("userId", "==", userId)
      );
      const progressSnapshot = await getDocs(progressQuery);
      
      if (!progressSnapshot.empty) {
        const progressData = progressSnapshot.docs[0].data() as UserProgress;
        setUserProgress(progressData);
      } else {
        // Default progress for new users
        setUserProgress({
          totalPoints: 0,
          completedModules: 0,
          totalModules: modulesData.length,
          currentLevel: 1,
          skillAreas: {
            technical: 0,
            research: 0,
            communication: 0,
            leadership: 0
          }
        });
      }

      setModules(modulesData);
    } catch (error) {
      console.error("Error fetching learning data:", error);
      // Fallback demo data
      setModules(demoModules);
      setUserProgress(demoProgress);
    } finally {
      setLoading(false);
    }
  };

  const filteredModules = selectedCategory === 'all' 
    ? modules 
    : modules.filter(module => module.category === selectedCategory);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-accent" />;
      case 'in-progress':
        return <PlayCircle className="h-5 w-5 text-primary" />;
      case 'locked':
        return <Lock className="h-5 w-5 text-muted-foreground" />;
      default:
        return <BookOpen className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner':
        return 'bg-accent text-accent-foreground';
      case 'Intermediate':
        return 'bg-primary text-primary-foreground';
      case 'Advanced':
        return 'bg-destructive text-destructive-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading learning progress...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/20">
      {/* Header */}
      <header className="bg-card shadow-card border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                  Learning Progress
                </h1>
                <p className="text-muted-foreground">Track your skill development journey</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="text-primary border-primary">
                Level {userProgress?.currentLevel}
              </Badge>
              <div className="text-right">
                <p className="text-sm font-medium">{userProgress?.totalPoints} Points</p>
                <p className="text-xs text-muted-foreground">Total Earned</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Progress Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg">
                <Trophy className="h-5 w-5 mr-2 text-accent" />
                Completed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-accent">
                {userProgress?.completedModules}
              </div>
              <p className="text-sm text-muted-foreground">
                of {userProgress?.totalModules} modules
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg">
                <Target className="h-5 w-5 mr-2 text-primary" />
                Technical
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                {userProgress?.skillAreas.technical}%
              </div>
              <Progress value={userProgress?.skillAreas.technical} className="mt-2" />
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg">
                <BookOpen className="h-5 w-5 mr-2 text-mut-secondary" />
                Research
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold" style={{ color: 'hsl(var(--mut-secondary))' }}>
                {userProgress?.skillAreas.research}%
              </div>
              <Progress value={userProgress?.skillAreas.research} className="mt-2" />
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg">
                <Award className="h-5 w-5 mr-2 text-destructive" />
                Leadership
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-destructive">
                {userProgress?.skillAreas.leadership}%
              </div>
              <Progress value={userProgress?.skillAreas.leadership} className="mt-2" />
            </CardContent>
          </Card>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-6">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className="capitalize"
            >
              {category === 'all' ? 'All Modules' : category}
            </Button>
          ))}
        </div>

        {/* Learning Modules */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredModules.map((module) => (
            <Card 
              key={module.id} 
              className={`shadow-card hover:shadow-elegant transition-all duration-300 ${
                module.status === 'locked' ? 'opacity-60' : 'hover:scale-[1.02]'
              }`}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(module.status)}
                    <div>
                      <CardTitle className="text-lg">{module.title}</CardTitle>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge 
                          className={`text-xs ${getDifficultyColor(module.difficulty)}`}
                        >
                          {module.difficulty}
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {module.duration}h
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-accent">{module.points} pts</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-4">
                  {module.description}
                </CardDescription>
                
                {module.status === 'in-progress' && (
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Progress</span>
                      <span>{module.progress}%</span>
                    </div>
                    <Progress value={module.progress} />
                  </div>
                )}

                <Button 
                  className="w-full" 
                  disabled={module.status === 'locked'}
                  variant={module.status === 'completed' ? 'outline' : 'default'}
                >
                  {module.status === 'completed' && 'Review Module'}
                  {module.status === 'in-progress' && 'Continue Learning'}
                  {module.status === 'available' && 'Start Module'}
                  {module.status === 'locked' && 'Locked'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

// Demo data for fallback
const demoProgress: UserProgress = {
  totalPoints: 320,
  completedModules: 4,
  totalModules: 12,
  currentLevel: 3,
  skillAreas: {
    technical: 75,
    research: 60,
    communication: 80,
    leadership: 45
  }
};

const demoModules: LearningModule[] = [
  {
    id: "1",
    title: "Introduction to React",
    description: "Learn the fundamentals of React development and component-based architecture.",
    category: "Technical Skills",
    duration: 8,
    difficulty: "Beginner",
    status: "completed",
    progress: 100,
    points: 50
  },
  {
    id: "2",
    title: "Firebase Integration",
    description: "Master Firebase services including Firestore, Authentication, and Hosting.",
    category: "Technical Skills", 
    duration: 12,
    difficulty: "Intermediate",
    status: "in-progress",
    progress: 65,
    points: 75
  },
  {
    id: "3",
    title: "Research Methodology",
    description: "Learn systematic approaches to conducting technological research.",
    category: "Research Methods",
    duration: 6,
    difficulty: "Beginner",
    status: "available",
    progress: 0,
    points: 40
  },
  {
    id: "4",
    title: "Team Leadership",
    description: "Develop leadership skills for managing innovation projects.",
    category: "Leadership",
    duration: 10,
    difficulty: "Advanced",
    status: "locked",
    progress: 0,
    points: 80
  }
];

export default LearningProgress;