import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AppShell from '../components/layout/AppShell';
import BeatDetailPage from '../pages/beats/BeatDetailPage';
import BeatListPage from '../pages/beats/BeatListPage';
import DashboardPage from '../pages/dashboard/DashboardPage';
import CustomerDetailPage from '../pages/customers/CustomerDetailPage';
import CustomerFormPage from '../pages/customers/CustomerFormPage';
import CustomerListPage from '../pages/customers/CustomerListPage';
import SubscriptionDetailPage from '../pages/subscriptions/SubscriptionDetailPage';
import SubscriptionFormPage from '../pages/subscriptions/SubscriptionFormPage';
import SubscriptionListPage from '../pages/subscriptions/SubscriptionListPage';
import BillDetailPage from '../pages/bills/BillDetailPage';
import BillGenerationPage from '../pages/bills/BillGenerationPage';
import BillListPage from '../pages/bills/BillListPage';
import PaymentFormPage from '../pages/payments/PaymentFormPage';
import DeliveryTodayPage from '../pages/deliveries/DeliveryTodayPage';
import LoginPage from '../pages/auth/LoginPage';
import NotFoundPage from '../pages/NotFoundPage';
import RegisterPage from '../pages/auth/RegisterPage';
import PaperBoyListPage from '../pages/paper-boys/PaperBoyListPage';
import PaperBoyDetailPage from '../pages/paper-boys/PaperBoyDetailPage';
import PaperBoyFormPage from '../pages/paper-boys/PaperBoyFormPage';
import NewspaperListPage from '../pages/newspapers/NewspaperListPage';
import NewspaperDetailPage from '../pages/newspapers/NewspaperDetailPage';
import NewspaperFormPage from '../pages/newspapers/NewspaperFormPage';

function ProtectedRoute() {
  const { isAuthenticated, isRestoring } = useAuth();
  if (isRestoring) return null;
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}

function PublicRoute() {
  const { isAuthenticated, isRestoring } = useAuth();
  if (isRestoring) return null;
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Outlet />;
}

export default function AppRoutes() {
  return <Routes>
    <Route element={<PublicRoute />}><Route path="/" element={<Navigate to="/login" replace />} /><Route path="/login" element={<LoginPage />} /><Route path="/register" element={<RegisterPage />} /></Route>
    <Route element={<ProtectedRoute />}><Route element={<AppShell />}>
      <Route path="/dashboard" element={<DashboardPage />} /><Route path="/beats" element={<BeatListPage />} /><Route path="/beats/:beatId" element={<BeatDetailPage />} />
      <Route path="/paper-boys" element={<PaperBoyListPage />} /><Route path="/paper-boys/new" element={<PaperBoyFormPage mode="create" />} /><Route path="/paper-boys/:paperBoyId" element={<PaperBoyDetailPage />} /><Route path="/paper-boys/:paperBoyId/edit" element={<PaperBoyFormPage mode="edit" />} />
      <Route path="/newspapers" element={<NewspaperListPage />} /><Route path="/newspapers/new" element={<NewspaperFormPage mode="create" />} /><Route path="/newspapers/:newspaperId" element={<NewspaperDetailPage />} /><Route path="/newspapers/:newspaperId/edit" element={<NewspaperFormPage mode="edit" />} />
      <Route path="/customers" element={<CustomerListPage />} /><Route path="/customers/new" element={<CustomerFormPage mode="create" />} /><Route path="/customers/:customerId" element={<CustomerDetailPage />} /><Route path="/customers/:customerId/edit" element={<CustomerFormPage mode="edit" />} /><Route path="/beats/:beatId/customers" element={<CustomerListPage />} /><Route path="/beats/:beatId/customers/new" element={<CustomerFormPage mode="create" />} />
      <Route path="/subscriptions" element={<SubscriptionListPage />} /><Route path="/subscriptions/new" element={<SubscriptionFormPage mode="create" />} /><Route path="/subscriptions/:subscriptionId" element={<SubscriptionDetailPage />} /><Route path="/subscriptions/:subscriptionId/edit" element={<SubscriptionFormPage mode="edit" />} /><Route path="/customers/:customerId/subscriptions" element={<SubscriptionListPage />} /><Route path="/customers/:customerId/subscriptions/new" element={<SubscriptionFormPage mode="create" />} />
      <Route path="/bills" element={<BillListPage />} /><Route path="/bills/generate" element={<BillGenerationPage />} /><Route path="/bills/:billId" element={<BillDetailPage />} /><Route path="/bills/:billId/payment" element={<PaymentFormPage />} /><Route path="/customers/:customerId/bills" element={<BillListPage />} /><Route path="/customers/:customerId/bills/generate" element={<BillGenerationPage />} /><Route path="/deliveries/today" element={<DeliveryTodayPage />} />
    </Route></Route><Route path="*" element={<NotFoundPage />} />
  </Routes>;
}
