import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { contentService } from '../services/content.service';
import ContentCard from '../components/content/ContentCard';
import ContentTable from '../components/content/ContentTable';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import Pagination from '../components/common/Pagination';
import Skeleton from '../components/common/Skeleton';
import EmptyState from '../components/common/EmptyState';
import { Grid3x3, List, FileText } from 'lucide-react';

export default function MyContentPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [subject, setSubject] = useState('');
  const [view, setView] = useState('grid');

  const { data, isLoading } = useQuery({
    queryKey: ['content', 'my', { page, status, subject }],
    queryFn: () => contentService.getMyContent({ page, limit: 12, status, subject }),
  });
  // Backend returns: { success, data: { items, total, page, limit, totalPages } }
  const result = data?.data || {};
  const items = result.items || [];
  const pagination = { page: result.page || 1, pages: result.totalPages || 1 };

  return (
    <div className="page-wrapper">
      {/* Filters bar */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ width: '160px' }}>
          <Input label="Status" type="select" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </Input>
        </div>
        <div style={{ width: '160px' }}>
          <Input label="Subject" placeholder="e.g. maths" value={subject} onChange={(e) => { setSubject(e.target.value); setPage(1); }} />
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '4px' }}>
          <Button variant={view === 'grid' ? 'primary' : 'ghost'} size="sm" icon={Grid3x3} onClick={() => setView('grid')} />
          <Button variant={view === 'table' ? 'primary' : 'ghost'} size="sm" icon={List} onClick={() => setView('table')} />
        </div>
      </div>

      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} type="card" />)}
        </div>
      ) : items.length === 0 ? (
        <EmptyState icon={FileText} title="No content found" description="Try adjusting your filters or upload your first content item." />
      ) : view === 'grid' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {items.map((item) => <ContentCard key={item.id} content={item} />)}
        </div>
      ) : (
        <ContentTable items={items} />
      )}

      <Pagination page={page} totalPages={pagination.pages || 1} onPageChange={setPage} />
    </div>
  );
}
