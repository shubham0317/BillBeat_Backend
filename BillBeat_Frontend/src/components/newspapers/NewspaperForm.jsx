import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import AuthField from '../auth/AuthField';
import Button from '../common/Button';

const emptyValues = { name: '', defaultPrice: '', code: '', language: '' };

export default function NewspaperForm({ initialValues = emptyValues, isSubmitting, serverError, onSubmit, submitLabel }) {
  const { register, reset, handleSubmit, setError, formState: { errors } } = useForm({ defaultValues: initialValues });
  useEffect(() => { reset({ ...emptyValues, ...initialValues, defaultPrice: initialValues.defaultPrice ?? '' }); }, [initialValues, reset]);
  useEffect(() => { if (serverError?.fieldErrors) Object.entries(serverError.fieldErrors).forEach(([field, message]) => setError(field, { type: 'server', message })); }, [serverError, setError]);
  const submit = (values) => onSubmit({ name: values.name.trim(), defaultPrice: Number(values.defaultPrice), code: values.code.trim() || null, language: values.language.trim() || null });
  return <form className="space-y-5" onSubmit={handleSubmit(submit)} noValidate><div className="grid gap-5 sm:grid-cols-2"><AuthField label="Name" placeholder="Newspaper name" error={errors.name?.message} {...register('name', { required: 'Newspaper name is required' })} /><AuthField label="Default price" type="number" min="0.01" step="0.01" placeholder="0.00" error={errors.defaultPrice?.message} {...register('defaultPrice', { required: 'Default price is required', min: { value: 0.01, message: 'Price must be greater than zero' }, valueAsNumber: true })} /><AuthField label="Code" placeholder="Optional" error={errors.code?.message} {...register('code')} /><AuthField label="Language" placeholder="Optional" error={errors.language?.message} {...register('language')} /></div>{(serverError?.message && !Object.keys(serverError.fieldErrors || {}).length) && <p className="rounded-xl bg-[#fff0ee] px-4 py-3 text-sm font-medium text-[#b42318]">{serverError.message}</p>}<Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving newspaper...' : submitLabel}</Button></form>;
}
