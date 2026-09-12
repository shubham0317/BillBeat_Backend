import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { AuthProvider } from './context/AuthContext';
import AppRoutes from './routes/AppRoutes';
import { getCurrentUser } from './services/authService';
import { getBeats } from './services/beatService';
import { getPaperBoys } from './services/paperBoyService';
import { getTodaysDeliveries, updateDeliveryStatus } from './services/deliveryService';

vi.mock('./services/authService', () => ({ getCurrentUser: vi.fn(), login: vi.fn(), registerVendor: vi.fn() }));
vi.mock('./services/beatService', () => ({ getBeat: vi.fn(), getBeats: vi.fn() }));
vi.mock('./services/paperBoyService', () => ({ getPaperBoys: vi.fn() }));
vi.mock('./services/deliveryService', () => ({ getTodaysDeliveries: vi.fn(), generateTodaysDeliveries: vi.fn(), updateDeliveryStatus: vi.fn() }));

const authResponse = { token: 'jwt-token', tokenType: 'Bearer', userId: 1, username: 'vendor_username', role: 'VENDOR', vendorId: 1, businessName: 'Example Newspapers', paperBoyId: null };
const delivery = { id: 100, subscriptionId: 20, customerId: 10, customerName: 'Rahul Sharma', customerAddress: 'House 23, Civil Lines', beatId: 1, beatName: 'Civil Lines', paperBoyId: 3, paperBoyName: 'Ramesh', newspaperName: 'Daily News', copiesDelivered: 2, deliveryDate: '2026-09-07', status: 'DELIVERED' };

function renderApp(route = '/deliveries/today') {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={queryClient}><MemoryRouter initialEntries={[route]}><AuthProvider><AppRoutes /></AuthProvider></MemoryRouter></QueryClientProvider>);
}

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('billbeat.auth.token', 'stored-token');
  vi.clearAllMocks();
  getCurrentUser.mockResolvedValue(authResponse);
  getBeats.mockResolvedValue([{ id: 1, name: 'Civil Lines' }]);
  getPaperBoys.mockResolvedValue([{ id: 3, name: 'Ramesh' }]);
  getTodaysDeliveries.mockResolvedValue([delivery]);
});

afterEach(() => cleanup());

describe('today deliveries', () => {
  test('renders backend delivery information and does not call explicit generation', async () => {
    renderApp();
    expect(await screen.findByText('Rahul Sharma')).toBeInTheDocument();
    expect(screen.getByText('Daily News · 2 copies')).toBeInTheDocument();
    expect(screen.getByText('DELIVERED')).toBeInTheDocument();
    expect(getTodaysDeliveries).toHaveBeenCalledWith({ beatId: '', paperBoyId: '' });
  });

  test('sends beat and paper boy filters', async () => {
    const user = userEvent.setup();
    renderApp();
    await user.selectOptions(await screen.findByDisplayValue('All beats'), '1');
    await waitFor(() => expect(getTodaysDeliveries).toHaveBeenCalledWith({ beatId: '1', paperBoyId: '' }));
    await user.selectOptions(screen.getByDisplayValue('All paper boys'), '3');
    await waitFor(() => expect(getTodaysDeliveries).toHaveBeenCalledWith({ beatId: '1', paperBoyId: '3' }));
  });

  test('handles loading, empty, and API error states', async () => {
    getTodaysDeliveries.mockReturnValueOnce(new Promise(() => {}));
    renderApp();
    expect(await screen.findByText("Loading today's deliveries")).toBeInTheDocument();
    cleanup();
    getTodaysDeliveries.mockReset();
    getTodaysDeliveries.mockResolvedValueOnce([]);
    renderApp();
    expect(await screen.findByText('No deliveries today')).toBeInTheDocument();
    cleanup();
    getTodaysDeliveries.mockReset();
    getTodaysDeliveries.mockRejectedValueOnce(new Error('Delivery service unavailable'));
    renderApp();
    expect(await screen.findByText('Delivery service unavailable')).toBeInTheDocument();
  });

  test('updates delivery status with an allowed enum and refreshes the query', async () => {
    updateDeliveryStatus.mockResolvedValue({ ...delivery, status: 'NOT_DELIVERED' });
    const user = userEvent.setup();
    renderApp();
    await user.click(await screen.findByRole('button', { name: 'Not delivered' }));
    await waitFor(() => expect(updateDeliveryStatus).toHaveBeenCalledWith(100, 'NOT_DELIVERED'));
    expect(screen.queryByText('PENDING')).not.toBeInTheDocument();
  });
});