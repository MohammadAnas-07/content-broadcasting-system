import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import StatusBadge from './StatusBadge';
import Badge from '../common/Badge';
import './ContentTable.css';

export default function ContentTable({ items }) {
  const navigate = useNavigate();

  return (
    <table className="content-table">
      <thead>
        <tr>
          <th></th>
          <th>Title</th>
          <th>Subject</th>
          <th>Teacher</th>
          <th>Status</th>
          <th>Date</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => (
          <tr key={item.id} onClick={() => navigate(`/content/${item.id}`)}>
            <td>
              {item.filePath && (
                <img className="content-table-thumb" src={`/uploads/${item.filePath}`} alt="" />
              )}
            </td>
            <td>{item.title}</td>
            <td><Badge variant="accent">{item.subject}</Badge></td>
            <td>{item.uploadedBy?.name || `User #${item.uploadedById}`}</td>
            <td><StatusBadge status={item.status} /></td>
            <td style={{ whiteSpace: 'nowrap' }}>{format(new Date(item.createdAt), 'MMM d, yyyy')}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
