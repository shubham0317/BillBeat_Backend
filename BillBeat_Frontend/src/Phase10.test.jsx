import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import PaperBoyCard from './components/paper-boys/PaperBoyCard';
import PaperBoyForm from './components/paper-boys/PaperBoyForm';
import CustomerForm from './components/customers/CustomerForm';
import { createPaperBoy, getPaperBoy, getPaperBoys, updatePaperBoy } from './services/paperBoyService';
import { paperBoyKeys, usePaperBoy, usePaperBoyMutations, usePaperBoys } from './queries/paperBoyQueries';

vi.mock('./services/paperBoyService', () => ({ getPaperBoys: vi.fn(), getPaperBoy: vi.fn(), createPaperBoy: vi.fn(), updatePaperBoy: vi.fn() }));

const paperBoy = { id: 7, name: 'Ramesh Kumar', phone: '9876543210', active: true, username: 'ramesh', createdAt: '2026-09-01T09:00:00' };

function renderWithQuery(ui) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(<QueryClientProvider client={queryClient}><MemoryRouter>{ui}</MemoryRouter></QueryClientProvider>);
}

function QueryProbe({ id }) {
  const list = usePaperBoys();
  const detail = usePaperBoy(id);
  const mutations = usePaperBoyMutations();
  return <div><span>{list.data?.[0]?.name || 'no-list'}</span><span>{detail.data?.name || 'no-detail'}</span><button onClick={() => mutations.create.mutate({ name: 'New', phone: '1' })}>Create</button><button onClick={() => mutations.update.mutate({ id, request: { name: 'Updated', phone: '2' } })}>Update</button></div>;
}

beforeEach(() => { vi.clearAllMocks(); getPaperBoys.mockResolvedValue([paperBoy]); getPaperBoy.mockResolvedValue(paperBoy); createPaperBoy.mockResolvedValue({ ...paperBoy, id: 8 }); updatePaperBoy.mockResolvedValue({ ...paperBoy, name: 'Updated' }); });
afterEach(cleanup);

describe('Phase 10 paper boy management', () => {
  test('keeps the Phase 8 list query key compatible', () => { expect(paperBoyKeys.all).toEqual(['paper-boys']); });
  test('uses a distinct paper boy detail query key', () => { expect(paperBoyKeys.detail(7)).toEqual(['paper-boys', 7]); });
  test('renders a paper boy card with phone and status', () => { renderWithQuery(<PaperBoyCard paperBoy={paperBoy} />); expect(screen.getByText('Ramesh Kumar')).toBeInTheDocument(); expect(screen.getByText('9876543210')).toBeInTheDocument(); expect(screen.getByText('Active')).toBeInTheDocument(); });
  test('links a paper boy card to its detail page', () => { renderWithQuery(<PaperBoyCard paperBoy={paperBoy} />); expect(screen.getByRole('link')).toHaveAttribute('href', '/paper-boys/7'); });
  test('loads the list and detail queries', async () => { renderWithQuery(<QueryProbe id={7} />); expect(await screen.findAllByText('Ramesh Kumar')).toHaveLength(2); expect(getPaperBoys).toHaveBeenCalledOnce(); expect(getPaperBoy).toHaveBeenCalledWith(7); });
  test('does not fetch a detail when its id is missing', async () => { renderWithQuery(<QueryProbe />); await screen.findByText('Ramesh Kumar'); expect(getPaperBoy).not.toHaveBeenCalled(); });
  test('creates a paper boy through the mutation layer', async () => { const user = userEvent.setup(); renderWithQuery(<QueryProbe id={7} />); await user.click(screen.getByRole('button', { name: 'Create' })); await waitFor(() => expect(createPaperBoy).toHaveBeenCalledWith(expect.objectContaining({ name: 'New', phone: '1' }), expect.anything())); });
  test('updates a paper boy through the mutation layer', async () => { const user = userEvent.setup(); renderWithQuery(<QueryProbe id={7} />); await user.click(screen.getByRole('button', { name: 'Update' })); await waitFor(() => expect(updatePaperBoy).toHaveBeenCalledWith(7, { name: 'Updated', phone: '2' })); });
  test('submits a create form without login fields when login is not selected', async () => { const submit = vi.fn(); const user = userEvent.setup(); render(<PaperBoyForm onSubmit={submit} submitLabel="Create paper boy" />); await user.type(screen.getByLabelText('Name'), 'Suresh'); await user.type(screen.getByLabelText('Phone'), '9999999999'); await user.click(screen.getByRole('button', { name: 'Create paper boy' })); expect(submit).toHaveBeenCalledWith({ name: 'Suresh', phone: '9999999999' }); });
  test('submits optional login details only during create', async () => { const submit = vi.fn(); const user = userEvent.setup(); render(<PaperBoyForm onSubmit={submit} submitLabel="Create paper boy" />); await user.type(screen.getByLabelText('Name'), 'Suresh'); await user.type(screen.getByLabelText('Phone'), '9999999999'); await user.click(screen.getByLabelText('Create a login account')); await screen.findByLabelText('Username'); await user.type(screen.getByLabelText('Username'), 'suresh'); await user.click(screen.getByRole('button', { name: 'Create paper boy' })); await waitFor(() => expect(submit).toHaveBeenCalledWith({ name: 'Suresh', phone: '9999999999', createLoginUser: true, username: 'suresh' })); });
  test('does not expose credentials while editing', () => { render(<PaperBoyForm isEdit initialValues={paperBoy} onSubmit={vi.fn()} submitLabel="Save changes" />); expect(screen.queryByLabelText('Username')).not.toBeInTheDocument(); expect(screen.queryByLabelText('Password')).not.toBeInTheDocument(); expect(screen.getByText(/cannot be changed here/i)).toBeInTheDocument(); });
  test('submits edit requests with only name and phone', async () => { const submit = vi.fn(); const user = userEvent.setup(); render(<PaperBoyForm isEdit initialValues={paperBoy} onSubmit={submit} submitLabel="Save changes" />); await user.clear(screen.getByLabelText('Name')); await user.type(screen.getByLabelText('Name'), 'Ramesh Updated'); await user.click(screen.getByRole('button', { name: 'Save changes' })); expect(submit).toHaveBeenCalledWith({ name: 'Ramesh Updated', phone: '9876543210' }); });
  test('provides a paper boy dropdown with an unassigned choice for customers', () => { render(<CustomerForm beats={[{ id: 1, name: 'North' }]} paperBoys={[paperBoy]} onSubmit={vi.fn()} submitLabel="Create customer" />); expect(screen.getByRole('option', { name: 'None / unassigned' })).toHaveValue(''); expect(screen.getByRole('option', { name: 'Ramesh Kumar' })).toHaveValue('7'); });
});
