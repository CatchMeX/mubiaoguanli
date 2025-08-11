import { supabase } from '@/lib/supabase';

export interface KeyIndicator {
  id: string;
  company_yearly_goal_id: string;
  indicator_name: string;
  created_at: string;
  updated_at: string;
}

const supabaseWithSchema = supabase.schema('schema_11');

export const keyIndicatorAPI = {
  // 获取指定公司年度目标的所有关键指标
  async getByCompanyYearlyGoalId(companyYearlyGoalId: string): Promise<KeyIndicator[]> {
    const { data, error } = await supabaseWithSchema
      .from('key_indicators')
      .select('*')
      .eq('company_yearly_goal_id', companyYearlyGoalId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // 创建关键指标
  async create(companyYearlyGoalId: string, indicatorName: string): Promise<KeyIndicator> {
    const { data, error } = await supabaseWithSchema
      .from('key_indicators')
      .insert({
        company_yearly_goal_id: companyYearlyGoalId,
        indicator_name: indicatorName
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // 更新关键指标
  async update(id: string, updates: Partial<KeyIndicator>): Promise<KeyIndicator> {
    const { data, error } = await supabaseWithSchema
      .from('key_indicators')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // 删除关键指标
  async delete(id: string): Promise<void> {
    const { error } = await supabaseWithSchema
      .from('key_indicators')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // 批量删除指定公司年度目标的所有关键指标
  async deleteByCompanyYearlyGoalId(companyYearlyGoalId: string): Promise<void> {
    const { error } = await supabaseWithSchema
      .from('key_indicators')
      .delete()
      .eq('company_yearly_goal_id', companyYearlyGoalId);

    if (error) throw error;
  }
}; 