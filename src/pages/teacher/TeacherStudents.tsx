import { TeacherLayout } from '@/components/layouts/TeacherLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  FileText, 
  Camera,
  GraduationCap,
  Loader2,
} from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useChildren, useReports, useSponsorships } from '@/hooks/useApi';
import { format, differenceInYears } from 'date-fns';

export default function TeacherStudents() {
  const [searchQuery, setSearchQuery] = useState('');
  
  const { data: childrenData, isLoading: childrenLoading } = useChildren({ status: 'active' });
  const { data: reportsData, isLoading: reportsLoading } = useReports();
  const { data: sponsorshipsData } = useSponsorships();

  const students = childrenData?.data || [];
  const allReports = reportsData?.data || [];
  const allSponsorships = sponsorshipsData?.data || [];
  
  const filteredStudents = students.filter(student =>
    `${student.first_name} ${student.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.grade.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (childrenLoading) {
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
          <h1 className="text-3xl font-bold text-foreground">My Students</h1>
          <p className="text-muted-foreground">
            View and manage your assigned students
          </p>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search students..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredStudents.map((child) => {
            const age = differenceInYears(new Date(), new Date(child.date_of_birth));
            const reports = allReports.filter(r => r.child_id === child.id);
            const hasSponsorship = allSponsorships.some(s => s.child_id === child.id && s.status === 'active');
            const latestReport = reports.sort((a, b) => 
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            )[0];

            return (
              <Card key={child.id} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={child.photo_url} alt={`${child.first_name} ${child.last_name}`} />
                      <AvatarFallback className="text-lg">
                        {child.first_name.charAt(0)}{child.last_name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg">
                        {child.first_name} {child.last_name}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <GraduationCap className="h-4 w-4" />
                        <span>{child.grade}</span>
                        <span>•</span>
                        <span>{age} years old</span>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        {hasSponsorship ? (
                          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                            Sponsored
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Awaiting Sponsor</Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2 text-sm">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>Enrolled</span>
                      <span>{format(new Date(child.enrollment_date), 'MMM yyyy')}</span>
                    </div>
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>Reports</span>
                      <span>{reports.length} total</span>
                    </div>
                    {latestReport && (
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span>Last Report</span>
                        <Badge variant="outline" className="text-xs">
                          {latestReport.quarter} {latestReport.year}
                        </Badge>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t flex gap-2">
                    <Link to={`/teacher/reports/new?child=${child.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        <FileText className="h-4 w-4 mr-1" />
                        Report
                      </Button>
                    </Link>
                    <Link to={`/teacher/moments?tag=${child.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        <Camera className="h-4 w-4 mr-1" />
                        Photos
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredStudents.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-lg font-medium">No students found</p>
              <p className="text-muted-foreground">
                Try adjusting your search query
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </TeacherLayout>
  );
}
