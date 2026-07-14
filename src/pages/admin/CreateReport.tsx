import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Save, Send, Loader2 } from 'lucide-react';
import { useChildren, useCreateReport, usePublishReport } from '@/hooks/useApi';

const reportSchema = z.object({
  child_id: z.string().min(1, 'Please select a child'),
  quarter: z.enum(['Q1', 'Q2', 'Q3', 'Q4']),
  year: z.number().min(2020).max(2030),
  growth_narrative: z.string().min(10, 'Growth narrative is required'),
  activities: z.string().min(10, 'Activities section is required'),
  teacher_observations: z.string().min(10, 'Teacher observations are required'),
});

type ReportFormData = z.infer<typeof reportSchema>;

export default function CreateReport() {
  const navigate = useNavigate();
  const { user, hasAnyRole } = useAuth();
  const canPublishDirectly = hasAnyRole(['super_admin', 'admin']);
  const { toast } = useToast();
  const { data: childrenData, isLoading: isLoadingChildren } = useChildren({ status: 'active' });
  const createReport = useCreateReport();
  const publishReport = usePublishReport();
  const [isSubmittingFinal, setIsSubmittingFinal] = useState(false);

  const children = childrenData?.data || [];

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ReportFormData>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      year: new Date().getFullYear(),
      quarter: 'Q1',
    },
  });

  const onSubmit = async (data: ReportFormData, action: 'draft' | 'submit' | 'publish' = 'draft') => {
    if (action !== 'draft') setIsSubmittingFinal(true);

    try {
      const created = await createReport.mutateAsync({
        child_id: data.child_id,
        quarter: data.quarter,
        year: data.year,
        growth_narrative: data.growth_narrative,
        activities: data.activities,
        teacher_observations: data.teacher_observations,
        teacher_id: user?.id || 'teacher-1',
        status: action === 'submit' ? 'pending_review' : 'draft',
      });

      if (action === 'publish') {
        await publishReport.mutateAsync({ id: created.id });
      }

      const descriptions: Record<typeof action, string> = {
        draft: 'Report has been saved as draft.',
        submit: 'Report submitted for review. An admin will approve it before it publishes.',
        publish: 'Report has been published successfully.',
      };

      toast({ title: 'Success', description: descriptions[action] });
      navigate('/dashboard/reports');
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save report. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmittingFinal(false);
    }
  };

  const isPending = createReport.isPending || publishReport.isPending;

  return (
    <AdminLayout>
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/dashboard/reports')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Create Progress Report</h1>
            <p className="text-muted-foreground">
              Document a child's quarterly progress
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit((data) => onSubmit(data, 'draft'))}>
          <div className="space-y-6">
            {/* Child & Period Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Report Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Select Child</Label>
                    <Select
                      disabled={isLoadingChildren}
                      onValueChange={(value) => setValue('child_id', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={isLoadingChildren ? 'Loading...' : 'Choose a child'} />
                      </SelectTrigger>
                      <SelectContent>
                        {children.map((child) => (
                          <SelectItem key={child.id} value={child.id}>
                            {child.first_name} {child.last_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.child_id && (
                      <p className="text-sm text-destructive">
                        {errors.child_id.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Quarter</Label>
                    <Select
                      defaultValue="Q1"
                      onValueChange={(value: 'Q1' | 'Q2' | 'Q3' | 'Q4') =>
                        setValue('quarter', value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Q1">Q1 (Jan-Mar)</SelectItem>
                        <SelectItem value="Q2">Q2 (Apr-Jun)</SelectItem>
                        <SelectItem value="Q3">Q3 (Jul-Sep)</SelectItem>
                        <SelectItem value="Q4">Q4 (Oct-Dec)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Year</Label>
                    <Select
                      defaultValue={new Date().getFullYear().toString()}
                      onValueChange={(value) => setValue('year', parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[2024, 2025, 2026].map((year) => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Growth Narrative */}
            <Card>
              <CardHeader>
                <CardTitle>Growth Narrative</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  {...register('growth_narrative')}
                  placeholder="Describe the child's overall growth, academic progress, and development this quarter..."
                  rows={5}
                />
                {errors.growth_narrative && (
                  <p className="mt-2 text-sm text-destructive">
                    {errors.growth_narrative.message}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Activities */}
            <Card>
              <CardHeader>
                <CardTitle>Activities & Participation</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  {...register('activities')}
                  placeholder="List activities the child participated in, events, projects, and extracurriculars..."
                  rows={4}
                />
                {errors.activities && (
                  <p className="mt-2 text-sm text-destructive">
                    {errors.activities.message}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Teacher Observations */}
            <Card>
              <CardHeader>
                <CardTitle>Teacher Observations</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  {...register('teacher_observations')}
                  placeholder="Share your personal observations about the child's behavior, social skills, and areas for growth..."
                  rows={4}
                />
                {errors.teacher_observations && (
                  <p className="mt-2 text-sm text-destructive">
                    {errors.teacher_observations.message}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/dashboard/reports')}
              >
                Cancel
              </Button>
              <Button type="submit" variant="secondary" disabled={isPending}>
                {isPending && !isSubmittingFinal ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save as Draft
              </Button>
              <Button
                type="button"
                disabled={isPending}
                onClick={handleSubmit((data) => onSubmit(data, canPublishDirectly ? 'publish' : 'submit'))}
              >
                {isSubmittingFinal ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                {canPublishDirectly ? 'Publish Report' : 'Submit for Review'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
