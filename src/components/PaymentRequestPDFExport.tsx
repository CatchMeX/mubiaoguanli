import React, { useRef, useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Button } from './ui/button';
import { Download } from 'lucide-react';
import type {
  PaymentRequest,
  PaymentBankAccount,
  PaymentRequestAttachment
} from '@/types/payment';

interface PaymentRequestPDFExportProps {
  request: PaymentRequest;
  onExport: () => Promise<{
    bankAccounts: PaymentBankAccount[];
    attachments: PaymentRequestAttachment[];
    workflowInstance?: any;
  }>;
}

const PaymentRequestPDFExport: React.FC<PaymentRequestPDFExportProps> = ({ request, onExport }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [exportData, setExportData] = useState<{
    bankAccounts: PaymentBankAccount[];
    attachments: PaymentRequestAttachment[];
    workflowInstance?: any;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const generatePDF = async () => {
    try {
      setIsLoading(true);
      const data = await onExport();
      setExportData(data);

      // 等待状态更新后再生成PDF
      setTimeout(async () => {
        const input = contentRef.current;
        if (!input) {
          console.error("PDF content element not found.");
          return;
        }

        const canvas = await html2canvas(input, { 
          scale: 2,
          useCORS: true,
          allowTaint: true
        });
        const imgData = canvas.toDataURL('image/png');

        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgWidth = 210; // A4 width in mm
        const pageHeight = 297; // A4 height in mm
        const imgHeight = canvas.height * imgWidth / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft >= 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }

        const documentType = request.document_type === 'payment' ? '付款申请单' : '借款申请单';
        pdf.save(`${documentType}_${request.request_number}.pdf`);
        setIsLoading(false);
      }, 100);
    } catch (error) {
      console.error('生成PDF失败:', error);
      alert('生成PDF失败，请重试');
      setIsLoading(false);
    }
  };

  // 格式化金额为中文大写
  const formatAmountToChinese = (amount: number) => {
    const digits = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖'];
    const units = ['', '拾', '佰', '仟'];
    const bigUnits = ['', '万', '亿'];
    
    if (amount === 0) return '零';
    
    const num = Math.floor(amount);
    const decimal = Math.round((amount - num) * 100);
    
    let result = '';
    let numStr = num.toString();
    
    // 处理整数部分
    for (let i = 0; i < numStr.length; i++) {
      const digit = parseInt(numStr[i]);
      const unit = units[(numStr.length - 1 - i) % 4];
      const bigUnit = bigUnits[Math.floor((numStr.length - 1 - i) / 4)];
      
      if (digit !== 0) {
        result += digits[digit] + unit + bigUnit;
      } else if (result && !result.endsWith('零')) {
        result += '零';
      }
    }
    
    // 处理小数部分
    if (decimal > 0) {
      result += '圆';
      const jiao = Math.floor(decimal / 10);
      const fen = decimal % 10;
      
      if (jiao > 0) {
        result += digits[jiao] + '角';
      }
      if (fen > 0) {
        result += digits[fen] + '分';
      }
    } else {
      result += '圆';
    }
    
    return result;
  };

  return (
    <>
      {/* Hidden content to be rendered for PDF */}
      {exportData && (
        <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
          <div ref={contentRef} style={{ 
            width: '210mm', 
            padding: '20mm',
            fontFamily: 'SimSun, serif',
            fontSize: '12px',
            lineHeight: '1.5',
            backgroundColor: 'white'
          }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 10px 0' }}>
                {request.document_type === 'payment' ? '付款申请单' : '借款申请单'}
              </h1>
              <p style={{ margin: '5px 0', fontSize: '14px' }}>公司名称：灵讯科技</p>
            </div>

            {/* Basic Information */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span>申请单号：{request.request_number}</span>
                <span>提交时间：{new Date(request.created_at).toLocaleString('zh-CN')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span>申请人：{request.applicant?.name || ''}</span>
                <span>申请人部门：{request.department?.name || ''}</span>
              </div>
              <div style={{ marginBottom: '10px' }}>
                <span>当前审批状态：{exportData.workflowInstance?.status === 'completed' ? '已通过' : 
                  exportData.workflowInstance?.status === 'terminated' ? '已终止' : '审批中'}</span>
              </div>
              <div style={{ marginBottom: '10px' }}>
                <span>单据类型：{request.document_type === 'payment' ? '付款申请单' : '借款申请单'}</span>
              </div>
              <div style={{ marginBottom: '10px' }}>
                <span>付款事由：{request.payment_reason}</span>
              </div>
              <div style={{ marginBottom: '10px' }}>
                <span>申请金额：¥{request.total_amount.toFixed(2)}（{formatAmountToChinese(request.total_amount)}）</span>
              </div>
              {request.team && (
                <div style={{ marginBottom: '10px' }}>
                  <span>关联团队：{request.team.name}</span>
                </div>
              )}
              {request.company && (
                <div style={{ marginBottom: '10px' }}>
                  <span>关联公司：{request.company.name}</span>
                </div>
              )}
            </div>

            {/* Bank Account Information - 银行账户信息 */}
            {exportData.bankAccounts && exportData.bankAccounts.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>银行账户信息</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f0f0f0' }}>
                      <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', width: '25%' }}>收款人开户名</th>
                      <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', width: '25%' }}>银行账号</th>
                      <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', width: '25%' }}>开户银行</th>
                      <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', width: '25%' }}>支付金额</th>
                    </tr>
                  </thead>
                  <tbody>
                    {exportData.bankAccounts.map((account, index) => (
                      <tr key={index}>
                        <td style={{ border: '1px solid #000', padding: '8px' }}>{account.account_holder_name}</td>
                        <td style={{ border: '1px solid #000', padding: '8px' }}>{account.bank_account}</td>
                        <td style={{ border: '1px solid #000', padding: '8px' }}>{account.bank_name}</td>
                        <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right' }}>
                          ¥{account.payment_amount.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Attachments */}
            {exportData.attachments && exportData.attachments.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>附件</h3>
                <div style={{ padding: '10px', border: '1px solid #000' }}>
                  {exportData.attachments.map((attachment, index) => (
                    <div key={index} style={{ marginBottom: '5px' }}>
                      {attachment.file_name}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Note */}
            <div style={{ marginBottom: '20px', fontSize: '12px', color: '#666' }}>
              <p style={{ margin: '0' }}>
                ▲ 根据《财务管理制度》之规定：付款申请需经过相关部门审批，借款申请需在指定期限内归还。
              </p>
            </div>

            {/* Approval Workflow - 显示完整的审批流程，包括已完成的审批和待处理的任务 */}
            {exportData.workflowInstance && (
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>
                  审批流程
                </h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f0f0f0' }}>
                      <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', width: '20%' }}>审批节点</th>
                      <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', width: '20%' }}>处理人</th>
                      <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', width: '60%' }}>操作记录</th>
                    </tr>
                  </thead>
                  <tbody>
                    {exportData.workflowInstance.approvals?.map((approval: any, index: number) => {
                      // 根据node_id从workflow_nodes表中获取title
                      const nodeName = exportData.workflowInstance.workflowNodes?.find(
                        (node: any) => node.node_id === approval.task?.node_id
                      )?.title || approval.task?.node_id || `审批节点${index + 1}`;
                      const approverName = approval.approver?.name || approval.task?.assigned_to?.name || '';
                      
                      // 处理审批决定
                      let decision = '';
                      switch (approval.action) {
                        case 'approved':
                          decision = '已同意';
                          break;
                        case 'rejected':
                          decision = '已拒绝';
                          break;
                        case 'delegated':
                          decision = '已委托';
                          break;
                        case 'returned':
                          decision = '已退回';
                          break;
                        default:
                          decision = '待处理';
                      }
                      
                      const approvedTime = approval.approved_at ? new Date(approval.approved_at).toLocaleString('zh-CN') : '';
                      
                      // 构建操作记录，只显示决策和时间
                      let operationRecord = decision;
                      if (approvedTime) {
                        operationRecord += ` (${approvedTime})`;
                      }
                      
                      return (
                        <tr key={index}>
                          <td style={{ border: '1px solid #000', padding: '8px' }}>
                            {nodeName}
                          </td>
                          <td style={{ border: '1px solid #000', padding: '8px' }}>
                            {approverName}
                          </td>
                          <td style={{ border: '1px solid #000', padding: '8px' }}>
                            {operationRecord}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
      
      <Button onClick={generatePDF} size="sm" variant="outline" disabled={isLoading}>
        <Download className="h-4 w-4 mr-2" />
        {isLoading ? '生成中...' : '导出PDF'}
      </Button>
    </>
  );
};

export default PaymentRequestPDFExport; 