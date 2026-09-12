import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { AuthProvider } from './context/AuthContext';
import AppRoutes from './routes/AppRoutes';
import { getCurrentUser } from './services/authService';
import { getBeat, getBeats } from './services/beatService';

vi.mock('./services/authService', () => ({
  getCurrentUser: vi.fn(),
  login: vi.fn(),
  registerVendor: vi.fn(),
}));

vi.mock('./services/beatService', () => ({
  getBeat: vi.fn(),
  getBeats: vi.fn(),
}));

const authResponse = { token: 'jwt-token', tokenType: 'Bearer', userId: 1, username: 'vendor_username', role: 'VENDOR', vendorId: 1, businessName: 'Example Newspapers', paperBoyId: null };
const beats = [
  { id: 1, name: 'Civil Lines', code: 'CIVIL', description: 'Central route', defaultPaperBoyId: 3, defaultPaperBoyName: 'Ramesh', customerCount: 87, paidCount: 62, dueCount: 25, active: true, createdAt: '2026-09-07T10:30:00' },
  { id: 2, name: 'Shankar Nagar', code: 'SHANKAR', description: null, defaultPaperBoyId: null, defaultPaperBoyName: null, customerCount: 65, paidCount: 57, dueCount: 8, active: false, createdAt: '2026-09-06T10:30:00' },
];

function renderApp(route) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={queryClient}><MemoryRouter initialEntries={[route]}><AuthProvider><AppRoutes /></AuthProvider></MemoryRouter></QueryClientProvider>);
}

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  localStorage.setItem('billbeat.auth.token', 'stored-token');
  getCurrentUser.mockResolvedValue(authResponse);
});

afterEach(() => cleanup());

describe('Phase 3 dashboard and beats', () => {
  test('dashboard renders reliable beat metrics without a dashboard endpoint', async () => {
    getBeats.mockResolvedValue(beats);
    renderApp('/dashboard');
    await waitFor(() => expect(screen.getByText('Good morning.')).toBeInTheDocument());
    expect(screen.getByText('Total beats')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('Customers in active beats')).toBeInTheDocument();
    expect(screen.getAllByText('87')).toHaveLength(2);
    expect(getBeats).toHaveBeenCalledTimes(1);
    expect(getBeats.mock.calls[0][0].queryKey).toEqual(['beats']);
    expect(getBeat).not.toHaveBeenCalled();
  });

  test('dashboard shows loading and API failure states', async () => {
    getBeats.mockReturnValueOnce(new Promise(() => {}));
    renderApp('/dashboard');
    expect(await screen.findByText('Preparing your route overview')).toBeInTheDocument();

    getBeats.mockReset();
    getBeats.mockRejectedValueOnce(new Error('Beats unavailable'));
    cleanup();
    renderApp('/dashboard');
    expect(await screen.findByText('Beats unavailable')).toBeInTheDocument();
  });

  test('beats page renders backend beats and empty state', async () => {
    getBeats.mockResolvedValueOnce(beats);
    renderApp('/beats');
    expect(await screen.findByText('Civil Lines')).toBeInTheDocument();
    expect(screen.getByText('Shankar Nagar')).toBeInTheDocument();

    getBeats.mockReset();
    getBeats.mockResolvedValueOnce([]);
    cleanup();
    renderApp('/beats');
    expect(await screen.findByText('No beats yet')).toBeInTheDocument();
  });

  test('beats page handles loading and API failure', async () => {
    getBeats.mockReturnValueOnce(new Promise(() => {}));
    renderApp('/beats');
    expect(await screen.findByText('Loading your beats')).toBeInTheDocument();

    getBeats.mockReset();
    getBeats.mockRejectedValueOnce(new Error('Cannot load beats'));
    cleanup();
    renderApp('/beats');
    expect(await screen.findByText('Cannot load beats')).toBeInTheDocument();
  });

  test('opening a beat navigates to its detail page', async () => {
    getBeats.mockResolvedValue(beats);
    getBeat.mockResolvedValue(beats[0]);
    const user = userEvent.setup();
    renderApp('/beats');
    await user.click(await screen.findByRole('link', { name: /Civil Lines/ }));
    expect(await screen.findByRole('heading', { name: 'Civil Lines' })).toBeInTheDocument();
    expect(screen.getByText('Central route')).toBeInTheDocument();
  });

  test('beat detail handles loading, API failure, and 404', async () => {
    getBeat.mockReturnValueOnce(new Promise(() => {}));
    renderApp('/beats/1');
    expect(await screen.findByText('Loading beat details')).toBeInTheDocument();

    getBeat.mockReset();
    getBeat.mockRejectedValueOnce(new Error('Beat service unavailable'));
    cleanup();
    renderApp('/beats/1');
    expect(await screen.findByText('Beat service unavailable')).toBeInTheDocument();

    getBeat.mockReset();
    const notFound = new Error('Beat not found with ID: 999');
    notFound.status = 404;
    getBeat.mockRejectedValueOnce(notFound);
    cleanup();
    renderApp('/beats/999');
    expect(await screen.findByText('Beat not found.')).toBeInTheDocument();
  });
});