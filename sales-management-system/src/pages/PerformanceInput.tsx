import { useState } from 'react';
import { createPerformance, getOrders, updateOrder } from '../services/firestore';
import type { Performance } from '../types';

const PerformanceInput = () => {
  const [csvData, setCsvData] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number; failed: number } | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onload = (event) => {
        setCsvData(event.target?.result as string);
      };
      reader.readAsText(selectedFile);
    }
  };

  const parseCsvData = (data: string): any[] => {
    const lines = data.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.trim());
    const records = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      if (values.length === headers.length) {
        const record: any = {};
        headers.forEach((header, index) => {
          record[header] = values[index];
        });
        records.push(record);
      }
    }
    
    return records;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setImportResult(null);
    
    try {
      const records = parseCsvData(csvData);
      const orders = await getOrders();
      let successCount = 0;
      let failedCount = 0;
      
      for (const record of records) {
        try {
          // CSVフォーマット: クライアント名,案件名,計上月,売上,コスト,粗利
          const performanceData: Omit<Performance, 'id'> = {
            clientName: record['クライアント名'] || record['clientName'] || '',
            projectName: record['案件名'] || record['projectName'] || '',
            recordingMonth: record['計上月'] || record['recordingMonth'] || '',
            revenue: parseFloat(record['売上'] || record['revenue'] || '0'),
            cost: parseFloat(record['コスト'] || record['cost'] || '0'),
            grossProfit: parseFloat(record['粗利'] || record['grossProfit'] || '0'),
            createdAt: new Date()
          };
          
          // 実績データを保存
          await createPerformance(performanceData);
          
          // 関連する受注データを更新
          const matchingOrder = orders.find(order => 
            order.clientName === performanceData.clientName &&
            order.projectTitle === performanceData.projectName
          );
          
          if (matchingOrder) {
            await updateOrder(matchingOrder.id, {
              revenue: (matchingOrder.revenue || 0) + performanceData.revenue,
              cost: (matchingOrder.cost || 0) + performanceData.cost,
              grossProfit: (matchingOrder.grossProfit || 0) + performanceData.grossProfit
            });
          }
          
          successCount++;
        } catch (error) {
          console.error('Error importing record:', record, error);
          failedCount++;
        }
      }
      
      setImportResult({ success: successCount, failed: failedCount });
      setCsvData('');
      setFile(null);
    } catch (error) {
      console.error('Error parsing CSV:', error);
      alert('CSVの解析に失敗しました。フォーマットを確認してください。');
    }
    
    setLoading(false);
  };

  const csvFormat = `クライアント名,案件名,計上月,売上,コスト,粗利
例:株式会社A,システム開発,2025-01,1000000,800000,200000
株式会社B,コンサルティング,2025-01,500000,300000,200000`;

  return (
    <div className="performance-input">
      <h1>実績入力</h1>
      
      <div className="card">
        <h2>CSVフォーマット</h2>
        <div className="format-info">
          <p>以下の形式でCSVファイルを作成してください：</p>
          <pre className="csv-format">{csvFormat}</pre>
        </div>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="csvFile">CSVファイル選択</label>
            <input
              type="file"
              id="csvFile"
              accept=".csv"
              onChange={handleFileUpload}
            />
            {file && (
              <div className="file-info">
                選択されたファイル: {file.name}
              </div>
            )}
          </div>

          {csvData && (
            <div className="form-group">
              <label>プレビュー</label>
              <textarea
                value={csvData}
                onChange={(e) => setCsvData(e.target.value)}
                rows={10}
                className="csv-preview"
              />
            </div>
          )}

          {importResult && (
            <div className="import-result">
              <h3>インポート結果</h3>
              <p>成功: {importResult.success}件</p>
              {importResult.failed > 0 && <p>失敗: {importResult.failed}件</p>}
            </div>
          )}
          
          <div className="form-actions">
            <button 
              type="submit" 
              className="btn"
              disabled={!csvData || loading}
            >
              {loading ? 'インポート中...' : 'アップロード'}
            </button>
          </div>
        </form>
      </div>
      
      <style>{`
        .format-info {
          margin-bottom: 20px;
        }
        
        .csv-format {
          background-color: #f5f5f5;
          padding: 15px;
          border-radius: 4px;
          font-family: monospace;
          font-size: 14px;
          overflow-x: auto;
          white-space: pre;
        }
        
        .file-info {
          margin-top: 10px;
          padding: 10px;
          background-color: #e3f2fd;
          border-radius: 4px;
          font-size: 14px;
        }
        
        .csv-preview {
          font-family: monospace;
          font-size: 12px;
        }
        
        .form-actions {
          display: flex;
          justify-content: flex-end;
          margin-top: 20px;
        }
        
        .import-result {
          margin: 20px 0;
          padding: 15px;
          background-color: #e8f5e9;
          border-radius: 4px;
          border-left: 4px solid #4caf50;
        }
        
        .import-result h3 {
          margin: 0 0 10px 0;
          color: #2e7d32;
        }
        
        .import-result p {
          margin: 5px 0;
        }
      `}</style>
    </div>
  );
};

export default PerformanceInput;