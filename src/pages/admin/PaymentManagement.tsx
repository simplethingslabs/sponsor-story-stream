import { useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  PlusCircle, 
  Search, 
  CheckCircle2, 
  Bell, 
  FileText,
  Download,
  Filter,
} from 'lucide-react';
import { toast } from 'sonner';
import { useReactToPrint } from 'react-to-print';
import { mockPayments, mockSponsors, mockChildren } from '@/data/mockData';
import { PaymentReceipt } from '@/components/payments/PaymentReceipt';
import type { Payment, PaymentStatus, PaymentMethod } from '@/types';

const statusColors: Record<PaymentStatus, string> = {
  paid: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  overdue: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
};

const methodLabels: Record<PaymentMethod, string> = {
  upi: 'UPI',
  bank_transfer: 'Bank Transfer',
  cheque: 'Cheque',
  cash: 'Cash',
};

export default function PaymentManagement() {
  const [searchParams] = useSearchParams();
  const initialStatus = searchParams.get('status') || 'all';
  
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [searchQuery, setSearchQuery] = useState('');
  const [recordDialogOpen, setRecordDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);
  
  const receiptRef = useRef<HTMLDivElement>(null);
  
  const handlePrint = useReactToPrint({
    contentRef: receiptRef,
  });

  // Filter payments
  const filteredPayments = mockPayments.filter(payment => {
    const sponsor = mockSponsors.find(s => s.id === payment.sponsor_id);
    const child = mockChildren.find(c => c.id === payment.child_id);
    
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    const matchesSearch = !searchQuery || 
      sponsor?.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      child?.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      child?.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.receipt_number?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Payment recorded successfully');
    setRecordDialogOpen(false);
  };

  const handleMarkAsPaid = (payment: Payment) => {
    toast.success(`Payment marked as paid for ${mockSponsors.find(s => s.id === payment.sponsor_id)?.full_name}`);
  };

  const handleSendReminder = (payment: Payment) => {
    const sponsor = mockSponsors.find(s => s.id === payment.sponsor_id);
    toast.success(`Reminder sent to ${sponsor?.full_name}`);
  };

  const handleViewReceipt = (payment: Payment) => {
    setSelectedPayment(payment);
    setReceiptDialogOpen(true);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Payment Management</h1>
            <p className="text-muted-foreground">Track and manage sponsorship payments</p>
          </div>
          <Dialog open={recordDialogOpen} onOpenChange={setRecordDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Record Payment
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Record New Payment</DialogTitle>
                <DialogDescription>
                  Manually record a payment received from a sponsor
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleRecordPayment} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="sponsor">Sponsor</Label>
                  <Select required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select sponsor" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockSponsors.map(sponsor => (
                        <SelectItem key={sponsor.id} value={sponsor.id}>
                          {sponsor.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="child">Child (Optional)</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select child" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockChildren.map(child => (
                        <SelectItem key={child.id} value={child.id}>
                          {child.first_name} {child.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount (₹)</Label>
                    <Input 
                      id="amount" 
                      type="number" 
                      placeholder="2500" 
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="method">Payment Method</Label>
                    <Select required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="upi">UPI</SelectItem>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        <SelectItem value="cheque">Cheque</SelectItem>
                        <SelectItem value="cash">Cash</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="payment_date">Payment Date</Label>
                    <Input id="payment_date" type="date" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reference">Reference Number</Label>
                    <Input id="reference" placeholder="UPI/NEFT/Cheque #" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea id="notes" placeholder="Any additional notes..." />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setRecordDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Record Payment</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by sponsor, child, or receipt number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payments Table */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Records</CardTitle>
            <CardDescription>
              {filteredPayments.length} payment{filteredPayments.length !== 1 ? 's' : ''} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sponsor</TableHead>
                    <TableHead>Child</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Receipt #</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.map((payment) => {
                    const sponsor = mockSponsors.find(s => s.id === payment.sponsor_id);
                    const child = mockChildren.find(c => c.id === payment.child_id);
                    
                    return (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">
                          {sponsor?.full_name || 'Unknown'}
                        </TableCell>
                        <TableCell>
                          {child ? `${child.first_name} ${child.last_name}` : '-'}
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(payment.amount)}
                        </TableCell>
                        <TableCell>
                          {new Date(payment.due_date).toLocaleDateString('en-IN')}
                        </TableCell>
                        <TableCell>
                          <Badge className={statusColors[payment.status]}>
                            {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {payment.payment_method ? methodLabels[payment.payment_method] : '-'}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {payment.receipt_number || '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {payment.status === 'paid' && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleViewReceipt(payment)}
                              >
                                <FileText className="h-4 w-4" />
                              </Button>
                            )}
                            {(payment.status === 'pending' || payment.status === 'overdue') && (
                              <>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleMarkAsPaid(payment)}
                                >
                                  <CheckCircle2 className="h-4 w-4" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleSendReminder(payment)}
                                >
                                  <Bell className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Receipt Dialog */}
        <Dialog open={receiptDialogOpen} onOpenChange={setReceiptDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>80G Tax Receipt</DialogTitle>
              <DialogDescription>
                Official tax deduction receipt for the donation
              </DialogDescription>
            </DialogHeader>
            {selectedPayment && (
              <>
                <div ref={receiptRef}>
                  <PaymentReceipt 
                    payment={selectedPayment}
                    sponsor={mockSponsors.find(s => s.id === selectedPayment.sponsor_id)}
                    child={mockChildren.find(c => c.id === selectedPayment.child_id)}
                  />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setReceiptDialogOpen(false)}>
                    Close
                  </Button>
                  <Button onClick={() => handlePrint()}>
                    <Download className="mr-2 h-4 w-4" />
                    Download PDF
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
