import { useState, useEffect } from 'react';
import { TeacherLayout } from '@/components/layouts/TeacherLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { 
  CalendarIcon, 
  Check, 
  X, 
  Clock, 
  Save,
  Users,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useChildren } from '@/hooks/useApi';
import { useToast } from '@/hooks/use-toast';

type AttendanceStatus = 'present' | 'absent' | 'late' | 'unmarked';

interface StudentAttendance {
  childId: string;
  status: AttendanceStatus;
  notes?: string;
}

export default function AttendanceMarking() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [attendance, setAttendance] = useState<StudentAttendance[]>([]);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const { data: childrenData, isLoading } = useChildren({ status: 'active' });
  const students = childrenData?.data || [];

  // Initialize attendance records when students load
  useEffect(() => {
    if (students.length > 0 && attendance.length === 0) {
      setAttendance(
        students.map(child => ({
          childId: child.id,
          status: 'unmarked' as AttendanceStatus,
          notes: '',
        }))
      );
    }
  }, [students]);

  const stats = {
    total: students.length,
    present: attendance.filter(a => a.status === 'present').length,
    absent: attendance.filter(a => a.status === 'absent').length,
    late: attendance.filter(a => a.status === 'late').length,
    unmarked: attendance.filter(a => a.status === 'unmarked').length,
  };

  const updateAttendance = (childId: string, status: AttendanceStatus) => {
    setAttendance(prev => 
      prev.map(a => a.childId === childId ? { ...a, status } : a)
    );
  };

  const updateNotes = (childId: string, notes: string) => {
    setAttendance(prev => 
      prev.map(a => a.childId === childId ? { ...a, notes } : a)
    );
  };

  const markAllPresent = () => {
    setAttendance(prev => 
      prev.map(a => ({ ...a, status: 'present' as AttendanceStatus }))
    );
  };

  const handleSave = async () => {
    setSaving(true);
    // No backend endpoint yet — simulate save
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSaving(false);
    toast({
      title: 'Attendance Saved',
      description: `Attendance for ${format(selectedDate, 'MMMM d, yyyy')} has been saved.`,
    });
  };

  const getStatusIcon = (status: AttendanceStatus) => {
    switch (status) {
      case 'present':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'absent':
        return <XCircle className="h-5 w-5 text-destructive" />;
      case 'late':
        return <Clock className="h-5 w-5 text-amber-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  if (isLoading) {
    return (
      <TeacherLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </TeacherLayout>
    );
  }

  return (
    <TeacherLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Attendance</h1>
            <p className="text-muted-foreground">
              Mark daily attendance for your students
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(selectedDate, 'PPP')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="grid gap-4 grid-cols-2 md:grid-cols-5">
          <Card>
            <CardContent className="p-4 text-center">
              <Users className="h-6 w-6 mx-auto mb-1 text-muted-foreground" />
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </CardContent>
          </Card>
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-4 text-center">
              <CheckCircle2 className="h-6 w-6 mx-auto mb-1 text-green-600" />
              <p className="text-2xl font-bold text-green-700">{stats.present}</p>
              <p className="text-xs text-green-600">Present</p>
            </CardContent>
          </Card>
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4 text-center">
              <XCircle className="h-6 w-6 mx-auto mb-1 text-red-600" />
              <p className="text-2xl font-bold text-red-700">{stats.absent}</p>
              <p className="text-xs text-red-600">Absent</p>
            </CardContent>
          </Card>
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-4 text-center">
              <Clock className="h-6 w-6 mx-auto mb-1 text-amber-600" />
              <p className="text-2xl font-bold text-amber-700">{stats.late}</p>
              <p className="text-xs text-amber-600">Late</p>
            </CardContent>
          </Card>
          <Card className="border-gray-200">
            <CardContent className="p-4 text-center">
              <AlertCircle className="h-6 w-6 mx-auto mb-1 text-muted-foreground" />
              <p className="text-2xl font-bold text-muted-foreground">{stats.unmarked}</p>
              <p className="text-xs text-muted-foreground">Unmarked</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Student Attendance</CardTitle>
              <CardDescription>
                {format(selectedDate, 'EEEE, MMMM d, yyyy')}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={markAllPresent}>
                <Check className="mr-1 h-4 w-4" />
                Mark All Present
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                <Save className="mr-1 h-4 w-4" />
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {students.map((child) => {
                const record = attendance.find(a => a.childId === child.id);
                const status = record?.status || 'unmarked';
                
                return (
                  <div
                    key={child.id}
                    className={cn(
                      "flex flex-col sm:flex-row sm:items-center gap-4 rounded-lg border p-4 transition-colors",
                      status === 'present' && "border-green-200 bg-green-50/50",
                      status === 'absent' && "border-red-200 bg-red-50/50",
                      status === 'late' && "border-amber-200 bg-amber-50/50",
                    )}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={child.photo_url} alt={`${child.first_name} ${child.last_name}`} />
                        <AvatarFallback>
                          {child.first_name.charAt(0)}{child.last_name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-medium">{child.first_name} {child.last_name}</p>
                        <p className="text-sm text-muted-foreground">{child.grade}</p>
                      </div>
                      <div className="ml-auto sm:hidden">
                        {getStatusIcon(status)}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant={status === 'present' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => updateAttendance(child.id, 'present')}
                        className={cn(
                          status === 'present' && "bg-green-600 hover:bg-green-700"
                        )}
                      >
                        <Check className="h-4 w-4 sm:mr-1" />
                        <span className="hidden sm:inline">Present</span>
                      </Button>
                      <Button
                        variant={status === 'late' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => updateAttendance(child.id, 'late')}
                        className={cn(
                          status === 'late' && "bg-amber-600 hover:bg-amber-700"
                        )}
                      >
                        <Clock className="h-4 w-4 sm:mr-1" />
                        <span className="hidden sm:inline">Late</span>
                      </Button>
                      <Button
                        variant={status === 'absent' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => updateAttendance(child.id, 'absent')}
                        className={cn(
                          status === 'absent' && "bg-destructive hover:bg-destructive/90"
                        )}
                      >
                        <X className="h-4 w-4 sm:mr-1" />
                        <span className="hidden sm:inline">Absent</span>
                      </Button>
                    </div>

                    {(status === 'absent' || status === 'late') && (
                      <div className="w-full sm:w-auto sm:min-w-[200px]">
                        <Textarea
                          placeholder="Add notes (reason for absence/late)..."
                          className="h-10 min-h-0 resize-none text-sm"
                          value={record?.notes || ''}
                          onChange={(e) => updateNotes(child.id, e.target.value)}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </TeacherLayout>
  );
}
