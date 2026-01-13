import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import { SponsorLayout } from '@/components/layouts/SponsorLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, GraduationCap, FileText, ChevronRight } from 'lucide-react';
import { calculateAge } from '@/data/mockData';

export default function ChildProgress() {
  const { childId } = useParams();
  const navigate = useNavigate();
  const { getChildById, getReportsForChild } = useData();

  const child = getChildById(childId || '');
  const reports = getReportsForChild(childId || '');

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
        {/* Back Button */}
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
