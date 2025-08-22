import { useState, useEffect } from 'react';
import { getUsers, getSalesTargets, createSalesTarget, updateSalesTarget } from '../services/firestore';
import type { User, SalesTarget } from '../types';

const KPIManagement = () => {
  const [selectedUser, setSelectedUser] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [existingTargets, setExistingTargets] = useState<SalesTarget[]>([]);
  const [loading, setLoading] = useState(false);
  const [targets, setTargets] = useState({
    newDeals: Array(12).fill(''),
    newOrders: Array(12).fill(''),
    existingDeals: Array(12).fill(''),
    existingOrders: Array(12).fill(''),
    grossProfitBudget: Array(12).fill('')
  });

  const months = [
    '1月', '2月', '3月', '4月', '5月', '6月',
    '7月', '8月', '9月', '10月', '11月', '12月'
  ];

  const handleTargetChange = (type: string, monthIndex: number, value: string) => {
    // 空文字の場合は空文字のまま、それ以外はparseIntまたは元の値を保持
    const numValue = value === '' ? '' : (parseInt(value) || '');
    setTargets(prev => ({
      ...prev,
      [type]: prev[type as keyof typeof prev].map((val: any, index: number) => 
        index === monthIndex ? numValue : val
      )
    }));
  };

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (selectedUser) {
      loadTargets(selectedUser);
    }
  }, [selectedUser]);

  const loadUsers = async () => {
    try {
      const usersData = await getUsers();
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadTargets = async (userId: string) => {
    try {
      const targetsData = await getSalesTargets(userId);
      setExistingTargets(targetsData);
      
      // 既存の目標を読み込み
      const newTargets = {
        newDeals: Array(12).fill(''),
        newOrders: Array(12).fill(''),
        existingDeals: Array(12).fill(''),
        existingOrders: Array(12).fill(''),
        grossProfitBudget: Array(12).fill('')
      };
      
      const currentYear = new Date().getFullYear();
      targetsData.forEach(target => {
        if (target.year === currentYear && target.month >= 1 && target.month <= 12) {
          const index = target.month - 1;
          // 0の場合は空文字、それ以外は数値をそのまま設定
          newTargets.newDeals[index] = target.newDeals || '';
          newTargets.newOrders[index] = target.newOrders || '';
          newTargets.existingDeals[index] = target.existingDeals || '';
          newTargets.existingOrders[index] = target.existingOrders || '';
          newTargets.grossProfitBudget[index] = target.grossProfitBudget || '';
        }
      });
      
      setTargets(newTargets);
    } catch (error) {
      console.error('Error loading targets:', error);
    }
  };

  const handleSave = async () => {
    if (!selectedUser) {
      alert('担当者を選択してください');
      return;
    }
    
    setLoading(true);
    const currentYear = new Date().getFullYear();
    
    try {
      for (let month = 1; month <= 12; month++) {
        const index = month - 1;
        const targetData: Omit<SalesTarget, 'id'> = {
          userId: selectedUser,
          year: currentYear,
          month,
          newDeals: Number(targets.newDeals[index]) || 0,
          newOrders: Number(targets.newOrders[index]) || 0,
          existingDeals: Number(targets.existingDeals[index]) || 0,
          existingOrders: Number(targets.existingOrders[index]) || 0,
          grossProfitBudget: Number(targets.grossProfitBudget[index]) || 0
        };
        
        // 既存のターゲットを検索
        const existing = existingTargets.find(
          t => t.userId === selectedUser && t.year === currentYear && t.month === month
        );
        
        if (existing) {
          await updateSalesTarget(existing.id, targetData);
        } else {
          await createSalesTarget(targetData);
        }
      }
      
      alert('目標を保存しました');
      loadTargets(selectedUser);
    } catch (error) {
      console.error('Error saving targets:', error);
      alert('保存に失敗しました');
    }
    
    setLoading(false);
  };

  return (
    <div className="kpi-management">
      <h1>KPI管理</h1>
      
      <div className="card">
        <div className="form-group">
          <label htmlFor="user">担当者選択</label>
          <select
            id="user"
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
          >
            <option value="">選択してください</option>
            {users.map(user => (
              <option key={user.id} value={user.id}>{user.name}</option>
            ))}
          </select>
        </div>

        {selectedUser && (
          <div className="targets-section">
            <h2>目標設定</h2>
            
            <div className="target-category">
              <h3>新規商談数</h3>
              <div className="month-grid">
                {months.map((month, index) => (
                  <div key={index} className="month-input">
                    <label>{month}</label>
                    <input
                      type="number"
                      value={targets.newDeals[index]}
                      onChange={(e) => handleTargetChange('newDeals', index, e.target.value)}
                      min="0"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="target-category">
              <h3>新規受注数</h3>
              <div className="month-grid">
                {months.map((month, index) => (
                  <div key={index} className="month-input">
                    <label>{month}</label>
                    <input
                      type="number"
                      value={targets.newOrders[index]}
                      onChange={(e) => handleTargetChange('newOrders', index, e.target.value)}
                      min="0"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="target-category">
              <h3>既存商談数</h3>
              <div className="month-grid">
                {months.map((month, index) => (
                  <div key={index} className="month-input">
                    <label>{month}</label>
                    <input
                      type="number"
                      value={targets.existingDeals[index]}
                      onChange={(e) => handleTargetChange('existingDeals', index, e.target.value)}
                      min="0"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="target-category">
              <h3>既存受注数</h3>
              <div className="month-grid">
                {months.map((month, index) => (
                  <div key={index} className="month-input">
                    <label>{month}</label>
                    <input
                      type="number"
                      value={targets.existingOrders[index]}
                      onChange={(e) => handleTargetChange('existingOrders', index, e.target.value)}
                      min="0"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="target-category">
              <h3>粗利BGT（円）</h3>
              <div className="month-grid">
                {months.map((month, index) => (
                  <div key={index} className="month-input">
                    <label>{month}</label>
                    <input
                      type="number"
                      value={targets.grossProfitBudget[index]}
                      onChange={(e) => handleTargetChange('grossProfitBudget', index, e.target.value)}
                      min="0"
                      placeholder="0"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="form-actions">
              <button 
                onClick={handleSave} 
                className="btn"
                disabled={loading}
              >
                {loading ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        )}
      </div>
      
      <style>{`
        .targets-section {
          margin-top: 30px;
        }
        
        .target-category {
          margin-bottom: 30px;
          padding: 20px;
          border: 1px solid #ddd;
          border-radius: 8px;
        }
        
        .target-category h3 {
          margin-bottom: 15px;
          color: #1976d2;
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
        
        .form-actions {
          display: flex;
          justify-content: flex-end;
          margin-top: 30px;
        }
        
        @media (max-width: 768px) {
          .month-grid {
            grid-template-columns: repeat(3, 1fr);
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

export default KPIManagement;