import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  createActionLog,
  createProject,
  updateProject,
  getProjects,
  getUsers,
  getProposalMenus,
  createClient,
  getClients,
  createOrder,
  getOrders
} from '../services/firestore';
import type { User, ProposalMenu, Project } from '../types';

const ActionLogRecord = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as any;
  
  const [users, setUsers] = useState<User[]>([]);
  const [proposalMenus, setProposalMenus] = useState<ProposalMenu[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    title: locationState?.title || '',
    clientName: locationState?.clientName || '',
    productName: locationState?.productName || '',
    proposalMenus: locationState?.proposalMenuIds || [],
    assignee: locationState?.assigneeId || '',
    actionDate: '',
    nextActionDate: '',
    minutes: '',
    nextAction: '',
    status: '',
    summary: '',
    performanceType: 'unselected' as 'unselected' | 'new' | 'existing'
  });
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [usersData, menusData, projectsData] = await Promise.all([
        getUsers(),
        getProposalMenus(),
        getProjects()
      ]);
      setUsers(usersData);
      setProposalMenus(menusData);
      setProjects(projectsData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const createOrderIfNotExists = async (projectId: string, projectData: any) => {
    try {
      console.log('受注データ作成処理開始:', { projectId, projectData });
      
      // 既存の受注データをチェック
      const existingOrders = await getOrders();
      console.log('既存受注データ数:', existingOrders.length);
      const existingOrder = existingOrders.find(order => order.projectId === projectId);
      
      if (existingOrder) {
        console.log('受注データは既に存在します:', existingOrder.id);
        return;
      }

      // クライアントタイプを判定
      const clients = await getClients();
      const client = clients.find(c => c.name === projectData.clientName);
      const clientType: 'new' | 'existing' | '-' = client 
        ? (client.status === 'new' ? 'new' : 'existing')
        : '-';

      // 受注データを作成
      const proposalMenuNames = projectData.proposalMenuIds 
        ? projectData.proposalMenuIds
            .map((id: string) => proposalMenus.find(menu => menu.id === id)?.name)
            .filter(Boolean)
            .join(', ')
        : proposalMenus.find(menu => menu.id === projectData.proposalMenuId)?.name || '';
      
      const orderData: any = {
        projectId: projectId,
        clientId: projectData.clientId || '',
        clientName: projectData.clientName,
        projectTitle: projectData.title || projectData.productName || 'タイトル未設定',
        assigneeId: projectData.assigneeId,
        orderDate: new Date(),
        proposalMenu: proposalMenuNames,
        clientType: clientType
        // implementationMonth, revenue, cost, grossProfit は undefined なので省略
      };

      console.log('受注データを作成中:', orderData);
      await createOrder(orderData);
      console.log('受注データを自動作成しました:', projectData.clientName, '-', projectData.title || projectData.productName);
    } catch (error) {
      console.error('受注データ作成エラー:', error);
      // エラーが発生してもログ作成は成功として処理を続行
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // クライアントが存在しない場合は作成
      const clients = await getClients();
      let client = clients.find(c => c.name === formData.clientName);
      if (!client) {
        await createClient({
          name: formData.clientName,
          status: 'new'
        });
      }
      
      // プロジェクトを検索または作成
      let project = projects.find(p => 
        p.clientName === formData.clientName && 
        p.productName === formData.productName
      );
      
      let projectId: string;
      let projectData: any;
      const newStatus = formData.status ? formData.status as 'proposal' | 'negotiation' | 'lost' | 'won' | 'active' | 'completed' : undefined;
      
      if (project) {
        // 既存プロジェクトを更新
        const updateData = {
          status: newStatus,
          lastContactDate: new Date(formData.actionDate)
        };
        await updateProject(project.id, updateData);
        
        projectId = project.id;
        projectData = {
          ...project,
          ...updateData,
          clientId: client?.id || project.clientId
        };

        // ステータスが'won'（受注）に変更された場合、受注データを自動作成
        if (newStatus === 'won' && project.status !== 'won') {
          await createOrderIfNotExists(projectId, projectData);
        }
      } else {
        // 新規プロジェクトを作成
        projectData = {
          title: formData.title,
          clientId: client?.id || '',
          clientName: formData.clientName,
          productName: formData.productName,
          proposalMenuId: formData.proposalMenus[0] || '', // 後方互換性
          proposalMenuIds: formData.proposalMenus,
          assigneeId: formData.assignee,
          status: newStatus || 'proposal',
          createdAt: new Date(),
          lastContactDate: new Date(formData.actionDate)
        };
        
        projectId = await createProject(projectData);

        // 新規プロジェクトがいきなり'won'（受注）の場合、受注データを自動作成
        if (newStatus === 'won') {
          await createOrderIfNotExists(projectId, { ...projectData, clientId: client?.id });
        }
      }
      
      // アクションログを保存
      await createActionLog({
        projectId,
        title: formData.title,
        assigneeId: formData.assignee,
        actionDate: new Date(formData.actionDate),
        nextActionDate: formData.nextActionDate ? new Date(formData.nextActionDate) : undefined,
        minutes: formData.minutes,
        nextAction: formData.nextAction,
        status: formData.status,
        summary: formData.summary,
        performanceType: formData.performanceType,
        createdAt: new Date()
      });
      
      navigate('/action-log/list');
    } catch (error) {
      console.error('Error saving action log:', error);
      alert('保存に失敗しました');
    }
    setLoading(false);
  };
  
  const handleCancel = () => {
    navigate(-1);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const toggleProposalMenu = (menuId: string) => {
    setFormData(prev => ({
      ...prev,
      proposalMenus: prev.proposalMenus.includes(menuId)
        ? prev.proposalMenus.filter((id: string) => id !== menuId)
        : [...prev.proposalMenus, menuId]
    }));
  };
  
  const getSelectedMenuNames = () => {
    return proposalMenus
      .filter((menu: ProposalMenu) => formData.proposalMenus.includes(menu.id))
      .map((menu: ProposalMenu) => menu.name)
      .join(', ');
  };

  return (
    <div className="action-log-record">
      <h1>ログ記録</h1>
      
      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="title">タイトル</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="clientName">クライアント名 <span className="required">*</span></label>
              <input
                type="text"
                id="clientName"
                name="clientName"
                value={formData.clientName}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="productName">商材名 <span className="required">*</span></label>
              <input
                type="text"
                id="productName"
                name="productName"
                value={formData.productName}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="proposalMenu">提案メニュー <span className="required">*</span></label>
              <div className="multi-select-dropdown">
                <div 
                  className="dropdown-header"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                  {formData.proposalMenus.length > 0 
                    ? `${formData.proposalMenus.length}個選択中: ${getSelectedMenuNames()}`
                    : '選択してください'
                  }
                  <span className="dropdown-arrow">{isDropdownOpen ? '▲' : '▼'}</span>
                </div>
                {isDropdownOpen && (
                  <div className="dropdown-list">
                    {proposalMenus.map(menu => (
                      <label key={menu.id} className="checkbox-item">
                        <input
                          type="checkbox"
                          checked={formData.proposalMenus.includes(menu.id)}
                          onChange={() => toggleProposalMenu(menu.id)}
                        />
                        <span>{menu.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="assignee">担当者 <span className="required">*</span></label>
              <select
                id="assignee"
                name="assignee"
                value={formData.assignee}
                onChange={handleInputChange}
                required
              >
                <option value="">選択してください</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="actionDate">アクション日 <span className="required">*</span></label>
              <input
                type="date"
                id="actionDate"
                name="actionDate"
                value={formData.actionDate}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="nextActionDate">次回アクション日</label>
              <input
                type="date"
                id="nextActionDate"
                name="nextActionDate"
                value={formData.nextActionDate}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="status">ステータス</label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
              >
                <option value="">選択してください</option>
                <option value="proposal">提案中</option>
                <option value="negotiation">交渉中</option>
                <option value="won">受注</option>
                <option value="lost">失注</option>
                <option value="active">稼働中</option>
                <option value="completed">稼働終了</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="performanceType">実績</label>
              <select
                id="performanceType"
                name="performanceType"
                value={formData.performanceType}
                onChange={handleInputChange}
              >
                <option value="unselected">未選択</option>
                <option value="new">新規</option>
                <option value="existing">既存</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="minutes">議事録</label>
            <textarea
              id="minutes"
              name="minutes"
              value={formData.minutes}
              onChange={handleInputChange}
              rows={5}
            />
          </div>

          <div className="form-group">
            <label htmlFor="nextAction">次回アクション</label>
            <textarea
              id="nextAction"
              name="nextAction"
              value={formData.nextAction}
              onChange={handleInputChange}
              rows={3}
            />
          </div>

          <div className="form-group">
            <label htmlFor="summary">要約</label>
            <textarea
              id="summary"
              name="summary"
              value={formData.summary}
              onChange={handleInputChange}
              rows={3}
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn" disabled={loading}>
              {loading ? '保存中...' : '保存'}
            </button>
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={handleCancel}
              disabled={loading}
            >
              キャンセル
            </button>
          </div>
        </form>
      </div>

      <style>{`
        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 20px;
        }
        
        .form-actions {
          display: flex;
          gap: 10px;
          justify-content: flex-end;
          margin-top: 30px;
        }
        
        .required {
          color: #d32f2f;
        }
        
        .multi-select-dropdown {
          position: relative;
          width: 100%;
        }
        
        .dropdown-header {
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          background: #ffffff;
          cursor: pointer;
          display: flex;
          justify-content: space-between;
          align-items: center;
          min-height: 40px;
        }
        
        .dropdown-header:hover {
          background: #f8f9fa;
        }
        
        .dropdown-arrow {
          margin-left: 10px;
          font-size: 12px;
          color: #666;
        }
        
        .dropdown-list {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          border: 1px solid #ddd;
          border-top: none;
          border-radius: 0 0 4px 4px;
          background: #ffffff;
          max-height: 200px;
          overflow-y: auto;
          z-index: 1000;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .checkbox-item {
          display: flex;
          align-items: center;
          padding: 8px 12px;
          cursor: pointer;
          transition: background 0.2s;
        }
        
        .checkbox-item:hover {
          background: #f8f9fa;
        }
        
        .checkbox-item input[type="checkbox"] {
          margin-right: 8px;
          cursor: pointer;
        }
        
        .checkbox-item span {
          cursor: pointer;
          user-select: none;
        }
        
        @media (max-width: 768px) {
          .form-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default ActionLogRecord;