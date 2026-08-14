import { useParams, useNavigate, Link } from 'react-router-dom';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Mail, Phone, CalendarDays, Edit, Users } from 'lucide-react';
import { useTeacher, useChildren } from '@/hooks/useApi';

export default function TeacherDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: teacher, isLoading } = useTeacher(id || '');
  const { data: childrenData, isLoading: studentsLoading } = useChildren({ limit: 100 });
  const students = (childrenData?.data || []).filter((child) => child.teacher_id === id);

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-64" />
        </div>
      </AdminLayout>
    );
  }

  if (!teacher) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground">Teacher not found</p>
          <Button onClick={() => navigate('/dashboard/teachers')} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Teachers
          </Button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/teachers')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">Teacher Details</h1>
            <p className="text-muted-foreground">View teacher account information</p>
          </div>
          <Button onClick={() => navigate(`/dashboard/teachers/${teacher.id}/edit`)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <Avatar className="h-24 w-24">
                <AvatarImage src={teacher.avatar_url} />
                <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                  {teacher.full_name?.charAt(0) || 'T'}
                </AvatarFallback>
              </Avatar>
              <h2 className="mt-4 text-xl font-semibold">{teacher.full_name}</h2>

              <div className="mt-6 w-full max-w-sm space-y-3 text-left">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{teacher.email}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{teacher.phone || 'No phone on file'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  <span>Created {new Date(teacher.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Assigned Students ({students.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {studentsLoading ? (
              <div className="space-y-3">
                {[...Array(2)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : students.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p>No students assigned to this teacher yet.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {students.map((student) => (
                  <Link
                    key={student.id}
                    to={`/dashboard/children/${student.id}`}
                    className="flex items-center gap-3 rounded-md border p-3 text-sm hover:bg-muted/50"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={student.photo_url} />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {student.first_name?.charAt(0) || 'S'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">
                      {student.first_name} {student.last_name}
                    </span>
                    <span className="text-muted-foreground">{student.grade}</span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
