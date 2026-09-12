import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { AuthProvider } from './context/AuthContext';
import AppRoutes from './routes/AppRoutes';
import { getCurrentUser } from './services/authService';
import { getBill } from './services/billService';
import { getPayments, recordPayment } from './services/paymentService';
import { getCustomers } from './services/customerService';
import { getBeats } from './services/beatService';

vi.mock('./services/authService', () => ({ getCurrentUser: vi.fn(), login: vi.fn(), registerVendor: vi.fn() }));
vi.mock('./services/beatService', () => ({ getBeat: vi.fn(), getBeats: vi.fn() }));
vi.mock('./services/customerService', () => ({ getCustomer: vi.fn(), getCustomers: vi.fn(), createCustomer: vi.fn(), updateCustomer: vi.fn(), patchCustomerStatus: vi.fn() }));
vi.mock('./services/billService', () => ({ getBill: vi.fn(), getBills: vi.fn(), generateBills: vi.fn() }));
vi.mock('./services/paymentService', () => ({ getPayments: vi.fn(), recordPayment: vi.fn() }));

const authResponse = { token: 'jwt-token', tokenType: 'Bearer', userId: 1, username: 'vendor_username', role: 'VENDOR', vendorId: 1, businessName: 'Example Newspapers', paperBoyId: null };
const bill = { id: 50, customerId: 10, customerName: 'Rahul Sharma', customerMobile: '9876543210', vendorId: 1, billingPeriod: '2026-08', startDate: '2026-08-01', endDate: '2026-08-31', currentAmount: 600, previousOutstanding: 100, totalAmount: 700, paidAmount: 200, dueAmount: 500, status: 'PARTIALLY_PAID', billItems: [], whatsAppStatus: null, whatsAppProviderMessageId: null, createdAt: '2026-09-07T10:30:00' };
const paidBill = { ...bill, paidAmount: 700, dueAmount: 0, status: 'PAID' };
const payment = { id: 90, billId: 50, customerId: 10, customerName: 'Rahul Sharma', amount: 200, paymentDate: '2026-09-07T10:30:00', paymentMethod: 'UPI', transactionRef: 'UPI-REFERENCE-123', notes: 'Paid at office', remainingBillDueAmount: 300 };

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
  getCustomers.mockResolvedValue({ content: [], pageNumber: 0, pageSize: 100, totalElements: 0, totalPages: 0, last: true });
  getPayments.mockResolvedValue([]);
  getBill.mockResolvedValue(bill);
});

afterEach(() => cleanup());

describe('bill payment integration', () => {
  test('bill detail shows payment action, history states, and actual payment fields', async () => {
    getPayments.mockResolvedValue([payment]);
    renderApp('/bills/50');
    expect(await screen.findByRole('link', { name: /Record payment/ })).toHaveAttribute('href', '/bills/50/payment');
    expect(screen.getAllByText('₹200.00').length).toBeGreaterThan(0);
    expect(screen.getByText('UPI')).toBeInTheDocument();
    expect(await screen.findByText(/UPI-REFERENCE-123/)).toBeInTheDocument();
    expect(await screen.findByText('Paid at office')).toBeInTheDocument();
  });

  test('payment history handles loading and empty states', async () => {
    getPayments.mockReturnValueOnce(new Promise(() => {}));
    renderApp('/bills/50');
    expect(await screen.findByText('Loading payment history')).toBeInTheDocument();
    cleanup();
    getPayments.mockReset();
    getPayments.mockResolvedValueOnce([]);
    renderApp('/bills/50');
    expect(await screen.findByText('No payments yet')).toBeInTheDocument();
  });

  test('paid bills do not expose record payment action', async () => {
    getBill.mockResolvedValue(paidBill);
    renderApp('/bills/50');
    expect(await screen.findByText('This bill is fully paid. No payment is currently due.')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Record payment/ })).not.toBeInTheDocument();
  });

  test('payment form validates amount and method against backend due amount', async () => {
    const user = userEvent.setup();
    renderApp('/bills/50/payment');
    expect(await screen.findByText('₹500.00')).toBeInTheDocument();
    await user.clear(screen.getByLabelText('Amount'));
    await user.type(screen.getByLabelText('Amount'), '600');
    await user.click(screen.getByRole('button', { name: 'Record payment' }));
    expect(await screen.findByText(/cannot exceed the current due amount/)).toBeInTheDocument();
    expect(recordPayment).not.toHaveBeenCalled();
  });

  test('successful payment refreshes bill detail and displays updated balances', async () => {
    getBill.mockResolvedValueOnce(bill).mockResolvedValue({ ...bill, paidAmount: 400, dueAmount: 300, status: 'PARTIALLY_PAID' });
    recordPayment.mockResolvedValue(payment);
    const user = userEvent.setup();
    renderApp('/bills/50/payment');
    await screen.findByText('₹500.00');
    await user.type(screen.getByLabelText('Amount'), '200');
    await user.selectOptions(screen.getByLabelText('Payment method'), 'UPI');
    await user.click(screen.getByRole('button', { name: 'Record payment' }));
    await waitFor(() => expect(recordPayment).toHaveBeenCalled());
    const paymentRequest = recordPayment.mock.calls[0][0];
    expect(paymentRequest).toEqual({ billId: 50, amount: 200, paymentMethod: 'UPI' });
    expect(await screen.findByText('Payment recorded successfully. Bill balances were refreshed from the backend.')).toBeInTheDocument();
    expect(await screen.findByText('₹300.00')).toBeInTheDocument();
  });

  test('shows backend payment errors', async () => {
    const error = new Error('Payment amount cannot exceed total due amount');
    error.fieldErrors = {};
    recordPayment.mockRejectedValue(error);
    const user = userEvent.setup();
    renderApp('/bills/50/payment');
    await screen.findByText('₹500.00');
    await user.type(screen.getByLabelText('Amount'), '200');
    await user.selectOptions(screen.getByLabelText('Payment method'), 'CASH');
    await user.click(screen.getByRole('button', { name: 'Record payment' }));
    expect(await screen.findByText('Payment amount cannot exceed total due amount')).toBeInTheDocument();
  });
});