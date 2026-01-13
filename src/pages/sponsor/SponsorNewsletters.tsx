import { useData } from '@/contexts/DataContext';
import { SponsorLayout } from '@/components/layouts/SponsorLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Calendar, FileText } from 'lucide-react';

export default function SponsorNewsletters() {
  const { newsletters } = useData();

  return (
    <SponsorLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">School Newsletters</h1>
          <p className="text-muted-foreground">
            Stay updated with the latest news and happenings at the school
          </p>
        </div>

        {newsletters.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-lg font-medium">No newsletters yet</p>
              <p className="text-muted-foreground">
                Newsletters will appear here when published
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {newsletters.map((newsletter) => (
              <Card key={newsletter.id} className="overflow-hidden">
                {newsletter.thumbnail_url && (
                  <div className="aspect-[3/2] overflow-hidden">
                    <img
                      src={newsletter.thumbnail_url}
                      alt={newsletter.title}
                      className="h-full w-full object-cover transition-transform hover:scale-105"
                    />
                  </div>
                )}
                <CardContent className="p-4">
                  <h3 className="font-semibold line-clamp-1">{newsletter.title}</h3>
                  {newsletter.description && (
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                      {newsletter.description}
                    </p>
                  )}
                  <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {new Date(newsletter.published_date).toLocaleDateString('en-US', {
                      month: 'long',
                      year: 'numeric',
                    })}
                  </div>
                  <Button className="mt-4 w-full" variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Download PDF
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </SponsorLayout>
  );
}
