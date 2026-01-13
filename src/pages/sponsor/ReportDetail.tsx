import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import { SponsorLayout } from '@/components/layouts/SponsorLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, TrendingUp, Activity, Eye, Image } from 'lucide-react';

export default function ReportDetail() {
  const { reportId } = useParams();
  const navigate = useNavigate();
  const { reports, getChildById, getReportMedia } = useData();

  const report = reports.find((r) => r.id === reportId);
  const child = report ? getChildById(report.child_id) : null;
  const media = report ? getReportMedia(report.id) : [];

  if (!report || !child) {
    return (
      <SponsorLayout>
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-lg text-muted-foreground">Report not found</p>
          <Button className="mt-4" onClick={() => navigate(-1)}>
            Go Back
          </Button>
        </div>
      </SponsorLayout>
    );
  }

  const quarterLabels = {
    Q1: 'January - March',
    Q2: 'April - June',
    Q3: 'July - September',
    Q4: 'October - December',
  };

  return (
    <SponsorLayout>
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          className="gap-2"
          onClick={() => navigate(`/sponsor/children/${child.id}`)}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to {child.first_name}'s Profile
        </Button>

        {/* Report Header */}
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-r from-primary/20 via-primary/10 to-secondary/20 p-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border-2 border-background">
                <AvatarImage src={child.photo_url} />
                <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                  {child.first_name[0]}
                  {child.last_name[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold">
                  {report.quarter} {report.year} Progress Report
                </h1>
                <p className="text-muted-foreground">
                  {child.first_name} {child.last_name} • {child.grade}
                </p>
              </div>
            </div>
          </div>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{quarterLabels[report.quarter]} {report.year}</span>
            </div>
          </CardContent>
        </Card>

        {/* Growth Narrative */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Growth & Development
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="leading-relaxed text-foreground/90">
              {report.growth_narrative}
            </p>
          </CardContent>
        </Card>

        {/* Activities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-secondary" />
              Activities & Participation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="leading-relaxed text-foreground/90">{report.activities}</p>
          </CardContent>
        </Card>

        {/* Teacher Observations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-accent-foreground" />
              Teacher Observations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="leading-relaxed text-foreground/90">
              {report.teacher_observations}
            </p>
          </CardContent>
        </Card>

        {/* Media Gallery */}
        {media.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="h-5 w-5 text-primary" />
                Photos & Media
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                {media.map((item) => (
                  <div key={item.id} className="overflow-hidden rounded-lg">
                    <img
                      src={item.url}
                      alt={item.caption || 'Report media'}
                      className="aspect-[4/3] w-full object-cover transition-transform hover:scale-105"
                    />
                    {item.caption && (
                      <p className="mt-2 text-sm text-muted-foreground">
                        {item.caption}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </SponsorLayout>
  );
}
