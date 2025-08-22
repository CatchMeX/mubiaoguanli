import { supabase } from '../lib/supabase';
import { executeQuery } from '../lib/supabase';
import { 
  FinancialMatter, 
  FinancialMatterAllocation, 
  FinancialMatterAttachment,
  CreateFinancialMatterData,
  UpdateFinancialMatterData,
  FinancialMatterAllocationFormData
} from '../types/financial';

class FinancialMatterAPI {
  // 获取财务事项列表
  async getFinancialMatters(filters?: {
    status?: string;
    department_id?: string;
    applicant_id?: string;
    is_corporate_dimension?: boolean;
    start_date?: string;
    end_date?: string;
  }): Promise<FinancialMatter[]> {
    let query = supabase.from('financial_matters')
      .select(`
        *,
        applicant:users!financial_matters_applicant_id_fkey (
          id,
          name,
          employee_id,
          email
        ),
        department:departments!financial_matters_department_id_fkey (
          id,
          name,
          code
        ),
        team:teams!financial_matters_team_id_fkey (
          id,
          name,
          code
        ),
        allocations:financial_matter_allocations!financial_matter_allocations_financial_matter_id_fkey (
          *,
          team:teams!financial_matter_allocations_team_id_fkey (
            id,
            name,
            code
          )
        ),
        attachments:financial_matter_attachments!financial_matter_attachments_financial_matter_id_fkey (
          *,
          uploaded_by_user:users!financial_matter_attachments_uploaded_by_fkey (
            id,
            name,
            employee_id
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.department_id) {
      query = query.eq('department_id', filters.department_id);
    }
    if (filters?.applicant_id) {
      query = query.eq('applicant_id', filters.applicant_id);
    }
    if (filters?.is_corporate_dimension !== undefined) {
      query = query.eq('is_corporate_dimension', filters.is_corporate_dimension);
    }
    if (filters?.start_date) {
      query = query.gte('created_at', filters.start_date);
    }
    if (filters?.end_date) {
      query = query.lte('created_at', filters.end_date);
    }

    return executeQuery(query);
  }

  // 获取单个财务事项详情
  async getFinancialMatterById(id: string): Promise<FinancialMatter | null> {
    const result = await executeQuery(
      supabase.from('financial_matters')
        .select(`
          *,
          applicant:users!financial_matters_applicant_id_fkey (
            id,
            name,
            employee_id,
            email
          ),
          department:departments!financial_matters_department_id_fkey (
            id,
            name,
            code
          ),
          team:teams!financial_matters_team_id_fkey (
            id,
            name,
            code
          ),
          approval_workflow:workflow_instances!financial_matters_approval_workflow_id_fkey (
            id,
            status,
            initiated_at
          ),
          allocations:financial_matter_allocations!financial_matter_allocations_financial_matter_id_fkey (
            *,
            team:teams!financial_matter_allocations_team_id_fkey (
              id,
              name,
              code
            )
          ),
          attachments:financial_matter_attachments!financial_matter_attachments_financial_matter_id_fkey (
            *,
            uploaded_by_user:users!financial_matter_attachments_uploaded_by_fkey (
              id,
              name,
              employee_id
            )
          )
        `)
        .eq('id', id)
        .single()
    );

    return result;
  }

  // 创建财务事项
  async createFinancialMatter(data: CreateFinancialMatterData): Promise<FinancialMatter> {
    return executeQuery(
      supabase.from('financial_matters').insert(data).select().single()
    );
  }

  // 更新财务事项
  async updateFinancialMatter(id: string, data: UpdateFinancialMatterData): Promise<FinancialMatter> {
    return executeQuery(
      supabase.from('financial_matters').update(data).eq('id', id).select().single()
    );
  }

  // 删除财务事项
  async deleteFinancialMatter(id: string): Promise<void> {
    // 删除相关的分摊记录
    await executeQuery(
      supabase.from('financial_matter_allocations').delete().eq('financial_matter_id', id)
    );

    // 删除相关的附件记录
    await executeQuery(
      supabase.from('financial_matter_attachments').delete().eq('financial_matter_id', id)
    );

    // 删除财务事项本身
    await executeQuery(
      supabase.from('financial_matters').delete().eq('id', id)
    );
  }

  // 创建分摊记录
  async createAllocation(financialMatterId: string, allocationData: FinancialMatterAllocationFormData): Promise<FinancialMatterAllocation> {
    return executeQuery(
      supabase.from('financial_matter_allocations').insert({
        financial_matter_id: financialMatterId,
        team_id: allocationData.team_id,
        allocation_ratio: allocationData.allocation_ratio,
        allocated_amount: allocationData.allocated_amount,
        remark: allocationData.remark
      }).select().single()
    );
  }

  // 批量创建分摊记录
  async createAllocations(financialMatterId: string, allocations: FinancialMatterAllocationFormData[]): Promise<FinancialMatterAllocation[]> {
    const allocationData = allocations.map(allocation => ({
      financial_matter_id: financialMatterId,
      team_id: allocation.team_id,
      allocation_ratio: allocation.allocation_ratio,
      allocated_amount: allocation.allocated_amount,
      remark: allocation.remark
    }));

    return executeQuery(
      supabase.from('financial_matter_allocations').insert(allocationData).select()
    );
  }

  // 删除分摊记录
  async deleteAllocation(id: string): Promise<void> {
    await executeQuery(
      supabase.from('financial_matter_allocations').delete().eq('id', id)
    );
  }

  // 获取分摊记录
  async getAllocations(financialMatterId: string): Promise<FinancialMatterAllocation[]> {
    return executeQuery(
      supabase.from('financial_matter_allocations')
        .select(`
          *,
          team:teams!financial_matter_allocations_team_id_fkey (
            id,
            name,
            code
          )
        `)
        .eq('financial_matter_id', financialMatterId)
        .order('created_at', { ascending: true })
    );
  }

  // 上传附件
  async uploadAttachment(
    financialMatterId: string, 
    file: File, 
    uploadedBy: string
  ): Promise<FinancialMatterAttachment> {
    // 生成安全的文件名（移除特殊字符）
    const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${Date.now()}_${safeFileName}`;
    const filePath = `financial-matters/${financialMatterId}/${fileName}`;

    console.log('📤 准备上传文件:', {
      originalName: file.name,
      safeFileName,
      filePath,
      fileSize: file.size,
      fileType: file.type
    });

    // 上传文件到Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('attachments')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('❌ 存储上传失败:', uploadError);
      throw new Error(`文件上传失败: ${uploadError.message}`);
    }

    console.log('✅ 存储上传成功:', uploadData);

    // 创建附件记录
    const attachment = await executeQuery(
      supabase.from('financial_matter_attachments').insert({
        financial_matter_id: financialMatterId,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        file_type: file.type,
        uploaded_by: uploadedBy
      }).select().single()
    );

    console.log('✅ 附件记录创建成功:', attachment);
    return attachment;
  }

  // 删除附件
  async deleteAttachment(id: string): Promise<void> {
    // 获取附件信息
    const attachment = await executeQuery(
      supabase.from('financial_matter_attachments').select('file_path').eq('id', id).single()
    );

    if (attachment) {
      // 从Storage中删除文件
      await supabase.storage
        .from('attachments')
        .remove([attachment.file_path]);
    }

    // 删除附件记录
    await executeQuery(
      supabase.from('financial_matter_attachments').delete().eq('id', id)
    );
  }

  // 获取附件列表
  async getAttachments(financialMatterId: string): Promise<FinancialMatterAttachment[]> {
    return executeQuery(
      supabase.from('financial_matter_attachments')
        .select('*')
        .eq('financial_matter_id', financialMatterId)
        .order('created_at', { ascending: true })
    );
  }

  // 获取附件下载URL
  async getAttachmentDownloadUrl(filePath: string): Promise<string> {
    const { data } = supabase.storage
      .from('attachments')
      .getPublicUrl(filePath);

    return data.publicUrl;
  }

  // 获取财务事项统计
  async getFinancialMatterStatistics(): Promise<{
    total_count: number;
    total_amount: number;
    by_status: { status: string; count: number; amount: number }[];
    by_department: { department_name: string; count: number; amount: number }[];
  }> {
    const matters = await this.getFinancialMatters();
    
    const total_count = matters.length;
    const total_amount = matters.reduce((sum, matter) => sum + matter.amount, 0);

    // 按状态统计
    const statusMap = new Map<string, { count: number; amount: number }>();
    matters.forEach(matter => {
      const current = statusMap.get(matter.status) || { count: 0, amount: 0 };
      statusMap.set(matter.status, {
        count: current.count + 1,
        amount: current.amount + matter.amount
      });
    });

    const by_status = Array.from(statusMap.entries()).map(([status, data]) => ({
      status,
      count: data.count,
      amount: data.amount
    }));

    // 按部门统计
    const departmentMap = new Map<string, { count: number; amount: number }>();
    matters.forEach(matter => {
      const departmentName = matter.department?.name || '未知部门';
      const current = departmentMap.get(departmentName) || { count: 0, amount: 0 };
      departmentMap.set(departmentName, {
        count: current.count + 1,
        amount: current.amount + matter.amount
      });
    });

    const by_department = Array.from(departmentMap.entries()).map(([department_name, data]) => ({
      department_name,
      count: data.count,
      amount: data.amount
    }));

    return {
      total_count,
      total_amount,
      by_status,
      by_department
    };
  }
}

export const financialMatterAPI = new FinancialMatterAPI(); 