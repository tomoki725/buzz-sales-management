import { useState, useEffect, useCallback } from 'react';
import { getFreeWriting, saveFreeWriting } from '../services/firestore';
import { 
  formatWeekForDisplay, 
  formatMonthForDisplay,
  getPreviousWeek,
  getNextWeek,
  getPreviousMonth,
  getNextMonth
} from '../utils/dateUtils';

interface FreeWritingSectionProps {
  type: 'monthly' | 'weekly';
  userId: string;
  initialPeriod: string;
  title: string;
}

const FreeWritingSection = ({ type, userId, initialPeriod, title }: FreeWritingSectionProps) => {
  const [currentPeriod, setCurrentPeriod] = useState(initialPeriod);
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null);

  // Load content for current period
  const loadContent = useCallback(async () => {
    try {
      const freeWriting = await getFreeWriting(userId, type, currentPeriod);
      setContent(freeWriting?.content || '');
    } catch (error) {
      console.error('Error loading free writing content:', error);
    }
  }, [userId, type, currentPeriod]);

  useEffect(() => {
    loadContent();
  }, [loadContent]);

  // Auto-save with debounce
  const saveContent = useCallback(async (contentToSave: string) => {
    if (!contentToSave.trim()) return;

    setIsSaving(true);
    setSaveStatus('saving');

    try {
      await saveFreeWriting({
        userId,
        type,
        period: currentPeriod,
        content: contentToSave,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Error saving free writing:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } finally {
      setIsSaving(false);
    }
  }, [userId, type, currentPeriod]);

  // Handle content change with debounced auto-save
  const handleContentChange = (value: string) => {
    setContent(value);
    
    // Clear existing timeout
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }

    // Set new timeout for auto-save
    const newTimeout = setTimeout(() => {
      saveContent(value);
    }, 2000);
    
    setSaveTimeout(newTimeout);
  };

  // Manual save
  const handleManualSave = () => {
    if (saveTimeout) {
      clearTimeout(saveTimeout);
      setSaveTimeout(null);
    }
    saveContent(content);
  };

  // Navigate periods
  const handlePreviousPeriod = async () => {
    const prevPeriod = type === 'weekly' 
      ? getPreviousWeek(currentPeriod)
      : getPreviousMonth(currentPeriod);
    setCurrentPeriod(prevPeriod);
  };

  const handleNextPeriod = async () => {
    const nextPeriod = type === 'weekly'
      ? getNextWeek(currentPeriod)
      : getNextMonth(currentPeriod);
    setCurrentPeriod(nextPeriod);
  };

  // Format period for display
  const displayPeriod = type === 'weekly' 
    ? formatWeekForDisplay(currentPeriod)
    : formatMonthForDisplay(currentPeriod);

  return (
    <div className="free-writing-section">
      <div className="free-writing-header">
        <h3>{title}</h3>
        <div className="period-navigation">
          <button 
            className="period-nav-btn" 
            onClick={handlePreviousPeriod}
            aria-label="前の期間"
          >
            ◀
          </button>
          <span className="current-period">{displayPeriod}</span>
          <button 
            className="period-nav-btn" 
            onClick={handleNextPeriod}
            aria-label="次の期間"
          >
            ▶
          </button>
        </div>
        <div className="save-section">
          <div className={`save-status ${saveStatus}`}>
            {saveStatus === 'saving' && '保存中...'}
            {saveStatus === 'saved' && '保存済み ✓'}
            {saveStatus === 'error' && '保存エラー ⚠️'}
          </div>
          <button 
            className="save-btn" 
            onClick={handleManualSave}
            disabled={isSaving}
          >
            保存
          </button>
        </div>
      </div>
      
      <textarea
        className="free-writing-textarea"
        value={content}
        onChange={(e) => handleContentChange(e.target.value)}
        placeholder={`${title}の内容を入力してください...`}
        rows={8}
      />

      <style>{`
        .free-writing-section {
          margin: 20px 0;
          background: #ffffff;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          padding: 20px;
        }
        
        .free-writing-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          flex-wrap: wrap;
          gap: 10px;
        }
        
        .free-writing-header h3 {
          margin: 0;
          color: #333;
          font-size: 18px;
        }
        
        .period-navigation {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .period-nav-btn {
          background: #1976d2;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 6px 12px;
          cursor: pointer;
          font-size: 14px;
          transition: background-color 0.2s;
        }
        
        .period-nav-btn:hover {
          background: #1565c0;
        }
        
        .period-nav-btn:disabled {
          background: #ccc;
          cursor: not-allowed;
        }
        
        .current-period {
          font-weight: 600;
          color: #333;
          min-width: 140px;
          text-align: center;
          font-size: 16px;
        }
        
        .save-section {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .save-status {
          font-size: 12px;
          padding: 4px 8px;
          border-radius: 4px;
          min-width: 80px;
          text-align: center;
        }
        
        .save-status.saving {
          background: #fff3cd;
          color: #856404;
        }
        
        .save-status.saved {
          background: #d4edda;
          color: #155724;
        }
        
        .save-status.error {
          background: #f8d7da;
          color: #721c24;
        }
        
        .save-btn {
          background: #28a745;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 6px 12px;
          cursor: pointer;
          font-size: 12px;
          transition: background-color 0.2s;
        }
        
        .save-btn:hover:not(:disabled) {
          background: #218838;
        }
        
        .save-btn:disabled {
          background: #6c757d;
          cursor: not-allowed;
        }
        
        .free-writing-textarea {
          width: 100%;
          min-height: 200px;
          padding: 16px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-family: inherit;
          font-size: 14px;
          line-height: 1.5;
          resize: vertical;
        }
        
        .free-writing-textarea:focus {
          outline: none;
          border-color: #1976d2;
          box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.2);
        }
        
        /* レスポンシブ対応 */
        @media (max-width: 768px) {
          .free-writing-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }
          
          .period-navigation {
            align-self: stretch;
            justify-content: center;
          }
          
          .save-section {
            align-self: stretch;
            justify-content: space-between;
          }
          
          .current-period {
            min-width: 120px;
            font-size: 14px;
          }
          
          .free-writing-textarea {
            min-height: 150px;
            font-size: 16px; /* iOS対応 */
          }
        }
      `}</style>
    </div>
  );
};

export default FreeWritingSection;