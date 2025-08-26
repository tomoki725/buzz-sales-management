import { useState, useEffect } from 'react';
import { getProjects } from '../services/firestore';
import type { Project } from '../types';

const DebugOrderDate = () => {
  // const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState<any>(null);

  useEffect(() => {
    loadAndAnalyzeProjects();
  }, []);

  const loadAndAnalyzeProjects = async () => {
    try {
      console.log('=== orderDateフィールド調査開始 ===');
      const projectsData = await getProjects();
      // setProjects(projectsData);

      // 分析実行
      const result = analyzeOrderDateField(projectsData);
      setAnalysis(result);
      
      // コンソールに詳細出力
      console.log('プロジェクトデータ:', projectsData);
      console.log('分析結果:', result);
      
    } catch (error) {
      console.error('Error loading projects:', error);
    }
    setLoading(false);
  };

  const analyzeOrderDateField = (projects: Project[]) => {
    console.log(`📊 プロジェクト総数: ${projects.length}`);
    console.log('─'.repeat(50));

    // orderDateフィールドの分析
    let orderDateCount = 0;
    let orderDateNullCount = 0;
    let orderDateUndefinedCount = 0;

    // status='won'のプロジェクト分析
    const wonProjects = projects.filter(p => p.status === 'won');
    let wonWithOrderDate = 0;
    let wonWithoutOrderDate = 0;

    console.log('\n🔍 orderDateフィールド詳細分析:');
    console.log('─'.repeat(50));

    const detailLog: any[] = [];

    projects.forEach((project, index) => {
      const hasOrderDate = project.orderDate !== null && project.orderDate !== undefined;
      
      if (hasOrderDate) {
        orderDateCount++;
      } else if (project.orderDate === null) {
        orderDateNullCount++;
      } else {
        orderDateUndefinedCount++;
      }

      // status='won'の場合の詳細チェック
      if (project.status === 'won') {
        const logEntry = {
          clientName: project.clientName,
          title: project.title || project.productName,
          orderDate: project.orderDate,
          hasOrderDate
        };
        
        if (hasOrderDate) {
          wonWithOrderDate++;
          console.log(`✅ 受注案件(orderDateあり): ${project.clientName} - ${project.title || project.productName} [${project.orderDate?.toISOString().split('T')[0]}]`);
        } else {
          wonWithoutOrderDate++;
          console.log(`❌ 受注案件(orderDateなし): ${project.clientName} - ${project.title || project.productName} [orderDate: ${project.orderDate}]`);
        }
        
        detailLog.push(logEntry);
      }

      // 最初の10件の詳細表示
      if (index < 10) {
        console.log(`${index + 1}. ${project.clientName} - ${project.title || project.productName}`);
        console.log(`   ID: ${project.id}`);
        console.log(`   Status: ${project.status}`);
        console.log(`   OrderDate: ${project.orderDate ? project.orderDate.toISOString() : 'null/undefined'}`);
        console.log(`   OrderDate Type: ${typeof project.orderDate}`);
        console.log(`   LastContactDate: ${project.lastContactDate ? project.lastContactDate.toISOString() : 'null/undefined'}`);
        console.log(`   CreatedAt: ${project.createdAt ? project.createdAt.toISOString() : 'null/undefined'}`);
        console.log('');
      }
    });

    // 統計情報
    const stats = {
      totalProjects: projects.length,
      orderDateCount,
      orderDateNullCount,
      orderDateUndefinedCount,
      wonProjects: wonProjects.length,
      wonWithOrderDate,
      wonWithoutOrderDate,
      detailLog,
      statusCounts: {}
    };

    console.log('\n📈 統計サマリー:');
    console.log('─'.repeat(50));
    console.log(`・プロジェクト総数: ${stats.totalProjects}`);
    console.log(`・orderDateが設定済み: ${stats.orderDateCount} (${(stats.orderDateCount/stats.totalProjects*100).toFixed(1)}%)`);
    console.log(`・orderDateがnull: ${stats.orderDateNullCount} (${(stats.orderDateNullCount/stats.totalProjects*100).toFixed(1)}%)`);
    console.log(`・orderDateがundefined: ${stats.orderDateUndefinedCount} (${(stats.orderDateUndefinedCount/stats.totalProjects*100).toFixed(1)}%)`);
    console.log('');
    
    console.log('📋 受注案件(status="won")の分析:');
    console.log('─'.repeat(50));
    console.log(`・受注案件総数: ${stats.wonProjects}`);
    console.log(`・orderDate設定済み: ${stats.wonWithOrderDate} (${stats.wonProjects > 0 ? (stats.wonWithOrderDate/stats.wonProjects*100).toFixed(1) : 0}%)`);
    console.log(`・orderDate未設定: ${stats.wonWithoutOrderDate} (${stats.wonProjects > 0 ? (stats.wonWithoutOrderDate/stats.wonProjects*100).toFixed(1) : 0}%)`);

    // ステータス別の分析
    console.log('\n📊 ステータス別分析:');
    console.log('─'.repeat(50));
    const statusCounts: any = {};
    projects.forEach(project => {
      if (!statusCounts[project.status]) {
        statusCounts[project.status] = { total: 0, withOrderDate: 0 };
      }
      statusCounts[project.status].total++;
      if (project.orderDate) {
        statusCounts[project.status].withOrderDate++;
      }
    });

    Object.entries(statusCounts).forEach(([status, data]: [string, any]) => {
      console.log(`・${status}: ${data.total}件 (orderDate設定: ${data.withOrderDate}件)`);
    });

    stats.statusCounts = statusCounts;

    return stats;
  };

  if (loading) {
    return <div>調査中...</div>;
  }

  return (
    <div className="debug-order-date" style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>OrderDate フィールド調査結果</h1>
      
      {analysis && (
        <div>
          <h2>統計サマリー</h2>
          <ul>
            <li>プロジェクト総数: {analysis.totalProjects}</li>
            <li>orderDate設定済み: {analysis.orderDateCount} ({(analysis.orderDateCount/analysis.totalProjects*100).toFixed(1)}%)</li>
            <li>orderDateがnull: {analysis.orderDateNullCount} ({(analysis.orderDateNullCount/analysis.totalProjects*100).toFixed(1)}%)</li>
            <li>orderDateがundefined: {analysis.orderDateUndefinedCount} ({(analysis.orderDateUndefinedCount/analysis.totalProjects*100).toFixed(1)}%)</li>
          </ul>

          <h2>受注案件(status="won")の分析</h2>
          <ul>
            <li>受注案件総数: {analysis.wonProjects}</li>
            <li>orderDate設定済み: {analysis.wonWithOrderDate} ({analysis.wonProjects > 0 ? (analysis.wonWithOrderDate/analysis.wonProjects*100).toFixed(1) : 0}%)</li>
            <li>orderDate未設定: {analysis.wonWithoutOrderDate} ({analysis.wonProjects > 0 ? (analysis.wonWithoutOrderDate/analysis.wonProjects*100).toFixed(1) : 0}%)</li>
          </ul>

          <h2>受注案件詳細</h2>
          {analysis.detailLog.map((item: any, index: number) => (
            <div key={index} style={{ 
              margin: '10px 0', 
              padding: '10px', 
              border: '1px solid #ccc',
              backgroundColor: item.hasOrderDate ? '#e8f5e8' : '#ffe8e8'
            }}>
              <strong>{item.clientName} - {item.title}</strong><br/>
              OrderDate: {item.orderDate ? item.orderDate.toISOString().split('T')[0] : 'null/undefined'}
            </div>
          ))}

          <h2>ステータス別分析</h2>
          {analysis.statusCounts && Object.entries(analysis.statusCounts).map(([status, data]: [string, any]) => (
            <div key={status}>
              {status}: {data.total}件 (orderDate設定: {data.withOrderDate}件)
            </div>
          ))}
        </div>
      )}

      <h2>コンソールを確認してください</h2>
      <p>詳細なログはブラウザのデベロッパーツール &gt; コンソールで確認できます</p>
    </div>
  );
};

export default DebugOrderDate;