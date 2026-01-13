import { useState } from 'react';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, Search, MoreHorizontal, Mail, UserX } from 'lucide-react';
import { mockSponsors, mockSponsorships, mockChildren } from '@/data/mockData';

export default function SponsorsList() {
  const [search, setSearch] = useState('');

  const getSponsoredChildren = (sponsorId: string) => {
    const childIds = mockSponsorships
      .filter((s) => s.sponsor_id === sponsorId && s.status === 'active')
      .map((s) => s.child_id);
    return mockChildren.filter((c) => childIds.includes(c.id));
  };

  const filteredSponsors = mockSponsors.filter(
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
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Invite Sponsor
          </Button>
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
                  <TableHead className="w-[80px]">Actions</TableHead>
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
                    const sponsoredChildren = getSponsoredChildren(sponsor.id);
                    return (
                      <TableRow key={sponsor.id}>
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
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Mail className="mr-2 h-4 w-4" />
                                Send Email
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive">
                                <UserX className="mr-2 h-4 w-4" />
                                Remove Sponsor
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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
