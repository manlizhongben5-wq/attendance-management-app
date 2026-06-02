# attendance-management-app

学校向けの出欠管理システムです。

教員による出欠登録、生徒による出席状況確認、管理者によるユーザー管理を行うことができます。

---

## 目次

- [概要](#概要)
- [制作背景](#制作背景)
- [実装機能](#実装機能)
- [画面イメージ](#画面イメージ)
- [使用技術](#使用技術)
- [システム構成](#システム構成)
- [工夫した点](#工夫した点)
- [フォルダ構成](#フォルダ構成)
- [セットアップ](#セットアップ)
- [動作確認用アカウント](#動作確認用アカウント)
- [今後の課題](#今後の課題)

---

## 概要

本アプリは、学校における出欠管理業務を効率化することを目的として開発したWebアプリケーションです。

管理者・教員・生徒の3つのロールを設け、権限に応じた機能を提供しています。

---

## 制作背景

出欠管理業務では、授業ごとの出欠入力や出席状況確認に手間がかかる課題がありました。

そのため、出欠情報を一元管理できるシステムを開発し、業務効率化を目的としました。

---

## 実装機能

### 共通機能
- ログイン / ログアウト
- セッション管理
- ロール別アクセス制御

### 教員機能
- 出欠登録
- 出欠編集
- 授業別出欠確認
- 出席率確認

### 生徒機能
- 自身の出席状況確認
- 教科別出席率確認

### 管理者機能
- ユーザー編集
- パスワード変更

### その他
- トランザクション処理
- ロールバック処理

---

## 画面イメージ

### 教員ダッシュボード

教員用の機能選択画面

![teacher-dashboard](public/assets/images/teacher-dashboard.png)

---

### 出欠入力画面

授業ごとの出欠登録・編集機能

![attendance-record](public/assets/images/attendance-record.png)

---

### 管理者ユーザー編集画面

管理者によるユーザー管理機能

![admin-user-edit](public/assets/images/admin-user-edit.png)

---

### 生徒出席確認画面

教科別の出席コマ数・出席率の確認画面

![student-attendance-summary](public/assets/images/student-attendance-summary.png)

---

## 使用技術

| 分類 | 技術 |
|------|------|
| フロントエンド | HTML / CSS / JavaScript |
| バックエンド | PHP |
| データベース | MariaDB |
| 開発環境 | XAMPP |
| 仮想環境 | VirtualBox |
| OS | Windows（開発環境） / Ubuntu Server（検証環境） |
| バージョン管理 | Git / GitHub |

---

## システム構成

```text
Browser
   │
   ▼
Apache
   │
   ▼
 PHP
   │
   ▼
MariaDB
```

VirtualBox上にUbuntu Server環境を構築し、Apache・PHP・MariaDBによる動作確認を行っています。

---

## 工夫した点

- 管理者・教員・生徒ごとに機能と画面を分離
- セッション管理による認証機能を実装
- ロール別アクセス制御を実装
- PDOを用いた安全なDB接続を実装
- 出欠登録処理にトランザクションを適用し、データ整合性を確保
- Ubuntu Server環境での動作確認を実施
- GitHub公開時に機密情報を除外する構成を設計

---

## フォルダ構成

```text
attendance-management-app
│
├ public
│   ├ index.html
│   ├ assets
│   │   ├ css
│   │   ├ js
│   │   └ images
│   │
│   └ pages
│       ├ admin
│       ├ student
│       └ teacher
│
├ backend
│   ├ config
│   │   └ db.sample.php
│   └ php
│
├ db
│   ├ schema.sql
│   └ demo_data.sql
│
│
├ README.md
└ .gitignore
```

---

## セットアップ

### 1. プロジェクト配置

本プロジェクトを XAMPP の `htdocs` 配下に配置してください。

例：

```text
C:\xampp\htdocs\attendance-management-app
```

---

### 2. XAMPP起動

XAMPP Control Panel を開き、以下を起動してください。

- Apache
- MySQL

---

### 3. データベース作成

ブラウザで phpMyAdmin を開きます。

```text
http://localhost/phpmyadmin
```

新しいデータベースを作成してください。

データベース名：

```text
attendance_management
```

文字コードは `utf8mb4` を推奨しています。

---

### 4. SQLインポート

`db` フォルダ内の以下の SQL ファイルを、上から順番に phpMyAdmin へインポートしてください。

```text
1. schema.sql
2. demo_data.sql
```

- `schema.sql`

  - テーブル作成用
  - 外部キー制約を含む

- `demo_data.sql`

  - 動作確認用デモデータ

---

### 5. DB設定

`backend/config/db.sample.php` をコピーし、
`backend/config/db.php` を作成してください。

例：

```text
db.sample.php → db.php
```
- 接続情報は環境に応じて変更してください

---

### 6. アプリへアクセス

ブラウザで以下へアクセスしてください。

```text
http://localhost/attendance-management-app/public/index.html
```

---

## 動作確認用アカウント

| 種別  | ID         | パスワード    |
| --- | ---------- | -------- |
| 管理者 | admin01    | password |
| 教員  | 0000000001 | password |
| 生徒  | 000001     | password |

---

## 今後の課題
- 教員アカウント追加機能
- 生徒アカウント追加機能
- 教科の追加・編集・削除機能
- 編集ログ保存機能
- ログ閲覧機能
- バリデーション強化
- 権限制御の強化
- セキュリティ強化
- UI / UX改善（レスポンシブ対応）
- 帳票出力機能の改善
