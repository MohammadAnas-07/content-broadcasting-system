import { format } from 'date-fns';
import Card from '../common/Card';
import Badge from '../common/Badge';
import ApprovalActions from './ApprovalActions';
import './ApprovalCard.css';

export default function ApprovalCard({ content, onApprove, onReject }) {
  const imgUrl = content.filePath ? `/uploads/${content.filePath}` : null;

  return (
    <Card>
      <div className="approval-card">
        {imgUrl && <img className="approval-card-thumb" src={imgUrl} alt={content.title} loading="lazy" />}
        <div className="approval-card-info">
          <h3 className="approval-card-title">{content.title}</h3>
          <p className="approval-card-teacher">
            by {content.uploadedBy?.name || 'Unknown'} · {format(new Date(content.createdAt), 'MMM d, yyyy')}
          </p>
          <div className="approval-card-meta">
            <Badge variant="accent">{content.subject}</Badge>
          </div>
        </div>
        <ApprovalActions
          contentId={content.id}
          onApprove={() => onApprove(content.id)}
          onReject={() => onReject(content)}
        />
      </div>
    </Card>
  );
}
