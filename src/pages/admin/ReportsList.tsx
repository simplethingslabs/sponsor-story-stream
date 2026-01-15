import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { Plus, MoreHorizontal, Edit, Trash2, Eye, Send } from 'lucide-react';

export default function ReportsList() {
  const { reports, children, deleteReport, updateReport } = useData();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [filters, setFilters] = useState<Record<string, string>>({
    child: 'all',
    quarter: 'all',
    year: 'all',
    status: 'all',
  });
  const [sortBy, setSortBy] = useState('default');

  const getChildName = (childId: string) => {
    const child = children.find((c) => c.id === childId);
    return child ? `${child.first_name} ${child.last_name}` : 'Unknown';
  };

  // Extract unique values for filters
  const childOptions = useMemo(() => {
    return children.map((c) => ({
      value: c.id,
      label: `${c.first_name} ${c.last_name}`,
    }));
  }, [children]);

  const yearOptions = useMemo(() => {
    const years = [...new Set(reports.map((r) => r.year))].sort((a, b) => b - a);
    return years.map((year) => ({ value: year.toString(), label: year.toString() }));
  }, [reports]);

  const filterConfigs: FilterConfig[] = [
    {
      key: 'child',
      label: 'Children',
      options: childOptions,
      placeholder: 'Child',
    },
    {
      key: 'quarter',
      label: 'Quarters',
      options: [
        { value: 'Q1', label: 'Q1' },
        { value: 'Q2', label: 'Q2' },
        { value: 'Q3', label: 'Q3' },
        { value: 'Q4', label: 'Q4' },
      ],
      placeholder: 'Quarter',
    },
    {
      key: 'year',
      label: 'Years',
      options: yearOptions,
      placeholder: 'Year',
    },
    {
      key: 'status',
      label: 'Status',
      options: [
        { value: 'draft', label: 'Draft' },
        { value: 'published', label: 'Published' },
      ],
      placeholder: 'Status',
    },
  ];

  const sortOptions: SortOption[] = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'child-asc', label: 'Child Name (A-Z)' },
    { value: 'child-desc', label: 'Child Name (Z-A)' },
  ];

  const filteredAndSortedReports = useMemo(() => {
    let result = reports.filter((report) => {
      const childName = getChildName(report.child_id).toLowerCase();

      // Text search (child name or narrative content)
      const matchesSearch =
        search === '' ||
        childName.includes(search.toLowerCase()) ||
        report.growth_narrative?.toLowerCase().includes(search.toLowerCase()) ||
        report.teacher_observations?.toLowerCase().includes(search.toLowerCase());

      // Child filter
      const matchesChild =
        filters.child === 'all' || report.child_id === filters.child;

      // Quarter filter
      const matchesQuarter =
        filters.quarter === 'all' || report.quarter === filters.quarter;

      // Year filter
      const matchesYear =
        filters.year === 'all' || report.year.toString() === filters.year;

      // Status filter
      const matchesStatus =
        filters.status === 'all' || report.status === filters.status;

      return matchesSearch && matchesChild && matchesQuarter && matchesYear && matchesStatus;
    });

    // Sorting
    if (sortBy !== 'default') {
      result = [...result].sort((a, b) => {
        switch (sortBy) {
          case 'newest':
            return (
              new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
            );
          case 'oldest':
            return (
              new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime()
            );
          case 'child-asc':
            return getChildName(a.child_id).localeCompare(getChildName(b.child_id));
          case 'child-desc':
            return getChildName(b.child_id).localeCompare(getChildName(a.child_id));
          default:
            return 0;
        }
      });
    }

    return result;
  }, [reports, children, search, filters, sortBy]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleClearAll = () => {
    setSearch('');
    setFilters({ child: 'all', quarter: 'all', year: 'all', status: 'all' });
    setSortBy('default');
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteReport(deleteId);
      setDeleteId(null);
    }
  };

  const handlePublish = (reportId: string) => {
    updateReport(reportId, {
      status: 'published',
      published_at: new Date().toISOString(),
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Progress Reports</h1>
            <p className="text-muted-foreground">
              Create and manage quarterly progress reports
            </p>
          </div>
          <Button onClick={() => navigate('/dashboard/reports/new')}>
            <Plus className="mr-2 h-4 w-4" />
            Create Report
          </Button>
        </div>

        {/* Search & Filters */}
        <Card>
          <CardContent className="pt-6">
            <SearchFilterBar
              searchValue={search}
              onSearchChange={setSearch}
              searchPlaceholder="Search by child name or report content..."
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
          Showing {filteredAndSortedReports.length} of {reports.length} reports
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Child</TableHead>
                  <TableHead>Quarter</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedReports.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No reports found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAndSortedReports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell className="font-medium">
                        {getChildName(report.child_id)}
                      </TableCell>
                      <TableCell>{report.quarter}</TableCell>
                      <TableCell>{report.year}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            report.status === 'published' ? 'default' : 'secondary'
                          }
                        >
                          {report.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(report.updated_at).toLocaleDateString()}
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
                              onClick={() =>
                                navigate(`/dashboard/reports/${report.id}`)
                              }
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                navigate(`/dashboard/reports/${report.id}/edit`)
                              }
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            {report.status === 'draft' && (
                              <DropdownMenuItem
                                onClick={() => handlePublish(report.id)}
                              >
                                <Send className="mr-2 h-4 w-4" />
                                Publish
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => setDeleteId(report.id)}
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
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the report.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
