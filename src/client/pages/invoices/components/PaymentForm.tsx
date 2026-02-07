import { VStack } from '@chakra-ui/react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';

interface PaymentFormProps {
  balanceDue: number;
  onSubmit: (data: {
    amount: number;
    paymentMethod: string;
    reference?: string;
    notes?: string;
    paymentDate?: string;
  }) => void;
  isLoading?: boolean;
}

export function PaymentForm({ balanceDue, onSubmit, isLoading }: PaymentFormProps) {
  const [amount, setAmount] = useState(balanceDue.toFixed(2));
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      amount: parseFloat(amount),
      paymentMethod,
      paymentDate: paymentDate ? new Date(paymentDate).toISOString() : undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <VStack spacing={4} align="stretch">
        <div>
          <Label htmlFor="paymentMethod">Payment Method *</Label>
          <select
            id="paymentMethod"
            className="w-full mt-1 px-3 py-2 border rounded-md"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            required
            disabled={isLoading}
          >
            <option value="CASH">Cash</option>
            <option value="BANK_TRANSFER">Online</option>
          </select>
          <p className="text-xs text-muted-foreground mt-1">
            Online or Cash
          </p>
        </div>

        <div>
          <Label htmlFor="amount">Amount *</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            min="0"
            max={balanceDue}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>

        <div>
          <Label htmlFor="paymentDate">Payment Date *</Label>
          <Input
            id="paymentDate"
            type="date"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>
      </VStack>
    </form>
  );
}
