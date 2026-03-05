import { useRef, useState } from 'react';
import { SponsorLayout } from '@/components/layouts/SponsorLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  IndianRupee, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Download,
  FileText,
  CreditCard,
  Building,
  Smartphone,
  Copy,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useReactToPrint } from 'react-to-print';
import { useAuth } from '@/contexts/AuthContext';
import { usePayments, useChildren } from '@/hooks/useApi';
import { PaymentReceipt } from '@/components/payments/PaymentReceipt';
import type { Payment, PaymentStatus } from '@/types';

const statusIcons: Record<PaymentStatus, React.ElementType> = {
  paid: CheckCircle2,
  pending: Clock,
  overdue: AlertCircle,
  cancelled: AlertCircle,
};

const statusColors: Record<PaymentStatus, string> = {
  paid: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  overdue: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
};

const paymentInstructions = {
  bankName: 'State Bank of India',
  accountName: 'SponsorConnect Foundation',
  accountNumber: '12345678901234',
  ifscCode: 'SBIN0001234',
  upiId: 'sponsorconnect@sbi',
  chequeAddress: '123 Education Street, Mumbai, Maharashtra 400001',
};

export default function SponsorPayments() {
  const { user } = useAuth();
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: receiptRef,
  });

  const { data: paymentsData, isLoading: paymentsLoading } = usePayments(
    user ? { sponsor_id: user.id } : undefined
  );
  const { data: childrenData, isLoading: childrenLoading } = useChildren();

  const payments = paymentsData?.data || [];
  const allChildren = childrenData?.data || [];
  
  const nextDuePayment = payments
    .filter(p => p.status === 'pending' || p.status === 'overdue')
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())[0];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const handleViewReceipt = (payment: Payment) => {
    setSelectedPayment(payment);
    setReceiptDialogOpen(true);
  };

  const isLoading = paymentsLoading || childrenLoading;

  if (isLoading) {
    return (
      <SponsorLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </SponsorLayout>
    );
  }

  return (
    <SponsorLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Payments</h1>
          <p className="text-muted-foreground">View payment history and download tax receipts</p>
        </div>

        {nextDuePayment && (
          <Card className={nextDuePayment.status === 'overdue' ? 'border-destructive' : 'border-primary'}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  {nextDuePayment.status === 'overdue' ? (
                    <AlertCircle className="h-5 w-5 text-destructive" />
                  ) : (
                    <Clock className="h-5 w-5 text-primary" />
                  )}
                  {nextDuePayment.status === 'overdue' ? 'Payment Overdue' : 'Next Payment Due'}
                </CardTitle>
                <Badge className={statusColors[nextDuePayment.status]}>
                  {nextDuePayment.status.charAt(0).toUpperCase() + nextDuePayment.status.slice(1)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p className="text-3xl font-bold">{formatCurrency(nextDuePayment.amount)}</p>
                  <p className="text-muted-foreground">
                    Due: {new Date(nextDuePayment.due_date).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                  {nextDuePayment.child_id && (
                    <p className="text-sm text-muted-foreground mt-1">
                      For: {allChildren.find(c => c.id === nextDuePayment.child_id)?.first_name || 'Sponsored Child'}
                    </p>
                  )}
                </div>
                <Button size="lg" className="whitespace-nowrap">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Pay Now
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>Your past sponsorship payments</CardDescription>
            </CardHeader>
            <CardContent>
              {payments.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No payment history found
                </p>
              ) : (
                <div className="space-y-4">
                  {payments.map((payment) => {
                    const StatusIcon = statusIcons[payment.status];
                    const child = allChildren.find(c => c.id === payment.child_id);
                    
                    return (
                      <div 
                        key={payment.id}
                        className="flex items-center justify-between p-4 rounded-lg border"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${
                            payment.status === 'paid' 
                              ? 'bg-green-100 dark:bg-green-900' 
                              : payment.status === 'overdue'
                              ? 'bg-red-100 dark:bg-red-900'
                              : 'bg-yellow-100 dark:bg-yellow-900'
                          }`}>
                            <StatusIcon className={`h-4 w-4 ${
                              payment.status === 'paid'
                                ? 'text-green-600 dark:text-green-400'
                                : payment.status === 'overdue'
                                ? 'text-red-600 dark:text-red-400'
                                : 'text-yellow-600 dark:text-yellow-400'
                            }`} />
                          </div>
                          <div>
                            <p className="font-medium">{formatCurrency(payment.amount)}</p>
                            <p className="text-sm text-muted-foreground">
                              {child ? `${child.first_name} ${child.last_name}` : 'Sponsorship'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {payment.payment_date 
                                ? new Date(payment.payment_date).toLocaleDateString('en-IN')
                                : `Due: ${new Date(payment.due_date).toLocaleDateString('en-IN')}`
                              }
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={statusColors[payment.status]}>
                            {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                          </Badge>
                          {payment.status === 'paid' && payment.receipt_number && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleViewReceipt(payment)}
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>How to Pay</CardTitle>
              <CardDescription>Choose your preferred payment method</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Smartphone className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">UPI Payment</h3>
                </div>
                <div className="bg-muted p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">UPI ID</p>
                      <p className="font-mono font-medium">{paymentInstructions.upiId}</p>
                    </div>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => handleCopy(paymentInstructions.upiId, 'UPI ID')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Building className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Bank Transfer (NEFT/IMPS)</h3>
                </div>
                <div className="bg-muted p-4 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Account Name</p>
                      <p className="font-medium">{paymentInstructions.accountName}</p>
                    </div>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => handleCopy(paymentInstructions.accountName, 'Account name')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Account Number</p>
                      <p className="font-mono font-medium">{paymentInstructions.accountNumber}</p>
                    </div>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => handleCopy(paymentInstructions.accountNumber, 'Account number')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">IFSC Code</p>
                      <p className="font-mono font-medium">{paymentInstructions.ifscCode}</p>
                    </div>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => handleCopy(paymentInstructions.ifscCode, 'IFSC code')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Bank</p>
                    <p className="font-medium">{paymentInstructions.bankName}</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Cheque Payment</h3>
                </div>
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">
                    Make cheque payable to:
                  </p>
                  <p className="font-medium">{paymentInstructions.accountName}</p>
                  <p className="text-sm text-muted-foreground mt-3 mb-1">
                    Mail to:
                  </p>
                  <p className="text-sm">{paymentInstructions.chequeAddress}</p>
                </div>
              </div>

              <div className="bg-primary/10 border border-primary/20 p-4 rounded-lg">
                <p className="text-sm">
                  <span className="font-semibold">Note:</span> After making a payment, please email the transaction 
                  details to <span className="font-medium">payments@sponsorconnect.org</span> for faster processing.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Dialog open={receiptDialogOpen} onOpenChange={setReceiptDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>80G Tax Receipt</DialogTitle>
              <DialogDescription>
                Official tax deduction receipt for your donation
              </DialogDescription>
            </DialogHeader>
            {selectedPayment && user && (
              <>
                <div ref={receiptRef}>
                  <PaymentReceipt 
                    payment={selectedPayment}
                    sponsor={user}
                    child={allChildren.find(c => c.id === selectedPayment.child_id)}
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
    </SponsorLayout>
  );
}
