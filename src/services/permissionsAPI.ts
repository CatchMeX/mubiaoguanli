import { supabase } from '@/lib/supabase';

interface Permission {
  id: string;
  name: string;
  code: string;
  type: 'menu' | 'page' | 'button';
  parent_id?: string;
  path?: string;
  icon?: string;
  sort_order?: number;
  status?: string;
  description?: string;
  module?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PermissionTree extends Permission {
  children?: PermissionTree[];
}

export const permissionsAPI = {
  // 获取所有权限
  async getAll(): Promise<Permission[]> {
    const { data, error } = await supabase
      .from('permissions')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      throw new Error(`获取权限失败: ${error.message}`);
    }

    return data || [];
  },

  // 获取权限树形结构
  async getTree(): Promise<PermissionTree[]> {
    const { data, error } = await supabase
      .from('permissions')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      throw new Error(`获取权限树失败: ${error.message}`);
    }

    if (!data) return [];

    // 构建树形结构
    const permissionMap = new Map<string, PermissionTree>();
    const tree: PermissionTree[] = [];

    // 第一步：创建权限映射表
    data.forEach(perm => {
      permissionMap.set(perm.id, { ...perm, children: [] });
    });

    // 第二步：构建树形结构
    data.forEach(perm => {
      const permNode = permissionMap.get(perm.id);
      if (perm.parent_id && permissionMap.has(perm.parent_id)) {
        // 有父级，添加到父级的children中
        const parent = permissionMap.get(perm.parent_id);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(permNode!);
        }
      } else {
        // 没有父级，是根节点
        tree.push(permNode!);
      }
    });

    // 第三步：按照Sidebar的菜单层级重新排序
    // 确保菜单->页面->按钮的层级关系
    const moduleOrder = {
      'organization': 1,
      'goals': 2,
      'approval': 3,
      'finance': 4,
      'tasks': 5
    };
    
    const sortedTree = tree.sort((a, b) => {
      // 首先按模块排序
      const aOrder = moduleOrder[a.module as keyof typeof moduleOrder] || 999;
      const bOrder = moduleOrder[b.module as keyof typeof moduleOrder] || 999;
      
      if (aOrder !== bOrder) {
        return aOrder - bOrder;
      }
      
      // 然后按sort_order排序
      return (a.sort_order || 0) - (b.sort_order || 0);
    });

    // 第四步：对每个层级的children也进行排序
    const sortChildren = (nodes: PermissionTree[]) => {
      nodes.forEach(node => {
        if (node.children && node.children.length > 0) {
          // 对子节点按类型和sort_order排序
          node.children.sort((a, b) => {
            // 首先按类型排序：menu -> page -> button
            const typeOrder = { 'menu': 1, 'page': 2, 'button': 3 };
            const aTypeOrder = typeOrder[a.type] || 999;
            const bTypeOrder = typeOrder[b.type] || 999;
            
            if (aTypeOrder !== bTypeOrder) {
              return aTypeOrder - bTypeOrder;
            }
            
            // 然后按sort_order排序
            return (a.sort_order || 0) - (b.sort_order || 0);
          });
          
          // 递归排序子节点的children
          sortChildren(node.children);
        }
      });
    };

    sortChildren(sortedTree);

    return sortedTree;
  },

  // 根据类型获取权限
  async getByType(type: 'menu' | 'page' | 'button'): Promise<Permission[]> {
    const { data, error } = await supabase
      .from('permissions')
      .select('*')
      .eq('type', type)
      .order('sort_order', { ascending: true });

    if (error) {
      throw new Error(`获取${type}权限失败: ${error.message}`);
    }

    return data || [];
  },

  // 根据模块获取权限
  async getByModule(module: string): Promise<Permission[]> {
    const { data, error } = await supabase
      .from('permissions')
      .select('*')
      .eq('module', module)
      .order('sort_order', { ascending: true });

    if (error) {
      throw new Error(`获取${module}模块权限失败: ${error.message}`);
    }

    return data || [];
  },

  // 创建权限
  async create(permission: Omit<Permission, 'id' | 'created_at' | 'updated_at'>): Promise<Permission> {
    const { data, error } = await supabase
      .from('permissions')
      .insert([permission])
      .select()
      .single();

    if (error) {
      throw new Error(`创建权限失败: ${error.message}`);
    }

    return data;
  },

  // 更新权限
  async update(id: string, updates: Partial<Permission>): Promise<Permission> {
    const { data, error } = await supabase
      .from('permissions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`更新权限失败: ${error.message}`);
    }

    return data;
  },

  // 删除权限
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('permissions')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`删除权限失败: ${error.message}`);
    }
  },

  // 根据代码获取权限
  async getByCode(code: string): Promise<Permission | null> {
    const { data, error } = await supabase
      .from('permissions')
      .select('*')
      .eq('code', code)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // 没有找到记录
      }
      throw new Error(`获取权限失败: ${error.message}`);
    }

    return data;
  },

  // 获取权限的子权限
  async getChildren(parentId: string): Promise<Permission[]> {
    const { data, error } = await supabase
      .from('permissions')
      .select('*')
      .eq('parent_id', parentId)
      .order('sort_order', { ascending: true });

    if (error) {
      throw new Error(`获取子权限失败: ${error.message}`);
    }

    return data || [];
  },

  // 获取权限的父权限链
  async getParentChain(id: string): Promise<Permission[]> {
    const chain: Permission[] = [];
    let currentId = id;

    while (currentId) {
      const { data, error } = await supabase
        .from('permissions')
        .select('*')
        .eq('id', currentId)
        .single();

      if (error) {
        throw new Error(`获取父权限失败: ${error.message}`);
      }

      if (data) {
        chain.unshift(data);
        currentId = data.parent_id || '';
      } else {
        break;
      }
    }

    return chain;
  }
};
