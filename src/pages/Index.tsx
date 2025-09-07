import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Target, Award, ArrowRight, BookOpen, Calendar, Settings } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="bg-gradient-hero shadow-elegant">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img 
                src="https://i.ibb.co/HfwCH8cD/Innovation-Lab-Logo.png" 
                alt="MUT Innovation Lab" 
                className="h-12 w-auto"
              />
              <h1 className="text-2xl font-bold text-primary-foreground">
                MUT Innovation Lab
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/login">
                <Button variant="secondary" size="sm">
                  Login
                </Button>
              </Link>
              <Link to="/dashboard">
                <Button variant="outline" size="sm" className="text-primary-foreground border-primary-foreground hover:bg-primary-foreground hover:text-primary">
                  Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-hero py-20">
        <div className="container mx-auto px-4 text-center text-primary-foreground">
          <h2 className="text-5xl font-bold mb-6">
            Innovation Through Technology
          </h2>
          <p className="text-xl mb-8 max-w-3xl mx-auto opacity-90">
            MUT Innovation Lab is a cutting-edge facility dedicated to fostering technological innovation, 
            research excellence, and practical skills development for students and staff.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/projects">
              <Button size="lg" variant="secondary" className="px-8">
                View Projects <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/about">
              <Button size="lg" variant="outline" className="px-8 text-primary-foreground border-primary-foreground hover:bg-primary-foreground hover:text-primary">
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold mb-4">What We Do</h3>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our comprehensive platform manages projects, coordinates tasks, and facilitates 
              seamless collaboration across the Innovation Lab ecosystem.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="shadow-card hover:shadow-elegant transition-all duration-300 border-l-4 border-l-primary">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center mb-4">
                  <BookOpen className="h-6 w-6 text-primary-foreground" />
                </div>
                <CardTitle>Project Management</CardTitle>
                <CardDescription>
                  Streamlined project coordination with automated task assignment and progress tracking.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Random project manager assignment</li>
                  <li>• Real-time progress tracking</li>
                  <li>• File and image hosting</li>
                  <li>• Collaborative workspaces</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="shadow-card hover:shadow-elegant transition-all duration-300 border-l-4 border-l-accent">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-secondary rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-accent-foreground" />
                </div>
                <CardTitle>Staff Management</CardTitle>
                <CardDescription>
                  Comprehensive staff coordination with role-based access and task distribution.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Role-based dashboards</li>
                  <li>• Automated task assignment</li>
                  <li>• Staff performance tracking</li>
                  <li>• Notification system</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="shadow-card hover:shadow-elegant transition-all duration-300 border-l-4 border-l-destructive">
              <CardHeader>
                <div className="w-12 h-12 bg-destructive rounded-lg flex items-center justify-center mb-4">
                  <Calendar className="h-6 w-6 text-destructive-foreground" />
                </div>
                <CardTitle>Invigilation Scheduling</CardTitle>
                <CardDescription>
                  Automated invigilation assignment system for seamless exam coordination.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Random staff selection</li>
                  <li>• Lecturer request system</li>
                  <li>• Automated notifications</li>
                  <li>• Schedule management</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">50+</div>
              <div className="text-primary-foreground/80">Active Projects</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">120+</div>
              <div className="text-primary-foreground/80">Staff Members</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">1000+</div>
              <div className="text-primary-foreground/80">Students Served</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">25+</div>
              <div className="text-primary-foreground/80">Research Areas</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card py-12 border-t">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img 
                src="https://i.ibb.co/HfwCH8cD/Innovation-Lab-Logo.png" 
                alt="MUT Innovation Lab" 
                className="h-8 w-auto"
              />
              <div>
                <div className="font-semibold">MUT Innovation Lab</div>
                <div className="text-sm text-muted-foreground">Mangosuthu University of Technology</div>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              © 2024 MUT Innovation Lab. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;