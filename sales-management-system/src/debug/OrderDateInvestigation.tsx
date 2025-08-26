import React, { useEffect, useState } from 'react';
import { getProjects } from '../services/firestore';
import type { Project } from '../types';

interface InvestigationResult {
  totalProjects: number;
  projectsWithOrderDate: number;
  projectsWithoutOrderDate: number;
  wonProjects: number;
  wonWithOrderDate: number;
  wonWithoutOrderDate: number;
  wonProjectsWithoutOrderDate: Project[];
  projects2025: number;
}

export const OrderDateInvestigation: React.FC = () => {
  const [result, setResult] = useState<InvestigationResult | null>(null);
  const [loading, setLoading] = useState(false);

  const investigate = async () => {
    setLoading(true);
    try {
      console.log('=== Firestore orderDateフィールド調査開始 ===');
      
      const projects = await getProjects();
      console.log(`総プロジェクト数: ${projects.length}`);
      
      // 基本統計
      const totalProjects = projects.length;
      const projectsWithOrderDate = projects.filter(p => p.orderDate !== null && p.orderDate !== undefined);
      const projectsWithoutOrderDate = projects.filter(p => p.orderDate === null || p.orderDate === undefined);
      
      console.log(`orderDate設定済み: ${projectsWithOrderDate.length}件`);
      console.log(`orderDate未設定: ${projectsWithoutOrderDate.length}件`);
      
      // ステータス別分析
      const wonProjects = projects.filter(p => p.status === 'won');
      const wonWithOrderDate = wonProjects.filter(p => p.orderDate !== null && p.orderDate !== undefined);
      const wonWithoutOrderDate = wonProjects.filter(p => p.orderDate === null || p.orderDate === undefined);
      
      console.log('\n=== 受注案件(status="won")の分析 ===');
      console.log(`受注案件総数: ${wonProjects.length}件`);
      console.log(`受注案件でorderDate設定済み: ${wonWithOrderDate.length}件`);
      console.log(`受注案件でorderDate未設定: ${wonWithoutOrderDate.length}件`);
      
      // orderDate未設定の受注案件の詳細
      if (wonWithoutOrderDate.length > 0) {
        console.log('\n=== orderDate未設定の受注案件一覧 ===');
        wonWithoutOrderDate.forEach((project, index) => {
          console.log(`${index + 1}. ${project.title} (${project.clientName}) - ID: ${project.id}`);
        });
      }
      
      // orderDate設定済みの受注案件の詳細
      if (wonWithOrderDate.length > 0) {
        console.log('\n=== orderDate設定済みの受注案件サンプル ===');
        wonWithOrderDate.slice(0, 5).forEach((project, index) => {
          console.log(`${index + 1}. ${project.title} (${project.clientName}) - orderDate: ${project.orderDate}`);
        });
      }
      
      // 2025年のorderDateを持つ案件
      const current2025Projects = projectsWithOrderDate.filter(p => {
        if (!p.orderDate) return false;
        const orderYear = p.orderDate.getFullYear();
        return orderYear === 2025;
      });
      
      console.log(`\n2025年のorderDateを持つ案件: ${current2025Projects.length}件`);
      
      // 結論
      console.log('\n=== 調査結果まとめ ===');
      console.log(`ダッシュボードKPIに反映される受注案件: ${wonWithOrderDate.length}件`);
      console.log(`ダッシュボードKPIから除外される受注案件: ${wonWithoutOrderDate.length}件`);
      
      if (wonWithoutOrderDate.length > 0) {
        console.log('\n⚠️  受注ステータスだが受注日未設定の案件があります。');
        console.log('これらの案件はダッシュボードのKPIに反映されません。');
      }
      
      setResult({
        totalProjects,
        projectsWithOrderDate: projectsWithOrderDate.length,
        projectsWithoutOrderDate: projectsWithoutOrderDate.length,
        wonProjects: wonProjects.length,
        wonWithOrderDate: wonWithOrderDate.length,
        wonWithoutOrderDate: wonWithoutOrderDate.length,
        wonProjectsWithoutOrderDate: wonWithoutOrderDate,
        projects2025: current2025Projects.length
      });
      
    } catch (error) {
      console.error('調査中にエラーが発生しました:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    investigate();
  }, []);

  if (loading) {
    return <div style={{ padding: '20px' }}>調査中...</div>;
  }

  if (!result) {
    return <div style={{ padding: '20px' }}>調査結果なし</div>;
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h2>📊 orderDate調査結果</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>基本統計</h3>
        <p>総プロジェクト数: {result.totalProjects}件</p>
        <p>orderDate設定済み: {result.projectsWithOrderDate}件</p>
        <p>orderDate未設定: {result.projectsWithoutOrderDate}件</p>
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>受注案件の分析</h3>
        <p>受注案件総数: {result.wonProjects}件</p>
        <p style={{ color: 'green' }}>受注案件でorderDate設定済み: {result.wonWithOrderDate}件</p>
        <p style={{ color: 'red' }}>受注案件でorderDate未設定: {result.wonWithoutOrderDate}件</p>
      </div>
      
      {result.wonProjectsWithoutOrderDate.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <h3>⚠️ orderDate未設定の受注案件</h3>
          <ul>
            {result.wonProjectsWithoutOrderDate.map((project) => (
              <li key={project.id}>
                {project.title} ({project.clientName})
              </li>
            ))}
          </ul>
        </div>
      )}
      
      <div style={{ marginBottom: '20px' }}>
        <h3>結論</h3>
        <p style={{ color: 'blue' }}>ダッシュボードKPIに反映される受注案件: {result.wonWithOrderDate}件</p>
        <p style={{ color: 'red' }}>ダッシュボードKPIから除外される受注案件: {result.wonWithoutOrderDate}件</p>
        <p>2025年のorderDate案件: {result.projects2025}件</p>
        
        {result.wonWithoutOrderDate > 0 && (
          <div style={{ 
            backgroundColor: '#fff3cd', 
            border: '1px solid #ffeaa7', 
            padding: '10px', 
            marginTop: '10px' 
          }}>
            <strong>問題発見:</strong> 受注ステータスだが受注日未設定の案件が {result.wonWithoutOrderDate}件あります。
            これらの案件はダッシュボードのKPIに反映されないため、数値が実際より少なく表示されています。
          </div>
        )}
      </div>
    </div>
  );
};