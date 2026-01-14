import { useParams, useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
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
} from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/hooks/use-toast';
import { calculateAge } from '@/data/mockData';

export default function SponsorDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    getSponsorById,
    getChildrenForSponsor,
    children,
    sponsorships,
    removeSponsor,
    assignSponsor,
    deleteSponsor,
  } = useData();

  const sponsor = getSponsorById(id || '');
  const sponsoredChildren = getChildrenForSponsor(id || '');

  // Get children not currently sponsored by this sponsor
  const availableChildren = children.filter(
    (child) =>
      !sponsorships.some(
        (s) => s.child_id === child.id && s.sponsor_id === id && s.status === 'active'
      )
  );

  // Get sponsorship history
  const sponsorshipHistory = sponsorships.filter((s) => s.sponsor_id === id);

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

  const handleRemoveChild = (childId: string, childName: string) => {
    removeSponsor(id!, childId);
    toast({
      title: 'Child removed',
      description: `${childName} is no longer sponsored by ${sponsor.full_name}.`,
    });
  };

  const handleAssignChild = (childId: string, childName: string) => {
    assignSponsor(id!, childId);
    toast({
      title: 'Child assigned',
      description: `${childName} is now sponsored by ${sponsor.full_name}.`,
    });
  };

  const handleDeleteSponsor = () => {
    deleteSponsor(id!);
    toast({
      title: 'Sponsor removed',
      description: `${sponsor.full_name} has been removed from the system.`,
    });
    navigate('/dashboard/sponsors');
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
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Remove Sponsor
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remove this sponsor?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will remove {sponsor.full_name} and end all their active sponsorships. This
                  action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteSponsor}>Remove</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
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
                <Button
                  size="sm"
                  onClick={() => navigate(`/dashboard/sponsors/${id}/manage`)}
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Manage Assignments
                </Button>
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
                    const sponsorship = sponsorshipHistory.find(
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
                            <Button variant="ghost" size="sm">
                              <UserMinus className="mr-2 h-4 w-4" />
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
                                onClick={() =>
                                  handleRemoveChild(child.id, child.first_name)
                                }
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
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
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
            {sponsorshipHistory.length === 0 ? (
              <p className="py-4 text-center text-muted-foreground">No sponsorship history.</p>
            ) : (
              <div className="space-y-2">
                {sponsorshipHistory.map((sp) => {
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