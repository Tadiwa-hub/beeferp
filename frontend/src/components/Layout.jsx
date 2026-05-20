import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import useAuthStore from '../auth-store';

const Layout = ({ children }) => {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Grouped Navigation Items matching workflow exactly
  const navigationGroups = [
    {
      title: 'Operations',
      items: [
        { name: 'Dashboard', path: '/', icon: '🏠', shortName: 'Home' },
        { name: 'Herd Registry', path: '/animals', icon: '🐄', shortName: 'Herd' },
        { name: 'Weight & ADG', path: '/weights', icon: '⚖️', shortName: 'Weights' },
        { name: 'Feed Management', path: '/feed', icon: '🌾', shortName: 'Feed' },
        { name: 'Health & Vaccinations', path: '/health', icon: '💊', shortName: 'Health' },
      ]
    },
    {
      title: 'Analytics',
      items: [
        { name: 'Performance', path: '/performance', icon: '📊', shortName: 'Stats' },
        { name: 'Financial Analysis', path: '/financials', icon: '💰', shortName: 'Costs' },
        { name: 'Forecasting', path: '/forecasting', icon: '📈', shortName: 'Forecast' },
      ]
    },
    {
      title: 'Reports',
      items: [
        { name: 'Generate Reports', path: '/reports', icon: '📄', shortName: 'Reports' },
      ]
    },
    {
      title: 'Settings',
      items: [
        { name: 'System Settings', path: '/settings', icon: '⚙️', shortName: 'Settings' },
      ]
    }
  ];

  const allNavItems = navigationGroups.flatMap(g => g.items);

  const isActive = (path) => location.pathname === path;

  // Page title mapping
  const getPageMeta = () => {
    switch (location.pathname) {
      case '/':
        return { title: 'Dashboard Overview', subtitle: 'Real-time beef management intelligence' };
      case '/animals':
        return { title: 'Herd Registry', subtitle: 'All cattle tracked and managed' };
      case '/weights':
        return { title: 'Weight & Daily Gain', subtitle: 'Track weight progression and performance' };
      case '/feed':
        return { title: 'Feed Management', subtitle: 'Track feeding costs and efficiency' };
      case '/health':
        return { title: 'Health & Vaccinations', subtitle: 'Manage herd health and wellness' };
      case '/performance':
        return { title: 'Performance Analytics', subtitle: 'Data-driven insights for optimization' };
      case '/financials':
        return { title: 'Financial Analysis', subtitle: 'Cost tracking and profitability' };
      case '/forecasting':
        return { title: 'Analytics Forecasting', subtitle: 'Future projections of weight gains and profitability' };
      case '/reports':
        return { title: 'Reports & Exports', subtitle: 'Generate and download reports' };
      case '/settings':
        return { title: 'System Settings', subtitle: 'Configure parameters and user credentials' };
      default:
        return { title: 'BeefERP', subtitle: 'Enterprise ERP System' };
    }
  };

  const pageMeta = getPageMeta();

  // Formatted date string requested: e.g. "Wed, May 20, 2026"
  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="min-h-screen bg-background text-primary flex flex-col md:flex-row">
      
      {/* ========================================= */}
      {/* DESKTOP SIDEBAR                           */}
      {/* ========================================= */}
      <aside className={`hidden md:flex flex-col bg-white text-[#0F172A] flex-shrink-0 sticky top-0 h-screen overflow-y-auto border-r border-[#E2E8F0] transition-all duration-300 ${isSidebarCollapsed ? 'w-[72px]' : 'w-[260px]'}`}>
        
        {/* Brand Header */}
        <div className="px-4 py-5 border-b border-[#E2E8F0] flex items-center h-[72px]">
          <div className={`flex items-center gap-3 transition-all duration-300 ${isSidebarCollapsed ? 'justify-center w-full' : 'px-2 w-full'}`}>
            <span className="text-2xl flex-shrink-0 cursor-pointer" title="BeefERP">🐂</span>
            <div className={`flex flex-col overflow-hidden transition-all duration-300 ${isSidebarCollapsed ? 'w-0 opacity-0' : 'w-full opacity-100'}`}>
              <h1 className="text-lg font-bold tracking-tight text-[#0F172A] m-0 font-serif leading-tight whitespace-nowrap">
                BeefERP
              </h1>
              <span className="text-[8px] text-primary uppercase tracking-[0.2em] font-extrabold mt-0.5 whitespace-nowrap">
                ENTERPRISE ERP
              </span>
            </div>
          </div>
          
          {!isSidebarCollapsed && (
            <button 
              onClick={() => setIsSidebarCollapsed(true)} 
              className="p-1.5 hover:bg-[#F1F5F9] rounded-md text-[#64748B] transition-all ml-auto"
              title="Collapse Sidebar"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
            </button>
          )}
        </div>

        {/* Navigation grouped by Workflow */}
        <nav className={`flex-1 py-5 space-y-5 ${isSidebarCollapsed ? 'px-2' : 'px-3'}`}>
          {navigationGroups.map((group) => (
            <div key={group.title}>
              {!isSidebarCollapsed ? (
                <p className="px-3 mb-2 text-[10px] text-accent uppercase tracking-[0.15em] font-bold">
                  {group.title}
                </p>
              ) : (
                <div className="w-6 h-px bg-[#E2E8F0] mx-auto mb-3"></div>
              )}
              <div className="space-y-1">
                {group.items.map((item) => (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={`relative group flex items-center ${isSidebarCollapsed ? 'justify-center px-2' : 'gap-3 px-3'} py-2 rounded-lg font-medium text-xs transition-all duration-200 ${
                      isActive(item.path)
                        ? 'bg-blue-50 text-primary font-bold shadow-sm'
                        : 'text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A]'
                    }`}
                  >
                    <span className={`text-base flex-shrink-0 transition-transform duration-200 ${!isActive(item.path) ? 'group-hover:scale-110' : ''}`}>{item.icon}</span>
                    
                    <div className={`overflow-hidden transition-all duration-300 ${isSidebarCollapsed ? 'w-0 opacity-0' : 'w-full opacity-100'}`}>
                      <span className="whitespace-nowrap ml-1">{item.name}</span>
                    </div>
                    
                    {/* Tooltip for Collapsed State */}
                    {isSidebarCollapsed && (
                      <div className="absolute left-full ml-4 px-2.5 py-1.5 bg-[#0F172A] text-white text-[10px] font-bold rounded-md opacity-0 group-hover:opacity-100 pointer-events-none z-50 whitespace-nowrap shadow-xl transform translate-x-2 group-hover:translate-x-0 transition-all duration-200">
                        {item.name}
                        {/* Tooltip Arrow */}
                        <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-[#0F172A] rotate-45"></div>
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* User Footer Profile */}
        <div className="p-3 border-t border-[#E2E8F0] bg-[#F8FAFC] flex flex-col items-center">
          <div className={`flex items-center gap-3 mb-3 transition-all duration-300 ${isSidebarCollapsed ? 'justify-center w-full px-0' : 'w-full px-2'}`}>
            <div 
              className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center font-bold text-white text-xs shadow-sm flex-shrink-0 cursor-pointer hover:ring-4 hover:ring-blue-100 transition-all"
              title={isSidebarCollapsed ? user?.name : undefined}
            >
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className={`flex flex-col overflow-hidden transition-all duration-300 ${isSidebarCollapsed ? 'w-0 opacity-0' : 'w-full opacity-100'}`}>
              <p className="text-xs font-bold truncate text-[#0F172A] leading-tight">
                {user?.name || 'Operator'}
              </p>
              <p className="text-[10px] font-medium text-[#64748B] truncate leading-tight mt-1">
                @{user?.username || 'operator'}
              </p>
            </div>
          </div>

          <div className={`w-full transition-all duration-300 ${isSidebarCollapsed ? 'px-0' : 'px-1'}`}>
            {!isSidebarCollapsed ? (
              <button
                onClick={handleLogout}
                className="w-full py-2 rounded-lg bg-white border border-[#E2E8F0] hover:bg-red-50 hover:border-red-200 hover:text-danger text-[#475569] font-bold text-[11px] transition-all shadow-sm flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                Sign Out
              </button>
            ) : (
              <button
                onClick={handleLogout}
                title="Sign Out"
                className="w-9 h-9 rounded-xl bg-white border border-[#E2E8F0] hover:bg-red-50 hover:border-red-200 hover:text-danger text-[#475569] transition-all shadow-sm flex items-center justify-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
              </button>
            )}
          </div>
        </div>
        
        {/* Toggle Expand Button when collapsed */}
        {isSidebarCollapsed && (
          <button 
            onClick={() => setIsSidebarCollapsed(false)}
            className="absolute top-[22px] -right-3 bg-white border border-[#E2E8F0] text-[#64748B] hover:text-primary rounded-full p-1 shadow-sm z-50 transition-colors"
            title="Expand Sidebar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </button>
        )}
      </aside>

      {/* ========================================= */}
      {/* MOBILE TOP HEADER                         */}
      {/* ========================================= */}
      <header className="md:hidden bg-white text-[#0F172A] px-4 py-3 flex items-center justify-between shadow-sm sticky top-0 z-40 border-b border-[#E2E8F0]">
        <div className="flex flex-col">
          <h1 className="text-sm font-bold font-serif text-[#0F172A] m-0">BeefERP</h1>
          <span className="text-[9px] text-primary uppercase tracking-wider font-bold">
            ENTERPRISE ERP
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-[#475569] font-medium">
            {formattedDate}
          </span>
          <div className="w-7 h-7 rounded bg-primary flex items-center justify-center font-bold text-white text-xs">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 text-[#0F172A]"
          >
            <span className="text-lg">{isMobileMenuOpen ? '✕' : '☰'}</span>
          </button>
        </div>
      </header>

      {/* Mobile Dropdown Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-[#E2E8F0] px-4 py-3 animate-fade-in z-30 sticky top-[48px] shadow-sm">
          <div className="space-y-4 my-2">
            {navigationGroups.map((group) => (
              <div key={group.title} className="space-y-1">
                <p className="text-[9px] text-[#64748B] uppercase font-bold tracking-wider px-2">{group.title}</p>
                {group.items.map((item) => (
                  <Link
                    key={item.name}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-xs ${
                      isActive(item.path) ? 'bg-blue-50 text-primary font-bold' : 'text-[#475569]'
                    }`}
                  >
                    <span>{item.icon}</span>
                    <span>{item.name}</span>
                  </Link>
                ))}
              </div>
            ))}
          </div>
          <div className="pt-2.5 border-t border-[#E2E8F0] flex items-center justify-between mt-2">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[#0F172A] font-semibold">{user?.name}</span>
              <span className="badge-active text-[9px] capitalize">{user?.role}</span>
            </div>
            <button
              onClick={handleLogout}
              className="py-1 px-2.5 rounded border border-[#E2E8F0] bg-white text-danger hover:bg-danger hover:text-white font-bold text-[10px]"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}

      {/* ========================================= */}
      {/* MAIN CONTENT AREA                         */}
      {/* ========================================= */}
      <main className="flex-1 flex flex-col min-w-0 md:h-screen md:overflow-hidden">
        
        {/* Desktop Top Bar */}
        <header className="hidden md:flex items-center justify-between bg-white px-8 py-3 border-b border-[#E2E8F0] sticky top-0 z-30">
          <div>
            <h2 className="text-lg font-bold text-primary m-0 leading-tight font-serif">
              {pageMeta.title}
            </h2>
            <p className="text-[11px] text-gray-400 mt-0.5 font-medium">
              {pageMeta.subtitle}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[11px] text-gray-500 font-semibold bg-background-dark/20 px-3 py-1 rounded-lg border border-black/5">
              {formattedDate}
            </span>
            <div className="w-px h-5 bg-[#F0F0F0]" />
            <div className="flex items-center gap-2.5 bg-background px-3 py-1 rounded-lg border border-[#E2E8F0]">
              <div className="w-6 h-6 rounded-lg bg-primary flex items-center justify-center font-bold text-white text-xs">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div>
                <p className="text-[11px] font-semibold text-primary leading-tight">{user?.name}</p>
                <p className="text-[9px] text-gray-400 leading-tight">@{user?.username || 'operator'}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 flex flex-col min-h-0 p-3 md:p-4 lg:p-5 max-w-[1400px] w-full mx-auto overflow-y-auto">
          {children}
        </div>

        {/* Desktop Footer */}
        <footer className="hidden md:flex flex-shrink-0 items-center justify-between px-8 py-2.5 border-t border-[#E2E8F0] bg-white text-[10px] font-medium text-gray-400">
          <span>BeefERP v2.0 Enterprise — Agricultural ERP Suite</span>
          <span>Cloud Database: Connected</span>
        </footer>
      </main>

      {/* ========================================= */}
      {/* MOBILE BOTTOM NAVIGATION BAR              */}
      {/* ========================================= */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#E2E8F0] px-1 pb-[env(safe-area-inset-bottom)] z-40 shadow-sm">
        <div className="flex items-center justify-around">
          {navigationGroups[0].items.slice(0, 4).map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className={`flex flex-col items-center justify-center py-2.5 px-2 min-w-0 flex-1 transition-colors ${
                isActive(item.path) ? 'text-primary' : 'text-gray-400'
              }`}
            >
              <span className="text-lg mb-0.5">{item.icon}</span>
              <span className="text-[9px] font-bold tracking-tight">{item.shortName}</span>
            </Link>
          ))}
          <Link
            to="/reports"
            className={`flex flex-col items-center justify-center py-2.5 px-2 min-w-0 flex-1 transition-colors ${
              isActive('/reports') ? 'text-primary' : 'text-gray-400'
            }`}
          >
            <span className="text-lg mb-0.5">📄</span>
            <span className="text-[9px] font-bold tracking-tight">Reports</span>
          </Link>
        </div>
      </nav>
    </div>
  );
};

export default Layout;
