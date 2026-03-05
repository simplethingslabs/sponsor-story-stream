import { TeacherLayout } from '@/components/layouts/TeacherLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Users, 
  ClipboardCheck, 
  FileText, 
  Camera, 
  TrendingUp,
  Clock,
  AlertCircle,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useChildren, useReports } from '@/hooks/useApi';
import { format } from 'date-fns';

export default function TeacherDashboard() {
  const { data: childrenData, isLoading: childrenLoading } = useChildren({ status: 'active' });
  const { data: reportsData, isLoading: reportsLoading } = useReports();

  const myStudents = childrenData?.data || [];
  const allReports = reportsData?.data || [];
  
  const draftReports = allReports.filter(r => r.status === 'draft');
  const needsRevisionReports = allReports.filter(r => r.status === 'needs_revision');
  
  const todayDate = format(new Date(), 'yyyy-MM-dd');
  const attendanceMarked = 3;
  const totalStudents = myStudents.length;

  const isLoading = childrenLoading || reportsLoading;

  const stats = [
    {
      title: 'My Students',
      value: myStudents.length.toString(),
      description: 'Active students assigned',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: "Today's Attendance",
      value: `${attendanceMarked}/${totalStudents}`,
      description: attendanceMarked === totalStudents ? 'All marked' : 'Pending',
      icon: ClipboardCheck,
      color: attendanceMarked === totalStudents ? 'text-green-600' : 'text-amber-600',
      bgColor: attendanceMarked === totalStudents ? 'bg-green-100' : 'bg-amber-100',
    },
    {
      title: 'Reports Pending',
      value: (draftReports.length + needsRevisionReports.length).toString(),
      description: `${draftReports.length} drafts, ${needsRevisionReports.length} need revision`,
      icon: FileText,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Moments This Month',
      value: '12',
      description: 'Photos & videos uploaded',
      icon: Camera,
      color: 'text-pink-600',
      bgColor: 'bg-pink-100',
    },
  ];

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
        <div>
          <h1 className="text-3xl font-bold text-foreground">Teacher Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's what needs your attention today.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                  </div>
                  <div className={`rounded-full p-3 ${stat.bgColor}`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
              <CardDescription>Common tasks for today</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              <Link to="/teacher/attendance">
                <Button variant="outline" className="w-full justify-between h-auto py-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-primary/10 p-2">
                      <ClipboardCheck className="h-5 w-5 text-primary" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">Mark Attendance</p>
                      <p className="text-xs text-muted-foreground">
                        {totalStudents - attendanceMarked} students remaining
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </Button>
              </Link>

              <Link to="/teacher/moments">
                <Button variant="outline" className="w-full justify-between h-auto py-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-primary/10 p-2">
                      <Camera className="h-5 w-5 text-primary" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">Upload Classroom Moments</p>
                      <p className="text-xs text-muted-foreground">
                        Share photos from today's activities
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </Button>
              </Link>

              <Link to="/teacher/reports/new">
                <Button variant="outline" className="w-full justify-between h-auto py-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-primary/10 p-2">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">Create Progress Report</p>
                      <p className="text-xs text-muted-foreground">
                        Write a new quarterly report
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-amber-500" />
                Reports Needing Attention
              </CardTitle>
              <CardDescription>Draft and revision requests</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {needsRevisionReports.length > 0 && (
                  <>
                    <p className="text-xs font-semibold uppercase text-destructive">
                      Needs Revision
                    </p>
                    {needsRevisionReports.slice(0, 2).map((report) => {
                      const child = myStudents.find(c => c.id === report.child_id);
                      return (
                        <div key={report.id} className="flex items-center gap-3 rounded-lg border border-destructive/20 bg-destructive/5 p-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={child?.photo_url} />
                            <AvatarFallback>{child?.first_name?.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">{child?.first_name} {child?.last_name}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {report.feedback || `${report.quarter} ${report.year}`}
                            </p>
                          </div>
                          <Badge variant="destructive" className="shrink-0">Revision</Badge>
                        </div>
                      );
                    })}
                  </>
                )}

                {draftReports.length > 0 && (
                  <>
                    <p className="text-xs font-semibold uppercase text-muted-foreground mt-4">
                      Drafts
                    </p>
                    {draftReports.slice(0, 2).map((report) => {
                      const child = myStudents.find(c => c.id === report.child_id);
                      return (
                        <div key={report.id} className="flex items-center gap-3 rounded-lg border p-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={child?.photo_url} />
                            <AvatarFallback>{child?.first_name?.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">{child?.first_name} {child?.last_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {report.quarter} {report.year}
                            </p>
                          </div>
                          <Badge variant="secondary">Draft</Badge>
                        </div>
                      );
                    })}
                  </>
                )}

                {needsRevisionReports.length === 0 && draftReports.length === 0 && (
                  <div className="text-center py-6 text-muted-foreground">
                    <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">All caught up! No pending reports.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">My Students</CardTitle>
              <CardDescription>Students assigned to you</CardDescription>
            </div>
            <Link to="/teacher/students">
              <Button variant="outline" size="sm">
                View All
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {myStudents.slice(0, 5).map((child) => (
                <div
                  key={child.id}
                  className="flex flex-col items-center rounded-lg border p-4 text-center hover:bg-muted/50 transition-colors"
                >
                  <Avatar className="h-16 w-16 mb-3">
                    <AvatarImage src={child.photo_url} alt={`${child.first_name} ${child.last_name}`} />
                    <AvatarFallback className="text-lg">
                      {child.first_name.charAt(0)}{child.last_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <p className="font-medium text-sm">{child.first_name} {child.last_name}</p>
                  <p className="text-xs text-muted-foreground">{child.grade}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </TeacherLayout>
  );
}
