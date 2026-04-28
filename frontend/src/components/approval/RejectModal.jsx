import { useState } from 'react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';
import './RejectModal.css';

export default function RejectModal({ isOpen, onClose, onConfirm, contentTitle, loading }) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (reason.trim().length < 5) {
      setError('Reason must be at least 5 characters');
      return;
    }
    setError('');
    onConfirm(reason.trim());
  };

  const handleClose = () => {
    setReason('');
    setError('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Reject: ${contentTitle || 'Content'}`}
      footer={
        <>
          <Button variant="secondary" onClick={handleClose}>Cancel</Button>
          <Button variant="danger" onClick={handleSubmit} loading={loading}>Reject</Button>
        </>
      }
    >
      <Input
        label="Rejection Reason"
        type="textarea"
        placeholder="Explain why this content is being rejected…"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        error={error}
        className="reject-modal-textarea"
      />
      <p className="reject-modal-hint">Minimum 5 characters required</p>
    </Modal>
  );
}
