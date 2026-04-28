import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { contentService } from '../../services/content.service';
import FileDropzone from '../common/FileDropzone';
import Input from '../common/Input';
import Button from '../common/Button';
import toast from 'react-hot-toast';
import './UploadForm.css';

export default function UploadForm() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [file, setFile] = useState(null);
  const [form, setForm] = useState({
    title: '', subject: '', description: '', startTime: '', endTime: '', rotationDurationMinutes: '5',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const update = (field) => (e) => setForm((p) => ({ ...p, [field]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = 'Title is required';
    if (!form.subject.trim()) e.subject = 'Subject is required';
    if (!file) e.file = 'An image file is required';
    if ((form.startTime && !form.endTime) || (!form.startTime && form.endTime)) {
      e.startTime = 'Both start and end time are required';
      e.endTime = 'Both start and end time are required';
    }
    if (form.startTime && form.endTime && new Date(form.endTime) <= new Date(form.startTime)) {
      e.endTime = 'End time must be after start time';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setProgress(0);

    const fd = new FormData();
    fd.append('file', file);
    fd.append('title', form.title);
    fd.append('subject', form.subject.toLowerCase());
    if (form.description) fd.append('description', form.description);
    if (form.startTime) fd.append('startTime', new Date(form.startTime).toISOString());
    if (form.endTime) fd.append('endTime', new Date(form.endTime).toISOString());
    fd.append('rotationDurationMinutes', form.rotationDurationMinutes || '5');

    try {
      await contentService.upload(fd, (event) => {
        const pct = Math.round((event.loaded * 100) / event.total);
        setProgress(pct);
      });
      toast.success('Content uploaded successfully!');
      queryClient.invalidateQueries({ queryKey: ['content'] });
      queryClient.invalidateQueries({ queryKey: ['approval'] });
      navigate('/my-content');
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Upload failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="upload-form" onSubmit={handleSubmit}>
      <FileDropzone file={file} onFileSelect={setFile} onRemove={() => setFile(null)} error={errors.file} />

      <Input label="Title *" placeholder="e.g. Algebra Worksheet 1" value={form.title} onChange={update('title')} error={errors.title} />
      <Input label="Subject *" placeholder="e.g. maths" value={form.subject} onChange={update('subject')} error={errors.subject} />
      <Input label="Description" type="textarea" placeholder="Optional description…" value={form.description} onChange={update('description')} />

      <div className="upload-form-row">
        <Input label="Start Time" type="datetime-local" value={form.startTime} onChange={update('startTime')} error={errors.startTime} />
        <Input label="End Time" type="datetime-local" value={form.endTime} onChange={update('endTime')} error={errors.endTime} />
      </div>

      <Input label="Rotation Duration (minutes)" type="number" min="1" max="60" value={form.rotationDurationMinutes} onChange={update('rotationDurationMinutes')} />

      {loading && progress > 0 && (
        <div className="upload-progress">
          <div className="upload-progress-bar" style={{ width: `${progress}%` }} />
        </div>
      )}

      <Button type="submit" loading={loading} size="lg">
        Upload Content
      </Button>
    </form>
  );
}
