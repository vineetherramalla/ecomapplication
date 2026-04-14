import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthLayout from '../../components/auth/AuthLayout';
import InputField from '../../components/auth/InputField';
import PasswordInput from '../../components/auth/PasswordInput';
import AuthButton from '../../components/auth/AuthButton';
import authService from '@/features/auth/services/authService';
import { getNormalizedApiError } from '../../api/errorHandler';
import { showToast } from '../../utils/helpers';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullname: '',
    company_name: '',
    company_address: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');

  const validate = () => {
    const newErrors = {};
    if (!formData.fullname.trim()) newErrors.fullname = 'Full Name is required';
    if (!formData.company_name.trim()) newErrors.company_name = 'Company Name is required';
    if (!formData.company_address.trim()) newErrors.company_address = 'Company Address is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email format';
    if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    if (formError) setFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setFormError('');

    try {
      await authService.register(formData);
      showToast({ title: 'Signup successful', message: 'Check your email for the verification code.' });
      navigate('/verify-email-otp', { state: { email: formData.email } });
    } catch (err) {
      const normalizedError = getNormalizedApiError(err, {
        fallbackMessage: 'Signup failed',
      });

      setErrors((prev) => ({
        ...prev,
        fullname: normalizedError.fieldErrors.fullname || '',
        company_name: normalizedError.fieldErrors.company_name || '',
        company_address: normalizedError.fieldErrors.company_address || '',
        email: normalizedError.fieldErrors.email || '',
        phone: normalizedError.fieldErrors.phone || '',
        password: normalizedError.fieldErrors.password || '',
        confirmPassword: normalizedError.fieldErrors.confirmPassword || '',
      }));
      setFormError(normalizedError.message);

      if (normalizedError.type === 'server') {
        showToast({ title: 'Signup failed', message: normalizedError.message, type: 'error' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      badge="Business Onboarding"
      title="Create account"
      subtitle="Sign up to access exclusive B2B electronics deals."
      imageText="Join the network."
      imageSubtitle="Get the best pricing, bulk order management, and dedicated support for your electronics business."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {formError ? (
          <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {formError}
          </div>
        ) : null}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InputField
            label="Full Name"
            name="fullname"
            value={formData.fullname}
            onChange={handleChange}
            placeholder="John Doe"
            required
            error={errors.fullname}
          />
          <InputField
            label="Company Name"
            name="company_name"
            value={formData.company_name}
            onChange={handleChange}
            placeholder="Company Name"
            required
            error={errors.company_name}
          />
        </div>

        <InputField
          label="Company Address"
          name="company_address"
          value={formData.company_address}
          onChange={handleChange}
          placeholder="Company Address"
          required
          error={errors.company_address}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InputField
            label="Email Address"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="business@example.com"
            required
            error={errors.email}
          />
          <InputField
            label="Phone Number"
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="+91 8008008000"
            required
            error={errors.phone}
          />
        </div>

        <PasswordInput
          label="Create Password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="••••••••"
          required
          error={errors.password}
        />
        <PasswordInput
          label="Confirm Password"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          placeholder="••••••••"
          required
          error={errors.confirmPassword}
        />

        <AuthButton loading={submitting} type="submit" className="mt-4">
          Create Account
        </AuthButton>

        <p className="text-center text-sm text-slate-500 mt-6">
          Already a partner?{' '}
          <Link to="/login" className="font-semibold text-primary hover:opacity-90 underline">
            Sign In
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
};

export default Register;
