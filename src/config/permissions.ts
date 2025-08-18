// 权限配置文件
// 定义系统中所有功能权限的层级结构和权限代码

export interface PermissionNode {
  id: string;
  name: string;
  code: string;
  type: 'menu' | 'page' | 'button';
  path?: string;
  icon?: string;
  children?: PermissionNode[];
  description?: string;
  parentCode?: string; // 添加父级权限代码
}

// 功能权限树形结构
export const FUNCTION_PERMISSIONS: PermissionNode[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    name: '组织管理',
    code: 'ORGANIZATION_MANAGEMENT',
    type: 'menu',
    icon: 'Settings',
    description: '组织架构和人员管理',
    children: [
      {
        id: '550e8400-e29b-41d4-a716-446655440002',
        name: '部门管理',
        code: 'DEPARTMENT_MANAGEMENT',
        type: 'page',
        path: '/departments',
        icon: 'Building2',
        description: '部门信息管理',
        children: [
          {
            id: '550e8400-e29b-41d4-a716-446655440003',
            name: '新增部门',
            code: 'DEPARTMENT_CREATE',
            type: 'button',
            description: '创建新部门'
          },
          {
            id: '550e8400-e29b-41d4-a716-446655440004',
            name: '编辑部门',
            code: 'DEPARTMENT_EDIT',
            type: 'button',
            description: '编辑部门信息'
          },
          {
            id: '550e8400-e29b-41d4-a716-446655440005',
            name: '删除部门',
            code: 'DEPARTMENT_DELETE',
            type: 'button',
            description: '删除部门'
          },
          {
            id: '550e8400-e29b-41d4-a716-446655440006',
            name: '移动部门',
            code: 'DEPARTMENT_MOVE',
            type: 'button',
            description: '调整部门层级'
          }
        ]
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440007',
        name: '项目管理',
        code: 'PROJECT_MANAGEMENT',
        type: 'page',
        path: '/teams',
        icon: 'Briefcase',
        description: '项目团队管理',
        children: [
          {
            id: '550e8400-e29b-41d4-a716-446655440008',
            name: '新增项目',
            code: 'PROJECT_CREATE',
            type: 'button',
            description: '创建新项目'
          },
          {
            id: '550e8400-e29b-41d4-a716-446655440009',
            name: '编辑项目',
            code: 'PROJECT_EDIT',
            type: 'button',
            description: '编辑项目信息'
          },
          {
            id: '550e8400-e29b-41d4-a716-44665544000a',
            name: '删除项目',
            code: 'PROJECT_DELETE',
            type: 'button',
            description: '删除项目'
          },
          {
            id: '550e8400-e29b-41d4-a716-44665544000b',
            name: '分配成员',
            code: 'PROJECT_ASSIGN_MEMBERS',
            type: 'button',
            description: '为项目分配成员'
          }
        ]
      },
      {
        id: '550e8400-e29b-41d4-a716-44665544000c',
        name: '权限管理',
        code: 'PERMISSION_MANAGEMENT',
        type: 'page',
        path: '/permissions',
        icon: 'Shield',
        description: '角色权限管理',
        children: [
          {
            id: '550e8400-e29b-41d4-a716-44665544000d',
            name: '新增角色',
            code: 'ROLE_CREATE',
            type: 'button',
            description: '创建新角色'
          },
          {
            id: '550e8400-e29b-41d4-a716-44665544000e',
            name: '编辑角色',
            code: 'ROLE_EDIT',
            type: 'button',
            description: '编辑角色信息'
          },
          {
            id: '550e8400-e29b-41d4-a716-44665544000f',
            name: '删除角色',
            code: 'ROLE_DELETE',
            type: 'button',
            description: '删除角色'
          },
          {
            id: '550e8400-e29b-41d4-a716-446655440010',
            name: '分配权限',
            code: 'ROLE_ASSIGN_PERMISSIONS',
            type: 'button',
            description: '为角色分配权限'
          },
          {
            id: '550e8400-e29b-41d4-a716-446655440011',
            name: '分配成员',
            code: 'ROLE_ASSIGN_MEMBERS',
            type: 'button',
            description: '为角色分配成员'
          }
        ]
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440012',
        name: '成员管理',
        code: 'MEMBER_MANAGEMENT',
        type: 'page',
        path: '/members',
        icon: 'UserCheck',
        description: '组织成员管理',
        children: [
          {
            id: '550e8400-e29b-41d4-a716-446655440013',
            name: '新增成员',
            code: 'MEMBER_CREATE',
            type: 'button',
            description: '添加新成员'
          },
          {
            id: '550e8400-e29b-41d4-a716-446655440014',
            name: '编辑成员',
            code: 'MEMBER_EDIT',
            type: 'button',
            description: '编辑成员信息'
          },
          {
            id: '550e8400-e29b-41d4-a716-446655440015',
            name: '删除成员',
            code: 'MEMBER_DELETE',
            type: 'button',
            description: '删除成员'
          },
          {
            id: '550e8400-e29b-41d4-a716-446655440016',
            name: '导出成员',
            code: 'MEMBER_EXPORT',
            type: 'button',
            description: '导出成员数据'
          },
          {
            id: '550e8400-e29b-41d4-a716-446655440017',
            name: '导入成员',
            code: 'MEMBER_IMPORT',
            type: 'button',
            description: '批量导入成员'
          }
        ]
      }
    ]
  },
  // 任务管理
  {
    id: '550e8400-e29b-41d4-a716-446655440018',
    name: '任务管理',
    code: 'TASK_MANAGEMENT',
    type: 'page',
    path: '/tasks',
    icon: 'CheckSquare',
    description: '任务创建和管理',
    children: [
      {
        id: '550e8400-e29b-41d4-a716-446655440019',
        name: '新增任务',
        code: 'TASK_CREATE',
        type: 'button',
        description: '创建新任务'
      },
      {
        id: '550e8400-e29b-41d4-a716-44665544001a',
        name: '编辑任务',
        code: 'TASK_EDIT',
        type: 'button',
        description: '编辑任务信息'
      },
      {
        id: '550e8400-e29b-41d4-a716-44665544001b',
        name: '删除任务',
        code: 'TASK_DELETE',
        type: 'button',
        description: '删除任务'
      },
      {
        id: '550e8400-e29b-41d4-a716-44665544001c',
        name: '转派任务',
        code: 'TASK_TRANSFER',
        type: 'button',
        description: '转派任务给其他人员'
      },
      {
        id: '550e8400-e29b-41d4-a716-44665544001d',
        name: '接收任务',
        code: 'TASK_RECEIVE',
        type: 'button',
        description: '接收分配的任务'
      },
      {
        id: '550e8400-e29b-41d4-a716-44665544001e',
        name: '更新进度',
        code: 'TASK_PROGRESS',
        type: 'button',
        description: '更新任务进度'
      },
      {
        id: '550e8400-e29b-41d4-a716-44665544001f',
        name: '完成任务',
        code: 'TASK_COMPLETE',
        type: 'button',
        description: '标记任务为完成'
      }
    ]
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440020',
    name: '目标管理',
    code: 'GOAL_MANAGEMENT',
    type: 'menu',
    icon: 'Target',
    description: '各类目标管理',
    children: [
      {
        id: '550e8400-e29b-41d4-a716-446655440021',
        name: '公司年度目标',
        code: 'COMPANY_YEARLY_GOAL',
        type: 'page',
        path: '/goals/dashboard',
        icon: 'BarChart3',
        description: '公司年度目标管理',
        children: [
          {
            id: '550e8400-e29b-41d4-a716-446655440022',
            name: '新增年度目标',
            code: 'COMPANY_GOAL_CREATE',
            type: 'button',
            description: '创建公司年度目标'
          },
          {
            id: '550e8400-e29b-41d4-a716-446655440023',
            name: '编辑年度目标',
            code: 'COMPANY_GOAL_EDIT',
            type: 'button',
            description: '编辑公司年度目标'
          },
          {
            id: '550e8400-e29b-41d4-a716-446655440024',
            name: '删除年度目标',
            code: 'COMPANY_GOAL_DELETE',
            type: 'button',
            description: '删除公司年度目标'
          },
          {
            id: '550e8400-e29b-41d4-a716-446655440025',
            name: '导出年度目标',
            code: 'COMPANY_GOAL_EXPORT',
            type: 'button',
            description: '导出年度目标数据'
          }
        ]
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440026',
        name: '部门月度目标',
        code: 'TEAM_MONTHLY_GOAL',
        type: 'page',
        path: '/goals/team',
        icon: 'Users',
        description: '部门月度目标管理',
        children: [
          {
            id: '550e8400-e29b-41d4-a716-446655440027',
            name: '新增部门目标',
            code: 'TEAM_GOAL_CREATE',
            type: 'button',
            description: '创建部门月度目标'
          },
          {
            id: '550e8400-e29b-41d4-a716-446655440028',
            name: '编辑部门目标',
            code: 'TEAM_GOAL_EDIT',
            type: 'button',
            description: '编辑部门月度目标'
          },
          {
            id: '550e8400-e29b-41d4-a716-446655440029',
            name: '删除部门目标',
            code: 'TEAM_GOAL_DELETE',
            type: 'button',
            description: '删除部门月度目标'
          },
          {
            id: '550e8400-e29b-41d4-a716-44665544002a',
            name: '导出部门目标',
            code: 'TEAM_GOAL_EXPORT',
            type: 'button',
            description: '导出部门目标数据'
          }
        ]
      },
      {
        id: '550e8400-e29b-41d4-a716-44665544002b',
        name: '个人月度目标',
        code: 'PERSONAL_MONTHLY_GOAL',
        type: 'page',
        path: '/goals/personal',
        icon: 'User',
        description: '个人月度目标管理',
        children: [
          {
            id: '550e8400-e29b-41d4-a716-44665544002c',
            name: '新增个人目标',
            code: 'PERSONAL_GOAL_CREATE',
            type: 'button',
            description: '创建个人月度目标'
          },
          {
            id: '550e8400-e29b-41d4-a716-44665544002d',
            name: '编辑个人目标',
            code: 'PERSONAL_GOAL_EDIT',
            type: 'button',
            description: '编辑个人月度目标'
          },
          {
            id: '550e8400-e29b-41d4-a716-44665544002e',
            name: '删除个人目标',
            code: 'PERSONAL_GOAL_DELETE',
            type: 'button',
            description: '删除个人月度目标'
          },
          {
            id: '550e8400-e29b-41d4-a716-44665544002f',
            name: '导出个人目标',
            code: 'PERSONAL_GOAL_EXPORT',
            type: 'button',
            description: '导出个人目标数据'
          }
        ]
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440030',
        name: '单位管理',
        code: 'UNIT_MANAGEMENT',
        type: 'page',
        path: '/goals/units',
        icon: 'Tag',
        description: '目标单位管理',
        children: [
          {
            id: '550e8400-e29b-41d4-a716-446655440031',
            name: '新增单位',
            code: 'UNIT_CREATE',
            type: 'button',
            description: '创建新单位'
          },
          {
            id: '550e8400-e29b-41d4-a716-446655440032',
            name: '编辑单位',
            code: 'UNIT_EDIT',
            type: 'button',
            description: '编辑单位信息'
          },
          {
            id: '550e8400-e29b-41d4-a716-446655440033',
            name: '删除单位',
            code: 'UNIT_DELETE',
            type: 'button',
            description: '删除单位'
          }
        ]
      }
    ]
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440034',
    name: '审批管理',
    code: 'APPROVAL_MANAGEMENT',
    type: 'menu',
    icon: 'GitBranch',
    description: '工作流和审批管理',
    children: [
      {
        id: '550e8400-e29b-41d4-a716-446655440035',
        name: '流程配置',
        code: 'WORKFLOW_CONFIG',
        type: 'page',
        path: '/approval/workflow',
        icon: 'Settings',
        description: '工作流配置管理',
        children: [
          {
            id: '550e8400-e29b-41d4-a716-446655440036',
            name: '新增流程',
            code: 'WORKFLOW_CREATE',
            type: 'button',
            description: '创建新工作流'
          },
          {
            id: '550e8400-e29b-41d4-a716-446655440037',
            name: '编辑流程',
            code: 'WORKFLOW_EDIT',
            type: 'button',
            description: '编辑工作流配置'
          },
          {
            id: '550e8400-e29b-41d4-a716-446655440038',
            name: '删除流程',
            code: 'WORKFLOW_DELETE',
            type: 'button',
            description: '删除工作流'
          },
          {
            id: '550e8400-e29b-41d4-a716-446655440039',
            name: '启用流程',
            code: 'WORKFLOW_ENABLE',
            type: 'button',
            description: '启用工作流'
          },
          {
            id: '550e8400-e29b-41d4-a716-44665544003a',
            name: '停用流程',
            code: 'WORKFLOW_DISABLE',
            type: 'button',
            description: '停用工作流'
          }
        ]
      },
      {
        id: '550e8400-e29b-41d4-a716-44665544003b',
        name: '待办列表',
        code: 'PENDING_LIST',
        type: 'page',
        path: '/approval/pending',
        icon: 'Clock',
        description: '待办审批事项',
        children: [
          {
            id: '550e8400-e29b-41d4-a716-44665544003c',
            name: '审批通过',
            code: 'APPROVAL_APPROVE',
            type: 'button',
            description: '审批通过'
          },
          {
            id: '550e8400-e29b-41d4-a716-44665544003d',
            name: '审批拒绝',
            code: 'APPROVAL_REJECT',
            type: 'button',
            description: '审批拒绝'
          },
          {
            id: '550e8400-e29b-41d4-a716-44665544003e',
            name: '转交审批',
            code: 'APPROVAL_TRANSFER',
            type: 'button',
            description: '转交其他审批人'
          },
          {
            id: '550e8400-e29b-41d4-a716-44665544003f',
            name: '查看详情',
            code: 'APPROVAL_VIEW_DETAIL',
            type: 'button',
            description: '查看审批详情'
          }
        ]
      }
    ]
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440040',
    name: '财务管理',
    code: 'FINANCE_MANAGEMENT',
    type: 'menu',
    icon: 'DollarSign',
    description: '财务相关管理',
    children: [
      {
        id: '550e8400-e29b-41d4-a716-446655440041',
        name: '事项管理',
        code: 'MATTER_MANAGEMENT',
        type: 'page',
        path: '/finance/matters',
        icon: 'FileText',
        description: '财务事项管理',
        children: [
          {
            id: '550e8400-e29b-41d4-a716-446655440042',
            name: '新增事项',
            code: 'MATTER_CREATE',
            type: 'button',
            description: '创建新财务事项'
          },
          {
            id: '550e8400-e29b-41d4-a716-446655440043',
            name: '编辑事项',
            code: 'MATTER_EDIT',
            type: 'button',
            description: '编辑财务事项'
          },
          {
            id: '550e8400-e29b-41d4-a716-446655440044',
            name: '删除事项',
            code: 'MATTER_DELETE',
            type: 'button',
            description: '删除财务事项'
          },
          {
            id: '550e8400-e29b-41d4-a716-446655440045',
            name: '导出事项',
            code: 'MATTER_EXPORT',
            type: 'button',
            description: '导出财务事项数据'
          }
        ]
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440046',
        name: '付款/借款管理',
        code: 'PAYMENT_MANAGEMENT',
        type: 'page',
        path: '/finance/payments',
        icon: 'CreditCard',
        description: '付款和借款管理',
        children: [
          {
            id: '550e8400-e29b-41d4-a716-446655440047',
            name: '新增付款',
            code: 'PAYMENT_CREATE',
            type: 'button',
            description: '创建新付款申请'
          },
          {
            id: '550e8400-e29b-41d4-a716-446655440048',
            name: '新增借款',
            code: 'LOAN_CREATE',
            type: 'button',
            description: '创建新借款申请'
          },
          {
            id: '550e8400-e29b-41d4-a716-446655440049',
            name: '编辑申请',
            code: 'PAYMENT_EDIT',
            type: 'button',
            description: '编辑付款/借款申请'
          },
          {
            id: '550e8400-e29b-41d4-a716-44665544004a',
            name: '删除申请',
            code: 'PAYMENT_DELETE',
            type: 'button',
            description: '删除付款/借款申请'
          },
          {
            id: '550e8400-e29b-41d4-a716-44665544004b',
            name: '导出数据',
            code: 'PAYMENT_EXPORT',
            type: 'button',
            description: '导出付款/借款数据'
          }
        ]
      },
      {
        id: '550e8400-e29b-41d4-a716-44665544004c',
        name: '费用报销/冲销管理',
        code: 'EXPENSE_REIMBURSEMENT',
        type: 'page',
        path: '/finance/expense-reimbursement',
        icon: 'Receipt',
        description: '费用报销和冲销管理',
        children: [
          {
            id: '550e8400-e29b-41d4-a716-44665544004d',
            name: '新增报销',
            code: 'EXPENSE_CREATE',
            type: 'button',
            description: '创建新费用报销'
          },
          {
            id: '550e8400-e29b-41d4-a716-44665544004e',
            name: '新增冲销',
            code: 'EXPENSE_OFFSET_CREATE',
            type: 'button',
            description: '创建新费用冲销'
          },
          {
            id: '550e8400-e29b-41d4-a716-44665544004f',
            name: '编辑申请',
            code: 'EXPENSE_EDIT',
            type: 'button',
            description: '编辑费用申请'
          },
          {
            id: '550e8400-e29b-41d4-a716-446655440050',
            name: '删除申请',
            code: 'EXPENSE_DELETE',
            type: 'button',
            description: '删除费用申请'
          },
          {
            id: '550e8400-e29b-41d4-a716-446655440051',
            name: '导出数据',
            code: 'EXPENSE_EXPORT',
            type: 'button',
            description: '导出费用数据'
          }
        ]
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440052',
        name: '差旅费报销管理',
        code: 'BUSINESS_TRIP_REIMBURSEMENT',
        type: 'page',
        path: '/finance/business-trip-reimbursement',
        icon: 'Plane',
        description: '差旅费报销管理',
        children: [
          {
            id: '550e8400-e29b-41d4-a716-446655440053',
            name: '新增差旅报销',
            code: 'TRIP_EXPENSE_CREATE',
            type: 'button',
            description: '创建新差旅费报销'
          },
          {
            id: '550e8400-e29b-41d4-a716-446655440054',
            name: '编辑报销',
            code: 'TRIP_EXPENSE_EDIT',
            type: 'button',
            description: '编辑差旅费报销'
          },
          {
            id: '550e8400-e29b-41d4-a716-446655440055',
            name: '删除报销',
            code: 'TRIP_EXPENSE_DELETE',
            type: 'button',
            description: '删除差旅费报销'
          },
          {
            id: '550e8400-e29b-41d4-a716-446655440056',
            name: '导出数据',
            code: 'TRIP_EXPENSE_EXPORT',
            type: 'button',
            description: '导出差旅费数据'
          }
        ]
      }
    ]
  }
];

// 权限类型枚举
export enum PermissionType {
  MENU = 'menu',
  PAGE = 'page',
  BUTTON = 'button'
}

// 权限级别枚举
export enum PermissionLevel {
  MENU = 'menu',
  PAGE = 'page',
  BUTTON = 'button'
}

// 获取所有权限代码的扁平数组
export function getAllPermissionCodes(): string[] {
  const codes: string[] = [];
  
  function extractCodes(nodes: PermissionNode[]) {
    nodes.forEach(node => {
      codes.push(node.code);
      if (node.children) {
        extractCodes(node.children);
      }
    });
  }
  
  extractCodes(FUNCTION_PERMISSIONS);
  return codes;
}

// 根据权限代码获取权限节点
export function getPermissionByCode(code: string): PermissionNode | null {
  function findNode(nodes: PermissionNode[]): PermissionNode | null {
    for (const node of nodes) {
      if (node.code === code) {
        return node;
      }
      if (node.children) {
        const found = findNode(node.children);
        if (found) return found;
      }
    }
    return null;
  }
  
  return findNode(FUNCTION_PERMISSIONS);
}

// 获取指定类型的所有权限
export function getPermissionsByType(type: PermissionType): PermissionNode[] {
  const result: PermissionNode[] = [];
  
  function findByType(nodes: PermissionNode[]) {
    nodes.forEach(node => {
      if (node.type === type) {
        result.push(node);
      }
      if (node.children) {
        findByType(node.children);
      }
    });
  }
  
  findByType(FUNCTION_PERMISSIONS);
  return result;
}

// 检查权限是否包含子权限
export function hasChildren(permission: PermissionNode): boolean {
  return !!(permission.children && permission.children.length > 0);
}

// 获取权限的完整路径（从根到当前节点）
export function getPermissionPath(permission: PermissionNode): string[] {
  const path: string[] = [permission.name];
  
  function findPath(nodes: PermissionNode[], targetCode: string, currentPath: string[]): boolean {
    for (const node of nodes) {
      if (node.code === targetCode) {
        return true;
      }
      if (node.children) {
        currentPath.push(node.name);
        if (findPath(node.children, targetCode, currentPath)) {
          return true;
        }
        currentPath.pop();
      }
    }
    return false;
  }
  
  // 这里需要从根节点开始查找，暂时返回当前节点名称
  return path;
}

// 构建完整的权限树，包含父级引用
export function buildCompletePermissionTree(): PermissionNode[] {
  const buildTreeWithParent = (nodes: PermissionNode[], parentCode?: string): PermissionNode[] => {
    return nodes.map(node => ({
      ...node,
      parentCode,
      children: node.children ? buildTreeWithParent(node.children, node.code) : undefined
    }));
  };
  
  return buildTreeWithParent(FUNCTION_PERMISSIONS);
}

// 导出完整的权限树
export const COMPLETE_FUNCTION_PERMISSIONS = buildCompletePermissionTree();
