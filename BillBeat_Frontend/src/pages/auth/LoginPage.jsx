import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import Button from '../../components/common/Button';
import AuthField from '../../components/auth/AuthField';
import AuthLayout from '../../components/auth/AuthLayout';
import { useAuth } from '../../context/AuthContext';
import { login } from '../../services/authService';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setSession } = useAuth();
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm({ mode: 'onBlur' });
  const destination = location.state?.from?.pathname || '/dashboard';

  const onSubmit = async (values) => {
    try {
      const response = await login(values);
      setSession(response.token, response);
      navigate(destination, { replace: true });
    } catch (error) {
      applyBackendErrors(error, setError);
    }
  };

  return <AuthLayout eyebrow="Welcome back" title="Sign in to your route." description="Pick up where you left off and keep the morning moving." footer={<>New to BillBeat? <Link className="font-semibold text-[#b42318] hover:underline" to="/register">Create a vendor account</Link></>}><form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate><AuthField label="Username" autoComplete="username" placeholder="vendor_username" error={errors.username?.message} {...register('username', { required: 'Username is required' })} /><AuthField label="Password" type="password" autoComplete="current-password" placeholder="Your password" error={errors.password?.message} {...register('password', { required: 'Password is required' })} />{errors.root?.message && <p className="rounded-xl bg-[#fff0ee] px-4 py-3 text-sm font-medium text-[#b42318]">{errors.root.message}</p>}<Button className="w-full" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Signing in...' : 'Sign in'}</Button></form></AuthLayout>;
}

function applyBackendErrors(error, setError) {
  Object.entries(error.fieldErrors || {}).forEach(([field, message]) => setError(field, { type: 'server', message }));
  if (!Object.keys(error.fieldErrors || {}).length) setError('root', { type: 'server', message: error.message || 'Unable to sign in.' });
}