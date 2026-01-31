import { AdminLayout } from '@/components/layouts/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  IndianRupee, 
  TrendingUp, 
  AlertCircle, 
  Clock,
  ArrowUpRight,
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
import { usePaymentStats, usePayments } from '@/hooks/useApi';

export default function FinancialDashboard() {
  const { data: stats, isLoading: statsLoading } = usePaymentStats();
  const { data: paymentsData, isLoading: paymentsLoading } = usePayments({ status: 'overdue', limit: '5' });

  const overduePayments = paymentsData?.data || [];

  // Collection trend from API or fallback
  const collectionTrend = stats?.collectionTrend || [];

  // Status breakdown for pie chart
  const statusBreakdown = stats?.statusBreakdown?.map(s => ({
    name: s.status.charAt(0).toUpperCase() + s.status.slice(1),
    value: s.count,
    color: s.status === 'paid' 
      ? 'hsl(var(--chart-2))' 
      : s.status === 'pending' 
        ? 'hsl(var(--chart-4))' 
        : 'hsl(var(--destructive))',
  })) || [];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const isLoading = statsLoading || paymentsLoading;

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
              {statsLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{formatCurrency(stats?.totalCollected || 0)}</div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <ArrowUpRight className="h-3 w-3 text-green-500" />
                    <span className="text-green-500">12%</span> from last month
                  </p>
                </>
              )}
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
              {statsLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{formatCurrency(stats?.thisMonthCollected || 0)}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Collected this month
                  </p>
                </>
              )}
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
              {statsLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{formatCurrency(stats?.pendingAmount || 0)}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats?.pendingCount || 0} payment{(stats?.pendingCount || 0) !== 1 ? 's' : ''} due
                  </p>
                </>
              )}
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
              {statsLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-destructive">{formatCurrency(stats?.overdueAmount || 0)}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats?.overdueCount || 0} payment{(stats?.overdueCount || 0) !== 1 ? 's' : ''} overdue
                  </p>
                </>
              )}
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
                {statsLoading ? (
                  <div className="h-full flex items-center justify-center">
                    <Skeleton className="h-full w-full" />
                  </div>
                ) : collectionTrend.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    No payment data available yet
                  </div>
                ) : (
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
                )}
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
                {statsLoading ? (
                  <div className="h-full flex items-center justify-center">
                    <Skeleton className="h-full w-full" />
                  </div>
                ) : statusBreakdown.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    No payment data available yet
                  </div>
                ) : (
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
                )}
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
              {paymentsLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : overduePayments.length === 0 ? (
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
                        <p className="font-medium">{payment.sponsor_name}</p>
                        <p className="text-sm text-muted-foreground">
                          For {payment.child_name || 'General Support'}
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
