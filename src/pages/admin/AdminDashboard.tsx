import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useChildren, useReports, useEvents } from '@/hooks/useApi';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, FileText, Newspaper, Calendar, Plus, TrendingUp, Clock } from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Use real API hooks instead of mock data
  const { data: childrenData, isLoading: childrenLoading } = useChildren();
  const { data: reportsData, isLoading: reportsLoading } = useReports();
  const { data: eventsData, isLoading: eventsLoading } = useEvents();

  const children = childrenData?.data || [];
  const reports = reportsData?.data || [];
  const events = eventsData?.data || [];

  const pendingReports = reports.filter(r => r.status === 'draft' || r.status === 'pending_review').length;
  const publishedReports = reports.filter(r => r.status === 'published').length;
  const activeChildren = children.filter(c => c.status === 'active').length;

  const isLoading = childrenLoading || reportsLoading || eventsLoading;

  const stats = [
    {
      title: 'Total Children',
      value: activeChildren,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Published Reports',
      value: publishedReports,
      icon: FileText,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Pending Reports',
      value: pendingReports,
      icon: Clock,
      color: 'text-amber-600',
      bgColor: 'bg-amber-100',
    },
    {
      title: 'School Events',
      value: events.length,
      icon: Calendar,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
  ];

  const quickActions = [
    { label: 'Add Child', icon: Users, href: '/dashboard/children/new' },
    { label: 'Create Report', icon: FileText, href: '/dashboard/reports/new' },
    { label: 'Upload Newsletter', icon: Newspaper, href: '/dashboard/newsletters/new' },
    { label: 'Add Event', icon: Calendar, href: '/dashboard/events/new' },
  ];

  // Recent activity (last 5 reports)
  const recentReports = [...reports]
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 5);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground lg:text-3xl">
            Welcome back, {user?.full_name?.split(' ')[0]}!
          </h1>
          <p className="mt-1 text-muted-foreground">
            Here's what's happening with your school today.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardContent className="flex items-center gap-4 p-6">
                <div className={`rounded-lg p-3 ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  {isLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <p className="text-2xl font-bold">{stat.value}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions & Recent Activity */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {quickActions.map((action) => (
                  <Button
                    key={action.label}
                    variant="outline"
                    className="h-auto flex-col gap-2 py-4"
                    onClick={() => navigate(action.href)}
                  >
                    <action.icon className="h-5 w-5" />
                    <span className="text-sm">{action.label}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Recent Reports
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {reportsLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))
                ) : recentReports.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">
                    No reports yet
                  </p>
                ) : (
                  recentReports.map((report) => {
                    const child = children.find(c => c.id === report.child_id);
                    return (
                      <div
                        key={report.id}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div>
                          <p className="font-medium">
                            {child?.first_name} {child?.last_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {report.quarter} {report.year}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-medium ${
                            report.status === 'published'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {report.status}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
