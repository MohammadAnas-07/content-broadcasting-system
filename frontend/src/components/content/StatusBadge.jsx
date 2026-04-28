import Badge from '../common/Badge';

export default function StatusBadge({ status }) {
  return (
    <Badge variant={status} dot>
      {status}
    </Badge>
  );
}
