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
import { getNewspapers } from './services/newspaperService';
import { createSubscription, getSubscription, getSubscriptions, updateSubscription, updateSubscriptionStatus } from './services/subscriptionService';

vi.mock('./services/authService', () => ({ getCurrentUser: vi.fn(), login: vi.fn(), registerVendor: vi.fn() }));
vi.mock('./services/beatService', () => ({ getBeat: vi.fn(), getBeats: vi.fn() }));
vi.mock('./services/customerService', () => ({ getCustomer: vi.fn(), getCustomers: vi.fn(), createCustomer: vi.fn(), updateCustomer: vi.fn(), patchCustomerStatus: vi.fn() }));
vi.mock('./services/newspaperService', () => ({ getNewspapers: vi.fn() }));
vi.mock('./services/subscriptionService', () => ({ getSubscription: vi.fn(), getSubscriptions: vi.fn(), createSubscription: vi.fn(), updateSubscription: vi.fn(), updateSubscriptionStatus: vi.fn() }));

const authResponse = { token: 'jwt-token', tokenType: 'Bearer', userId: 1, username: 'vendor_username', role: 'VENDOR', vendorId: 1, businessName: 'Example Newspapers', paperBoyId: null };
const customer = { id: 10, name: 'Rahul Sharma', mobileNumber: '9876543210', address: 'House 23, Civil Lines', beatId: 1, beatName: 'Civil Lines', paperBoyId: null, paperBoyName: null, notes: null, whatsAppEnabled: true, active: true, activeSubscriptionsCount: 1, currentBillAmount: 0, dueAmount: 0, billStatus: 'PAID', createdAt: '2026-09-07T10:30:00' };
const newspapers = [{ id: 2, name: 'Daily News', code: 'DN', defaultPrice: 6.5, language: 'English', active: true, createdAt: '2026-09-07T10:30:00' }];
const subscription = { id: 20, customerId: 10, customerName: 'Rahul Sharma', newspaperId: 2, newspaperName: 'Daily News', copies: 2, pricePerCopy: 6.5, startDate: '2026-09-01', endDate: null, status: 'ACTIVE', deliverySchedule: { monday: true, tuesday: false, wednesday: true, thursday: true, friday: true, saturday: true, sunday: false }, createdAt: '2026-09-07T10:30:00' };
const page = { content: [customer], pageNumber: 0, pageSize: 100, totalElements: 1, totalPages: 1, last: true };

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
  getCustomers.mockResolvedValue(page);
  getCustomer.mockResolvedValue(customer);
  getNewspapers.mockResolvedValue(newspapers);
  getSubscriptions.mockResolvedValue([subscription]);
});

afterEach(() => cleanup());

describe('subscription list and detail', () => {
  test('renders global and customer-scoped subscriptions', async () => {
    renderApp('/subscriptions');
    expect(await screen.findByText('Daily News')).toBeInTheDocument();
    expect(screen.getByText('Rahul Sharma')).toBeInTheDocument();
    cleanup();
    renderApp('/customers/10/subscriptions');
    expect(await screen.findByText("Rahul Sharma's subscriptions")).toBeInTheDocument();
    expect(getSubscriptions).toHaveBeenCalledWith('10');
  });

  test('handles loading, error, and empty subscription states', async () => {
    getSubscriptions.mockReturnValueOnce(new Promise(() => {}));
    renderApp('/subscriptions');
    expect(await screen.findByText('Loading subscriptions')).toBeInTheDocument();
    cleanup();
    getSubscriptions.mockReset();
    getSubscriptions.mockRejectedValueOnce(new Error('Subscription service unavailable'));
    renderApp('/subscriptions');
    expect(await screen.findByText('Subscription service unavailable')).toBeInTheDocument();
    cleanup();
    getSubscriptions.mockReset();
    getSubscriptions.mockResolvedValueOnce([]);
    renderApp('/subscriptions');
    expect(await screen.findByText('No subscriptions yet')).toBeInTheDocument();
  });

  test('renders detail, edit navigation, status action, and 404', async () => {
    getSubscription.mockResolvedValue(subscription);
    updateSubscriptionStatus.mockResolvedValue({ ...subscription, status: 'PAUSED' });
    const user = userEvent.setup();
    renderApp('/subscriptions/20');
    expect(await screen.findByRole('heading', { name: 'Daily News' })).toBeInTheDocument();
    expect(screen.getByText('wednesday')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Edit subscription/ })).toHaveAttribute('href', '/subscriptions/20/edit');
    await user.selectOptions(screen.getByRole('combobox', { name: 'Subscription status' }), 'PAUSED');
    await waitFor(() => expect(updateSubscriptionStatus).toHaveBeenCalledWith(20, 'PAUSED'));
    cleanup();
    getSubscription.mockReset();
    const notFound = new Error('Subscription not found with ID: 404');
    notFound.status = 404;
    getSubscription.mockRejectedValueOnce(notFound);
    renderApp('/subscriptions/404');
    expect(await screen.findByText('Subscription not found.')).toBeInTheDocument();
  });
});

describe('subscription forms', () => {
  test('validates required subscription fields', async () => {
    const user = userEvent.setup();
    renderApp('/customers/10/subscriptions/new');
    await user.selectOptions(await screen.findByLabelText('Newspaper'), '2');
    await user.click(screen.getByRole('button', { name: 'Create subscription' }));
    expect(await screen.findByText('Start date is required')).toBeInTheDocument();
  });

  test('sends exact create payload with schedule', async () => {
    createSubscription.mockResolvedValue(subscription);
    const user = userEvent.setup();
    renderApp('/customers/10/subscriptions/new');
    expect(await screen.findByDisplayValue('Rahul Sharma')).toBeInTheDocument();
    await user.selectOptions(await screen.findByLabelText('Newspaper'), '2');
    await user.clear(screen.getByLabelText('Copies'));
    await user.type(screen.getByLabelText('Copies'), '2');
    fireEvent.change(screen.getByLabelText('Start date'), { target: { value: '2026-09-01' } });
    await user.click(screen.getByText('Tue'));
    await user.click(screen.getByRole('button', { name: 'Create subscription' }));
    await waitFor(() => expect(createSubscription).toHaveBeenCalled());
    expect(createSubscription.mock.calls[0][0]).toEqual({ customerId: 10, newspaperId: 2, copies: 2, pricePerCopy: null, startDate: '2026-09-01', endDate: null, deliverySchedule: { monday: true, tuesday: false, wednesday: true, thursday: true, friday: true, saturday: true, sunday: true } });
  });

  test('loads edit values and sends the backend update payload', async () => {
    getSubscription.mockResolvedValue(subscription);
    updateSubscription.mockResolvedValue(subscription);
    const user = userEvent.setup();
    renderApp('/subscriptions/20/edit');
    expect(await screen.findByDisplayValue('Rahul Sharma')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Daily News')).toBeInTheDocument();
    await user.clear(screen.getByLabelText('Copies'));
    await user.type(screen.getByLabelText('Copies'), '3');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));
    await waitFor(() => expect(updateSubscription).toHaveBeenCalled());
    const [updateId, updateRequest] = updateSubscription.mock.calls[0];
    expect(updateId).toBe('20');
    expect(updateRequest).toEqual(expect.objectContaining({ customerId: 10, newspaperId: 2, copies: 3, deliverySchedule: subscription.deliverySchedule }));
  });

  test('shows backend validation errors', async () => {
    const error = new Error('Validation failed');
    error.fieldErrors = { copies: 'Copies must be at least 1' };
    createSubscription.mockRejectedValue(error);
    const user = userEvent.setup();
    renderApp('/subscriptions/new');
    expect(await screen.findByRole('button', { name: 'Create subscription' })).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText('Customer'), '10');
    await user.selectOptions(screen.getByLabelText('Newspaper'), '2');
    fireEvent.change(screen.getByLabelText('Start date'), { target: { value: '2026-09-01' } });
    await user.click(screen.getByRole('button', { name: 'Create subscription' }));
    expect(await screen.findByText('Copies must be at least 1')).toBeInTheDocument();
  });
});

test('customer detail provides subscription navigation without fetching subscriptions', async () => {
  renderApp('/customers/10');
  expect(await screen.findByRole('heading', { name: 'Subscriptions' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'View subscriptions' })).toHaveAttribute('href', '/customers/10/subscriptions');
  expect(screen.getByRole('link', { name: 'Add subscription' })).toHaveAttribute('href', '/customers/10/subscriptions/new');
  expect(getSubscriptions).not.toHaveBeenCalled();
});