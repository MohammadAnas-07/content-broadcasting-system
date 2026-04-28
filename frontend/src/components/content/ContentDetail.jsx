import { format } from 'date-fns';
import Card, { CardBody } from '../common/Card';
import StatusBadge from './StatusBadge';
import Badge from '../common/Badge';
import './ContentDetail.css';

export default function ContentDetail({ content }) {
  if (!content) return null;

  return (
    <div className="content-detail">
      {content.filePath && (
        <img className="content-detail-image" src={`/uploads/${content.filePath}`} alt={content.title} />
      )}

      <Card>
        <CardBody>
          <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '8px' }}>{content.title}</h2>
          {content.description && (
            <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>{content.description}</p>
          )}

          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <Badge variant="accent">{content.subject}</Badge>
            <StatusBadge status={content.status} />
          </div>

          <div className="content-detail-grid">
            <div className="content-detail-field">
              <span className="content-detail-label">Uploaded By</span>
              <span className="content-detail-value">{content.uploadedBy?.name || `User #${content.uploadedById}`}</span>
            </div>
            <div className="content-detail-field">
              <span className="content-detail-label">Upload Date</span>
              <span className="content-detail-value">{format(new Date(content.createdAt), 'PPpp')}</span>
            </div>
            <div className="content-detail-field">
              <span className="content-detail-label">File Type</span>
              <span className="content-detail-value">{content.fileType}</span>
            </div>
            <div className="content-detail-field">
              <span className="content-detail-label">File Size</span>
              <span className="content-detail-value">{(content.fileSize / 1024).toFixed(1)} KB</span>
            </div>
            {content.startTime && (
              <div className="content-detail-field">
                <span className="content-detail-label">Start Time</span>
                <span className="content-detail-value">{format(new Date(content.startTime), 'PPpp')}</span>
              </div>
            )}
            {content.endTime && (
              <div className="content-detail-field">
                <span className="content-detail-label">End Time</span>
                <span className="content-detail-value">{format(new Date(content.endTime), 'PPpp')}</span>
              </div>
            )}
            <div className="content-detail-field">
              <span className="content-detail-label">Rotation Duration</span>
              <span className="content-detail-value">{content.rotationDurationMinutes || 5} min</span>
            </div>
            {content.approvedBy && (
              <div className="content-detail-field">
                <span className="content-detail-label">Approved By</span>
                <span className="content-detail-value">{content.approvedBy.name}</span>
              </div>
            )}
            {content.approvedAt && (
              <div className="content-detail-field">
                <span className="content-detail-label">Approved At</span>
                <span className="content-detail-value">{format(new Date(content.approvedAt), 'PPpp')}</span>
              </div>
            )}
          </div>

          {content.status === 'REJECTED' && content.rejectionReason && (
            <div className="content-detail-rejection">
              <p className="content-detail-rejection-title">Rejection Reason</p>
              <p className="content-detail-rejection-text">{content.rejectionReason}</p>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
