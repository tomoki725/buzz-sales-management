# BuzzSalesMgr - 営業管理システム

## 概要
React + TypeScript + Firebase を使用した営業管理システムです。
営業活動の記録・管理から KPI 分析まで、包括的な営業支援機能を提供します。

## 主要機能

### 1. ダッシュボード
- **全体タブ**
  - 年間累計KPI表示（商談数、受注数、粗利、稼働社数、客単価）
  - 月別KPI表示（月選択プルダウン対応）
  - 月別粗利推移グラフ
  - クライアント別YOYグラフ
  - **目標設定機能**: ポップアップモーダルで全体目標を月別に設定可能
    - 新規商談数
    - 新規受注数
    - 既存商談数
    - 既存受注数
    - 粗利BGT（円）

- **個人タブ**
  - 担当者選択プルダウン
  - 個人別KPI表示（年間累計・月別）
  - 選択した担当者に連動したデータフィルタリング
  - 月別KPIも担当者変更に連動
  - **週次フリーライティングスペース**: 自由記入欄、左右ナビゲーション、自動保存機能

- **部署別タブ**
  - 部署別統計情報の表示（実装予定）

### 1.1. フリーライティング機能
- **月次フリーライティングスペース**（全体タブのみ）
  - 月別の自由記入欄
  - 左右ナビゲーションボタンで月切り替え
  - 2秒間のデバウンス自動保存機能
  - 手動保存ボタン
  - 保存ステータス表示（保存中/保存済み/エラー）

- **週次フリーライティングスペース**（全体・個人タブ）
  - **週表示フォーマット**: 「2025年8月21-27」形式で日付範囲を表示
  - 週別の自由記入欄
  - 左右ナビゲーションボタンで週切り替え
  - ISO週番号ベースの正確な週計算
  - 月をまたぐ週の表示対応（例：「2025年8/30-9/5」）
  - 2秒間のデバウンス自動保存機能
  - 手動保存ボタン
  - 保存ステータス表示（保存中/保存済み/エラー）

### 2. 案件管理
- **案件単位タブ**
  - 案件の一覧表示（テーブル形式）
  - ステータス・担当者フィルタリング機能
  - 詳細・編集・追加・削除ボタン（モーダル対応）
  - 実績（performanceType）表示：未選択/新規/既存の色分け表示

- **クライアント単位タブ（アコーディオン機能）**
  - **コンパクト表示**: クライアント名のみを初期表示で垂直スペースを節約
  - **アコーディオン展開**: クライアント名クリックで詳細なプロジェクト一覧を表示
  - **クライアントヘッダー**: 
    - クライアント名と案件数（例：株式会社A (3案件)）
    - 最新案件の担当者・ステータス・最終接触日
    - 展開/折りたたみアイコン（▼/▶）
  - **展開時プロジェクト詳細**:
    - 商材名、提案メニュー、担当者、ステータス、実績、最終接触日
    - 各プロジェクトの詳細・編集・追加・削除ボタン
    - 新規追加ボタン（クライアント単位）

- **モーダル機能**
  - 案件詳細表示
  - 案件編集機能
  - 共通のモーダルが両タブで使用可能

### 3. ログ記録
- アクションログの記録機能
- **実績タイプ選択**: プルダウンで「未選択/新規/既存」を選択可能
- プロジェクトに関連する活動記録
- 次回アクション予定の設定

### 4. アクションログ
- 記録されたログの一覧表示
- 過去の営業活動の履歴管理

### 5. 受注管理
- 受注情報の管理
- 売上・コスト・粗利の記録

### 6. 担当者マスタ
- 営業担当者の情報管理
- ユーザー情報の登録・編集・削除

### 7. KPI管理
- **個人別目標設定**
  - 担当者選択
  - 月別目標値設定（12ヶ月分）
    - 新規商談数
    - 新規受注数
    - 既存商談数
    - 既存受注数
    - **粗利BGT（円）**: 月別の粗利バジェット設定

### 8. 実績入力
- **CSVインポート機能**
  - CSVファイルアップロード（担当者名、年月、クライアント名、案件名、実績）
  - 既存データ全削除→新規データ一括登録方式
  - 重複データの自動集約処理
  - インポート結果詳細表示（成功・失敗・削除件数）
  - 担当者マスタとの連携チェック

- **実績データ表示（アコーディオン機能）**
  - **クライアント別整理**: 合計金額順でクライアントをソート
  - **アコーディオン表示**: クライアント名クリックで詳細プロジェクトを展開/折りたたみ
  - **コンパクト初期表示**: 初期状態は全クライアント折りたたみで垂直スペース節約
  - **クライアントヘッダー**: 
    - クライアント名と合計金額を表示
    - 展開/折りたたみアイコン（▼/▶）
    - ホバー時の視覚的フィードバック
  - **展開時プロジェクト詳細**: 年月、案件名、担当者、金額をテーブル表示
  - **スムーズアニメーション**: slideDownアニメーションとチェブロン回転
  - **レスポンシブ対応**: モバイル向け表示調整

### 9. 提案メニューマスタ
- 提案メニューの管理
- サービス・商品の登録

## 技術仕様

### フロントエンド
- **React 18** + **TypeScript**
- **Vite** (ビルドツール)
- **React Router** (ルーティング)
- **Recharts** (グラフ表示)
- レスポンシブデザイン対応

### バックエンド・データベース
- **Firebase Firestore** (NoSQLデータベース)
- **Firebase Hosting** (Webホスティング)
- **Firebase Authentication** (認証機能)

### データ構造
```typescript
interface SalesTarget {
  id: string;
  userId: string; // 個人目標の場合はuserID、全体目標の場合は'overall'
  year: number;
  month: number;
  newDeals: number;
  existingDeals: number;
  newOrders: number;
  existingOrders: number;
  grossProfitBudget?: number; // 粗利バジェット
}

interface ActionLog {
  id: string;
  projectId: string;
  title: string;
  assigneeId: string;
  actionDate: Date;
  nextActionDate?: Date;
  minutes: string;
  nextAction: string;
  status: string;
  summary?: string;
  performanceType?: 'unselected' | 'new' | 'existing'; // 実績タイプ
  createdAt: Date;
}

interface Performance {
  id: string;
  clientName: string;
  projectName: string;
  recordingMonth: string;
  revenue: number;
  cost: number;
  grossProfit: number;
  createdAt: Date;
}

interface FreeWriting {
  id: string;
  userId: string; // 全体タブ: 'overall', 個人タブ: userID
  type: 'monthly' | 'weekly';
  period: string; // 月次: '2025-08', 週次: '2025-W32'
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

// 案件管理のアコーディオン機能用の拡張データ構造
interface EnrichedClient {
  ...Client; // 基本クライアント情報
  projects: EnrichedProject[]; // 詳細情報付きプロジェクト配列
  projectCount: number;
  latestStatus: string;
  lastContactDate: Date | null;
  assigneeName: string;
}

interface EnrichedProject {
  ...Project; // 基本プロジェクト情報
  userName: string; // 担当者名（IDから解決済み）
  proposalMenuName: string; // 提案メニュー名（IDから解決済み）
  performanceType?: 'unselected' | 'new' | 'existing'; // 実績タイプ
}
```

### アコーディオン機能技術実装
```typescript
// 状態管理
const [expandedClients, setExpandedClients] = useState<Set<string>>(new Set());

// 展開・折りたたみ制御
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

// データ取得とエンリッチメント
const groupedClients = clients.map(client => {
  const clientProjects = projects.filter(p => p.clientName === client.name);
  const enrichedProjects = clientProjects.map(project => ({
    ...project,
    userName: users.find(u => u.id === project.assigneeId)?.name || '-',
    proposalMenuName: proposalMenus.find(menu => menu.id === project.proposalMenuId)?.name || '-',
    performanceType: actionLogs
      .filter(log => log.projectId === project.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]?.performanceType
  }));
  // ... その他のクライアント情報処理
});
```

## デプロイメント
- **本番環境**: https://sales-management-system-2b9db.web.app
- **Firebase プロジェクト**: sales-management-system-2b9db
- **ビルドコマンド**: `npm run build`
- **デプロイコマンド**: `firebase deploy --only hosting`

## UI/UX設計
- **ヘッダーナビゲーション**: 
  - ロゴ「BuzzSalesMgr」
  - 9つの主要機能へのリンク
  - ログアウトボタン
  - 折り返し防止設計（white-space: nowrap）

- **レイアウト**:
  - 中央配置デザイン（max-width: 1400px）
  - カード形式のUI
  - グリッドレイアウトによるKPI表示

- **アコーディオンデザイン**:
  - **インタラクティブヘッダー**: クリック可能なクライアントヘッダー
  - **ビジュアルフィードバック**: ホバー時の背景色変化とシャドウ効果
  - **展開アニメーション**: slideDown CSS アニメーション（0.3s ease-out）
  - **チェブロンアイコン**: ▼/▶ アイコンの回転アニメーション（0.2s ease-in-out）
  - **階層表示**: ヘッダー（グレー背景）→コンテンツ（白背景）の視覚的階層
  - **レスポンシブ対応**: モバイルでの縦積み表示とフォントサイズ調整

- **カラーシステム**:
  - **ステータスバッジ**: 提案中（青）、交渉中（オレンジ）、受注（緑）、失注（赤）、稼働中（紫）、稼働終了（グレー）
  - **実績バッジ**: 新規（緑）、既存（青）、未選択（オレンジ）、データなし（グレー）
  - **アコーディオン**: ヘッダー（#f8f9fa）、ホバー（#f0f1f2）、ボーダー（#e0e0e0）

- **グラフ・チャート**:
  - 月別粗利推移（売上表示は削除済み）
  - クライアント別YOY比較
  - レスポンシブ対応

## 主要な更新履歴
1. **実績タイプ機能追加**: ログ記録時に「未選択/新規/既存」選択可能
2. **案件管理モーダル修正**: 詳細・編集ボタンの動作修正
3. **ダッシュボード月別KPI追加**: 年間累計に加えて月別表示機能
4. **個人KPI連動機能**: 担当者変更時の月別KPI自動更新
5. **中央配置レイアウト修正**: 全画面での中央配置実現
6. **ナビゲーション改善**: メニュー項目の折り返し防止
7. **ロゴ変更**: 「営業管理システム」→「BuzzSalesMgr」
8. **KPI管理機能拡張**: 粗利BGT月別入力機能追加
9. **売上表示削除**: グラフとKPIから売上項目を削除、粗利中心の表示に変更
10. **全体目標設定機能追加**: ダッシュボード全体タブにポップアップモーダル形式の目標設定機能
11. **案件管理アコーディオン機能追加**: クライアント単位タブにアコーディオン式展開表示を実装、垂直スペースを大幅削減
12. **実績入力ページアコーディオン機能追加**: 実績データ表示にもアコーディオン機能を実装、初期表示をコンパクト化
13. **フリーライティング機能追加**: ダッシュボードに月次・週次フリーライティングスペース実装、自動保存・期間ナビゲーション対応
14. **週表示フォーマット改善**: 週次表示を「2025年第34週」から「2025年8月21-27」の日付範囲表示に変更

## 今後の拡張予定
- 部署別統計機能の実装
- より詳細なレポート機能
- データエクスポート機能
- 通知・アラート機能

---
*最終更新日: 2025年8月21日*