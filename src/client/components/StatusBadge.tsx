import { Badge } from './ui/badge';

type SubscriptionStatus = 'DRAFT' | 'QUOTATION' | 'CONFIRMED' | 'ACTIVE' | 'CLOSED';
type InvoiceStatus = 'DRAFT' | 'CONFIRMED' | 'PAID' | 'CANCELED';

interface StatusBadgeProps {
  status: SubscriptionStatus | InvoiceStatus;
  type: 'subscription' | 'invoice';
}

export function StatusBadge({ status, type }: StatusBadgeProps) {
  const getVariant = () => {
    if (type === 'subscription') {
      switch (status as SubscriptionStatus) {
        case 'DRAFT':
          return 'secondary';
        case 'QUOTATION':
          return 'outline';
        case 'CONFIRMED':
          return 'default';
        case 'ACTIVE':
          return 'default';
        case 'CLOSED':
          return 'secondary';
        default:
          return 'secondary';
      }
    } else {
      switch (status as InvoiceStatus) {
        case 'DRAFT':
          return 'secondary';
        case 'CONFIRMED':
          return 'default';
        case 'PAID':
          return 'default';
        case 'CANCELED':
          return 'destructive';
        default:
          return 'secondary';
      }
    }
  };

  const getColorClass = () => {
    if (type === 'subscription') {
      switch (status as SubscriptionStatus) {
        case 'DRAFT':
          return 'bg-gray-100 text-gray-800';
        case 'QUOTATION':
          return 'bg-blue-100 text-blue-800';
        case 'CONFIRMED':
          return 'bg-purple-100 text-purple-800';
        case 'ACTIVE':
          return 'bg-green-100 text-green-800';
        case 'CLOSED':
          return 'bg-gray-100 text-gray-800';
        default:
          return '';
      }
    } else {
      switch (status as InvoiceStatus) {
        case 'DRAFT':
          return 'bg-gray-100 text-gray-800';
        case 'CONFIRMED':
          return 'bg-yellow-100 text-yellow-800';
        case 'PAID':
          return 'bg-green-100 text-green-800';
        case 'CANCELED':
          return 'bg-red-100 text-red-800';
        default:
          return '';
      }
    }
  };

  return (
    <Badge variant={getVariant()} className={getColorClass()}>
      {status}
    </Badge>
  );
}
