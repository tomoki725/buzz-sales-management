import { useState, useEffect } from 'react';
import { createProposalMenu, getProposalMenus, deleteProposalMenu } from '../services/firestore';
import type { ProposalMenu } from '../types';

const ProposalMenuMaster = () => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [menus, setMenus] = useState<ProposalMenu[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMenus();
  }, []);

  const loadMenus = async () => {
    try {
      const menusData = await getProposalMenus();
      setMenus(menusData);
    } catch (error) {
      console.error('Error loading proposal menus:', error);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createProposalMenu({
        ...formData,
        createdAt: new Date()
      });
      setFormData({ name: '', description: '' });
      setShowForm(false);
      loadMenus();
    } catch (error) {
      console.error('Error creating proposal menu:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDelete = async (id: string) => {
    if (confirm('この提案メニューを削除しますか？')) {
      try {
        await deleteProposalMenu(id);
        loadMenus();
      } catch (error) {
        console.error('Error deleting proposal menu:', error);
      }
    }
  };

  return (
    <div className="proposal-menu-master">
      <h1>提案メニューマスタ</h1>
      
      <div className="actions">
        <button 
          className="btn"
          onClick={() => setShowForm(!showForm)}
        >
          + 新規登録
        </button>
      </div>

      {showForm && (
        <div className="card">
          <h2>提案メニュー登録</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">メニュー名</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="description">説明</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
              />
            </div>
            
            <div className="form-actions">
              <button type="submit" className="btn">登録</button>
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={() => setShowForm(false)}
              >
                キャンセル
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <h2>登録済みメニュー</h2>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            読み込み中...
          </div>
        ) : menus.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            提案メニューが登録されていません
          </div>
        ) : (
          <div className="menu-list">
            {menus.map((menu) => (
              <div key={menu.id} className="menu-item">
                <div className="menu-info">
                  <h3>{menu.name}</h3>
                  {menu.description && <p>{menu.description}</p>}
                  <small style={{ color: '#888' }}>
                    作成日: {menu.createdAt.toLocaleDateString()}
                  </small>
                </div>
                <button 
                  className="btn btn-danger btn-sm"
                  onClick={() => handleDelete(menu.id)}
                >
                  削除
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <style>{`
        .actions {
          margin-bottom: 20px;
        }
        
        .form-actions {
          display: flex;
          gap: 10px;
          justify-content: flex-end;
          margin-top: 20px;
        }
        
        .menu-list {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }
        
        .menu-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px;
          border: 1px solid #ddd;
          border-radius: 8px;
          background-color: #f9f9f9;
        }
        
        .menu-info h3 {
          margin: 0 0 5px 0;
          color: #1976d2;
        }
        
        .menu-info p {
          margin: 0;
          color: #666;
          font-size: 14px;
        }
        
        .btn-sm {
          padding: 6px 12px;
          font-size: 12px;
        }
      `}</style>
    </div>
  );
};

export default ProposalMenuMaster;