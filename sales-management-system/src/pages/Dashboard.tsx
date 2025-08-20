import { useState, useEffect } from 'react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  getProjects, getOrders, getActionLogs, getPerformance, 
  getClients, getUsers 
} from '../services/firestore';
import type { User } from '../types';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState<'personal' | 'department' | 'overall'>('overall');
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  
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
  
  const loadData = async () => {
    setLoading(true);
    try {
      const [projectsData, ordersData, logsData, performanceData, clientsData, usersData] = await Promise.all([
        getProjects(),
        getOrders(),
        getActionLogs(),
        getPerformance(),
        getClients(),
        getUsers()
      ]);
      
      setUsers(usersData);
      
      // フィルタリング
      let filteredProjects = projectsData;
      let filteredOrders = ordersData;
      let filteredLogs = logsData;
      let filteredPerformance = performanceData;
      
      if (activeTab === 'personal' && selectedUser) {
        filteredProjects = projectsData.filter(p => p.assigneeId === selectedUser);
        filteredOrders = ordersData.filter(o => o.assigneeId === selectedUser);
        filteredLogs = logsData.filter(l => l.assigneeId === selectedUser);
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
        totalOrders: filteredOrders.length,
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
          売上: data.revenue,
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
          <h2>サマリー（全体）</h2>
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
              <h3>総売上</h3>
              <div className="kpi-value">{loading ? '-' : `¥${kpiData.totalRevenue.toLocaleString()}`}</div>
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
          
          <div className="chart-section">
            <div className="card">
              <h3>月別 売上・粗利推移</h3>
              {monthlyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => `¥${value.toLocaleString()}`} />
                    <Legend />
                    <Line type="monotone" dataKey="売上" stroke="#8884d8" />
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
          <h2>サマリー（個人）</h2>
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
        
        @media (max-width: 768px) {
          .chart-section {
            grid-template-columns: 1fr;
          }
          
          .kpi-grid {
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;