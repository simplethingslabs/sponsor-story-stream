import { useState } from 'react';
import { Bell, Mail, Smartphone, Volume2, Check } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useNotify } from '@/hooks/useNotify';

interface NotificationPreference {
  id: string;
  label: string;
  description: string;
  email: boolean;
  inApp: boolean;
}

const defaultPreferences: NotificationPreference[] = [
  {
    id: 'reports',
    label: 'Progress Reports',
    description: 'Get notified when new progress reports are published for your sponsored children',
    email: true,
    inApp: true,
  },
  {
    id: 'newsletters',
    label: 'Newsletters',
    description: 'Receive notifications when new school newsletters are published',
    email: true,
    inApp: true,
  },
  {
    id: 'events',
    label: 'School Events',
    description: 'Be notified about upcoming school events and activities',
    email: true,
    inApp: true,
  },
  {
    id: 'sponsorships',
    label: 'Sponsorship Updates',
    description: 'Updates about your sponsorship assignments and changes',
    email: true,
    inApp: true,
  },
  {
    id: 'payments',
    label: 'Payment Reminders',
    description: 'Reminders about upcoming or overdue payments',
    email: true,
    inApp: true,
  },
  {
    id: 'system',
    label: 'System Notifications',
    description: 'Important system announcements and account updates',
    email: true,
    inApp: true,
  },
];

export default function NotificationSettings() {
  const [preferences, setPreferences] = useState<NotificationPreference[]>(defaultPreferences);
  const [isSaving, setIsSaving] = useState(false);
  const { notifySuccess } = useNotify();

  const updatePreference = (id: string, field: 'email' | 'inApp', value: boolean) => {
    setPreferences(prev =>
      prev.map(pref =>
        pref.id === id ? { ...pref, [field]: value } : pref
      )
    );
  };

  const toggleAllEmail = (enabled: boolean) => {
    setPreferences(prev => prev.map(pref => ({ ...pref, email: enabled })));
  };

  const toggleAllInApp = (enabled: boolean) => {
    setPreferences(prev => prev.map(pref => ({ ...pref, inApp: enabled })));
  };

  const handleSave = async () => {
    setIsSaving(true);
    // TODO: Save to backend when API is ready
    await new Promise(resolve => setTimeout(resolve, 500));
    setIsSaving(false);
    notifySuccess('Settings Saved', 'Your notification preferences have been updated.');
  };

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Notification Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage how you receive notifications about your sponsored children and school updates.
        </p>
      </div>

      <div className="space-y-6">
        {/* Master Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Quick Controls
            </CardTitle>
            <CardDescription>
              Quickly toggle all notifications on or off
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Button
                variant="outline"
                onClick={() => toggleAllEmail(true)}
                className="flex items-center gap-2"
              >
                <Mail className="h-4 w-4" />
                Enable All Email
              </Button>
              <Button
                variant="outline"
                onClick={() => toggleAllEmail(false)}
                className="flex items-center gap-2"
              >
                <Mail className="h-4 w-4" />
                Disable All Email
              </Button>
              <Button
                variant="outline"
                onClick={() => toggleAllInApp(true)}
                className="flex items-center gap-2"
              >
                <Smartphone className="h-4 w-4" />
                Enable All In-App
              </Button>
              <Button
                variant="outline"
                onClick={() => toggleAllInApp(false)}
                className="flex items-center gap-2"
              >
                <Smartphone className="h-4 w-4" />
                Disable All In-App
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Individual Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>Notification Categories</CardTitle>
            <CardDescription>
              Customize notifications for each category
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {preferences.map((pref, index) => (
                <div key={pref.id}>
                  {index > 0 && <Separator className="mb-6" />}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <Label className="text-base font-medium">{pref.label}</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {pref.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <Switch
                          id={`${pref.id}-email`}
                          checked={pref.email}
                          onCheckedChange={(checked) => updatePreference(pref.id, 'email', checked)}
                        />
                        <Label htmlFor={`${pref.id}-email`} className="text-sm text-muted-foreground">
                          Email
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Bell className="h-4 w-4 text-muted-foreground" />
                        <Switch
                          id={`${pref.id}-inapp`}
                          checked={pref.inApp}
                          onCheckedChange={(checked) => updatePreference(pref.id, 'inApp', checked)}
                        />
                        <Label htmlFor={`${pref.id}-inapp`} className="text-sm text-muted-foreground">
                          In-App
                        </Label>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Sound Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Volume2 className="h-5 w-5" />
              Sound Settings
            </CardTitle>
            <CardDescription>
              Control notification sounds
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">Notification Sounds</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Play a sound when new notifications arrive
                </p>
              </div>
              <Switch id="sound-enabled" defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isSaving} className="min-w-32">
            {isSaving ? (
              'Saving...'
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Save Preferences
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
