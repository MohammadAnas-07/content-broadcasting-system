import './SubjectFilter.css';

export default function SubjectFilter({ subjects, active, onChange }) {
  return (
    <div className="subject-filter">
      <button
        className={`subject-chip ${!active ? 'active' : ''}`}
        onClick={() => onChange('')}
      >
        All Subjects
      </button>
      {subjects.map((s) => (
        <button
          key={s}
          className={`subject-chip ${active === s ? 'active' : ''}`}
          onClick={() => onChange(s)}
        >
          {s}
        </button>
      ))}
    </div>
  );
}
