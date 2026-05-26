import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  Send,
  Eye,
  MessageSquare,
  Image,
  Loader2,
  RotateCcw,
  Users,
} from 'lucide-react';
import { useReports, useChildren, useApproveReport, useRequestRevision, usePublishReport } from '@/hooks/useApi';
import { useToast } from '@/hooks/use-toast';
import type { ProgressReport, ReportStatus } from '@/types';

// Quality indicators
const getQualityScore = (report: ProgressReport) => {
  let score = 0;
  const wordCount = (report.growth_narrative?.split(/\s+/).length || 0) +
    (report.activities?.split(/\s+/).length || 0) +
    (report.teacher_observations?.split(/\s+/).length || 0);
  
  if (wordCount >= 200) score += 40;
  else if (wordCount >= 100) score += 30;
  else if (wordCount >= 50) score += 20;
  else score += 10;
  
  const mediaCount = report.media_count || 0;
  if (mediaCount >= 3) score += 30;
  else if (mediaCount >= 2) score += 20;
  else if (mediaCount >= 1) score += 15;
  
  if (report.growth_narrative && report.growth_narrative.length > 20) score += 10;
  if (report.activities && report.activities.length > 20) score += 10;
  if (report.teacher_observations && report.teacher_observations.length > 20) score += 10;
  
  return Math.min(score, 100);
};

const getQualityLabel = (score: number) => {
  if (score >= 80) return { label: 'Excellent', color: 'text-green-600' };
  if (score >= 60) return { label: 'Good', color: 'text-blue-600' };
  if (score >= 40) return { label: 'Fair', color: 'text-yellow-600' };
  return { label: 'Needs Work', color: 'text-red-600' };
};

const statusConfig: Record<ReportStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  draft: { label: 'Draft', variant: 'secondary' },
  pending_review: { label: 'Pending Review', variant: 'outline' },
  needs_revision: { label: 'Needs Revision', variant: 'destructive' },
  approved: { label: 'Approved', variant: 'default' },
  published: { label: 'Published', variant: 'default' },
};

export default function ReportReview() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Use real API hooks
  const { data: reportsData, isLoading: reportsLoading } = useReports();
  const { data: childrenData, isLoading: childrenLoading } = useChildren();
  const approveReport = useApproveReport();
  const requestRevision = useRequestRevision();
  const publishReport = usePublishReport();
  
  const reports = reportsData?.data || [];
  const children = childrenData?.data || [];
  
  const [selectedReports, setSelectedReports] = useState<string[]>([]);
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [currentReport, setCurrentReport] = useState<ProgressReport | null>(null);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');

  const getChildById = (childId: string) => children.find(c => c.id === childId);

  // Filter reports by status
  const pendingReports = useMemo(() => 
    reports.filter(r => r.status === 'pending_review' || r.status === 'draft'),
    [reports]
  );
  
  const revisionReports = useMemo(() => 
    reports.filter(r => r.status === 'needs_revision'),
    [reports]
  );
  
  const approvedReports = useMemo(() => 
    reports.filter(r => r.status === 'approved'),
    [reports]
  );

  const currentQuarter = useMemo(() => {
    const month = new Date().getMonth();
    if (month < 3) return 'Q1';
    if (month < 6) return 'Q2';
    if (month < 9) return 'Q3';
    return 'Q4';
  }, []);
  
  const currentYear = new Date().getFullYear();

  const submissionStats = useMemo(() => {
    const totalChildren = children.filter(c => c.status === 'active').length;
    const submittedThisQuarter = reports.filter(
      r => r.quarter === currentQuarter && r.year === currentYear && r.status !== 'draft'
    ).length;
    return {
      total: totalChildren,
      submitted: submittedThisQuarter,
      pending: totalChildren - submittedThisQuarter,
    };
  }, [children, reports, currentQuarter, currentYear]);

  const handleSelectReport = (reportId: string, checked: boolean) => {
    if (checked) {
      setSelectedReports(prev => [...prev, reportId]);
    } else {
      setSelectedReports(prev => prev.filter(id => id !== reportId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedReports(pendingReports.map(r => r.id));
    } else {
      setSelectedReports([]);
    }
  };

  const handleApprove = async (reportId: string) => {
    setIsSubmitting(true);
    try {
      await approveReport.mutateAsync(reportId);
      toast({ title: 'Report approved', description: 'The report is ready for publishing.' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to approve report', variant: 'destructive' });
    }
    setIsSubmitting(false);
  };

  const handleBulkApprove = async () => {
    setIsSubmitting(true);
    try {
      await Promise.all(
        selectedReports.map(reportId => approveReport.mutateAsync(reportId))
      );
      toast({ 
        title: 'Reports approved', 
        description: `${selectedReports.length} reports have been approved.` 
      });
      setSelectedReports([]);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to approve reports', variant: 'destructive' });
    }
    setIsSubmitting(false);
  };

  const handleBulkPublish = async () => {
    setIsSubmitting(true);
    try {
      await Promise.all(
        selectedReports.map(reportId =>
          publishReport.mutateAsync({ id: reportId })
        )
      );
      toast({ 
        title: 'Reports published', 
        description: `${selectedReports.length} reports have been published.` 
      });
      setSelectedReports([]);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to publish reports', variant: 'destructive' });
    }
    setIsSubmitting(false);
  };

  const handleRequestRevision = async () => {
    if (!currentReport || !feedback.trim()) return;

    setIsSubmitting(true);
    try {
      await requestRevision.mutateAsync({ id: currentReport.id, feedback });
      toast({ 
        title: 'Revision requested', 
        description: 'Teacher has been notified to improve the report.' 
      });
      setFeedbackDialogOpen(false);
      setFeedback('');
      setCurrentReport(null);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to request revision', variant: 'destructive' });
    }
    setIsSubmitting(false);
  };

  const openFeedbackDialog = (report: ProgressReport) => {
    setCurrentReport(report);
    setFeedback(report.feedback || '');
    setFeedbackDialogOpen(true);
  };

  const openPreviewDialog = (report: ProgressReport) => {
    setCurrentReport(report);
    setPreviewDialogOpen(true);
  };

  const isLoading = reportsLoading || childrenLoading;

  const renderReportCard = (report: ProgressReport) => {
    const child = getChildById(report.child_id);
    const qualityScore = getQualityScore(report);
    const quality = getQualityLabel(qualityScore);
    const wordCount = (report.growth_narrative?.split(/\s+/).length || 0) +
      (report.activities?.split(/\s+/).length || 0) +
      (report.teacher_observations?.split(/\s+/).length || 0);
    const status = statusConfig[report.status] || statusConfig.draft;

    return (
      <Card key={report.id} className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            {(report.status === 'pending_review' || report.status === 'draft') && (
              <Checkbox
                checked={selectedReports.includes(report.id)}
                onCheckedChange={(checked) => handleSelectReport(report.id, !!checked)}
                className="mt-1"
              />
            )}
            
            <Avatar className="h-12 w-12 flex-shrink-0">
              <AvatarImage src={child?.photo_url} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {child?.first_name?.[0]}{child?.last_name?.[0]}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-medium">
                  {child?.first_name} {child?.last_name}
                </h3>
                <Badge variant={status.variant}>{status.label}</Badge>
                <Badge variant="outline">{report.quarter} {report.year}</Badge>
              </div>
              
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <FileText className="h-3.5 w-3.5" />
                  {wordCount} words
                </span>
                <span className="flex items-center gap-1">
                  <Image className="h-3.5 w-3.5" />
                  {report.media_count || 0} media
                </span>
                <span className={`flex items-center gap-1 ${quality.color}`}>
                  {qualityScore >= 60 ? (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  ) : (
                    <AlertCircle className="h-3.5 w-3.5" />
                  )}
                  {quality.label} ({qualityScore}%)
                </span>
              </div>

              <div className="mt-2">
                <Progress value={qualityScore} className="h-1.5" />
              </div>

              {report.feedback && (
                <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded text-sm">
                  <span className="font-medium text-yellow-700 dark:text-yellow-400">Feedback: </span>
                  <span className="text-yellow-600 dark:text-yellow-300">{report.feedback}</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => openPreviewDialog(report)}
              >
                <Eye className="h-4 w-4" />
              </Button>
              
              {report.status !== 'published' && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openFeedbackDialog(report)}
                  >
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                  
                  {(report.status === 'pending_review' || report.status === 'draft') && (
                    <Button
                      size="sm"
                      onClick={() => handleApprove(report.id)}
                      disabled={isSubmitting}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                  )}
                  
                  {report.status === 'approved' && (
                    <Button
                      size="sm"
                      onClick={() => publishReport.mutateAsync({ id: report.id })}
                    >
                      <Send className="h-4 w-4 mr-1" />
                      Publish
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Report Review</h1>
          <p className="text-muted-foreground">
            Review and approve quarterly progress reports before publishing
          </p>
        </div>

        {/* Submission Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="rounded-full bg-primary/10 p-3">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{currentQuarter} {currentYear} Progress</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-2xl font-bold">
                    {submissionStats.submitted}/{submissionStats.total}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="rounded-full bg-yellow-100 dark:bg-yellow-900/30 p-3">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Review</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-12" />
                ) : (
                  <p className="text-2xl font-bold">{pendingReports.length}</p>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="rounded-full bg-red-100 dark:bg-red-900/30 p-3">
                <RotateCcw className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Needs Revision</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-12" />
                ) : (
                  <p className="text-2xl font-bold">{revisionReports.length}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bulk Actions */}
        {selectedReports.length > 0 && (
          <Card className="border-primary/50 bg-primary/5">
            <CardContent className="flex items-center justify-between p-4">
              <span className="text-sm font-medium">
                {selectedReports.length} report(s) selected
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedReports([])}
                >
                  Clear Selection
                </Button>
                <Button
                  size="sm"
                  onClick={handleBulkApprove}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                  )}
                  Approve Selected
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="pending" className="gap-2">
              <Clock className="h-4 w-4" />
              Pending ({pendingReports.length})
            </TabsTrigger>
            <TabsTrigger value="revision" className="gap-2">
              <RotateCcw className="h-4 w-4" />
              Needs Revision ({revisionReports.length})
            </TabsTrigger>
            <TabsTrigger value="approved" className="gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Approved ({approvedReports.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-3 mt-4">
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-32 w-full" />
                ))}
              </div>
            ) : pendingReports.length > 0 ? (
              <>
                <div className="flex items-center gap-2 pb-2">
                  <Checkbox
                    checked={selectedReports.length === pendingReports.length && pendingReports.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                  <span className="text-sm text-muted-foreground">Select all</span>
                </div>
                {pendingReports.map(renderReportCard)}
              </>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <CheckCircle2 className="h-12 w-12 text-green-500" />
                  <p className="mt-4 text-lg font-medium">All caught up!</p>
                  <p className="text-muted-foreground">No reports pending review</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="revision" className="space-y-3 mt-4">
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 2 }).map((_, i) => (
                  <Skeleton key={i} className="h-32 w-full" />
                ))}
              </div>
            ) : revisionReports.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <CheckCircle2 className="h-12 w-12 text-muted-foreground" />
                  <p className="mt-4 text-lg font-medium">No reports need revision</p>
                </CardContent>
              </Card>
            ) : (
              revisionReports.map(renderReportCard)
            )}
          </TabsContent>

          <TabsContent value="approved" className="space-y-3 mt-4">
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 2 }).map((_, i) => (
                  <Skeleton key={i} className="h-32 w-full" />
                ))}
              </div>
            ) : (
              <>
                {approvedReports.length > 0 && (
                  <Card className="border-green-200 bg-green-50 dark:bg-green-900/20">
                    <CardContent className="flex items-center justify-between p-4">
                      <span className="text-sm font-medium text-green-700 dark:text-green-400">
                        {approvedReports.length} report(s) ready to publish
                      </span>
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedReports(approvedReports.map(r => r.id));
                          handleBulkPublish();
                        }}
                        disabled={isSubmitting}
                      >
                        <Send className="h-4 w-4 mr-1" />
                        Publish All
                      </Button>
                    </CardContent>
                  </Card>
                )}
                {approvedReports.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <FileText className="h-12 w-12 text-muted-foreground" />
                      <p className="mt-4 text-lg font-medium">No approved reports</p>
                      <p className="text-muted-foreground">Approve reports from the Pending tab</p>
                    </CardContent>
                  </Card>
                ) : (
                  approvedReports.map(renderReportCard)
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Feedback Dialog */}
      <Dialog open={feedbackDialogOpen} onOpenChange={setFeedbackDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Revision</DialogTitle>
            <DialogDescription>
              Provide feedback for the teacher to improve this report.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Enter your feedback for the teacher..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setFeedbackDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleRequestRevision}
              disabled={!feedback.trim() || isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <RotateCcw className="h-4 w-4 mr-1" />
              )}
              Request Revision
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Sponsor Preview
            </DialogTitle>
            <DialogDescription>
              This is how the report will appear to sponsors.
            </DialogDescription>
          </DialogHeader>
          
          {currentReport && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-primary/20 via-primary/10 to-secondary/20 p-4 rounded-lg">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={getChildById(currentReport.child_id)?.photo_url} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {getChildById(currentReport.child_id)?.first_name?.[0]}
                      {getChildById(currentReport.child_id)?.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="text-xl font-bold">
                      {currentReport.quarter} {currentReport.year} Progress Report
                    </h2>
                    <p className="text-muted-foreground">
                      {getChildById(currentReport.child_id)?.first_name}{' '}
                      {getChildById(currentReport.child_id)?.last_name}
                    </p>
                  </div>
                </div>
              </div>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Growth & Development</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground/90">{currentReport.growth_narrative}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Activities & Participation</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground/90">{currentReport.activities}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Teacher Observations</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground/90">{currentReport.teacher_observations}</p>
                </CardContent>
              </Card>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewDialogOpen(false)}>
              Close
            </Button>
            {currentReport && currentReport.status !== 'published' && (
              <Button onClick={() => {
                handleApprove(currentReport.id);
                setPreviewDialogOpen(false);
              }}>
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Approve
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
