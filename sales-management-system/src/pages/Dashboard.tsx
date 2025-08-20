import { useState, useEffect } from 'react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  getProjects, getActionLogs, getPerformance, 
  getClients, getUsers, getSalesTargets,
  createSalesTarget, updateSalesTarget
} from '../services/firestore';
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
  
  // 過去12ヶ月の月リストを生成
  const generateLast12Months = () => {
    const months = [];
    for (let i = 0; i < 12; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      months.push(date.toISOString().substring(0, 7));
    }
    return months;
  };
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  
  // 月別選択用
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7));
  const [availableMonths] = useState<string[]>(generateLast12Months());
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
      let filteredProjects = projectsData;
      let filteredLogs = logsData;
      let filteredPerformance = performanceData;
      
      if (activeTab === 'personal' && selectedUser) {
        filteredProjects = projectsData.filter(p => p.assigneeId === selectedUser);
        filteredLogs = logsData.filter(l => l.assigneeId === selectedUser);
        // 実績データも担当者でフィルタリング
        filteredPerformance = performanceData.filter(perf => {
          const relatedProject = projectsData.find(p => 
            p.title === perf.projectName || p.productName === perf.projectName
          );
          return relatedProject?.assigneeId === selectedUser;
        });
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
      
      // 総売上・粗利計算
      const totalRevenue = filteredPerformance.reduce((sum, p) => sum + p.revenue, 0);
      const totalGrossProfit = filteredPerformance.reduce((sum, p) => sum + p.grossProfit, 0);
      
      // 稼働社数
      const activeClientsSet = new Set(filteredPerformance.map(p => p.clientName));
      const activeClients = activeClientsSet.size;
      
      // 客単価
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
      
      // 月別データ作成
      const monthlyMap = new Map<string, { revenue: number; grossProfit: number }>();
      filteredPerformance.forEach(p => {
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
      
      // YOYデータ作成
      const currentYear = new Date().getFullYear();
      const lastYear = currentYear - 1;
      const yoyMap = new Map<string, { current: number; last: number }>();
      
      filteredPerformance.forEach(p => {
        const year = parseInt(p.recordingMonth.substring(0, 4));
        if (year === currentYear || year === lastYear) {
          const client = p.clientName;
          if (!yoyMap.has(client)) {
            yoyMap.set(client, { current: 0, last: 0 });
          }
          const data = yoyMap.get(client)!;
          if (year === currentYear) {
            data.current += p.revenue;
          } else {
            data.last += p.revenue;
          }
        }
      });
      
      const yoyChartData = Array.from(yoyMap.entries())
        .map(([client, data]) => ({
          client: client.length > 10 ? client.substring(0, 10) + '...' : client,
          今年: data.current,
          昨年: data.last
        }))
        .sort((a, b) => b.今年 - a.今年)
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
    
    try {
      const [projectsData, logsData, performanceData, clientsData] = await Promise.all([
        getProjects(),
        getActionLogs(),
        getPerformance(),
        getClients()
      ]);
      
      // フィルタリング
      let filteredProjects = projectsData;
      let filteredLogs = logsData;
      let filteredPerformance = performanceData;
      
      if (activeTab === 'personal' && selectedUser) {
        filteredProjects = projectsData.filter(p => p.assigneeId === selectedUser);
        filteredLogs = logsData.filter(l => l.assigneeId === selectedUser);
        // 実績データも担当者でフィルタリング
        filteredPerformance = performanceData.filter(perf => {
          const relatedProject = projectsData.find(p => 
            p.title === perf.projectName || p.productName === perf.projectName
          );
          return relatedProject?.assigneeId === selectedUser;
        });
      }
      
      // 選択された月のデータのみにフィルタリング
      const monthlyPerformance = filteredPerformance.filter(p => 
        p.recordingMonth.startsWith(selectedMonth)
      );
      
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
      
      // 稼働社数
      const activeClientsSet = new Set(monthlyPerformance.map(p => p.clientName));
      const activeClients = activeClientsSet.size;
      
      // 客単価
      const averageOrderValue = activeClients > 0 ? totalGrossProfit / activeClients : 0;
      
      setMonthlyKpiData({
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
      });
      
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
              <div className="kpi-value">{loading ? '-' : kpiData.totalDeals}</div>
            </div>
            <div className="kpi-card">
              <h3>総受注数</h3>
              <div className="kpi-value">{loading ? '-' : kpiData.totalOrders}</div>
            </div>
            <div className="kpi-card">
              <h3>新規商談数</h3>
              <div className="kpi-value">{loading ? '-' : kpiData.newDeals}</div>
            </div>
            <div className="kpi-card">
              <h3>新規受注数</h3>
              <div className="kpi-value">{loading ? '-' : kpiData.newOrders}</div>
            </div>
            <div className="kpi-card">
              <h3>既存商談数</h3>
              <div className="kpi-value">{loading ? '-' : kpiData.existingDeals}</div>
            </div>
            <div className="kpi-card">
              <h3>既存受注数</h3>
              <div className="kpi-value">{loading ? '-' : kpiData.existingOrders}</div>
            </div>
            <div className="kpi-card">
              <h3>総粗利</h3>
              <div className="kpi-value">{loading ? '-' : `¥${kpiData.totalGrossProfit.toLocaleString()}`}</div>
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
                <div className="kpi-value">{monthlyKpiData.totalDeals}</div>
              </div>
              <div className="kpi-card">
                <h3>総受注数</h3>
                <div className="kpi-value">{monthlyKpiData.totalOrders}</div>
              </div>
              <div className="kpi-card">
                <h3>新規商談数</h3>
                <div className="kpi-value">{monthlyKpiData.newDeals}</div>
              </div>
              <div className="kpi-card">
                <h3>新規受注数</h3>
                <div className="kpi-value">{monthlyKpiData.newOrders}</div>
              </div>
              <div className="kpi-card">
                <h3>既存商談数</h3>
                <div className="kpi-value">{monthlyKpiData.existingDeals}</div>
              </div>
              <div className="kpi-card">
                <h3>既存受注数</h3>
                <div className="kpi-value">{monthlyKpiData.existingOrders}</div>
              </div>
              <div className="kpi-card">
                <h3>月粗利</h3>
                <div className="kpi-value">¥{monthlyKpiData.totalGrossProfit.toLocaleString()}</div>
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
          
          <div className="chart-section">
            <div className="card">
              <h3>月別 粗利推移</h3>
              {monthlyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => `¥${value.toLocaleString()}`} />
                    <Legend />
                    <Line type="monotone" dataKey="粗利" stroke="#82ca9d" />
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
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={yoyData} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="client" type="category" width={100} />
                    <Tooltip formatter={(value: number) => `¥${value.toLocaleString()}`} />
                    <Legend />
                    <Bar dataKey="今年" fill="#8884d8" />
                    <Bar dataKey="昨年" fill="#82ca9d" />
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
              <div className="kpi-value">{loading ? '-' : kpiData.totalDeals}</div>
            </div>
            <div className="kpi-card">
              <h3>総受注数</h3>
              <div className="kpi-value">{loading ? '-' : kpiData.totalOrders}</div>
            </div>
            <div className="kpi-card">
              <h3>新規商談数</h3>
              <div className="kpi-value">{loading ? '-' : kpiData.newDeals}</div>
            </div>
            <div className="kpi-card">
              <h3>新規受注数</h3>
              <div className="kpi-value">{loading ? '-' : kpiData.newOrders}</div>
            </div>
            <div className="kpi-card">
              <h3>既存商談数</h3>
              <div className="kpi-value">{loading ? '-' : kpiData.existingDeals}</div>
            </div>
            <div className="kpi-card">
              <h3>既存受注数</h3>
              <div className="kpi-value">{loading ? '-' : kpiData.existingOrders}</div>
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
              <div className="kpi-value">{monthlyKpiData.totalDeals}</div>
            </div>
            <div className="kpi-card">
              <h3>総受注数</h3>
              <div className="kpi-value">{monthlyKpiData.totalOrders}</div>
            </div>
            <div className="kpi-card">
              <h3>新規商談数</h3>
              <div className="kpi-value">{monthlyKpiData.newDeals}</div>
            </div>
            <div className="kpi-card">
              <h3>新規受注数</h3>
              <div className="kpi-value">{monthlyKpiData.newOrders}</div>
            </div>
            <div className="kpi-card">
              <h3>既存商談数</h3>
              <div className="kpi-value">{monthlyKpiData.existingDeals}</div>
            </div>
            <div className="kpi-card">
              <h3>既存受注数</h3>
              <div className="kpi-value">{monthlyKpiData.existingOrders}</div>
            </div>
            <div className="kpi-card">
              <h3>月粗利</h3>
              <div className="kpi-value">¥{monthlyKpiData.totalGrossProfit.toLocaleString()}</div>
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
          grid-template-columns: 1fr 1fr;
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