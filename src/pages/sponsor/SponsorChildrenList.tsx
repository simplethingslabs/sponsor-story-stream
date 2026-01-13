import { useNavigate } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import { SponsorLayout } from '@/components/layouts/SponsorLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';
import { calculateAge } from '@/data/mockData';

export default function SponsorChildrenList() {
  const { getChildrenForSponsor, getReportsForChild } = useData();
  const navigate = useNavigate();

  const sponsorId = 'sponsor-1';
  const sponsoredChildren = getChildrenForSponsor(sponsorId);

  return (
    <SponsorLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Sponsored Children</h1>
          <p className="text-muted-foreground">
            View progress reports and updates for the children you support
          </p>
        </div>

        <div className="space-y-4">
          {sponsoredChildren.map((child) => {
            const reports = getReportsForChild(child.id);
            const latestReport = reports[0];
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
      </div>
    </SponsorLayout>
  );
}
