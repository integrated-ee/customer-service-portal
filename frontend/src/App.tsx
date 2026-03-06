import { MsalProvider } from '@azure/msal-react';
import { PublicClientApplication } from '@azure/msal-browser';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { msalConfig } from './services/authConfig';
import { setMsalInstance } from './services/apiClient';
import { UserProvider } from './contexts/UserContext';
import ErrorBoundary from './components/Layout/ErrorBoundary';
import AppLayout from './components/Layout/AppLayout';
import AuthGuard from './components/Layout/AuthGuard';
import AdminGuard from './components/Layout/AdminGuard';
import TicketList from './pages/TicketList';
import TicketDetail from './pages/TicketDetail';
import NewTicket from './pages/NewTicket';
import AdminDashboard from './pages/AdminDashboard';
import AdminTicketDetail from './pages/AdminTicketDetail';

const msalInstance = new PublicClientApplication(msalConfig);
setMsalInstance(msalInstance);

export default function App() {
  return (
    <ErrorBoundary>
      <MsalProvider instance={msalInstance}>
        <BrowserRouter basename="/customer-service-portal">
          <AuthGuard>
            <UserProvider>
              <AppLayout>
                <Routes>
                  <Route path="/" element={<Navigate to="/tickets" replace />} />
                  <Route path="/tickets" element={<TicketList />} />
                  <Route path="/tickets/new" element={<NewTicket />} />
                  <Route path="/tickets/:id" element={<TicketDetail />} />
                  <Route path="/admin" element={<AdminGuard><AdminDashboard /></AdminGuard>} />
                  <Route path="/admin/tickets/:id" element={<AdminGuard><AdminTicketDetail /></AdminGuard>} />
                </Routes>
              </AppLayout>
            </UserProvider>
          </AuthGuard>
        </BrowserRouter>
      </MsalProvider>
    </ErrorBoundary>
  );
}
