import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { AvatarUpload } from '@/components/media';
import { useCreateChild, useTeachers } from '@/hooks/useApi';

const NAME_REGEX = /^[a-zA-Z\s'-]+$/;

const childSchema = z.object({
  first_name: z.string().min(1, 'First name is required').regex(NAME_REGEX, 'First name can only contain letters, spaces, hyphens, and apostrophes'),
  last_name: z.string().min(1, 'Last name is required').regex(NAME_REGEX, 'Last name can only contain letters, spaces, hyphens, and apostrophes'),
  date_of_birth: z.string().min(1, 'Date of birth is required').refine(val => {
    const date = new Date(val);
    const now = new Date();
    const minAge = new Date(now.getFullYear() - 25, now.getMonth(), now.getDate());
    const maxAge = new Date(now.getFullYear() - 3, now.getMonth(), now.getDate());
    return date >= minAge && date <= maxAge;
  }, 'Child must be between 3 and 25 years old'),
  grade: z.string().min(1, 'Grade is required'),
  photo_url: z.string().url('Invalid photo URL').optional().or(z.literal('')),
  enrollment_date: z.string().min(1, 'Enrollment date is required'),
  status: z.enum(['active', 'graduated', 'withdrawn']),
  teacher_id: z.string().optional(),
});

type ChildFormData = z.infer<typeof childSchema>;

const grades = [
  'Nursery',
  'LKG',
  'UKG',
  '1st Grade',
  '2nd Grade',
  '3rd Grade',
  '4th Grade',
  '5th Grade',
  '6th Grade',
  '7th Grade',
  '8th Grade',
];

export default function AddChild() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const createChild = useCreateChild();
  const { data: teachersData } = useTeachers();
  const teachers = teachersData?.data || [];

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ChildFormData>({
    resolver: zodResolver(childSchema),
    defaultValues: {
      status: 'active',
      enrollment_date: new Date().toISOString().split('T')[0],
    },
  });

  const onSubmit = async (data: ChildFormData) => {
    try {
      await createChild.mutateAsync({
        first_name: data.first_name,
        last_name: data.last_name,
        date_of_birth: data.date_of_birth,
        grade: data.grade,
        photo_url: data.photo_url,
        enrollment_date: data.enrollment_date,
        status: data.status,
        teacher_id: data.teacher_id === 'unassigned' ? undefined : data.teacher_id,
      });
      toast({
        title: 'Success',
        description: 'Child has been added successfully.',
      });
      navigate('/dashboard/children');
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add child. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <AdminLayout>
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/dashboard/children')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Add New Child</h1>
            <p className="text-muted-foreground">
              Enter the child's information to enroll them in the program
            </p>
          </div>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Child Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First Name</Label>
                  <Input
                    id="first_name"
                    {...register('first_name')}
                    placeholder="Enter first name"
                  />
                  {errors.first_name && (
                    <p className="text-sm text-destructive">
                      {errors.first_name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input
                    id="last_name"
                    {...register('last_name')}
                    placeholder="Enter last name"
                  />
                  {errors.last_name && (
                    <p className="text-sm text-destructive">
                      {errors.last_name.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="date_of_birth">Date of Birth</Label>
                  <Input
                    id="date_of_birth"
                    type="date"
                    {...register('date_of_birth')}
                  />
                  {errors.date_of_birth && (
                    <p className="text-sm text-destructive">
                      {errors.date_of_birth.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="grade">Grade</Label>
                  <Select
                    onValueChange={(value) => setValue('grade', value)}
                    defaultValue={watch('grade')}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select grade" />
                    </SelectTrigger>
                    <SelectContent>
                      {grades.map((grade) => (
                        <SelectItem key={grade} value={grade}>
                          {grade}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.grade && (
                    <p className="text-sm text-destructive">{errors.grade.message}</p>
                  )}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="enrollment_date">Enrollment Date</Label>
                  <Input
                    id="enrollment_date"
                    type="date"
                    {...register('enrollment_date')}
                  />
                  {errors.enrollment_date && (
                    <p className="text-sm text-destructive">
                      {errors.enrollment_date.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    onValueChange={(value: 'active' | 'graduated' | 'withdrawn') =>
                      setValue('status', value)
                    }
                    defaultValue="active"
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="graduated">Graduated</SelectItem>
                      <SelectItem value="withdrawn">Withdrawn</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="teacher_id">Assigned Teacher (optional)</Label>
                <Select
                  onValueChange={(value) => setValue('teacher_id', value)}
                  defaultValue="unassigned"
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select teacher" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {teachers.map((teacher) => (
                      <SelectItem key={teacher.id} value={teacher.id}>
                        {teacher.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Photo (optional)</Label>
                <div className="flex items-center gap-4">
                  <AvatarUpload
                    value={watch('photo_url')}
                    onChange={(url) => setValue('photo_url', url)}
                    name={`${watch('first_name') || ''} ${watch('last_name') || ''}`}
                    size="xl"
                    uploadEndpoint="/upload/image"
                  />
                  <p className="text-sm text-muted-foreground">
                    Click the camera icon to upload a photo
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/dashboard/children')}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createChild.isPending}>
                  {createChild.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Child
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
