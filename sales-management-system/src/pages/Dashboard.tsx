import { useState, useEffect } from 'react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, LabelList 
} from 'recharts';
import { 
  getProjects, getActionLogs, getPerformance, 
  getClients, getUsers, getSalesTargets,
  createSalesTarget, updateSalesTarget
} from '../services/firestore';
import FreeWritingSection from '../components/FreeWritingSection';
import { getCurrentWeek, getCurrentMonth } from '../utils/dateUtils';
import type { User } from '../types';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState<'personal' | 'department' | 'overall'>('overall');
  const [showTargetModal, setShowTargetModal] = useState(false);
  const [overallTargets, setOverallTargets] = useState({
    newDeals: Array(12).fill(0),
    newOrders: Array(12).fill(0),
    existingDeals: Array(12).fill(0),
    existingOrders: Array(12).fill(0),
    grossProfitBudget: Array(12).fill(0)
  });
  const [personalTargets, setPersonalTargets] = useState({
    newDeals: Array(12).fill(0),
    newOrders: Array(12).fill(0),
    existingDeals: Array(12).fill(0),
    existingOrders: Array(12).fill(0),
    grossProfitBudget: Array(12).fill(0)
  });
  
  // 2025年1月〜12月の固定リストを生成
  const generate2025Months = () => {
    const months = [];
    for (let i = 1; i <= 12; i++) {
      const month = i.toString().padStart(2, '0');
      months.push(`2025-${month}`);
    }
    return months;
  };
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  
  // 月別選択用
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7));
  const [availableMonths] = useState<string[]>(generate2025Months());
  
  // フリーライティング用
  const [currentWeek] = useState(getCurrentWeek());
  const [currentMonth] = useState(getCurrentMonth());
  const [monthlyKpiData, setMonthlyKpiData] = useState({
    totalDeals: 0,
    totalOrders: 0,
    newDeals: 0,
    newOrders: 0,
    existingDeals: 0,
    existingOrders: 0,
    totalRevenue: 0,
    totalGrossProfit: 0,
    activeClients: 0,
    averageOrderValue: 0
  });
  
  // KPIデータ
  const [kpiData, setKpiData] = useState({
    totalDeals: 0,
    totalOrders: 0,
    newDeals: 0,
    newOrders: 0,
    existingDeals: 0,
    existingOrders: 0,
    totalRevenue: 0,
    totalGrossProfit: 0,
    activeClients: 0,
    averageOrderValue: 0
  });
  
  // グラフデータ
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [yoyData, setYoyData] = useState<any[]>([]);
  
  useEffect(() => {
    loadData();
  }, [activeTab, selectedUser]);
  
  useEffect(() => {
    loadOverallTargets();
  }, []);
  
  useEffect(() => {
    if (selectedUser) {
      loadPersonalTargets(selectedUser);
    } else {
      setPersonalTargets({
        newDeals: Array(12).fill(0),
        newOrders: Array(12).fill(0),
        existingDeals: Array(12).fill(0),
        existingOrders: Array(12).fill(0),
        grossProfitBudget: Array(12).fill(0)
      });
    }
  }, [selectedUser]);
  
  useEffect(() => {
    loadMonthlyKpiData();
  }, [selectedMonth, selectedUser, activeTab]);
  
  const loadData = async () => {
    setLoading(true);
    try {
      const [projectsData, logsData, performanceData, clientsData, usersData] = await Promise.all([
        getProjects(),
        getActionLogs(),
        getPerformance(),
        getClients(),
        getUsers()
      ]);
      
      setUsers(usersData);
      
      // フィルタリング
      console.log('=== データフィルタリング ===');
      console.log('アクティブタブ:', activeTab);
      console.log('選択ユーザー:', selectedUser);
      console.log('全体実績データ数:', performanceData.length);
      
      let filteredProjects = projectsData;
      let filteredLogs = logsData;
      let filteredPerformance = performanceData;
      
      if (activeTab === 'personal' && selectedUser) {
        filteredProjects = projectsData.filter(p => p.assigneeId === selectedUser);
        filteredLogs = logsData.filter(l => l.assigneeId === selectedUser);
        // 実績データも担当者でフィルタリング（直接assigneeIdを使用）
        filteredPerformance = performanceData.filter(perf => perf.assigneeId === selectedUser);
        console.log('個人タブ: 担当者フィルタ後の実績データ数:', filteredPerformance.length);
      } else {
        console.log('全体タブ: フィルタなしの実績データ数:', filteredPerformance.length);
      }
      
      // KPI計算
      const newClientsSet = new Set<string>();
      const existingClientsSet = new Set<string>();
      
      clientsData.forEach(client => {
        if (client.status === 'new') {
          newClientsSet.add(client.name);
        } else {
          existingClientsSet.add(client.name);
        }
      });
      
      const newDealProjects = filteredProjects.filter(p => newClientsSet.has(p.clientName));
      const existingDealProjects = filteredProjects.filter(p => existingClientsSet.has(p.clientName));
      const newOrderProjects = newDealProjects.filter(p => p.status === 'won');
      const existingOrderProjects = existingDealProjects.filter(p => p.status === 'won');
      
      // 2025年のデータのみを年間累計の対象とする
      const yearly2025Performance = filteredPerformance.filter(p => 
        p.recordingMonth.startsWith('2025-')
      );
      
      // 2025年年間累計の売上・粗利計算
      const totalRevenue = yearly2025Performance.reduce((sum, p) => sum + p.revenue, 0);
      const totalGrossProfit = yearly2025Performance.reduce((sum, p) => sum + p.grossProfit, 0);
      
      // 2025年の稼働社数
      console.log('=== 年間累計KPI 稼働社数計算 ===');
      console.log('アクティブタブ:', activeTab);
      console.log('選択ユーザー:', selectedUser);
      console.log('2025年実績データ数:', yearly2025Performance.length);
      console.log('2025年実績データサンプル:', yearly2025Performance.slice(0, 3));
      
      const activeClientsSet = new Set(yearly2025Performance.map(p => p.clientName));
      const activeClients = activeClientsSet.size;
      const activeClientsList = Array.from(activeClientsSet).sort();
      
      console.log('稼働社数（ユニーク）:', activeClients);
      console.log('稼働クライアントリスト:', activeClientsList);
      
      // 2025年の客単価
      const averageOrderValue = activeClients > 0 ? totalGrossProfit / activeClients : 0;
      
      setKpiData({
        totalDeals: filteredLogs.length,
        totalOrders: filteredProjects.filter(p => p.status === 'won').length,
        newDeals: newDealProjects.length,
        newOrders: newOrderProjects.length,
        existingDeals: existingDealProjects.length,
        existingOrders: existingOrderProjects.length,
        totalRevenue,
        totalGrossProfit,
        activeClients,
        averageOrderValue
      });
      
      // 月別データ作成（2025年のデータのみ使用）
      const monthlyMap = new Map<string, { revenue: number; grossProfit: number }>();
      yearly2025Performance.forEach(p => {
        const month = p.recordingMonth.substring(0, 7);
        if (!monthlyMap.has(month)) {
          monthlyMap.set(month, { revenue: 0, grossProfit: 0 });
        }
        const data = monthlyMap.get(month)!;
        data.revenue += p.revenue;
        data.grossProfit += p.grossProfit;
      });
      
      const chartData = Array.from(monthlyMap.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([month, data]) => ({
          month: month.substring(5),
          粗利: data.grossProfit
        }));
      
      setMonthlyData(chartData);
      
      // YOYデータ作成（2025年vs2024年の粗利比較）
      const currentYear = 2025;
      const lastYear = 2024;
      const yoyMap = new Map<string, { current: number; last: number }>();
      
      console.log('=== YOYデータ作成開始 ===');
      console.log('全体実績データ総数:', performanceData.length);
      console.log('アクティブタブ:', activeTab);
      console.log('選択されたユーザー:', selectedUser);
      
      // 全体の実績データから2025年と2024年のデータを取得
      const yoyTargetData = performanceData.filter(p => {
        const year = parseInt(p.recordingMonth.substring(0, 4));
        return year === currentYear || year === lastYear;
      });
      
      console.log('YOY対象データ数（2024年+2025年）:', yoyTargetData.length);
      console.log('YOY対象データサンプル:', yoyTargetData.slice(0, 3));
      
      yoyTargetData.forEach(p => {
        const year = parseInt(p.recordingMonth.substring(0, 4));
        const client = p.clientName;
        
        console.log(`処理中: ${client} (${year}年${p.recordingMonth.substring(5, 7)}月) - 粗利: ¥${p.grossProfit.toLocaleString()}, 担当者ID: ${p.assigneeId}`);
        
        if (!yoyMap.has(client)) {
          yoyMap.set(client, { current: 0, last: 0 });
        }
        const data = yoyMap.get(client)!;
        if (year === currentYear) {
          data.current += p.grossProfit;
        } else {
          data.last += p.grossProfit;
        }
      });
      
      // 重複データの検出
      const duplicateCheck = new Map<string, number>();
      yoyTargetData.forEach(p => {
        const key = `${p.assigneeId}-${p.recordingMonth}-${p.clientName}-${p.projectName}`;
        duplicateCheck.set(key, (duplicateCheck.get(key) || 0) + 1);
      });
      
      const duplicates = Array.from(duplicateCheck.entries()).filter(([_, count]) => count > 1);
      if (duplicates.length > 0) {
        console.warn('=== 重複データ検出 ===');
        duplicates.forEach(([key, count]) => {
          console.warn(`重複 ${count}件: ${key}`);
        });
      } else {
        console.log('重複データなし');
      }
      
      console.log('=== クライアント別YOY集計結果 ===');
      Array.from(yoyMap.entries()).forEach(([client, data]) => {
        console.log(`${client}: 2025年=¥${data.current.toLocaleString()}, 2024年=¥${data.last.toLocaleString()}`);
      });
      
      const yoyChartData = Array.from(yoyMap.entries())
        .map(([client, data]) => ({
          client: client.length > 10 ? client.substring(0, 10) + '...' : client,
          "2025年": data.current,
          "2024年": data.last
        }))
        .sort((a, b) => b["2025年"] - a["2025年"])
        .slice(0, 10);
      
      setYoyData(yoyChartData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
    setLoading(false);
  };
  
  const loadMonthlyKpiData = async () => {
    // selectedMonthが空の場合は処理しない
    if (!selectedMonth) return;
    
    console.log('=== 月別KPIデータ読み込み開始 ===');
    console.log('選択された月:', selectedMonth);
    console.log('アクティブタブ:', activeTab);
    console.log('選択されたユーザー:', selectedUser);
    
    try {
      const [projectsData, logsData, performanceData, clientsData] = await Promise.all([
        getProjects(),
        getActionLogs(),
        getPerformance(),
        getClients()
      ]);
      
      console.log('実績データ総数:', performanceData.length);
      console.log('実績データサンプル:', performanceData.slice(0, 3));
      
      // フィルタリング
      let filteredProjects = projectsData;
      let filteredLogs = logsData;
      let filteredPerformance = performanceData;
      
      if (activeTab === 'personal' && selectedUser) {
        filteredProjects = projectsData.filter(p => p.assigneeId === selectedUser);
        filteredLogs = logsData.filter(l => l.assigneeId === selectedUser);
        // 実績データも担当者でフィルタリング（直接assigneeIdを使用）
        filteredPerformance = performanceData.filter(perf => perf.assigneeId === selectedUser);
      }
      
      // 選択された月のデータのみにフィルタリング
      console.log('フィルタリング前の実績データ数:', filteredPerformance.length);
      console.log('フィルタリング前のデータサンプル:', filteredPerformance.slice(0, 3));
      
      const monthlyPerformance = filteredPerformance.filter(p => {
        console.log(`チェック中: recordingMonth="${p.recordingMonth}", selectedMonth="${selectedMonth}", マッチ=${p.recordingMonth.startsWith(selectedMonth)}`);
        return p.recordingMonth.startsWith(selectedMonth);
      });
      
      console.log('月別フィルタリング後のデータ数:', monthlyPerformance.length);
      console.log('月別データ:', monthlyPerformance);
      
      // 月別の商談・受注データをフィルタリング（作成日または最終接触日が選択月の場合）
      const monthlyProjects = filteredProjects.filter(p => {
        const createdMonth = p.createdAt.toISOString().substring(0, 7);
        const lastContactMonth = p.lastContactDate?.toISOString().substring(0, 7);
        return createdMonth === selectedMonth || lastContactMonth === selectedMonth;
      });
      
      const monthlyLogs = filteredLogs.filter(l => {
        const actionMonth = l.actionDate.toISOString().substring(0, 7);
        return actionMonth === selectedMonth;
      });
      
      // KPI計算
      const newClientsSet = new Set<string>();
      const existingClientsSet = new Set<string>();
      
      clientsData.forEach(client => {
        if (client.status === 'new') {
          newClientsSet.add(client.name);
        } else {
          existingClientsSet.add(client.name);
        }
      });
      
      const newDealProjects = monthlyProjects.filter(p => newClientsSet.has(p.clientName));
      const existingDealProjects = monthlyProjects.filter(p => existingClientsSet.has(p.clientName));
      const newOrderProjects = newDealProjects.filter(p => p.status === 'won');
      const existingOrderProjects = existingDealProjects.filter(p => p.status === 'won');
      
      // 月別の売上・粗利計算
      const totalRevenue = monthlyPerformance.reduce((sum, p) => sum + p.revenue, 0);
      const totalGrossProfit = monthlyPerformance.reduce((sum, p) => sum + p.grossProfit, 0);
      
      console.log('月別粗利計算結果:', totalGrossProfit);
      console.log('月別売上計算結果:', totalRevenue);
      
      // 稼働社数
      console.log('=== 月別KPI 稼働社数計算 ===');
      console.log('選択月:', selectedMonth);
      console.log('アクティブタブ:', activeTab);
      console.log('選択ユーザー:', selectedUser);
      console.log('月別実績データ数:', monthlyPerformance.length);
      console.log('月別実績データサンプル:', monthlyPerformance.slice(0, 3));
      
      const activeClientsSet = new Set(monthlyPerformance.map(p => p.clientName));
      const activeClients = activeClientsSet.size;
      const monthlyActiveClientsList = Array.from(activeClientsSet).sort();
      
      console.log('月別稼働社数（ユニーク）:', activeClients);
      console.log('月別稼働クライアントリスト:', monthlyActiveClientsList);
      
      // 客単価
      const averageOrderValue = activeClients > 0 ? totalGrossProfit / activeClients : 0;
      
      const monthlyKpiResult = {
        totalDeals: monthlyLogs.length,
        totalOrders: monthlyProjects.filter(p => p.status === 'won').length,
        newDeals: newDealProjects.length,
        newOrders: newOrderProjects.length,
        existingDeals: existingDealProjects.length,
        existingOrders: existingOrderProjects.length,
        totalRevenue,
        totalGrossProfit,
        activeClients,
        averageOrderValue
      };
      
      console.log('月別KPI結果:', monthlyKpiResult);
      setMonthlyKpiData(monthlyKpiResult);
      
    } catch (error) {
      console.error('Error loading monthly KPI data:', error);
      // エラー時はゼロ値で設定
      setMonthlyKpiData({
        totalDeals: 0,
        totalOrders: 0,
        newDeals: 0,
        newOrders: 0,
        existingDeals: 0,
        existingOrders: 0,
        totalRevenue: 0,
        totalGrossProfit: 0,
        activeClients: 0,
        averageOrderValue: 0
      });
    }
  };

  const loadOverallTargets = async () => {
    try {
      // 全体目標は特別なuserIdで管理
      const targetsData = await getSalesTargets('overall');
      
      const newTargets = {
        newDeals: Array(12).fill(0),
        newOrders: Array(12).fill(0),
        existingDeals: Array(12).fill(0),
        existingOrders: Array(12).fill(0),
        grossProfitBudget: Array(12).fill(0)
      };
      
      const currentYear = new Date().getFullYear();
      targetsData.forEach(target => {
        if (target.year === currentYear && target.month >= 1 && target.month <= 12) {
          const index = target.month - 1;
          newTargets.newDeals[index] = target.newDeals;
          newTargets.newOrders[index] = target.newOrders;
          newTargets.existingDeals[index] = target.existingDeals;
          newTargets.existingOrders[index] = target.existingOrders;
          newTargets.grossProfitBudget[index] = target.grossProfitBudget || 0;
        }
      });
      
      setOverallTargets(newTargets);
    } catch (error) {
      console.error('Error loading overall targets:', error);
    }
  };

  const loadPersonalTargets = async (userId: string) => {
    try {
      const targetsData = await getSalesTargets(userId);
      
      const newTargets = {
        newDeals: Array(12).fill(0),
        newOrders: Array(12).fill(0),
        existingDeals: Array(12).fill(0),
        existingOrders: Array(12).fill(0),
        grossProfitBudget: Array(12).fill(0)
      };
      
      const currentYear = new Date().getFullYear();
      targetsData.forEach(target => {
        if (target.year === currentYear && target.month >= 1 && target.month <= 12) {
          const index = target.month - 1;
          newTargets.newDeals[index] = target.newDeals;
          newTargets.newOrders[index] = target.newOrders;
          newTargets.existingDeals[index] = target.existingDeals;
          newTargets.existingOrders[index] = target.existingOrders;
          newTargets.grossProfitBudget[index] = target.grossProfitBudget || 0;
        }
      });
      
      setPersonalTargets(newTargets);
    } catch (error) {
      console.error('Error loading personal targets:', error);
    }
  };

  const saveOverallTargets = async () => {
    try {
      const currentYear = new Date().getFullYear();
      const existingTargets = await getSalesTargets('overall');
      
      for (let month = 1; month <= 12; month++) {
        const index = month - 1;
        const targetData = {
          userId: 'overall',
          year: currentYear,
          month,
          newDeals: overallTargets.newDeals[index],
          newOrders: overallTargets.newOrders[index],
          existingDeals: overallTargets.existingDeals[index],
          existingOrders: overallTargets.existingOrders[index],
          grossProfitBudget: overallTargets.grossProfitBudget[index]
        };
        
        const existing = existingTargets.find(
          t => t.userId === 'overall' && t.year === currentYear && t.month === month
        );
        
        if (existing) {
          await updateSalesTarget(existing.id, targetData);
        } else {
          await createSalesTarget(targetData);
        }
      }
      
      alert('全体目標を保存しました');
      setShowTargetModal(false);
    } catch (error) {
      console.error('Error saving overall targets:', error);
      alert('保存に失敗しました');
    }
  };

  // 目標値計算ヘルパー関数
  const calculateYearlyTarget = (targets: number[]) => {
    return targets.reduce((sum, target) => sum + target, 0);
  };

  const getMonthlyTarget = (targets: number[], selectedMonth: string) => {
    if (!selectedMonth) return 0;
    const monthIndex = parseInt(selectedMonth.substring(5, 7)) - 1;
    return targets[monthIndex] || 0;
  };

  const formatKpiValue = (actual: number, target: number, isMonetary = false) => {
    const prefix = isMonetary ? '¥' : '';
    const actualStr = isMonetary ? Math.round(actual).toLocaleString() : actual.toString();
    const targetStr = target > 0 ? (isMonetary ? Math.round(target).toLocaleString() : target.toString()) : '-';
    return `${prefix}${actualStr} / ${prefix}${targetStr}`;
  };

  return (
    <div className="dashboard">
      <h1>ダッシュボード</h1>
      
      <div className="tab-container">
        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'overall' ? 'active' : ''}`}
            onClick={() => setActiveTab('overall')}
          >
            全体
          </button>
          <button 
            className={`tab ${activeTab === 'personal' ? 'active' : ''}`}
            onClick={() => setActiveTab('personal')}
          >
            個人
          </button>
          <button 
            className={`tab ${activeTab === 'department' ? 'active' : ''}`}
            onClick={() => setActiveTab('department')}
          >
            部署別
          </button>
        </div>
      </div>

      {activeTab === 'overall' && (
        <div className="dashboard-content">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2>年間累計KPI（全体）</h2>
            <button className="btn" onClick={() => setShowTargetModal(true)}>目標設定</button>
          </div>
          <div className="kpi-grid">
            <div className="kpi-card">
              <h3>総商談数</h3>
              <div className="kpi-value">{loading ? '-' : formatKpiValue(kpiData.totalDeals, calculateYearlyTarget(overallTargets.newDeals) + calculateYearlyTarget(overallTargets.existingDeals))}</div>
            </div>
            <div className="kpi-card">
              <h3>総受注数</h3>
              <div className="kpi-value">{loading ? '-' : formatKpiValue(kpiData.totalOrders, calculateYearlyTarget(overallTargets.newOrders) + calculateYearlyTarget(overallTargets.existingOrders))}</div>
            </div>
            <div className="kpi-card">
              <h3>新規商談数</h3>
              <div className="kpi-value">{loading ? '-' : formatKpiValue(kpiData.newDeals, calculateYearlyTarget(overallTargets.newDeals))}</div>
            </div>
            <div className="kpi-card">
              <h3>新規受注数</h3>
              <div className="kpi-value">{loading ? '-' : formatKpiValue(kpiData.newOrders, calculateYearlyTarget(overallTargets.newOrders))}</div>
            </div>
            <div className="kpi-card">
              <h3>既存商談数</h3>
              <div className="kpi-value">{loading ? '-' : formatKpiValue(kpiData.existingDeals, calculateYearlyTarget(overallTargets.existingDeals))}</div>
            </div>
            <div className="kpi-card">
              <h3>既存受注数</h3>
              <div className="kpi-value">{loading ? '-' : formatKpiValue(kpiData.existingOrders, calculateYearlyTarget(overallTargets.existingOrders))}</div>
            </div>
            <div className="kpi-card">
              <h3>総粗利</h3>
              <div className="kpi-value">{loading ? '-' : formatKpiValue(kpiData.totalGrossProfit, calculateYearlyTarget(overallTargets.grossProfitBudget), true)}</div>
            </div>
            <div className="kpi-card">
              <h3>稼働社数</h3>
              <div className="kpi-value">{loading ? '-' : kpiData.activeClients}</div>
            </div>
            <div className="kpi-card">
              <h3>客単価</h3>
              <div className="kpi-value">{loading ? '-' : `¥${Math.round(kpiData.averageOrderValue).toLocaleString()}`}</div>
            </div>
          </div>
          
          <h2>月別KPI</h2>
          <div className="month-selector">
            <label>月選択:</label>
            <select 
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(e.target.value)}
              style={{ marginLeft: '10px', padding: '8px 12px', borderRadius: '4px', border: '1px solid #ddd' }}
            >
              <option value="">選択してください</option>
              {availableMonths.map(month => (
                <option key={month} value={month}>
                  {month.substring(0, 4)}年{month.substring(5, 7)}月
                </option>
              ))}
            </select>
          </div>
          
          <div className="kpi-grid" style={{ marginTop: '20px' }}>
              <div className="kpi-card">
                <h3>総商談数</h3>
                <div className="kpi-value">{formatKpiValue(monthlyKpiData.totalDeals, getMonthlyTarget(overallTargets.newDeals, selectedMonth) + getMonthlyTarget(overallTargets.existingDeals, selectedMonth))}</div>
              </div>
              <div className="kpi-card">
                <h3>総受注数</h3>
                <div className="kpi-value">{formatKpiValue(monthlyKpiData.totalOrders, getMonthlyTarget(overallTargets.newOrders, selectedMonth) + getMonthlyTarget(overallTargets.existingOrders, selectedMonth))}</div>
              </div>
              <div className="kpi-card">
                <h3>新規商談数</h3>
                <div className="kpi-value">{formatKpiValue(monthlyKpiData.newDeals, getMonthlyTarget(overallTargets.newDeals, selectedMonth))}</div>
              </div>
              <div className="kpi-card">
                <h3>新規受注数</h3>
                <div className="kpi-value">{formatKpiValue(monthlyKpiData.newOrders, getMonthlyTarget(overallTargets.newOrders, selectedMonth))}</div>
              </div>
              <div className="kpi-card">
                <h3>既存商談数</h3>
                <div className="kpi-value">{formatKpiValue(monthlyKpiData.existingDeals, getMonthlyTarget(overallTargets.existingDeals, selectedMonth))}</div>
              </div>
              <div className="kpi-card">
                <h3>既存受注数</h3>
                <div className="kpi-value">{formatKpiValue(monthlyKpiData.existingOrders, getMonthlyTarget(overallTargets.existingOrders, selectedMonth))}</div>
              </div>
              <div className="kpi-card">
                <h3>月粗利</h3>
                <div className="kpi-value">{formatKpiValue(monthlyKpiData.totalGrossProfit, getMonthlyTarget(overallTargets.grossProfitBudget, selectedMonth), true)}</div>
              </div>
              <div className="kpi-card">
                <h3>稼働社数</h3>
                <div className="kpi-value">{monthlyKpiData.activeClients}</div>
              </div>
              <div className="kpi-card">
                <h3>客単価</h3>
                <div className="kpi-value">¥{Math.round(monthlyKpiData.averageOrderValue).toLocaleString()}</div>
              </div>
            </div>
            
          {/* フリーライティングスペース */}
          <FreeWritingSection
            type="monthly"
            userId="overall"
            initialPeriod={currentMonth}
            title="📝 月次フリーライティングスペース"
          />
          
          <FreeWritingSection
            type="weekly"
            userId="overall"
            initialPeriod={currentWeek}
            title="📅 週次フリーライティングスペース"
          />
          
          <div className="chart-section">
            <div className="card">
              <h3>月別 粗利推移</h3>
              {monthlyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => `¥${Math.round(value).toLocaleString()}`} />
                    <Legend />
                    <Line type="monotone" dataKey="粗利" stroke="#82ca9d">
                      <LabelList dataKey="粗利" position="top" formatter={(label: any) => `¥${Math.round(Number(label) || 0).toLocaleString()}`} />
                    </Line>
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="chart-placeholder">
                  データがありません
                </div>
              )}
            </div>
            
            <div className="card">
              <h3>クライアント別YOYグラフ</h3>
              {yoyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={yoyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="client" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip formatter={(value: number) => `¥${Math.round(value).toLocaleString()}`} />
                    <Legend />
                    <Bar dataKey="2025年" fill="#8884d8" />
                    <Bar dataKey="2024年" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="chart-placeholder">
                  データがありません
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'personal' && (
        <div className="dashboard-content">
          <h2>年間累計KPI（個人）</h2>
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label>担当者選択:</label>
            <select 
              value={selectedUser} 
              onChange={(e) => setSelectedUser(e.target.value)}
              style={{ marginLeft: '10px', padding: '5px' }}
            >
              <option value="">選択してください</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>{user.name}</option>
              ))}
            </select>
          </div>
          <div className="kpi-grid">
            <div className="kpi-card">
              <h3>総商談数</h3>
              <div className="kpi-value">{loading ? '-' : formatKpiValue(kpiData.totalDeals, calculateYearlyTarget(personalTargets.newDeals) + calculateYearlyTarget(personalTargets.existingDeals))}</div>
            </div>
            <div className="kpi-card">
              <h3>総受注数</h3>
              <div className="kpi-value">{loading ? '-' : formatKpiValue(kpiData.totalOrders, calculateYearlyTarget(personalTargets.newOrders) + calculateYearlyTarget(personalTargets.existingOrders))}</div>
            </div>
            <div className="kpi-card">
              <h3>新規商談数</h3>
              <div className="kpi-value">{loading ? '-' : formatKpiValue(kpiData.newDeals, calculateYearlyTarget(personalTargets.newDeals))}</div>
            </div>
            <div className="kpi-card">
              <h3>新規受注数</h3>
              <div className="kpi-value">{loading ? '-' : formatKpiValue(kpiData.newOrders, calculateYearlyTarget(personalTargets.newOrders))}</div>
            </div>
            <div className="kpi-card">
              <h3>既存商談数</h3>
              <div className="kpi-value">{loading ? '-' : formatKpiValue(kpiData.existingDeals, calculateYearlyTarget(personalTargets.existingDeals))}</div>
            </div>
            <div className="kpi-card">
              <h3>既存受注数</h3>
              <div className="kpi-value">{loading ? '-' : formatKpiValue(kpiData.existingOrders, calculateYearlyTarget(personalTargets.existingOrders))}</div>
            </div>
            <div className="kpi-card">
              <h3>総粗利</h3>
              <div className="kpi-value">{loading ? '-' : formatKpiValue(kpiData.totalGrossProfit, calculateYearlyTarget(personalTargets.grossProfitBudget), true)}</div>
            </div>
            <div className="kpi-card">
              <h3>稼働社数</h3>
              <div className="kpi-value">{loading ? '-' : kpiData.activeClients}</div>
            </div>
            <div className="kpi-card">
              <h3>客単価</h3>
              <div className="kpi-value">{loading ? '-' : `¥${Math.round(kpiData.averageOrderValue).toLocaleString()}`}</div>
            </div>
          </div>
          
          <h2>月別KPI</h2>
          <div className="month-selector">
            <label>月選択:</label>
            <select 
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(e.target.value)}
              style={{ marginLeft: '10px', padding: '8px 12px', borderRadius: '4px', border: '1px solid #ddd' }}
            >
              <option value="">選択してください</option>
              {availableMonths.map(month => (
                <option key={month} value={month}>
                  {month.substring(0, 4)}年{month.substring(5, 7)}月
                </option>
              ))}
            </select>
          </div>
          
          <div className="kpi-grid" style={{ marginTop: '20px' }}>
            <div className="kpi-card">
              <h3>総商談数</h3>
              <div className="kpi-value">{formatKpiValue(monthlyKpiData.totalDeals, getMonthlyTarget(personalTargets.newDeals, selectedMonth) + getMonthlyTarget(personalTargets.existingDeals, selectedMonth))}</div>
            </div>
            <div className="kpi-card">
              <h3>総受注数</h3>
              <div className="kpi-value">{formatKpiValue(monthlyKpiData.totalOrders, getMonthlyTarget(personalTargets.newOrders, selectedMonth) + getMonthlyTarget(personalTargets.existingOrders, selectedMonth))}</div>
            </div>
            <div className="kpi-card">
              <h3>新規商談数</h3>
              <div className="kpi-value">{formatKpiValue(monthlyKpiData.newDeals, getMonthlyTarget(personalTargets.newDeals, selectedMonth))}</div>
            </div>
            <div className="kpi-card">
              <h3>新規受注数</h3>
              <div className="kpi-value">{formatKpiValue(monthlyKpiData.newOrders, getMonthlyTarget(personalTargets.newOrders, selectedMonth))}</div>
            </div>
            <div className="kpi-card">
              <h3>既存商談数</h3>
              <div className="kpi-value">{formatKpiValue(monthlyKpiData.existingDeals, getMonthlyTarget(personalTargets.existingDeals, selectedMonth))}</div>
            </div>
            <div className="kpi-card">
              <h3>既存受注数</h3>
              <div className="kpi-value">{formatKpiValue(monthlyKpiData.existingOrders, getMonthlyTarget(personalTargets.existingOrders, selectedMonth))}</div>
            </div>
            <div className="kpi-card">
              <h3>月粗利</h3>
              <div className="kpi-value">{formatKpiValue(monthlyKpiData.totalGrossProfit, getMonthlyTarget(personalTargets.grossProfitBudget, selectedMonth), true)}</div>
            </div>
            <div className="kpi-card">
              <h3>稼働社数</h3>
              <div className="kpi-value">{monthlyKpiData.activeClients}</div>
            </div>
            <div className="kpi-card">
              <h3>客単価</h3>
              <div className="kpi-value">¥{Math.round(monthlyKpiData.averageOrderValue).toLocaleString()}</div>
            </div>
          </div>
          
          {/* 個人用週次フリーライティングスペース */}
          {selectedUser && (
            <FreeWritingSection
              type="weekly"
              userId={selectedUser}
              initialPeriod={currentWeek}
              title="📅 週次フリーライティングスペース"
            />
          )}
        </div>
      )}

      {activeTab === 'department' && (
        <div className="dashboard-content">
          <h2>サマリー（部署別）</h2>
          <div className="card">
            <p>部署別の統計情報を表示します</p>
          </div>
        </div>
      )}

      {/* 全体目標設定モーダル */}
      {showTargetModal && (
        <div className="modal-overlay" onClick={() => setShowTargetModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>全体目標設定</h3>
              <button className="close-btn" onClick={() => setShowTargetModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="target-category">
                <h4>新規商談数</h4>
                <div className="month-grid">
                  {Array.from({ length: 12 }, (_, i) => (
                    <div key={i} className="month-input">
                      <label>{i + 1}月</label>
                      <input
                        type="number"
                        value={overallTargets.newDeals[i]}
                        onChange={(e) => {
                          const newTargets = { ...overallTargets };
                          newTargets.newDeals[i] = parseInt(e.target.value) || 0;
                          setOverallTargets(newTargets);
                        }}
                        min="0"
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div className="target-category">
                <h4>新規受注数</h4>
                <div className="month-grid">
                  {Array.from({ length: 12 }, (_, i) => (
                    <div key={i} className="month-input">
                      <label>{i + 1}月</label>
                      <input
                        type="number"
                        value={overallTargets.newOrders[i]}
                        onChange={(e) => {
                          const newTargets = { ...overallTargets };
                          newTargets.newOrders[i] = parseInt(e.target.value) || 0;
                          setOverallTargets(newTargets);
                        }}
                        min="0"
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div className="target-category">
                <h4>既存商談数</h4>
                <div className="month-grid">
                  {Array.from({ length: 12 }, (_, i) => (
                    <div key={i} className="month-input">
                      <label>{i + 1}月</label>
                      <input
                        type="number"
                        value={overallTargets.existingDeals[i]}
                        onChange={(e) => {
                          const newTargets = { ...overallTargets };
                          newTargets.existingDeals[i] = parseInt(e.target.value) || 0;
                          setOverallTargets(newTargets);
                        }}
                        min="0"
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div className="target-category">
                <h4>既存受注数</h4>
                <div className="month-grid">
                  {Array.from({ length: 12 }, (_, i) => (
                    <div key={i} className="month-input">
                      <label>{i + 1}月</label>
                      <input
                        type="number"
                        value={overallTargets.existingOrders[i]}
                        onChange={(e) => {
                          const newTargets = { ...overallTargets };
                          newTargets.existingOrders[i] = parseInt(e.target.value) || 0;
                          setOverallTargets(newTargets);
                        }}
                        min="0"
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div className="target-category">
                <h4>粗利BGT（円）</h4>
                <div className="month-grid">
                  {Array.from({ length: 12 }, (_, i) => (
                    <div key={i} className="month-input">
                      <label>{i + 1}月</label>
                      <input
                        type="number"
                        value={overallTargets.grossProfitBudget[i]}
                        onChange={(e) => {
                          const newTargets = { ...overallTargets };
                          newTargets.grossProfitBudget[i] = parseInt(e.target.value) || 0;
                          setOverallTargets(newTargets);
                        }}
                        min="0"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowTargetModal(false)}>キャンセル</button>
              <button className="btn" onClick={saveOverallTargets}>保存</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .tab-container {
          margin-bottom: 20px;
        }
        
        .tabs {
          display: flex;
          border-bottom: 1px solid #ddd;
        }
        
        .tab {
          padding: 12px 24px;
          border: none;
          background: none;
          cursor: pointer;
          font-size: 14px;
          border-bottom: 2px solid transparent;
        }
        
        .tab.active {
          color: #1976d2;
          border-bottom-color: #1976d2;
        }
        
        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }
        
        .kpi-card {
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          text-align: center;
        }
        
        .kpi-card h3 {
          margin-bottom: 10px;
          color: #666;
          font-size: 14px;
        }
        
        .kpi-value {
          font-size: 24px;
          font-weight: bold;
          color: #1976d2;
        }
        
        .chart-section {
          display: grid;
          grid-template-columns: 1fr;
          gap: 20px;
        }
        
        .chart-placeholder {
          height: 200px;
          background-color: #f5f5f5;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #666;
          border-radius: 4px;
        }
        
        .month-selector {
          margin: 20px 0;
          padding: 15px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          display: flex;
          align-items: center;
        }
        
        .month-selector label {
          font-weight: 500;
          color: #333;
        }
        
        @media (max-width: 768px) {
          .chart-section {
            grid-template-columns: 1fr;
          }
          
          .kpi-grid {
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          }
        }
        
        /* モーダルスタイル */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }
        
        .modal-content {
          background: white;
          border-radius: 8px;
          max-width: 1200px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
          width: 90vw;
        }
        
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid #ddd;
        }
        
        .modal-header h3 {
          margin: 0;
          color: #1976d2;
        }
        
        .close-btn {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #666;
        }
        
        .modal-body {
          padding: 20px;
        }
        
        .target-category {
          margin-bottom: 30px;
          padding: 15px;
          border: 1px solid #ddd;
          border-radius: 8px;
        }
        
        .target-category h4 {
          margin-bottom: 15px;
          color: #1976d2;
          font-size: 16px;
        }
        
        .month-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 15px;
        }
        
        .month-input {
          display: flex;
          flex-direction: column;
        }
        
        .month-input label {
          font-size: 12px;
          margin-bottom: 5px;
          font-weight: 500;
        }
        
        .month-input input {
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }
        
        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          padding: 20px;
          border-top: 1px solid #ddd;
        }
        
        @media (max-width: 768px) {
          .modal-content {
            width: 95vw;
            max-height: 95vh;
          }
          
          .month-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
          }
        }
        
        @media (max-width: 480px) {
          .month-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;