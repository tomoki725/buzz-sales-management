// FirestoreのorderDateフィールドの状況を調査するスクリプト
import { getProjects } from './src/services/firestore.js';

async function investigateOrderDateData() {
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
    
  } catch (error) {
    console.error('調査中にエラーが発生しました:', error);
  }
}

investigateOrderDateData();