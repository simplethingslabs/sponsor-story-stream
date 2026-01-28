import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { useReport, useUpdateReport, usePublishReport, useChildren } from '@/hooks/useApi';

const reportSchema = z.object({
  child_id: z.string().min(1, 'Please select a child'),
  quarter: z.enum(['Q1', 'Q2', 'Q3', 'Q4']),
  year: z.number().min(2020).max(2030),
  growth_narrative: z.string().min(10, 'Growth narrative must be at least 10 characters'),
  activities: z.string().min(10, 'Activities must be at least 10 characters'),
  teacher_observations: z.string().min(10, 'Observations must be at least 10 characters'),
});

type ReportFormData = z.infer<typeof reportSchema>;

export default function EditReport() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: report, isLoading: isLoadingReport, error: reportError } = useReport(id || '');
  const { data: childrenData } = useChildren();
  const updateReport = useUpdateReport();
  const publishReport = usePublishReport();

  const children = childrenData?.data || [];
  const child = report ? children.find((c) => c.id === report.child_id) : null;

  const form = useForm<ReportFormData>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      child_id: '',
      quarter: 'Q1',
      year: new Date().getFullYear(),
      growth_narrative: '',
      activities: '',
      teacher_observations: '',
    },
  });

  useEffect(() => {
    if (report) {
      form.reset({
        child_id: report.child_id,
        quarter: report.quarter,
        year: report.year,
        growth_narrative: report.growth_narrative,
        activities: report.activities,
        teacher_observations: report.teacher_observations,
      });
    }
  }, [report, form]);

  if (isLoadingReport) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  if (reportError || !report) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Report not found</p>
        </div>
      </AdminLayout>
    );
  }

  const onSubmit = async (data: ReportFormData, publish = false) => {
    try {
      if (publish) {
        await publishReport.mutateAsync({ id: id!, notify_sponsors: true });
      } else {
        await updateReport.mutateAsync({
          id: id!,
          data: {
            ...data,
          },
        });
      }
      toast({
        title: 'Success',
        description: publish ? 'Report published successfully' : 'Report updated successfully',
      });
      navigate('/dashboard/reports');
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update report',
        variant: 'destructive',
      });
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
  const isPending = updateReport.isPending || publishReport.isPending;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Edit Report</h1>
            <p className="text-muted-foreground">
              {child ? `${child.first_name} ${child.last_name} - ${report.quarter} ${report.year}` : 'Loading...'}
            </p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => onSubmit(data, false))} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Report Details</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-6 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="child_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Child</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select child" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {children.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.first_name} {c.last_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="quarter"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quarter</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Q1">Q1 (Jan-Mar)</SelectItem>
                          <SelectItem value="Q2">Q2 (Apr-Jun)</SelectItem>
                          <SelectItem value="Q3">Q3 (Jul-Sep)</SelectItem>
                          <SelectItem value="Q4">Q4 (Oct-Dec)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="year"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Year</FormLabel>
                      <Select
                        onValueChange={(v) => field.onChange(parseInt(v))}
                        value={field.value.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {years.map((year) => (
                            <SelectItem key={year} value={year.toString()}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Growth Narrative</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="growth_narrative"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea
                          placeholder="Describe the child's growth and development this quarter..."
                          className="min-h-[150px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Activities & Achievements</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="activities"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea
                          placeholder="List key activities, projects, and achievements..."
                          className="min-h-[150px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Teacher Observations</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="teacher_observations"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea
                          placeholder="Share your professional observations about the child..."
                          className="min-h-[150px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/dashboard/reports')}
              >
                Cancel
              </Button>
              <Button type="submit" variant="secondary" disabled={isPending}>
                {updateReport.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save Draft
              </Button>
              {report.status === 'draft' && (
                <Button
                  type="button"
                  onClick={form.handleSubmit((data) => onSubmit(data, true))}
                  disabled={isPending}
                >
                  {publishReport.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Publish Report
                </Button>
              )}
            </div>
          </form>
        </Form>
      </div>
    </AdminLayout>
  );
}
