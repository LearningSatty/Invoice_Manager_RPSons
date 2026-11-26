import { Link } from 'react-router-dom';
import { Plus, Users } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="page">
      <div className="card">
        <h1>Invoice Manager</h1>
        <p className="muted">Generate Tax Invoices with Trade Information and Order Details.</p>
        <div className="actions">
          <Link to="/create-invoice" className="btn btn-primary">
            <Plus size={20} /> Create New Invoice
          </Link>
          <Link to="/buyers" className="btn">
            <Users size={20} /> Manage Buyers
          </Link>
        </div>
      </div>
    </div>
  );
}
