import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  getProjects, 
  getClients, 
  getUsers, 
  deleteProject,
  getActionLogs,
  getProposalMenus,
  updateProject
} from '../services/firestore';
import type { Project, Client, User, ActionLog, ProposalMenu } from '../types';

const ProjectManagement = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'project' | 'client'>('project');
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [actionLogs, setActionLogs] = useState<ActionLog[]>([]);
  const [proposalMenus, setProposalMenus] = useState<ProposalMenu[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('');
  const [expandedClients, setExpandedClients] = useState<Set<string>>(new Set());
  
  // モーダル関連の状態
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Project>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [projectsData, clientsData, usersData, actionLogsData, proposalMenusData] = await Promise.all([
        getProjects(),
        getClients(),
        getUsers(),
        getActionLogs(),
        getProposalMenus()
      ]);
      setProjects(projectsData);
      setClients(clientsData);
      setUsers(usersData);
      setActionLogs(actionLogsData);
      setProposalMenus(proposalMenusData);
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
    setSelectedProject(project);
    setEditFormData(project);
    setShowEditModal(true);
  };

  const handleSaveProject = async () => {
    if (!selectedProject) return;
    
    try {
      await updateProject(selectedProject.id, {
        title: editFormData.title || selectedProject.title,
        productName: editFormData.productName || selectedProject.productName,
        status: editFormData.status || selectedProject.status,
      });
      setShowEditModal(false);
      loadData();
    } catch (error) {
      console.error('Error updating project:', error);
      alert('更新に失敗しました');
    }
  };

  const handleCloseModals = () => {
    setShowDetailModal(false);
    setShowEditModal(false);
    setSelectedProject(null);
    setEditFormData({});
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
    setSelectedProject(project);
    setShowDetailModal(true);
  };

  const toggleClientExpansion = (clientId: string) => {
    setExpandedClients(prev => {
      const newSet = new Set(prev);
      if (newSet.has(clientId)) {
        newSet.delete(clientId);
      } else {
        newSet.add(clientId);
      }
      return newSet;
    });
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
    
    // プロジェクトに詳細情報を追加
    const enrichedProjects = clientProjects.map(project => {
      const user = users.find(u => u.id === project.assigneeId);
      const proposalMenu = proposalMenus.find(menu => menu.id === project.proposalMenuId);
      const latestActionLog = actionLogs
        .filter(log => log.projectId === project.id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
      
      return {
        ...project,
        userName: user?.name || '-',
        proposalMenuName: proposalMenu?.name || '-',
        performanceType: latestActionLog?.performanceType
      };
    });
    
    return {
      ...client,
      projects: enrichedProjects,
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
                <th>実績</th>
                <th>最終接触日</th>
                <th>アクション</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '40px' }}>
                    読み込み中...
                  </td>
                </tr>
              ) : filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '40px' }}>
                    案件がありません
                  </td>
                </tr>
              ) : (
                filteredProjects.map((project) => {
                  const user = users.find(u => u.id === project.assigneeId);
                  const proposalMenu = proposalMenus.find(menu => menu.id === project.proposalMenuId);
                  
                  const latestActionLog = actionLogs
                    .filter(log => log.projectId === project.id)
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
                  const performanceType = latestActionLog?.performanceType;
                  
                  return (
                    <tr key={project.id}>
                      <td>{project.productName}</td>
                      <td>{proposalMenu?.name || '-'}</td>
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
                      <td>
                        <span className={`performance performance-${performanceType || 'none'}`}>
                          {performanceType === 'new' && '新規'}
                          {performanceType === 'existing' && '既存'}
                          {performanceType === 'unselected' && '未選択'}
                          {!performanceType && '-'}
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
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              読み込み中...
            </div>
          ) : groupedClients.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              クライアントがありません
            </div>
          ) : (
            <div className="client-accordion">
              {groupedClients.map((client) => {
                const isExpanded = expandedClients.has(client.id);
                return (
                  <div key={client.id} className="accordion-item">
                    <div 
                      className="accordion-header"
                      onClick={() => toggleClientExpansion(client.id)}
                    >
                      <div className="client-summary">
                        <div className="client-info">
                          <span className="client-name">{client.name}</span>
                          <span className="project-count">({client.projectCount}案件)</span>
                        </div>
                        <div className="client-meta">
                          <span className="assignee">{client.assigneeName || '-'}</span>
                          <span className={`status status-${client.latestStatus}`}>
                            {client.latestStatus === 'proposal' && '提案中'}
                            {client.latestStatus === 'negotiation' && '交渉中'}
                            {client.latestStatus === 'won' && '受注'}
                            {client.latestStatus === 'lost' && '失注'}
                            {client.latestStatus === 'active' && '稼働中'}
                            {client.latestStatus === 'completed' && '稼働終了'}
                            {!client.latestStatus && '-'}
                          </span>
                          <span className="last-contact">
                            {client.lastContactDate?.toLocaleDateString() || '-'}
                          </span>
                        </div>
                      </div>
                      <div className="expand-icon">
                        <span className={`chevron ${isExpanded ? 'expanded' : ''}`}>▼</span>
                      </div>
                    </div>
                    
                    {isExpanded && (
                      <div className="accordion-content">
                        <div className="project-header">
                          <button 
                            className="btn btn-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate('/action-log/record', {
                                state: { clientName: client.name }
                              });
                            }}
                          >
                            + 新規追加
                          </button>
                        </div>
                        
                        {client.projects && client.projects.length > 0 ? (
                          <table className="project-table">
                            <thead>
                              <tr>
                                <th>商材名</th>
                                <th>提案メニュー</th>
                                <th>担当者</th>
                                <th>ステータス</th>
                                <th>実績</th>
                                <th>最終接触日</th>
                                <th>アクション</th>
                              </tr>
                            </thead>
                            <tbody>
                              {client.projects.map((project) => (
                                <tr key={project.id}>
                                  <td>{project.productName}</td>
                                  <td>{project.proposalMenuName}</td>
                                  <td>{project.userName}</td>
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
                                  <td>
                                    <span className={`performance performance-${project.performanceType || 'none'}`}>
                                      {project.performanceType === 'new' && '新規'}
                                      {project.performanceType === 'existing' && '既存'}
                                      {project.performanceType === 'unselected' && '未選択'}
                                      {!project.performanceType && '-'}
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
                              ))}
                            </tbody>
                          </table>
                        ) : (
                          <div className="no-projects">
                            このクライアントにはプロジェクトがありません
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 詳細モーダル */}
      {showDetailModal && selectedProject && (
        <div className="modal-overlay" onClick={handleCloseModals}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>案件詳細</h2>
              <button className="close-btn" onClick={handleCloseModals}>×</button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-item">
                  <label>タイトル:</label>
                  <span>{selectedProject.title}</span>
                </div>
                <div className="detail-item">
                  <label>商材名:</label>
                  <span>{selectedProject.productName}</span>
                </div>
                <div className="detail-item">
                  <label>クライアント:</label>
                  <span>{selectedProject.clientName}</span>
                </div>
                <div className="detail-item">
                  <label>担当者:</label>
                  <span>{users.find(u => u.id === selectedProject.assigneeId)?.name || '-'}</span>
                </div>
                <div className="detail-item">
                  <label>提案メニュー:</label>
                  <span>{proposalMenus.find(m => m.id === selectedProject.proposalMenuId)?.name || '-'}</span>
                </div>
                <div className="detail-item">
                  <label>ステータス:</label>
                  <span className={`status status-${selectedProject.status}`}>
                    {selectedProject.status === 'proposal' && '提案中'}
                    {selectedProject.status === 'negotiation' && '交渉中'}
                    {selectedProject.status === 'won' && '受注'}
                    {selectedProject.status === 'lost' && '失注'}
                    {selectedProject.status === 'active' && '稼働中'}
                    {selectedProject.status === 'completed' && '稼働終了'}
                  </span>
                </div>
                <div className="detail-item">
                  <label>作成日:</label>
                  <span>{selectedProject.createdAt?.toLocaleDateString() || '-'}</span>
                </div>
                <div className="detail-item">
                  <label>最終接触日:</label>
                  <span>{selectedProject.lastContactDate?.toLocaleDateString() || '-'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 編集モーダル */}
      {showEditModal && selectedProject && (
        <div className="modal-overlay" onClick={handleCloseModals}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>案件編集</h2>
              <button className="close-btn" onClick={handleCloseModals}>×</button>
            </div>
            <div className="modal-body">
              <div className="edit-form">
                <div className="form-group">
                  <label>タイトル:</label>
                  <input 
                    type="text" 
                    value={editFormData.title || ''} 
                    onChange={(e) => setEditFormData({...editFormData, title: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>商材名:</label>
                  <input 
                    type="text" 
                    value={editFormData.productName || ''} 
                    onChange={(e) => setEditFormData({...editFormData, productName: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>ステータス:</label>
                  <select 
                    value={editFormData.status || ''} 
                    onChange={(e) => setEditFormData({...editFormData, status: e.target.value as Project['status']})}
                  >
                    <option value="proposal">提案中</option>
                    <option value="negotiation">交渉中</option>
                    <option value="won">受注</option>
                    <option value="lost">失注</option>
                    <option value="active">稼働中</option>
                    <option value="completed">稼働終了</option>
                  </select>
                </div>
              </div>
              <div className="modal-actions">
                <button className="btn" onClick={handleSaveProject}>保存</button>
                <button className="btn btn-secondary" onClick={handleCloseModals}>キャンセル</button>
              </div>
            </div>
          </div>
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
        
        .performance {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
        }
        
        .performance-new {
          background-color: #e8f5e9;
          color: #2e7d32;
        }
        
        .performance-existing {
          background-color: #e3f2fd;
          color: #1976d2;
        }
        
        .performance-unselected {
          background-color: #fff3e0;
          color: #f57c00;
        }
        
        .performance-none {
          background-color: #f5f5f5;
          color: #757575;
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
          padding: 0;
          width: 90%;
          max-width: 600px;
          max-height: 80vh;
          overflow-y: auto;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        }
        
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid #eee;
        }
        
        .modal-header h2 {
          margin: 0;
          color: #333;
        }
        
        .close-btn {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #999;
          padding: 0;
          width: 30px;
          height: 30px;
        }
        
        .close-btn:hover {
          color: #333;
        }
        
        .modal-body {
          padding: 24px;
        }
        
        .detail-grid {
          display: grid;
          gap: 16px;
          grid-template-columns: 1fr 1fr;
        }
        
        .detail-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        
        .detail-item label {
          font-weight: 500;
          color: #555;
          font-size: 14px;
        }
        
        .detail-item span {
          color: #333;
        }
        
        .edit-form {
          display: grid;
          gap: 16px;
        }
        
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        
        .form-group label {
          font-weight: 500;
          color: #555;
        }
        
        .form-group input,
        .form-group select {
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }
        
        .modal-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          margin-top: 24px;
          padding-top: 16px;
          border-top: 1px solid #eee;
        }
        
        /* アコーディオンスタイル */
        .client-accordion {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .accordion-item {
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          overflow: hidden;
          transition: all 0.2s ease-in-out;
        }
        
        .accordion-item:hover {
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        
        .accordion-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          background-color: #f8f9fa;
          cursor: pointer;
          transition: background-color 0.2s ease-in-out;
          border-bottom: 1px solid #e0e0e0;
        }
        
        .accordion-header:hover {
          background-color: #f0f1f2;
        }
        
        .client-summary {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
        }
        
        .client-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .client-name {
          font-weight: 600;
          font-size: 16px;
          color: #333;
        }
        
        .project-count {
          font-size: 14px;
          color: #666;
          background-color: #e3f2fd;
          padding: 2px 8px;
          border-radius: 12px;
        }
        
        .client-meta {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        
        .assignee {
          font-size: 14px;
          color: #555;
          min-width: 80px;
        }
        
        .last-contact {
          font-size: 14px;
          color: #555;
          min-width: 100px;
        }
        
        .expand-icon {
          margin-left: 16px;
        }
        
        .chevron {
          font-size: 14px;
          color: #666;
          transition: transform 0.2s ease-in-out;
        }
        
        .chevron.expanded {
          transform: rotate(180deg);
        }
        
        .accordion-content {
          padding: 20px;
          background-color: white;
          border-top: 1px solid #e0e0e0;
          animation: slideDown 0.3s ease-out;
        }
        
        @keyframes slideDown {
          from {
            opacity: 0;
            max-height: 0;
            padding: 0 20px;
          }
          to {
            opacity: 1;
            max-height: 1000px;
            padding: 20px;
          }
        }
        
        .project-header {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 16px;
          padding-bottom: 16px;
          border-bottom: 1px solid #f0f0f0;
        }
        
        .project-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 8px;
        }
        
        .project-table th,
        .project-table td {
          padding: 10px;
          text-align: left;
          border-bottom: 1px solid #f0f0f0;
          font-size: 14px;
        }
        
        .project-table th {
          background-color: #f8f9fa;
          font-weight: 600;
          color: #555;
        }
        
        .project-table tbody tr:hover {
          background-color: #f9f9f9;
        }
        
        .no-projects {
          text-align: center;
          padding: 40px;
          color: #666;
          font-style: italic;
        }

        @media (max-width: 768px) {
          .detail-grid {
            grid-template-columns: 1fr;
          }
          
          .modal-content {
            width: 95%;
            margin: 10px;
          }
          
          .client-summary {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }
          
          .client-meta {
            gap: 12px;
            flex-wrap: wrap;
          }
          
          .project-table {
            font-size: 12px;
          }
          
          .project-table th,
          .project-table td {
            padding: 8px;
          }
        }
      `}</style>
    </div>
  );
};

export default ProjectManagement;