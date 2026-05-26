import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useMyChildren, useSponsorStats, useEvents } from '@/hooks/useApi';
import { SponsorLayout } from '@/components/layouts/SponsorLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Clock, FileText, Heart, Calendar, ArrowRight, Sparkles } from 'lucide-react';

function calculateAge(dateOfBirth: string): number {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

export default function SponsorHome() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Use real API hooks
  const { data: childrenData, isLoading: childrenLoading } = useMyChildren();
  const { data: statsData, isLoading: statsLoading } = useSponsorStats();
  const { data: eventsData, isLoading: eventsLoading } = useEvents({ limit: '3' });

  const sponsoredChildren = childrenData?.data || [];
  const recentEvents = eventsData?.data || [];

  // Stats from API — field names match the backend GET /sponsors/stats response.
  // total_reports  = total published quarterly reports (≈ quarters of support)
  // recent_reports = reports published in the last 30 days (= "new reports")
  const totalQuarters = statsData?.total_reports ?? 0;
  const newReportsCount = statsData?.recent_reports ?? 0;

  const isLoading = childrenLoading || statsLoading;

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
                  {isLoading ? (
                    <Skeleton className="h-8 w-12" />
                  ) : (
                    <p className="text-2xl font-bold">{stat.value}</p>
                  )}
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Sponsored Children */}
        <div>
          <h2 className="mb-4 text-xl font-semibold">Your Sponsored Children</h2>
          {childrenLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-64 w-full" />
              ))}
            </div>
          ) : sponsoredChildren.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="h-12 w-12 text-muted-foreground" />
                <p className="mt-4 text-lg font-medium">No children sponsored yet</p>
                <p className="text-muted-foreground">
                  Contact the school to sponsor a child
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sponsoredChildren.map((child) => {
                const hasNewReport = false; // Will be calculated from reports

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
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
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
          
          {eventsLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : recentEvents.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Calendar className="h-10 w-10 text-muted-foreground" />
                <p className="mt-3 text-muted-foreground">No recent updates</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {recentEvents.map((event) => (
                <Card 
                  key={event.id} 
                  className="cursor-pointer transition-shadow hover:shadow-md"
                  onClick={() => navigate('/sponsor/events')}
                >
                  <CardContent className="p-4">
                    <div className="flex gap-4">
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
              ))}
            </div>
          )}
        </div>
      </div>
    </SponsorLayout>
  );
}
