import { Check, X } from 'lucide-react';
import Button from '../common/Button';
import './ApprovalActions.css';

export default function ApprovalActions({ onApprove, onReject }) {
  return (
    <div className="approval-actions">
      <Button variant="success" size="sm" icon={Check} onClick={onApprove}>
        Approve
      </Button>
      <Button variant="danger" size="sm" icon={X} onClick={onReject}>
        Reject
      </Button>
    </div>
  );
}
