import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { SponsorLayout } from '@/components/layouts/SponsorLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Users, Clock, FileText, Heart } from 'lucide-react';
import { calculateAge } from '@/data/mockData';

export default function SponsorHome() {
  const { user } = useAuth();
  const { getChildrenForSponsor, getReportsForChild } = useData();
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
                    <p className="mt-3 text-sm text-muted-foreground">
                      {reports.length} quarterly {reports.length === 1 ? 'report' : 'reports'} available
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </SponsorLayout>
  );
}
