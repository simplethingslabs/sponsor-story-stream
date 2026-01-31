import { useNavigate } from 'react-router-dom';
import { useMyChildren, useReports } from '@/hooks/useApi';
import { SponsorLayout } from '@/components/layouts/SponsorLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronRight, Users } from 'lucide-react';

function calculateAge(dateOfBirth: string): number {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

export default function SponsorChildrenList() {
  const navigate = useNavigate();
  
  // Use real API hooks
  const { data: childrenData, isLoading: childrenLoading } = useMyChildren();
  const { data: reportsData } = useReports({ status: 'published' });

  const sponsoredChildren = childrenData?.data || [];
  const reports = reportsData?.data || [];

  const getReportsForChild = (childId: string) => {
    return reports.filter(r => r.child_id === childId);
  };

  return (
    <SponsorLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Sponsored Children</h1>
          <p className="text-muted-foreground">
            View progress reports and updates for the children you support
          </p>
        </div>

        {childrenLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        ) : sponsoredChildren.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-lg font-medium">No children sponsored yet</p>
              <p className="text-muted-foreground">
                Contact the school to sponsor a child
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {sponsoredChildren.map((child) => {
              const childReports = getReportsForChild(child.id);
              const latestReport = childReports[0];
              const hasNewReport = latestReport && (() => {
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                return new Date(latestReport.published_at || latestReport.created_at) > thirtyDaysAgo;
              })();

              return (
                <Card
                  key={child.id}
                  className="cursor-pointer transition-shadow hover:shadow-md"
                  onClick={() => navigate(`/sponsor/children/${child.id}`)}
                >
                  <CardContent className="flex items-center gap-4 p-4 sm:p-6">
                    <Avatar className="h-16 w-16 sm:h-20 sm:w-20">
                      <AvatarImage src={child.photo_url} />
                      <AvatarFallback className="bg-primary/10 text-primary text-xl">
                        {child.first_name[0]}
                        {child.last_name[0]}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-lg font-semibold">
                          {child.first_name} {child.last_name}
                        </h3>
                        {hasNewReport && (
                          <Badge className="bg-primary">New Report</Badge>
                        )}
                      </div>
                      <p className="text-muted-foreground">
                        {calculateAge(child.date_of_birth)} years old • {child.grade}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Sponsored since {new Date(child.enrollment_date).toLocaleDateString('en-US', {
                          month: 'long',
                          year: 'numeric',
                        })}
                      </p>
                      {latestReport && (
                        <p className="mt-2 text-sm">
                          Latest: <span className="font-medium">{latestReport.quarter} {latestReport.year}</span>
                        </p>
                      )}
                    </div>

                    <Button variant="ghost" size="icon" className="hidden sm:flex">
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </SponsorLayout>
  );
}
