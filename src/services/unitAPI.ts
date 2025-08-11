import { supabase } from '@/lib/supabase';

export interface Unit {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface CreateUnitData {
  name: string;
  description?: string;
}

export interface UpdateUnitData {
  name: string;
  description?: string;
}

const unitAPI = {
  // 获取所有活跃单位
  async getAll(): Promise<Unit[]> {
    try {
      // 首先尝试从active_units视图获取
      const { data, error } = await supabase
        .from('active_units')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true });

      if (error) {
        console.warn('active_units视图不存在，使用units表作为备用方案:', error);
        
        // 备用方案：直接从units表获取活跃单位
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('units')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true })
          .order('name', { ascending: true });

        if (fallbackError) {
          console.error('获取单位列表失败:', fallbackError);
          throw new Error('获取单位列表失败');
        }

        return fallbackData || [];
      }

      return data || [];
    } catch (error) {
      console.error('获取单位列表失败:', error);
      throw new Error('获取单位列表失败');
    }
  },

  // 获取单个单位
  async getById(id: string): Promise<Unit | null> {
    const { data, error } = await supabase
      .from('units')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('获取单位详情失败:', error);
      throw new Error('获取单位详情失败');
    }

    return data;
  },

  // 创建单位
  async create(unitData: CreateUnitData): Promise<Unit> {
    const { data, error } = await supabase
      .from('units')
      .insert({
        name: unitData.name,
        description: unitData.description,
        sort_order: 0,
        is_active: true
      })
      .select()
      .single();

    if (error) {
      console.error('创建单位失败:', error);
      throw new Error('创建单位失败');
    }

    return data;
  },

  // 更新单位
  async update(id: string, unitData: UpdateUnitData): Promise<Unit> {
    const { data, error } = await supabase
      .from('units')
      .update({
        name: unitData.name,
        description: unitData.description,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('更新单位失败:', error);
      throw new Error('更新单位失败');
    }

    return data;
  },

  // 删除单位（软删除）
  async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('units')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      console.error('删除单位失败:', error);
      throw new Error('删除单位失败');
    }

    return true;
  },

  // 检查单位名称是否已存在
  async checkNameExists(name: string, excludeId?: string): Promise<boolean> {
    let query = supabase
      .from('units')  // 改为检查units表而不是active_units视图
      .select('id')
      .eq('name', name);

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('检查单位名称失败:', error);
      throw new Error('检查单位名称失败');
    }

    return (data?.length || 0) > 0;
  },

  // 激活已存在的软删除单位
  async activateExistingUnit(name: string): Promise<Unit | null> {
    const { data, error } = await supabase
      .from('units')
      .update({ is_active: true })
      .eq('name', name)
      .eq('is_active', false)
      .select()
      .single();

    if (error) {
      console.error('激活单位失败:', error);
      return null;
    }

    return data;
  }
};

export default unitAPI; 