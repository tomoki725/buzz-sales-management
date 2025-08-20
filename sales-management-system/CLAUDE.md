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

- **部署別タブ**
  - 部署別統計情報の表示（実装予定）

### 2. 案件管理
- **案件一覧**
  - 案件の一覧表示
  - ステータス・担当者フィルタリング機能
  - 詳細・編集ボタン（モーダル対応）

- **顧客一覧**
  - 顧客情報の表示・管理

- **モーダル機能**
  - 案件詳細表示
  - 案件編集機能
  - 実績（performanceType）表示：未選択/新規/既存の色分け表示

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
- 月別実績データの入力
- 売上・コスト・粗利の記録

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

## 今後の拡張予定
- 部署別統計機能の実装
- より詳細なレポート機能
- データエクスポート機能
- 通知・アラート機能

---
*最終更新日: 2025年8月20日*