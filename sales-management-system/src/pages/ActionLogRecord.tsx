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
  getClients
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
    proposalMenu: locationState?.proposalMenuId || '',
    assignee: locationState?.assigneeId || '',
    actionDate: '',
    nextActionDate: '',
    minutes: '',
    nextAction: '',
    status: '',
    summary: '',
    performanceType: 'unselected' as 'unselected' | 'new' | 'existing'
  });

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
      if (project) {
        // 既存プロジェクトを更新
        await updateProject(project.id, {
          status: formData.status ? formData.status as 'proposal' | 'negotiation' | 'lost' | 'won' | 'active' | 'completed' : undefined,
          lastContactDate: new Date(formData.actionDate)
        });
        projectId = project.id;
      } else {
        // 新規プロジェクトを作成
        projectId = await createProject({
          title: formData.title,
          clientId: client?.id || '',
          clientName: formData.clientName,
          productName: formData.productName,
          proposalMenuId: formData.proposalMenu,
          assigneeId: formData.assignee,
          status: formData.status ? formData.status as 'proposal' | 'negotiation' | 'lost' | 'won' | 'active' | 'completed' : 'proposal',
          createdAt: new Date(),
          lastContactDate: new Date(formData.actionDate)
        });
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
              <select
                id="proposalMenu"
                name="proposalMenu"
                value={formData.proposalMenu}
                onChange={handleInputChange}
                required
              >
                <option value="">選択してください</option>
                {proposalMenus.map(menu => (
                  <option key={menu.id} value={menu.id}>{menu.name}</option>
                ))}
              </select>
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
              <label htmlFor="nextActionDate">次回アクション日 <span className="required">*</span></label>
              <input
                type="date"
                id="nextActionDate"
                name="nextActionDate"
                value={formData.nextActionDate}
                onChange={handleInputChange}
                required
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
            <label htmlFor="nextAction">次回アクション <span className="required">*</span></label>
            <textarea
              id="nextAction"
              name="nextAction"
              value={formData.nextAction}
              onChange={handleInputChange}
              rows={3}
              required
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