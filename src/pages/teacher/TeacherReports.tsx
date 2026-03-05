import { useState } from 'react';
import { TeacherLayout } from '@/components/layouts/TeacherLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
  Edit,
  Eye,
  Send,
  Loader2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useChildren, useReports } from '@/hooks/useApi';
import { format } from 'date-fns';
import type { ProgressReport } from '@/types';

export default function TeacherReports() {
  const [yearFilter, setYearFilter] = useState<string>('2026');
  const [quarterFilter, setQuarterFilter] = useState<string>('all');

  const { data: childrenData, isLoading: childrenLoading } = useChildren();
  const { data: reportsData, isLoading: reportsLoading } = useReports();

  const allChildren = childrenData?.data || [];
  const allReports = reportsData?.data || [];

  const reports = allReports.filter(r => {
    if (yearFilter !== 'all' && r.year.toString() !== yearFilter) return false;
    if (quarterFilter !== 'all' && r.quarter !== quarterFilter) return false;
    return true;
  });

  const draftReports = reports.filter(r => r.status === 'draft');
  const pendingReports = reports.filter(r => r.status === 'pending_review');
  const needsRevisionReports = reports.filter(r => r.status === 'needs_revision');
  const approvedReports = reports.filter(r => r.status === 'approved' || r.status === 'published');

  const isLoading = childrenLoading || reportsLoading;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Draft</Badge>;
      case 'pending_review':
        return <Badge className="bg-blue-100 text-blue-700"><Clock className="h-3 w-3 mr-1" />Pending Review</Badge>;
      case 'needs_revision':
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Needs Revision</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-700"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'published':
        return <Badge className="bg-primary/10 text-primary"><CheckCircle className="h-3 w-3 mr-1" />Published</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const ReportCard = ({ report }: { report: ProgressReport }) => {
    const child = allChildren.find(c => c.id === report.child_id);
    
    return (
      <Card className={report.status === 'needs_revision' ? 'border-destructive/50' : ''}>
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={child?.photo_url} />
              <AvatarFallback>
                {child?.first_name?.charAt(0)}{child?.last_name?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-medium">
                  {child?.first_name} {child?.last_name}
                </h3>
                {getStatusBadge(report.status)}
              </div>
              <p className="text-sm text-muted-foreground">
                {report.quarter} {report.year} • {child?.grade}
              </p>
              
              {report.feedback && (
                <div className="mt-2 p-2 rounded bg-destructive/10 border border-destructive/20">
                  <p className="text-xs font-medium text-destructive">Feedback:</p>
                  <p className="text-xs text-destructive/80">{report.feedback}</p>
                </div>
              )}

              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                {report.growth_narrative}
              </p>

              <div className="flex items-center gap-2 mt-3">
                {report.status === 'draft' && (
                  <>
                    <Link to={`/dashboard/reports/${report.id}/edit`}>
                      <Button size="sm" variant="outline">
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                    </Link>
                    <Button size="sm">
                      <Send className="h-3 w-3 mr-1" />
                      Submit
                    </Button>
                  </>
                )}
                {report.status === 'needs_revision' && (
                  <Link to={`/dashboard/reports/${report.id}/edit`}>
                    <Button size="sm">
                      <Edit className="h-3 w-3 mr-1" />
                      Revise & Resubmit
                    </Button>
                  </Link>
                )}
                {(report.status === 'pending_review' || report.status === 'approved' || report.status === 'published') && (
                  <Button size="sm" variant="outline">
                    <Eye className="h-3 w-3 mr-1" />
                    View
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <TeacherLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </TeacherLayout>
    );
  }

  return (
    <TeacherLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Progress Reports</h1>
            <p className="text-muted-foreground">
              Create and manage quarterly progress reports
            </p>
          </div>
          <Link to="/teacher/reports/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Report
            </Button>
          </Link>
        </div>

        <div className="flex gap-4">
          <Select value={yearFilter} onValueChange={setYearFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Years</SelectItem>
              <SelectItem value="2026">2026</SelectItem>
              <SelectItem value="2025">2025</SelectItem>
              <SelectItem value="2024">2024</SelectItem>
            </SelectContent>
          </Select>
          <Select value={quarterFilter} onValueChange={setQuarterFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Quarter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Quarters</SelectItem>
              <SelectItem value="Q1">Q1</SelectItem>
              <SelectItem value="Q2">Q2</SelectItem>
              <SelectItem value="Q3">Q3</SelectItem>
              <SelectItem value="Q4">Q4</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Tabs defaultValue="action" className="space-y-4">
          <TabsList>
            <TabsTrigger value="action" className="gap-2">
              <AlertCircle className="h-4 w-4" />
              Needs Action ({draftReports.length + needsRevisionReports.length})
            </TabsTrigger>
            <TabsTrigger value="pending" className="gap-2">
              <Clock className="h-4 w-4" />
              Submitted ({pendingReports.length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="gap-2">
              <CheckCircle className="h-4 w-4" />
              Completed ({approvedReports.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="action" className="space-y-4">
            {needsRevisionReports.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-destructive flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Needs Revision
                </h3>
                {needsRevisionReports.map((report) => (
                  <ReportCard key={report.id} report={report} />
                ))}
              </div>
            )}
            
            {draftReports.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Drafts
                </h3>
                {draftReports.map((report) => (
                  <ReportCard key={report.id} report={report} />
                ))}
              </div>
            )}

            {draftReports.length === 0 && needsRevisionReports.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500 opacity-50" />
                  <p className="text-lg font-medium">All caught up!</p>
                  <p className="text-muted-foreground">No reports need your attention</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="pending" className="space-y-4">
            {pendingReports.length > 0 ? (
              pendingReports.map((report) => (
                <ReportCard key={report.id} report={report} />
              ))
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-lg font-medium">No pending reports</p>
                  <p className="text-muted-foreground">Reports you submit will appear here while awaiting review</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {approvedReports.length > 0 ? (
              approvedReports.map((report) => (
                <ReportCard key={report.id} report={report} />
              ))
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-lg font-medium">No completed reports</p>
                  <p className="text-muted-foreground">Approved and published reports will appear here</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </TeacherLayout>
  );
}
