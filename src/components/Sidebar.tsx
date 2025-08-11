// @ts-nocheck
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  LayoutDashboard,
  Users,
  Building2,
  CheckSquare,
  Target,
  DollarSign,
  Package,
  ChevronDown,
  ChevronRight,
  UserCheck,
  Briefcase,
  BarChart3,
  Calendar,
  User,
  FolderTree,
  Calculator,
  Receipt,
  CreditCard,
  PieChart,
  TrendingUp,
  Building,
  MapPin,
  Truck,
  Tag,
  List,
  ArrowRightLeft,
  Wrench,
  Trash2,
  ClipboardList,
  FileText,
  ShoppingCart,
  PackageCheck,
  UserPlus,
  Shield,
  Settings,
  Route,
  Database,
  ArrowUpDown,
  GitBranch,
  Clock,
  Plane,
} from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();
  const [openMenus, setOpenMenus] = useState<string[]>([]);

  const toggleMenu = (menuId: string) => {
    setOpenMenus(prev => 
      prev.includes(menuId) 
        ? prev.filter(id => id !== menuId)
        : [...prev, menuId]
    );
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const isParentActive = (paths: string[]) => {
    return paths.some(path => location.pathname.startsWith(path));
  };

  const menuItems = [
    // {
    //   title: '统计看板',
    //   icon: LayoutDashboard,
    //   href: '/',
    // },
    {
      title: '组织管理',
      icon: Settings,
      id: 'organization',
      children: [
        { title: '部门管理', icon: Building2, href: '/departments' },
        { title: '项目管理', icon: Briefcase, href: '/teams' },
        /*{ title: '权限管理', icon: Shield, href: '/permissions' },*/
        { title: '成员管理', icon: UserCheck, href: '/members' },
        /*{ title: '员工里程', icon: Route, href: '/employee-mileage' },
        { title: '共享出行城市日报', icon: BarChart3, href: '/ride-sharing-daily-reports' },*/
      ],
    },
    /*{
      title: '基础数据',
      icon: Database,
      id: 'basic-data',
      children: [
        { title: '客户管理', icon: UserPlus, href: '/customers' },
        { title: '供应商管理', icon: Truck, href: '/suppliers' },
        { title: '项目管理', icon: FolderTree, href: '/projects' },
        // { title: '销售订单', icon: ShoppingCart, href: '/sales-orders' },
      ],
    },*/
    {
      title: '任务管理',
      icon: CheckSquare,
      href: '/tasks',
    },
    {
      title: '目标管理',
      icon: Target,
      id: 'goals',
      children: [
        { title: '公司年度目标', icon: BarChart3, href: '/goals/dashboard' },
        /*{ title: '公司年度目标', icon: Building2, href: '/goals/company' },*/
        { title: '部门月度目标', icon: Users, href: '/goals/team' },
        { title: '个人月度目标', icon: User, href: '/goals/personal' },
        { title: '单位管理', icon: Tag, href: '/goals/units' },
      ],
    },
    {
      title: '审批管理',
      icon: GitBranch,
      id: 'approval',
      children: [
        { title: '流程配置', icon: Settings, href: '/approval/workflow' },
        { title: '待办列表', icon: Clock, href: '/approval/pending' },
      ],
    },
    {
      title: '财务管理',
      icon: DollarSign,
      id: 'finance',
      children: [
        /*{ title: '财务概览', icon: PieChart, href: '/finance' },*/
        /*{ title: '分类管理', icon: Tag, href: '/finance/categories' },*/
        /*{ title: '成本管理', icon: Calculator, href: '/finance/costs' },
        { title: '收入管理', icon: Receipt, href: '/finance/revenue' },
        { title: '费用管理', icon: CreditCard, href: '/finance/expenses' },*/
        { title: '事项管理', icon: FileText, href: '/finance/matters' },
        { title: '付款/借款管理', icon: CreditCard, href: '/finance/payments' },
        { title: '费用报销/冲销管理', icon: Receipt, href: '/finance/expense-reimbursement' },
        { title: '差旅费报销管理', icon: Plane, href: '/finance/business-trip-reimbursement' },
        /*{ title: '往来管理', icon: FileText, href: '/finance/accounts' },*/
      ],
    },
    // {
    //   title: '资产管理',
    //   icon: Package,
    //   id: 'assets',
    //   children: [
    //     /*{ title: '资产概览', icon: BarChart3, href: '/assets' },*/
    //     { title: '资产分类', icon: Tag, href: '/assets/categories' },
    //     { title: '存放位置', icon: MapPin, href: '/assets/locations' },
    //     { title: '品牌管理', icon: Building, href: '/assets/brands' },
    //     { title: '资产清单', icon: List, href: '/assets/list' },
    //     /*{ title: '出入库管理', icon: ArrowUpDown, href: '/assets/inventory' },*/
    //     { title: '资产变动', icon: ArrowRightLeft, href: '/assets/movements' },
    //     { title: '维护管理', icon: Wrench, href: '/assets/maintenance' },
    //     { title: '资产处置', icon: Trash2, href: '/assets/disposal' },
    //     /*{ title: '资产报表', icon: ClipboardList, href: '/assets/reports' },*/
    //   ],
    // },
    // {
    //   title: '采购管理',
    //   icon: ShoppingCart,
    //   id: 'procurement',
    //   children: [
    //     { title: '采购订单', icon: ShoppingCart, href: '/assets/procurement/orders' },
    //     { title: '入库管理', icon: PackageCheck, href: '/assets/procurement/receipts' },
    //   ],
    // },
    // {
    //   title: '行政管理',
    //   icon: Clock,
    //   id: 'administrative',
    //   children: [
    //     { title: '考勤管理', icon: Clock, href: '/administrative/attendance' },
    //     { title: '请假管理', icon: Calendar, href: '/administrative/leave' },
    //     { title: '出差管理', icon: MapPin, href: '/administrative/business-trip' },
    //     { title: '补卡管理', icon: CreditCard, href: '/administrative/card-replacement' },
    //     { title: '外出管理', icon: ArrowRightLeft, href: '/administrative/outing' },
    //     { title: '调班管理', icon: ArrowUpDown, href: '/administrative/shift-exchange' },
    //   ],
    // },
  ];

  const renderMenuItem = (item: any, level = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isMenuOpen = openMenus.includes(item.id || '');
    const itemIsActive = item.href ? isActive(item.href) : false;
    const childrenActive = hasChildren && item.children.some((child: any) => 
      child.href ? isActive(child.href) : 
      child.children ? child.children.some((grandChild: any) => isActive(grandChild.href)) : false
    );

    if (hasChildren) {
      return (
        <Collapsible key={item.title} open={isMenuOpen} onOpenChange={() => toggleMenu(item.id)}>
          <CollapsibleTrigger asChild>
            <Button
              variant={isActive(item.href) ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-between text-left font-normal h-10",
                level > 0 && "ml-4 w-[calc(100%-1rem)]",
                (childrenActive || itemIsActive) && "bg-accent text-accent-foreground"
              )}
            >
              <div className="flex items-center">
                {level === 0 && <item.icon className="mr-2 h-4 w-4" />}
                {level === 1 && item.icon && <item.icon className="mr-2 h-3 w-3" />}
                {level === 1 && !item.icon && <div className="w-2 h-2 rounded-full bg-muted-foreground mr-2 opacity-60" />}
                {level === 2 && <div className="w-1 h-1 rounded-full bg-muted-foreground mr-2 opacity-40" />}
                <span>{item.title}</span>
              </div>
              {isMenuOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-1 mt-1">
            {item.children.map((child: any) => renderMenuItem(child, level + 1))}
          </CollapsibleContent>
        </Collapsible>
      );
    }

    return (
      <Button
        key={item.title}
        variant={isActive(item.href) ? "secondary" : "ghost"}
        className={cn(
          "w-full justify-start font-normal h-10",
          level > 0 && "ml-4 w-[calc(100%-1rem)]",
          level > 1 && "ml-8 w-[calc(100%-2rem)]",
          itemIsActive && "bg-accent text-accent-foreground"
        )}
        asChild
      >
        <Link to={item.href}>
          {level === 0 && <item.icon className="mr-2 h-4 w-4" />}
          {level === 1 && item.icon && <item.icon className="mr-2 h-3 w-3" />}
          {level === 1 && !item.icon && <div className="w-2 h-2 rounded-full bg-muted-foreground mr-2 opacity-60" />}
          {level === 2 && <div className="w-1 h-1 rounded-full bg-muted-foreground mr-2 opacity-40" />}
          {item.title}
        </Link>
      </Button>
    );
  };

  return (
    <div className="pb-12 w-64 bg-card border-r border-border theme-transition">
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <div className="flex items-center mb-4 px-2">
            <Target className="h-6 w-6 mr-2 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">目标管理系统</h2>
          </div>
          <ScrollArea className="h-[calc(100vh-8rem)]">
            <div className="space-y-1">
              {menuItems.map((item) => renderMenuItem(item))}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
