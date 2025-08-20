import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  getProjects, 
  getClients, 
  getUsers, 
  deleteProject
} from '../services/firestore';
import type { Project, Client, User } from '../types';

const ProjectManagement = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'project' | 'client'>('project');
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [projectsData, clientsData, usersData] = await Promise.all([
        getProjects(),
        getClients(),
        getUsers()
      ]);
      setProjects(projectsData);
      setClients(clientsData);
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
    setLoading(false);
  };

  const handleNewProject = () => {
    navigate('/action-log/record');
  };

  const handleAddLog = (project: Project) => {
    navigate('/action-log/record', {
      state: {
        projectId: project.id,
        title: project.title,
        clientName: project.clientName,
        productName: project.productName,
        proposalMenuId: project.proposalMenuId,
        assigneeId: project.assigneeId
      }
    });
  };

  const handleEditProject = (project: Project) => {
    // TODO: 編集機能の実装
    console.log('Edit project:', project);
  };

  const handleDeleteProject = async (id: string) => {
    if (confirm('この案件を削除しますか？')) {
      try {
        await deleteProject(id);
        loadData();
      } catch (error) {
        console.error('Error deleting project:', error);
      }
    }
  };

  const handleViewDetails = (project: Project) => {
    // TODO: 詳細表示機能の実装
    console.log('View details:', project);
  };

  const filteredProjects = projects.filter(project => {
    if (statusFilter && project.status !== statusFilter) return false;
    if (assigneeFilter && project.assigneeId !== assigneeFilter) return false;
    return true;
  });

  const groupedClients = clients.map(client => {
    const clientProjects = projects.filter(p => p.clientName === client.name);
    const latestProject = clientProjects.sort((a, b) => 
      (b.lastContactDate?.getTime() || 0) - (a.lastContactDate?.getTime() || 0)
    )[0];
    return {
      ...client,
      projectCount: clientProjects.length,
      latestStatus: latestProject?.status || '',
      lastContactDate: latestProject?.lastContactDate || null,
      assigneeName: users.find(u => u.id === latestProject?.assigneeId)?.name || ''
    };
  });

  return (
    <div className="project-management">
      <h1>案件管理</h1>
      
      <div className="actions">
        <button className="btn" onClick={handleNewProject}>+ 新規追加</button>
      </div>

      <div className="tab-container">
        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'project' ? 'active' : ''}`}
            onClick={() => setActiveTab('project')}
          >
            案件単位
          </button>
          <button 
            className={`tab ${activeTab === 'client' ? 'active' : ''}`}
            onClick={() => setActiveTab('client')}
          >
            クライアント単位
          </button>
        </div>
      </div>

      <div className="filters">
        <div className="filter-group">
          <label>ステータス:</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">全て</option>
            <option value="proposal">提案中</option>
            <option value="negotiation">交渉中</option>
            <option value="won">受注</option>
            <option value="lost">失注</option>
            <option value="active">稼働中</option>
            <option value="completed">稼働終了</option>
          </select>
        </div>
        <div className="filter-group">
          <label>担当者:</label>
          <select value={assigneeFilter} onChange={(e) => setAssigneeFilter(e.target.value)}>
            <option value="">全て</option>
            {users.map(user => (
              <option key={user.id} value={user.id}>{user.name}</option>
            ))}
          </select>
        </div>
      </div>

      {activeTab === 'project' && (
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>商材名</th>
                <th>提案メニュー</th>
                <th>クライアント</th>
                <th>担当者</th>
                <th>ステータス</th>
                <th>最終接触日</th>
                <th>アクション</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px' }}>
                    読み込み中...
                  </td>
                </tr>
              ) : filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px' }}>
                    案件がありません
                  </td>
                </tr>
              ) : (
                filteredProjects.map((project) => {
                  const user = users.find(u => u.id === project.assigneeId);
                  return (
                    <tr key={project.id}>
                      <td>{project.productName}</td>
                      <td>{project.proposalMenuId}</td>
                      <td>{project.clientName}</td>
                      <td>{user?.name || '-'}</td>
                      <td>
                        <span className={`status status-${project.status}`}>
                          {project.status === 'proposal' && '提案中'}
                          {project.status === 'negotiation' && '交渉中'}
                          {project.status === 'won' && '受注'}
                          {project.status === 'lost' && '失注'}
                          {project.status === 'active' && '稼働中'}
                          {project.status === 'completed' && '稼働終了'}
                        </span>
                      </td>
                      <td>{project.lastContactDate?.toLocaleDateString() || '-'}</td>
                      <td>
                        <button 
                          className="btn btn-sm btn-secondary"
                          onClick={() => handleViewDetails(project)}
                          style={{ marginRight: '5px' }}
                        >
                          詳細
                        </button>
                        <button 
                          className="btn btn-sm btn-secondary"
                          onClick={() => handleEditProject(project)}
                          style={{ marginRight: '5px' }}
                        >
                          編集
                        </button>
                        <button 
                          className="btn btn-sm"
                          onClick={() => handleAddLog(project)}
                          style={{ marginRight: '5px' }}
                        >
                          追加
                        </button>
                        <button 
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDeleteProject(project.id)}
                        >
                          削除
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'client' && (
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>クライアント名</th>
                <th>担当者</th>
                <th>ステータス</th>
                <th>最終接触日</th>
                <th>アクション</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '40px' }}>
                    読み込み中...
                  </td>
                </tr>
              ) : groupedClients.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '40px' }}>
                    クライアントがありません
                  </td>
                </tr>
              ) : (
                groupedClients.map((client) => (
                  <tr key={client.id}>
                    <td>{client.name}</td>
                    <td>{client.assigneeName || '-'}</td>
                    <td>
                      <span className={`status status-${client.latestStatus}`}>
                        {client.latestStatus === 'proposal' && '提案中'}
                        {client.latestStatus === 'negotiation' && '交渉中'}
                        {client.latestStatus === 'won' && '受注'}
                        {client.latestStatus === 'lost' && '失注'}
                        {client.latestStatus === 'active' && '稼働中'}
                        {client.latestStatus === 'completed' && '稼働終了'}
                        {!client.latestStatus && '-'}
                      </span>
                    </td>
                    <td>{client.lastContactDate?.toLocaleDateString() || '-'}</td>
                    <td>
                      <button 
                        className="btn btn-sm"
                        onClick={() => {
                          navigate('/action-log/record', {
                            state: { clientName: client.name }
                          });
                        }}
                      >
                        追加
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <style>{`
        .actions {
          margin-bottom: 20px;
        }
        
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
        
        .filters {
          display: flex;
          gap: 20px;
          margin-bottom: 20px;
          padding: 20px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .filter-group {
          display: flex;
          flex-direction: column;
        }
        
        .filter-group label {
          margin-bottom: 5px;
          font-weight: 500;
        }
        
        .filter-group select {
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }
        
        .btn-sm {
          padding: 6px 12px;
          font-size: 12px;
        }
        
        .status {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
        }
        
        .status-proposal {
          background-color: #e3f2fd;
          color: #1976d2;
        }
        
        .status-negotiation {
          background-color: #fff3e0;
          color: #f57c00;
        }
        
        .status-won {
          background-color: #e8f5e9;
          color: #2e7d32;
        }
        
        .status-lost {
          background-color: #ffebee;
          color: #c62828;
        }
        
        .status-active {
          background-color: #f3e5f5;
          color: #7b1fa2;
        }
        
        .status-completed {
          background-color: #e0e0e0;
          color: #616161;
        }
      `}</style>
    </div>
  );
};

export default ProjectManagement;