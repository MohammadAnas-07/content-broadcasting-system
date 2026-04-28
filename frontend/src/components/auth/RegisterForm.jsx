import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Radio, Mail, Lock, User, Shield } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import Button from '../common/Button';
import Input from '../common/Input';
import toast from 'react-hot-toast';
import '../auth/LoginForm.css';
import './RegisterForm.css';

export default function RegisterForm() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', role: 'TEACHER' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { register, login } = useAuth();
  const navigate = useNavigate();

  const update = (field) => (e) => setForm((p) => ({ ...p, [field]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.email) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email format';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 8) e.password = 'Password must be at least 8 characters';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await register({ name: form.name, email: form.email, password: form.password, role: form.role });
      toast.success('Account created! Logging you in…');
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Registration failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-brand-icon"><Radio size={24} /></div>
          <h2>Create Account</h2>
          <p>Join the Content Broadcasting System</p>
        </div>
        <form className="auth-form" onSubmit={handleSubmit}>
          <Input label="Full Name" icon={User} placeholder="John Doe" value={form.name} onChange={update('name')} error={errors.name} />
          <Input label="Email" type="email" icon={Mail} placeholder="you@example.com" value={form.email} onChange={update('email')} error={errors.email} />
          <Input label="Password" type="password" icon={Lock} placeholder="••••••••" value={form.password} onChange={update('password')} error={errors.password} />
          <Input label="Confirm Password" type="password" icon={Lock} placeholder="••••••••" value={form.confirmPassword} onChange={update('confirmPassword')} error={errors.confirmPassword} />
          <Input label="Role" type="select" icon={Shield} value={form.role} onChange={update('role')}>
            <option value="TEACHER">Teacher</option>
            <option value="PRINCIPAL">Principal</option>
          </Input>
          <Button type="submit" loading={loading} size="lg" style={{ width: '100%', marginTop: '8px' }}>
            Create Account
          </Button>
        </form>
        <div className="auth-footer">
          Already have an account? <Link to="/login">Sign In</Link>
        </div>
      </div>
    </div>
  );
}
