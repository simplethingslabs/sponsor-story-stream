import { useParams, useNavigate } from 'react-router-dom';
import { useChild, useReports } from '@/hooks/useApi';
import { SponsorLayout } from '@/components/layouts/SponsorLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Calendar, GraduationCap, FileText, ChevronRight, Sparkles, TrendingUp } from 'lucide-react';

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


export default function ChildProgress() {
  const { childId } = useParams();
  const navigate = useNavigate();
  
  // Use real API hooks
  const { data: child, isLoading: childLoading } = useChild(childId || '');
  const { data: reportsData, isLoading: reportsLoading } = useReports({ 
    child_id: childId,
    status: 'published',
  });

  const reports = reportsData?.data || [];
  const isLoading = childLoading || reportsLoading;

  // Most recent published report — used for the highlight card
  const latestReport = reports.length > 0
    ? [...reports].sort((a, b) =>
        new Date(b.published_at || b.created_at).getTime() -
        new Date(a.published_at || a.created_at).getTime()
      )[0]
    : null;

  if (isLoading) {
    return (
      <SponsorLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-64 w-full" />
          <div className="grid gap-6 lg:grid-cols-2">
            <Skeleton className="h-80" />
            <Skeleton className="h-80" />
          </div>
        </div>
      </SponsorLayout>
    );
  }

  if (!child) {
    return (
      <SponsorLayout>
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-lg text-muted-foreground">Child not found</p>
          <Button className="mt-4" onClick={() => navigate('/sponsor/children')}>
            Go Back
          </Button>
        </div>
      </SponsorLayout>
    );
  }

  // Group reports by year
  const reportsByYear = reports.reduce((acc, report) => {
    if (!acc[report.year]) {
      acc[report.year] = [];
    }
    acc[report.year].push(report);
    return acc;
  }, {} as Record<number, typeof reports>);

  const years = Object.keys(reportsByYear)
    .map(Number)
    .sort((a, b) => b - a);

  return (
    <SponsorLayout>
      <div className="space-y-6">
        <Button
          variant="ghost"
          className="gap-2"
          onClick={() => navigate('/sponsor/children')}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Children
        </Button>

        {/* Child Profile Header */}
        <Card className="overflow-hidden">
          <div className="relative h-32 bg-gradient-to-r from-primary/20 via-primary/10 to-secondary/20" />
          <CardContent className="relative pb-6">
            <Avatar className="absolute -top-12 left-6 h-24 w-24 border-4 border-background">
              <AvatarImage src={child.photo_url} />
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                {child.first_name[0]}
                {child.last_name[0]}
              </AvatarFallback>
            </Avatar>
            <div className="ml-0 pt-14 sm:ml-32 sm:pt-0">
              <h1 className="text-2xl font-bold">
                {child.first_name} {child.last_name}
              </h1>
              <div className="mt-2 flex flex-wrap gap-4 text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {calculateAge(child.date_of_birth)} years old
                </div>
                <div className="flex items-center gap-1">
                  <GraduationCap className="h-4 w-4" />
                  {child.grade}
                </div>
                <div className="flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  {reports.length} reports
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Meet the Child Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Meet {child.first_name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4 shrink-0" />
              <span>
                Enrolled{' '}
                {new Date(child.enrollment_date).toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <FileText className="h-4 w-4 shrink-0" />
              <span>
                {reports.length}{' '}
                {reports.length === 1 ? 'progress report' : 'progress reports'} published
              </span>
            </div>
            {reports.length === 0 && (
              <p className="text-sm text-muted-foreground italic pt-1">
                Quarterly progress reports from {child.first_name}'s teacher will appear here.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Latest Report Highlight */}
        {latestReport && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Latest Report Highlight
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {latestReport.quarter} {latestReport.year} — from {child.first_name}'s teacher
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {latestReport.growth_narrative && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">
                    Growth &amp; Progress
                  </h4>
                  <p className="text-foreground/90 leading-relaxed">
                    {latestReport.growth_narrative}
                  </p>
                </div>
              )}
              {latestReport.activities && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Activities</h4>
                  <p className="text-foreground/90 leading-relaxed">{latestReport.activities}</p>
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => navigate(`/sponsor/reports/${latestReport.id}`)}
              >
                <FileText className="h-4 w-4" />
                Read Full Report
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Progress Timeline */}
        <div>
          <h2 className="mb-4 text-xl font-semibold">Progress Timeline</h2>

          {reports.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground" />
                <p className="mt-4 text-lg font-medium">No reports yet</p>
                <p className="text-muted-foreground">
                  Progress reports will appear here when available
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {years.map((year) => (
                <div key={year}>
                  <h3 className="mb-3 text-lg font-medium text-muted-foreground">
                    {year}
                  </h3>
                  <div className="space-y-3">
                    {reportsByYear[year].map((report) => {
                      const isNew = (() => {
                        const thirtyDaysAgo = new Date();
                        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                        return new Date(report.published_at || report.created_at) > thirtyDaysAgo;
                      })();

                      return (
                        <Card
                          key={report.id}
                          className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
                          onClick={() => navigate(`/sponsor/reports/${report.id}`)}
                        >
                          <CardContent className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-4">
                              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                                <span className="text-lg font-bold text-primary">
                                  {report.quarter}
                                </span>
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">
                                    {report.quarter} {report.year} Report
                                  </span>
                                  {isNew && (
                                    <Badge variant="default" className="text-xs">
                                      New
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  Published {new Date(report.published_at || report.created_at).toLocaleDateString('en-US', {
                                    month: 'long',
                                    day: 'numeric',
                                    year: 'numeric',
                                  })}
                                </p>
                              </div>
                            </div>
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </SponsorLayout>
  );
}
