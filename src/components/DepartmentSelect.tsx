import React, { useState, useEffect, useRef } from 'react';
import { Check, ChevronsUpDown, Folder, FolderOpen } from 'lucide-react';
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
import { Department } from '@/types';
import api from '@/services/api';

interface DepartmentSelectProps {
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

// 根据搜索词过滤部门
const filterDepartmentsBySearch = (departments: Department[], searchTerm: string): Department[] => {
  if (!searchTerm) return departments;
  
  const searchLower = searchTerm.toLowerCase();
  
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
  
  return departments.map(filterDepartment).filter(Boolean) as Department[];
};

// 递归渲染部门选项
const renderDepartmentOptions = (
  departments: Department[], 
  level = 0, 
  onSelect: (value: string) => void
) => {
  return departments.map(dept => {
    const hasChildren = dept.children && dept.children.length > 0;
    
    return (
      <React.Fragment key={dept.id}>
        <CommandItem
          value={dept.id}
          onSelect={() => onSelect(dept.id)}
          className="flex items-center space-x-2 cursor-pointer"
        >
          <div className="flex items-center space-x-2 flex-1">
            <div 
              className="flex items-center space-x-1"
              style={{ paddingLeft: `${level * 16}px` }}
            >
              {hasChildren ? (
                <FolderOpen className="h-4 w-4 text-blue-500 mr-2" />
              ) : (
                <Folder className="h-4 w-4 text-gray-500 mr-2" />
              )}
              <span className="text-sm font-normal">
                {dept.name}
              </span>
              {dept.code && (
                <span className="text-xs text-muted-foreground ml-1">
                  ({dept.code})
                </span>
              )}
            </div>
          </div>
          <Check className={cn(
            "ml-auto h-4 w-4",
            "opacity-0"
          )} />
        </CommandItem>
        {hasChildren && renderDepartmentOptions(
          dept.children || [], 
          level + 1, 
          onSelect
        )}
      </React.Fragment>
    );
  });
};

const DepartmentSelect: React.FC<DepartmentSelectProps> = ({
  value,
  onValueChange,
  placeholder = "选择部门",
  disabled = false,
  className
}) => {
  const [open, setOpen] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const commandListRef = useRef<HTMLDivElement>(null);

  // 加载部门数据
  useEffect(() => {
    const loadDepartments = async () => {
      try {
        setLoading(true);
        const data = await api.department.getHierarchy();
        setDepartments(data || []);
      } catch (error) {
        console.error('加载部门数据失败:', error);
        setDepartments([]);
      } finally {
        setLoading(false);
      }
    };

    loadDepartments();
  }, []);

  // 获取选中的部门名称
  const getSelectedDepartmentName = () => {
    if (!value) return '';
    
    const flatDepartments = flattenDepartments(departments);
    const selectedDept = flatDepartments.find(dept => dept.id === value);
    return selectedDept ? selectedDept.name : '';
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
      // 使用 requestAnimationFrame 来避免 passive 事件监听器的问题
      requestAnimationFrame(() => {
        if (commandListRef.current) {
          commandListRef.current.scrollTop += e.deltaY;
        }
      });
    }
  };

  // 构建部门树
  const departmentTree = buildDepartmentTree(departments);

  // 过滤部门数据
  const filteredDepartments = searchTerm 
    ? filterDepartmentsBySearch(departmentTree, searchTerm)
    : departmentTree;

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
          {value ? getSelectedDepartmentName() : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command shouldFilter={false} className="w-full">
          <CommandInput 
            placeholder="搜索部门..." 
            value={searchTerm}
            onValueChange={setSearchTerm}
            className="border-0 focus:ring-0"
          />
          <CommandList 
            ref={commandListRef}
            className="max-h-[300px] overflow-y-auto" 
            style={{ scrollbarWidth: 'thin', scrollbarColor: '#d1d5db #f3f4f6' }}
            onWheel={handleWheel}
          >
            <CommandEmpty>
              {loading ? "加载中..." : "未找到部门"}
            </CommandEmpty>
            <CommandGroup>
              {renderDepartmentOptions(filteredDepartments, 0, handleSelect)}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default DepartmentSelect; 