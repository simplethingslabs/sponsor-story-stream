import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ArrowLeft,
  Mail,
  Send,
  Copy,
  RefreshCw,
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
  Link,
} from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export default function InviteSponsor() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { sponsorInvitations, createInvitation, cancelInvitation, resendInvitation } = useData();

  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pendingInvitations = sponsorInvitations.filter((i) => i.status === 'pending');
  const expiredInvitations = sponsorInvitations.filter((i) => {
    const expiresAt = new Date(i.expires_at);
    return i.status === 'pending' && expiresAt < new Date();
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast({
        title: 'Email required',
        description: 'Please enter an email address.',
        variant: 'destructive',
      });
      return;
    }

    // Check if already invited
    const existingInvitation = sponsorInvitations.find(
      (i) => i.email.toLowerCase() === email.toLowerCase() && i.status === 'pending'
    );

    if (existingInvitation) {
      toast({
        title: 'Already invited',
        description: 'This email has already been invited.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    createInvitation(email.trim(), user?.id || 'admin-1');
    
    toast({
      title: 'Invitation sent',
      description: `An invitation has been sent to ${email}.`,
    });
    
    setEmail('');
    setIsSubmitting(false);
  };

  const handleResend = (id: string, email: string) => {
    resendInvitation(id);
    toast({
      title: 'Invitation resent',
      description: `The invitation to ${email} has been resent.`,
    });
  };

  const handleCancel = (id: string, email: string) => {
    cancelInvitation(id);
    toast({
      title: 'Invitation cancelled',
      description: `The invitation to ${email} has been cancelled.`,
    });
  };

  const copyInviteLink = () => {
    const link = `${window.location.origin}/register?invite=true`;
    navigator.clipboard.writeText(link);
    toast({
      title: 'Link copied',
      description: 'The invite link has been copied to your clipboard.',
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatus = (invitation: typeof sponsorInvitations[0]) => {
    const expiresAt = new Date(invitation.expires_at);
    if (invitation.status === 'accepted') return 'accepted';
    if (expiresAt < new Date()) return 'expired';
    return 'pending';
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/sponsors')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Invite Sponsors</h1>
            <p className="text-muted-foreground">Send email invitations to potential sponsors</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Invite Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Send Invitation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="sponsor@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <p className="text-sm text-muted-foreground">
                    The recipient will receive an email with instructions to create their account.
                  </p>
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  <Send className="mr-2 h-4 w-4" />
                  {isSubmitting ? 'Sending...' : 'Send Invitation'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Share Link */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link className="h-5 w-5" />
                Share Registration Link
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Share this link with potential sponsors. They can register and their account will
                be pending approval.
              </p>
              <div className="flex gap-2">
                <Input
                  value={`${window.location.origin}/register`}
                  readOnly
                  className="bg-muted"
                />
                <Button variant="outline" onClick={copyInviteLink}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy
                </Button>
              </div>
              <div className="rounded-lg bg-muted p-4">
                <p className="text-sm font-medium">How it works:</p>
                <ol className="mt-2 list-inside list-decimal space-y-1 text-sm text-muted-foreground">
                  <li>Sponsor fills out the registration form</li>
                  <li>You receive a notification in Pending Approvals</li>
                  <li>Approve or reject the registration</li>
                  <li>Approved sponsors can log in immediately</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Invitations */}
        <Card>
          <CardHeader>
            <CardTitle>Sent Invitations</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sent</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead className="w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sponsorInvitations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      No invitations sent yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  sponsorInvitations.map((invitation) => {
                    const status = getStatus(invitation);
                    return (
                      <TableRow key={invitation.id}>
                        <TableCell className="font-medium">{invitation.email}</TableCell>
                        <TableCell>
                          {status === 'pending' && (
                            <Badge variant="outline" className="flex w-fit items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Pending
                            </Badge>
                          )}
                          {status === 'accepted' && (
                            <Badge variant="default" className="flex w-fit items-center gap-1">
                              <CheckCircle className="h-3 w-3" />
                              Accepted
                            </Badge>
                          )}
                          {status === 'expired' && (
                            <Badge variant="destructive" className="flex w-fit items-center gap-1">
                              <XCircle className="h-3 w-3" />
                              Expired
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>{formatDate(invitation.created_at)}</TableCell>
                        <TableCell>{formatDate(invitation.expires_at)}</TableCell>
                        <TableCell>
                          {status !== 'accepted' && (
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleResend(invitation.id, invitation.email)}
                                title="Resend"
                              >
                                <RefreshCw className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" title="Cancel">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Cancel invitation?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This will cancel the invitation to {invitation.email}.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Keep</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() =>
                                        handleCancel(invitation.id, invitation.email)
                                      }
                                    >
                                      Cancel Invitation
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}