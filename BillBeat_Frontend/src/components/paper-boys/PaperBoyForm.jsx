import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import AuthField from '../auth/AuthField';
import Button from '../common/Button';

const emptyValues = { name: '', phone: '', createLoginUser: false, username: '', password: '' };

export default function PaperBoyForm({ initialValues = emptyValues, isEdit = false, isSubmitting, serverError, onSubmit, submitLabel }) {
  const { register, reset, handleSubmit, setError, control, formState: { errors } } = useForm({ defaultValues: initialValues });
  const createLoginUser = useWatch({ control, name: 'createLoginUser', defaultValue: false });
  useEffect(() => { reset({ ...emptyValues, ...initialValues, createLoginUser: false, username: '', password: '' }); }, [initialValues, reset]);
  useEffect(() => { if (serverError?.fieldErrors) Object.entries(serverError.fieldErrors).forEach(([field, message]) => setError(field, { type: 'server', message })); }, [serverError, setError]);
  const submit = (values) => {
    const request = { name: values.name.trim(), phone: values.phone.trim() };
    if (!isEdit && values.createLoginUser) {
      request.createLoginUser = true;
      request.username = values.username.trim();
      if (values.password) request.password = values.password;
    }
    onSubmit(request);
  };
  return <form className="space-y-5" onSubmit={handleSubmit(submit)} noValidate><div className="grid gap-5 sm:grid-cols-2"><AuthField label="Name" placeholder="Paper boy name" error={errors.name?.message} {...register('name', { required: 'Paper boy name is required' })} /><AuthField label="Phone" placeholder="9876543210" error={errors.phone?.message} {...register('phone', { required: 'Phone number is required' })} /></div>{!isEdit && <><label className="flex min-h-12 items-center gap-3 rounded-xl border border-[#e6e1dd] bg-white px-4 text-sm font-semibold text-[#383331]"><input type="checkbox" className="size-4 accent-[#d92d20]" {...register('createLoginUser')} /> Create a login account</label>{createLoginUser && <div className="grid gap-5 rounded-2xl bg-[#f7f5f2] p-4 sm:grid-cols-2"><AuthField label="Username" placeholder="Login username" error={errors.username?.message} {...register('username', { validate: (value) => !createLoginUser || Boolean(value.trim()) || 'Username is required to create a login' })} /><AuthField label="Password" type="password" placeholder="Optional — defaults to 123456" error={errors.password?.message} {...register('password')} /></div>}</>}{isEdit && <p className="rounded-xl bg-[#f7f5f2] px-4 py-3 text-sm text-[#706a65]">Login credentials cannot be changed here because the API only supports name and phone updates.</p>}{(serverError?.message && !Object.keys(serverError.fieldErrors || {}).length) && <p className="rounded-xl bg-[#fff0ee] px-4 py-3 text-sm font-medium text-[#b42318]">{serverError.message}</p>}<Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving paper boy...' : submitLabel}</Button></form>;
}
