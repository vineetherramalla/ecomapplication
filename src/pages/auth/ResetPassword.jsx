import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AuthLayout from '../../components/auth/AuthLayout';
import PasswordInput from '../../components/auth/PasswordInput';
import AuthButton from '../../components/auth/AuthButton';
import authService from '@/features/auth/services/authService';
import { getNormalizedApiError } from '../../api/errorHandler';
import { showToast } from '../../utils/helpers';

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const fallbackResetContext = authService.getTempPasswordReset();
  const email = location.state?.email || fallbackResetContext?.email || '';
  const otp = location.state?.otp || fallbackResetContext?.otp || '';
  
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (location.state?.email && location.state?.otp) {
      authService.setTempPasswordReset({
        email: location.state.email,
        otp: location.state.otp,
      });
    }
  }, [location.state?.email, location.state?.otp]);

  useEffect(() => {
    if (!email || !otp) {
      navigate('/forgot-password', { replace: true });
    }
  }, [email, otp, navigate]);

  const validate = () => {
    const newErrors = {};
    if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));

    if (errors[name]) {
      setErrors((current) => ({ ...current, [name]: '' }));
    }

    if (formError) {
      setFormError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !otp) {
      navigate('/forgot-password', { replace: true });
      return;
    }
    if (!validate()) return;
    
    setSubmitting(true);
    setFormError('');

    try {
      await authService.confirmPassword({ email, otp, password: formData.password });
      authService.clearTempPasswordReset();
      authService.clearTempEmail();
      showToast({ title: 'Success', message: 'Password reset successfully. You can now login.' });
      navigate('/login', { replace: true });
    } catch (error) {
      const normalizedError = getNormalizedApiError(error, {
        fallbackMessage: 'Failed to reset password. Please try again.',
      });

      setErrors((current) => ({
        ...current,
        password:
          normalizedError.fieldErrors.new_password ||
          normalizedError.fieldErrors.password ||
          '',
        confirmPassword:
          normalizedError.fieldErrors.confirmPassword ||
          normalizedError.fieldErrors.confirm_password ||
          '',
      }));
      setFormError(normalizedError.message);

      if (normalizedError.type === 'server') {
        showToast({ title: 'Error', message: normalizedError.message, type: 'error' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      badge="Security Update"
      title="Set New Password"
      subtitle="Create a strong password to re-secure your account."
      imageText="New credentials."
      imageSubtitle="Enter a new password below. Make sure it's secure and different from your previous passwords."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {formError ? (
          <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {formError}
          </div>
        ) : null}

        <PasswordInput
          label="New Password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="••••••••"
          required
          error={errors.password}
          autoComplete="new-password"
        />
        <PasswordInput
          label="Confirm Password"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          placeholder="••••••••"
          required
          error={errors.confirmPassword}
          autoComplete="new-password"
        />
        
        <AuthButton loading={submitting} type="submit" className="mt-4">
          Reset Password
        </AuthButton>
      </form>
    </AuthLayout>
  );
};

export default ResetPassword;
