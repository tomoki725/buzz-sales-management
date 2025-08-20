import { useState, useEffect } from 'react';
import { 
  getOrders, 
  getUsers,
  getProposalMenus,
  updateOrder
} from '../services/firestore';
import type { Order, User, ProposalMenu } from '../types';

const OrderManagement = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [proposalMenus, setProposalMenus] = useState<ProposalMenu[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingOrder, setEditingOrder] = useState<string | null>(null);
  const [editMonth, setEditMonth] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [ordersData, usersData, menusData] = await Promise.all([
        getOrders(),
        getUsers(),
        getProposalMenus()
      ]);
      setOrders(ordersData);
      setUsers(usersData);
      setProposalMenus(menusData);
      
      // 実施月の初期値を設定
      const monthValues: { [key: string]: string } = {};
      ordersData.forEach(order => {
        monthValues[order.id] = order.implementationMonth || '';
      });
      setEditMonth(monthValues);
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
      await updateOrder(orderId, {
        implementationMonth: editMonth[orderId]
      });
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

  return (
    <div className="order-management">
      <h1>受注管理</h1>
      
      <div className="summary-stats">
        <div className="stat-card">
          <h3>受注件数</h3>
          <div className="stat-value">{orders.length}件</div>
        </div>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>受注した新規クライアント名</th>
              <th>担当者名</th>
              <th>確定日</th>
              <th>提案メニュー</th>
              <th>実施月</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '40px' }}>
                  読み込み中...
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '40px' }}>
                  受注データがありません
                </td>
              </tr>
            ) : (
              orders.map((order) => {
                const user = users.find(u => u.id === order.assigneeId);
                const menu = proposalMenus.find(m => m.id === order.proposalMenu);
                return (
                  <tr key={order.id}>
                    <td>{order.clientName}</td>
                    <td>{user?.name || '-'}</td>
                    <td>{order.orderDate.toLocaleDateString()}</td>
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
          background: white;
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