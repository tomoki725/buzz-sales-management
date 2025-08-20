# Sales Management System Specifications

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

### 案件単位テーブル仕様
| 列名 | 表示内容 | データソース |
|------|----------|--------------|
| 商材名 | プロジェクトの商材名 | project.productName |
| 提案メニュー | 提案メニューの名称 | proposalMenus.name (IDから名称に変換) |
| クライアント | クライアント名 | project.clientName |
| 担当者 | 担当者名 | users.name (IDから名称に変換) |
| ステータス | 案件ステータス | カラーバッジで表示 |
| 実績 | 最新ログの実績タイプ | 未選択/新規/既存 (カラーバッジ) |
| 最終接触日 | 最後の接触日 | project.lastContactDate |
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

### 最新アップデート (2025/8/20)
1. **実績列の追加**: ActionLogのperformanceTypeフィールドとの連携
2. **提案メニュー表示修正**: IDから名称表示への変更
3. **デバッグ機能**: コンソール出力による動作確認機能