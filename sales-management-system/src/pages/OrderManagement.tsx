import { useState, useEffect } from 'react';
import { 
  getOrders, 
  getUsers,
  getProposalMenus,
  updateOrder,
  getProjects,
  getClients
} from '../services/firestore';
import type { Order, User, ProposalMenu, Project, Client } from '../types';

const OrderManagement = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [proposalMenus, setProposalMenus] = useState<ProposalMenu[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingOrder, setEditingOrder] = useState<string | null>(null);
  const [editMonth, setEditMonth] = useState<{ [key: string]: string }>({});
  
  // フィルター用のstate
  const [assigneeFilter, setAssigneeFilter] = useState<string>('');
  const [startDateFilter, setStartDateFilter] = useState<string>('');
  const [endDateFilter, setEndDateFilter] = useState<string>('');
  const [proposalMenuFilter, setProposalMenuFilter] = useState<string>('');
  const [implementationMonthFilter, setImplementationMonthFilter] = useState<string>('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      console.log('=== 受注管理データ読み込み開始 ===');
      const [ordersData, usersData, menusData, projectsData, clientsData] = await Promise.all([
        getOrders(),
        getUsers(),
        getProposalMenus(),
        getProjects(),
        getClients()
      ]);
      console.log('取得した受注データ:', ordersData);
      console.log('受注データ件数:', ordersData.length);
      
      setOrders(ordersData);
      setUsers(usersData);
      setProposalMenus(menusData);
      setProjects(projectsData);
      setClients(clientsData);
      
      // 実施月の初期値を設定
      const monthValues: { [key: string]: string } = {};
      ordersData.forEach(order => {
        monthValues[order.id] = order.implementationMonth || '';
      });
      setEditMonth(monthValues);
      console.log('=== 受注管理データ読み込み完了 ===');
    } catch (error) {
      console.error('Error loading data:', error);
    }
    setLoading(false);
  };

  const handleEditMonth = (orderId: string) => {
    setEditingOrder(orderId);
  };

  const handleSaveMonth = async (orderId: string) => {
    try {
      // 明示的にimplementationMonthのみを含むオブジェクトを作成
      const updateData = {
        implementationMonth: editMonth[orderId]
      };
      
      await updateOrder(orderId, updateData);
      setEditingOrder(null);
      loadData();
    } catch (error) {
      console.error('Error updating order:', error);
    }
  };

  const handleCancelEdit = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (order) {
      setEditMonth(prev => ({
        ...prev,
        [orderId]: order.implementationMonth || ''
      }));
    }
    setEditingOrder(null);
  };

  // クライアントタイプを判定する関数
  const getClientType = (clientName: string): 'new' | 'existing' | '-' => {
    const client = clients.find(c => c.name === clientName);
    if (!client) return '-';
    return client.status === 'new' ? 'new' : 'existing';
  };

  // フィルター処理
  const filteredOrders = orders.filter(order => {
    // 担当者フィルター
    if (assigneeFilter && order.assigneeId !== assigneeFilter) return false;
    
    // 受注日フィルター（開始日）
    if (startDateFilter) {
      const project = projects.find(p => p.id === order.projectId);
      if (!project?.orderDate) return false; // 受注日未設定は除外
      const startDate = new Date(startDateFilter);
      if (project.orderDate < startDate) return false;
    }
    
    // 受注日フィルター（終了日）
    if (endDateFilter) {
      const project = projects.find(p => p.id === order.projectId);
      if (!project?.orderDate) return false; // 受注日未設定は除外
      const endDate = new Date(endDateFilter + 'T23:59:59');
      if (project.orderDate > endDate) return false;
    }
    
    // 提案メニューフィルター
    if (proposalMenuFilter && order.proposalMenu !== proposalMenuFilter) return false;
    
    // 実施月フィルター
    if (implementationMonthFilter && order.implementationMonth !== implementationMonthFilter) return false;
    
    return true;
  });

  return (
    <div className="order-management">
      <h1>受注管理</h1>
      
      <div className="filters" style={{ marginBottom: '20px', padding: '15px', background: '#f5f5f5', borderRadius: '8px' }}>
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="filter-group">
            <label style={{ marginRight: '5px' }}>担当者:</label>
            <select value={assigneeFilter} onChange={(e) => setAssigneeFilter(e.target.value)}>
              <option value="">全て</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>{user.name}</option>
              ))}
            </select>
          </div>
          
          <div className="filter-group">
            <label style={{ marginRight: '5px' }}>受注日:</label>
            <input 
              type="date" 
              value={startDateFilter}
              onChange={(e) => setStartDateFilter(e.target.value)}
              style={{ marginRight: '5px' }}
            />
            〜
            <input 
              type="date" 
              value={endDateFilter}
              onChange={(e) => setEndDateFilter(e.target.value)}
              style={{ marginLeft: '5px' }}
            />
          </div>
          
          <div className="filter-group">
            <label style={{ marginRight: '5px' }}>提案メニュー:</label>
            <select value={proposalMenuFilter} onChange={(e) => setProposalMenuFilter(e.target.value)}>
              <option value="">全て</option>
              {proposalMenus.map(menu => (
                <option key={menu.id} value={menu.id}>{menu.name}</option>
              ))}
            </select>
          </div>
          
          <div className="filter-group">
            <label style={{ marginRight: '5px' }}>実施月:</label>
            <input 
              type="month" 
              value={implementationMonthFilter}
              onChange={(e) => setImplementationMonthFilter(e.target.value)}
            />
          </div>
          
          <button 
            className="btn btn-sm btn-secondary"
            onClick={() => {
              setAssigneeFilter('');
              setStartDateFilter('');
              setEndDateFilter('');
              setProposalMenuFilter('');
              setImplementationMonthFilter('');
            }}
          >
            フィルタークリア
          </button>
        </div>
      </div>
      
      <div className="summary-stats">
        <div className="stat-card">
          <h3>受注件数</h3>
          <div className="stat-value">
            {filteredOrders.length}件
            {assigneeFilter || startDateFilter || endDateFilter || proposalMenuFilter || implementationMonthFilter ? (
              <span style={{ fontSize: '14px', color: '#666' }}>
                （全{orders.length}件中）
              </span>
            ) : null}
          </div>
          {orders.length === 0 && (
            <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
              コンソールでデバッグログを確認してください
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>受注したクライアント名</th>
              <th>区分</th>
              <th>担当者名</th>
              <th>受注日</th>
              <th>最終接触日</th>
              <th>提案メニュー</th>
              <th>実施月</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '40px' }}>
                  読み込み中...
                </td>
              </tr>
            ) : filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '40px' }}>
                  {orders.length === 0 ? '受注データがありません' : 'フィルター条件に一致するデータがありません'}
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => {
                const user = users.find(u => u.id === order.assigneeId);
                const menu = proposalMenus.find(m => m.id === order.proposalMenu);
                const project = projects.find(p => p.id === order.projectId);
                const clientType = getClientType(order.clientName);
                return (
                  <tr key={order.id}>
                    <td>{order.clientName}</td>
                    <td>
                      <span 
                        className={`badge ${
                          clientType === 'new' ? 'badge-success' : 
                          clientType === 'existing' ? 'badge-primary' : 
                          'badge-secondary'
                        }`}
                      >
                        {clientType === 'new' ? '新規' : 
                         clientType === 'existing' ? '既存' : 
                         '-'}
                      </span>
                    </td>
                    <td>{user?.name || '-'}</td>
                    <td>{project?.orderDate ? project.orderDate.toLocaleDateString() : '-'}</td>
                    <td>{project?.lastContactDate ? project.lastContactDate.toLocaleDateString() : '-'}</td>
                    <td>{menu?.name || order.proposalMenu}</td>
                    <td>
                      {editingOrder === order.id ? (
                        <div style={{ display: 'flex', gap: '5px' }}>
                          <input
                            type="month"
                            value={editMonth[order.id] || ''}
                            onChange={(e) => setEditMonth(prev => ({
                              ...prev,
                              [order.id]: e.target.value
                            }))}
                            style={{ fontSize: '12px', padding: '2px' }}
                          />
                          <button 
                            className="btn btn-sm"
                            onClick={() => handleSaveMonth(order.id)}
                          >
                            保存
                          </button>
                          <button 
                            className="btn btn-sm btn-secondary"
                            onClick={() => handleCancelEdit(order.id)}
                          >
                            キャンセル
                          </button>
                        </div>
                      ) : (
                        <div>
                          {order.implementationMonth || '-'}
                          <button 
                            className="btn btn-sm btn-secondary"
                            onClick={() => handleEditMonth(order.id)}
                            style={{ marginLeft: '10px' }}
                          >
                            編集
                          </button>
                        </div>
                      )}
                    </td>
                    <td>
                      {order.revenue && (
                        <div style={{ fontSize: '12px' }}>
                          売上: ¥{order.revenue.toLocaleString()}<br/>
                          粗利: ¥{(order.grossProfit || 0).toLocaleString()}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      
      <style>{`
        .summary-stats {
          display: flex;
          gap: 20px;
          margin-bottom: 20px;
        }
        
        .stat-card {
          background: #ffffff;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          text-align: center;
          min-width: 150px;
        }
        
        .stat-card h3 {
          margin-bottom: 10px;
          color: #666;
          font-size: 14px;
        }
        
        .stat-value {
          font-size: 24px;
          font-weight: bold;
          color: #1976d2;
        }
        
        .btn-sm {
          padding: 4px 8px;
          font-size: 11px;
        }
      `}</style>
    </div>
  );
};

export default OrderManagement;