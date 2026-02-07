import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ChakraProvider } from '@chakra-ui/react';
import { useAuthStore } from './store/authStore';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

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
import InvoicesPage from './pages/invoices/InvoicesPage';
import InvoiceDetailPage from './pages/invoices/InvoiceDetailPage';

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
            
            {/* Dashboard */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            {/* Products */}
            <Route
              path="/products"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ProductsPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/products/:id"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ProductDetailPage />
                  </Layout>
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
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ChakraProvider>
    </QueryClientProvider>
  );
}

export default App;
