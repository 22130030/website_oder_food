import React from 'react';
import AdminSidebar from './AdminSidebar';
import './AdminLayout.css';


const AdminLayout = ({ children, title }) => (
  <div className="admin-layout">
    <AdminSidebar />
    <main className="admin-main">
      {title && (
        <div className="admin-page-header">
          <h1>{title}</h1>
        </div>
      )}
      <div className="admin-content">
        {children}
      </div>
    </main>
  </div>
);

export default AdminLayout;
