import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { contentService } from '../services/content.service';
import ContentDetailComp from '../components/content/ContentDetail';
import Button from '../components/common/Button';
import Spinner from '../components/common/Spinner';
import { ArrowLeft } from 'lucide-react';

export default function ContentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data, isLoading, error } = useQuery({
    queryKey: ['content', id],
    queryFn: () => contentService.getById(id),
    enabled: !!id,
  });

  const content = data?.data;

  return (
    <div className="page-wrapper">
      <Button variant="ghost" icon={ArrowLeft} onClick={() => navigate(-1)} style={{ marginBottom: '16px' }}>
        Back
      </Button>

      {isLoading ? <Spinner /> : error ? (
        <p style={{ color: 'var(--error)' }}>Failed to load content</p>
      ) : (
        <ContentDetailComp content={content} />
      )}
    </div>
  );
}
