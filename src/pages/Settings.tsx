import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Bell, Lock, Palette, Globe, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useToast } from "@/hooks/use-toast";

type AppSettings = {
  // General
  language: "english" | "afrikaans" | "zulu";
  timezone: "sast" | "utc" | "gmt";
  autoSave: boolean;
  showTooltips: boolean;
  // Notifications
  emailNotifications: boolean;
  taskAssignments: boolean;
  projectUpdates: boolean;
  invigilationAssignments: boolean;
  systemAnnouncements: boolean;
  // Security
  loginAlerts: boolean;
  // Appearance
  theme: "light" | "dark" | "system";
  fontSize: "small" | "medium" | "large";
  compactMode: boolean;
  highContrast: boolean;
};

const DEFAULT_SETTINGS: AppSettings = {
  language: "english",
  timezone: "sast",
  autoSave: true,
  showTooltips: true,
  emailNotifications: true,
  taskAssignments: true,
  projectUpdates: true,
  invigilationAssignments: true,
  systemAnnouncements: false,
  loginAlerts: true,
  theme: "light",
  fontSize: "medium",
  compactMode: false,
  highContrast: false,
};

const STORAGE_KEY = "mut.app.settings";

function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...parsed } as AppSettings;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function applyAppearance(settings: AppSettings) {
  const root = document.documentElement;
  // Theme
  const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  const resolvedTheme = settings.theme === "system" ? (prefersDark ? "dark" : "light") : settings.theme;
  root.classList.remove("light", "dark");
  root.classList.add(resolvedTheme);
  // Font size via CSS variable on root
  const sizeMap: Record<AppSettings["fontSize"], string> = {
    small: "14px",
    medium: "16px",
    large: "18px",
  };
  root.style.setProperty("--app-base-font-size", sizeMap[settings.fontSize]);
  // Compact and contrast classes on body
  document.body.classList.toggle("compact-mode", settings.compactMode);
  document.body.classList.toggle("high-contrast", settings.highContrast);
}

const Settings = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const [initialSettings] = useState<AppSettings>(() => settings);

  // Apply appearance on mount and whenever related settings change
  useEffect(() => {
    applyAppearance(settings);
  }, [settings.theme, settings.fontSize, settings.compactMode, settings.highContrast]);

  const hasChanges = useMemo(() => JSON.stringify(settings) !== JSON.stringify(initialSettings), [settings, initialSettings]);

  function persist(newSettings: AppSettings) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
  }

  function handleUpdate<K extends keyof AppSettings>(key: K, value: AppSettings[K]) {
    setSettings((prev) => {
      const next = { ...prev, [key]: value } as AppSettings;
      if (next.autoSave) {
        persist(next);
        applyAppearance(next);
      }
      return next;
    });
  }

  function handleSave() {
    persist(settings);
    applyAppearance(settings);
    toast({ title: "Settings saved", description: "Your preferences have been updated." });
  }

  function handleCancel() {
    const loaded = loadSettings();
    setSettings(loaded);
    applyAppearance(loaded);
    toast({ title: "Changes discarded", description: "Reverted to the last saved settings." });
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to="/dashboard">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-mut-primary">Settings</h1>
            <p className="text-muted-foreground">Manage your application preferences and account settings</p>
          </div>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  General Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Select value={settings.language} onValueChange={(v) => handleUpdate("language", v as AppSettings["language"]) }>
                    <SelectTrigger>
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="english">English</SelectItem>
                      <SelectItem value="afrikaans">Afrikaans</SelectItem>
                      <SelectItem value="zulu">Zulu</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select value={settings.timezone} onValueChange={(v) => handleUpdate("timezone", v as AppSettings["timezone"]) }>
                    <SelectTrigger>
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sast">South Africa Standard Time (SAST)</SelectItem>
                      <SelectItem value="utc">UTC</SelectItem>
                      <SelectItem value="gmt">GMT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto-save changes</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically save changes without confirmation
                    </p>
                  </div>
                  <Switch checked={settings.autoSave} onCheckedChange={(v) => handleUpdate("autoSave", v)} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Show tooltips</Label>
                    <p className="text-sm text-muted-foreground">
                      Display helpful tooltips throughout the interface
                    </p>
                  </div>
                  <Switch checked={settings.showTooltips} onCheckedChange={(v) => handleUpdate("showTooltips", v)} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notification Settings */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notification Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive email notifications for important updates
                    </p>
                  </div>
                  <Switch checked={settings.emailNotifications} onCheckedChange={(v) => handleUpdate("emailNotifications", v)} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Task assignments</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified when you're assigned new tasks
                    </p>
                  </div>
                  <Switch checked={settings.taskAssignments} onCheckedChange={(v) => handleUpdate("taskAssignments", v)} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Project updates</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications for project status changes
                    </p>
                  </div>
                  <Switch checked={settings.projectUpdates} onCheckedChange={(v) => handleUpdate("projectUpdates", v)} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Invigilation assignments</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified about invigilation duties
                    </p>
                  </div>
                  <Switch checked={settings.invigilationAssignments} onCheckedChange={(v) => handleUpdate("invigilationAssignments", v)} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>System announcements</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive important system-wide announcements
                    </p>
                  </div>
                  <Switch checked={settings.systemAnnouncements} onCheckedChange={(v) => handleUpdate("systemAnnouncements", v)} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security & Privacy
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Change Password</h3>
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Current Password</Label>
                    <Input id="current-password" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input id="new-password" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <Input id="confirm-password" type="password" />
                  </div>
                  <Button className="bg-mut-primary hover:bg-mut-primary/90">
                    Update Password
                  </Button>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Two-factor authentication</Label>
                    <p className="text-sm text-muted-foreground">
                      Add an extra layer of security to your account
                    </p>
                  </div>
                  <Button variant="outline" onClick={() => toast({ title: "Coming soon", description: "Two-factor authentication will be available later." })}>Enable</Button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Login alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified of new login attempts
                    </p>
                  </div>
                  <Switch checked={settings.loginAlerts} onCheckedChange={(v) => handleUpdate("loginAlerts", v)} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appearance Settings */}
          <TabsContent value="appearance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Appearance & Display
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Theme</Label>
                  <Select value={settings.theme} onValueChange={(v) => handleUpdate("theme", v as AppSettings["theme"]) }>
                    <SelectTrigger>
                      <SelectValue placeholder="Select theme" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Font size</Label>
                  <Select value={settings.fontSize} onValueChange={(v) => handleUpdate("fontSize", v as AppSettings["fontSize"]) }>
                    <SelectTrigger>
                      <SelectValue placeholder="Select font size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Small</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="large">Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Compact mode</Label>
                    <p className="text-sm text-muted-foreground">
                      Use more compact spacing throughout the interface
                    </p>
                  </div>
                  <Switch checked={settings.compactMode} onCheckedChange={(v) => handleUpdate("compactMode", v)} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>High contrast</Label>
                    <p className="text-sm text-muted-foreground">
                      Increase contrast for better accessibility
                    </p>
                  </div>
                  <Switch checked={settings.highContrast} onCheckedChange={(v) => handleUpdate("highContrast", v)} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Save Changes */}
        <div className="flex justify-end gap-4 mt-8">
          <Button variant="outline" onClick={handleCancel} disabled={!hasChanges && settings.autoSave}>Cancel</Button>
          <Button className="bg-mut-primary hover:bg-mut-primary/90" onClick={handleSave} disabled={!hasChanges && settings.autoSave}>
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Settings;