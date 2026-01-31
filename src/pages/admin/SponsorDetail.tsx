import { useParams, useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  Users,
  UserMinus,
  UserPlus,
  Trash2,
  Loader2,
} from 'lucide-react';
import { useSponsor, useSponsorships, useChildren, useRemoveSponsorship, useAssignSponsorship } from '@/hooks/useApi';
import { useToast } from '@/hooks/use-toast';

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

export default function SponsorDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Use real API hooks
  const { data: sponsor, isLoading: sponsorLoading } = useSponsor(id || '');
  const { data: sponsorshipsData, isLoading: sponsorshipsLoading } = useSponsorships({ sponsor_id: id });
  const { data: childrenData, isLoading: childrenLoading } = useChildren();
  const removeSponsorship = useRemoveSponsorship();
  const assignSponsorship = useAssignSponsorship();

  const sponsorships = sponsorshipsData?.data || [];
  const children = childrenData?.data || [];

  // Get sponsored children
  const sponsoredChildIds = sponsorships
    .filter(s => s.status === 'active')
    .map(s => s.child_id);
  const sponsoredChildren = children.filter(c => sponsoredChildIds.includes(c.id));

  // Get children not currently sponsored by this sponsor
  const availableChildren = children.filter(c => !sponsoredChildIds.includes(c.id));

  const isLoading = sponsorLoading || sponsorshipsLoading || childrenLoading;

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid gap-6 lg:grid-cols-3">
            <Skeleton className="h-96" />
            <Skeleton className="h-96 lg:col-span-2" />
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!sponsor) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground">Sponsor not found</p>
          <Button onClick={() => navigate('/dashboard/sponsors')} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Sponsors
          </Button>
        </div>
      </AdminLayout>
    );
  }

  const handleRemoveChild = async (sponsorshipId: string, childName: string) => {
    try {
      await removeSponsorship.mutateAsync({ id: sponsorshipId });
      toast({
        title: 'Child removed',
        description: `${childName} is no longer sponsored by ${sponsor.full_name}.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to remove sponsorship',
        variant: 'destructive',
      });
    }
  };

  const handleAssignChild = async (childId: string, childName: string) => {
    try {
      await assignSponsorship.mutateAsync({
        sponsor_id: id!,
        child_id: childId,
      });
      toast({
        title: 'Child assigned',
        description: `${childName} is now sponsored by ${sponsor.full_name}.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to assign child',
        variant: 'destructive',
      });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/sponsors')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">Sponsor Details</h1>
            <p className="text-muted-foreground">View and manage sponsor information</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Sponsor Profile Card */}
          <Card className="lg:col-span-1">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={sponsor.avatar_url} />
                  <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                    {sponsor.full_name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </AvatarFallback>
                </Avatar>
                <h2 className="mt-4 text-xl font-semibold">{sponsor.full_name}</h2>
                <Badge className="mt-2">Sponsor</Badge>

                <div className="mt-6 w-full space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{sponsor.email}</span>
                  </div>
                  {sponsor.phone && (
                    <div className="flex items-center gap-3 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{sponsor.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Joined {new Date(sponsor.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {sponsoredChildren.length} active{' '}
                      {sponsoredChildren.length === 1 ? 'sponsorship' : 'sponsorships'}
                    </span>
                  </div>
                </div>

                <Button className="mt-6 w-full" variant="outline">
                  <Mail className="mr-2 h-4 w-4" />
                  Send Email
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Sponsored Children */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Sponsored Children</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sponsoredChildren.length === 0 ? (
                <p className="py-8 text-center text-muted-foreground">
                  No children currently sponsored.
                </p>
              ) : (
                <div className="space-y-4">
                  {sponsoredChildren.map((child) => {
                    const sponsorship = sponsorships.find(
                      (s) => s.child_id === child.id && s.status === 'active'
                    );
                    return (
                      <div
                        key={child.id}
                        className="flex items-center gap-4 rounded-lg border p-4"
                      >
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={child.photo_url} />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {child.first_name[0]}
                            {child.last_name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium">
                            {child.first_name} {child.last_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {calculateAge(child.date_of_birth)} years old • {child.grade}
                          </p>
                          {sponsorship && (
                            <p className="text-xs text-muted-foreground">
                              Since {new Date(sponsorship.start_date).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" disabled={removeSponsorship.isPending}>
                              {removeSponsorship.isPending ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <UserMinus className="mr-2 h-4 w-4" />
                              )}
                              Remove
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remove sponsorship?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will end the sponsorship of {child.first_name} by{' '}
                                {sponsor.full_name}.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => sponsorship && handleRemoveChild(sponsorship.id, child.first_name)}
                              >
                                Remove
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Assign Available Children */}
        {availableChildren.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Quick Assign</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-muted-foreground">
                Quickly assign unsponsored children to this sponsor:
              </p>
              <div className="flex flex-wrap gap-2">
                {availableChildren.slice(0, 5).map((child) => (
                  <Button
                    key={child.id}
                    variant="outline"
                    size="sm"
                    onClick={() => handleAssignChild(child.id, child.first_name)}
                    disabled={assignSponsorship.isPending}
                  >
                    {assignSponsorship.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <UserPlus className="mr-2 h-4 w-4" />
                    )}
                    {child.first_name} {child.last_name}
                  </Button>
                ))}
                {availableChildren.length > 5 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/dashboard/sponsors/${id}/manage`)}
                  >
                    +{availableChildren.length - 5} more
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Sponsorship History */}
        <Card>
          <CardHeader>
            <CardTitle>Sponsorship History</CardTitle>
          </CardHeader>
          <CardContent>
            {sponsorships.length === 0 ? (
              <p className="py-4 text-center text-muted-foreground">No sponsorship history.</p>
            ) : (
              <div className="space-y-2">
                {sponsorships.map((sp) => {
                  const child = children.find((c) => c.id === sp.child_id);
                  return (
                    <div
                      key={sp.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div>
                        <p className="font-medium">
                          {child?.first_name} {child?.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(sp.start_date).toLocaleDateString()} -{' '}
                          {sp.end_date ? new Date(sp.end_date).toLocaleDateString() : 'Present'}
                        </p>
                      </div>
                      <Badge variant={sp.status === 'active' ? 'default' : 'secondary'}>
                        {sp.status}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
