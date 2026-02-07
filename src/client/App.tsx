import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ChakraProvider } from '@chakra-ui/react';
import { useAuthStore } from './store/authStore';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

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
            <Route path="/login" element={<Login />} />
            
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
            
            <Route
              path="/subscriptions"
              element={
                <ProtectedRoute>
                  <Layout>
                    <div className="text-center py-12">
                      <h2 className="text-2xl font-bold">Subscriptions</h2>
                      <p className="text-muted-foreground mt-2">Coming soon</p>
                    </div>
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/invoices"
              element={
                <ProtectedRoute>
                  <Layout>
                    <div className="text-center py-12">
                      <h2 className="text-2xl font-bold">Invoices</h2>
                      <p className="text-muted-foreground mt-2">Coming soon</p>
                    </div>
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
