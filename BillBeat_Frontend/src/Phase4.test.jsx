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
import { createCustomer, getCustomer, getCustomers, patchCustomerStatus, updateCustomer } from './services/customerService';

vi.mock('./services/authService', () => ({ getCurrentUser: vi.fn(), login: vi.fn(), registerVendor: vi.fn() }));
vi.mock('./services/beatService', () => ({ getBeat: vi.fn(), getBeats: vi.fn() }));
vi.mock('./services/paperBoyService', () => ({ getPaperBoys: vi.fn() }));
vi.mock('./services/customerService', () => ({ getCustomer: vi.fn(), getCustomers: vi.fn(), createCustomer: vi.fn(), updateCustomer: vi.fn(), patchCustomerStatus: vi.fn() }));

const authResponse = { token: 'jwt-token', tokenType: 'Bearer', userId: 1, username: 'vendor_username', role: 'VENDOR', vendorId: 1, businessName: 'Example Newspapers', paperBoyId: null };
const beats = [{ id: 1, name: 'Civil Lines', active: true }, { id: 2, name: 'Shankar Nagar', active: true }];
const customer = { id: 10, name: 'Rahul Sharma', mobileNumber: '9876543210', alternateMobile: null, address: 'House 23, Civil Lines', beatId: 1, beatName: 'Civil Lines', paperBoyId: null, paperBoyName: null, notes: 'Leave at gate', whatsAppEnabled: true, active: true, activeSubscriptionsCount: 0, currentBillAmount: 310, dueAmount: 100, billStatus: 'DUE', createdAt: '2026-09-07T10:30:00' };
const page = (content = [customer]) => ({ content, pageNumber: 0, pageSize: 20, totalElements: content.length, totalPages: content.length ? 1 : 0, last: true });

function renderApp(route) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={queryClient}><MemoryRouter initialEntries={[route]}><AuthProvider><AppRoutes /></AuthProvider></MemoryRouter></QueryClientProvider>);
}

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('billbeat.auth.token', 'stored-token');
  vi.clearAllMocks();
  vi.spyOn(window, 'confirm').mockReturnValue(true);
  getCurrentUser.mockResolvedValue(authResponse);
  getBeats.mockResolvedValue(beats);
  getPaperBoys.mockResolvedValue([]);
  getCustomers.mockResolvedValue(page());
});

afterEach(() => {
  cleanup();
});

describe('Phase 4 customer list and routing', () => {
  test('renders customers and uses backend filters', async () => {
    renderApp('/customers');
    expect(await screen.findByText('Rahul Sharma')).toBeInTheDocument();
    expect(getCustomers.mock.calls[0][0]).toMatchObject({ beatId: '', billStatus: 'ALL', search: '', page: 0, size: 20 });
    const user = userEvent.setup();
    await user.type(screen.getByPlaceholderText('Search customers'), 'Rahul');
    await waitFor(() => expect(getCustomers).toHaveBeenCalledWith(expect.objectContaining({ search: 'Rahul', page: 0 })));
    await user.selectOptions(screen.getByDisplayValue('All bill status'), 'DUE');
    await waitFor(() => expect(getCustomers).toHaveBeenCalledWith(expect.objectContaining({ billStatus: 'DUE' })));
    await user.selectOptions(screen.getByDisplayValue('All beats'), '1');
    await waitFor(() => expect(getCustomers).toHaveBeenCalledWith(expect.objectContaining({ beatId: '1' })));
  });

  test('handles loading, error, empty, pagination, and detail navigation', async () => {
    getCustomers.mockReturnValueOnce(new Promise(() => {}));
    renderApp('/customers');
    expect(await screen.findByText('Loading customers')).toBeInTheDocument();

    getCustomers.mockReset();
    getCustomers.mockRejectedValueOnce(new Error('Customer service unavailable'));
    renderApp('/customers');
    expect(await screen.findByText('Customer service unavailable')).toBeInTheDocument();

    cleanup();
    getCustomers.mockReset();
    getCustomers.mockResolvedValueOnce(page([]));
    renderApp('/customers');
    expect(await screen.findByText('No customers yet')).toBeInTheDocument();

    getCustomers.mockReset();
    getCustomers.mockResolvedValue({ ...page(), totalPages: 2, totalElements: 21, last: false });
    const user = userEvent.setup();
    cleanup();
    renderApp('/customers');
    await user.click(await screen.findByRole('button', { name: 'Next' }));
    await waitFor(() => expect(getCustomers).toHaveBeenCalledWith(expect.objectContaining({ page: 1 })));

    getCustomers.mockReset();
    getCustomers.mockResolvedValueOnce(page());
    getCustomer.mockResolvedValueOnce(customer);
    cleanup();
    renderApp('/customers');
    await user.click(await screen.findByRole('link', { name: /Rahul Sharma/ }));
    expect(await screen.findByRole('heading', { name: 'Rahul Sharma' })).toBeInTheDocument();
  });

  test('supports beat-scoped customer navigation and prefilters by beat', async () => {
    renderApp('/beats/1/customers');
    expect(await screen.findByText('Civil Lines customers')).toBeInTheDocument();
    expect(getCustomers).toHaveBeenCalledWith(expect.objectContaining({ beatId: '1' }));
    expect(screen.getByRole('link', { name: 'Add customer' })).toHaveAttribute('href', '/beats/1/customers/new');
  });
});

describe('Phase 4 customer detail and mutations', () => {
  test('renders backend fields and edit navigation', async () => {
    getCustomer.mockResolvedValue(customer);
    renderApp('/customers/10');
    expect(await screen.findByRole('heading', { name: 'Rahul Sharma' })).toBeInTheDocument();
    expect(screen.getByText('House 23, Civil Lines')).toBeInTheDocument();
    expect(screen.getByText('DUE')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Edit customer/ })).toHaveAttribute('href', '/customers/10/edit');
  });

  test('handles detail loading, API failure, and 404', async () => {
    getCustomer.mockReturnValueOnce(new Promise(() => {}));
    renderApp('/customers/10');
    expect(await screen.findByText('Loading customer profile')).toBeInTheDocument();

    getCustomer.mockReset();
    getCustomer.mockRejectedValueOnce(new Error('Customer unavailable'));
    renderApp('/customers/10');
    expect(await screen.findByText('Customer unavailable')).toBeInTheDocument();

    getCustomer.mockReset();
    const notFound = new Error('Customer not found with ID: 404');
    notFound.status = 404;
    getCustomer.mockRejectedValueOnce(notFound);
    renderApp('/customers/404');
    expect(await screen.findByText('Customer not found.')).toBeInTheDocument();
  });

  test('sends only active query parameter and refreshes the customer', async () => {
    getCustomer.mockResolvedValue(customer);
    patchCustomerStatus.mockResolvedValue({ ...customer, active: false });
    const user = userEvent.setup();
    renderApp('/customers/10');
    await user.click(await screen.findByRole('button', { name: 'Deactivate customer' }));
    await waitFor(() => expect(patchCustomerStatus).toHaveBeenCalledWith(expect.anything(), { active: false }));
    expect(patchCustomerStatus.mock.calls[0][0]).toBe(10);
  });

  test('sends only WhatsApp query parameter', async () => {
    getCustomer.mockResolvedValue(customer);
    patchCustomerStatus.mockResolvedValue({ ...customer, whatsAppEnabled: false });
    const user = userEvent.setup();
    renderApp('/customers/10');
    await user.click(await screen.findByRole('button', { name: 'Disable WhatsApp' }));
    await waitFor(() => expect(patchCustomerStatus).toHaveBeenCalledWith(10, { whatsAppEnabled: false }));
  });
});

describe('Phase 4 customer forms', () => {
  test('validates required customer fields', async () => {
    const user = userEvent.setup();
    renderApp('/beats/1/customers/new');
    await user.click(await screen.findByRole('button', { name: 'Create customer' }));
    expect(await screen.findByText('Customer name is required')).toBeInTheDocument();
  });

  test('creates the exact customer payload', async () => {
    createCustomer.mockResolvedValue(customer);
    const user = userEvent.setup();
    renderApp('/beats/1/customers/new');
    expect(await screen.findByLabelText('Name')).toBeInTheDocument();
    await user.type(screen.getByLabelText('Name'), 'Rahul Sharma');
    await user.type(screen.getByLabelText('Mobile number'), '9876543210');
    await user.type(screen.getByLabelText('Address'), 'House 23, Civil Lines');
    await user.click(screen.getByRole('button', { name: 'Create customer' }));
    await waitFor(() => expect(createCustomer).toHaveBeenCalled());
    const createPayload = createCustomer.mock.calls[0][0];
    expect(Object.keys(createPayload).sort()).toEqual(['address', 'alternateMobile', 'beatId', 'mobileNumber', 'name', 'notes', 'paperBoyId', 'whatsAppEnabled'].sort());
    expect(createPayload).toEqual({ name: 'Rahul Sharma', mobileNumber: '9876543210', alternateMobile: null, address: 'House 23, Civil Lines', beatId: 1, paperBoyId: null, notes: null, whatsAppEnabled: true });
  });

  test('loads edit values and sends the exact update payload', async () => {
    getCustomer.mockResolvedValue(customer);
    updateCustomer.mockResolvedValue({ ...customer, name: 'Updated Rahul' });
    const user = userEvent.setup();
    renderApp('/customers/10/edit');
    expect(await screen.findByRole('button', { name: 'Save changes' })).toBeInTheDocument();
    expect(await screen.findByDisplayValue('Rahul Sharma')).toBeInTheDocument();
    await user.clear(screen.getByLabelText('Name'));
    await user.type(screen.getByLabelText('Name'), 'Updated Rahul');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));
    await waitFor(() => expect(updateCustomer).toHaveBeenCalledWith('10', expect.objectContaining({ name: 'Updated Rahul', beatId: 1, mobileNumber: customer.mobileNumber, address: customer.address })));
  });

  test('shows backend validation errors on create', async () => {
    const error = new Error('Validation failed');
    error.fieldErrors = { mobileNumber: 'Mobile number is required' };
    createCustomer.mockRejectedValue(error);
    const user = userEvent.setup();
    renderApp('/customers/new');
    expect(await screen.findByRole('button', { name: 'Create customer' })).toBeInTheDocument();
    await user.type(screen.getByLabelText('Name'), 'Rahul Sharma');
    await user.type(screen.getByLabelText('Mobile number'), '9876543210');
    await user.type(screen.getByLabelText('Address'), 'Address');
    await user.selectOptions(screen.getByLabelText('Beat'), '1');
    await user.click(screen.getByRole('button', { name: 'Create customer' }));
    expect(await screen.findByText('Mobile number is required')).toBeInTheDocument();
  });
});
