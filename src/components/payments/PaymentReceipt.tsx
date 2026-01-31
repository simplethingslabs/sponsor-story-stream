import type { Payment, Child, UserWithRoles } from '@/types';

interface PaymentReceiptProps {
  payment: Payment;
  sponsor?: UserWithRoles;
  child?: Child;
}

// Helper function to convert number to words (Indian numbering)
function numberToWords(num: number): string {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  if (num === 0) return 'Zero';
  
  if (num < 20) return ones[num];
  if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? ' ' + ones[num % 10] : '');
  if (num < 1000) return ones[Math.floor(num / 100)] + ' Hundred' + (num % 100 ? ' ' + numberToWords(num % 100) : '');
  if (num < 100000) return numberToWords(Math.floor(num / 1000)) + ' Thousand' + (num % 1000 ? ' ' + numberToWords(num % 1000) : '');
  if (num < 10000000) return numberToWords(Math.floor(num / 100000)) + ' Lakh' + (num % 100000 ? ' ' + numberToWords(num % 100000) : '');
  return numberToWords(Math.floor(num / 10000000)) + ' Crore' + (num % 10000000 ? ' ' + numberToWords(num % 10000000) : '');
}

export function PaymentReceipt({ payment, sponsor, child }: PaymentReceiptProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const receiptDate = payment.payment_date 
    ? new Date(payment.payment_date).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : new Date().toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });

  return (
    <div className="bg-white text-black p-8 print:p-4" style={{ fontFamily: 'Georgia, serif' }}>
      {/* Header */}
      <div className="text-center border-b-2 border-black pb-4 mb-6">
        <h1 className="text-2xl font-bold uppercase tracking-wide">SponsorConnect Foundation</h1>
        <p className="text-sm mt-1">Registered under Societies Registration Act, 1860</p>
        <p className="text-sm">123 Education Street, Mumbai, Maharashtra 400001</p>
        <p className="text-sm">Tel: +91-22-1234-5678 | Email: donations@sponsorconnect.org</p>
        <div className="mt-3 inline-block border-2 border-black px-4 py-1">
          <span className="font-bold">80G Registration No:</span> AAATF1234EF20214
        </div>
      </div>

      {/* Receipt Title */}
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold uppercase border-2 border-black inline-block px-6 py-2">
          Official Receipt for Donation
        </h2>
      </div>

      {/* Receipt Details */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <p><span className="font-bold">Receipt No:</span> {payment.receipt_number || 'N/A'}</p>
          <p><span className="font-bold">Date:</span> {receiptDate}</p>
        </div>
        <div className="text-right">
          <p><span className="font-bold">Financial Year:</span> 2025-26</p>
          <p><span className="font-bold">Payment Mode:</span> {payment.payment_method?.toUpperCase().replace('_', ' ') || 'N/A'}</p>
        </div>
      </div>

      {/* Donor Details */}
      <div className="border border-black p-4 mb-6">
        <h3 className="font-bold text-lg mb-2 border-b border-black pb-1">Donor Details</h3>
        <div className="grid grid-cols-2 gap-2">
          <p><span className="font-bold">Name:</span> {sponsor?.full_name || 'N/A'}</p>
          <p><span className="font-bold">Email:</span> {sponsor?.email || 'N/A'}</p>
          <p><span className="font-bold">Phone:</span> {sponsor?.phone || 'N/A'}</p>
          <p><span className="font-bold">Donor ID:</span> {sponsor?.id?.slice(0, 8).toUpperCase() || 'N/A'}</p>
        </div>
      </div>

      {/* Donation Details */}
      <div className="border border-black p-4 mb-6">
        <h3 className="font-bold text-lg mb-2 border-b border-black pb-1">Donation Details</h3>
        <table className="w-full">
          <tbody>
            <tr>
              <td className="py-2 font-bold">Purpose:</td>
              <td className="py-2">Child Sponsorship Program</td>
            </tr>
            {child && (
              <tr>
                <td className="py-2 font-bold">Beneficiary:</td>
                <td className="py-2">{child.first_name} {child.last_name} (ID: {child.id.slice(0, 8).toUpperCase()})</td>
              </tr>
            )}
            <tr>
              <td className="py-2 font-bold">Amount (in figures):</td>
              <td className="py-2 text-xl font-bold">{formatCurrency(payment.amount)}</td>
            </tr>
            <tr>
              <td className="py-2 font-bold">Amount (in words):</td>
              <td className="py-2 italic">Rupees {numberToWords(payment.amount)} Only</td>
            </tr>
            {payment.reference_number && (
              <tr>
                <td className="py-2 font-bold">Transaction Ref:</td>
                <td className="py-2 font-mono">{payment.reference_number}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Tax Exemption Note */}
      <div className="bg-gray-100 border border-black p-4 mb-6 text-sm">
        <p className="font-bold mb-2">Tax Exemption Certificate:</p>
        <p>
          This donation is eligible for tax exemption under Section 80G of the Income Tax Act, 1961.
          The donor is entitled to claim 50% deduction of the donated amount from their taxable income.
        </p>
        <p className="mt-2">
          <span className="font-bold">80G Order No:</span> AAATF1234EF20214 | 
          <span className="font-bold ml-2">Valid From:</span> 01/04/2021 | 
          <span className="font-bold ml-2">PAN:</span> AAATF1234E
        </p>
      </div>

      {/* Signatures */}
      <div className="grid grid-cols-2 gap-8 mt-8">
        <div className="text-center">
          <div className="h-16 border-b border-black mb-2"></div>
          <p className="font-bold">Authorized Signatory</p>
          <p className="text-sm">SponsorConnect Foundation</p>
        </div>
        <div className="text-center">
          <div className="h-16 border-b border-black mb-2 flex items-end justify-center pb-1">
            <span className="text-4xl font-bold text-gray-300">PAID</span>
          </div>
          <p className="font-bold">Official Stamp</p>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 pt-4 border-t border-black text-center text-xs text-gray-600">
        <p>This is a computer-generated receipt. For any queries, please contact donations@sponsorconnect.org</p>
        <p className="mt-1">Thank you for your generous contribution towards children's education.</p>
      </div>
    </div>
  );
}
