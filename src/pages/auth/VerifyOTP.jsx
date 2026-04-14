import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import AuthLayout from '../../components/auth/AuthLayout';
import OTPInput from '../../components/auth/OTPInput';
import AuthButton from '../../components/auth/AuthButton';
import authService from '@/features/auth/services/authService';
import { getNormalizedApiError } from '../../api/errorHandler';
import { showToast } from '../../utils/helpers';

const VerifyOTP = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || authService.getTempEmail() || '';
  
  const [otp, setOtp] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!email) {
      navigate('/forgot-password');
    }
  }, [email, navigate]);

  const handleOtpChange = (value) => {
    setOtp(value);
    if (error) {
      setError('');
    }
  };

  const handleSubmit = useCallback(async (e) => {
    if (e) e.preventDefault();
    if (otp.length < 6) return;

    setSubmitting(true);
    setError('');

    try {
      await authService.verifyOTP({ email, otp });
      authService.setTempPasswordReset({ email, otp });
      showToast({ title: 'Code Verified', message: 'Now you can create your new password.' });
      navigate('/reset-password', { state: { email, otp } });
    } catch (err) {
      const normalizedError = getNormalizedApiError(err, {
        fallbackMessage: 'Invalid or expired code. Please try again.',
      });

      setError(normalizedError.message);

      if (normalizedError.type === 'server') {
        showToast({ title: 'Verification failed', message: normalizedError.message, type: 'error' });
      }
    } finally {
      setSubmitting(false);
    }
  }, [email, navigate, otp]);

  useEffect(() => {
    if (otp.length === 6) {
      handleSubmit();
    }
  }, [otp, handleSubmit]);

  return (
    <AuthLayout
      badge="Verification"
      title="Enter Reset Code"
      subtitle={`We’ve sent a 6-digit code to ${email}`}
      imageText="Verify identity."
      imageSubtitle="For your security, we’ve sent a verification code to your email. Enter it here to reset your password."
    >
      <div className="space-y-8">
        <OTPInput value={otp} onChange={handleOtpChange} error={error} invalid={Boolean(error)} />
        
        <div className="text-center">
          <p className="text-sm text-slate-500">
            Didn&apos;t receive the code?{' '}
            <Link
              to="/forgot-password"
              className="font-semibold text-primary hover:opacity-90 underline"
            >
              Try again
            </Link>
          </p>
        </div>

        <AuthButton loading={submitting} onClick={handleSubmit} disabled={otp.length < 6}>
          Verify Code
        </AuthButton>

        <div className="text-center mt-6">
          <Link to="/login" className="text-sm font-semibold text-primary hover:opacity-90 underline">
            Back to Sign In
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
};

export default VerifyOTP;
