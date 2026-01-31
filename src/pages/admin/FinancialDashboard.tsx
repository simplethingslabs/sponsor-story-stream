import { AdminLayout } from '@/components/layouts/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  IndianRupee, 
  TrendingUp, 
  AlertCircle, 
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  PlusCircle,
  Bell,
  FileText,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { mockPayments, getPaymentStats, mockSponsors, mockChildren } from '@/data/mockData';

// Monthly collection trend data
const collectionTrend = [
  { month: 'Aug', amount: 45000 },
  { month: 'Sep', amount: 52000 },
  { month: 'Oct', amount: 48000 },
  { month: 'Nov', amount: 55000 },
  { month: 'Dec', amount: 62000 },
  { month: 'Jan', amount: 58000 },
];

export default function FinancialDashboard() {
  const stats = getPaymentStats();
  
  // Status breakdown for pie chart
  const statusBreakdown = [
    { name: 'Paid', value: mockPayments.filter(p => p.status === 'paid').length, color: 'hsl(var(--chart-2))' },
    { name: 'Pending', value: mockPayments.filter(p => p.status === 'pending').length, color: 'hsl(var(--chart-4))' },
    { name: 'Overdue', value: mockPayments.filter(p => p.status === 'overdue').length, color: 'hsl(var(--destructive))' },
  ];

  // Recent overdue payments
  const overduePayments = mockPayments
    .filter(p => p.status === 'overdue')
    .map(p => ({
      ...p,
      sponsor: mockSponsors.find(s => s.id === p.sponsor_id),
      child: mockChildren.find(c => c.id === p.child_id),
    }));

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Financial Dashboard</h1>
            <p className="text-muted-foreground">Overview of sponsorship payments and collections</p>
          </div>
          <div className="flex gap-2">
            <Button asChild>
              <Link to="/dashboard/payments">
                <PlusCircle className="mr-2 h-4 w-4" />
                Record Payment
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Collected (All Time)
              </CardTitle>
              <IndianRupee className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalCollected)}</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <ArrowUpRight className="h-3 w-3 text-green-500" />
                <span className="text-green-500">12%</span> from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                This Month
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.thisMonthCollected)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Collected in January 2026
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Payments
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.pendingAmount)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.pendingCount} payment{stats.pendingCount !== 1 ? 's' : ''} due
              </p>
            </CardContent>
          </Card>

          <Card className="border-destructive/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-destructive">
                Overdue
              </CardTitle>
              <AlertCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{formatCurrency(stats.overdueAmount)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.overdueCount} payment{stats.overdueCount !== 1 ? 's' : ''} overdue
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Collection Trend */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Collection Trend</CardTitle>
              <CardDescription>Monthly sponsorship collections over the past 6 months</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={collectionTrend}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis 
                      tickFormatter={(value) => `₹${value/1000}k`}
                      className="text-xs"
                    />
                    <Tooltip 
                      formatter={(value: number) => [formatCurrency(value), 'Collected']}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="amount" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--primary))' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Status Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Status</CardTitle>
              <CardDescription>Breakdown by payment status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {statusBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions & Overdue List */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common payment management tasks</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              <Button variant="outline" className="justify-start" asChild>
                <Link to="/dashboard/payments">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Record New Payment
                </Link>
              </Button>
              <Button variant="outline" className="justify-start" asChild>
                <Link to="/dashboard/payments?status=overdue">
                  <AlertCircle className="mr-2 h-4 w-4 text-destructive" />
                  View Overdue Payments
                </Link>
              </Button>
              <Button variant="outline" className="justify-start" asChild>
                <Link to="/dashboard/payments?status=pending">
                  <Clock className="mr-2 h-4 w-4" />
                  View Pending Payments
                </Link>
              </Button>
              <Button variant="outline" className="justify-start">
                <Bell className="mr-2 h-4 w-4" />
                Send Payment Reminders
              </Button>
              <Button variant="outline" className="justify-start">
                <FileText className="mr-2 h-4 w-4" />
                Generate Financial Report
              </Button>
            </CardContent>
          </Card>

          {/* Overdue Payments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                Overdue Payments
              </CardTitle>
              <CardDescription>Payments that need immediate attention</CardDescription>
            </CardHeader>
            <CardContent>
              {overduePayments.length === 0 ? (
                <p className="text-center text-muted-foreground py-6">
                  No overdue payments! 🎉
                </p>
              ) : (
                <div className="space-y-4">
                  {overduePayments.map((payment) => (
                    <div 
                      key={payment.id} 
                      className="flex items-center justify-between p-3 rounded-lg border bg-destructive/5 border-destructive/20"
                    >
                      <div>
                        <p className="font-medium">{payment.sponsor?.full_name}</p>
                        <p className="text-sm text-muted-foreground">
                          For {payment.child?.first_name} {payment.child?.last_name}
                        </p>
                        <p className="text-xs text-destructive mt-1">
                          Due: {new Date(payment.due_date).toLocaleDateString('en-IN')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-destructive">
                          {formatCurrency(payment.amount)}
                        </p>
                        <Button size="sm" variant="outline" className="mt-2">
                          Send Reminder
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
