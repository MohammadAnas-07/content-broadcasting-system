import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { approvalService } from '../services/approval.service';
import ContentTable from '../components/content/ContentTable';
import Input from '../components/common/Input';
import Pagination from '../components/common/Pagination';
import Skeleton from '../components/common/Skeleton';
import EmptyState from '../components/common/EmptyState';
import { FolderOpen } from 'lucide-react';

export default function AllContentPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [subject, setSubject] = useState('');
  const [teacherId, setTeacherId] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['approval', 'all', { page, status, subject, teacherId }],
    queryFn: () => approvalService.getAll({ page, limit: 15, status, subject, teacherId }),
  });

  const items = data?.data?.items || [];
  const pagination = { pages: data?.data?.totalPages || 1 };

  return (
    <div className="page-wrapper">
      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ width: '160px' }}>
          <Input label="Status" type="select" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            <option value="">All</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </Input>
        </div>
        <div style={{ width: '160px' }}>
          <Input label="Subject" placeholder="e.g. maths" value={subject} onChange={(e) => { setSubject(e.target.value); setPage(1); }} />
        </div>
        <div style={{ width: '120px' }}>
          <Input label="Teacher ID" placeholder="e.g. 2" value={teacherId} onChange={(e) => { setTeacherId(e.target.value); setPage(1); }} />
        </div>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} type="text" height="56px" />)}
        </div>
      ) : items.length === 0 ? (
        <EmptyState icon={FolderOpen} title="No content found" description="Try adjusting your filters." />
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <ContentTable items={items} />
        </div>
      )}

      <Pagination page={page} totalPages={pagination.pages || 1} onPageChange={setPage} />
    </div>
  );
}
