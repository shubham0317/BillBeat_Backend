import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { AuthProvider } from './context/AuthContext';
import AppRoutes from './routes/AppRoutes';

import { getCurrentUser, login, registerVendor } from './services/authService';
import { getBeats } from './services/beatService';

vi.mock('./services/authService', () => ({
  getCurrentUser: vi.fn(),
  login: vi.fn(),
  registerVendor: vi.fn(),
}));

vi.mock('./services/beatService', () => ({
  getBeats: vi.fn(),
  getBeat: vi.fn(),
}));

const authResponse = { token: 'jwt-token', tokenType: 'Bearer', userId: 1, username: 'vendor_username', role: 'VENDOR', vendorId: 1, businessName: 'Example Newspapers', paperBoyId: null };

function renderApp(route = '/login') {
  const queryClient = new QueryClient();
  return render(<QueryClientProvider client={queryClient}><MemoryRouter initialEntries={[route]}><AuthProvider><AppRoutes /></AuthProvider></MemoryRouter></QueryClientProvider>);
}

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  getCurrentUser.mockResolvedValue(authResponse);
  getBeats.mockResolvedValue([]);
});

describe('authentication', () => {
  test('renders login page', () => {
    renderApp();
    expect(screen.getByRole('heading', { name: 'Sign in to your route.' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
  });

  test('logs in with the backend request fields and opens the protected app', async () => {
    login.mockResolvedValue(authResponse);
    const user = userEvent.setup();
    renderApp();
    await user.type(screen.getByLabelText('Username'), 'vendor_username');
    await user.type(screen.getByLabelText('Password'), 'password');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    await waitFor(() => expect(screen.getByText('Good morning.')).toBeInTheDocument());
    expect(login).toHaveBeenCalledWith({ username: 'vendor_username', password: 'password' });
    expect(localStorage.getItem('billbeat.auth.token')).toBe('jwt-token');
  });

  test('shows invalid credential errors from the backend', async () => {
    const error = new Error('Invalid username or password');
    error.fieldErrors = {};
    login.mockRejectedValue(error);
    const user = userEvent.setup();
    renderApp();
    await user.type(screen.getByLabelText('Username'), 'wrong');
    await user.type(screen.getByLabelText('Password'), 'wrong');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByText('Invalid username or password')).toBeInTheDocument();
  });

  test('renders registration and submits only supported fields', async () => {
    registerVendor.mockResolvedValue(authResponse);
    const user = userEvent.setup();
    renderApp('/register');
    expect(screen.getByRole('heading', { name: 'Bring your route together.' })).toBeInTheDocument();
    await user.type(screen.getByLabelText('Username'), 'vendor_username');
    await user.type(screen.getByLabelText('Business name'), 'Example Newspapers');
    await user.type(screen.getByLabelText('Owner name'), 'Owner Name');
    await user.type(screen.getByLabelText('Phone'), '9876543210');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Create vendor account' }));
    await waitFor(() => expect(screen.getByText('Good morning.')).toBeInTheDocument());
    expect(registerVendor).toHaveBeenCalledWith({ username: 'vendor_username', password: 'password123', businessName: 'Example Newspapers', ownerName: 'Owner Name', phone: '9876543210' });
  });

  test('redirects unauthenticated users away from protected routes', async () => {
    renderApp('/dashboard');
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Sign in to your route.' })).toBeInTheDocument());
  });

  test('restores a valid session with /auth/me', async () => {
    localStorage.setItem('billbeat.auth.token', 'stored-token');
    getCurrentUser.mockResolvedValue(authResponse);
    renderApp('/dashboard');
    await waitFor(() => expect(screen.getByText('Good morning.')).toBeInTheDocument());
    expect(getCurrentUser).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem('billbeat.auth.user')).toContain('Example Newspapers');
  });

  test('clears an invalid session after a 401 restoration response', async () => {
    localStorage.setItem('billbeat.auth.token', 'expired-token');
    localStorage.setItem('billbeat.auth.user', JSON.stringify(authResponse));
    const error = new Error('Unauthorized');
    error.status = 401;
    getCurrentUser.mockRejectedValue(error);
    renderApp('/dashboard');
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Sign in to your route.' })).toBeInTheDocument());
    expect(localStorage.getItem('billbeat.auth.token')).toBeNull();
    expect(localStorage.getItem('billbeat.auth.user')).toBeNull();
  });

  test('clears the session and returns to login on logout', async () => {
    localStorage.setItem('billbeat.auth.token', 'stored-token');
    getCurrentUser.mockResolvedValue(authResponse);
    const user = userEvent.setup();
    renderApp('/dashboard');
    await waitFor(() => expect(screen.getByText('Good morning.')).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: 'Sign out' }));
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Sign in to your route.' })).toBeInTheDocument());
    expect(localStorage.getItem('billbeat.auth.token')).toBeNull();
  });
});
