# BuzzSalesMgr - 営業管理システム仕様書

## Technology Stack
- **Build Tool**: Vite
- **Frontend Framework**: React
- **Programming Language**: TypeScript
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Hosting**: Firebase Hosting

---

## Dashboard Specifications

### URL
https://sales-management-system-2b9db.web.app/dashboard

### Core Technologies
- **Vite**: Fast build tool and development server
- **React**: Component-based UI library for building interactive user interfaces
- **TypeScript**: Strongly-typed JavaScript for better development experience and code reliability

---

## 案件管理画面 (Project Management) Specifications

### URL
https://sales-management-system-2b9db.web.app/projects

### 基本機能
- **ページタイトル**: 案件管理
- **新規追加ボタン**: ログ記録画面(/action-log/record)への遷移

### タブ機能
1. **案件単位**: 全案件を一覧表示
2. **クライアント単位**: クライアントごとに集約した表示

### フィルター機能
- **ステータスフィルター**: 全て/提案中/交渉中/受注/失注/稼働中/稼働終了
- **担当者フィルター**: 全て + 登録済みユーザー一覧
- **実績フィルター**: 全て/新規/既存/未選択

### 案件単位テーブル仕様
| 列名 | 表示内容 | データソース |
|------|----------|--------------|
| 商材名 | プロジェクトの商材名 | project.productName |
| 提案メニュー | 提案メニューの名称 | proposalMenus.name (IDから名称に変換) |
| クライアント | クライアント名 | project.clientName |
| 担当者 | 担当者名 | users.name (IDから名称に変換) |
| ステータス | 案件ステータス | カラーバッジで表示 |
| 実績 | 最新ログの実績タイプ | 未選択/新規/既存 (カラーバッジ) |
| 初回商談日 | 初回商談日 | project.firstMeetingDate (ソート可能) |
| 受注日 | 受注日 | project.orderDate (ソート可能) |
| 最終接触日 | 最後の接触日 | project.lastContactDate (ソート可能) |
| アクション | 操作ボタン群 | 詳細/編集/追加/削除 |

### ステータス表示
- **提案中** (proposal): 青色バッジ
- **交渉中** (negotiation): オレンジ色バッジ
- **受注** (won): 緑色バッジ
- **失注** (lost): 赤色バッジ
- **稼働中** (active): 紫色バッジ
- **稼働終了** (completed): グレー色バッジ

### 実績表示
- **新規** (new): 緑色バッジ
- **既存** (existing): 青色バッジ
- **未選択** (unselected): オレンジ色バッジ
- **データなし** (-): グレー色バッジ

### クライアント単位テーブル仕様
| 列名 | 表示内容 |
|------|----------|
| クライアント名 | クライアント名 |
| 担当者 | 最新案件の担当者 |
| ステータス | 最新案件のステータス |
| 最終接触日 | 最新案件の最終接触日 |
| アクション | 追加ボタン |

### 技術実装詳細
- **データ取得**: getProjects(), getClients(), getUsers(), getActionLogs(), getProposalMenus()
- **レスポンシブデザイン**: モバイル対応のCSSグリッド
- **リアルタイム更新**: Firestoreとの連携
- **型安全性**: TypeScriptによる型定義

### 最新アップデート (2025/8/22)
1. **受注管理システム修正**: 受注ステータス案件の受注管理画面への自動同期機能実装
2. **KPI管理入力改善**: 数値入力フィールドの直接入力対応と先頭0問題修正
3. **個人BGTグラフ修正**: KPI管理で保存したBGTがダッシュボード個人グラフに正しく反映されるよう修正
4. **部署別BGTグラフ追加**: 部署別タブに月別BGT vs 実績グラフを新規実装
5. **部署選択問題修正**: 部署選択時の画面更新問題を修正
6. **ログ記録フィールド修正**: 次回アクション日・次回アクションを任意項目に変更

## 受注管理システム修正 (2025/8/22)

### 問題と解決
- **問題**: 案件管理で「受注」ステータスにした案件が受注管理に表示されない
- **原因**: Firestoreの`undefined`値エラーとデータ作成タイミング問題
- **解決**:
  1. `firestore.ts`の`createOrder`関数で`undefined`値を除外
  2. `ProjectManagement.tsx`の`syncExistingWonProjects`関数追加
  3. `ActionLogRecord.tsx`の受注データ自動作成機能修正
- **結果**: 既存・新規の受注案件が自動的に受注管理に反映

### 技術実装
```typescript
// Firestore undefined値除外
export const createOrder = async (orderData: Omit<Order, 'id'>) => {
  const cleanData: any = { /* 必須フィールドのみ */ };
  if (orderData.implementationMonth !== undefined) {
    cleanData.implementationMonth = orderData.implementationMonth;
  }
  // ...
};
```

## KPI管理入力改善 (2025/8/22)

### 問題と解決
- **問題**: 100入力時に「0100」になる、直接入力ができない
- **原因**: 初期値`Array(12).fill(0)`による先頭0問題
- **解決**:
  1. 初期値を`Array(12).fill('')`（空文字）に変更
  2. `handleTargetChange`関数でのデータ処理改善
  3. 保存時に`Number(value) || 0`で変換
- **結果**: 自然な数値入力と先頭0問題の解決

## 個人BGTグラフ修正 (2025/8/22)

### 問題と解決
- **問題**: KPI管理で保存したBGTがダッシュボードのグラフに反映されない
- **原因**: Reactのstate更新の非同期性による参照タイミング問題
- **解決**:
  1. `loadPersonalTargets`関数を修正して値を返すように変更
  2. `loadData`内で返された値を直接使用
  3. stateではなく最新データを即座に参照
- **結果**: KPI管理で保存したBGTが即座にグラフに反映

### 技術実装
```typescript
// Before: stateの非同期更新問題
await loadPersonalTargets(selectedUser);
personalTargets.grossProfitBudget.forEach(...); // 古い値

// After: 直接返された値を使用
const personalTargetsData = await loadPersonalTargets(selectedUser);
personalTargetsData.grossProfitBudget.forEach(...); // 最新値
```

## 部署別BGTグラフ追加 (2025/8/22)

### 新機能実装
- **配置**: 部署別タブの最上部に「月別BGT vs 実績（部署別）」グラフを追加
- **BGT算出方式**: 部署内全メンバーの個人目標を合計して部署BGTとして算出
- **グラフタイプ**: 棒グラフ（緑色BGT、青色実績の並列表示）
- **データ連携**: KPI管理で設定した個人BGTが部署別グラフに自動反映

### 技術実装
```typescript
const loadDepartmentTargets = async (department: string, usersData: User[]) => {
  const deptUserIds = usersData.filter(u => u.department === department).map(u => u.id);
  const memberTargetsPromises = deptUserIds.map(async (userId) => {
    // 各メンバーの目標を並行取得
  });
  const memberTargets = await Promise.all(memberTargetsPromises);
  
  // 部署全体の月別BGTを算出
  const departmentBGT = Array(12).fill(0);
  memberTargets.forEach(member => {
    member.targets.grossProfitBudget.forEach((budget, index) => {
      departmentBGT[index] += budget;
    });
  });
  return departmentBGT;
};
```

## 部署選択問題修正 (2025/8/22)

### 問題と解決
- **問題**: 部署選択で「大谷チーム」を選択しても画面が変わらない
- **原因**: `loadData`のuseEffect依存配列に`selectedDepartment`が含まれていない
- **解決**: 依存配列に`selectedDepartment`を追加
- **結果**: 部署選択時にリアルタイムでデータが更新される

```typescript
// Before
useEffect(() => {
  loadData();
}, [activeTab, selectedUser]);

// After  
useEffect(() => {
  loadData();
}, [activeTab, selectedUser, selectedDepartment]);
```

## ログ記録フィールド修正 (2025/8/22)

### 変更内容
- **次回アクション日**: 必須項目 → 任意項目
- **次回アクション**: 必須項目 → 任意項目
- **変更箇所**: `ActionLogRecord.tsx`の`required`属性と必須マーク（*）を削除
- **目的**: より柔軟なログ記録を可能にする

## ダッシュボードKPI受注日統一修正 (2025/8/26)

### 問題の発見
- **受注管理の「確定日」**: `Order.orderDate`（ログ記録時の自動日時）
- **案件管理の「受注日」**: `Project.orderDate`（手動設定、多くが未設定）
- **ダッシュボードKPI**: `Project.orderDate`を参照するため受注日未設定案件が除外される

### 解決内容

#### 1. 受注管理画面の修正
**テーブル列の変更:**
- **削除**: 確定日（`Order.orderDate`）
- **追加**: 受注日（`Project.orderDate` - 未設定時は「-」）
- **追加**: 最終接触日（`Project.lastContactDate` - 未設定時は「-」）

**データソース統一:**
- 受注日: 案件管理で設定した正式な受注日
- 最終接触日: 案件管理で設定されている最終接触日
- フィルター機能も受注日ベースに変更

#### 2. ダッシュボードKPI数値整合性修正
**総受注数計算の統一:**

```typescript
// 修正前（月別KPI）
totalOrders: monthlyProjects.filter(p => p.status === 'won').length,

// 修正後（月別KPI） 
totalOrders: monthlyProjects.filter(p => 
  p.status === 'won' && 
  p.orderDate && 
  p.orderDate.toISOString().substring(0, 7) === selectedMonth
).length,

// 修正前（年間累計KPI）
totalOrders: filteredProjects.filter(p => p.status === 'won').length,

// 修正後（年間累計KPI）
totalOrders: (newOrderProjects.length + existingOrderProjects.length),
```

### 修正の効果
- **データ整合性**: 案件管理の受注日とダッシュボードKPIが同じ`Project.orderDate`を参照
- **数値整合性**: 総受注数 = 新規受注数 + 既存受注数
- **一貫性**: すべてのKPIが受注日ベースで統一
- **除外処理**: 受注日未設定の`status='won'`案件は全KPIから除外

### 技術修正箇所
1. **OrderManagement.tsx**: プロジェクトデータとの結合、テーブル表示修正
2. **Dashboard.tsx**: 月別・年間・部署別KPIの総受注数計算統一
3. **フィルター機能**: 受注日ベースでのフィルタリングに変更

## 案件管理機能強化 (2025/9/1)

### ダッシュボード月別商談数修正
**問題**: 月別KPIで総商談数と新規商談数の数値整合性に問題があった
**解決**: 
1. **総商談数計算**: アクションログ数 → プロジェクト数に統一
2. **月別フィルタリング**: 初回商談日ベースに変更（firstMeetingDate優先、未設定時はcreatedAt）

### 案件管理テーブル機能強化
#### 1. ソート機能追加
- **対象列**: 初回商談日、受注日、最終接触日
- **機能**: ヘッダークリックで昇順・降順切り替え
- **UI**: ソート状態を示すアイコン（△▲▼）表示
- **実装**: クリック可能なヘッダー、ホバー効果、日付null値対応

#### 2. 実績フィルター追加
- **フィルター選択肢**: 全て/新規/既存/未選択
- **連携**: 既存のステータス・担当者フィルターと組み合わせ可能
- **データソース**: 最新アクションログのperformanceType

### 技術実装
```typescript
// ソート機能
const [sortField, setSortField] = useState<'firstMeetingDate' | 'orderDate' | 'lastContactDate' | null>(null);
const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

// 実績フィルター
const [performanceFilter, setPerformanceFilter] = useState('');

// 月別商談フィルタリング（初回商談日ベース）
const monthlyProjects = filteredProjects.filter(p => {
  if (p.firstMeetingDate) {
    return p.firstMeetingDate.toISOString().substring(0, 7) === selectedMonth;
  }
  const createdMonth = p.createdAt.toISOString().substring(0, 7);
  return createdMonth === selectedMonth;
});
```

## 前週対比機能拡張 (2025/9/4)

### 概要
CSV実績データの前回インポートと最新インポートの差分を詳細に比較・分析する機能を実装。

### 主要機能

#### 1. **個人タブ対応**
- 担当者選択時に個人別でフィルタリングした前週対比データを表示
- 全体タブと同様の期間別比較・月別比較機能

#### 2. **月単位での差分表示**
- **期間別比較**: 下期（7月〜12月）、Q3（7月〜9月）、Q4（10月〜12月）
- **月別比較**: 7月〜12月の各月別詳細比較
- 前回インポート vs 最新インポートの金額差分と変化率表示

#### 3. **差分要因詳細（クライアント・案件別）**
- **新規追加案件**: 前回になく最新にある案件
- **金額増加案件**: 前回より金額が増加した案件
- **金額減少案件**: 前回より金額が減少した案件
- **削除案件**: 前回にあり最新にない案件
- 各カテゴリ最大5件表示、超過分は件数表示

#### 4. **アコーディオンUI**
- 期間別・月別のヘッダークリックで展開/折りたたみ
- チェブロンアイコン（▼）の回転アニメーション
- 月別展開時に差分要因詳細を表示

### 技術実装

#### データ構造
```typescript
export interface MonthlyPerformanceComparison {
  month: string; // '2025-07', '2025-08' etc.
  monthName: string; // '7月', '8月' etc.
  previous: number;
  current: number;
  difference: number;
  percentageChange: number;
  details: MonthlyComparisonDetail[]; // 差分要因詳細
}

export interface MonthlyComparisonDetail {
  clientName: string;
  projectName: string;
  previousAmount: number;
  currentAmount: number;
  difference: number;
  changeType: 'new' | 'increased' | 'decreased' | 'removed';
}
```

#### 主要関数
- `getPersonalPerformanceComparison()`: 個人別前週対比データ取得
- `getMonthlyPerformanceComparison()`: 月別比較データ取得
- `calculateMonthlyComparisonDetails()`: 差分要因詳細計算

#### 表示位置
- **全体タブ**: 月別KPI下に期間別・月別比較セクション
- **個人タブ**: 月別KPI下に個人用前週対比セクション

### 使用方法
1. 実績入力でCSVを2回インポート（前回・最新の履歴作成）
2. 全体タブ: 会社全体の前週対比確認
3. 個人タブ: 担当者選択後、個人の前週対比確認
4. 各月クリック: 差分要因詳細（クライアント・案件別）確認

### UI/UX特徴
- **色分け表示**: 増加（緑）・減少（赤）・中立（青・オレンジ）
- **金額表示**: カンマ区切り、円マーク付き
- **変化率**: パーセンテージ表示、矢印アイコン
- **レスポンシブ**: モバイル対応の縦積み表示

---
*最終更新日: 2025年9月4日*