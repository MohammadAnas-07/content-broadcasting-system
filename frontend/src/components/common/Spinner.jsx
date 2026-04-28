import './Spinner.css';

export default function Spinner({ size = 'md', fullPage = false }) {
  if (fullPage) {
    return (
      <div className="spinner-fullpage">
        <div className={`spinner spinner-lg`} />
      </div>
    );
  }
  return (
    <div className="spinner-container">
      <div className={`spinner spinner-${size}`} />
    </div>
  );
}
