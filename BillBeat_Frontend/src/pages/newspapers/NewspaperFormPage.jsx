import { ArrowLeft } from 'lucide-react';
import { useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import NewspaperForm from '../../components/newspapers/NewspaperForm';
import { ErrorState, LoadingState } from '../../components/common/StateViews';
import PageHeader from '../../components/layout/PageHeader';
import { useNewspaper, useNewspaperMutations } from '../../queries/newspaperQueries';

export default function NewspaperFormPage({ mode }) {
  const isEdit = mode === 'edit';
  const { newspaperId } = useParams();
  const navigate = useNavigate();
  const newspaperQuery = useNewspaper(newspaperId);
  const { create, update } = useNewspaperMutations();
  const mutation = isEdit ? update : create;
  useEffect(() => { if (mutation.isSuccess && mutation.data?.id) navigate(`/newspapers/${mutation.data.id}`, { replace: true }); }, [mutation.isSuccess, mutation.data, navigate]);
  if (isEdit && newspaperQuery.isLoading) return <LoadingState label="Loading newspaper form" />;
  if (isEdit && newspaperQuery.isError) return <ErrorState message={newspaperQuery.error.status === 404 ? 'Newspaper not found.' : newspaperQuery.error.message} onRetry={newspaperQuery.refetch} />;
  const submit = (request) => isEdit ? update.mutate({ id: newspaperId, request }) : create.mutate(request);
  return <div className="mx-auto max-w-3xl space-y-7"><Link className="inline-flex items-center gap-2 text-sm font-semibold text-[#706a65] hover:text-[#b42318]" to={isEdit ? `/newspapers/${newspaperId}` : '/newspapers'}><ArrowLeft size={17} /> Back</Link><PageHeader eyebrow={isEdit ? 'Edit newspaper' : 'New newspaper'} title={isEdit ? newspaperQuery.data.name : 'Add a newspaper'} description="Only fields supported by the newspaper catalog API are shown." /><div className="rounded-3xl border border-[#e6e1dd] bg-white p-5 sm:p-8"><NewspaperForm initialValues={isEdit ? newspaperQuery.data : undefined} isSubmitting={mutation.isPending} serverError={mutation.error} onSubmit={submit} submitLabel={isEdit ? 'Save changes' : 'Create newspaper'} /></div></div>;
}
