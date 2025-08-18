import { supabase } from '@/lib/supabase';

// 设置默认schema
const supabaseWithSchema = supabase.schema('schema_11');

export interface PositionName {
  id: string;
  name: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface JobLevelName {
  id: string;
  name: string;
  sort_order: number;
  is_active: boolean;
  base_salary?: number;
  performance_salary?: number;
  created_at: string;
  updated_at: string;
}

// 职位名称API
export const positionNamesAPI = {
  // 获取所有活跃的职位名称
  async getActive(): Promise<PositionName[]> {
    const { data, error } = await supabaseWithSchema
      .from('position_names')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // 获取所有职位名称（包括非活跃的）
  async getAll(): Promise<PositionName[]> {
    const { data, error } = await supabaseWithSchema
      .from('position_names')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // 创建职位名称
  async create(name: string): Promise<PositionName> {
    const { data, error } = await supabaseWithSchema
      .from('position_names')
      .insert({
        name,
        sort_order: 0, // 将在数据库函数中自动计算
        is_active: true
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // 更新职位名称
  async update(id: string, updates: Partial<PositionName>): Promise<PositionName> {
    const { data, error } = await supabaseWithSchema
      .from('position_names')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // 删除职位名称（软删除）
  async delete(id: string): Promise<void> {
    const { error } = await supabaseWithSchema
      .from('position_names')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;
  },

  // 使用数据库函数添加职位名称
  async addPositionName(name: string): Promise<string> {
    const { data, error } = await supabaseWithSchema.rpc('add_position_name', {
      position_name: name
    });

    if (error) throw error;
    return data;
  },

  // 使用数据库函数删除职位名称
  async deletePositionName(id: string): Promise<boolean> {
    const { data, error } = await supabaseWithSchema.rpc('delete_position_name', {
      position_id: id
    });

    if (error) throw error;
    return data;
  }
};

// 职级名称API
export const jobLevelNamesAPI = {
  // 获取所有活跃的职级名称
  async getActive(): Promise<JobLevelName[]> {
    const { data, error } = await supabaseWithSchema
      .from('job_level_names')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // 获取所有职级名称（包括非活跃的）
  async getAll(): Promise<JobLevelName[]> {
    const { data, error } = await supabaseWithSchema
      .from('job_level_names')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // 根据ID获取职级名称
  async getJobLevelById(id: string): Promise<JobLevelName | null> {
    const { data, error } = await supabaseWithSchema
      .from('job_level_names')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // 创建职级名称
  async create(name: string, baseSalary?: number, performanceSalary?: number): Promise<JobLevelName> {
    const { data, error } = await supabaseWithSchema
      .from('job_level_names')
      .insert({
        name,
        sort_order: 0, // 将在数据库函数中自动计算
        is_active: true,
        base_salary: baseSalary || 0,
        performance_salary: performanceSalary || 0
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // 更新职级名称
  async update(id: string, updates: Partial<JobLevelName>): Promise<JobLevelName> {
    const { data, error } = await supabaseWithSchema
      .from('job_level_names')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // 删除职级名称（软删除）
  async delete(id: string): Promise<void> {
    const { error } = await supabaseWithSchema
      .from('job_level_names')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;
  },

  // 使用数据库函数添加职级名称
  async addJobLevelName(name: string): Promise<string> {
    const { data, error } = await supabaseWithSchema.rpc('add_job_level_name', {
      level_name: name
    });

    if (error) throw error;
    return data;
  },

  // 使用数据库函数删除职级名称
  async deleteJobLevelName(id: string): Promise<boolean> {
    const { data, error } = await supabaseWithSchema.rpc('delete_job_level_name', {
      level_id: id
    });

    if (error) throw error;
    return data;
  }
};

// 用户相关API扩展
export const userSettingsAPI = {
  // 获取用户完整信息（包括职位和职级）
  async getUsersWithPositionAndLevel() {
    const { data, error } = await supabaseWithSchema
      .from('users_with_position_and_level')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // 更新用户职位
  async updateUserPosition(userId: string, positionId: string | null): Promise<void> {
    const { error } = await supabaseWithSchema
      .from('users')
      .update({ position_id: positionId })
      .eq('id', userId);

    if (error) throw error;
  },

  // 更新用户职级
  async updateUserJobLevel(userId: string, jobLevelId: string | null): Promise<void> {
    const { error } = await supabaseWithSchema
      .from('users')
      .update({ job_level_id: jobLevelId })
      .eq('id', userId);

    if (error) throw error;
  }
}; 