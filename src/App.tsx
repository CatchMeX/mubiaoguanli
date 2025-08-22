import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { Toaster } from '@/components/ui/toaster';
import MobileLayout from '@/components/MobileLayout';
import DynamicRedirect from '@/components/DynamicRedirect';
import MobileDynamicRedirect from '@/components/MobileDynamicRedirect';
import Dashboard from '@/pages/Dashboard';
import Members from '@/pages/Members';
import Departments from '@/pages/Departments';
import Teams from '@/pages/TeamManagement';
import EmployeeMileage from '@/pages/EmployeeMileageManagement';
import Tasks from '@/pages/Tasks';
import TestUserSelect from '@/pages/TestUserSelect';
import TestUserSelectExpand from '@/pages/TestUserSelectExpand';
import GoalsDashboard from '@/pages/goals/GoalDashboard';
import CompanyGoals from '@/pages/goals/CompanyYearlyGoals';
import TeamGoals from '@/pages/goals/TeamMonthlyGoals';
import PersonalGoals from '@/pages/goals/PersonalMonthlyGoals';
import UnitManagement from '@/pages/UnitManagement';
// 移动端页面
import MobileCompanyGoals from '@/pages/mobile/CompanyYearlyGoals';
import MobileTeamGoals from '@/pages/mobile/TeamMonthlyGoals';
import MobilePersonalGoals from '@/pages/mobile/PersonalMonthlyGoals';
import Finance from '@/pages/Finance';
import Projects from '@/pages/ProjectManagement';
import Categories from '@/pages/finance/CategoryManagement';
import Costs from '@/pages/finance/CostManagement';
import Allocations from '@/pages/finance/AllocationQuery';
import Revenue from '@/pages/finance/RevenueManagement';
import Expenses from '@/pages/finance/ExpenseManagement';
import Accounts from '@/pages/finance/AccountsManagement';
import Assets from '@/pages/AssetManagement';
import AssetCategories from '@/pages/assets/AssetCategories';
import AssetLocations from '@/pages/assets/AssetLocations';
import AssetBrands from '@/pages/assets/Brands';
import AssetList from '@/pages/assets/AssetList';
import AssetInventoryManagement from '@/pages/assets/AssetInventoryManagement';
import AssetMovements from '@/pages/assets/AssetMovements';
import AssetMaintenance from '@/pages/assets/MaintenanceManagement';
import AssetDisposal from '@/pages/assets/AssetDisposal';
import AssetInventory from '@/pages/assets/AssetInventory';
import AssetReports from '@/pages/assets/AssetReports';
import ProcurementOrders from '@/pages/assets/procurement/ProcurementOrders';
import ProcurementReceipts from '@/pages/assets/procurement/ProcurementReceipts';
import Customers from '@/pages/CustomerManagement';
import Suppliers from '@/pages/SupplierManagement';
import SalesOrderManagement from '@/pages/SalesOrderManagement';
import Permissions from '@/pages/Permissions';
import WorkflowDesigner from '@/pages/approval/WorkflowDesigner';
import PendingList from '@/pages/approval/PendingList';
import Login from '@/pages/auth/Login';
import Register from '@/pages/auth/Register';
import Profile from '@/pages/Profile';
import RideSharingDailyReports from '@/pages/RideSharingDailyReports';
import FinancialMatters from '@/pages/finance/FinancialMatters';
import PaymentManagement from '@/pages/finance/PaymentManagement';
import ExpenseReimbursement from '@/pages/finance/ExpenseReimbursement';
import BusinessTripReimbursement from '@/pages/finance/BusinessTripReimbursement';
// 行政管理模块
import AdministrativeManagement from '@/pages/AdministrativeManagement';
import LeaveManagement from '@/pages/administrative/LeaveManagement';
import AttendanceManagement from '@/pages/administrative/AttendanceManagement';
import BusinessTripManagement from '@/pages/administrative/BusinessTripManagement';
import CardReplacementManagement from '@/pages/administrative/CardReplacementManagement';
import OutingManagement from '@/pages/administrative/OutingManagement';
import ShiftExchangeManagement from '@/pages/administrative/ShiftExchangeManagement';
import Notifications from '@/pages/Notifications';
import { PermissionRoute } from '@/components/PermissionRoute';
import PermissionExample from '@/pages/PermissionExample';
import PermissionDebug from '@/pages/PermissionDebug';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

const AuthRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  return !isAuthenticated ? <>{children}</> : <Navigate to="/" />;
};

const AppContent = () => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<AuthRoute><Login /></AuthRoute>} />
        <Route path="/register" element={<AuthRoute><Register /></AuthRoute>} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    );
  }

  // 检测是否为移动端
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 1024); // lg断点是1024px
    };

    // 初始检查
    checkIsMobile();

    // 监听窗口大小变化
    window.addEventListener('resize', checkIsMobile);

    // 清理事件监听器
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // 根据屏幕尺寸渲染对应的布局
  if (isMobile) {
    return (
      <Routes>
        <Route path="/" element={<ProtectedRoute><MobileDynamicRedirect /></ProtectedRoute>} />
        <Route path="/goals" element={<ProtectedRoute><MobileLayout /></ProtectedRoute>}>
          <Route path="company-yearly" element={<MobileCompanyGoals />} />
          <Route path="team" element={<MobileTeamGoals />} />
          <Route path="personal" element={<MobilePersonalGoals />} />
        </Route>
        <Route path="*" element={<Navigate to="/goals/personal" />} />
      </Routes>
    );
  }

  // PC端布局
  return (
    <div className="flex h-screen bg-background theme-transition">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background p-6">
          <Routes>
            <Route path="/" element={<ProtectedRoute><DynamicRedirect /></ProtectedRoute>} />
            <Route path="/members" element={<ProtectedRoute><Members /></ProtectedRoute>} />
            <Route path="/departments" element={<ProtectedRoute><Departments /></ProtectedRoute>} />
            <Route path="/teams" element={<ProtectedRoute><Teams /></ProtectedRoute>} />
            <Route path="/employee-mileage" element={<ProtectedRoute><EmployeeMileage /></ProtectedRoute>} />
            <Route path="/customers" element={<ProtectedRoute><Customers /></ProtectedRoute>} />
            <Route path="/suppliers" element={<ProtectedRoute><Suppliers /></ProtectedRoute>} />
            <Route path="/sales-orders" element={<ProtectedRoute><SalesOrderManagement /></ProtectedRoute>} />
            <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
            <Route path="/tasks" element={<ProtectedRoute><Tasks /></ProtectedRoute>} />
            <Route path="/test-user-select" element={<ProtectedRoute><TestUserSelect /></ProtectedRoute>} />
            <Route path="/test-user-select-expand" element={<ProtectedRoute><TestUserSelectExpand /></ProtectedRoute>} />
            <Route path="/goals/dashboard" element={<ProtectedRoute><GoalsDashboard /></ProtectedRoute>} />
            <Route path="/goals/company-yearly" element={<ProtectedRoute><CompanyGoals /></ProtectedRoute>} />
            <Route path="/goals/team" element={<ProtectedRoute><TeamGoals /></ProtectedRoute>} />
            <Route path="/goals/personal" element={<ProtectedRoute><PersonalGoals /></ProtectedRoute>} />
            <Route path="/goals/units" element={<ProtectedRoute><UnitManagement /></ProtectedRoute>} />
            <Route path="/approval/workflow" element={<ProtectedRoute><WorkflowDesigner /></ProtectedRoute>} />
            <Route path="/approval/pending" element={<ProtectedRoute><PendingList /></ProtectedRoute>} />
            <Route path="/finance/categories" element={<ProtectedRoute><Categories /></ProtectedRoute>} />
            <Route path="/finance/costs" element={<ProtectedRoute><Costs /></ProtectedRoute>} />
            <Route path="/finance/allocations" element={<ProtectedRoute><Allocations /></ProtectedRoute>} />
            <Route path="/finance/revenue" element={<ProtectedRoute><Revenue /></ProtectedRoute>} />
            <Route path="/finance/expenses" element={<ProtectedRoute><Expenses /></ProtectedRoute>} />
            <Route path="/finance/accounts" element={<ProtectedRoute><Accounts /></ProtectedRoute>} />
            <Route path="/finance/matters" element={<ProtectedRoute><FinancialMatters /></ProtectedRoute>} />
            <Route path="/finance/payments" element={<ProtectedRoute><PaymentManagement /></ProtectedRoute>} />
            <Route path="/finance/expense-reimbursement" element={<ProtectedRoute><ExpenseReimbursement /></ProtectedRoute>} />
            <Route path="/finance/business-trip-reimbursement" element={<ProtectedRoute><BusinessTripReimbursement /></ProtectedRoute>} />
            <Route path="/finance" element={<ProtectedRoute><Finance /></ProtectedRoute>} />
            <Route path="/assets" element={<ProtectedRoute><Assets /></ProtectedRoute>} />
            <Route path="/assets/categories" element={<ProtectedRoute><AssetCategories /></ProtectedRoute>} />
            <Route path="/assets/locations" element={<ProtectedRoute><AssetLocations /></ProtectedRoute>} />
            <Route path="/assets/brands" element={<ProtectedRoute><AssetBrands /></ProtectedRoute>} />
            <Route path="/assets/list" element={<ProtectedRoute><AssetList /></ProtectedRoute>} />
            <Route path="/assets/inventory" element={<ProtectedRoute><AssetInventoryManagement /></ProtectedRoute>} />
            <Route path="/assets/movements" element={<ProtectedRoute><AssetMovements /></ProtectedRoute>} />
            <Route path="/assets/maintenance" element={<ProtectedRoute><AssetMaintenance /></ProtectedRoute>} />
            <Route path="/assets/disposal" element={<ProtectedRoute><AssetDisposal /></ProtectedRoute>} />
            <Route path="/assets/reports" element={<ProtectedRoute><AssetReports /></ProtectedRoute>} />
            {/* 修复采购管理路由 - 与侧边栏菜单路径匹配 */}
            <Route path="/assets/procurement/orders" element={<ProtectedRoute><ProcurementOrders /></ProtectedRoute>} />
            <Route path="/assets/procurement/receipts" element={<ProtectedRoute><ProcurementReceipts /></ProtectedRoute>} />
            <Route path="/permissions" element={<ProtectedRoute><Permissions /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/ride-sharing-daily-reports" element={<ProtectedRoute><RideSharingDailyReports /></ProtectedRoute>} />
            {/* 行政管理模块路由 */}
            <Route path="/administrative" element={<ProtectedRoute><AdministrativeManagement /></ProtectedRoute>} />
            <Route path="/administrative/leave" element={<ProtectedRoute><LeaveManagement /></ProtectedRoute>} />
            <Route path="/administrative/attendance" element={<ProtectedRoute><AttendanceManagement /></ProtectedRoute>} />
            <Route path="/administrative/business-trip" element={<ProtectedRoute><BusinessTripManagement /></ProtectedRoute>} />
            <Route path="/administrative/card-replacement" element={<ProtectedRoute><CardReplacementManagement /></ProtectedRoute>} />
            <Route path="/administrative/outing" element={<ProtectedRoute><OutingManagement /></ProtectedRoute>} />
            <Route path="/administrative/shift-exchange" element={<ProtectedRoute><ShiftExchangeManagement /></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
            <Route path="/permission-example" element={<ProtectedRoute><PermissionExample /></ProtectedRoute>} />
            <Route path="/permission-debug" element={<ProtectedRoute><PermissionDebug /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <AppContent />
          <Toaster />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
