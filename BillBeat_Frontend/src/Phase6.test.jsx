import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { AuthProvider } from './context/AuthContext';
import AppRoutes from './routes/AppRoutes';
import { getCurrentUser } from './services/authService';
import { getCustomers, getCustomer } from './services/customerService';
import { getBeats } from './services/beatService';
import { generateBills, getBill, getBills } from './services/billService';
import { getPayments } from './services/paymentService';
import { getWhatsAppStatus } from './services/whatsappService';

vi.mock('./services/authService', () => ({ getCurrentUser: vi.fn(), login: vi.fn(), registerVendor: vi.fn() }));
vi.mock('./services/beatService', () => ({ getBeat: vi.fn(), getBeats: vi.fn() }));
vi.mock('./services/customerService', () => ({ getCustomer: vi.fn(), getCustomers: vi.fn(), createCustomer: vi.fn(), updateCustomer: vi.fn(), patchCustomerStatus: vi.fn() }));
vi.mock('./services/billService', () => ({ getBill: vi.fn(), getBills: vi.fn(), generateBills: vi.fn() }));
vi.mock('./services/paymentService', () => ({ getPayments: vi.fn(), recordPayment: vi.fn() }));
vi.mock('./services/whatsappService', () => ({ getWhatsAppStatus: vi.fn(), sendWhatsAppBill: vi.fn() }));

const authResponse = { token: 'jwt-token', tokenType: 'Bearer', userId: 1, username: 'vendor_username', role: 'VENDOR', vendorId: 1, businessName: 'Example Newspapers', paperBoyId: null };
const customer = { id: 10, name: 'Rahul Sharma', mobileNumber: '9876543210', address: 'House 23, Civil Lines', beatId: 1, beatName: 'Civil Lines', paperBoyId: null, paperBoyName: null, notes: null, whatsAppEnabled: true, active: true, activeSubscriptionsCount: 0, currentBillAmount: 0, dueAmount: 0, billStatus: 'PAID', createdAt: '2026-09-07T10:30:00' };
const bill = { id: 50, customerId: 10, customerName: 'Rahul Sharma', customerMobile: '9876543210', vendorId: 1, billingPeriod: '2026-08', startDate: '2026-08-01', endDate: '2026-08-31', currentAmount: 600, previousOutstanding: 100, totalAmount: 700, paidAmount: 200, dueAmount: 500, status: 'PARTIALLY_PAID', billItems: [{ id: 1, newspaperName: 'Daily News', copies: 2, unitPrice: 6.5, daysCount: 26, amount: 338 }], whatsAppStatus: 'QUEUED', whatsAppProviderMessageId: null, createdAt: '2026-09-07T10:30:00' };
const page = (content = [bill]) => ({ content, pageNumber: 0, pageSize: 20, totalElements: content.length, totalPages: content.length ? 1 : 0, last: true });
const customerPage = { content: [customer], pageNumber: 0, pageSize: 100, totalElements: 1, totalPages: 1, last: true };

function renderApp(route) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={queryClient}><MemoryRouter initialEntries={[route]}><AuthProvider><AppRoutes /></AuthProvider></MemoryRouter></QueryClientProvider>);
}

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('billbeat.auth.token', 'stored-token');
  vi.clearAllMocks();
  getCurrentUser.mockResolvedValue(authResponse);
  getBeats.mockResolvedValue([]);
  getCustomers.mockResolvedValue(customerPage);
  getCustomer.mockResolvedValue(customer);
  getBills.mockResolvedValue(page());
  getPayments.mockResolvedValue([]);
  getWhatsAppStatus.mockResolvedValue({ status: 'QUEUED', attemptCount: 0 });
});

afterEach(() => cleanup());

describe('bill list and detail', () => {
  test('renders bills, filters, pagination, and customer-scoped context', async () => {
    renderApp('/bills');
    expect(await screen.findByRole('link', { name: /Rahul Sharma/ })).toBeInTheDocument();
    const user = userEvent.setup();
    await user.selectOptions(screen.getByDisplayValue('All statuses'), 'PAID');
    await waitFor(() => expect(getBills).toHaveBeenCalledWith(expect.objectContaining({ status: 'PAID', page: 0, size: 20 })));
    await user.selectOptions(screen.getByDisplayValue('All customers'), '10');
    await waitFor(() => expect(getBills).toHaveBeenCalledWith(expect.objectContaining({ customerId: '10' })));
    fireEvent.change(screen.getByDisplayValue(''), { target: { value: '2026-08' } });
    await waitFor(() => expect(getBills).toHaveBeenCalledWith(expect.objectContaining({ billingPeriod: '2026-08' })));
    cleanup();
    renderApp('/customers/10/bills');
    expect(await screen.findByText("Rahul Sharma's bills")).toBeInTheDocument();
    expect(getBills).toHaveBeenCalledWith(expect.objectContaining({ customerId: '10' }));
  });

  test('handles loading, empty, error, pagination, and detail rendering', async () => {
    getBills.mockReturnValueOnce(new Promise(() => {}));
    renderApp('/bills');
    expect(await screen.findByText('Loading bills')).toBeInTheDocument();
    cleanup();
    getBills.mockReset();
    getBills.mockResolvedValueOnce(page([]));
    renderApp('/bills');
    expect(await screen.findByText('No bills found')).toBeInTheDocument();
    cleanup();
    getBills.mockReset();
    getBills.mockRejectedValueOnce(new Error('Bill service unavailable'));
    renderApp('/bills');
    expect(await screen.findByText('Bill service unavailable')).toBeInTheDocument();
    cleanup();
    getBills.mockReset();
    getBills.mockResolvedValue({ ...page(), totalPages: 2, totalElements: 21, last: false });
    const user = userEvent.setup();
    renderApp('/bills');
    await user.click(await screen.findByRole('button', { name: 'Next' }));
    await waitFor(() => expect(getBills).toHaveBeenCalledWith(expect.objectContaining({ page: 1 })));
    cleanup();
    getBill.mockResolvedValueOnce(bill);
    renderApp('/bills/50');
    expect(await screen.findByRole('heading', { name: 'Rahul Sharma' })).toBeInTheDocument();
    expect(screen.getByText('Daily News')).toBeInTheDocument();
    expect(screen.getByText('Previous outstanding')).toBeInTheDocument();
    expect(screen.getByText('₹500.00')).toBeInTheDocument();
  });
});

describe('bill generation', () => {
  test('validates period, sends customer-specific payload, and displays generated bills', async () => {
    generateBills.mockResolvedValue([bill]);
    const user = userEvent.setup();
    renderApp('/customers/10/bills/generate');
    expect(await screen.findByRole('button', { name: 'Generate customer bill' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Generate customer bill' })).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Billing period'), { target: { value: '2026-08' } });
    await user.click(screen.getByRole('button', { name: 'Generate customer bill' }));
    await waitFor(() => expect(generateBills).toHaveBeenCalled());
    expect(generateBills.mock.calls[0][0]).toEqual({ billingPeriod: '2026-08', customerId: 10 });
    expect(await screen.findByText('Generation completed')).toBeInTheDocument();
    expect(screen.getByText('₹700.00')).toBeInTheDocument();
  });

  test('handles duplicate generation and empty bulk results', async () => {
    const duplicate = new Error('Bill already exists');
    duplicate.status = 409;
    generateBills.mockRejectedValueOnce(duplicate);
    const user = userEvent.setup();
    renderApp('/bills/generate');
    await screen.findByRole('button', { name: 'Generate eligible bills' });
    fireEvent.change(screen.getByLabelText('Billing period'), { target: { value: '2026-08' } });
    await user.click(screen.getByRole('button', { name: 'Generate eligible bills' }));
    expect(await screen.findByText(/Bill already exists/)).toBeInTheDocument();
    cleanup();
    generateBills.mockReset();
    generateBills.mockResolvedValueOnce([]);
    renderApp('/bills/generate');
    await screen.findByRole('button', { name: 'Generate eligible bills' });
    fireEvent.change(screen.getByLabelText('Billing period'), { target: { value: '2026-08' } });
    await user.click(screen.getByRole('button', { name: 'Generate eligible bills' }));
    expect(await screen.findByText(/backend returned no generated bills/)).toBeInTheDocument();
  });
});

test('customer detail provides bill navigation without fetching bills', async () => {
  renderApp('/customers/10');
  expect(await screen.findByRole('heading', { name: 'Bills' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'View bills' })).toHaveAttribute('href', '/customers/10/bills');
  expect(screen.getByRole('link', { name: 'Generate bill' })).toHaveAttribute('href', '/customers/10/bills/generate');
  expect(getBills).not.toHaveBeenCalled();
});