import { useState, useEffect } from 'react';
import { createPerformance, getOrders, updateOrder, getUsers, deleteAllPerformance, getPerformance } from '../services/firestore';
import type { Performance, User } from '../types';

const PerformanceInput = () => {
  const [csvData, setCsvData] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [importResult, setImportResult] = useState<{ 
    success: number; 
    failed: number; 
    deleted: number;
    errors: string[];
    details: string[];
  } | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [performanceData, setPerformanceData] = useState<Performance[]>([]);
  const [performanceLoading, setPerformanceLoading] = useState(true);
  const [expandedClients, setExpandedClients] = useState<Set<string>>(new Set());

  useEffect(() => {
    const loadUsers = async () => {
      const usersData = await getUsers();
      setUsers(usersData);
    };
    loadUsers();
    loadPerformanceData();
  }, []);

  const loadPerformanceData = async () => {
    setPerformanceLoading(true);
    try {
      const data = await getPerformance();
      setPerformanceData(data);
    } catch (error) {
      console.error('Error loading performance data:', error);
    }
    setPerformanceLoading(false);
  };

  const toggleClientExpansion = (clientName: string) => {
    setExpandedClients(prev => {
      const newSet = new Set(prev);
      if (newSet.has(clientName)) {
        newSet.delete(clientName);
      } else {
        newSet.add(clientName);
      }
      return newSet;
    });
  };

  // 年月データをISO形式に正規化する関数
  const normalizeYearMonth = (yearMonth: string): string => {
    if (!yearMonth) return '';
    
    // 既にISO形式の場合はそのまま返す
    if (/^\d{4}-\d{2}$/.test(yearMonth)) {
      return yearMonth;
    }
    
    // 日本語形式（例: 2025年8月）をISO形式に変換
    const match = yearMonth.match(/(\d{4})年(\d{1,2})月/);
    if (match) {
      const year = match[1];
      const month = match[2].padStart(2, '0'); // 1桁の月をゼロパディング
      return `${year}-${month}`;
    }
    
    // その他の形式の場合はそのまま返す
    console.warn('未対応の年月形式:', yearMonth);
    return yearMonth;
  };

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
    
    console.log('CSVヘッダー:', headers);
    console.log('全行数:', lines.length);
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      console.log(`行${i}:`, values);
      
      if (values.length === headers.length) {
        const record: any = {};
        headers.forEach((header, index) => {
          record[header] = values[index];
          console.log(`  ${header}: "${values[index]}"`);
        });
        records.push(record);
      } else {
        console.warn(`行${i}: 列数が不一致 (期待: ${headers.length}, 実際: ${values.length})`);
      }
    }
    
    console.log('パース結果:', records);
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
      let deletedCount = 0;
      const errors: string[] = [];
      const details: string[] = [];
      
      console.log(`処理開始: ${records.length}件のレコードを処理します`);
      console.log('登録済み担当者:', users.map(u => u.name));
      
      // 既存のPerformanceデータを全削除
      console.log('既存の実績データを全削除中...');
      deletedCount = await deleteAllPerformance();
      console.log(`既存データ削除完了: ${deletedCount}件`);
      
      // 重複データの集約処理
      const aggregatedData = new Map<string, {
        assigneeName: string;
        recordingMonth: string;
        clientName: string;
        projectName: string;
        totalGrossProfit: number;
      }>();
      
      // データ集約
      for (const record of records) {
        console.log('処理中レコード:', record);
        
        const assigneeName = record['担当者名'] || record['assigneeName'] || '';
        const rawRecordingMonth = record['年月'] || record['recordingMonth'] || '';
        const recordingMonth = normalizeYearMonth(rawRecordingMonth); // ISO形式に正規化
        const clientName = record['クライアント名'] || record['clientName'] || '';
        const projectName = record['案件名'] || record['projectName'] || '';
        const grossProfit = parseFloat(record['実績'] || record['grossProfit'] || '0');
        
        console.log(`抽出値: 担当者="${assigneeName}", 年月="${rawRecordingMonth}" -> "${recordingMonth}", クライアント="${clientName}", 案件="${projectName}", 実績=${grossProfit}`);
        
        // 必須フィールドのチェック
        if (!assigneeName.trim()) {
          console.error('エラー: 担当者名が空です');
          continue;
        }
        if (!recordingMonth.trim()) {
          console.error('エラー: 年月が空です');
          continue;
        }
        if (!clientName.trim()) {
          console.error('エラー: クライアント名が空です');
          continue;
        }
        if (!projectName.trim()) {
          console.error('エラー: 案件名が空です');
          continue;
        }
        
        const key = `${assigneeName}-${recordingMonth}-${clientName}-${projectName}`;
        
        if (aggregatedData.has(key)) {
          const existing = aggregatedData.get(key)!;
          existing.totalGrossProfit += grossProfit;
        } else {
          aggregatedData.set(key, {
            assigneeName,
            recordingMonth,
            clientName,
            projectName,
            totalGrossProfit: grossProfit
          });
        }
      }
      
      // 集約済みデータを処理
      for (const aggregatedRecord of aggregatedData.values()) {
        try {
          // 集約済みデータを処理
          const assigneeUser = users.find(user => user.name === aggregatedRecord.assigneeName);
          
          if (!assigneeUser) {
            const errorMsg = `担当者「${aggregatedRecord.assigneeName}」が担当者マスタに存在しません`;
            console.warn(errorMsg);
            errors.push(errorMsg);
            failedCount++;
            continue;
          }
          
          const performanceData: Omit<Performance, 'id'> = {
            assigneeId: assigneeUser.id,
            clientName: aggregatedRecord.clientName,
            projectName: aggregatedRecord.projectName,
            recordingMonth: aggregatedRecord.recordingMonth,
            revenue: 0, // 新フォーマットでは使用しない
            cost: 0, // 新フォーマットでは使用しない
            grossProfit: aggregatedRecord.totalGrossProfit,
            createdAt: new Date()
          };
          
          // 新規実績データを保存
          console.log('保存中:', performanceData);
          const performanceId = await createPerformance(performanceData);
          console.log('保存成功 ID:', performanceId);
          
          details.push(`作成: ${aggregatedRecord.assigneeName} - ${aggregatedRecord.clientName} - ${aggregatedRecord.projectName} (¥${aggregatedRecord.totalGrossProfit.toLocaleString()})`);
          
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
          const errorMsg = `エラー: ${aggregatedRecord.assigneeName} - ${aggregatedRecord.clientName} - ${error}`;
          console.error('Error importing aggregated record:', aggregatedRecord, error);
          errors.push(errorMsg);
          failedCount++;
        }
      }
      
      console.log(`処理完了: 既存データ削除 ${deletedCount}件, 新規作成 ${successCount}件, 失敗 ${failedCount}件`);
      setImportResult({ 
        success: successCount, 
        failed: failedCount,
        deleted: deletedCount,
        errors,
        details
      });
      setCsvData('');
      setFile(null);
      // CSV処理完了後にperformanceDataを再読み込み
      await loadPerformanceData();
    } catch (error) {
      console.error('Error parsing CSV:', error);
      alert('CSVの解析に失敗しました。フォーマットを確認してください。');
    }
    
    setLoading(false);
  };

  // クライアント別データ整理
  const organizeDataByClient = () => {
    const clientMap = new Map<string, {
      total: number;
      projects: Array<{
        month: string;
        projectName: string;
        amount: number;
        assigneeName: string;
      }>;
    }>();

    performanceData.forEach(perf => {
      const client = perf.clientName;
      const assigneeName = users.find(u => u.id === perf.assigneeId)?.name || '不明';
      
      if (!clientMap.has(client)) {
        clientMap.set(client, { total: 0, projects: [] });
      }
      
      const clientData = clientMap.get(client)!;
      clientData.total += perf.grossProfit;
      clientData.projects.push({
        month: perf.recordingMonth,
        projectName: perf.projectName,
        amount: perf.grossProfit,
        assigneeName
      });
    });

    // クライアントを合計金額順にソート、各クライアント内のプロジェクトは月順でソート
    const sortedClients = Array.from(clientMap.entries())
      .sort(([, a], [, b]) => b.total - a.total)
      .map(([clientName, data]) => ({
        clientName,
        total: data.total,
        projects: data.projects.sort((a, b) => b.month.localeCompare(a.month))
      }));

    return sortedClients;
  };

  const csvFormat = `担当者名,年月,クライアント名,案件名,実績
例:田中太郎,2025-08,株式会社A,システム開発,200000
佐藤花子,2025-08,株式会社B,コンサルティング,150000

※ 年月は "2025-08" 形式で入力してください。`;

  return (
    <div className="performance-input">
      <h1>実績入力</h1>
      
      <div className="card">
        <h2>CSVフォーマット</h2>
        <div className="format-info">
          <p>以下の形式でCSVファイルを作成してください：</p>
          <pre className="csv-format">{csvFormat}</pre>
          <div className="warning-message">
            <strong>⚠️ 重要:</strong> CSVアップロード時に、既存の実績データは全て削除され、新しいCSVデータに置き換えられます。
          </div>
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
              {importResult.deleted > 0 && <p className="warning">既存データ削除: {importResult.deleted}件</p>}
              <p>新規作成: {importResult.success}件</p>
              {importResult.failed > 0 && <p className="error">失敗: {importResult.failed}件</p>}
              
              {importResult.details.length > 0 && (
                <div className="success-details">
                  <h4>処理詳細:</h4>
                  <ul>
                    {importResult.details.map((detail, index) => (
                      <li key={index}>{detail}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {importResult.errors.length > 0 && (
                <div className="error-details">
                  <h4>エラー詳細:</h4>
                  <ul>
                    {importResult.errors.map((error, index) => (
                      <li key={index} className="error">{error}</li>
                    ))}
                  </ul>
                </div>
              )}
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

      {/* 実績データ表示セクション */}
      <div className="card">
        <h2>📊 実績データ一覧</h2>
        
        {performanceLoading ? (
          <div className="loading">データを読み込み中...</div>
        ) : performanceData.length === 0 ? (
          <div className="no-data">
            <p>実績データがありません。</p>
            <p>上記のCSVアップロード機能を使用してデータを追加してください。</p>
          </div>
        ) : (
          <div className="client-performance-list">
            {organizeDataByClient().map(client => {
              const isExpanded = expandedClients.has(client.clientName);
              return (
                <div key={client.clientName} className="client-section accordion-item">
                  <div 
                    className="client-header accordion-header"
                    onClick={() => toggleClientExpansion(client.clientName)}
                  >
                    <div className="client-info-wrapper">
                      <h3 className="client-name">🏢 {client.clientName}</h3>
                      <div className="client-total">
                        合計: <span className="total-amount">¥{client.total.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="expand-icon">
                      <span className={`chevron ${isExpanded ? 'expanded' : ''}`}>▼</span>
                    </div>
                  </div>
                
                {isExpanded && (
                  <div className="client-projects accordion-content">
                    <table className="projects-table">
                      <thead>
                        <tr>
                          <th>年月</th>
                          <th>案件名</th>
                          <th>担当者</th>
                          <th>金額</th>
                        </tr>
                      </thead>
                      <tbody>
                        {client.projects.map((project, index) => (
                          <tr key={index}>
                            <td className="month">{project.month}</td>
                            <td className="project-name">{project.projectName}</td>
                            <td className="assignee">{project.assigneeName}</td>
                            <td className="amount">¥{project.amount.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              );
            })}
          </div>
        )}
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
        
        .warning-message {
          margin-top: 15px;
          padding: 12px;
          background-color: #fff3cd;
          border: 1px solid #ffeaa7;
          border-radius: 4px;
          color: #856404;
          font-size: 14px;
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
        
        .import-result .error {
          color: #d32f2f;
        }
        
        .import-result .warning {
          color: #ed6c02;
        }
        
        .success-details li.warning {
          color: #ed6c02;
          font-weight: 500;
        }
        
        .success-details, .error-details {
          margin-top: 15px;
        }
        
        .success-details h4, .error-details h4 {
          margin: 0 0 10px 0;
          font-size: 14px;
        }
        
        .success-details ul, .error-details ul {
          margin: 0;
          padding-left: 20px;
        }
        
        .success-details li, .error-details li {
          margin: 3px 0;
          font-size: 12px;
        }
        
        /* 実績データ表示スタイル */
        .loading, .no-data {
          text-align: center;
          padding: 40px 20px;
          color: #666;
        }
        
        .no-data p {
          margin: 5px 0;
        }
        
        .client-performance-list {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        
        .client-section {
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          overflow: hidden;
          background: #ffffff;
        }
        
        .client-header {
          background: #f8f9fa;
          padding: 16px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #e0e0e0;
        }
        
        /* 既存スタイルを上書きしてアコーディオン機能を確実に動作させる */
        .client-header.accordion-header {
          cursor: pointer !important;
          transition: background-color 0.2s ease-in-out !important;
          display: flex !important;
          justify-content: space-between !important;
          align-items: center !important;
        }
        
        .client-name {
          margin: 0;
          font-size: 18px;
          color: #1976d2;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .client-total {
          font-size: 16px;
          font-weight: 500;
          color: #333;
        }
        
        .total-amount {
          color: #4caf50;
          font-weight: bold;
          font-size: 18px;
        }
        
        .client-projects {
          padding: 0;
        }
        
        .projects-table {
          width: 100%;
          border-collapse: collapse;
        }
        
        .projects-table th {
          background: #fafafa;
          padding: 12px 16px;
          text-align: left;
          font-weight: 600;
          color: #333;
          border-bottom: 2px solid #e0e0e0;
        }
        
        .projects-table td {
          padding: 12px 16px;
          border-bottom: 1px solid #f0f0f0;
        }
        
        .projects-table tbody tr:hover {
          background-color: #f8f9fa;
        }
        
        .month {
          color: #666;
          font-family: monospace;
        }
        
        .project-name {
          font-weight: 500;
          color: #333;
        }
        
        .assignee {
          color: #666;
        }
        
        .amount {
          text-align: right;
          font-weight: 600;
          color: #4caf50;
          font-family: monospace;
        }
        
        /* アコーディオン機能のスタイル */
        .accordion-item {
          transition: all 0.2s ease-in-out;
        }
        
        .accordion-item:hover {
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        
        .accordion-header {
          cursor: pointer;
          transition: background-color 0.2s ease-in-out;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .accordion-header:hover {
          background-color: #f0f1f2 !important;
        }
        
        .client-header.accordion-header:hover {
          background-color: #f0f1f2 !important;
        }
        
        .client-info-wrapper {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex: 1;
        }
        
        .expand-icon {
          margin-left: 16px;
        }
        
        .chevron {
          font-size: 14px !important;
          color: #666 !important;
          transition: transform 0.2s ease-in-out !important;
          display: inline-block !important;
          user-select: none;
        }
        
        .chevron.expanded {
          transform: rotate(180deg) !important;
        }
        
        .accordion-content {
          animation: slideDown 0.3s ease-out;
          border-top: 1px solid #e0e0e0;
        }
        
        @keyframes slideDown {
          from {
            opacity: 0;
            max-height: 0;
            padding: 0;
          }
          to {
            opacity: 1;
            max-height: 1000px;
            padding: inherit;
          }
        }
        
        /* レスポンシブデザイン */
        @media (max-width: 768px) {
          .client-header {
            flex-direction: column;
            gap: 10px;
            align-items: flex-start;
          }
          
          .client-info-wrapper {
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
            width: 100%;
          }
          
          .client-name {
            font-size: 16px;
          }
          
          .projects-table {
            font-size: 14px;
          }
          
          .projects-table th,
          .projects-table td {
            padding: 8px 12px;
          }
          
          .expand-icon {
            margin-left: 0;
            align-self: flex-end;
          }
        }
        
        @media (max-width: 480px) {
          .projects-table th:nth-child(3),
          .projects-table td:nth-child(3) {
            display: none;
          }
          
          .projects-table {
            font-size: 13px;
          }
          
          .client-header {
            padding: 12px 16px;
          }
        }
      `}</style>
    </div>
  );
};

export default PerformanceInput;