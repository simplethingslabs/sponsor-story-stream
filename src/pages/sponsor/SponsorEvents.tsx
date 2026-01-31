import { useEvents } from '@/hooks/useApi';
import { SponsorLayout } from '@/components/layouts/SponsorLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Heart, MessageCircle, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SponsorEvents() {
  const { data: eventsData, isLoading } = useEvents();
  const events = eventsData?.data || [];

  return (
    <SponsorLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Events & Activities</h1>
          <p className="text-muted-foreground">
            See what's been happening at the school
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-64 w-full" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-lg font-medium">No events yet</p>
              <p className="text-muted-foreground">
                Events will appear here when posted
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {events.map((event) => (
              <Card key={event.id} className="overflow-hidden">
                <CardContent className="p-0">
                  {/* Event Header */}
                  <div className="border-b p-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {new Date(event.event_date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </div>
                    <h3 className="mt-2 text-xl font-semibold">{event.title}</h3>
                  </div>

                  {/* Description */}
                  <div className="p-4">
                    <p className="text-foreground/90">{event.description}</p>
                  </div>

                  {/* Social Actions */}
                  <div className="flex items-center gap-2 border-t px-4 py-3">
                    <Button variant="ghost" size="sm" className="gap-2">
                      <Heart className="h-4 w-4" />
                      Like
                    </Button>
                    <Button variant="ghost" size="sm" className="gap-2">
                      <MessageCircle className="h-4 w-4" />
                      Comment
                    </Button>
                    <Button variant="ghost" size="sm" className="gap-2">
                      <Share2 className="h-4 w-4" />
                      Share
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </SponsorLayout>
  );
}
