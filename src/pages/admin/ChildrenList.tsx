import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { SearchFilterBar, type FilterConfig, type SortOption } from '@/components/SearchFilterBar';
import { Plus, MoreHorizontal, Edit, Trash2, Eye, Loader2 } from 'lucide-react';
import { useChildren, useDeleteChild } from '@/hooks/useApi';
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

export default function ChildrenList() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: childrenData, isLoading, error } = useChildren();
  const deleteChildMutation = useDeleteChild();
  
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [filters, setFilters] = useState<Record<string, string>>({
    grade: 'all',
    status: 'all',
  });
  const [sortBy, setSortBy] = useState('default');

  const children = childrenData?.data || [];

  // Extract unique grades from children data
  const gradeOptions = useMemo(() => {
    const grades = [...new Set(children.map((c) => c.grade))].sort();
    return grades.map((grade) => ({ value: grade, label: grade }));
  }, [children]);

  const filterConfigs: FilterConfig[] = [
    {
      key: 'grade',
      label: 'Grades',
      options: gradeOptions,
      placeholder: 'Grade',
    },
    {
      key: 'status',
      label: 'Status',
      options: [
        { value: 'active', label: 'Active' },
        { value: 'withdrawn', label: 'Withdrawn' },
        { value: 'graduated', label: 'Graduated' },
      ],
      placeholder: 'Status',
    },
  ];

  const sortOptions: SortOption[] = [
    { value: 'name-asc', label: 'Name (A-Z)' },
    { value: 'name-desc', label: 'Name (Z-A)' },
    { value: 'age-asc', label: 'Age (Youngest)' },
    { value: 'age-desc', label: 'Age (Oldest)' },
    { value: 'enrolled-newest', label: 'Newest Enrolled' },
    { value: 'enrolled-oldest', label: 'Oldest Enrolled' },
  ];

  const filteredAndSortedChildren = useMemo(() => {
    let result = children.filter((child) => {
      // Text search
      const matchesSearch =
        search === '' ||
        child.first_name.toLowerCase().includes(search.toLowerCase()) ||
        child.last_name.toLowerCase().includes(search.toLowerCase()) ||
        child.grade.toLowerCase().includes(search.toLowerCase());

      // Grade filter
      const matchesGrade =
        filters.grade === 'all' || child.grade === filters.grade;

      // Status filter
      const matchesStatus =
        filters.status === 'all' || child.status === filters.status;

      return matchesSearch && matchesGrade && matchesStatus;
    });

    // Sorting
    if (sortBy !== 'default') {
      result = [...result].sort((a, b) => {
        switch (sortBy) {
          case 'name-asc':
            return `${a.first_name} ${a.last_name}`.localeCompare(
              `${b.first_name} ${b.last_name}`
            );
          case 'name-desc':
            return `${b.first_name} ${b.last_name}`.localeCompare(
              `${a.first_name} ${a.last_name}`
            );
          case 'age-asc':
            return (
              new Date(b.date_of_birth).getTime() -
              new Date(a.date_of_birth).getTime()
            );
          case 'age-desc':
            return (
              new Date(a.date_of_birth).getTime() -
              new Date(b.date_of_birth).getTime()
            );
          case 'enrolled-newest':
            return (
              new Date(b.enrollment_date).getTime() -
              new Date(a.enrollment_date).getTime()
            );
          case 'enrolled-oldest':
            return (
              new Date(a.enrollment_date).getTime() -
              new Date(b.enrollment_date).getTime()
            );
          default:
            return 0;
        }
      });
    }

    return result;
  }, [children, search, filters, sortBy]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleClearAll = () => {
    setSearch('');
    setFilters({ grade: 'all', status: 'all' });
    setSortBy('default');
  };

  const handleDelete = async () => {
    if (deleteId) {
      try {
        await deleteChildMutation.mutateAsync(deleteId);
        toast({
          title: 'Success',
          description: 'Child deleted successfully',
        });
      } catch (error) {
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to delete child',
          variant: 'destructive',
        });
      }
      setDeleteId(null);
    }
  };

  if (error) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-destructive">Error loading children: {error.message}</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Children</h1>
            <p className="text-muted-foreground">
              Manage all enrolled children in the program
            </p>
          </div>
          <Button onClick={() => navigate('/dashboard/children/new')}>
            <Plus className="mr-2 h-4 w-4" />
            Add Child
          </Button>
        </div>

        {/* Search & Filters */}
        <Card>
          <CardContent className="pt-6">
            <SearchFilterBar
              searchValue={search}
              onSearchChange={setSearch}
              searchPlaceholder="Search by name or grade..."
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
          Showing {filteredAndSortedChildren.length} of {children.length} children
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Child</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Age</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Enrolled</TableHead>
                    <TableHead className="w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedChildren.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        No children found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAndSortedChildren.map((child) => (
                      <TableRow key={child.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={child.photo_url} />
                              <AvatarFallback className="bg-primary/10 text-primary">
                                {child.first_name[0]}
                                {child.last_name[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">
                                {child.first_name} {child.last_name}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{child.grade}</TableCell>
                        <TableCell>{calculateAge(child.date_of_birth)} years</TableCell>
                        <TableCell>
                          <Badge
                            variant={child.status === 'active' ? 'default' : 'secondary'}
                          >
                            {child.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(child.enrollment_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-background">
                              <DropdownMenuItem
                                onClick={() => navigate(`/dashboard/children/${child.id}`)}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => navigate(`/dashboard/children/${child.id}/edit`)}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => setDeleteId(child.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the child's
              record and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive">
              {deleteChildMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
