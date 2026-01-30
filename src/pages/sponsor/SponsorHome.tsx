import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { SponsorLayout } from '@/components/layouts/SponsorLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Clock, FileText, Heart, Calendar, ArrowRight, Sparkles } from 'lucide-react';
import { calculateAge } from '@/data/mockData';

export default function SponsorHome() {
  const { user } = useAuth();
  const { getChildrenForSponsor, getReportsForChild, events, getEventMedia } = useData();
  const navigate = useNavigate();

  // Use demo sponsor ID for now
  const sponsorId = 'sponsor-1';
  const sponsoredChildren = getChildrenForSponsor(sponsorId);

  // Calculate stats
  const totalQuarters = sponsoredChildren.reduce((acc, child) => {
    return acc + getReportsForChild(child.id).length;
  }, 0);

  const newReportsCount = sponsoredChildren.filter((child) => {
    const reports = getReportsForChild(child.id);
    if (reports.length === 0) return false;
    const latestReport = reports[0];
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return new Date(latestReport.published_at || latestReport.created_at) > thirtyDaysAgo;
  }).length;

  // Get recent events (last 3)
  const recentEvents = events.slice(0, 3);

  const stats = [
    {
      label: 'Children Sponsored',
      value: sponsoredChildren.length,
      icon: Users,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: 'Quarters of Support',
      value: totalQuarters,
      icon: Clock,
      color: 'text-secondary',
      bgColor: 'bg-secondary/10',
    },
    {
      label: 'New Reports',
      value: newReportsCount,
      icon: FileText,
      color: 'text-accent-foreground',
      bgColor: 'bg-accent',
    },
  ];

  return (
    <SponsorLayout>
      <div className="space-y-8">
        {/* Welcome Header */}
        <div className="rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 lg:p-8">
          <div className="flex items-center gap-3">
            <Heart className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-foreground lg:text-3xl">
                Welcome back, {user?.full_name?.split(' ')[0]}!
              </h1>
              <p className="mt-1 text-muted-foreground">
                Thank you for making a difference in these children's lives.
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          {stats.map((stat) => (
            <Card key={stat.label}>
              <CardContent className="flex items-center gap-4 p-6">
                <div className={`rounded-xl p-3 ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Sponsored Children */}
        <div>
          <h2 className="mb-4 text-xl font-semibold">Your Sponsored Children</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sponsoredChildren.map((child) => {
              const reports = getReportsForChild(child.id);
              const hasNewReport = reports.length > 0 && (() => {
                const latestReport = reports[0];
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                return new Date(latestReport.published_at || latestReport.created_at) > thirtyDaysAgo;
              })();

              return (
                <Card
                  key={child.id}
                  className="cursor-pointer overflow-hidden transition-shadow hover:shadow-lg"
                  onClick={() => navigate(`/sponsor/children/${child.id}`)}
                >
                  <div className="relative">
                    <div className="aspect-[4/3] overflow-hidden">
                      <img
                        src={child.photo_url || '/placeholder.svg'}
                        alt={`${child.first_name} ${child.last_name}`}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    {hasNewReport && (
                      <Badge className="absolute right-3 top-3 bg-primary">
                        New Report
                      </Badge>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border-2 border-primary/20">
                        <AvatarImage src={child.photo_url} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {child.first_name[0]}
                          {child.last_name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold">
                          {child.first_name} {child.last_name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {calculateAge(child.date_of_birth)} years • {child.grade}
                        </p>
                      </div>
                    </div>
                    
                    {/* Meet the child intro */}
                    <div className="mt-3 p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-1 text-xs font-medium text-primary mb-1">
                        <Sparkles className="h-3 w-3" />
                        Meet {child.first_name}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {child.first_name} is a bright and curious student who loves learning new things every day.
                      </p>
                    </div>
                    
                    <p className="mt-3 text-sm text-muted-foreground">
                      {reports.length} quarterly {reports.length === 1 ? 'report' : 'reports'} available
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* School Updates Feed */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">School Updates</h2>
            <Button variant="ghost" size="sm" onClick={() => navigate('/sponsor/events')}>
              View All
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
          
          {recentEvents.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Calendar className="h-10 w-10 text-muted-foreground" />
                <p className="mt-3 text-muted-foreground">No recent updates</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {recentEvents.map((event) => {
                const media = getEventMedia(event.id);
                const firstImage = media.find(m => m.type === 'image');
                
                return (
                  <Card 
                    key={event.id} 
                    className="cursor-pointer transition-shadow hover:shadow-md"
                    onClick={() => navigate('/sponsor/events')}
                  >
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        {firstImage && (
                          <div className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden">
                            <img
                              src={firstImage.url}
                              alt={event.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(event.event_date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </div>
                          <h3 className="font-semibold truncate">{event.title}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                            {event.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </SponsorLayout>
  );
}
