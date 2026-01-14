import { useState } from 'react';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  CheckCircle,
  XCircle,
  Mail,
  Phone,
  MessageSquare,
  Clock,
  UserCheck,
  UserX,
} from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export default function PendingApprovals() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { pendingRegistrations, approveRegistration, rejectRegistration } = useData();
  const [activeTab, setActiveTab] = useState<'pending' | 'reviewed'>('pending');

  const pending = pendingRegistrations.filter((r) => r.status === 'pending');
  const reviewed = pendingRegistrations.filter((r) => r.status !== 'pending');

  const handleApprove = (id: string, name: string) => {
    approveRegistration(id, user?.id || 'admin-1');
    toast({
      title: 'Registration approved',
      description: `${name} has been approved as a sponsor.`,
    });
  };

  const handleReject = (id: string, name: string) => {
    rejectRegistration(id, user?.id || 'admin-1');
    toast({
      title: 'Registration rejected',
      description: `${name}'s registration has been rejected.`,
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffDays > 0) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    if (diffHours > 0) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pending Approvals</h1>
          <p className="text-muted-foreground">
            Review and approve sponsor registration requests
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pending.length}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <UserCheck className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {reviewed.filter((r) => r.status === 'approved').length}
                </p>
                <p className="text-sm text-muted-foreground">Approved</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <UserX className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {reviewed.filter((r) => r.status === 'rejected').length}
                </p>
                <p className="text-sm text-muted-foreground">Rejected</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList>
            <TabsTrigger value="pending">
              Pending ({pending.length})
            </TabsTrigger>
            <TabsTrigger value="reviewed">
              Reviewed ({reviewed.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-4">
            {pending.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
                  <p className="mt-4 text-lg font-medium">All caught up!</p>
                  <p className="text-muted-foreground">No pending registrations to review.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {pending.map((registration) => (
                  <Card key={registration.id}>
                    <CardContent className="pt-6">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-semibold">{registration.full_name}</h3>
                            <Badge variant="outline">{getTimeAgo(registration.created_at)}</Badge>
                          </div>
                          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Mail className="h-4 w-4" />
                              <span>{registration.email}</span>
                            </div>
                            {registration.phone && (
                              <div className="flex items-center gap-1">
                                <Phone className="h-4 w-4" />
                                <span>{registration.phone}</span>
                              </div>
                            )}
                          </div>
                          {registration.message && (
                            <div className="mt-2 flex items-start gap-2 rounded-lg bg-muted p-3">
                              <MessageSquare className="mt-0.5 h-4 w-4 text-muted-foreground" />
                              <p className="text-sm">{registration.message}</p>
                            </div>
                          )}
                          <p className="text-xs text-muted-foreground">
                            Submitted: {formatDate(registration.created_at)}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <XCircle className="mr-2 h-4 w-4" />
                                Reject
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Reject registration?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will reject {registration.full_name}'s registration request.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() =>
                                    handleReject(registration.id, registration.full_name)
                                  }
                                >
                                  Reject
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                          <Button
                            size="sm"
                            onClick={() => handleApprove(registration.id, registration.full_name)}
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Approve
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="reviewed" className="mt-4">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Reviewed</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reviewed.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                          No reviewed registrations yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      reviewed.map((registration) => (
                        <TableRow key={registration.id}>
                          <TableCell className="font-medium">{registration.full_name}</TableCell>
                          <TableCell>{registration.email}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                registration.status === 'approved' ? 'default' : 'destructive'
                              }
                            >
                              {registration.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDate(registration.created_at)}</TableCell>
                          <TableCell>
                            {registration.reviewed_at
                              ? formatDate(registration.reviewed_at)
                              : '-'}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}