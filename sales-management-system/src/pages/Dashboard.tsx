import { useState, useEffect } from 'react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, LabelList 
} from 'recharts';
import { 
  getProjects, getPerformance, 
  getClients, getUsers, getSalesTargets,
  createSalesTarget, updateSalesTarget
} from '../services/firestore';
import FreeWritingSection from '../components/FreeWritingSection';
import { getCurrentWeek, getCurrentMonth } from '../utils/dateUtils';
import type { User, Alert } from '../types';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState<'personal' | 'department' | 'overall'>('overall');
  const [showTargetModal, setShowTargetModal] = useState(false);
  const [overallTargets, setOverallTargets] = useState({
    newDeals: Array(12).fill(0),
    newOrders: Array(12).fill(0),
    existingDeals: Array(12).fill(0),
    existingOrders: Array(12).fill(0),
    grossProfitBudget: Array(12).fill(0)
  });
  const [personalTargets, setPersonalTargets] = useState({
    newDeals: Array(12).fill(0),
    newOrders: Array(12).fill(0),
    existingDeals: Array(12).fill(0),
    existingOrders: Array(12).fill(0),
    grossProfitBudget: Array(12).fill(0)
  });
  
  // 2025年1月〜12月の固定リストを生成
  const generate2025Months = () => {
    const months = [];
    for (let i = 1; i <= 12; i++) {
      const month = i.toString().padStart(2, '0');
      months.push(`2025-${month}`);
    }
    return months;
  };
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [departments, setDepartments] = useState<string[]>([]);
  
  // 月別選択用
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7));
  const [availableMonths] = useState<string[]>(generate2025Months());
  
  // フリーライティング用
  const [currentWeek] = useState(getCurrentWeek());
  const [currentMonth] = useState(getCurrentMonth());
  const [monthlyKpiData, setMonthlyKpiData] = useState({
    totalDeals: 0,
    totalOrders: 0,
    newDeals: 0,
    newOrders: 0,
    existingDeals: 0,
    existingOrders: 0,
    totalRevenue: 0,
    totalGrossProfit: 0,
    activeClients: 0,
    averageOrderValue: 0
  });
  
  // 部署別KPI用
  const [departmentKpiData, setDepartmentKpiData] = useState({
    totalDeals: 0,
    totalOrders: 0,
    newDeals: 0,
    newOrders: 0,
    existingDeals: 0,
    existingOrders: 0,
    totalRevenue: 0,
    totalGrossProfit: 0,
    activeClients: 0,
    averageOrderValue: 0
  });
  
  const [departmentMonthlyKpiData, setDepartmentMonthlyKpiData] = useState({
    totalDeals: 0,
    totalOrders: 0,
    newDeals: 0,
    newOrders: 0,
    existingDeals: 0,
    existingOrders: 0,
    totalRevenue: 0,
    totalGrossProfit: 0,
    activeClients: 0,
    averageOrderValue: 0
  });
  
  // KPIデータ
  const [kpiData, setKpiData] = useState({
    totalDeals: 0,
    totalOrders: 0,
    newDeals: 0,
    newOrders: 0,
    existingDeals: 0,
    existingOrders: 0,
    totalRevenue: 0,
    totalGrossProfit: 0,
    activeClients: 0,
    averageOrderValue: 0
  });
  
  // グラフデータ
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [yoyData, setYoyData] = useState<any[]>([]);
  const [personalMonthlyData, setPersonalMonthlyData] = useState<any[]>([]);
  const [departmentMonthlyData, setDepartmentMonthlyData] = useState<any[]>([]);
  const [departmentComparisonData, setDepartmentComparisonData] = useState<any[]>([]);
  
  // アラート関連
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());
  
  useEffect(() => {
    loadData();
  }, [activeTab, selectedUser, selectedDepartment]);
  
  useEffect(() => {
    loadOverallTargets();
  }, []);
  
  useEffect(() => {
    // loadData内でloadPersonalTargetsを呼び出すため、
    // ここでは selectedUser が空の場合のみ初期化する
    if (!selectedUser) {
      setPersonalTargets({
        newDeals: Array(12).fill(0),
        newOrders: Array(12).fill(0),
        existingDeals: Array(12).fill(0),
        existingOrders: Array(12).fill(0),
        grossProfitBudget: Array(12).fill(0)
      });
    }
    // selectedUserがある場合はloadData内で処理される
  }, [selectedUser]);
  
  useEffect(() => {
    loadMonthlyKpiData();
  }, [selectedMonth, selectedUser, activeTab]);
  
  useEffect(() => {
    if (activeTab === 'department') {
      loadDepartmentKpiData();
    }
  }, [selectedMonth, selectedDepartment, activeTab]);
  
  // ローカルストレージから削除されたアラートを読み込み
  useEffect(() => {
    const dismissed = localStorage.getItem('dismissedAlerts');
    if (dismissed) {
      setDismissedAlerts(new Set(JSON.parse(dismissed)));
    }
  }, []);
  
  const loadData = async () => {
    setLoading(true);
    try {
      const [projectsData, performanceData, clientsData, usersData] = await Promise.all([
        getProjects(),
        getPerformance(),
        getClients(),
        getUsers()
      ]);
      
      setUsers(usersData);
      
      // 部署データの取得
      const uniqueDepartments = Array.from(new Set(
        usersData
          .map(user => user.department)
          .filter((dept): dept is string => dept !== undefined && dept.trim() !== '')
      ));
      setDepartments(uniqueDepartments);
      
      // フィルタリング
      console.log('=== データフィルタリング ===');
      console.log('アクティブタブ:', activeTab);
      console.log('選択ユーザー:', selectedUser);
      console.log('全体実績データ数:', performanceData.length);
      
      let filteredProjects = projectsData;
      let filteredPerformance = performanceData;
      
      if (activeTab === 'personal' && selectedUser) {
        filteredProjects = projectsData.filter(p => p.assigneeId === selectedUser);
        // 実績データも担当者でフィルタリング（直接assigneeIdを使用）
        filteredPerformance = performanceData.filter(perf => perf.assigneeId === selectedUser);
        console.log('個人タブ: 担当者フィルタ後の実績データ数:', filteredPerformance.length);
      } else if (activeTab === 'department' && selectedDepartment) {
        // 部署別フィルタリング
        const departmentUserIds = usersData.filter(u => u.department === selectedDepartment).map(u => u.id);
        filteredProjects = projectsData.filter(p => departmentUserIds.includes(p.assigneeId));
        filteredPerformance = performanceData.filter(perf => departmentUserIds.includes(perf.assigneeId));
        console.log('部署タブ: 部署フィルタ後のデータ数:', {
          projects: filteredProjects.length,
          performance: filteredPerformance.length
        });
      } else {
        console.log('全体タブ: フィルタなしの実績データ数:', filteredPerformance.length);
      }
      
      // KPI計算
      const newClientsSet = new Set<string>();
      const existingClientsSet = new Set<string>();
      
      clientsData.forEach(client => {
        if (client.status === 'new') {
          newClientsSet.add(client.name);
        } else {
          existingClientsSet.add(client.name);
        }
      });
      
      const newDealProjects = filteredProjects.filter(p => newClientsSet.has(p.clientName));
      const existingDealProjects = filteredProjects.filter(p => existingClientsSet.has(p.clientName));
      
      // 受注数は受注日ベースで計算（受注日未設定は除外）
      const currentYear = new Date().getFullYear();
      const newOrderProjects = newDealProjects.filter(p => 
        p.status === 'won' && p.orderDate && p.orderDate.getFullYear() === currentYear
      );
      const existingOrderProjects = existingDealProjects.filter(p => 
        p.status === 'won' && p.orderDate && p.orderDate.getFullYear() === currentYear
      );
      
      // 2025年のデータのみを年間累計の対象とする
      const yearly2025Performance = filteredPerformance.filter(p => 
        p.recordingMonth.startsWith('2025-')
      );
      
      // 2025年年間累計の売上・粗利計算
      const totalRevenue = yearly2025Performance.reduce((sum, p) => sum + p.revenue, 0);
      const totalGrossProfit = yearly2025Performance.reduce((sum, p) => sum + p.grossProfit, 0);
      
      // 2025年の稼働社数
      console.log('=== 年間累計KPI 稼働社数計算 ===');
      console.log('アクティブタブ:', activeTab);
      console.log('選択ユーザー:', selectedUser);
      console.log('2025年実績データ数:', yearly2025Performance.length);
      console.log('2025年実績データサンプル:', yearly2025Performance.slice(0, 3));
      
      const activeClientsSet = new Set(yearly2025Performance.map(p => p.clientName));
      const activeClients = activeClientsSet.size;
      const activeClientsList = Array.from(activeClientsSet).sort();
      
      console.log('稼働社数（ユニーク）:', activeClients);
      console.log('稼働クライアントリスト:', activeClientsList);
      
      // 2025年の客単価
      const averageOrderValue = activeClients > 0 ? totalGrossProfit / activeClients : 0;
      
      const kpiResult = {
        totalDeals: filteredProjects.length,
        totalOrders: (newOrderProjects.length + existingOrderProjects.length),
        newDeals: newDealProjects.length,
        newOrders: newOrderProjects.length,
        existingDeals: existingDealProjects.length,
        existingOrders: existingOrderProjects.length,
        totalRevenue,
        totalGrossProfit,
        activeClients,
        averageOrderValue
      };
      
      setKpiData(kpiResult);
      
      // 部署別KPIも設定（部署タブの場合）
      if (activeTab === 'department') {
        setDepartmentKpiData(kpiResult);
      }
      
      // 月別データ作成（2025年のデータのみ使用）
      const monthlyMap = new Map<string, { revenue: number; grossProfit: number }>();
      yearly2025Performance.forEach(p => {
        const month = p.recordingMonth.substring(0, 7);
        if (!monthlyMap.has(month)) {
          monthlyMap.set(month, { revenue: 0, grossProfit: 0 });
        }
        const data = monthlyMap.get(month)!;
        data.revenue += p.revenue;
        data.grossProfit += p.grossProfit;
      });
      
      const chartData = Array.from(monthlyMap.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([month, data]) => ({
          month: month.substring(5),
          粗利: data.grossProfit
        }));
      
      setMonthlyData(chartData);
      
      // YOYデータ作成（2025年vs2024年の粗利比較）
      const lastYear = 2024;
      const yoyMap = new Map<string, { current: number; last: number }>();
      
      console.log('=== YOYデータ作成開始 ===');
      console.log('全体実績データ総数:', performanceData.length);
      console.log('アクティブタブ:', activeTab);
      console.log('選択されたユーザー:', selectedUser);
      
      // 全体の実績データから2025年と2024年のデータを取得
      const yoyTargetData = performanceData.filter(p => {
        const year = parseInt(p.recordingMonth.substring(0, 4));
        return year === 2025 || year === lastYear;
      });
      
      console.log('YOY対象データ数（2024年+2025年）:', yoyTargetData.length);
      console.log('YOY対象データサンプル:', yoyTargetData.slice(0, 3));
      
      yoyTargetData.forEach(p => {
        const year = parseInt(p.recordingMonth.substring(0, 4));
        const client = p.clientName;
        
        console.log(`処理中: ${client} (${year}年${p.recordingMonth.substring(5, 7)}月) - 粗利: ¥${p.grossProfit.toLocaleString()}, 担当者ID: ${p.assigneeId}`);
        
        if (!yoyMap.has(client)) {
          yoyMap.set(client, { current: 0, last: 0 });
        }
        const data = yoyMap.get(client)!;
        if (year === 2025) {
          data.current += p.grossProfit;
        } else {
          data.last += p.grossProfit;
        }
      });
      
      // 重複データの検出
      const duplicateCheck = new Map<string, number>();
      yoyTargetData.forEach(p => {
        const key = `${p.assigneeId}-${p.recordingMonth}-${p.clientName}-${p.projectName}`;
        duplicateCheck.set(key, (duplicateCheck.get(key) || 0) + 1);
      });
      
      const duplicates = Array.from(duplicateCheck.entries()).filter(([_, count]) => count > 1);
      if (duplicates.length > 0) {
        console.warn('=== 重複データ検出 ===');
        duplicates.forEach(([key, count]) => {
          console.warn(`重複 ${count}件: ${key}`);
        });
      } else {
        console.log('重複データなし');
      }
      
      console.log('=== クライアント別YOY集計結果 ===');
      Array.from(yoyMap.entries()).forEach(([client, data]) => {
        console.log(`${client}: 2025年=¥${data.current.toLocaleString()}, 2024年=¥${data.last.toLocaleString()}`);
      });
      
      const yoyChartData = Array.from(yoyMap.entries())
        .map(([client, data]) => ({
          client: client.length > 10 ? client.substring(0, 10) + '...' : client,
          "2025年": data.current,
          "2024年": data.last
        }))
        .sort((a, b) => b["2025年"] - a["2025年"])
        .slice(0, 10);
      
      setYoyData(yoyChartData);
      
      // 個人用月別チャートデータ生成（個人タブ選択時のみ）
      if (activeTab === 'personal' && selectedUser) {
        console.log('=== 個人用月別チャートデータ生成 ===');
        console.log('選択ユーザー:', selectedUser);
        
        // 個人目標データを読み込む
        const personalTargetsData = await loadPersonalTargets(selectedUser);
        console.log('読み込んだ個人目標データ:', personalTargetsData);
        
        const personalMonthlyMap = new Map<string, { actual: number; budget: number }>();
        
        // 2025年1-12月の初期化
        for (let month = 1; month <= 12; month++) {
          const monthKey = `2025-${month.toString().padStart(2, '0')}`;
          personalMonthlyMap.set(monthKey, { actual: 0, budget: 0 });
        }
        
        // 個人の実績データを月別で集計
        const personal2025Performance = filteredPerformance.filter(p => 
          p.recordingMonth.startsWith('2025-')
        );
        
        personal2025Performance.forEach(p => {
          const month = p.recordingMonth.substring(0, 7);
          if (personalMonthlyMap.has(month)) {
            const data = personalMonthlyMap.get(month)!;
            data.actual += p.grossProfit;
          }
        });
        
        // 個人のBGT（予算）データを設定（返された値を直接使用）
        personalTargetsData.grossProfitBudget.forEach((budget, index) => {
          const monthKey = `2025-${(index + 1).toString().padStart(2, '0')}`;
          if (personalMonthlyMap.has(monthKey)) {
            const data = personalMonthlyMap.get(monthKey)!;
            data.budget = budget;
          }
          console.log(`${index + 1}月BGT:`, budget);
        });
        
        // チャートデータに変換
        const personalChartData = Array.from(personalMonthlyMap.entries())
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(([month, data]) => ({
            month: `${month.substring(5)}月`,
            BGT: data.budget,
            実績: data.actual
          }));
        
        console.log('個人月別チャートデータ:', personalChartData);
        setPersonalMonthlyData(personalChartData);
      } else {
        setPersonalMonthlyData([]);
      }
      
      // 部署別月別チャートデータ生成（部署タブ選択時のみ）
      if (activeTab === 'department') {
        console.log('=== 部署別月別チャートデータ生成 ===');
        console.log('選択部署:', selectedDepartment);
        
        if (selectedDepartment) {
          // 部署の目標データを読み込む
          const departmentBGT = await loadDepartmentTargets(selectedDepartment, usersData);
          
          const departmentMonthlyMap = new Map<string, { grossProfit: number; budget: number }>();
          
          // 2025年1-12月の初期化
          for (let month = 1; month <= 12; month++) {
            const monthKey = `2025-${month.toString().padStart(2, '0')}`;
            departmentMonthlyMap.set(monthKey, { 
              grossProfit: 0, 
              budget: departmentBGT[month - 1] || 0 
            });
          }
          
          // 部署の実績データを月別で集計
          filteredPerformance.filter(p => p.recordingMonth.startsWith('2025-')).forEach(p => {
            const month = p.recordingMonth.substring(0, 7);
            if (departmentMonthlyMap.has(month)) {
              const data = departmentMonthlyMap.get(month)!;
              data.grossProfit += p.grossProfit;
            }
          });
          
          // チャートデータに変換
          const departmentChartData = Array.from(departmentMonthlyMap.entries())
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([month, data]) => ({
              month: `${month.substring(5)}月`,
              粗利: data.grossProfit,
              BGT: data.budget
            }));
          
          console.log('部署別月別チャートデータ:', departmentChartData);
          setDepartmentMonthlyData(departmentChartData);
        } else {
          setDepartmentMonthlyData([]);
        }
        
        // 部署比較データ生成
        const departmentComparisonMap = new Map<string, number>();
        
        departments.forEach(dept => {
          const deptUserIds = usersData.filter(u => u.department === dept).map(u => u.id);
          const deptPerformance = performanceData.filter(p => 
            deptUserIds.includes(p.assigneeId) && p.recordingMonth.startsWith('2025-')
          );
          const deptGrossProfit = deptPerformance.reduce((sum, p) => sum + p.grossProfit, 0);
          departmentComparisonMap.set(dept, deptGrossProfit);
        });
        
        const departmentComparisonChartData = Array.from(departmentComparisonMap.entries())
          .map(([dept, grossProfit]) => ({
            department: dept.length > 8 ? dept.substring(0, 8) + '...' : dept,
            粗利: grossProfit
          }))
          .sort((a, b) => b.粗利 - a.粗利);
        
        console.log('部署比較チャートデータ:', departmentComparisonChartData);
        setDepartmentComparisonData(departmentComparisonChartData);
      } else {
        setDepartmentMonthlyData([]);
        setDepartmentComparisonData([]);
      }
      
      // アラート判定処理（全体タブのみ）
      if (activeTab === 'overall') {
        console.log('=== アラート判定開始 ===');
        const generatedAlerts: Alert[] = [];
        const now = new Date();
        const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
        const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        
        // アラート対象クライアントのフィルタリング
        // プロジェクトが存在するクライアントを取得
        const clientsWithProjects = new Set(
          projectsData.map(p => p.clientName)
        );
        
        // 2025年7月以降に実績があるクライアントを取得
        const clientsWithRecentPerformance = new Set(
          performanceData
            .filter(p => p.recordingMonth >= '2025-07')
            .map(p => p.clientName)
        );
        
        // 両方の条件を満たすクライアントのみを対象とする
        const targetClients = Array.from(clientsWithProjects).filter((clientName): clientName is string => 
          typeof clientName === 'string' && clientsWithRecentPerformance.has(clientName)
        );
        
        console.log('プロジェクトがあるクライアント数:', clientsWithProjects.size);
        console.log('2025年7月以降実績があるクライアント数:', clientsWithRecentPerformance.size);
        console.log('アラート対象クライアント数:', targetClients.length);
        console.log('対象クライアント:', targetClients);
        
        targetClients.forEach(clientName => {
          // 3ヶ月以上実績がないクライアントをチェック
          const clientPerformance = performanceData.filter(p => p.clientName === clientName);
          const latestPerformance = clientPerformance
            .sort((a, b) => new Date(b.recordingMonth).getTime() - new Date(a.recordingMonth).getTime())[0];
          
          if (clientPerformance.length === 0 || 
              (latestPerformance && new Date(latestPerformance.recordingMonth + '-01') < threeMonthsAgo)) {
            const alertId = `performance-${clientName}`;
            const lastDate = latestPerformance ? new Date(latestPerformance.recordingMonth + '-01') : new Date(0);
            
            generatedAlerts.push({
              id: alertId,
              type: 'performance',
              clientName,
              message: '3ヶ月以上実績が発生していません',
              severity: 'error',
              lastDate,
              dismissed: false
            });
          }
          
          // 1ヶ月以上最終接触日が更新されていないクライアントをチェック
          const clientProjects = projectsData.filter(p => p.clientName === clientName);
          const latestProject = clientProjects
            .filter(p => p.lastContactDate)
            .sort((a, b) => {
              const dateA = a.lastContactDate ? new Date(a.lastContactDate).getTime() : 0;
              const dateB = b.lastContactDate ? new Date(b.lastContactDate).getTime() : 0;
              return dateB - dateA;
            })[0];
          
          if (!latestProject || 
              (latestProject.lastContactDate && new Date(latestProject.lastContactDate) < oneMonthAgo)) {
            const alertId = `action-${clientName}`;
            const lastDate = latestProject?.lastContactDate ? new Date(latestProject.lastContactDate) : new Date(0);
            
            generatedAlerts.push({
              id: alertId,
              type: 'action',
              clientName,
              message: '1ヶ月以上接触がありません',
              severity: 'warning',
              lastDate,
              dismissed: false
            });
          }
        });
        
        console.log('生成されたアラート数:', generatedAlerts.length);
        setAlerts(generatedAlerts);
      } else {
        setAlerts([]);
      }
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
    setLoading(false);
  };
  
  const loadMonthlyKpiData = async () => {
    // selectedMonthが空の場合は処理しない
    if (!selectedMonth) return;
    
    console.log('=== 月別KPIデータ読み込み開始 ===');
    console.log('選択された月:', selectedMonth);
    console.log('アクティブタブ:', activeTab);
    console.log('選択されたユーザー:', selectedUser);
    
    try {
      const [projectsData, performanceData, clientsData] = await Promise.all([
        getProjects(),
        getPerformance(),
        getClients()
      ]);
      
      console.log('実績データ総数:', performanceData.length);
      console.log('実績データサンプル:', performanceData.slice(0, 3));
      
      // フィルタリング
      let filteredProjects = projectsData;
      let filteredPerformance = performanceData;
      
      if (activeTab === 'personal' && selectedUser) {
        filteredProjects = projectsData.filter(p => p.assigneeId === selectedUser);
        // 実績データも担当者でフィルタリング（直接assigneeIdを使用）
        filteredPerformance = performanceData.filter(perf => perf.assigneeId === selectedUser);
      }
      
      // 選択された月のデータのみにフィルタリング
      console.log('フィルタリング前の実績データ数:', filteredPerformance.length);
      console.log('フィルタリング前のデータサンプル:', filteredPerformance.slice(0, 3));
      
      const monthlyPerformance = filteredPerformance.filter(p => {
        console.log(`チェック中: recordingMonth="${p.recordingMonth}", selectedMonth="${selectedMonth}", マッチ=${p.recordingMonth.startsWith(selectedMonth)}`);
        return p.recordingMonth.startsWith(selectedMonth);
      });
      
      console.log('月別フィルタリング後のデータ数:', monthlyPerformance.length);
      console.log('月別データ:', monthlyPerformance);
      
      // 月別の商談・受注データをフィルタリング
      const monthlyProjects = filteredProjects.filter(p => {
        // 初回商談日ベースで判定
        if (p.firstMeetingDate) {
          return p.firstMeetingDate.toISOString().substring(0, 7) === selectedMonth;
        }
        // 初回商談日が未設定の場合は作成日で判定
        const createdMonth = p.createdAt.toISOString().substring(0, 7);
        return createdMonth === selectedMonth;
      });
      
      
      // KPI計算
      const newClientsSet = new Set<string>();
      const existingClientsSet = new Set<string>();
      
      clientsData.forEach(client => {
        if (client.status === 'new') {
          newClientsSet.add(client.name);
        } else {
          existingClientsSet.add(client.name);
        }
      });
      
      const newDealProjects = monthlyProjects.filter(p => newClientsSet.has(p.clientName));
      const existingDealProjects = monthlyProjects.filter(p => existingClientsSet.has(p.clientName));
      const newOrderProjects = newDealProjects.filter(p => 
        p.status === 'won'
      );
      const existingOrderProjects = existingDealProjects.filter(p => 
        p.status === 'won'
      );
      
      // 月別の売上・粗利計算
      const totalRevenue = monthlyPerformance.reduce((sum, p) => sum + p.revenue, 0);
      const totalGrossProfit = monthlyPerformance.reduce((sum, p) => sum + p.grossProfit, 0);
      
      console.log('月別粗利計算結果:', totalGrossProfit);
      console.log('月別売上計算結果:', totalRevenue);
      
      // 稼働社数
      console.log('=== 月別KPI 稼働社数計算 ===');
      console.log('選択月:', selectedMonth);
      console.log('アクティブタブ:', activeTab);
      console.log('選択ユーザー:', selectedUser);
      console.log('月別実績データ数:', monthlyPerformance.length);
      console.log('月別実績データサンプル:', monthlyPerformance.slice(0, 3));
      
      const activeClientsSet = new Set(monthlyPerformance.map(p => p.clientName));
      const activeClients = activeClientsSet.size;
      const monthlyActiveClientsList = Array.from(activeClientsSet).sort();
      
      console.log('月別稼働社数（ユニーク）:', activeClients);
      console.log('月別稼働クライアントリスト:', monthlyActiveClientsList);
      
      // 客単価
      const averageOrderValue = activeClients > 0 ? totalGrossProfit / activeClients : 0;
      
      const monthlyKpiResult = {
        totalDeals: monthlyProjects.length,
        totalOrders: monthlyProjects.filter(p => 
          p.status === 'won' && 
          p.orderDate && 
          p.orderDate.toISOString().substring(0, 7) === selectedMonth
        ).length,
        newDeals: newDealProjects.length,
        newOrders: newOrderProjects.length,
        existingDeals: existingDealProjects.length,
        existingOrders: existingOrderProjects.length,
        totalRevenue,
        totalGrossProfit,
        activeClients,
        averageOrderValue
      };
      
      console.log('月別KPI結果:', monthlyKpiResult);
      setMonthlyKpiData(monthlyKpiResult);
      
    } catch (error) {
      console.error('Error loading monthly KPI data:', error);
      // エラー時はゼロ値で設定
      setMonthlyKpiData({
        totalDeals: 0,
        totalOrders: 0,
        newDeals: 0,
        newOrders: 0,
        existingDeals: 0,
        existingOrders: 0,
        totalRevenue: 0,
        totalGrossProfit: 0,
        activeClients: 0,
        averageOrderValue: 0
      });
    }
  };

  const loadDepartmentKpiData = async () => {
    // selectedMonthが空または部署が選択されていない場合は処理しない
    if (!selectedMonth || !selectedDepartment) return;
    
    console.log('=== 部署別月別KPIデータ読み込み開始 ===');
    console.log('選択された月:', selectedMonth);
    console.log('選択された部署:', selectedDepartment);
    
    try {
      const [projectsData, performanceData, clientsData, usersData] = await Promise.all([
        getProjects(),
        getPerformance(),
        getClients(),
        getUsers()
      ]);
      
      // 部署の担当者IDを取得
      const departmentUserIds = usersData.filter(u => u.department === selectedDepartment).map(u => u.id);
      
      // 部署でフィルタリング
      let filteredProjects = projectsData.filter(p => departmentUserIds.includes(p.assigneeId));
      let filteredPerformance = performanceData.filter(perf => departmentUserIds.includes(perf.assigneeId));
      
      // 選択された月のデータのみにフィルタリング
      const monthlyPerformance = filteredPerformance.filter(p => p.recordingMonth.startsWith(selectedMonth));
      
      // 月別の商談・受注データをフィルタリング
      const monthlyProjects = filteredProjects.filter(p => {
        // 初回商談日ベースで判定
        if (p.firstMeetingDate) {
          return p.firstMeetingDate.toISOString().substring(0, 7) === selectedMonth;
        }
        // 初回商談日が未設定の場合は作成日で判定
        const createdMonth = p.createdAt.toISOString().substring(0, 7);
        return createdMonth === selectedMonth;
      });
      
      
      // KPI計算
      const newClientsSet = new Set<string>();
      const existingClientsSet = new Set<string>();
      
      clientsData.forEach(client => {
        if (client.status === 'new') {
          newClientsSet.add(client.name);
        } else {
          existingClientsSet.add(client.name);
        }
      });
      
      const newDealProjects = monthlyProjects.filter(p => newClientsSet.has(p.clientName));
      const existingDealProjects = monthlyProjects.filter(p => existingClientsSet.has(p.clientName));
      const newOrderProjects = newDealProjects.filter(p => 
        p.status === 'won'
      );
      const existingOrderProjects = existingDealProjects.filter(p => 
        p.status === 'won'
      );
      
      // 月別の売上・粗利計算
      const totalRevenue = monthlyPerformance.reduce((sum, p) => sum + p.revenue, 0);
      const totalGrossProfit = monthlyPerformance.reduce((sum, p) => sum + p.grossProfit, 0);
      
      // 稼働社数
      const activeClientsSet = new Set(monthlyPerformance.map(p => p.clientName));
      const activeClients = activeClientsSet.size;
      
      // 客単価
      const averageOrderValue = activeClients > 0 ? totalGrossProfit / activeClients : 0;
      
      const departmentMonthlyKpiResult = {
        totalDeals: monthlyProjects.length,
        // monthlyProjectsは既にorderDateでフィルタリング済みなのでstatusチェックのみ
        totalOrders: monthlyProjects.filter(p => p.status === 'won').length,
        newDeals: newDealProjects.length,
        newOrders: newOrderProjects.length,
        existingDeals: existingDealProjects.length,
        existingOrders: existingOrderProjects.length,
        totalRevenue,
        totalGrossProfit,
        activeClients,
        averageOrderValue
      };
      
      console.log('部署別月別KPI結果:', departmentMonthlyKpiResult);
      setDepartmentMonthlyKpiData(departmentMonthlyKpiResult);
      
    } catch (error) {
      console.error('Error loading department monthly KPI data:', error);
    }
  };

  const loadOverallTargets = async () => {
    try {
      // 全体目標は特別なuserIdで管理
      const targetsData = await getSalesTargets('overall');
      
      const newTargets = {
        newDeals: Array(12).fill(0),
        newOrders: Array(12).fill(0),
        existingDeals: Array(12).fill(0),
        existingOrders: Array(12).fill(0),
        grossProfitBudget: Array(12).fill(0)
      };
      
      const currentYear = new Date().getFullYear();
      targetsData.forEach(target => {
        if (target.year === currentYear && target.month >= 1 && target.month <= 12) {
          const index = target.month - 1;
          newTargets.newDeals[index] = target.newDeals;
          newTargets.newOrders[index] = target.newOrders;
          newTargets.existingDeals[index] = target.existingDeals;
          newTargets.existingOrders[index] = target.existingOrders;
          newTargets.grossProfitBudget[index] = target.grossProfitBudget || 0;
        }
      });
      
      setOverallTargets(newTargets);
    } catch (error) {
      console.error('Error loading overall targets:', error);
    }
  };

  const loadPersonalTargets = async (userId: string) => {
    try {
      const targetsData = await getSalesTargets(userId);
      
      const newTargets = {
        newDeals: Array(12).fill(0),
        newOrders: Array(12).fill(0),
        existingDeals: Array(12).fill(0),
        existingOrders: Array(12).fill(0),
        grossProfitBudget: Array(12).fill(0)
      };
      
      const currentYear = new Date().getFullYear();
      targetsData.forEach(target => {
        if (target.year === currentYear && target.month >= 1 && target.month <= 12) {
          const index = target.month - 1;
          newTargets.newDeals[index] = target.newDeals;
          newTargets.newOrders[index] = target.newOrders;
          newTargets.existingDeals[index] = target.existingDeals;
          newTargets.existingOrders[index] = target.existingOrders;
          newTargets.grossProfitBudget[index] = target.grossProfitBudget || 0;
        }
      });
      
      setPersonalTargets(newTargets);
      return newTargets; // 新しい目標データを返す
    } catch (error) {
      console.error('Error loading personal targets:', error);
      return {
        newDeals: Array(12).fill(0),
        newOrders: Array(12).fill(0),
        existingDeals: Array(12).fill(0),
        existingOrders: Array(12).fill(0),
        grossProfitBudget: Array(12).fill(0)
      };
    }
  };

  const loadDepartmentTargets = async (department: string, usersData: User[]) => {
    try {
      console.log('=== 部署別目標データ読み込み開始 ===');
      console.log('対象部署:', department);
      
      // 部署内のユーザーIDを取得
      const deptUserIds = usersData.filter(u => u.department === department).map(u => u.id);
      console.log('部署メンバー数:', deptUserIds.length);
      
      // 各メンバーの目標データを並行取得
      const memberTargetsPromises = deptUserIds.map(async (userId) => {
        const targetsData = await getSalesTargets(userId);
        const userTargets = {
          newDeals: Array(12).fill(0),
          newOrders: Array(12).fill(0),
          existingDeals: Array(12).fill(0),
          existingOrders: Array(12).fill(0),
          grossProfitBudget: Array(12).fill(0)
        };
        
        const currentYear = new Date().getFullYear();
        targetsData.forEach(target => {
          if (target.year === currentYear && target.month >= 1 && target.month <= 12) {
            const index = target.month - 1;
            userTargets.grossProfitBudget[index] = target.grossProfitBudget || 0;
          }
        });
        
        return { userId, targets: userTargets };
      });
      
      const memberTargets = await Promise.all(memberTargetsPromises);
      console.log('取得したメンバー目標データ:', memberTargets);
      
      // 部署全体の月別BGTを算出
      const departmentBGT = Array(12).fill(0);
      memberTargets.forEach(member => {
        member.targets.grossProfitBudget.forEach((budget, index) => {
          departmentBGT[index] += budget;
        });
      });
      
      console.log('部署別月別BGT:', departmentBGT);
      return departmentBGT;
      
    } catch (error) {
      console.error('Error loading department targets:', error);
      return Array(12).fill(0);
    }
  };

  const saveOverallTargets = async () => {
    try {
      const currentYear = new Date().getFullYear();
      const existingTargets = await getSalesTargets('overall');
      
      for (let month = 1; month <= 12; month++) {
        const index = month - 1;
        const targetData = {
          userId: 'overall',
          year: currentYear,
          month,
          newDeals: overallTargets.newDeals[index],
          newOrders: overallTargets.newOrders[index],
          existingDeals: overallTargets.existingDeals[index],
          existingOrders: overallTargets.existingOrders[index],
          grossProfitBudget: overallTargets.grossProfitBudget[index]
        };
        
        const existing = existingTargets.find(
          t => t.userId === 'overall' && t.year === currentYear && t.month === month
        );
        
        if (existing) {
          await updateSalesTarget(existing.id, targetData);
        } else {
          await createSalesTarget(targetData);
        }
      }
      
      alert('全体目標を保存しました');
      setShowTargetModal(false);
    } catch (error) {
      console.error('Error saving overall targets:', error);
      alert('保存に失敗しました');
    }
  };

  // 目標値計算ヘルパー関数
  const calculateYearlyTarget = (targets: number[]) => {
    return targets.reduce((sum, target) => sum + target, 0);
  };

  const getMonthlyTarget = (targets: number[], selectedMonth: string) => {
    if (!selectedMonth) return 0;
    const monthIndex = parseInt(selectedMonth.substring(5, 7)) - 1;
    return targets[monthIndex] || 0;
  };

  const formatKpiValue = (actual: number, target: number, isMonetary = false) => {
    const prefix = isMonetary ? '¥' : '';
    const actualStr = isMonetary ? Math.round(actual).toLocaleString() : actual.toString();
    const targetStr = target > 0 ? (isMonetary ? Math.round(target).toLocaleString() : target.toString()) : '-';
    return `${prefix}${actualStr} / ${prefix}${targetStr}`;
  };

  // アラート削除機能
  const dismissAlert = (alertId: string) => {
    const newDismissedAlerts = new Set(dismissedAlerts);
    newDismissedAlerts.add(alertId);
    setDismissedAlerts(newDismissedAlerts);
    localStorage.setItem('dismissedAlerts', JSON.stringify(Array.from(newDismissedAlerts)));
  };

  // 表示用アラートをフィルタリング
  const visibleAlerts = alerts.filter(alert => !dismissedAlerts.has(alert.id));

  return (
    <div className="dashboard">
      <h1>ダッシュボード</h1>
      
      <div className="tab-container">
        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'overall' ? 'active' : ''}`}
            onClick={() => setActiveTab('overall')}
          >
            全体
          </button>
          <button 
            className={`tab ${activeTab === 'personal' ? 'active' : ''}`}
            onClick={() => setActiveTab('personal')}
          >
            個人
          </button>
          <button 
            className={`tab ${activeTab === 'department' ? 'active' : ''}`}
            onClick={() => setActiveTab('department')}
          >
            部署別
          </button>
        </div>
      </div>

      {activeTab === 'overall' && (
        <div className="dashboard-content">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2>年間累計KPI（全体）</h2>
            <button className="btn" onClick={() => setShowTargetModal(true)}>目標設定</button>
          </div>
          <div className="kpi-grid">
            <div className="kpi-card">
              <h3>総商談数</h3>
              <div className="kpi-value">{loading ? '-' : formatKpiValue(kpiData.totalDeals, calculateYearlyTarget(overallTargets.newDeals) + calculateYearlyTarget(overallTargets.existingDeals))}</div>
            </div>
            <div className="kpi-card">
              <h3>総受注数</h3>
              <div className="kpi-value">{loading ? '-' : formatKpiValue(kpiData.totalOrders, calculateYearlyTarget(overallTargets.newOrders) + calculateYearlyTarget(overallTargets.existingOrders))}</div>
            </div>
            <div className="kpi-card">
              <h3>新規商談数</h3>
              <div className="kpi-value">{loading ? '-' : formatKpiValue(kpiData.newDeals, calculateYearlyTarget(overallTargets.newDeals))}</div>
            </div>
            <div className="kpi-card">
              <h3>新規受注数</h3>
              <div className="kpi-value">{loading ? '-' : formatKpiValue(kpiData.newOrders, calculateYearlyTarget(overallTargets.newOrders))}</div>
            </div>
            <div className="kpi-card">
              <h3>既存商談数</h3>
              <div className="kpi-value">{loading ? '-' : formatKpiValue(kpiData.existingDeals, calculateYearlyTarget(overallTargets.existingDeals))}</div>
            </div>
            <div className="kpi-card">
              <h3>既存受注数</h3>
              <div className="kpi-value">{loading ? '-' : formatKpiValue(kpiData.existingOrders, calculateYearlyTarget(overallTargets.existingOrders))}</div>
            </div>
            <div className="kpi-card">
              <h3>総粗利</h3>
              <div className="kpi-value">{loading ? '-' : formatKpiValue(kpiData.totalGrossProfit, calculateYearlyTarget(overallTargets.grossProfitBudget), true)}</div>
            </div>
            <div className="kpi-card">
              <h3>稼働社数</h3>
              <div className="kpi-value">{loading ? '-' : kpiData.activeClients}</div>
            </div>
            <div className="kpi-card">
              <h3>客単価</h3>
              <div className="kpi-value">{loading ? '-' : `¥${Math.round(kpiData.averageOrderValue).toLocaleString()}`}</div>
            </div>
          </div>
          
          <h2>月別KPI</h2>
          <div className="month-selector">
            <label>月選択:</label>
            <select 
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(e.target.value)}
              style={{ marginLeft: '10px', padding: '8px 12px', borderRadius: '4px', border: '1px solid #ddd' }}
            >
              <option value="">選択してください</option>
              {availableMonths.map(month => (
                <option key={month} value={month}>
                  {month.substring(0, 4)}年{month.substring(5, 7)}月
                </option>
              ))}
            </select>
          </div>
          
          <div className="kpi-grid" style={{ marginTop: '20px' }}>
              <div className="kpi-card">
                <h3>総商談数</h3>
                <div className="kpi-value">{formatKpiValue(monthlyKpiData.totalDeals, getMonthlyTarget(overallTargets.newDeals, selectedMonth) + getMonthlyTarget(overallTargets.existingDeals, selectedMonth))}</div>
              </div>
              <div className="kpi-card">
                <h3>総受注数</h3>
                <div className="kpi-value">{formatKpiValue(monthlyKpiData.totalOrders, getMonthlyTarget(overallTargets.newOrders, selectedMonth) + getMonthlyTarget(overallTargets.existingOrders, selectedMonth))}</div>
              </div>
              <div className="kpi-card">
                <h3>新規商談数</h3>
                <div className="kpi-value">{formatKpiValue(monthlyKpiData.newDeals, getMonthlyTarget(overallTargets.newDeals, selectedMonth))}</div>
              </div>
              <div className="kpi-card">
                <h3>新規受注数</h3>
                <div className="kpi-value">{formatKpiValue(monthlyKpiData.newOrders, getMonthlyTarget(overallTargets.newOrders, selectedMonth))}</div>
              </div>
              <div className="kpi-card">
                <h3>既存商談数</h3>
                <div className="kpi-value">{formatKpiValue(monthlyKpiData.existingDeals, getMonthlyTarget(overallTargets.existingDeals, selectedMonth))}</div>
              </div>
              <div className="kpi-card">
                <h3>既存受注数</h3>
                <div className="kpi-value">{formatKpiValue(monthlyKpiData.existingOrders, getMonthlyTarget(overallTargets.existingOrders, selectedMonth))}</div>
              </div>
              <div className="kpi-card">
                <h3>月粗利</h3>
                <div className="kpi-value">{formatKpiValue(monthlyKpiData.totalGrossProfit, getMonthlyTarget(overallTargets.grossProfitBudget, selectedMonth), true)}</div>
              </div>
              <div className="kpi-card">
                <h3>稼働社数</h3>
                <div className="kpi-value">{monthlyKpiData.activeClients}</div>
              </div>
              <div className="kpi-card">
                <h3>客単価</h3>
                <div className="kpi-value">¥{Math.round(monthlyKpiData.averageOrderValue).toLocaleString()}</div>
              </div>
            </div>
            
          {/* アラートスペース */}
          {visibleAlerts.length > 0 && (
            <div className="alert-section">
              <h2>⚠️ アラート</h2>
              <div className="alert-container">
                {visibleAlerts.map(alert => (
                  <div 
                    key={alert.id} 
                    className={`alert-card ${alert.severity}`}
                  >
                    <div className="alert-header">
                      <div className="alert-icon">
                        {alert.severity === 'error' ? '🚨' : '⚠️'}
                      </div>
                      <div className="alert-content">
                        <div className="alert-client">{alert.clientName}</div>
                        <div className="alert-message">{alert.message}</div>
                        <div className="alert-date">
                          最終: {alert.lastDate.getTime() === 0 ? 'データなし' : alert.lastDate.toLocaleDateString('ja-JP')}
                        </div>
                      </div>
                      <button 
                        className="alert-dismiss"
                        onClick={() => dismissAlert(alert.id)}
                        title="アラートを削除"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
            
          {/* フリーライティングスペース */}
          <FreeWritingSection
            type="monthly"
            userId="overall"
            initialPeriod={currentMonth}
            title="📝 月次フリーライティングスペース"
          />
          
          <FreeWritingSection
            type="weekly"
            userId="overall"
            initialPeriod={currentWeek}
            title="📅 週次フリーライティングスペース"
          />
          
          <div className="chart-section">
            <div className="card">
              <h3>月別 粗利推移</h3>
              {monthlyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => `¥${Math.round(value).toLocaleString()}`} />
                    <Legend />
                    <Line type="monotone" dataKey="粗利" stroke="#82ca9d">
                      <LabelList dataKey="粗利" position="top" formatter={(label: any) => `¥${Math.round(Number(label) || 0).toLocaleString()}`} />
                    </Line>
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="chart-placeholder">
                  データがありません
                </div>
              )}
            </div>
            
            <div className="card">
              <h3>クライアント別YOYグラフ</h3>
              {yoyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={yoyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="client" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip formatter={(value: number) => `¥${Math.round(value).toLocaleString()}`} />
                    <Legend />
                    <Bar dataKey="2025年" fill="#8884d8" />
                    <Bar dataKey="2024年" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="chart-placeholder">
                  データがありません
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'personal' && (
        <div className="dashboard-content">
          <h2>年間累計KPI（個人）</h2>
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label>担当者選択:</label>
            <select 
              value={selectedUser} 
              onChange={(e) => setSelectedUser(e.target.value)}
              style={{ marginLeft: '10px', padding: '5px' }}
            >
              <option value="">選択してください</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>{user.name}</option>
              ))}
            </select>
          </div>
          <div className="kpi-grid">
            <div className="kpi-card">
              <h3>総商談数</h3>
              <div className="kpi-value">{loading ? '-' : formatKpiValue(kpiData.totalDeals, calculateYearlyTarget(personalTargets.newDeals) + calculateYearlyTarget(personalTargets.existingDeals))}</div>
            </div>
            <div className="kpi-card">
              <h3>総受注数</h3>
              <div className="kpi-value">{loading ? '-' : formatKpiValue(kpiData.totalOrders, calculateYearlyTarget(personalTargets.newOrders) + calculateYearlyTarget(personalTargets.existingOrders))}</div>
            </div>
            <div className="kpi-card">
              <h3>新規商談数</h3>
              <div className="kpi-value">{loading ? '-' : formatKpiValue(kpiData.newDeals, calculateYearlyTarget(personalTargets.newDeals))}</div>
            </div>
            <div className="kpi-card">
              <h3>新規受注数</h3>
              <div className="kpi-value">{loading ? '-' : formatKpiValue(kpiData.newOrders, calculateYearlyTarget(personalTargets.newOrders))}</div>
            </div>
            <div className="kpi-card">
              <h3>既存商談数</h3>
              <div className="kpi-value">{loading ? '-' : formatKpiValue(kpiData.existingDeals, calculateYearlyTarget(personalTargets.existingDeals))}</div>
            </div>
            <div className="kpi-card">
              <h3>既存受注数</h3>
              <div className="kpi-value">{loading ? '-' : formatKpiValue(kpiData.existingOrders, calculateYearlyTarget(personalTargets.existingOrders))}</div>
            </div>
            <div className="kpi-card">
              <h3>総粗利</h3>
              <div className="kpi-value">{loading ? '-' : formatKpiValue(kpiData.totalGrossProfit, calculateYearlyTarget(personalTargets.grossProfitBudget), true)}</div>
            </div>
            <div className="kpi-card">
              <h3>稼働社数</h3>
              <div className="kpi-value">{loading ? '-' : kpiData.activeClients}</div>
            </div>
            <div className="kpi-card">
              <h3>客単価</h3>
              <div className="kpi-value">{loading ? '-' : `¥${Math.round(kpiData.averageOrderValue).toLocaleString()}`}</div>
            </div>
          </div>
          
          <h2>月別KPI</h2>
          <div className="month-selector">
            <label>月選択:</label>
            <select 
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(e.target.value)}
              style={{ marginLeft: '10px', padding: '8px 12px', borderRadius: '4px', border: '1px solid #ddd' }}
            >
              <option value="">選択してください</option>
              {availableMonths.map(month => (
                <option key={month} value={month}>
                  {month.substring(0, 4)}年{month.substring(5, 7)}月
                </option>
              ))}
            </select>
          </div>
          
          <div className="kpi-grid" style={{ marginTop: '20px' }}>
            <div className="kpi-card">
              <h3>総商談数</h3>
              <div className="kpi-value">{formatKpiValue(monthlyKpiData.totalDeals, getMonthlyTarget(personalTargets.newDeals, selectedMonth) + getMonthlyTarget(personalTargets.existingDeals, selectedMonth))}</div>
            </div>
            <div className="kpi-card">
              <h3>総受注数</h3>
              <div className="kpi-value">{formatKpiValue(monthlyKpiData.totalOrders, getMonthlyTarget(personalTargets.newOrders, selectedMonth) + getMonthlyTarget(personalTargets.existingOrders, selectedMonth))}</div>
            </div>
            <div className="kpi-card">
              <h3>新規商談数</h3>
              <div className="kpi-value">{formatKpiValue(monthlyKpiData.newDeals, getMonthlyTarget(personalTargets.newDeals, selectedMonth))}</div>
            </div>
            <div className="kpi-card">
              <h3>新規受注数</h3>
              <div className="kpi-value">{formatKpiValue(monthlyKpiData.newOrders, getMonthlyTarget(personalTargets.newOrders, selectedMonth))}</div>
            </div>
            <div className="kpi-card">
              <h3>既存商談数</h3>
              <div className="kpi-value">{formatKpiValue(monthlyKpiData.existingDeals, getMonthlyTarget(personalTargets.existingDeals, selectedMonth))}</div>
            </div>
            <div className="kpi-card">
              <h3>既存受注数</h3>
              <div className="kpi-value">{formatKpiValue(monthlyKpiData.existingOrders, getMonthlyTarget(personalTargets.existingOrders, selectedMonth))}</div>
            </div>
            <div className="kpi-card">
              <h3>月粗利</h3>
              <div className="kpi-value">{formatKpiValue(monthlyKpiData.totalGrossProfit, getMonthlyTarget(personalTargets.grossProfitBudget, selectedMonth), true)}</div>
            </div>
            <div className="kpi-card">
              <h3>稼働社数</h3>
              <div className="kpi-value">{monthlyKpiData.activeClients}</div>
            </div>
            <div className="kpi-card">
              <h3>客単価</h3>
              <div className="kpi-value">¥{Math.round(monthlyKpiData.averageOrderValue).toLocaleString()}</div>
            </div>
          </div>
          
          {/* 個人用週次フリーライティングスペース */}
          {selectedUser && (
            <FreeWritingSection
              type="weekly"
              userId={selectedUser}
              initialPeriod={currentWeek}
              title="📅 週次フリーライティングスペース"
            />
          )}
          
          {/* 個人用月別BGT実績グラフ */}
          {selectedUser && (
            <div className="chart-section" style={{ marginTop: '30px' }}>
              <div className="card">
                <h3>月別BGT vs 実績（個人）</h3>
                {personalMonthlyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={personalMonthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value: number) => `¥${Math.round(value).toLocaleString()}`} />
                      <Legend />
                      <Bar dataKey="BGT" fill="#82ca9d" name="BGT（予算）" />
                      <Bar dataKey="実績" fill="#8884d8" name="実績" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="chart-placeholder">
                    担当者を選択してください
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'department' && (
        <div className="dashboard-content">
          <h2>年間累計KPI（部署別）</h2>
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label>部署選択:</label>
            <select 
              value={selectedDepartment} 
              onChange={(e) => setSelectedDepartment(e.target.value)}
              style={{ marginLeft: '10px', padding: '5px' }}
            >
              <option value="">選択してください</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
          
          <div className="kpi-grid">
            <div className="kpi-card">
              <h3>総商談数</h3>
              <div className="kpi-value">{loading ? '-' : departmentKpiData.totalDeals}</div>
            </div>
            <div className="kpi-card">
              <h3>総受注数</h3>
              <div className="kpi-value">{loading ? '-' : departmentKpiData.totalOrders}</div>
            </div>
            <div className="kpi-card">
              <h3>新規商談数</h3>
              <div className="kpi-value">{loading ? '-' : departmentKpiData.newDeals}</div>
            </div>
            <div className="kpi-card">
              <h3>新規受注数</h3>
              <div className="kpi-value">{loading ? '-' : departmentKpiData.newOrders}</div>
            </div>
            <div className="kpi-card">
              <h3>既存商談数</h3>
              <div className="kpi-value">{loading ? '-' : departmentKpiData.existingDeals}</div>
            </div>
            <div className="kpi-card">
              <h3>既存受注数</h3>
              <div className="kpi-value">{loading ? '-' : departmentKpiData.existingOrders}</div>
            </div>
            <div className="kpi-card">
              <h3>総粗利</h3>
              <div className="kpi-value">{loading ? '-' : `¥${Math.round(departmentKpiData.totalGrossProfit).toLocaleString()}`}</div>
            </div>
            <div className="kpi-card">
              <h3>稼働社数</h3>
              <div className="kpi-value">{loading ? '-' : departmentKpiData.activeClients}</div>
            </div>
            <div className="kpi-card">
              <h3>客単価</h3>
              <div className="kpi-value">{loading ? '-' : `¥${Math.round(departmentKpiData.averageOrderValue).toLocaleString()}`}</div>
            </div>
          </div>
          
          <h2>月別KPI</h2>
          <div className="month-selector">
            <label>月選択:</label>
            <select 
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(e.target.value)}
              style={{ marginLeft: '10px', padding: '8px 12px', borderRadius: '4px', border: '1px solid #ddd' }}
            >
              <option value="">選択してください</option>
              {availableMonths.map(month => (
                <option key={month} value={month}>
                  {month.substring(0, 4)}年{month.substring(5, 7)}月
                </option>
              ))}
            </select>
          </div>
          
          <div className="kpi-grid" style={{ marginTop: '20px' }}>
            <div className="kpi-card">
              <h3>総商談数</h3>
              <div className="kpi-value">{departmentMonthlyKpiData.totalDeals}</div>
            </div>
            <div className="kpi-card">
              <h3>総受注数</h3>
              <div className="kpi-value">{departmentMonthlyKpiData.totalOrders}</div>
            </div>
            <div className="kpi-card">
              <h3>新規商談数</h3>
              <div className="kpi-value">{departmentMonthlyKpiData.newDeals}</div>
            </div>
            <div className="kpi-card">
              <h3>新規受注数</h3>
              <div className="kpi-value">{departmentMonthlyKpiData.newOrders}</div>
            </div>
            <div className="kpi-card">
              <h3>既存商談数</h3>
              <div className="kpi-value">{departmentMonthlyKpiData.existingDeals}</div>
            </div>
            <div className="kpi-card">
              <h3>既存受注数</h3>
              <div className="kpi-value">{departmentMonthlyKpiData.existingOrders}</div>
            </div>
            <div className="kpi-card">
              <h3>月粗利</h3>
              <div className="kpi-value">¥{Math.round(departmentMonthlyKpiData.totalGrossProfit).toLocaleString()}</div>
            </div>
            <div className="kpi-card">
              <h3>稼働社数</h3>
              <div className="kpi-value">{departmentMonthlyKpiData.activeClients}</div>
            </div>
            <div className="kpi-card">
              <h3>客単価</h3>
              <div className="kpi-value">¥{Math.round(departmentMonthlyKpiData.averageOrderValue).toLocaleString()}</div>
            </div>
          </div>
          
          {/* 部署別グラフセクション */}
          <div className="chart-section" style={{ marginTop: '30px' }}>
            <div className="card">
              <h3>月別BGT vs 実績（部署別）</h3>
              {departmentMonthlyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={departmentMonthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => `¥${Math.round(value).toLocaleString()}`} />
                    <Legend />
                    <Bar dataKey="BGT" fill="#82ca9d" name="BGT（予算）" />
                    <Bar dataKey="粗利" fill="#8884d8" name="実績" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p>部署を選択してください</p>
              )}
            </div>
            
            <div className="card">
              <h3>月別 粗利推移（部署別）</h3>
              {departmentMonthlyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={departmentMonthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => `¥${Math.round(value).toLocaleString()}`} />
                    <Legend />
                    <Line type="monotone" dataKey="粗利" stroke="#82ca9d">
                      <LabelList dataKey="粗利" position="top" formatter={(label: any) => `¥${Math.round(Number(label) || 0).toLocaleString()}`} />
                    </Line>
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="chart-placeholder">
                  部署を選択してください
                </div>
              )}
            </div>
            
            <div className="card">
              <h3>部署別粗利比較</h3>
              {departmentComparisonData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={departmentComparisonData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="department" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip formatter={(value: number) => `¥${Math.round(value).toLocaleString()}`} />
                    <Legend />
                    <Bar dataKey="粗利" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="chart-placeholder">
                  データがありません
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 全体目標設定モーダル */}
      {showTargetModal && (
        <div className="modal-overlay" onClick={() => setShowTargetModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>全体目標設定</h3>
              <button className="close-btn" onClick={() => setShowTargetModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="target-category">
                <h4>新規商談数</h4>
                <div className="month-grid">
                  {Array.from({ length: 12 }, (_, i) => (
                    <div key={i} className="month-input">
                      <label>{i + 1}月</label>
                      <input
                        type="number"
                        value={overallTargets.newDeals[i]}
                        onChange={(e) => {
                          const newTargets = { ...overallTargets };
                          newTargets.newDeals[i] = parseInt(e.target.value) || 0;
                          setOverallTargets(newTargets);
                        }}
                        min="0"
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div className="target-category">
                <h4>新規受注数</h4>
                <div className="month-grid">
                  {Array.from({ length: 12 }, (_, i) => (
                    <div key={i} className="month-input">
                      <label>{i + 1}月</label>
                      <input
                        type="number"
                        value={overallTargets.newOrders[i]}
                        onChange={(e) => {
                          const newTargets = { ...overallTargets };
                          newTargets.newOrders[i] = parseInt(e.target.value) || 0;
                          setOverallTargets(newTargets);
                        }}
                        min="0"
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div className="target-category">
                <h4>既存商談数</h4>
                <div className="month-grid">
                  {Array.from({ length: 12 }, (_, i) => (
                    <div key={i} className="month-input">
                      <label>{i + 1}月</label>
                      <input
                        type="number"
                        value={overallTargets.existingDeals[i]}
                        onChange={(e) => {
                          const newTargets = { ...overallTargets };
                          newTargets.existingDeals[i] = parseInt(e.target.value) || 0;
                          setOverallTargets(newTargets);
                        }}
                        min="0"
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div className="target-category">
                <h4>既存受注数</h4>
                <div className="month-grid">
                  {Array.from({ length: 12 }, (_, i) => (
                    <div key={i} className="month-input">
                      <label>{i + 1}月</label>
                      <input
                        type="number"
                        value={overallTargets.existingOrders[i]}
                        onChange={(e) => {
                          const newTargets = { ...overallTargets };
                          newTargets.existingOrders[i] = parseInt(e.target.value) || 0;
                          setOverallTargets(newTargets);
                        }}
                        min="0"
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div className="target-category">
                <h4>粗利BGT（円）</h4>
                <div className="month-grid">
                  {Array.from({ length: 12 }, (_, i) => (
                    <div key={i} className="month-input">
                      <label>{i + 1}月</label>
                      <input
                        type="number"
                        value={overallTargets.grossProfitBudget[i]}
                        onChange={(e) => {
                          const newTargets = { ...overallTargets };
                          newTargets.grossProfitBudget[i] = parseInt(e.target.value) || 0;
                          setOverallTargets(newTargets);
                        }}
                        min="0"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowTargetModal(false)}>キャンセル</button>
              <button className="btn" onClick={saveOverallTargets}>保存</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
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
        
        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }
        
        .kpi-card {
          background: #ffffff;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          text-align: center;
        }
        
        .kpi-card h3 {
          margin-bottom: 10px;
          color: #666;
          font-size: 14px;
        }
        
        .kpi-value {
          font-size: 24px;
          font-weight: bold;
          color: #1976d2;
        }
        
        .chart-section {
          display: grid;
          grid-template-columns: 1fr;
          gap: 20px;
        }
        
        .chart-placeholder {
          height: 200px;
          background-color: #f5f5f5;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #666;
          border-radius: 4px;
        }
        
        .month-selector {
          margin: 20px 0;
          padding: 15px;
          background: #ffffff;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          display: flex;
          align-items: center;
        }
        
        .month-selector label {
          font-weight: 500;
          color: #333;
        }
        
        @media (max-width: 768px) {
          .chart-section {
            grid-template-columns: 1fr;
          }
          
          .kpi-grid {
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          }
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
          background: #ffffff;
          border-radius: 8px;
          max-width: 1200px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
          width: 90vw;
        }
        
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid #ddd;
        }
        
        .modal-header h3 {
          margin: 0;
          color: #1976d2;
        }
        
        .close-btn {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #666;
        }
        
        .modal-body {
          padding: 20px;
        }
        
        .target-category {
          margin-bottom: 30px;
          padding: 15px;
          border: 1px solid #ddd;
          border-radius: 8px;
        }
        
        .target-category h4 {
          margin-bottom: 15px;
          color: #1976d2;
          font-size: 16px;
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
        
        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          padding: 20px;
          border-top: 1px solid #ddd;
        }
        
        @media (max-width: 768px) {
          .modal-content {
            width: 95vw;
            max-height: 95vh;
          }
          
          .month-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
          }
        }
        
        @media (max-width: 480px) {
          .month-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        
        /* アラートスペーススタイル */
        .alert-section {
          margin: 30px 0;
        }
        
        .alert-section h2 {
          margin-bottom: 15px;
          color: #e65100;
          font-size: 18px;
        }
        
        .alert-container {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .alert-card {
          background: #ffffff;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          border-left: 4px solid;
          overflow: hidden;
        }
        
        .alert-card.warning {
          border-left-color: #ff9800;
        }
        
        .alert-card.error {
          border-left-color: #f44336;
        }
        
        .alert-header {
          display: flex;
          align-items: center;
          padding: 15px;
          gap: 12px;
        }
        
        .alert-icon {
          font-size: 20px;
          flex-shrink: 0;
        }
        
        .alert-content {
          flex: 1;
        }
        
        .alert-client {
          font-weight: bold;
          color: #333;
          margin-bottom: 4px;
        }
        
        .alert-message {
          color: #666;
          font-size: 14px;
          margin-bottom: 4px;
        }
        
        .alert-date {
          color: #999;
          font-size: 12px;
        }
        
        .alert-dismiss {
          background: none;
          border: none;
          font-size: 18px;
          cursor: pointer;
          color: #999;
          padding: 5px;
          border-radius: 50%;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        
        .alert-dismiss:hover {
          background-color: #f5f5f5;
          color: #666;
        }
        
        @media (max-width: 768px) {
          .alert-header {
            padding: 12px;
            gap: 8px;
          }
          
          .alert-client {
            font-size: 14px;
          }
          
          .alert-message {
            font-size: 13px;
          }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;