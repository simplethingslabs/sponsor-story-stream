import { useState } from 'react';
import { Bell, Send, Users, UserCheck, Megaphone, Search, Filter, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNotify } from '@/hooks/useNotify';
import { formatDistanceToNow } from 'date-fns';

interface BroadcastFormData {
  title: string;
  message: string;
  targetGroup: 'all_sponsors' | 'all_teachers' | 'specific_user';
  notificationType: 'system' | 'event' | 'newsletter';
  link?: string;
}

// Mock recent notifications for display
const recentNotifications = [
  {
    id: '1',
    title: 'New Progress Report',
    message: 'Q4 2024 report for Priya published',
    type: 'report',
    recipients: 2,
    sent_at: new Date(Date.now() - 1000 * 60 * 30),
  },
  {
    id: '2',
    title: 'New School Event',
    message: 'Annual Day celebration scheduled',
    type: 'event',
    recipients: 15,
    sent_at: new Date(Date.now() - 1000 * 60 * 60 * 2),
  },
  {
    id: '3',
    title: 'January Newsletter',
    message: 'New newsletter published',
    type: 'newsletter',
    recipients: 15,
    sent_at: new Date(Date.now() - 1000 * 60 * 60 * 24),
  },
];

const notificationStats = {
  totalSent: 156,
  sentToday: 12,
  avgReadRate: 78,
  pendingDelivery: 3,
};

export default function NotificationCenter() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { notifySuccess, notifyError } = useNotify();

  const [formData, setFormData] = useState<BroadcastFormData>({
    title: '',
    message: '',
    targetGroup: 'all_sponsors',
    notificationType: 'system',
    link: '',
  });

  const handleSendBroadcast = async () => {
    if (!formData.title.trim() || !formData.message.trim()) {
      notifyError('Missing Fields', 'Please fill in both title and message.');
      return;
    }

    setIsSending(true);
    try {
      // TODO: Implement backend API for broadcast notifications
      await new Promise(resolve => setTimeout(resolve, 1000));
      notifySuccess('Broadcast Sent', 'Your notification has been sent to all recipients.');
      setIsDialogOpen(false);
      setFormData({
        title: '',
        message: '',
        targetGroup: 'all_sponsors',
        notificationType: 'system',
        link: '',
      });
    } catch {
      notifyError('Failed to Send', 'There was an error sending the notification.');
    } finally {
      setIsSending(false);
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'report':
        return 'bg-blue-100 text-blue-700';
      case 'event':
        return 'bg-purple-100 text-purple-700';
      case 'newsletter':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="container py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Notification Center</h1>
          <p className="text-muted-foreground mt-1">
            Manage and send notifications to users
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Megaphone className="mr-2 h-4 w-4" />
              Send Broadcast
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Send Broadcast Notification</DialogTitle>
              <DialogDescription>
                Send a notification to a group of users. They will receive it in-app and optionally via email.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="target">Target Audience</Label>
                <Select
                  value={formData.targetGroup}
                  onValueChange={(value: 'all_sponsors' | 'all_teachers' | 'specific_user') =>
                    setFormData(prev => ({ ...prev, targetGroup: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all_sponsors">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        All Sponsors
                      </div>
                    </SelectItem>
                    <SelectItem value="all_teachers">
                      <div className="flex items-center gap-2">
                        <UserCheck className="h-4 w-4" />
                        All Teachers
                      </div>
                    </SelectItem>
                    <SelectItem value="specific_user">
                      <div className="flex items-center gap-2">
                        <UserCheck className="h-4 w-4" />
                        Specific User
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Notification Type</Label>
                <Select
                  value={formData.notificationType}
                  onValueChange={(value: 'system' | 'event' | 'newsletter') =>
                    setFormData(prev => ({ ...prev, notificationType: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="system">System Announcement</SelectItem>
                    <SelectItem value="event">Event Notification</SelectItem>
                    <SelectItem value="newsletter">Newsletter Alert</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="Notification title..."
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  placeholder="Enter your message..."
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="link">Link (Optional)</Label>
                <Input
                  id="link"
                  placeholder="/admin/events or https://..."
                  value={formData.link}
                  onChange={(e) => setFormData(prev => ({ ...prev, link: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">
                  Optional link to include in the notification
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSendBroadcast} disabled={isSending}>
                {isSending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Notification
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Sent</CardDescription>
            <CardTitle className="text-2xl">{notificationStats.totalSent}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Sent Today</CardDescription>
            <CardTitle className="text-2xl">{notificationStats.sentToday}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Last 24 hours</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Read Rate</CardDescription>
            <CardTitle className="text-2xl">{notificationStats.avgReadRate}%</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Average</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending</CardDescription>
            <CardTitle className="text-2xl">{notificationStats.pendingDelivery}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Awaiting delivery</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="recent" className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <TabsList>
            <TabsTrigger value="recent">Recent Notifications</TabsTrigger>
            <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search notifications..."
                className="pl-8 w-64"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <TabsContent value="recent">
          <Card>
            <CardHeader>
              <CardTitle>Recent Notifications</CardTitle>
              <CardDescription>
                Notifications sent in the last 30 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {recentNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className="flex items-start justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-1 p-2 rounded-full bg-primary/10">
                          <Bell className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{notification.title}</h4>
                            <Badge variant="outline" className={getTypeBadgeColor(notification.type)}>
                              {notification.type}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {notification.recipients} recipients
                            </span>
                            <span>
                              {formatDistanceToNow(notification.sent_at, { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scheduled">
          <Card>
            <CardHeader>
              <CardTitle>Scheduled Notifications</CardTitle>
              <CardDescription>
                Notifications scheduled to be sent in the future
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Bell className="h-12 w-12 mb-4 opacity-50" />
                <p className="text-lg font-medium">No scheduled notifications</p>
                <p className="text-sm">Schedule a broadcast to send later</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <CardTitle>Notification Templates</CardTitle>
              <CardDescription>
                Save and reuse notification templates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Megaphone className="h-12 w-12 mb-4 opacity-50" />
                <p className="text-lg font-medium">No templates yet</p>
                <p className="text-sm">Create templates for frequently used notifications</p>
                <Button variant="outline" className="mt-4">
                  Create Template
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
