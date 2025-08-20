import { useState, useEffect } from 'react';
import { getActionLogs, getProjects, getUsers, deleteActionLog } from '../services/firestore';
import type { ActionLog, Project, User } from '../types';

const ActionLogList = () => {
  const [actionLogs, setActionLogs] = useState<ActionLog[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<ActionLog | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [logsData, projectsData, usersData] = await Promise.all([
        getActionLogs(),
        getProjects(),
        getUsers()
      ]);
      setActionLogs(logsData);
      setProjects(projectsData);
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
    setLoading(false);
  };

  const handleViewDetails = (log: ActionLog) => {
    setSelectedLog(log);
    setShowDetail(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('このアクションログを削除しますか？')) {
      try {
        await deleteActionLog(id);
        loadData();
      } catch (error) {
        console.error('Error deleting action log:', error);
      }
    }
  };

  return (
    <div className="action-log-list">
      <h1>アクションログ</h1>
      
      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>案件</th>
              <th>ステータス</th>
              <th>アクション日</th>
              <th>次回アクション日</th>
              <th>担当者</th>
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
            ) : actionLogs.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '40px' }}>
                  アクションログがありません
                </td>
              </tr>
            ) : (
              actionLogs.map((log) => {
                const project = projects.find(p => p.id === log.projectId);
                const user = users.find(u => u.id === log.assigneeId);
                return (
                  <tr key={log.id}>
                    <td>{project?.title || log.title}</td>
                    <td>
                      <span className={`status status-${log.status}`}>
                        {log.status === 'proposal' && '提案中'}
                        {log.status === 'negotiation' && '交渉中'}
                        {log.status === 'won' && '受注'}
                        {log.status === 'lost' && '失注'}
                        {log.status === 'active' && '稼働中'}
                        {log.status === 'completed' && '稼働終了'}
                      </span>
                    </td>
                    <td>{log.actionDate.toLocaleDateString()}</td>
                    <td>{log.nextActionDate?.toLocaleDateString() || '-'}</td>
                    <td>{user?.name || '-'}</td>
                    <td>
                      <button 
                        className="btn btn-sm btn-secondary"
                        onClick={() => handleViewDetails(log)}
                        style={{ marginRight: '10px' }}
                      >
                        詳細
                      </button>
                      <button 
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDelete(log.id)}
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

      {showDetail && selectedLog && (
        <div className="modal-overlay" onClick={() => setShowDetail(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>アクションログ詳細</h2>
            <div className="detail-content">
              <div className="detail-row">
                <label>タイトル:</label>
                <span>{selectedLog.title}</span>
              </div>
              <div className="detail-row">
                <label>アクション日:</label>
                <span>{selectedLog.actionDate.toLocaleDateString()}</span>
              </div>
              <div className="detail-row">
                <label>次回アクション日:</label>
                <span>{selectedLog.nextActionDate?.toLocaleDateString() || '-'}</span>
              </div>
              <div className="detail-row">
                <label>議事録:</label>
                <p>{selectedLog.minutes || '-'}</p>
              </div>
              <div className="detail-row">
                <label>次回アクション:</label>
                <p>{selectedLog.nextAction || '-'}</p>
              </div>
              <div className="detail-row">
                <label>要約:</label>
                <p>{selectedLog.summary || '-'}</p>
              </div>
            </div>
            <button 
              className="btn btn-secondary"
              onClick={() => setShowDetail(false)}
            >
              閉じる
            </button>
          </div>
        </div>
      )}
      
      <style>{`
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
        
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        
        .modal-content {
          background: white;
          padding: 30px;
          border-radius: 8px;
          max-width: 600px;
          width: 90%;
          max-height: 80vh;
          overflow-y: auto;
        }
        
        .detail-content {
          margin: 20px 0;
        }
        
        .detail-row {
          margin-bottom: 15px;
        }
        
        .detail-row label {
          font-weight: 600;
          display: block;
          margin-bottom: 5px;
          color: #666;
        }
        
        .detail-row p {
          margin: 0;
          white-space: pre-wrap;
        }
      `}</style>
    </div>
  );
};

export default ActionLogList;