import UploadForm from '../components/content/UploadForm';

export default function UploadPage() {
  return (
    <div className="page-wrapper">
      <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '4px' }}>Upload Content</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
        Upload an image to broadcast. JPG, PNG, GIF up to 10MB.
      </p>
      <UploadForm />
    </div>
  );
}
