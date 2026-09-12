import { ArrowLeft } from 'lucide-react';
import { useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import PaperBoyForm from '../../components/paper-boys/PaperBoyForm';
import { ErrorState, LoadingState } from '../../components/common/StateViews';
import PageHeader from '../../components/layout/PageHeader';
import { usePaperBoy, usePaperBoyMutations } from '../../queries/paperBoyQueries';

export default function PaperBoyFormPage({ mode }) {
  const isEdit = mode === 'edit';
  const { paperBoyId } = useParams();
  const navigate = useNavigate();
  const paperBoyQuery = usePaperBoy(paperBoyId);
  const { create, update } = usePaperBoyMutations();
  const mutation = isEdit ? update : create;
  useEffect(() => { if (mutation.isSuccess && mutation.data?.id) navigate(`/paper-boys/${mutation.data.id}`, { replace: true }); }, [mutation.isSuccess, mutation.data, navigate]);
  if (isEdit && paperBoyQuery.isLoading) return <LoadingState label="Loading paper boy form" />;
  if (isEdit && paperBoyQuery.isError) return <ErrorState message={paperBoyQuery.error.message} onRetry={paperBoyQuery.refetch} />;
  const submit = (request) => isEdit ? update.mutate({ id: paperBoyId, request }) : create.mutate(request);
  return <div className="mx-auto max-w-3xl space-y-7"><Link className="inline-flex items-center gap-2 text-sm font-semibold text-[#706a65] hover:text-[#b42318]" to={isEdit ? `/paper-boys/${paperBoyId}` : '/paper-boys'}><ArrowLeft size={17} /> Back</Link><PageHeader eyebrow={isEdit ? 'Edit paper boy' : 'New paper boy'} title={isEdit ? paperBoyQuery.data.name : 'Add a paper boy'} description={isEdit ? 'Only name and phone are supported by the update API.' : 'You can optionally create a login account during setup.'} /><div className="rounded-3xl border border-[#e6e1dd] bg-white p-5 sm:p-8"><PaperBoyForm initialValues={isEdit ? paperBoyQuery.data : undefined} isEdit={isEdit} isSubmitting={mutation.isPending} serverError={mutation.error} onSubmit={submit} submitLabel={isEdit ? 'Save changes' : 'Create paper boy'} /></div></div>;
}
