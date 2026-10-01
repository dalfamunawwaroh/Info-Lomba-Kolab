import { Badge } from './Badge';

const variantMap = {
  upcoming: 'success',
  ongoing: 'info',
  completed: 'secondary',
  cancelled: 'destructive',
  pending: 'warning',
  approved: 'success',
  rejected: 'destructive',
  forming: 'warning',
  complete: 'success',
  withdrawn: 'destructive',
  waiting: 'warning',
  assigned: 'info',
  active: 'success',
  inactive: 'secondary',
};

function StatusBadge({ status, labels, className }) {
  const variant = variantMap[status] || 'secondary';
  const label = labels?.[status] || status;

  return (
    <Badge variant={variant} className={className}>
      {label}
    </Badge>
  );
}

export { StatusBadge };
