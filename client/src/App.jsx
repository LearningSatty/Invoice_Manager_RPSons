import { createContext, useContext, useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { supabase } from './lib/supabase';
import Navbar from './components/Navbar';
import HomePage from './components/HomePage';
import BuyersPage from './components/BuyersPage';
import SellersPage from './components/SellersPage';
import CreateInvoicePage from './components/CreateInvoicePage';
import InvoicesPage from './components/InvoicesPage';
import Toast from './components/Toast';
import { ToastProvider, useToast } from './context/ToastContext';
import './App.css';

const AppContext = createContext(null);

function AppProvider({ children }) {
  const [buyers, setBuyers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('buyers').select('*').order('created_at', { ascending: false });
      setBuyers(data || []);
      setLoading(false);
    })();
  }, []);

  return (
    <AppContext.Provider value={{ buyers, setBuyers, loading }}>
      {children}
    </AppContext.Provider>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppProvider>
        <div className="app">
          <Navbar />
          <main>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/buyers" element={<BuyersPage />} />
              <Route path="/sellers" element={<SellersPage />} />
              <Route path="/create-invoice" element={<CreateInvoicePage />} />
              <Route path="/invoices/:id/edit" element={<CreateInvoicePage />} />
              <Route path="/invoices" element={<InvoicesPage />} />
            </Routes>
          </main>
          <ToastContainer />
        </div>
      </AppProvider>
    </ToastProvider>
  );
}

function ToastContainer() {
  const { toasts, removeToast } = useToast();
  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <Toast key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  );
}
