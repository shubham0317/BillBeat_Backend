import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import NewspaperCard from './components/newspapers/NewspaperCard';
import NewspaperForm from './components/newspapers/NewspaperForm';
import NewspaperListPage from './pages/newspapers/NewspaperListPage';
import NewspaperDetailPage from './pages/newspapers/NewspaperDetailPage';
import { createNewspaper, getNewspaper, getNewspapers, updateNewspaper } from './services/newspaperService';
import { newspaperKeys, useNewspaperMutations, useNewspapers } from './queries/newspaperQueries';

vi.mock('./services/newspaperService', () => ({ getNewspapers: vi.fn(), getNewspaper: vi.fn(), createNewspaper: vi.fn(), updateNewspaper: vi.fn() }));

const newspaper = { id: 4, name: 'Daily News', code: 'DN', defaultPrice: 6.5, language: 'English', active: true, createdAt: '2026-09-01T09:00:00' };

function renderWithQuery(ui, route = '/') {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(<QueryClientProvider client={queryClient}><MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter></QueryClientProvider>);
}

function MutationProbe() {
  const list = useNewspapers();
  const mutations = useNewspaperMutations();
  return <div><span>{list.data?.[0]?.name || 'none'}</span><button onClick={() => mutations.create.mutate({ name: 'New Daily', defaultPrice: 5, code: null, language: null })}>Create</button><button onClick={() => mutations.update.mutate({ id: 4, request: { name: 'Updated Daily', defaultPrice: 7, code: 'UD', language: 'Hindi' } })}>Update</button></div>;
}

beforeEach(() => { vi.clearAllMocks(); getNewspapers.mockResolvedValue([newspaper]); getNewspaper.mockResolvedValue(newspaper); createNewspaper.mockResolvedValue({ ...newspaper, id: 5 }); updateNewspaper.mockResolvedValue({ ...newspaper, name: 'Updated Daily' }); });
afterEach(cleanup);

describe('Phase 11 newspaper management', () => {
  test('preserves the Phase 5 collection query key', () => { expect(newspaperKeys.all).toEqual(['newspapers']); });
  test('renders newspaper list cards', async () => { renderWithQuery(<NewspaperListPage />); expect(await screen.findByText('Daily News')).toBeInTheDocument(); expect(screen.getByText('₹6.50')).toBeInTheDocument(); expect(screen.getByText('Active')).toBeInTheDocument(); });
  test('renders an empty newspaper state', async () => { getNewspapers.mockResolvedValueOnce([]); renderWithQuery(<NewspaperListPage />); expect(await screen.findByText('No newspapers yet')).toBeInTheDocument(); });
  test('renders optional code and language on a card', () => { renderWithQuery(<NewspaperCard newspaper={newspaper} />); expect(screen.getByText('DN')).toBeInTheDocument(); expect(screen.getByText('English')).toBeInTheDocument(); });
  test('safely renders a card without optional code or language', () => { renderWithQuery(<NewspaperCard newspaper={{ ...newspaper, code: null, language: null }} />); expect(screen.getByText('No code assigned')).toBeInTheDocument(); expect(screen.queryByText('English')).not.toBeInTheDocument(); });
  test('links each newspaper card to its detail page', () => { renderWithQuery(<NewspaperCard newspaper={newspaper} />); expect(screen.getByRole('link')).toHaveAttribute('href', '/newspapers/4'); });
  test('renders newspaper detail fields and read-only status', async () => { renderWithQuery(<Routes><Route path="/newspapers/:newspaperId" element={<NewspaperDetailPage />} /></Routes>, '/newspapers/4'); expect(await screen.findByRole('heading', { name: 'Daily News' })).toBeInTheDocument(); expect(screen.getByText('₹6.50')).toBeInTheDocument(); expect(screen.getByText('English')).toBeInTheDocument(); expect(screen.getByText(/cannot be changed here/i)).toBeInTheDocument(); });
  test('does not expose delete or activation controls', async () => { renderWithQuery(<Routes><Route path="/newspapers/:newspaperId" element={<NewspaperDetailPage />} /></Routes>, '/newspapers/4'); await screen.findByRole('heading', { name: 'Daily News' }); expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument(); expect(screen.queryByRole('button', { name: /activate|deactivate/i })).not.toBeInTheDocument(); });
  test('renders newspaper form fields', () => { render(<NewspaperForm onSubmit={vi.fn()} submitLabel="Create newspaper" />); expect(screen.getByLabelText('Name')).toBeInTheDocument(); expect(screen.getByLabelText('Default price')).toHaveAttribute('min', '0.01'); expect(screen.getByLabelText('Code')).toBeInTheDocument(); expect(screen.getByLabelText('Language')).toBeInTheDocument(); });
  test('validates a default price below 0.01', async () => { const user = userEvent.setup(); render(<NewspaperForm onSubmit={vi.fn()} submitLabel="Create newspaper" />); await user.type(screen.getByLabelText('Name'), 'Daily'); await user.type(screen.getByLabelText('Default price'), '0'); await user.click(screen.getByRole('button', { name: 'Create newspaper' })); expect(await screen.findByText('Price must be greater than zero')).toBeInTheDocument(); });
  test('submits the exact create payload', async () => { const submit = vi.fn(); const user = userEvent.setup(); render(<NewspaperForm onSubmit={submit} submitLabel="Create newspaper" />); await user.type(screen.getByLabelText('Name'), 'Metro News'); await user.type(screen.getByLabelText('Default price'), '8.5'); await user.type(screen.getByLabelText('Code'), 'MN'); await user.type(screen.getByLabelText('Language'), 'Kannada'); await user.click(screen.getByRole('button', { name: 'Create newspaper' })); expect(submit).toHaveBeenCalledWith({ name: 'Metro News', defaultPrice: 8.5, code: 'MN', language: 'Kannada' }); });
  test('submits empty optional values as null', async () => { const submit = vi.fn(); const user = userEvent.setup(); render(<NewspaperForm onSubmit={submit} submitLabel="Create newspaper" />); await user.type(screen.getByLabelText('Name'), 'Metro News'); await user.type(screen.getByLabelText('Default price'), '8'); await user.click(screen.getByRole('button', { name: 'Create newspaper' })); expect(submit).toHaveBeenCalledWith({ name: 'Metro News', defaultPrice: 8, code: null, language: null }); });
  test('loads values in the edit form', () => { render(<NewspaperForm initialValues={newspaper} onSubmit={vi.fn()} submitLabel="Save changes" />); expect(screen.getByDisplayValue('Daily News')).toBeInTheDocument(); expect(screen.getByDisplayValue('6.5')).toBeInTheDocument(); expect(screen.getByDisplayValue('DN')).toBeInTheDocument(); });
  test('uses create and update mutation payloads', async () => { const user = userEvent.setup(); renderWithQuery(<MutationProbe />); expect(await screen.findByText('Daily News')).toBeInTheDocument(); await user.click(screen.getByRole('button', { name: 'Create' })); await waitFor(() => expect(createNewspaper).toHaveBeenCalledWith(expect.objectContaining({ name: 'New Daily', defaultPrice: 5 }), expect.anything())); await user.click(screen.getByRole('button', { name: 'Update' })); await waitFor(() => expect(updateNewspaper).toHaveBeenCalledWith(4, { name: 'Updated Daily', defaultPrice: 7, code: 'UD', language: 'Hindi' })); });
});
