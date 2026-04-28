import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X } from 'lucide-react';
import './FileDropzone.css';

const ACCEPTED_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/gif': ['.gif'],
};
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export default function FileDropzone({ onFileSelect, file, onRemove, error: externalError }) {
  const [localError, setLocalError] = useState('');

  const onDrop = useCallback(
    (accepted, rejected) => {
      setLocalError('');
      if (rejected.length > 0) {
        const err = rejected[0].errors[0];
        if (err.code === 'file-too-large') setLocalError('File must be under 10MB');
        else if (err.code === 'file-invalid-type') setLocalError('Only JPG, PNG, and GIF images allowed');
        else setLocalError(err.message);
        return;
      }
      if (accepted.length > 0) {
        onFileSelect(accepted[0]);
      }
    },
    [onFileSelect]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxSize: MAX_SIZE,
    multiple: false,
  });

  const displayError = externalError || localError;

  return (
    <div>
      <div {...getRootProps()} className={`dropzone ${isDragActive ? 'dropzone-active' : ''}`}>
        <input {...getInputProps()} />
        {!file ? (
          <>
            <div className="dropzone-icon"><Upload size={40} /></div>
            <p className="dropzone-text">
              {isDragActive ? 'Drop the file here' : <>Drag & drop an image, or <span>browse</span></>}
            </p>
            <p className="dropzone-hint">JPG, PNG, GIF — Max 10MB</p>
          </>
        ) : (
          <div className="dropzone-preview" onClick={(e) => e.stopPropagation()}>
            <img src={URL.createObjectURL(file)} alt="Preview" />
            <button className="dropzone-remove" onClick={(e) => { e.stopPropagation(); onRemove(); }} type="button">
              <X size={14} />
            </button>
            <p className="dropzone-preview-info">
              {file.name} — {(file.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
        )}
      </div>
      {displayError && <p className="dropzone-error">{displayError}</p>}
    </div>
  );
}
