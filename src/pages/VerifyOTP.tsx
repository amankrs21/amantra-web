import { useLocation, Navigate } from 'react-router-dom';
import AuthLayout from '../components/auth/AuthLayout';
import OTPForm from '../components/auth/OTPForm';
export default function VerifyOTP() {
  const email = (useLocation().state as { email?: string })?.email;
  if (!email) return <Navigate to="/register" />;
  return <AuthLayout><OTPForm email={email} /></AuthLayout>;
}
