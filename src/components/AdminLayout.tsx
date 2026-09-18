import React from 'react';

interface AdminLayoutProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  header?: React.ReactNode;
  className?: string;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  sidebar,
  header,
  className = ''
}) => {
  return (
    <div
      className={`fixed inset-0 z-50 flex h-screen w-screen overflow-hidden bg-theme-bg text-theme-title ${className}`}
      data-lenis-prevent
    >
      {/* SIDEBAR */}
      {sidebar}

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative" data-lenis-prevent>
        {header}

        {/* DIV PRINCIPAL DE CONTEÚDO COM h-screen overflow-y-auto */}
        <div className="flex-1 h-screen overflow-y-auto p-8 bg-theme-card custom-scrollbar" data-lenis-prevent>
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
