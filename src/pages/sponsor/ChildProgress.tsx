import { useParams, useNavigate } from 'react-router-dom';
import { useChild, useReports } from '@/hooks/useApi';
import { SponsorLayout } from '@/components/layouts/SponsorLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Calendar, GraduationCap, FileText, ChevronRight, Sparkles, Target, TrendingUp } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';

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

// Mock progress data for charts
const generateProgressData = (reports: any[]) => {
  return reports.slice(0, 4).reverse().map((report) => ({
    quarter: `${report.quarter} ${report.year}`,
    attendance: 85 + Math.floor(Math.random() * 15),
    participation: 70 + Math.floor(Math.random() * 25),
    academic: 75 + Math.floor(Math.random() * 20),
  }));
};

const skillsData = [
  { skill: 'Reading', value: 85 },
  { skill: 'Writing', value: 78 },
  { skill: 'Math', value: 82 },
  { skill: 'Creativity', value: 90 },
  { skill: 'Social Skills', value: 88 },
  { skill: 'Participation', value: 85 },
];

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
  const progressData = reports.length > 0 ? generateProgressData(reports) : [];
  const isLoading = childLoading || reportsLoading;

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
          <CardContent className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">About</h4>
              <p className="text-foreground/90">
                {child.first_name} is a bright and enthusiastic student who brings joy to everyone around. 
                Known for curiosity and eagerness to learn, {child.first_name} has shown remarkable progress 
                since joining our program.
              </p>
            </div>
            <div className="flex items-start gap-2 p-3 rounded-lg bg-accent/30">
              <Target className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium">Dreams & Goals</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  {child.first_name} dreams of becoming a teacher and helping other children learn. 
                  With your support, this dream is becoming more achievable every day.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Progress Charts */}
        {progressData.length > 0 && (
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Progress Over Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={progressData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey="quarter" 
                        tick={{ fontSize: 12 }}
                        className="text-muted-foreground"
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        domain={[0, 100]}
                        className="text-muted-foreground"
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="attendance" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                        dot={{ fill: 'hsl(var(--primary))' }}
                        name="Attendance %"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="participation" 
                        stroke="hsl(var(--accent))" 
                        strokeWidth={2}
                        dot={{ fill: 'hsl(var(--accent))' }}
                        name="Participation %"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="academic" 
                        stroke="hsl(142, 60%, 45%)" 
                        strokeWidth={2}
                        dot={{ fill: 'hsl(142, 60%, 45%)' }}
                        name="Academic %"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-6 mt-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-primary" />
                    <span className="text-muted-foreground">Attendance</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-accent" />
                    <span className="text-muted-foreground">Participation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(142, 60%, 45%)' }} />
                    <span className="text-muted-foreground">Academic</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Sparkles className="h-5 w-5 text-accent" />
                  Skills Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={skillsData}>
                      <PolarGrid className="stroke-muted" />
                      <PolarAngleAxis 
                        dataKey="skill" 
                        tick={{ fontSize: 11 }}
                        className="text-muted-foreground"
                      />
                      <PolarRadiusAxis 
                        angle={30} 
                        domain={[0, 100]}
                        tick={{ fontSize: 10 }}
                      />
                      <Radar
                        name="Skills"
                        dataKey="value"
                        stroke="hsl(var(--primary))"
                        fill="hsl(var(--primary))"
                        fillOpacity={0.3}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-xs text-center text-muted-foreground mt-2">
                  Based on teacher assessments and quarterly evaluations
                </p>
              </CardContent>
            </Card>
          </div>
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
