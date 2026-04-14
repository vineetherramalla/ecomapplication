import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AuthLayout from '../../components/auth/AuthLayout';
import OTPInput from '../../components/auth/OTPInput';
import AuthButton from '../../components/auth/AuthButton';
import authService from '@/features/auth/services/authService';
import { getNormalizedApiError } from '../../api/errorHandler';
import { showToast } from '../../utils/helpers';

const VerifyEmailOTP = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || authService.getTempEmail() || '';
  
  const [otp, setOtp] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!email) {
      navigate('/register');
    }
  }, [email, navigate]);

  const handleOtpChange = (value) => {
    setOtp(value);
    if (error) {
      setError('');
    }
  };

  useEffect(() => {
    let interval;
    if (timer > 0 && !canResend) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else {
      setCanResend(true);
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timer, canResend]);

  const handleResend = async () => {
    if (!canResend) return;
    try {
      await authService.resendVerificationOTP();
      setTimer(60);
      setCanResend(false);
      showToast({ title: 'OTP Resent', message: 'A new code has been sent to your email.' });
    } catch (err) {
      const normalizedError = getNormalizedApiError(err, {
        fallbackMessage: 'Failed to resend OTP.',
      });

      showToast({
        title: 'Error',
        message: normalizedError.message,
        type: 'error',
      });
    }
  };

  const handleSubmit = useCallback(async (e) => {
    if (e) e.preventDefault();
    if (otp.length < 6) return;

    setSubmitting(true);
    setError('');

    try {
      await authService.verifyOTP({ email, otp });
      showToast({ title: 'Account Verified!', message: 'You can now sign in to your account.' });
      authService.clearTempEmail();
      authService.clearTempRegistration();
      navigate('/login');
    } catch (err) {
      const normalizedError = getNormalizedApiError(err, {
        fallbackMessage: 'Invalid verification code. Please try again.',
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
      title="Verify your email"
      subtitle={`We’ve sent a 6-digit code to ${email}`}
      imageText="Secure your account."
      imageSubtitle="Enter the verification code sent to your email to activate your account."
    >
      <div className="space-y-8">
        <OTPInput value={otp} onChange={handleOtpChange} error={error} invalid={Boolean(error)} />
        
        <div className="text-center">
          <p className="text-sm text-slate-500">
            Didn&apos;t receive the code?{' '}
            <button
              onClick={handleResend}
              disabled={!canResend}
              className={`font-semibold ${canResend ? 'text-primary hover:opacity-90 underline' : 'text-slate-400'}`}
            >
              {canResend ? 'Resend' : `Resend in ${timer}s`}
            </button>
          </p>
        </div>

        <AuthButton loading={submitting} onClick={handleSubmit} disabled={otp.length < 6}>
          Verify & Continue
        </AuthButton>
      </div>
    </AuthLayout>
  );
};

export default VerifyEmailOTP;
