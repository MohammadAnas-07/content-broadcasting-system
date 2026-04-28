import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import { contentService } from '../services/content.service';
import { approvalService } from '../services/approval.service';
import { useNavigate } from 'react-router-dom';
import Card, { CardBody } from '../components/common/Card';
import Button from '../components/common/Button';
import Skeleton from '../components/common/Skeleton';
import Badge from '../components/common/Badge';
import StatusBadge from '../components/content/StatusBadge';
import { Upload, FileText, CheckCircle, XCircle, Clock, Users } from 'lucide-react';
import { format } from 'date-fns';

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <Card>
      <CardBody>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: 48, height: 48, borderRadius: 'var(--radius)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            background: `${color}15`, color,
          }}>
            <Icon size={22} />
          </div>
          <div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '2px' }}>{label}</p>
            <p style={{ fontSize: '28px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', lineHeight: 1 }}>
              {value ?? '—'}
            </p>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

function TeacherDashboard() {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ['content', 'my', { page: 1, limit: 100 }],
    queryFn: () => contentService.getMyContent({ page: 1, limit: 100 }),
  });

  const items = data?.data?.items || [];
  const pending = items.filter((i) => i.status === 'PENDING').length;
  const approved = items.filter((i) => i.status === 'APPROVED').length;
  const rejected = items.filter((i) => i.status === 'REJECTED').length;
  const recent = items.slice(0, 5);

  if (isLoading) {
    return (
      <div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px', marginBottom: '32px' }}>
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} type="text" height="100px" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <StatCard icon={FileText} label="Total Uploads" value={items.length} color="#3b82f6" />
        <StatCard icon={Clock} label="Pending" value={pending} color="#f59e0b" />
        <StatCard icon={CheckCircle} label="Approved" value={approved} color="#10b981" />
        <StatCard icon={XCircle} label="Rejected" value={rejected} color="#f43f5e" />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600 }}>Recent Uploads</h2>
        <Button icon={Upload} onClick={() => navigate('/upload')}>Upload New</Button>
      </div>

      {recent.length === 0 ? (
        <Card><CardBody><p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '24px' }}>No content uploaded yet. Start by uploading your first item!</p></CardBody></Card>
      ) : (
        <Card>
          {recent.map((item, idx) => (
            <div key={item.id} onClick={() => navigate(`/content/${item.id}`)} style={{
              display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px',
              borderBottom: idx < recent.length - 1 ? '1px solid var(--border-color)' : 'none',
              cursor: 'pointer', transition: 'background 0.15s',
            }}>
              {item.filePath && <img src={`/uploads/${item.filePath}`} alt="" style={{ width: 40, height: 40, borderRadius: 'var(--radius-sm)', objectFit: 'cover' }} />}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '14px', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</p>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{format(new Date(item.createdAt), 'MMM d, yyyy')}</p>
              </div>
              <StatusBadge status={item.status} />
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}

function PrincipalDashboard() {
  const navigate = useNavigate();
  const { data: pendingData, isLoading } = useQuery({
    queryKey: ['approval', 'pending', { page: 1, limit: 5 }],
    queryFn: () => approvalService.getPending({ page: 1, limit: 5 }),
  });
  const { data: allData } = useQuery({
    queryKey: ['approval', 'all', { page: 1, limit: 100 }],
    queryFn: () => approvalService.getAll({ page: 1, limit: 100 }),
  });

  const pendingItems = pendingData?.data?.items || [];
  const allItems = allData?.data?.items || [];
  const pendingCount = pendingData?.data?.total || pendingItems.length;
  const approvedToday = allItems.filter((i) => {
    if (i.status !== 'APPROVED' || !i.approvedAt) return false;
    const d = new Date(i.approvedAt);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  }).length;

  if (isLoading) {
    return (
      <div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px', marginBottom: '32px' }}>
          {[1, 2, 3].map((i) => <Skeleton key={i} type="text" height="100px" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <StatCard icon={Clock} label="Pending Review" value={pendingCount} color="#f59e0b" />
        <StatCard icon={CheckCircle} label="Approved Today" value={approvedToday} color="#10b981" />
        <StatCard icon={Users} label="Total Content" value={allItems.length} color="#3b82f6" />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600 }}>Pending Approvals</h2>
        <Button variant="secondary" onClick={() => navigate('/approvals/pending')}>View All</Button>
      </div>

      {pendingItems.length === 0 ? (
        <Card><CardBody><p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '24px' }}>🎉 All caught up! No pending content.</p></CardBody></Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {pendingItems.map((item) => (
            <Card key={item.id} clickable onClick={() => navigate(`/content/${item.id}`)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px' }}>
                {item.filePath && <img src={`/uploads/${item.filePath}`} alt="" style={{ width: 48, height: 48, borderRadius: 'var(--radius-sm)', objectFit: 'cover' }} />}
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '14px', fontWeight: 500 }}>{item.title}</p>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>by {item.uploadedBy?.name} · {format(new Date(item.createdAt), 'MMM d')}</p>
                </div>
                <Badge variant="accent">{item.subject}</Badge>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div>
      <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '4px' }}>
        Welcome back, {user?.name} 👋
      </h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
        <Badge variant={user?.role === 'PRINCIPAL' ? 'info' : 'accent'}>{user?.role}</Badge>
      </p>
      {user?.role === 'PRINCIPAL' ? <PrincipalDashboard /> : <TeacherDashboard />}
    </div>
  );
}
