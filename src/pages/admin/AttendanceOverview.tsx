import { useMemo, useState } from 'react';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EmptyState } from '@/components/EmptyState';
import { ClipboardCheck, Loader2 } from 'lucide-react';
import { useChildren, useReports } from '@/hooks/useApi';

function getCurrentQuarter() {
  const month = new Date().getMonth();
  if (month < 3) return 'Q1';
  if (month < 6) return 'Q2';
  if (month < 9) return 'Q3';
  return 'Q4';
}

export default function AttendanceOverview() {
  const [quarter, setQuarter] = useState<'Q1' | 'Q2' | 'Q3' | 'Q4'>(getCurrentQuarter() as any);
  const [year, setYear] = useState(new Date().getFullYear());

  const { data: childrenData, isLoading: childrenLoading } = useChildren({ status: 'active' });
  const { data: reportsData, isLoading: reportsLoading } = useReports();

  const children = childrenData?.data || [];
  const allReports = reportsData?.data || [];
  const isLoading = childrenLoading || reportsLoading;

  const attendanceByChild = useMemo(() => {
    const map = new Map<string, number>();
    allReports
      .filter(r => r.status === 'published' && r.quarter === quarter && r.year === year && r.attendance_percentage != null)
      .forEach(r => map.set(r.child_id, r.attendance_percentage as number));
    return map;
  }, [allReports, quarter, year]);

  const reportedCount = children.filter(c => attendanceByChild.has(c.id)).length;
  const avgAttendance = reportedCount > 0
    ? Math.round(
        children.reduce((sum, c) => sum + (attendanceByChild.get(c.id) || 0), 0) / reportedCount
      )
    : null;

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Attendance</h1>
            <p className="text-muted-foreground">
              Quarterly attendance percentage across all children, reported via Progress Reports
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Select value={quarter} onValueChange={(v: 'Q1' | 'Q2' | 'Q3' | 'Q4') => setQuarter(v)}>
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Q1">Q1</SelectItem>
                <SelectItem value="Q2">Q2</SelectItem>
                <SelectItem value="Q3">Q3</SelectItem>
                <SelectItem value="Q4">Q4</SelectItem>
              </SelectContent>
            </Select>
            <Select value={year.toString()} onValueChange={(v) => setYear(parseInt(v))}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Card>
          <CardContent className="p-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : avgAttendance !== null ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Average Attendance</p>
                  <p className="text-2xl font-bold">{avgAttendance}%</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {reportedCount} of {children.length} children reported for {quarter} {year}
                  </p>
                </div>
                <div className="rounded-full p-3 bg-green-100">
                  <ClipboardCheck className="h-6 w-6 text-green-600" />
                </div>
              </div>
            ) : (
              <EmptyState
                icon={ClipboardCheck}
                title="Not yet reported"
                description={`No published reports with attendance for ${quarter} ${year} yet.`}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>By Child</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : children.length === 0 ? (
              <div className="p-6">
                <EmptyState icon={ClipboardCheck} title="No active children" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Child</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Attendance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {children.map((child) => {
                    const percentage = attendanceByChild.get(child.id);
                    return (
                      <TableRow key={child.id}>
                        <TableCell className="font-medium">
                          {child.first_name} {child.last_name}
                        </TableCell>
                        <TableCell>{child.grade}</TableCell>
                        <TableCell>
                          {percentage !== undefined ? (
                            `${percentage}%`
                          ) : (
                            <span className="text-muted-foreground">Not yet reported</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
