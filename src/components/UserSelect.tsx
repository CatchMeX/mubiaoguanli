import React, { useState, useEffect, useRef } from 'react';
import { Check, ChevronsUpDown, Folder, FolderOpen, User, ChevronRight, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { User as UserType, Department } from '@/types';
import api from '@/services/api';
import supabase from '@/lib/supabase';

interface UserSelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

// 构建部门树形结构
const buildDepartmentTree = (departments: Department[], parentId: string | null = null): Department[] => {
  return departments
    .filter(dept => dept.parent_id === parentId)
    .map(dept => ({
      ...dept,
      children: buildDepartmentTree(departments, dept.id)
    }));
};

// 展平部门树为列表，用于搜索
const flattenDepartments = (departments: Department[], level = 0): (Department & { displayLevel: number })[] => {
  let result: (Department & { displayLevel: number })[] = [];
  
  departments.forEach(dept => {
    result.push({ ...dept, displayLevel: level });
    if (dept.children && dept.children.length > 0) {
      result = result.concat(flattenDepartments(dept.children, level + 1));
    }
  });
  
  return result;
};

// 根据搜索词过滤部门和用户
const filterDepartmentsAndUsers = (
  departments: Department[], 
  users: UserType[], 
  searchTerm: string
): { departments: Department[], users: UserType[] } => {
  if (!searchTerm) {
    return { departments, users };
  }
  
  const searchLower = searchTerm.toLowerCase();
  
  // 过滤用户
  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchLower) ||
    user.employee_id.toLowerCase().includes(searchLower)
  );
  
  // 过滤部门
  const filterDepartment = (dept: Department): Department | null => {
    const matchesSearch = dept.name.toLowerCase().includes(searchLower) ||
                         dept.code.toLowerCase().includes(searchLower);
    
    const hasChildren = dept.children && dept.children.length > 0;
    const filteredChildren = hasChildren 
      ? (dept.children || []).map(filterDepartment).filter(Boolean) as Department[]
      : [];
    
    const hasMatchingChildren = filteredChildren.length > 0;
    
    if (matchesSearch || hasMatchingChildren) {
      return {
        ...dept,
        children: hasMatchingChildren ? filteredChildren : []
      };
    }
    
    return null;
  };
  
  const filteredDepartments = departments.map(filterDepartment).filter(Boolean) as Department[];
  
  return { departments: filteredDepartments, users: filteredUsers };
};

// 递归渲染部门选项
const renderDepartmentOptions = (
  departments: Department[], 
  users: UserType[],
  level = 0, 
  onSelect: (value: string) => void,
  expandedDepts: Set<string>,
  onToggleDept: (deptId: string) => void
) => {
  return departments.map(dept => {
    const hasChildren = dept.children && dept.children.length > 0;
    const isExpanded = expandedDepts.has(dept.id);
    
    // 获取当前部门的用户
    const deptUsers = users.filter(user => {
      // 检查主要部门
      if (user.primaryDepartment && user.primaryDepartment.id === dept.id) {
        return true;
      }
      
      // 检查部门关联
      if (user.departments && Array.isArray(user.departments)) {
        return user.departments.some(d => d && d.id === dept.id);
      }
      
      return false;
    });

    
    
    return (
      <React.Fragment key={dept.id}>
        <CommandItem
          value={dept.id}
          onSelect={() => {}} // 部门不可选择，只显示
          className="flex items-center space-x-2 cursor-default opacity-60"
        >
          <div className="flex items-center space-x-2 flex-1">
            <div 
              className="flex items-center space-x-1"
              style={{ paddingLeft: `${level * 16}px` }}
            >
              <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onToggleDept(dept.id);
                  }}
                  className="flex items-center space-x-1 hover:bg-accent hover:text-accent-foreground p-1 rounded transition-colors"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-blue-500" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-blue-500" />
                  )}
                  <FolderOpen className="h-4 w-4 text-blue-500 ml-1" />
                </button>
              <span className="text-sm font-medium">
                {dept.name}
              </span>
              {dept.code && (
                <span className="text-xs text-muted-foreground ml-1">
                  ({dept.code})
                </span>
              )}
            </div>
          </div>
        </CommandItem>
        
        {/* 渲染部门下的用户 - 只在展开时显示 */}
        {isExpanded && deptUsers.length > 0 && (
          <>
            {deptUsers.map(user => (
              <CommandItem
                key={user.id}
                value={user.id}
                onSelect={() => onSelect(user.id)}
                className="flex items-center space-x-2 cursor-pointer"
              >
                <div className="flex items-center space-x-2 flex-1">
                  <div 
                    className="flex items-center space-x-1"
                    style={{ paddingLeft: `${(level + 1) * 16}px` }}
                  >
                    <User className="h-4 w-4 text-green-500 mr-2" />
                    <span className="text-sm font-normal">
                      {user.name}
                    </span>
                    <span className="text-xs text-muted-foreground ml-1">
                      ({user.employee_id})
                    </span>
                  </div>
                </div>
                <Check className={cn(
                  "ml-auto h-4 w-4",
                  "opacity-0"
                )} />
              </CommandItem>
            ))}
          </>
        )}
        

        
        {/* 递归渲染子部门 - 只在展开时显示 */}
        {hasChildren && isExpanded && renderDepartmentOptions(
          dept.children || [], 
          users,
          level + 1, 
          onSelect,
          expandedDepts,
          onToggleDept
        )}
      </React.Fragment>
    );
  });
};

const UserSelect: React.FC<UserSelectProps> = ({
  value,
  onValueChange,
  placeholder = "选择执行人",
  disabled = false,
  className
}) => {
  const [open, setOpen] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedDepts, setExpandedDepts] = useState<Set<string>>(new Set());
  const commandListRef = useRef<HTMLDivElement>(null);

  // 加载部门数据
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // 获取部门层级数据
        const departmentsData = await api.department.getHierarchy();
        setDepartments(departmentsData || []);
        
        // 获取所有用户
        const usersData = await api.user.getAll();
        
        // 获取用户部门关联数据
        const { data: userDeptsData, error } = await supabase
          .from('user_departments')
          .select(`
            user_id,
            department_id,
            is_primary,
            departments (*)
          `);
        
        if (error) {
          console.error('获取用户部门关联失败:', error);
          // 如果获取部门关联失败，直接使用用户数据
          setUsers(usersData);
        } else {
          // 为每个用户添加部门信息
          const usersWithDepartments = usersData.map(user => {
            const userDepts = userDeptsData.filter(ud => ud.user_id === user.id);
            const primaryDept = userDepts.find(ud => ud.is_primary)?.departments;
            const allDepts = userDepts.map(ud => ud.departments).filter(Boolean);
            

            
            return {
              ...user,
              primaryDepartment: primaryDept as Department | undefined,
              departments: allDepts as unknown as Department[]
            };
          });
          

          

          
          setUsers(usersWithDepartments);
        }
      } catch (error) {
        console.error('加载数据失败:', error);
        setDepartments([]);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // 默认展开所有部门，让用户可以看到所有成员
  useEffect(() => {
    if (departments.length > 0) {
      const expandAllDepartments = (depts: Department[], deptIds: Set<string>) => {
        depts.forEach(dept => {
          deptIds.add(dept.id);
          if (dept.children && dept.children.length > 0) {
            expandAllDepartments(dept.children, deptIds);
          }
        });
      };
      
      const allDeptIds = new Set<string>();
      expandAllDepartments(departments, allDeptIds);
      setExpandedDepts(allDeptIds);
      

    }
  }, [departments]);

  // 获取选中的用户名称
  const getSelectedUserName = () => {
    if (!value) return '';
    
    const selectedUser = users.find(user => user.id === value);
    return selectedUser ? `${selectedUser.name} (${selectedUser.employee_id})` : '';
  };

  // 处理选择
  const handleSelect = (selectedValue: string) => {
    onValueChange(selectedValue);
    setOpen(false);
    setSearchTerm('');
  };

  // 处理滚轮事件
  const handleWheel = (e: React.WheelEvent) => {
    if (commandListRef.current) {
      requestAnimationFrame(() => {
        if (commandListRef.current) {
          commandListRef.current.scrollTop += e.deltaY;
        }
      });
    }
  };

  // 处理部门展开/折叠
  const toggleDepartment = (deptId: string) => {
    setExpandedDepts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(deptId)) {
        newSet.delete(deptId);
      } else {
        newSet.add(deptId);
      }
      return newSet;
    });
  };

  // 全部展开/收缩
  const toggleAllDepartments = () => {
    if (expandedDepts.size === 0) {
      // 如果全部收缩，则全部展开
      const expandAllDepartments = (depts: Department[], deptIds: Set<string>) => {
        depts.forEach(dept => {
          deptIds.add(dept.id);
          if (dept.children && dept.children.length > 0) {
            expandAllDepartments(dept.children, deptIds);
          }
        });
      };
      
      const allDeptIds = new Set<string>();
      expandAllDepartments(departments, allDeptIds);
      setExpandedDepts(allDeptIds);
    } else {
      // 如果部分或全部展开，则全部收缩
      setExpandedDepts(new Set());
    }
  };

  // 构建部门树
  const departmentTree = buildDepartmentTree(departments);

  // 过滤数据
  const { departments: filteredDepartments, users: filteredUsers } = 
    filterDepartmentsAndUsers(departmentTree, users, searchTerm);



  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between bg-background border-border text-foreground",
            !value && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          {value ? getSelectedUserName() : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command shouldFilter={false} className="w-full">
          <div className="flex items-center border-b">
            <CommandInput 
              placeholder="搜索姓名、工号或部门..." 
              value={searchTerm}
              onValueChange={setSearchTerm}
              className="border-0 focus:ring-0 flex-1"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={toggleAllDepartments}
              className="h-8 px-2 text-xs"
            >
              {expandedDepts.size === 0 ? '全部展开' : '全部收缩'}
            </Button>
          </div>
          <CommandList 
            ref={commandListRef}
            className="max-h-[300px] overflow-y-auto" 
            style={{ scrollbarWidth: 'thin', scrollbarColor: '#d1d5db #f3f4f6' }}
            onWheel={handleWheel}
          >
            {searchTerm && (
              <div className="px-2 py-1.5 text-xs text-muted-foreground border-b">
                找到 {filteredUsers.length} 个用户
                {filteredDepartments.length > 0 && `，${filteredDepartments.length} 个部门`}
              </div>
            )}
            <CommandEmpty>
              {loading ? "加载中..." : (
                searchTerm ? (
                  filteredUsers.length === 0 ? "未找到匹配的用户" : "未找到匹配的部门"
                ) : "未找到用户"
              )}
            </CommandEmpty>
            <CommandGroup>
              {/* 当有搜索词时，直接显示过滤后的用户列表 */}
              {searchTerm ? (
                filteredUsers.map(user => (
                  <CommandItem
                    key={user.id}
                    value={user.id}
                    onSelect={() => handleSelect(user.id)}
                    className="flex items-center space-x-2 cursor-pointer"
                  >
                    <div className="flex items-center space-x-2 flex-1">
                      <User className="h-4 w-4 text-green-500 mr-2" />
                      <span className="text-sm font-normal">
                        {user.name}
                      </span>
                      <span className="text-xs text-muted-foreground ml-1">
                        ({user.employee_id})
                      </span>
                      {user.primaryDepartment && (
                        <span className="text-xs text-blue-500 ml-2">
                          {user.primaryDepartment.name}
                        </span>
                      )}
                    </div>
                    <Check className={cn(
                      "ml-auto h-4 w-4",
                      "opacity-0"
                    )} />
                  </CommandItem>
                ))
              ) : (
                /* 没有搜索词时，按部门分组显示 */
                renderDepartmentOptions(
                  filteredDepartments, 
                  filteredUsers, 
                  0, 
                  handleSelect,
                  expandedDepts,
                  toggleDepartment
                )
              )}
            </CommandGroup>
            

          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default UserSelect;
