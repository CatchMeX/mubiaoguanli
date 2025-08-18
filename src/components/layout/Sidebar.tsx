import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  LayoutDashboard,
  Users,
  Target,
  CheckSquare,
  Building2,
  DollarSign,
  Settings,
  ChevronDown,
  ChevronRight,
  UserCheck,
  Shield,
  Route,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Database,
  FolderOpen,
  Building,
  Truck,
  Package,
  ArrowUpDown,
} from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { usePermissions } from '@/hooks/usePermissions';

// 定义菜单项结构，包含权限代码
const menuItems = [
  {
    title: '统计看板',
    icon: LayoutDashboard,
    href: '/',
    permission: 'DASHBOARD_MENU'
  },
  {
    title: '成员管理',
    icon: Users,
    href: '/members',
    permission: 'MEMBER_MANAGEMENT'
  },
  {
    title: '任务管理',
    icon: CheckSquare,
    href: '/tasks',
    permission: 'TASK_MANAGEMENT'
  },
  {
    title: '目标管理',
    icon: Target,
    href: '/goals',
    permission: 'GOAL_MANAGEMENT'
  },
  {
    title: '部门管理',
    icon: Building2,
    href: '/departments',
    permission: 'DEPARTMENT_MANAGEMENT'
  },
  {
    title: '团队管理',
    icon: UserCheck,
    href: '/teams',
    permission: 'PROJECT_MANAGEMENT'
  },
  {
    title: '权限管理',
    icon: Shield,
    permission: 'PERMISSION_MANAGEMENT',
    children: [
      {
        title: '角色管理',
        href: '/permissions',
        permission: 'PERMISSION_MANAGEMENT'
      },
      {
        title: '权限示例',
        href: '/permission-example',
        permission: 'PERMISSION_MANAGEMENT'
      },
      {
        title: '权限调试',
        href: '/permission-debug',
        permission: 'PERMISSION_MANAGEMENT'
      }
    ],
  },
  {
    title: '员工里程',
    icon: Route,
    href: '/mileage',
    permission: 'MILEAGE_MANAGEMENT'
  },
  {
    title: '财务管理',
    icon: DollarSign,
    permission: 'FINANCE_MANAGEMENT',
    children: [
      {
        title: '收入管理',
        href: '/finance/revenue',
        permission: 'REVENUE_MANAGEMENT'
      },
      {
        title: '费用管理',
        href: '/finance/expenses',
        permission: 'EXPENSE_MANAGEMENT'
      },
      {
        title: '成本管理',
        href: '/finance/costs',
        permission: 'COST_MANAGEMENT'
      },
      {
        title: '往来管理',
        href: '/finance/accounts',
        permission: 'ACCOUNT_MANAGEMENT'
      },
      {
        title: '事项管理',
        href: '/finance/matters',
        permission: 'MATTER_MANAGEMENT'
      },
      {
        title: '付款管理',
        href: '/finance/payments',
        permission: 'PAYMENT_MANAGEMENT'
      },
      {
        title: '费用报销',
        href: '/finance/expense-reimbursement',
        permission: 'EXPENSE_REIMBURSEMENT'
      },
      {
        title: '差旅报销',
        href: '/finance/business-trip-reimbursement',
        permission: 'BUSINESS_TRIP_REIMBURSEMENT'
      }
    ],
  },
  {
    title: '基础数据',
    icon: Database,
    permission: 'BASIC_DATA_MANAGEMENT',
    children: [
      {
        title: '客户管理',
        href: '/customers',
        permission: 'CUSTOMER_MANAGEMENT'
      },
      {
        title: '供应商管理',
        href: '/suppliers',
        permission: 'SUPPLIER_MANAGEMENT'
      },
      {
        title: '项目管理',
        href: '/projects',
        permission: 'PROJECT_MANAGEMENT'
      }
    ],
  },
  {
    title: '资产管理',
    icon: Building,
    permission: 'ASSET_MANAGEMENT',
    children: [
      {
        title: '资产概览',
        href: '/assets',
        permission: 'ASSET_OVERVIEW'
      },
      {
        title: '资产分类',
        href: '/assets/categories',
        permission: 'ASSET_CATEGORY_MANAGEMENT'
      },
      {
        title: '资产位置',
        href: '/assets/locations',
        permission: 'ASSET_LOCATION_MANAGEMENT'
      },
      {
        title: '资产品牌',
        href: '/assets/brands',
        permission: 'ASSET_BRAND_MANAGEMENT'
      },
      {
        title: '资产列表',
        href: '/assets/list',
        permission: 'ASSET_LIST_VIEW'
      },
      {
        title: '资产盘点',
        href: '/assets/inventory',
        permission: 'ASSET_INVENTORY_MANAGEMENT'
      },
      {
        title: '资产移动',
        href: '/assets/movements',
        permission: 'ASSET_MOVEMENT_MANAGEMENT'
      },
      {
        title: '资产维护',
        href: '/assets/maintenance',
        permission: 'ASSET_MAINTENANCE_MANAGEMENT'
      },
      {
        title: '资产处置',
        href: '/assets/disposal',
        permission: 'ASSET_DISPOSAL_MANAGEMENT'
      },
      {
        title: '资产报表',
        href: '/assets/reports',
        permission: 'ASSET_REPORT_VIEW'
      }
    ],
  },
  {
    title: '采购管理',
    icon: Package,
    permission: 'PROCUREMENT_MANAGEMENT',
    children: [
      {
        title: '采购订单',
        href: '/assets/procurement/orders',
        permission: 'PROCUREMENT_ORDER_MANAGEMENT'
      },
      {
        title: '采购收货',
        href: '/assets/procurement/receipts',
        permission: 'PROCUREMENT_RECEIPT_MANAGEMENT'
      }
    ],
  },
  {
    title: '审批管理',
    icon: Shield,
    permission: 'APPROVAL_MANAGEMENT',
    children: [
      {
        title: '流程配置',
        href: '/approval/workflow',
        permission: 'WORKFLOW_CONFIG'
      },
      {
        title: '待办列表',
        href: '/approval/pending',
        permission: 'PENDING_LIST'
      }
    ],
  },
  {
    title: '行政管理',
    icon: Settings,
    permission: 'ADMINISTRATIVE_MANAGEMENT',
    children: [
      {
        title: '请假管理',
        href: '/administrative/leave',
        permission: 'LEAVE_MANAGEMENT'
      },
      {
        title: '考勤管理',
        href: '/administrative/attendance',
        permission: 'ATTENDANCE_MANAGEMENT'
      },
      {
        title: '出差管理',
        href: '/administrative/business-trip',
        permission: 'BUSINESS_TRIP_MANAGEMENT'
      },
      {
        title: '补卡管理',
        href: '/administrative/card-replacement',
        permission: 'CARD_REPLACEMENT_MANAGEMENT'
      },
      {
        title: '外出管理',
        href: '/administrative/outing',
        permission: 'OUTING_MANAGEMENT'
      },
      {
        title: '换班管理',
        href: '/administrative/shift-exchange',
        permission: 'SHIFT_EXCHANGE_MANAGEMENT'
      }
    ],
  },
  {
    title: '通知管理',
    icon: Settings,
    href: '/notifications',
    permission: 'NOTIFICATION_MANAGEMENT'
  },
  {
    title: '系统设置',
    icon: Settings,
    href: '/settings',
    permission: 'SYSTEM_SETTINGS'
  },
];

export function Sidebar() {
  const location = useLocation();
  const { hasPermission, userPermissions } = usePermissions();
  const [openItems, setOpenItems] = useState<string[]>(['财务管理', '基础数据', '权限管理', '资产管理', '采购管理', '审批管理', '行政管理']);

  // 过滤有权限的菜单项
  const filteredMenuItems = menuItems.filter(item => {
    if (item.children) {
      // 如果有子菜单，检查是否有任何子菜单有权限
      return item.children.some(child => hasPermission(child.permission));
    }
    return hasPermission(item.permission);
  });

  // 调试信息
  console.log('侧边栏权限检查:', {
    totalMenuItems: menuItems.length,
    filteredMenuItems: filteredMenuItems.length,
    userPermissions: userPermissions,
    hasPermission: (code: string) => hasPermission(code)
  });

  const toggleItem = (title: string) => {
    setOpenItems(prev =>
      prev.includes(title)
        ? prev.filter(item => item !== title)
        : [...prev, title]
    );
  };

  const isActive = (href: string) => {
    if (href === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(href);
  };

  const isParentActive = (children: { href: string }[]) => {
    return children.some(child => isActive(child.href));
  };

  return (
    <div className="w-64 bg-card border-r border-border h-full theme-transition">
      <div className="p-6">
        <h2 className="text-lg font-semibold text-foreground">目标管理系统</h2>
      </div>
      <ScrollArea className="h-[calc(100vh-5rem)]">
        <div className="px-3 py-2">
          <div className="space-y-1">
            {filteredMenuItems.map((item) => {
              if (item.children) {
                // 过滤有权限的子菜单
                const accessibleChildren = item.children.filter(child => hasPermission(child.permission));
                
                // 如果没有可访问的子菜单，不显示父菜单
                if (accessibleChildren.length === 0) return null;
                
                const isOpen = openItems.includes(item.title);
                const hasActiveChild = isParentActive(accessibleChildren);
                
                return (
                  <Collapsible key={item.title} open={isOpen} onOpenChange={() => toggleItem(item.title)}>
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        className={cn(
                          "w-full justify-start text-muted-foreground hover:text-foreground hover:bg-accent",
                          hasActiveChild && "bg-accent text-foreground"
                        )}
                      >
                        <item.icon className="mr-2 h-4 w-4" />
                        {item.title}
                        {isOpen ? (
                          <ChevronDown className="ml-auto h-4 w-4" />
                        ) : (
                          <ChevronRight className="ml-auto h-4 w-4" />
                        )}
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-1">
                      {accessibleChildren.map((child) => (
                        <Button
                          key={child.href}
                          variant="ghost"
                          className={cn(
                            "w-full justify-start pl-8 text-muted-foreground hover:text-foreground hover:bg-accent",
                            isActive(child.href) && "bg-accent text-foreground"
                          )}
                          asChild
                        >
                          <Link to={child.href}>
                            {child.title}
                          </Link>
                        </Button>
                      ))}
                    </CollapsibleContent>
                  </Collapsible>
                );
              }

              return (
                <Button
                  key={item.href}
                  variant="ghost"
                  className={cn(
                    "w-full justify-start text-muted-foreground hover:text-foreground hover:bg-accent",
                    isActive(item.href) && "bg-accent text-foreground"
                  )}
                  asChild
                >
                  <Link to={item.href}>
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.title}
                  </Link>
                </Button>
              );
            })}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
