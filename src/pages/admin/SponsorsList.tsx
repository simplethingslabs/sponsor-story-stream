import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { SearchFilterBar, type FilterConfig, type SortOption } from '@/components/SearchFilterBar';
import { Plus, MoreHorizontal, Eye, UserCheck, Mail, UserX } from 'lucide-react';

export default function SponsorsList() {
  const navigate = useNavigate();
  const { sponsors, getChildrenForSponsor, pendingRegistrations, deleteSponsor } = useData();
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({
    sponsorship: 'all',
  });
  const [sortBy, setSortBy] = useState('default');

  const pendingCount = pendingRegistrations.filter((r) => r.status === 'pending').length;

  const filterConfigs: FilterConfig[] = [
    {
      key: 'sponsorship',
      label: 'Status',
      options: [
        { value: 'active', label: 'Active (Sponsoring)' },
        { value: 'inactive', label: 'Inactive (No Children)' },
      ],
      placeholder: 'Sponsorship Status',
    },
  ];

  const sortOptions: SortOption[] = [
    { value: 'name-asc', label: 'Name (A-Z)' },
    { value: 'name-desc', label: 'Name (Z-A)' },
    { value: 'children-most', label: 'Most Children' },
    { value: 'children-least', label: 'Least Children' },
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
  ];

  const filteredAndSortedSponsors = useMemo(() => {
    let result = sponsors.filter((sponsor) => {
      // Text search
      const matchesSearch =
        search === '' ||
        sponsor.full_name.toLowerCase().includes(search.toLowerCase()) ||
        sponsor.email.toLowerCase().includes(search.toLowerCase());

      // Sponsorship status filter
      let matchesSponsorshipStatus = true;
      if (filters.sponsorship !== 'all') {
        const sponsoredChildren = getChildrenForSponsor(sponsor.id);
        const isActive = sponsoredChildren.length > 0;
        matchesSponsorshipStatus =
          (filters.sponsorship === 'active' && isActive) ||
          (filters.sponsorship === 'inactive' && !isActive);
      }

      return matchesSearch && matchesSponsorshipStatus;
    });

    // Sorting
    if (sortBy !== 'default') {
      result = [...result].sort((a, b) => {
        switch (sortBy) {
          case 'name-asc':
            return a.full_name.localeCompare(b.full_name);
          case 'name-desc':
            return b.full_name.localeCompare(a.full_name);
          case 'children-most':
            return (
              getChildrenForSponsor(b.id).length -
              getChildrenForSponsor(a.id).length
            );
          case 'children-least':
            return (
              getChildrenForSponsor(a.id).length -
              getChildrenForSponsor(b.id).length
            );
          case 'newest':
            return (
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );
          case 'oldest':
            return (
              new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            );
          default:
            return 0;
        }
      });
    }

    return result;
  }, [sponsors, search, filters, sortBy, getChildrenForSponsor]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleClearAll = () => {
    setSearch('');
    setFilters({ sponsorship: 'all' });
    setSortBy('default');
  };

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

        {/* Search & Filters */}
        <Card>
          <CardContent className="pt-6">
            <SearchFilterBar
              searchValue={search}
              onSearchChange={setSearch}
              searchPlaceholder="Search by name or email..."
              filters={filterConfigs}
              filterValues={filters}
              onFilterChange={handleFilterChange}
              sortOptions={sortOptions}
              sortValue={sortBy}
              onSortChange={setSortBy}
              onClearAll={handleClearAll}
            />
          </CardContent>
        </Card>

        {/* Results Count */}
        <div className="text-sm text-muted-foreground">
          Showing {filteredAndSortedSponsors.length} of {sponsors.length} sponsors
        </div>

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
                {filteredAndSortedSponsors.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      No sponsors found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAndSortedSponsors.map((sponsor) => {
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
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-background">
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/dashboard/sponsors/${sponsor.id}`);
                                }}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/dashboard/sponsorships`);
                                }}
                              >
                                <UserCheck className="mr-2 h-4 w-4" />
                                Manage Sponsorships
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.location.href = `mailto:${sponsor.email}`;
                                }}
                              >
                                <Mail className="mr-2 h-4 w-4" />
                                Send Email
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteSponsor(sponsor.id);
                                }}
                                className="text-destructive"
                              >
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
