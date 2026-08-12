import { useParams, useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Cake, GraduationCap, CalendarDays, Users, FileText, Edit } from 'lucide-react';
import { useChild, useSponsorships, useSponsors, useReports } from '@/hooks/useApi';

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

export default function ChildDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: child, isLoading: childLoading } = useChild(id || '');
  const { data: sponsorshipsData, isLoading: sponsorshipsLoading } = useSponsorships({ child_id: id });
  const { data: sponsorsData, isLoading: sponsorsLoading } = useSponsors();
  const { data: reportsData, isLoading: reportsLoading } = useReports({ child_id: id });

  const sponsorships = sponsorshipsData?.data || [];
  const sponsors = sponsorsData?.data || [];
  const reports = reportsData?.data || [];

  const activeSponsors = sponsorships
    .filter((s) => s.status === 'active')
    .map((s) => sponsors.find((sp) => sp.id === s.sponsor_id))
    .filter((sp): sp is NonNullable<typeof sp> => Boolean(sp));

  const isLoading = childLoading || sponsorshipsLoading || sponsorsLoading || reportsLoading;

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid gap-6 lg:grid-cols-3">
            <Skeleton className="h-96" />
            <Skeleton className="h-96 lg:col-span-2" />
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!child) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground">Child not found</p>
          <Button onClick={() => navigate('/dashboard/children')} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Children
          </Button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/children')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">Child Details</h1>
            <p className="text-muted-foreground">View child information and progress</p>
          </div>
          <Button onClick={() => navigate(`/dashboard/children/${child.id}/edit`)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Child Profile Card */}
          <Card className="lg:col-span-1">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={child.photo_url} />
                  <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                    {child.first_name[0]}
                    {child.last_name[0]}
                  </AvatarFallback>
                </Avatar>
                <h2 className="mt-4 text-xl font-semibold">
                  {child.first_name} {child.last_name}
                </h2>
                <Badge className="mt-2" variant={child.status === 'active' ? 'default' : 'secondary'}>
                  {child.status}
                </Badge>

                <div className="mt-6 w-full space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <Cake className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {calculateAge(child.date_of_birth)} years old • Born{' '}
                      {new Date(child.date_of_birth).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <GraduationCap className="h-4 w-4 text-muted-foreground" />
                    <span>Grade {child.grade}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                    <span>Enrolled {new Date(child.enrollment_date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {activeSponsors.length} active{' '}
                      {activeSponsors.length === 1 ? 'sponsor' : 'sponsors'}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sponsors */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Sponsors</CardTitle>
            </CardHeader>
            <CardContent>
              {activeSponsors.length === 0 ? (
                <p className="py-8 text-center text-muted-foreground">
                  No active sponsors for this child.
                </p>
              ) : (
                <div className="space-y-4">
                  {activeSponsors.map((sponsor) => (
                    <div
                      key={sponsor.id}
                      className="flex items-center gap-4 rounded-lg border p-4 cursor-pointer hover:bg-accent"
                      onClick={() => navigate(`/dashboard/sponsors/${sponsor.id}`)}
                    >
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={sponsor.avatar_url} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {sponsor.full_name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium">{sponsor.full_name}</p>
                        <p className="text-sm text-muted-foreground">{sponsor.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Progress Reports */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Progress Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            {reports.length === 0 ? (
              <p className="py-4 text-center text-muted-foreground">No progress reports yet.</p>
            ) : (
              <div className="space-y-2">
                {reports.map((report) => (
                  <div
                    key={report.id}
                    className="flex items-center justify-between rounded-lg border p-3 cursor-pointer hover:bg-accent"
                    onClick={() => navigate(`/dashboard/reports/${report.id}`)}
                  >
                    <div>
                      <p className="font-medium">
                        {report.quarter} {report.year}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(report.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant={report.status === 'published' ? 'default' : 'secondary'}>
                      {report.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
