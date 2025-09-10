import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowLeft, Rocket, Lightbulb, Shield, Network } from "lucide-react";

const LearnMore = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-hero shadow-elegant">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img
                src="https://i.ibb.co/1fgK6LDc/9f757fa6-349a-4388-b958-84594b83c836.png"
                alt="MUT Innovation Lab"
                className="h-12 w-auto"
              />
              <h1 className="text-2xl font-bold text-primary-foreground">MUT Innovation Lab</h1>
            </div>
            <Link to="/">
              <Button variant="outline" size="sm" className="text-primary-foreground border-primary-foreground hover:bg-primary-foreground hover:text-primary">
                <ArrowLeft className="h-4 w-4 mr-2" /> Home
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-hero py-16 text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">About the Innovation Lab</h2>
          <p className="max-w-3xl mx-auto text-lg opacity-90">
            We empower students and staff to turn ideas into impactful solutions through modern technology, mentorship, and collaborative projects.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16">
        <div className="container mx-auto px-4 grid md:grid-cols-3 gap-6">
          <Card className="shadow-card">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center mb-3">
                <Lightbulb className="h-6 w-6 text-primary-foreground" />
              </div>
              <CardTitle>Our Mission</CardTitle>
              <CardDescription>Foster innovation and applied research at MUT.</CardDescription>
            </CardHeader>
            <CardContent>
              We nurture a community where creativity meets practical execution, enabling learners to build real-world solutions and gain industry-ready experience.
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-gradient-secondary flex items-center justify-center mb-3">
                <Rocket className="h-6 w-6 text-accent-foreground" />
              </div>
              <CardTitle>What We Offer</CardTitle>
              <CardDescription>Programs, tooling, and mentorship.</CardDescription>
            </CardHeader>
            <CardContent>
              Access hands-on projects, expert guidance, and a robust platform for managing tasks, invigilation, and collaboration across teams.
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-destructive flex items-center justify-center mb-3">
                <Shield className="h-6 w-6 text-destructive-foreground" />
              </div>
              <CardTitle>Governance & Access</CardTitle>
              <CardDescription>Secure, role-based access with approvals.</CardDescription>
            </CardHeader>
            <CardContent>
              Our system ensures only verified, approved, and active users access the dashboard, enforcing privacy and institutional policies.
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-muted/20">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-2xl font-bold mb-4">Ready to get involved?</h3>
          <p className="text-muted-foreground mb-6">Request access to join our projects and initiatives.</p>
          <div className="flex gap-3 justify-center">
            <Link to="/register">
              <Button size="lg">Request Access</Button>
            </Link>
            <Link to="/projects">
              <Button size="lg" variant="outline">Explore Projects</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card py-12 border-t">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <img
              src="https://i.ibb.co/1fgK6LDc/9f757fa6-349a-4388-b958-84594b83c836.png"
              alt="MUT Innovation Lab"
              className="h-8 w-auto"
            />
            <div>
              <div className="font-semibold">MUT Innovation Lab</div>
              <div className="text-sm text-muted-foreground">Mangosuthu University of Technology</div>
            </div>
          </div>
          <div className="text-sm text-muted-foreground">© {new Date().getFullYear()} MUT Innovation Lab</div>
        </div>
      </footer>
    </div>
  );
};

export default LearnMore;


