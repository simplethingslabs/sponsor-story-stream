import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, Heart, Bell, Share2, FileText, Calendar, ChevronRight } from 'lucide-react';

export default function SponsorDashboard() {
  const { user, logout } = useAuth();

  // Demo data for sponsored children
  const sponsoredChildren = [
    {
      id: '1',
      name: 'Ananya Sharma',
      age: 8,
      grade: 'Grade 3',
      photo: null,
      lastReport: 'Q4 2024',
      hasNewReport: true,
    },
    {
      id: '2',
      name: 'Ravi Kumar',
      age: 10,
      grade: 'Grade 5',
      photo: null,
      lastReport: 'Q4 2024',
      hasNewReport: false,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card shadow-soft">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary">
              <Heart className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-display font-bold text-primary">
              SponsorConnect
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center">
                2
              </span>
            </Button>
            <Button variant="ghost" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-foreground">
            Welcome back, {user?.full_name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            Thank you for making a difference in children's lives
          </p>
        </div>

        {/* Stats Summary */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="text-4xl font-bold text-primary">
                {sponsoredChildren.length}
              </div>
              <p className="text-muted-foreground">Children Sponsored</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
            <CardContent className="pt-6">
              <div className="text-4xl font-bold text-accent-foreground">8</div>
              <p className="text-muted-foreground">Quarters of Support</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-secondary to-secondary/50">
            <CardContent className="pt-6">
              <div className="text-4xl font-bold text-secondary-foreground">2</div>
              <p className="text-muted-foreground">New Reports Available</p>
            </CardContent>
          </Card>
        </div>

        {/* Children Grid */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-display font-semibold">Your Sponsored Children</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {sponsoredChildren.map((child) => (
              <Card
                key={child.id}
                className="shadow-soft hover:shadow-warm transition-shadow cursor-pointer group"
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-16 w-16 border-2 border-primary/20">
                      <AvatarImage src={child.photo || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
                        {child.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-lg">{child.name}</h3>
                          <p className="text-muted-foreground">
                            {child.age} years old • {child.grade}
                          </p>
                        </div>
                        {child.hasNewReport && (
                          <span className="px-2 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                            New Report
                          </span>
                        )}
                      </div>
                      <div className="mt-4 flex items-center gap-2">
                        <Button size="sm" className="flex-1">
                          View Progress
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Quick Links */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="shadow-soft hover:shadow-warm transition-shadow cursor-pointer">
            <CardHeader>
              <FileText className="h-8 w-8 text-primary mb-2" />
              <CardTitle className="text-lg">School Newsletters</CardTitle>
              <CardDescription>
                Read the latest updates from the school
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="shadow-soft hover:shadow-warm transition-shadow cursor-pointer">
            <CardHeader>
              <Calendar className="h-8 w-8 text-accent-foreground mb-2" />
              <CardTitle className="text-lg">Events & Activities</CardTitle>
              <CardDescription>
                See photos and videos from school events
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="shadow-soft hover:shadow-warm transition-shadow cursor-pointer">
            <CardHeader>
              <Share2 className="h-8 w-8 text-info mb-2" />
              <CardTitle className="text-lg">Invite a Friend</CardTitle>
              <CardDescription>
                Share the gift of sponsorship with others
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </main>
    </div>
  );
}
