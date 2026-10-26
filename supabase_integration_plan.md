# Integration Plan: Supabase Database Migration

This document outlines the plan to migrate the Student Hub database from SQLite to **Supabase** (PostgreSQL) using the Supabase REST API.

## Architecture Overview

We will connect the Flask backend to Supabase via its auto-generated REST API. This method is secure, fast, and does not require installing heavy database drivers.

```mermaid
graph TD
    Browser[Web Browser]
    Flask[Flask Backend (app.py)]
    Supabase[Supabase REST API]
    DB[(Supabase PostgreSQL)]

    Browser -->|JSON API Requests| Flask
    Flask -->|HTTP GET/POST/DELETE + Auth Headers| Supabase
    Supabase -->|PostgREST Engine| DB
```

---

## Step 1: Create a Free Supabase Account & Database

1. Go to [supabase.com](https://supabase.com) and click **Sign Up** (you can sign up with GitHub or an email—no credit card required).
2. Click **New Project** and enter a name (e.g., `studenthub`).
3. Set a secure **Database Password** (save it somewhere safe).
4. Select a region close to you and click **Create New Project**. It will take 1–2 minutes for the database to provision.

---

## Step 2: Create Database Tables

Once your project is ready:
1. In the left-hand sidebar, click on **SQL Editor** (the `SQL` icon).
2. Click **New Query** (or **New Blank Query**).
3. Copy the following SQL statements, paste them into the editor, and click **Run**:

```sql
-- 1. Create USERS table (with login tracking columns)
CREATE TABLE users (
    email TEXT PRIMARY KEY,
    username TEXT NOT NULL,
    password TEXT NOT NULL,
    grade TEXT NOT NULL,
    dept TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    last_login_at TIMESTAMP WITH TIME ZONE,
    login_count INT DEFAULT 0,
    status TEXT DEFAULT 'active'
);

-- 2. Create PROGRESS table
CREATE TABLE progress (
    email TEXT NOT NULL REFERENCES users(email) ON DELETE CASCADE,
    checkpoint_id TEXT NOT NULL,
    PRIMARY KEY (email, checkpoint_id)
);

-- 3. Create DELETED_USERS table
CREATE TABLE deleted_users (
    email TEXT PRIMARY KEY,
    username TEXT NOT NULL,
    grade TEXT NOT NULL,
    dept TEXT NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 4. Enable Row-Level Security (RLS) to secure tables
-- This fixes the 'rls_disabled_in_public' and 'sensitive_columns_exposed' issues.
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE deleted_users ENABLE ROW LEVEL SECURITY;
```

---

## Step 3: Get your API Credentials (Secure Approach)

1. In the left sidebar, click the **Settings** gear icon.
2. Click on **API** in the settings menu.
3. Locate your credentials:
   * **Project URL**: Under *Project API keys* (e.g., `https://xyz.supabase.co`).
   * **API Key**: Copy the secret key labeled **`service_role`** (which safely bypasses RLS on the server). 
     * **CRITICAL SECURITY NOTE**: Do **NOT** use the `anon` `public` key in the Flask backend. Using the `anon` key exposes your database (including hashed passwords) to anyone querying your project API without RLS policies. The `service_role` key must be kept secret and only used on your secure server backend.

---

## Step 4: Configure `config.json`

Open [config.json](file:///C:/Users/alasa/OneDrive/ドキュメント/IMP/project/website1.html/config.json) and enter your Supabase URL and your **`service_role`** API Key:

```json
{
  "SMTP_USER": "YOUR_GMAIL_ADDRESS@gmail.com",
  "SMTP_PASSWORD": "YOUR_16_CHARACTER_GMAIL_APP_PASSWORD",
  "SMTP_SERVER": "smtp.gmail.com",
  "SMTP_PORT": "587",
  "SUPABASE_URL": "https://your-project-id.supabase.co",
  "SUPABASE_KEY": "your-secret-service_role-api-key"
}
```
If these two keys are present, Flask will automatically use Supabase; otherwise, it will fall back to local SQLite.
