# Firebase設定手順

## 1. Firebaseプロジェクト作成

### ステップ1: Firebase Consoleでプロジェクト作成
1. [Firebase Console](https://console.firebase.google.com/) にアクセス
2. 「プロジェクトを作成」をクリック
3. プロジェクト名を入力（例：`sales-management-system`）
4. Google Analyticsの有効化（オプション）
5. プロジェクトを作成

### ステップ2: Webアプリを追加
1. プロジェクト概要で「Web」アイコンをクリック
2. アプリのニックネームを入力
3. Firebase Hostingの設定（オプション）
4. 「アプリを登録」をクリック
5. **Firebase設定をコピー**（重要！）

### ステップ3: Firebase設定をアプリに追加
`src/firebase/config.ts` を以下のように更新：

```typescript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

## 2. Firebase Authentication設定

### ステップ1: Authenticationを有効化
1. Firebase Console → Authentication
2. 「始める」をクリック
3. 「Sign-in method」タブ
4. 「メール/パスワード」を有効化
5. 保存

### ステップ2: テストユーザー作成
1. 「Users」タブ
2. 「ユーザーを追加」
3. メールアドレスとパスワードを入力
4. ユーザーを追加

## 3. Firestore Database設定

### ステップ1: Firestoreを作成
1. Firebase Console → Firestore Database
2. 「データベースの作成」
3. **テストモードで開始**（本番では本番モードを選択）
4. ロケーション選択（asia-northeast1推奨）
5. 完了

### ステップ2: セキュリティルール設定
Firestoreのルールタブで以下を設定：

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 認証されたユーザーのみアクセス可能
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 4. Firebase Hosting設定（オプション）

### ローカルでのFirebase CLI設定
```bash
# プロジェクトディレクトリで実行
firebase login
firebase init hosting
firebase deploy
```

### 手動でのHosting設定
1. Firebase Console → Hosting
2. 「始める」をクリック
3. `dist` フォルダをアップロード

## 5. 環境変数設定（オプション）

本番環境では環境変数を使用：

```bash
# .env.local
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

## 6. 動作確認

### ステップ1: 開発サーバー起動
```bash
npm run dev
```

### ステップ2: ログイン テスト
1. http://localhost:5173 にアクセス
2. 作成したテストユーザーでログイン
3. ダッシュボードが表示されることを確認

### ステップ3: データ操作テスト
1. 担当者マスタでユーザー追加
2. 提案メニューマスタでメニュー追加
3. アクションログ記録でログ作成
4. Firestoreでデータが保存されていることを確認

## 7. 本番デプロイ

### Firebase Hostingへのデプロイ
```bash
# ビルド
npm run build

# Firebase プロジェクト設定
firebase use --add
# プロジェクトIDを選択

# デプロイ
firebase deploy
```

## トラブルシューティング

### よくある問題
1. **認証エラー**: Firebase設定が正しく入力されているか確認
2. **権限エラー**: Firestoreのセキュリティルールを確認
3. **ビルドエラー**: TypeScriptエラーを解決してから再ビルド

### サポート
- [Firebase Documentation](https://firebase.google.com/docs)
- [Firebase Console](https://console.firebase.google.com/)