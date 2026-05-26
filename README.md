# Attendance-management-system

## 概要

学校用の出欠管理システム

## 使用技術

### サーバーソフト

- XAMPP

### フロントエンド

- HTML
- CSS
- JavaScript

### バックエンド

- PHP

### データベース

- MySQL(MariaDB)


## 機能

- ログイン
- 出欠登録
- 履歴管理


## 要件定義

- 授業開始時に先生が入力
    - 担当講師選択
    - 担当コマの選択
    - 出欠の入力

- ユーザー管理(先生、生徒、管理者)
    - 管理者
        - 先生アカウントの追加、生徒アカウントの追加
    - 先生
        - 出欠の入力
        - 各個人の出席率等表示
            - 設計段階で要検討
    - 生徒
        - 自身の出席率表示

- 帳票出力・できればコマ事計算(先生)


## フォルダ構成
```
Attendance-management-system
│
├ docs
│   ├ 詳細設計書-画面(出欠管理システム).xlsx
│   └ 詳細設計書-DB(出欠管理システム).xlsx
│
├ public
│   ├ index.html
│   ├ pages
│   │   ├ admin
│   │   │   └ admin.html
│   │   │      ...
│   │   ├ student
│   │   │   └ student.html
│   │   │      ...
│   │   └ teacher
│   │       └ teacher.html
│   │          ...
│   │
│   └ assets
│       ├ css
│       └ js
│       
│
├ backend
│   ├ config
│   │   └ db.php
│   │
│   ├ lib
│   │   ├ auth.php
│   │   ├ db.php
│   │   └ utils.php
│   │
│   └ api
│
├ db
│   └ schema.sql
│
├ README.md
└ .gitignore
```
※ セキュリティおよび個人情報保護のため、
テストデータ投入用SQLは公開対象から除外しています。

## セットアップ

1. XAMPPを起動
2. Apache / MySQL を開始
3. db/schema.sql をインポート
4. public/index.html にアクセス

## DB設定

backend/config/db.sample.php を参考に、
db.php を作成してください。

## 画面一覧

### 教員画面

- ログイン
- 機能選択ダッシュボード
- 全体出欠画面(参照)
- 全体出欠画面(編集)
- 教科別確認

### 生徒画面

- ログイン
- 機能選択ダッシュボード
- 教科別確認

### 管理者画面

- ログイン
- 機能選択ダッシュボード
- ユーザー編集
- ユーザー追加
- ユーザー設定変更
- パスワード変更
- 教科編集
- 教科追加
- 教科設定変更
- ログ(編集・保存履歴)

## 制作背景
教員の出欠管理を効率化するために制作。

## 今後の課題
- 管理者画面の実装
- セキュリティの強化
- UI改善
- 権限制御