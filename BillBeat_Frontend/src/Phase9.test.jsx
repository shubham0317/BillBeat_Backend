import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { AuthProvider } from './context/AuthContext';
import AppRoutes from './routes/AppRoutes';
import { getCurrentUser } from './services/authService';
import { getCustomer } from './services/customerService';
import { getBill } from './services/billService';
import { getPayments } from './services/paymentService';
import { getWhatsAppStatus, sendWhatsAppBill } from './services/whatsappService';
import BillCard from './components/bills/BillCard';

vi.mock('./services/authService', () => ({ getCurrentUser: vi.fn(), login: vi.fn(), registerVendor: vi.fn() }));
vi.mock('./services/beatService', () => ({ getBeat: vi.fn(), getBeats: vi.fn().mockResolvedValue([]) }));
vi.mock('./services/customerService', () => ({ getCustomer: vi.fn(), getCustomers: vi.fn(), createCustomer: vi.fn(), updateCustomer: vi.fn(), patchCustomerStatus: vi.fn() }));
vi.mock('./services/billService', () => ({ getBill: vi.fn(), getBills: vi.fn(), generateBills: vi.fn() }));
vi.mock('./services/paymentService', () => ({ getPayments: vi.fn(), recordPayment: vi.fn() }));
vi.mock('./services/whatsappService', () => ({ getWhatsAppStatus: vi.fn(), sendWhatsAppBill: vi.fn() }));

const authResponse = { token: 'jwt-token', tokenType: 'Bearer', userId: 1, username: 'vendor_username', role: 'VENDOR', vendorId: 1, businessName: 'Example Newspapers', paperBoyId: null };
const bill = { id: 50, customerId: 10, customerName: 'Rahul Sharma', customerMobile: '9876543210', vendorId: 1, billingPeriod: '2026-08', startDate: '2026-08-01', endDate: '2026-08-31', currentAmount: 600, previousOutstanding: 100, totalAmount: 700, paidAmount: 200, dueAmount: 500, status: 'PARTIALLY_PAID', billItems: [], whatsAppStatus: null, whatsAppProviderMessageId: null, createdAt: '2026-09-07T10:30:00' };
const customer = { id: 10, name: 'Rahul Sharma', mobileNumber: '9876543210', address: 'House 23', whatsAppEnabled: true, active: true };
const statuses = ['CREATED', 'QUEUED', 'SENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED', 'RETRY_PENDING'];

function renderApp(route = '/bills/50') {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={queryClient}><MemoryRouter initialEntries={[route]}><AuthProvider><AppRoutes /></AuthProvider></MemoryRouter></QueryClientProvider>);
}

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('billbeat.auth.token', 'stored-token');
  vi.clearAllMocks();
  getCurrentUser.mockResolvedValue(authResponse);
  getCustomer.mockResolvedValue(customer);
  getBill.mockResolvedValue(bill);
  getPayments.mockResolvedValue([]);
  getWhatsAppStatus.mockResolvedValue({ status: 'SENT', attemptCount: 1 });
  window.confirm = vi.fn(() => true);
});

afterEach(() => cleanup());

describe('WhatsApp Bill Detail UI', () => {
  test('renders supported statuses and safely handles unknown status', async () => {
    for (const status of statuses) {
      cleanup();
      getBill.mockResolvedValue({ ...bill, whatsAppStatus: status });
      getWhatsAppStatus.mockResolvedValue({ status, attemptCount: 1 });
      renderApp();
      expect(await screen.findByText(status === 'RETRY_PENDING' ? 'Retry pending' : status === 'CREATED' ? 'Not sent' : status[0] + status.slice(1).toLowerCase())).toBeInTheDocument();
    }
  });

  test('confirms and sends WhatsApp without a request body', async () => {
    sendWhatsAppBill.mockResolvedValue({ status: 'SENT' });
    const user = userEvent.setup();
    renderApp();
    await user.click(await screen.findByRole('button', { name: 'Send bill' }));
    expect(window.confirm).toHaveBeenCalled();
    await waitFor(() => expect(sendWhatsAppBill).toHaveBeenCalled());
    expect(sendWhatsAppBill.mock.calls[0][0]).toBe(50);
  });

  test('canceling confirmation does not call the backend', async () => {
    window.confirm = vi.fn(() => false);
    const user = userEvent.setup();
    renderApp();
    await user.click(await screen.findByRole('button', { name: 'Send bill' }));
    expect(sendWhatsAppBill).not.toHaveBeenCalled();
  });

  test('shows normalized backend send errors', async () => {
    sendWhatsAppBill.mockRejectedValue(new Error('Customer has WhatsApp notifications disabled'));
    const user = userEvent.setup();
    renderApp();
    await user.click(await screen.findByRole('button', { name: 'Send bill' }));
    expect(await screen.findByText('Customer has WhatsApp notifications disabled')).toBeInTheDocument();
  });

  test('customer WhatsApp disabled disables Send action and displays explanation', async () => {
    getCustomer.mockResolvedValue({ ...customer, whatsAppEnabled: false });
    renderApp();
    const button = await screen.findByRole('button', { name: 'Send bill' });
    expect(button).toBeDisabled();
    expect(screen.getByText('WhatsApp notifications are disabled for this customer.')).toBeInTheDocument();
  });

  test('customer loading state safely keeps Send action disabled', async () => {
    getCustomer.mockReturnValue(new Promise(() => {}));
    renderApp();
    const button = await screen.findByRole('button', { name: 'Checking eligibility...' });
    expect(button).toBeDisabled();
  });

  test('existing QUEUED bill enables initial polling automatically', async () => {
    getBill.mockResolvedValue({ ...bill, whatsAppStatus: 'QUEUED' });
    getWhatsAppStatus.mockResolvedValue({ status: 'QUEUED', attemptCount: 0 });
    renderApp();
    await waitFor(() => expect(getWhatsAppStatus).toHaveBeenCalledWith('50'));
    expect(await screen.findByRole('button', { name: 'Queued...' })).toBeDisabled();
    expect(screen.getByText('Message is currently being processed by the system.')).toBeInTheDocument();
  });

  test('existing SENDING bill displays in-progress state and prevents duplicate send', async () => {
    getBill.mockResolvedValue({ ...bill, whatsAppStatus: 'SENDING' });
    getWhatsAppStatus.mockResolvedValue({ status: 'SENDING', attemptCount: 1 });
    renderApp();
    await waitFor(() => expect(getWhatsAppStatus).toHaveBeenCalledWith('50'));
    const button = await screen.findByRole('button', { name: 'Sending in progress...' });
    expect(button).toBeDisabled();
  });

  test('existing RETRY_PENDING bill displays Retry send action', async () => {
    getBill.mockResolvedValue({ ...bill, whatsAppStatus: 'RETRY_PENDING' });
    getWhatsAppStatus.mockResolvedValue({ status: 'RETRY_PENDING', attemptCount: 2 });
    renderApp();
    const button = await screen.findByRole('button', { name: 'Retry send' });
    expect(button).toBeEnabled();
  });

  test('SENT status allows resending without claiming terminal delivery', async () => {
    getBill.mockResolvedValue({ ...bill, whatsAppStatus: 'SENT' });
    getWhatsAppStatus.mockResolvedValue({ status: 'SENT', attemptCount: 1 });
    renderApp();
    const button = await screen.findByRole('button', { name: 'Resend bill' });
    expect(button).toBeEnabled();
  });

  test('404 from status endpoint is gracefully handled as Not sent', async () => {
    const error404 = new Error('No WhatsApp message history found for bill ID: 50');
    error404.status = 404;
    getBill.mockResolvedValue({ ...bill, whatsAppStatus: 'CREATED' });
    getWhatsAppStatus.mockRejectedValue(error404);
    renderApp();
    expect(await screen.findByText('Not sent')).toBeInTheDocument();
    expect(screen.queryByText('No WhatsApp message history found')).not.toBeInTheDocument();
  });
});

describe('BillCard WhatsApp Status', () => {
  test('displays compact status for various WhatsApp states', () => {
    const { rerender } = render(
      <MemoryRouter>
        <BillCard bill={{ ...bill, whatsAppStatus: 'DELIVERED' }} />
      </MemoryRouter>
    );
    expect(screen.getByText('Delivered')).toBeInTheDocument();

    rerender(
      <MemoryRouter>
        <BillCard bill={{ ...bill, whatsAppStatus: 'QUEUED' }} />
      </MemoryRouter>
    );
    expect(screen.getByText('Queued')).toBeInTheDocument();

    rerender(
      <MemoryRouter>
        <BillCard bill={{ ...bill, whatsAppStatus: null }} />
      </MemoryRouter>
    );
    expect(screen.getByText('Not sent')).toBeInTheDocument();
  });
});