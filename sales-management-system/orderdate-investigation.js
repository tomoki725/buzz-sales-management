// orderDateフィールド調査スクリプト
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, orderBy } from 'firebase/firestore';

// Firebase設定
const firebaseConfig = {
  apiKey: "AIzaSyBZCNS-RO3N2cKvN5UcJoIXejpqcBG9OXE",
  authDomain: "sales-management-system-2b9db.firebaseapp.com",
  projectId: "sales-management-system-2b9db",
  storageBucket: "sales-management-system-2b9db.appspot.com",
  messagingSenderId: "906466667644",
  appId: "1:906466667644:web:c2c5b1fa92be3cc29edf75"
};

// Firebase初期化
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function investigateOrderDateField() {
  console.log('=== orderDateフィールド調査開始 ===\n');

  try {
    // プロジェクトデータを取得
    const projectsCollection = collection(db, 'projects');
    const q = query(projectsCollection, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    
    const projects = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // Timestampを確認
        createdAt: data.createdAt?.toDate() || null,
        lastContactDate: data.lastContactDate?.toDate() || null,
        orderDate: data.orderDate?.toDate() || null,
        firstMeetingDate: data.firstMeetingDate?.toDate() || null
      };
    });

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
        if (hasOrderDate) {
          wonWithOrderDate++;
          console.log(`✅ 受注案件(orderDateあり): ${project.clientName} - ${project.title || project.productName} [${project.orderDate?.toISOString().split('T')[0]}]`);
        } else {
          wonWithoutOrderDate++;
          console.log(`❌ 受注案件(orderDateなし): ${project.clientName} - ${project.title || project.productName} [orderDate: ${project.orderDate}]`);
        }
      }

      // 最初の10件の詳細表示
      if (index < 10) {
        console.log(`${index + 1}. ${project.clientName} - ${project.title || project.productName}`);
        console.log(`   Status: ${project.status}`);
        console.log(`   OrderDate: ${project.orderDate ? project.orderDate.toISOString() : 'null/undefined'}`);
        console.log(`   LastContactDate: ${project.lastContactDate ? project.lastContactDate.toISOString() : 'null/undefined'}`);
        console.log('');
      }
    });

    // 統計情報の表示
    console.log('\n📈 統計サマリー:');
    console.log('─'.repeat(50));
    console.log(`・プロジェクト総数: ${projects.length}`);
    console.log(`・orderDateが設定済み: ${orderDateCount} (${(orderDateCount/projects.length*100).toFixed(1)}%)`);
    console.log(`・orderDateがnull: ${orderDateNullCount} (${(orderDateNullCount/projects.length*100).toFixed(1)}%)`);
    console.log(`・orderDateがundefined: ${orderDateUndefinedCount} (${(orderDateUndefinedCount/projects.length*100).toFixed(1)}%)`);
    console.log('');
    
    console.log('📋 受注案件(status="won")の分析:');
    console.log('─'.repeat(50));
    console.log(`・受注案件総数: ${wonProjects.length}`);
    console.log(`・orderDate設定済み: ${wonWithOrderDate} (${wonProjects.length > 0 ? (wonWithOrderDate/wonProjects.length*100).toFixed(1) : 0}%)`);
    console.log(`・orderDate未設定: ${wonWithoutOrderDate} (${wonProjects.length > 0 ? (wonWithoutOrderDate/wonProjects.length*100).toFixed(1) : 0}%)`);

    // ステータス別の分析
    console.log('\n📊 ステータス別分析:');
    console.log('─'.repeat(50));
    const statusCounts = {};
    projects.forEach(project => {
      if (!statusCounts[project.status]) {
        statusCounts[project.status] = { total: 0, withOrderDate: 0 };
      }
      statusCounts[project.status].total++;
      if (project.orderDate) {
        statusCounts[project.status].withOrderDate++;
      }
    });

    Object.entries(statusCounts).forEach(([status, data]) => {
      console.log(`・${status}: ${data.total}件 (orderDate設定: ${data.withOrderDate}件)`);
    });

    // 日付の範囲チェック
    const orderDates = projects
      .filter(p => p.orderDate)
      .map(p => p.orderDate)
      .sort((a, b) => a - b);

    if (orderDates.length > 0) {
      console.log('\n📅 orderDate範囲:');
      console.log('─'.repeat(50));
      console.log(`・最古: ${orderDates[0].toISOString().split('T')[0]}`);
      console.log(`・最新: ${orderDates[orderDates.length - 1].toISOString().split('T')[0]}`);
    }

    // Firestoreデータ型の確認
    console.log('\n🔧 Firestoreデータ型確認:');
    console.log('─'.repeat(50));
    
    // 生データの最初の3件をチェック
    const rawDocs = snapshot.docs.slice(0, 3);
    rawDocs.forEach((doc, index) => {
      const rawData = doc.data();
      console.log(`${index + 1}. Document ID: ${doc.id}`);
      console.log(`   orderDate型: ${typeof rawData.orderDate}`);
      console.log(`   orderDate値: ${rawData.orderDate ? rawData.orderDate.constructor.name : 'null/undefined'}`);
      if (rawData.orderDate && rawData.orderDate.toDate) {
        console.log(`   変換後Date: ${rawData.orderDate.toDate().toISOString()}`);
      }
      console.log('');
    });

  } catch (error) {
    console.error('調査エラー:', error);
  }

  console.log('=== 調査完了 ===');
}

// 実行
investigateOrderDateField().then(() => {
  console.log('\n調査スクリプト実行完了');
  process.exit(0);
}).catch(error => {
  console.error('スクリプト実行エラー:', error);
  process.exit(1);
});