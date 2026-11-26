import { Link, useNavigate } from 'react-router-dom';
import { Home, Users, FileText, Save, Building2 } from 'lucide-react';

export default function Navbar() {
  const navigate = useNavigate();
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/" onClick={() => navigate('/')}>
          <Home size={22} /> Invoice Manager
        </Link>
      </div>
      <div className="navbar-links">
        <Link to="/buyers" onClick={() => navigate('/buyers')}>
          <Users size={20} /> Buyers
        </Link>
        <Link to="/sellers" onClick={() => navigate('/sellers')}>
          <Building2 size={20} /> Sellers / Firm
        </Link>
        <Link to="/create-invoice" onClick={() => navigate('/create-invoice')}>
          <FileText size={20} /> Create Invoice
        </Link>
        <Link to="/invoices" onClick={() => navigate('/invoices')}>
          <Save size={20} /> Invoices
        </Link>
      </div>
    </nav>
  );
}
