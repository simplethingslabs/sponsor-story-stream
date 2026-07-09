import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import { useAuditLogs, useAuditStats } from '@/hooks/useApi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { CalendarIcon, ChevronDown, ChevronLeft, ChevronRight, Download, RefreshCw, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

const actionColors: Record<string, string> = {
  INSERT: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  UPDATE: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  DELETE: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

const tableLabels: Record<string, string> = {
  children: 'Children',
  progress_reports: 'Reports',
  events: 'Events',
  newsletters: 'Newsletters',
  sponsorships: 'Sponsorships',
  users: 'Users',
};

export default function AuditLogs() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  
  const page = parseInt(searchParams.get('page') || '1');
  const tableFilter = searchParams.get('table') || '';
  const actionFilter = searchParams.get('action') || '';
  const startDate = searchParams.get('start_date') || '';
  const endDate = searchParams.get('end_date') || '';
  const userSearch = searchParams.get('user') || '';
  
  const { data: logs, isLoading, refetch } = useAuditLogs({
    page,
    limit: 25,
    table_name: tableFilter || undefined,
    action: actionFilter || undefined,
    start_date: startDate || undefined,
    end_date: endDate || undefined,
  });
  
  const { data: stats } = useAuditStats(30);
  
  const updateFilter = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    newParams.set('page', '1');
    setSearchParams(newParams);
  };
  
  const toggleRowExpanded = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };
  
  const exportLogs = () => {
    if (!logs?.data) return;
    
    const csvContent = [
      ['Timestamp', 'User', 'Action', 'Table', 'Record ID'].join(','),
      ...logs.data.map(log => [
        format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss'),
        log.user_name || 'System',
        log.action,
        log.table_name,
        log.record_id,
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Audit Logs</h1>
          <p className="text-muted-foreground">Track all data changes across the system</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" onClick={exportLogs}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>
      
      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Actions (30d)</CardDescription>
              <CardTitle className="text-2xl">{stats.summary?.total_actions || 0}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Creates</CardDescription>
              <CardTitle className="text-2xl text-green-600">{stats.summary?.inserts || 0}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Updates</CardDescription>
              <CardTitle className="text-2xl text-blue-600">{stats.summary?.updates || 0}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Deletes</CardDescription>
              <CardTitle className="text-2xl text-red-600">{stats.summary?.deletes || 0}</CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}
      
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Select value={tableFilter || 'all'} onValueChange={(v) => updateFilter('table', v === 'all' ? '' : v)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Tables" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tables</SelectItem>
                <SelectItem value="children">Children</SelectItem>
                <SelectItem value="progress_reports">Reports</SelectItem>
                <SelectItem value="events">Events</SelectItem>
                <SelectItem value="newsletters">Newsletters</SelectItem>
                <SelectItem value="sponsorships">Sponsorships</SelectItem>
                <SelectItem value="users">Users</SelectItem>
              </SelectContent>
            </Select>

            <Select value={actionFilter || 'all'} onValueChange={(v) => updateFilter('action', v === 'all' ? '' : v)}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="All Actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="INSERT">Create</SelectItem>
                <SelectItem value="UPDATE">Update</SelectItem>
                <SelectItem value="DELETE">Delete</SelectItem>
              </SelectContent>
            </Select>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-40">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(new Date(startDate), 'MMM d, yyyy') : 'Start Date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={startDate ? new Date(startDate) : undefined}
                  onSelect={(date) => updateFilter('start_date', date ? format(date, 'yyyy-MM-dd') : '')}
                />
              </PopoverContent>
            </Popover>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-40">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(new Date(endDate), 'MMM d, yyyy') : 'End Date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={endDate ? new Date(endDate) : undefined}
                  onSelect={(date) => updateFilter('end_date', date ? format(date, 'yyyy-MM-dd') : '')}
                />
              </PopoverContent>
            </Popover>
            
            {(tableFilter || actionFilter || startDate || endDate) && (
              <Button variant="ghost" onClick={() => setSearchParams({ page: '1' })}>
                Clear Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Logs Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10"></TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Table</TableHead>
                <TableHead>Record ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={6}>
                      <Skeleton className="h-10 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : logs?.data?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No audit logs found
                  </TableCell>
                </TableRow>
              ) : (
                logs?.data?.map((log: any) => (
                  <Collapsible key={log.id} asChild>
                    <>
                      <TableRow className="cursor-pointer hover:bg-muted/50" onClick={() => toggleRowExpanded(log.id)}>
                        <TableCell>
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm" className="p-0 h-6 w-6">
                              <ChevronDown className={cn(
                                "h-4 w-4 transition-transform",
                                expandedRows.has(log.id) && "rotate-180"
                              )} />
                            </Button>
                          </CollapsibleTrigger>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {format(new Date(log.created_at), 'MMM d, yyyy HH:mm:ss')}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{log.user_name || 'System'}</div>
                            <div className="text-xs text-muted-foreground">{log.user_email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={actionColors[log.action] || ''}>
                            {log.action}
                          </Badge>
                        </TableCell>
                        <TableCell>{tableLabels[log.table_name] || log.table_name}</TableCell>
                        <TableCell className="font-mono text-xs">{log.record_id.slice(0, 8)}...</TableCell>
                      </TableRow>
                      <CollapsibleContent asChild>
                        <TableRow className="bg-muted/30">
                          <TableCell colSpan={6} className="p-4">
                            <div className="grid gap-4 md:grid-cols-2">
                              {log.old_data && (
                                <div>
                                  <h4 className="font-medium mb-2 text-sm">Previous Data</h4>
                                  <pre className="text-xs bg-muted p-3 rounded-md overflow-auto max-h-48">
                                    {JSON.stringify(log.old_data, null, 2)}
                                  </pre>
                                </div>
                              )}
                              {log.new_data && (
                                <div>
                                  <h4 className="font-medium mb-2 text-sm">New Data</h4>
                                  <pre className="text-xs bg-muted p-3 rounded-md overflow-auto max-h-48">
                                    {JSON.stringify(log.new_data, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      </CollapsibleContent>
                    </>
                  </Collapsible>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
        
        {/* Pagination */}
        {logs && logs.total > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <div className="text-sm text-muted-foreground">
              Showing {((page - 1) * 25) + 1} to {Math.min(page * 25, logs.total)} of {logs.total} entries
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => updateFilter('page', String(page - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!logs.hasMore}
                onClick={() => updateFilter('page', String(page + 1))}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
