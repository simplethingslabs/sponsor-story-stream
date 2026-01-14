import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Search, Eye, UserCheck, Mail } from 'lucide-react';
import { useData } from '@/contexts/DataContext';

export default function SponsorsList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const { sponsors, getChildrenForSponsor, pendingRegistrations } = useData();

  const pendingCount = pendingRegistrations.filter((r) => r.status === 'pending').length;

  const filteredSponsors = sponsors.filter(
    (sponsor) =>
      sponsor.full_name.toLowerCase().includes(search.toLowerCase()) ||
      sponsor.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Sponsors</h1>
            <p className="text-muted-foreground">
              View and manage all sponsors and their sponsorships
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/dashboard/sponsors/pending')}>
              <UserCheck className="mr-2 h-4 w-4" />
              Pending
              {pendingCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {pendingCount}
                </Badge>
              )}
            </Button>
            <Button onClick={() => navigate('/dashboard/sponsors/invite')}>
              <Plus className="mr-2 h-4 w-4" />
              Invite Sponsor
            </Button>
          </div>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sponsor</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Sponsored Children</TableHead>
                  <TableHead>Since</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSponsors.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      No sponsors found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSponsors.map((sponsor) => {
                    const sponsoredChildren = getChildrenForSponsor(sponsor.id);
                    return (
                      <TableRow
                        key={sponsor.id}
                        className="cursor-pointer"
                        onClick={() => navigate(`/dashboard/sponsors/${sponsor.id}`)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={sponsor.avatar_url} />
                              <AvatarFallback className="bg-primary/10 text-primary">
                                {sponsor.full_name
                                  .split(' ')
                                  .map((n) => n[0])
                                  .join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{sponsor.full_name}</p>
                              {sponsor.phone && (
                                <p className="text-sm text-muted-foreground">
                                  {sponsor.phone}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{sponsor.email}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {sponsoredChildren.length === 0 ? (
                              <span className="text-muted-foreground">None</span>
                            ) : (
                              sponsoredChildren.map((child) => (
                                <Badge key={child.id} variant="secondary">
                                  {child.first_name}
                                </Badge>
                              ))
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(sponsor.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/dashboard/sponsors/${sponsor.id}`);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Mail className="h-4 w-4" />
                            </Button>
                          </div>
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
