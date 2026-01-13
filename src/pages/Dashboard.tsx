import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LogOut, Users, BookOpen, Calendar, FileText } from 'lucide-react';

export default function Dashboard() {
  const { user, logout, hasRole } = useAuth();

  // Redirect sponsors to their dedicated portal
  if (hasRole('sponsor') && !hasRole('admin') && !hasRole('super_admin') && !hasRole('teacher')) {
    return <Navigate to="/sponsor" replace />;
  }

  const stats = [
    { label: 'Total Children', value: '156', icon: Users, color: 'text-primary' },
    { label: 'Active Sponsors', value: '89', icon: BookOpen, color: 'text-accent-foreground' },
    { label: 'Pending Reports', value: '12', icon: FileText, color: 'text-warning' },
    { label: 'Upcoming Events', value: '3', icon: Calendar, color: 'text-info' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container flex h-16 items-center justify-between">
          <h1 className="text-xl font-display font-bold text-primary">
            SponsorConnect Admin
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Welcome, {user?.full_name}
            </span>
            <Button variant="ghost" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-display font-bold text-foreground">
            Dashboard
          </h2>
          <p className="text-muted-foreground">
            Overview of school sponsorship program
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {stats.map((stat) => (
            <Card key={stat.label} className="shadow-soft">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks for managing the sponsorship program
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <Button className="h-auto flex-col py-6 gap-2">
              <Users className="h-6 w-6" />
              <span>Add New Child</span>
            </Button>
            <Button variant="secondary" className="h-auto flex-col py-6 gap-2">
              <FileText className="h-6 w-6" />
              <span>Create Report</span>
            </Button>
            <Button variant="outline" className="h-auto flex-col py-6 gap-2">
              <Calendar className="h-6 w-6" />
              <span>Add Event</span>
            </Button>
          </CardContent>
        </Card>

        {/* Role-based info */}
        <div className="mt-8 rounded-lg bg-muted/50 p-6">
          <h3 className="font-semibold mb-2">Your Roles</h3>
          <div className="flex gap-2">
            {user?.roles.map((role) => (
              <span
                key={role}
                className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium"
              >
                {role.replace('_', ' ')}
              </span>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
