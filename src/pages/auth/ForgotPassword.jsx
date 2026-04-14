import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthLayout from '../../components/auth/AuthLayout';
import InputField from '../../components/auth/InputField';
import AuthButton from '../../components/auth/AuthButton';
import authService from '@/features/auth/services/authService';
import { getNormalizedApiError } from '../../api/errorHandler';
import { showToast } from '../../utils/helpers';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');

  const handleChange = (event) => {
    setEmail(event.target.value);

    if (error) setError('');
    if (formError) setFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setFormError('');

    try {
      await authService.requestPasswordReset(email);
      showToast({ title: 'OTP Sent', message: 'Check your email for the recovery code.' });
      navigate('/verify-otp', { state: { email } });
    } catch (error) {
      const normalizedError = getNormalizedApiError(error, {
        fallbackMessage: 'Something went wrong. Please try again.',
      });

      setError(normalizedError.fieldErrors.email || '');
      setFormError(normalizedError.fieldErrors.email ? '' : normalizedError.message);

      if (normalizedError.type === 'server') {
        showToast({ title: 'Error', message: normalizedError.message, type: 'error' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      badge="Account Recovery"
      title="Forgot Password"
      subtitle="Enter your email to receive a password reset code."
      imageText="Secure recovery."
      imageSubtitle="Protecting your account is our top priority. Enter your email and we'll help you reset your credentials safely."
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {formError ? (
          <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {formError}
          </div>
        ) : null}

        <InputField
          label="Email Address"
          name="email"
          type="email"
          value={email}
          onChange={handleChange}
          placeholder="business@example.com"
          required
          autoComplete="email"
          error={error}
          invalid={Boolean(error)}
        />
        
        <AuthButton loading={submitting} type="submit">
          Send Reset Code
        </AuthButton>

        <div className="text-center">
          <Link to="/login" className="text-sm font-semibold text-primary hover:opacity-90 underline">
            Back to Sign In
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
};

export default ForgotPassword;
