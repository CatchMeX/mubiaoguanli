import { supabase, executeQuery } from '../lib/supabase';
import {
  PaymentRequest,
  PaymentRequestFormData,
  PaymentBankAccountFormData,
  CreatePaymentRequestData,
  UpdatePaymentRequestData,
  PaymentBankAccount,
  PaymentRequestAttachment,
  Company
} from '../types/payment';

export class PaymentAPI {
  // 获取付款/借款申请单列表
  async getPaymentRequests(filters?: {
    status?: string;
    department_id?: string;
    applicant_id?: string;
    document_type?: 'payment' | 'loan';
    start_date?: string;
    end_date?: string;
  }): Promise<PaymentRequest[]> {
    let query = supabase
      .from('payment_requests')
      .select(`
        *,
        applicant:users!payment_requests_applicant_id_fkey(id, name, employee_id),
        department:departments(id, name),
        team:teams(id, name),
        company:companies(id, name)
      `)
      .order('created_at', { ascending: false });

    // 应用筛选条件
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.department_id) {
      query = query.eq('department_id', filters.department_id);
    }
    if (filters?.applicant_id) {
      query = query.eq('applicant_id', filters.applicant_id);
    }
    if (filters?.document_type) {
      query = query.eq('document_type', filters.document_type);
    }
    if (filters?.start_date) {
      query = query.gte('created_at', filters.start_date);
    }
    if (filters?.end_date) {
      query = query.lte('created_at', filters.end_date);
    }

    return executeQuery(query);
  }

  // 根据ID获取付款/借款申请单
  async getPaymentRequestById(id: string): Promise<PaymentRequest | null> {
    const { data, error } = await supabase
      .from('payment_requests')
      .select(`
        *,
        applicant:users!payment_requests_applicant_id_fkey(id, name, employee_id),
        department:departments(id, name),
        team:teams(id, name),
        company:companies(id, name)
      `)
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`获取付款申请单失败: ${error.message}`);
    }

    return data;
  }

  // 创建付款/借款申请单
  async createPaymentRequest(data: CreatePaymentRequestData): Promise<PaymentRequest> {
    return executeQuery(
      supabase.from('payment_requests').insert({
        ...data,
        status: 'pending' // 默认状态为待审核
      }).select().single()
    );
  }

  // 更新付款/借款申请单
  async updatePaymentRequest(id: string, data: UpdatePaymentRequestData): Promise<PaymentRequest> {
    return executeQuery(
      supabase.from('payment_requests').update(data).eq('id', id).select().single()
    );
  }

  // 删除付款/借款申请单
  async deletePaymentRequest(id: string): Promise<void> {
    // 删除相关的银行账户记录
    await executeQuery(
      supabase.from('payment_bank_accounts').delete().eq('payment_request_id', id)
    );

    // 删除相关的附件记录
    await executeQuery(
      supabase.from('payment_request_attachments').delete().eq('payment_request_id', id)
    );

    // 删除申请单本身
    await executeQuery(
      supabase.from('payment_requests').delete().eq('id', id)
    );
  }

  // 创建银行账户记录
  async createBankAccount(paymentRequestId: string, accountData: PaymentBankAccountFormData): Promise<PaymentBankAccount> {
    return executeQuery(
      supabase.from('payment_bank_accounts').insert({
        payment_request_id: paymentRequestId,
        ...accountData
      }).select().single()
    );
  }

  // 批量创建银行账户记录
  async createBankAccounts(paymentRequestId: string, accounts: PaymentBankAccountFormData[]): Promise<PaymentBankAccount[]> {
    const accountData = accounts.map((account, index) => ({
      payment_request_id: paymentRequestId,
      ...account,
      sort_order: index
    }));

    return executeQuery(
      supabase.from('payment_bank_accounts').insert(accountData).select()
    );
  }

  // 删除银行账户记录
  async deleteBankAccount(id: string): Promise<void> {
    await executeQuery(
      supabase.from('payment_bank_accounts').delete().eq('id', id)
    );
  }

  // 获取银行账户记录
  async getBankAccounts(paymentRequestId: string): Promise<PaymentBankAccount[]> {
    return executeQuery(
      supabase.from('payment_bank_accounts')
        .select('*')
        .eq('payment_request_id', paymentRequestId)
        .order('sort_order', { ascending: true })
    );
  }

  // 获取附件列表
  async getAttachments(paymentRequestId: string): Promise<PaymentRequestAttachment[]> {
    return executeQuery(
      supabase.from('payment_request_attachments')
        .select('*')
        .eq('payment_request_id', paymentRequestId)
        .order('created_at', { ascending: true })
    );
  }

  // 上传附件
  async uploadAttachment(
    paymentRequestId: string, 
    file: File, 
    uploadedBy: string
  ): Promise<PaymentRequestAttachment> {
    // 生成安全的文件名（移除特殊字符）
    const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${Date.now()}_${safeFileName}`;
    const filePath = `payment-requests/${paymentRequestId}/${fileName}`;

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
      supabase.from('payment_request_attachments').insert({
        payment_request_id: paymentRequestId,
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
      supabase.from('payment_request_attachments').select('file_path').eq('id', id).single()
    );

    if (attachment) {
      // 从Storage中删除文件
      await supabase.storage
        .from('attachments')
        .remove([attachment.file_path]);
    }

    // 删除附件记录
    await executeQuery(
      supabase.from('payment_request_attachments').delete().eq('id', id)
    );
  }

  // 获取附件下载URL
  async getAttachmentDownloadUrl(filePath: string): Promise<string> {
    const { data } = supabase.storage
      .from('attachments')
      .getPublicUrl(filePath);

    return data.publicUrl;
  }

  // 获取公司列表
  async getCompanies(): Promise<Company[]> {
    return executeQuery(
      supabase.from('companies')
        .select('*')
        .eq('status', 'active')
        .order('name', { ascending: true })
    );
  }

  // 创建公司
  async createCompany(name: string, description?: string): Promise<Company> {
    return executeQuery(
      supabase.from('companies').insert({
        name,
        description,
        status: 'active'
      }).select().single()
    );
  }

  // 更新公司
  async updateCompany(id: string, data: { name?: string; description?: string; status?: 'active' | 'inactive' }): Promise<Company> {
    return executeQuery(
      supabase.from('companies').update(data).eq('id', id).select().single()
    );
  }

  // 删除公司
  async deleteCompany(id: string): Promise<void> {
    await executeQuery(
      supabase.from('companies').delete().eq('id', id)
    );
  }

  // 获取付款申请单统计
  async getPaymentRequestStatistics(): Promise<{
    total_count: number;
    total_amount: number;
    by_status: { status: string; count: number; amount: number }[];
    by_department: { department_name: string; count: number; amount: number }[];
    by_type: { document_type: string; count: number; amount: number }[];
  }> {
    const requests = await this.getPaymentRequests();
    
    const total_count = requests.length;
    const total_amount = requests.reduce((sum, request) => sum + request.total_amount, 0);

    // 按状态统计
    const statusMap = new Map<string, { count: number; amount: number }>();
    requests.forEach(request => {
      const current = statusMap.get(request.status) || { count: 0, amount: 0 };
      statusMap.set(request.status, {
        count: current.count + 1,
        amount: current.amount + request.total_amount
      });
    });

    const by_status = Array.from(statusMap.entries()).map(([status, data]) => ({
      status,
      count: data.count,
      amount: data.amount
    }));

    // 按部门统计
    const departmentMap = new Map<string, { count: number; amount: number }>();
    requests.forEach(request => {
      const departmentName = request.department?.name || '未知部门';
      const current = departmentMap.get(departmentName) || { count: 0, amount: 0 };
      departmentMap.set(departmentName, {
        count: current.count + 1,
        amount: current.amount + request.total_amount
      });
    });

    const by_department = Array.from(departmentMap.entries()).map(([department_name, data]) => ({
      department_name,
      count: data.count,
      amount: data.amount
    }));

    // 按单据类型统计
    const typeMap = new Map<string, { count: number; amount: number }>();
    requests.forEach(request => {
      const typeName = request.document_type === 'payment' ? '付款申请单' : '借款申请单';
      const current = typeMap.get(typeName) || { count: 0, amount: 0 };
      typeMap.set(typeName, {
        count: current.count + 1,
        amount: current.amount + request.total_amount
      });
    });

    const by_type = Array.from(typeMap.entries()).map(([document_type, data]) => ({
      document_type,
      count: data.count,
      amount: data.amount
    }));

    return {
      total_count,
      total_amount,
      by_status,
      by_department,
      by_type
    };
  }
}

export const paymentAPI = new PaymentAPI(); 