import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ChakraProvider } from '@chakra-ui/react';
import { useAuthStore } from './store/authStore';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import PortalLayout from './components/PortalLayout';
import RoleBasedRedirect from './components/RoleBasedRedirect';
import AdminOnlyRoute from './components/AdminOnlyRoute';

// Pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import ProductsPage from './pages/products/ProductsPage';
import ProductDetailPage from './pages/products/ProductDetailPage';
import SubscriptionsPage from './pages/subscriptions/SubscriptionsPage';
import SubscriptionDetailPage from './pages/subscriptions/SubscriptionDetailPage';
import CreateSubscriptionPage from './pages/subscriptions/CreateSubscriptionPage';
import SubscriptionPreviewPage from './pages/subscriptions/SubscriptionPreviewPage';
import InvoicesPage from './pages/invoices/InvoicesPage';
import InvoiceDetailPage from './pages/invoices/InvoiceDetailPage';
import ReportingPage from './pages/ReportingPage';
import UsersContactsPage from './pages/UsersContactsPage';
import ConfigurationPage from './pages/ConfigurationPage';
import MyProfilePage from './pages/MyProfilePage';

// Portal Pages
import HomePage from './pages/portal/HomePage';
import ShopPage from './pages/portal/ShopPage';
import PortalProductDetailPage from './pages/portal/ProductDetailPage';
import CartPage from './pages/portal/CartPage';
import AddressPage from './pages/portal/AddressPage';
import PaymentPage from './pages/portal/PaymentPage';
import OrderConfirmationPage from './pages/portal/OrderConfirmationPage';
import OrderDetailPage from './pages/portal/OrderDetailPage';
import OrdersPage from './pages/portal/OrdersPage';
import UserDetailsPage from './pages/portal/UserDetailsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  const { initializeAuth } = useAuthStore();

  useEffect(() => {
    // initializeAuth is now async – verifies JWT with server on startup
    initializeAuth();
  }, [initializeAuth]);

  return (
    <QueryClientProvider client={queryClient}>
      <ChakraProvider>
        <BrowserRouter>
          <Routes>
            {/* Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            
            {/* Root route - redirects based on role */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <RoleBasedRedirect />
                </ProtectedRoute>
              }
            />
            
            {/* Admin Dashboard */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <AdminOnlyRoute>
                    <Layout>
                      <Dashboard />
                    </Layout>
                  </AdminOnlyRoute>
                </ProtectedRoute>
              }
            />
            
            {/* Products */}
            <Route
              path="/products"
              element={
                <ProtectedRoute>
                  <AdminOnlyRoute>
                    <Layout>
                      <ProductsPage />
                    </Layout>
                  </AdminOnlyRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/products/:id"
              element={
                <ProtectedRoute>
                  <AdminOnlyRoute>
                    <Layout>
                      <ProductDetailPage />
                    </Layout>
                  </AdminOnlyRoute>
                </ProtectedRoute>
              }
            />
            
            {/* Subscriptions */}
            <Route
              path="/subscriptions"
              element={
                <ProtectedRoute>
                  <Layout>
                    <SubscriptionsPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/subscriptions/new"
              element={
                <ProtectedRoute>
                  <Layout>
                    <CreateSubscriptionPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/subscriptions/:id"
              element={
                <ProtectedRoute>
                  <Layout>
                    <SubscriptionDetailPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/subscriptions/:id/preview"
              element={
                <ProtectedRoute>
                  <SubscriptionPreviewPage />
                </ProtectedRoute>
              }
            />
            
            {/* Invoices */}
            <Route
              path="/invoices"
              element={
                <ProtectedRoute>
                  <Layout>
                    <InvoicesPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/invoices/:id"
              element={
                <ProtectedRoute>
                  <Layout>
                    <InvoiceDetailPage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Reporting */}
            <Route
              path="/reporting"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ReportingPage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Users / Contacts */}
            <Route
              path="/users-contacts"
              element={
                <ProtectedRoute>
                  <Layout>
                    <UsersContactsPage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Configuration */}
            <Route
              path="/configuration"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ConfigurationPage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* My Profile */}
            <Route
              path="/my-profile"
              element={
                <ProtectedRoute>
                  <Layout>
                    <MyProfilePage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Portal Routes */}
            <Route
              path="/portal"
              element={
                <ProtectedRoute>
                  <PortalLayout>
                    <HomePage />
                  </PortalLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/portal/shop"
              element={
                <ProtectedRoute>
                  <PortalLayout>
                    <ShopPage />
                  </PortalLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/portal/products/:id"
              element={
                <ProtectedRoute>
                  <PortalLayout>
                    <PortalProductDetailPage />
                  </PortalLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/portal/cart"
              element={
                <ProtectedRoute>
                  <PortalLayout>
                    <CartPage />
                  </PortalLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/portal/my-account"
              element={
                <ProtectedRoute>
                  <PortalLayout>
                    <MyProfilePage />
                  </PortalLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/portal/subscriptions"
              element={
                <ProtectedRoute>
                  <PortalLayout>
                    <SubscriptionsPage />
                  </PortalLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/portal/checkout/address"
              element={
                <ProtectedRoute>
                  <PortalLayout>
                    <AddressPage />
                  </PortalLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/portal/checkout/payment"
              element={
                <ProtectedRoute>
                  <PortalLayout>
                    <PaymentPage />
                  </PortalLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/portal/checkout/confirmation"
              element={
                <ProtectedRoute>
                  <PortalLayout>
                    <OrderConfirmationPage />
                  </PortalLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/portal/orders"
              element={
                <ProtectedRoute>
                  <PortalLayout>
                    <OrdersPage />
                  </PortalLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/portal/orders/:id"
              element={
                <ProtectedRoute>
                  <PortalLayout>
                    <OrderDetailPage />
                  </PortalLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/portal/user-details"
              element={
                <ProtectedRoute>
                  <PortalLayout>
                    <UserDetailsPage />
                  </PortalLayout>
                </ProtectedRoute>
              }
            />
            
            {/* Catch-all route - redirects based on role */}
            <Route
              path="*"
              element={
                <ProtectedRoute>
                  <RoleBasedRedirect />
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </ChakraProvider>
    </QueryClientProvider>
  );
}

export default App;
