import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PermissionNode {
  id: string;
  name: string;
  code: string;
  type: 'menu' | 'page' | 'button';
  path?: string;
  icon?: string;
  children?: PermissionNode[];
  description?: string;
  parent_id?: string;
  module?: string;
  sort_order?: number;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

interface FunctionPermissionTreeProps {
  permissions: PermissionNode[];
  selectedPermissions: string[];
  onPermissionsChange: (permissions: string[]) => void;
  disabled?: boolean;
}

export function FunctionPermissionTree({ 
  permissions,
  selectedPermissions, 
  onPermissionsChange, 
  disabled = false 
}: FunctionPermissionTreeProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // 切换节点展开状态
  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  // 处理权限选择变化
  const handlePermissionChange = (permissionCode: string, checked: boolean) => {
    let newPermissions: string[];
    
    if (checked) {
      // 添加权限
      newPermissions = [...selectedPermissions, permissionCode];
      
      // 如果是菜单或页面权限，自动添加其子权限
      const permission = findPermissionByCode(permissionCode);
      if (permission && permission.children) {
        const childCodes = getAllChildCodes(permission);
        newPermissions = [...new Set([...newPermissions, ...childCodes])];
      }
      
      // 如果是按钮权限，自动添加其上级页面和菜单权限
      if (permission && permission.type === 'button') {
        const parentCodes = getAllParentCodes(permissionCode);
        newPermissions = [...new Set([...newPermissions, ...parentCodes])];
      }
    } else {
      // 移除权限
      newPermissions = selectedPermissions.filter(p => p !== permissionCode);
      
      // 如果是菜单或页面权限，自动移除其子权限
      const permission = findPermissionByCode(permissionCode);
      if (permission && permission.children) {
        const childCodes = getAllChildCodes(permission);
        newPermissions = newPermissions.filter(p => !childCodes.includes(p));
      }
      
      // 如果是按钮权限，检查是否还有其他按钮被选中，如果没有则移除上级权限
      if (permission && permission.type === 'button') {
        const parentCodes = getAllParentCodes(permissionCode);
        // 检查每个上级权限是否还有其他子权限被选中
        parentCodes.forEach(parentCode => {
          const parentPermission = findPermissionByCode(parentCode);
          if (parentPermission && parentPermission.children) {
            const remainingChildren = parentPermission.children
              .filter(child => child.code !== permissionCode)
              .map(child => child.code);
            const hasOtherSelectedChildren = remainingChildren.some(childCode => 
              newPermissions.includes(childCode)
            );
            if (!hasOtherSelectedChildren) {
              newPermissions = newPermissions.filter(p => p !== parentCode);
            }
          }
        });
      }
    }
    
    // 确保没有重复的权限代码
    newPermissions = [...new Set(newPermissions)];
    
    onPermissionsChange(newPermissions);
  };

  // 根据权限代码查找权限节点
  const findPermissionByCode = (code: string): PermissionNode | null => {
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
    
    return findNode(permissions);
  };

  // 获取所有子权限代码
  const getAllChildCodes = (permission: PermissionNode): string[] => {
    const codes: string[] = [];
    
    function extractCodes(node: PermissionNode) {
      if (node.children) {
        node.children.forEach(child => {
          codes.push(child.code);
          extractCodes(child);
        });
      }
    }
    
    extractCodes(permission);
    return codes;
  };

  // 获取所有父权限代码
  const getAllParentCodes = (permissionCode: string): string[] => {
    const parentCodes: string[] = [];
    let currentPermission: PermissionNode | null = findPermissionByCode(permissionCode);

    while (currentPermission && currentPermission.parent_id) {
      // 通过parent_id查找父权限
      const parentPermission = findPermissionById(currentPermission.parent_id);
      if (parentPermission) {
        parentCodes.push(parentPermission.code);
        currentPermission = parentPermission;
      } else {
        break;
      }
    }
    return parentCodes.reverse(); // 父权限按层级从高到低排列
  };

  // 根据ID查找权限
  const findPermissionById = (id: string): PermissionNode | null => {
    function findNode(nodes: PermissionNode[]): PermissionNode | null {
      for (const node of nodes) {
        if (node.id === id) {
          return node;
        }
        if (node.children) {
          const found = findNode(node.children);
          if (found) return found;
        }
      }
      return null;
    }
    
    return findNode(permissions);
  };

  // 检查权限是否被选中
  const isPermissionSelected = (permissionCode: string): boolean => {
    const isSelected = selectedPermissions.includes(permissionCode);
    console.log(`检查权限 ${permissionCode} 是否被选中:`, isSelected, 'selectedPermissions:', selectedPermissions);
    return isSelected;
  };

  // 检查权限是否部分选中（有子权限被选中但不是全部）
  const isPermissionPartiallySelected = (permission: PermissionNode): boolean => {
    if (!permission.children || permission.children.length === 0) {
      return false;
    }
    
    const childCodes = getAllChildCodes(permission);
    const selectedChildCount = childCodes.filter(code => 
      selectedPermissions.includes(code)
    ).length;
    
    return selectedChildCount > 0 && selectedChildCount < childCodes.length;
  };

  // 渲染权限节点
  const renderPermissionNode = (permission: PermissionNode, level: number = 0) => {
    const isExpanded = expandedNodes.has(permission.id);
    const hasChildren = permission.children && permission.children.length > 0;
    const isSelected = isPermissionSelected(permission.code);
    const isPartiallySelected = isPermissionPartiallySelected(permission);

    return (
      <div key={permission.id} className="space-y-2">
        {/* 权限行 */}
        <div 
          className={cn(
            "flex items-center space-x-3 p-3 rounded-lg border transition-colors",
            level === 0 && "bg-primary/5 border-primary/20",
            level === 1 && "bg-secondary/5 border-secondary/20 ml-6",
            level === 2 && "bg-muted/30 border-border ml-12",
            "hover:bg-accent/50"
          )}
        >
          {/* 展开/折叠按钮 */}
          <div className="w-6 flex justify-center">
            {hasChildren ? (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => toggleNode(permission.id)}
                disabled={disabled}
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            ) : (
              <div className="w-6 h-6" />
            )}
          </div>
          
          {/* 权限选择框 */}
          <Checkbox
            checked={isSelected}
            ref={(el) => {
              if (el && 'indeterminate' in el) {
                (el as any).indeterminate = isPartiallySelected;
              }
            }}
            onCheckedChange={(checked) => 
              handlePermissionChange(permission.code, checked as boolean)
            }
            disabled={disabled}
            className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
          />
          
          {/* 权限名称 - 点击文本也能勾选/取消勾选 */}
          <div 
            className="flex-1 cursor-pointer select-none"
            onClick={() => handlePermissionChange(permission.code, !isSelected)}
          >
            <span className={cn(
              "font-medium",
              level === 0 ? "text-primary text-lg" : level === 1 ? "text-foreground" : "text-muted-foreground"
            )}>
              {permission.name}
            </span>
          </div>
        </div>
        
        {/* 子权限 */}
        {hasChildren && isExpanded && (
          <div className="space-y-2">
            {/* 如果是页面权限，先显示按钮权限（横向） */}
            {permission.type === 'page' && (
              <div className="ml-12">
                <div className="flex flex-wrap gap-2 p-3 bg-muted/30 rounded-lg border">
                  {permission.children!.map(child => {
                    if (child.type === 'button') {
                      const isButtonSelected = isPermissionSelected(child.code);
                      return (
                        <div key={child.id} className="flex items-center space-x-2 p-2 rounded border bg-background hover:bg-accent/50">
                          <Checkbox
                            checked={isButtonSelected}
                            onCheckedChange={(checked) => 
                              handlePermissionChange(child.code, checked as boolean)
                            }
                            disabled={disabled}
                            className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                          />
                          <span 
                            className="text-sm text-muted-foreground cursor-pointer select-none"
                            onClick={() => handlePermissionChange(child.code, !isButtonSelected)}
                          >
                            {child.name}
                          </span>
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
              </div>
            )}
            
            {/* 递归渲染其他类型的子权限 */}
            {permission.children!.map(child => 
              child.type !== 'button' ? renderPermissionNode(child, level + 1) : null
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
          {permissions.map(permission => 
            renderPermissionNode(permission)
          )}
        </div>
        
        
      </CardContent>
    </Card>
  );
}
