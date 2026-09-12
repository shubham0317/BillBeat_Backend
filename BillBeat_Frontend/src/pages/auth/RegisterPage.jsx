import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import Button from '../../components/common/Button';
import AuthField from '../../components/auth/AuthField';
import AuthLayout from '../../components/auth/AuthLayout';
import { useAuth } from '../../context/AuthContext';
import { registerVendor } from '../../services/authService';

const fields = [
  ['username', 'Username', 'vendor_username', 'text', 'username'],
  ['businessName', 'Business name', 'Example Newspapers', 'text', 'organization'],
  ['ownerName', 'Owner name', 'Owner Name', 'text', 'name'],
  ['phone', 'Phone', '9876543210', 'tel', 'tel'],
  ['email', 'Email', 'owner@example.com', 'email', 'email'],
  ['address', 'Business address', 'Business address', 'text', 'street-address'],
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const { setSession } = useAuth();
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm({ mode: 'onBlur' });

  const onSubmit = async (values) => {
    try {
      const response = await registerVendor(removeEmptyOptionalFields(values));
      setSession(response.token, response);
      navigate('/dashboard', { replace: true });
    } catch (error) {
      applyBackendErrors(error, setError);
    }
  };

  return <AuthLayout eyebrow="Start your workspace" title="Bring your route together." description="Create a vendor account with the details your backend supports. You will enter the workspace immediately after registration." footer={<>Already have an account? <Link className="font-semibold text-[#b42318] hover:underline" to="/login">Sign in</Link></>}><form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate><div className="grid gap-4 sm:grid-cols-2">{fields.map(([name, label, placeholder, type, autoComplete]) => <AuthField key={name} label={label} type={type} autoComplete={autoComplete} placeholder={placeholder} error={errors[name]?.message} {...register(name, validationFor(name))} />)}</div><AuthField label="Password" type="password" autoComplete="new-password" placeholder="At least 6 characters" error={errors.password?.message} {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'Password must be at least 6 characters' } })} />{errors.root?.message && <p className="rounded-xl bg-[#fff0ee] px-4 py-3 text-sm font-medium text-[#b42318]">{errors.root.message}</p>}<Button className="mt-2 w-full" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Creating workspace...' : 'Create vendor account'}</Button></form></AuthLayout>;
}

function validationFor(name) {
  const requiredNames = { username: 'Username', businessName: 'Business name', ownerName: 'Owner name', phone: 'Phone' };
  const required = requiredNames[name] ? { required: `${requiredNames[name]} is required` } : {};
  return name === 'email' ? { pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email format' } } : name === 'username' ? { ...required, minLength: { value: 3, message: 'Username must be between 3 and 50 characters' }, maxLength: { value: 50, message: 'Username must be between 3 and 50 characters' } } : required;
}

function removeEmptyOptionalFields(values) {
  return Object.fromEntries(Object.entries(values).filter(([, value]) => value !== ''));
}

function applyBackendErrors(error, setError) {
  Object.entries(error.fieldErrors || {}).forEach(([field, message]) => setError(field, { type: 'server', message }));
  if (!Object.keys(error.fieldErrors || {}).length) setError('root', { type: 'server', message: error.message || 'Unable to create the vendor account.' });
}