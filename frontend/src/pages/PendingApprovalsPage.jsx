import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { approvalService } from '../services/approval.service';
import ApprovalCard from '../components/approval/ApprovalCard';
import RejectModal from '../components/approval/RejectModal';
import Pagination from '../components/common/Pagination';
import Skeleton from '../components/common/Skeleton';
import EmptyState from '../components/common/EmptyState';
import { ClipboardCheck } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PendingApprovalsPage() {
  const [page, setPage] = useState(1);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectLoading, setRejectLoading] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['approval', 'pending', { page }],
    queryFn: () => approvalService.getPending({ page, limit: 10 }),
  });

  const items = data?.data?.items || [];
  const pagination = { pages: data?.data?.totalPages || 1 };

  const handleApprove = async (id) => {
    try {
      await approvalService.approve(id);
      toast.success('Content approved!');
      queryClient.invalidateQueries({ queryKey: ['approval'] });
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Approval failed');
    }
  };

  const handleReject = async (reason) => {
    if (!rejectTarget) return;
    setRejectLoading(true);
    try {
      await approvalService.reject(rejectTarget.id, reason);
      toast.success('Content rejected');
      setRejectTarget(null);
      queryClient.invalidateQueries({ queryKey: ['approval'] });
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Rejection failed');
    } finally {
      setRejectLoading(false);
    }
  };

  return (
    <div className="page-wrapper">
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[1, 2, 3].map((i) => <Skeleton key={i} type="text" height="100px" />)}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="All caught up!"
          description="No pending content to review."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {items.map((item) => (
            <ApprovalCard
              key={item.id}
              content={item}
              onApprove={handleApprove}
              onReject={setRejectTarget}
            />
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={pagination.pages || 1} onPageChange={setPage} />

      <RejectModal
        isOpen={!!rejectTarget}
        onClose={() => setRejectTarget(null)}
        onConfirm={handleReject}
        contentTitle={rejectTarget?.title}
        loading={rejectLoading}
      />
    </div>
  );
}
