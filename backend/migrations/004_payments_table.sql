-- Migration: Create payments table for Phase 5 Payment System

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sponsor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    child_id UUID REFERENCES children(id) ON DELETE SET NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'INR',
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
    payment_method VARCHAR(20) CHECK (payment_method IN ('upi', 'bank_transfer', 'cheque', 'cash')),
    payment_date DATE,
    due_date DATE NOT NULL,
    receipt_number VARCHAR(50) UNIQUE,
    reference_number VARCHAR(100),
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by UUID REFERENCES users(id)
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_payments_sponsor ON payments(sponsor_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_payments_child ON payments(child_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_payments_due_date ON payments(due_date) WHERE deleted_at IS NULL;

-- Add updated_at trigger
DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;
CREATE TRIGGER update_payments_updated_at
    BEFORE UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to generate receipt number
CREATE OR REPLACE FUNCTION generate_receipt_number()
RETURNS TRIGGER AS $$
DECLARE
    receipt_year TEXT;
    receipt_seq INT;
BEGIN
    IF NEW.status = 'paid' AND NEW.receipt_number IS NULL THEN
        receipt_year := to_char(COALESCE(NEW.payment_date, CURRENT_DATE), 'YYYY');
        
        SELECT COALESCE(MAX(
            CAST(SUBSTRING(receipt_number FROM '\d+$') AS INT)
        ), 0) + 1
        INTO receipt_seq
        FROM payments
        WHERE receipt_number LIKE 'RCP-' || receipt_year || '-%';
        
        NEW.receipt_number := 'RCP-' || receipt_year || '-' || LPAD(receipt_seq::TEXT, 5, '0');
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger for auto-generating receipt numbers
DROP TRIGGER IF EXISTS generate_payment_receipt_number ON payments;
CREATE TRIGGER generate_payment_receipt_number
    BEFORE INSERT OR UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION generate_receipt_number();
