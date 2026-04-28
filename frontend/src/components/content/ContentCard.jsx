import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import Card from '../common/Card';
import Badge from '../common/Badge';
import StatusBadge from './StatusBadge';
import './ContentCard.css';

export default function ContentCard({ content }) {
  const navigate = useNavigate();
  const imgUrl = content.filePath ? `/uploads/${content.filePath}` : null;

  return (
    <Card clickable onClick={() => navigate(`/content/${content.id}`)} className="content-card">
      {imgUrl && <img className="content-card-image" src={imgUrl} alt={content.title} loading="lazy" />}
      <div className="content-card-body">
        <h3 className="content-card-title">{content.title}</h3>
        <div className="content-card-meta">
          <Badge variant="accent">{content.subject}</Badge>
          <StatusBadge status={content.status} />
        </div>
        <p className="content-card-date">
          {format(new Date(content.createdAt), 'MMM d, yyyy')}
        </p>
        {content.status === 'REJECTED' && content.rejectionReason && (
          <div className="content-card-rejection">
            <strong>Rejected:</strong> {content.rejectionReason}
          </div>
        )}
      </div>
    </Card>
  );
}
