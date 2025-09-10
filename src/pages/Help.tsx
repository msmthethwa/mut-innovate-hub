import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const Help = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="bg-gradient-hero py-10">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img
                src="https://i.ibb.co/1fgK6LDc/9f757fa6-349a-4388-b958-84594b83c836.png"
                alt="MUT Innovation Lab"
                className="h-10 w-auto"
              />
              <h1 className="text-3xl font-bold text-primary-foreground">Help & User Manual</h1>
            </div>
            <div className="flex items-center space-x-2">
              <Link to="/">
                <Button variant="secondary" size="sm">Home</Button>
              </Link>
              <Link to="/dashboard">
                <Button variant="outline" size="sm" className="text-primary-foreground border-primary-foreground hover:bg-primary-foreground hover:text-primary">Dashboard</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-10 grid lg:grid-cols-4 gap-8">
        <nav className="lg:col-span-1 space-y-2 sticky top-6 h-fit">
          <Card>
            <CardHeader>
              <CardTitle>On this page</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <a className="block hover:underline" href="#overview">Overview</a>
              <a className="block hover:underline" href="#get-started">Getting Started</a>
              <a className="block hover:underline" href="#navigation">Navigation</a>
              <a className="block hover:underline" href="#projects">Projects</a>
              <a className="block hover:underline" href="#tasks">Tasks</a>
              <a className="block hover:underline" href="#invigilations">Invigilations</a>
              <a className="block hover:underline" href="#learning">Learning Progress</a>
              <a className="block hover:underline" href="#account">Account & Settings</a>
              <a className="block hover:underline" href="#notifications">Notifications</a>
              <a className="block hover:underline" href="#faq">FAQ</a>
              <a className="block hover:underline" href="#support">Support</a>
            </CardContent>
          </Card>
        </nav>

        <section className="lg:col-span-3 space-y-10">
          <Card id="overview">
            <CardHeader>
              <CardTitle>Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>
                The MUT Innovation Lab platform streamlines project coordination, task management, staff
                scheduling for invigilations, learning progress tracking, and role-based access.
                This manual explains core features and guides you through common workflows.
              </p>
            </CardContent>
          </Card>

          <Card id="get-started">
            <CardHeader>
              <CardTitle>Getting Started</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <ol className="list-decimal pl-6 space-y-2">
                <li>Go to the Home page and click <span className="font-medium">Login</span> or <span className="font-medium">Register</span>.</li>
                <li>After login, you will land on the <span className="font-medium">Dashboard</span>.</li>
                <li>Use the top navigation to access Projects, Tasks, Invigilations, and more.</li>
              </ol>
            </CardContent>
          </Card>

          <Card id="navigation">
            <CardHeader>
              <CardTitle>Navigation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>
                Key areas of the app can be reached from the header or via direct links:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Home (Index): Public landing page with quick access to Login and Dashboard.</li>
                <li>Dashboard: Personalized workspace with summaries and quick links.</li>
                <li>Projects: Manage and review projects, files, and team members.</li>
                <li>Tasks: View and update task assignments and status.</li>
                <li>Invigilations: Review invigilation schedules and assignments.</li>
                <li>Learning: Track learning modules and progress.</li>
                <li>Profile & Settings: Manage personal info, security, and preferences.</li>
              </ul>
            </CardContent>
          </Card>

          <Card id="projects">
            <CardHeader>
              <CardTitle>Projects</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <ul className="list-disc pl-6 space-y-2">
                <li>Create, view, and manage lab projects.</li>
                <li>Assign project managers (random assignment supported by the system).</li>
                <li>Upload files and images related to each project.</li>
                <li>Monitor real-time progress and team collaboration.</li>
              </ul>
            </CardContent>
          </Card>

          <Card id="tasks">
            <CardHeader>
              <CardTitle>Tasks</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <ul className="list-disc pl-6 space-y-2">
                <li>Track tasks assigned to staff members with due dates and status.</li>
                <li>Use filters to focus on your assignments.</li>
                <li>Update progress and communicate blockers.</li>
              </ul>
            </CardContent>
          </Card>

          <Card id="invigilations">
            <CardHeader>
              <CardTitle>Invigilations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <ul className="list-disc pl-6 space-y-2">
                <li>Automatic invigilation assignment with lecturer request inputs.</li>
                <li>View schedules and receive automated notifications for changes.</li>
                <li>Confirm attendance and report conflicts early.</li>
              </ul>
            </CardContent>
          </Card>

          <Card id="learning">
            <CardHeader>
              <CardTitle>Learning Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <ul className="list-disc pl-6 space-y-2">
                <li>Access learning modules and track completion.</li>
                <li>Review scores and milestones to identify growth areas.</li>
              </ul>
            </CardContent>
          </Card>

          <Card id="account">
            <CardHeader>
              <CardTitle>Account & Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <ul className="list-disc pl-6 space-y-2">
                <li>Update your profile details and avatar in <span className="font-medium">Profile</span>.</li>
                <li>Manage preferences, notifications, and security in <span className="font-medium">Settings</span>.</li>
                <li>Role-based access determines which pages and actions you can use.</li>
              </ul>
            </CardContent>
          </Card>

          <Card id="notifications">
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>
                The app uses toast notifications for important events such as assignments, status updates, and schedule changes.
              </p>
            </CardContent>
          </Card>

          <Card id="faq">
            <CardHeader>
              <CardTitle>FAQ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <Separator />
              <div>
                <div className="font-medium">I can’t access a page. Why?</div>
                <p>Some areas are protected and require login. Your role may also limit access.</p>
              </div>
              <Separator />
              <div>
                <div className="font-medium">How do I reset my password?</div>
                <p>Go to <span className="font-medium">Profile</span> or <span className="font-medium">Settings</span> and follow the security options.</p>
              </div>
              <Separator />
              <div>
                <div className="font-medium">Where do I find project files?</div>
                <p>Open the related project in <span className="font-medium">Projects</span> to view attachments.</p>
              </div>
            </CardContent>
          </Card>

          <Card id="support">
            <CardHeader>
              <CardTitle>Support</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>
                Need more help? Contact the Innovation Lab support team.
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Email: <a className="underline" href="mailto:support@mut-innovation.lab">support@mut-innovation.lab</a></li>
                <li>Docs: <a className="underline" href="/help">Help & User Manual</a></li>
              </ul>
            </CardContent>
          </Card>
        </section>
      </main>

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
          <div className="text-sm text-muted-foreground">© 2023 MUT Innovation Lab.</div>
        </div>
      </footer>
    </div>
  );
};

export default Help;
