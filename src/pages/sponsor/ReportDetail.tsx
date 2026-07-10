import { useParams, useNavigate } from 'react-router-dom';
import { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { useReport, useChild } from '@/hooks/useApi';
import { useAuth } from '@/contexts/AuthContext';
import { SponsorLayout } from '@/components/layouts/SponsorLayout';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Calendar, TrendingUp, Activity, Eye, Image, Download } from 'lucide-react';

export default function ReportDetail() {
  const { reportId, id } = useParams();
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);
  const { hasAnyRole } = useAuth();
  const isAdmin = hasAnyRole(['super_admin', 'admin', 'teacher']);
  const Layout = isAdmin ? AdminLayout : SponsorLayout;

  // Use real API hooks
  const { data: report, isLoading: reportLoading } = useReport(reportId || id || '');
  const { data: child, isLoading: childLoading } = useChild(report?.child_id || '');

  const isLoading = reportLoading || (report && childLoading);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: report && child 
      ? `${child.first_name}_${child.last_name}_${report.quarter}_${report.year}_Report`
      : 'Progress_Report',
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="mx-auto max-w-3xl space-y-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </Layout>
    );
  }

  if (!report || !child) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-lg text-muted-foreground">Report not found</p>
          <Button className="mt-4" onClick={() => navigate(-1)}>
            Go Back
          </Button>
        </div>
      </Layout>
    );
  }

  const quarterLabels = {
    Q1: 'January - March',
    Q2: 'April - June',
    Q3: 'July - September',
    Q4: 'October - December',
  };

  return (
    <Layout>
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Action Bar */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            className="gap-2"
            onClick={() =>
              isAdmin ? navigate('/dashboard/reports') : navigate(`/sponsor/children/${child.id}`)
            }
          >
            <ArrowLeft className="h-4 w-4" />
            {isAdmin ? 'Back to Reports' : `Back to ${child.first_name}'s Profile`}
          </Button>
          
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => handlePrint()}
          >
            <Download className="h-4 w-4" />
            Download PDF
          </Button>
        </div>

        {/* Printable Content */}
        <div ref={printRef} className="space-y-6 print:p-8">
          {/* Print Header - only shows in print */}
          <div className="hidden print:block print:mb-8 print:border-b print:pb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl font-bold text-primary">AVPSponsorConnect</span>
            </div>
            <p className="text-sm text-muted-foreground">Quarterly Progress Report</p>
          </div>

          {/* Report Header */}
          <Card className="overflow-hidden print:shadow-none print:border-2">
            <div className="bg-gradient-to-r from-primary/20 via-primary/10 to-secondary/20 p-6 print:bg-primary/10">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 border-2 border-background print:border-primary/20">
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
          <Card className="print:shadow-none print:border">
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
          <Card className="print:shadow-none print:border">
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
          <Card className="print:shadow-none print:border">
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

          {/* Print Footer - only shows in print */}
          <div className="hidden print:block print:mt-12 print:pt-4 print:border-t print:text-center print:text-sm print:text-muted-foreground">
            <p>Generated from AVPSponsorConnect • {new Date().toLocaleDateString()}</p>
            <p className="mt-1">Thank you for your continued support!</p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
