# 営業管理システム

Firebaseを使用したモダンな営業管理システムです。

## 🚀 機能

### 基本機能
- **認証システム** - Firebase Authentication
- **マスタ管理** - 担当者・提案メニューの管理
- **案件管理** - プロジェクト・クライアント管理
- **アクションログ** - 営業活動の記録・管理
- **受注管理** - 受注情報の管理・CSVインポート
- **KPI管理** - 月次目標設定・管理
- **ダッシュボード** - リアルタイムKPI表示・グラフ

### 高度な機能
- **自動データ連携** - 案件・アクション・受注の自動連携
- **グラフ表示** - 月別売上推移・クライアント別YOY
- **CSVインポート** - 実績データの一括登録
- **アラート機能** - 休眠クライアント検出
- **レスポンシブデザイン** - モバイル対応

## 📋 セットアップ

### 1. 依存関係のインストール
```bash
npm install
```

### 2. Firebase設定
1. [Firebase Console](https://console.firebase.google.com/)でプロジェクトを作成
2. Authentication（Email/Password）を有効化
3. Firestoreデータベースを作成
4. `src/firebase/config.ts`にFirebase設定を入力

```typescript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};
```

### 3. 開発サーバー起動
```bash
npm run dev
```

### 4. 本番環境ビルド
```bash
npm run build
```

### 5. Firebase デプロイ
```bash
# Firebase CLI インストール
npm install -g firebase-tools

# ログイン
firebase login

# プロジェクト初期化
firebase init

# デプロイ
firebase deploy
```

## 🗄️ データ構造

### コレクション
- **users** - 担当者情報
- **proposalMenus** - 提案メニュー
- **projects** - プロジェクト・案件
- **actionLogs** - アクションログ
- **orders** - 受注情報
- **performance** - 実績データ
- **salesTargets** - 営業目標
- **clients** - クライアント情報

## 📊 CSVインポート形式

### 実績データ
```csv
クライアント名,案件名,計上月,売上,コスト,粗利
株式会社A,システム開発,2025-01,1000000,800000,200000
株式会社B,コンサルティング,2025-01,500000,300000,200000
```

## 🔐 セキュリティ

- Firebase Authentication による認証
- Firestore Security Rules による認可
- 認証されたユーザーのみアクセス可能

## 🛠️ 技術スタック

- **フロントエンド**: React 19, TypeScript, Vite
- **バックエンド**: Firebase (Firestore, Authentication)
- **UI**: CSS-in-JS, Recharts
- **デプロイ**: Firebase Hosting

## 📱 対応ブラウザ

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## 🔧 開発

### ディレクトリ構造
```
src/
├── components/     # 共通コンポーネント
├── contexts/       # React Context
├── firebase/       # Firebase設定
├── pages/          # ページコンポーネント
├── services/       # Firestore操作
└── types/          # TypeScript型定義
```

### 主要コマンド
```bash
npm run dev      # 開発サーバー起動
npm run build    # 本番ビルド
npm run preview  # ビルド結果のプレビュー
npm run lint     # ESLint実行
```

## 📈 KPI定義

- **新規商談数**: 新規クライアントとの商談数
- **既存商談数**: 既存クライアントとの商談数
- **新規受注数**: 新規クライアントからの受注数
- **既存受注数**: 既存クライアントからの受注数
- **稼働社数**: 当月に売上があったクライアント数
- **客単価**: 総粗利 ÷ 稼働社数

## 📞 サポート

システムに関するお問い合わせやバグ報告は、開発チームまでご連絡ください。