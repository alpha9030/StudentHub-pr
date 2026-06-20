-- ======================================================================
-- Student Hub - Oracle APEX & ORDS REST Services Setup Script
-- ======================================================================
-- Instructions:
-- 1. Log in to your Oracle APEX Workspace.
-- 2. Navigate to SQL Workshop -> SQL Commands.
-- 3. Copy the entire contents of this file and paste it into the command editor.
-- 4. Click the "Run" button to execute and set up everything automatically.
-- ======================================================================

-- 1. Drop existing tables if they exist (clean setup)
BEGIN
    EXECUTE IMMEDIATE 'DROP TABLE progress CASCADE CONSTRAINTS';
EXCEPTION WHEN OTHERS THEN NULL; END;
/

BEGIN
    EXECUTE IMMEDIATE 'DROP TABLE chatbot_settings CASCADE CONSTRAINTS';
EXCEPTION WHEN OTHERS THEN NULL; END;
/

BEGIN
    EXECUTE IMMEDIATE 'DROP TABLE deleted_users CASCADE CONSTRAINTS';
EXCEPTION WHEN OTHERS THEN NULL; END;
/

BEGIN
    EXECUTE IMMEDIATE 'DROP TABLE users CASCADE CONSTRAINTS';
EXCEPTION WHEN OTHERS THEN NULL; END;
/

-- 2. Create the Database Tables
CREATE TABLE users (
    email VARCHAR2(255) PRIMARY KEY,
    username VARCHAR2(255) NOT NULL,
    password VARCHAR2(255) NOT NULL,
    grade VARCHAR2(50) NOT NULL,
    dept VARCHAR2(100) NOT NULL
);
/

CREATE TABLE progress (
    email VARCHAR2(255) NOT NULL,
    checkpoint_id VARCHAR2(100) NOT NULL,
    CONSTRAINT pk_progress PRIMARY KEY (email, checkpoint_id),
    CONSTRAINT fk_progress_users FOREIGN KEY (email) REFERENCES users (email) ON DELETE CASCADE
);
/

CREATE TABLE chatbot_settings (
    email VARCHAR2(255) PRIMARY KEY,
    aura_mode VARCHAR2(50) NOT NULL,
    aura_api_key VARCHAR2(255),
    aura_user_name VARCHAR2(255),
    CONSTRAINT fk_chatbot_users FOREIGN KEY (email) REFERENCES users (email) ON DELETE CASCADE
);
/

CREATE TABLE deleted_users (
    email VARCHAR2(255) PRIMARY KEY,
    username VARCHAR2(255) NOT NULL,
    grade VARCHAR2(50) NOT NULL,
    dept VARCHAR2(100) NOT NULL,
    deleted_at TIMESTAMP DEFAULT SYSTIMESTAMP
);
/

-- 3. Register the Schema and Define ORDS REST Modules, Templates, and Handlers
BEGIN
    -- Enable ORDS for the Schema
    ORDS.enable_schema(
        p_enabled             => TRUE,
        p_schema              => USER,
        p_url_mapping_type    => 'BASE_PATH',
        p_url_mapping_pattern => 'studenthub',
        p_auto_rest_auth      => FALSE
    );

    -- Remove existing module if it exists to prevent conflict
    BEGIN
        ORDS.remove_module(p_module_name => 'studenthub');
    EXCEPTION WHEN OTHERS THEN NULL; END;

    -- Define the Module
    ORDS.define_module(
        p_module_name    => 'studenthub',
        p_base_path      => '/studenthub/',
        p_items_per_page => 0,
        p_status         => 'PUBLISHED',
        p_comments       => 'Student Hub REST APIs'
    );

    -- ------------------------------------------------------------------
    -- Template: users/
    -- ------------------------------------------------------------------
    ORDS.define_template(
        p_module_name    => 'studenthub',
        p_pattern        => 'users/'
    );

    ORDS.define_handler(
        p_module_name    => 'studenthub',
        p_pattern        => 'users/',
        p_method         => 'POST',
        p_source_type    => 'plsql/block',
        p_source         => 'BEGIN
            INSERT INTO users (email, username, password, grade, dept)
            VALUES (:email, :username, :password, :grade, :dept);
            
            INSERT INTO chatbot_settings (email, aura_mode, aura_api_key, aura_user_name)
            VALUES (:email, ''offline'', '''', :username);
            
            :status_code := 201;
        EXCEPTION
            WHEN DUP_VAL_ON_INDEX THEN
                :status_code := 400;
            WHEN OTHERS THEN
                :status_code := 500;
        END;',
        p_items_per_page => 0
    );

    ORDS.define_handler(
        p_module_name    => 'studenthub',
        p_pattern        => 'users/',
        p_method         => 'GET',
        p_source_type    => 'json/query',
        p_source         => 'SELECT email, username, grade, dept FROM users',
        p_items_per_page => 0
    );

    -- ------------------------------------------------------------------
    -- Template: users/:email
    -- ------------------------------------------------------------------
    ORDS.define_template(
        p_module_name    => 'studenthub',
        p_pattern        => 'users/:email'
    );

    ORDS.define_handler(
        p_module_name    => 'studenthub',
        p_pattern        => 'users/:email',
        p_method         => 'GET',
        p_source_type    => 'json/query',
        p_source         => 'SELECT email, username, password, grade, dept FROM users WHERE LOWER(email) = LOWER(:email)',
        p_items_per_page => 0
    );

    ORDS.define_handler(
        p_module_name    => 'studenthub',
        p_pattern        => 'users/:email',
        p_method         => 'DELETE',
        p_source_type    => 'plsql/block',
        p_source         => 'BEGIN
            DELETE FROM users WHERE LOWER(email) = LOWER(:email);
            :status_code := 200;
        END;',
        p_items_per_page => 0
    );

    -- ------------------------------------------------------------------
    -- Template: progress/
    -- ------------------------------------------------------------------
    ORDS.define_template(
        p_module_name    => 'studenthub',
        p_pattern        => 'progress/'
    );

    ORDS.define_handler(
        p_module_name    => 'studenthub',
        p_pattern        => 'progress/',
        p_method         => 'GET',
        p_source_type    => 'json/query',
        p_source         => 'SELECT checkpoint_id FROM progress WHERE LOWER(email) = LOWER(:email)',
        p_items_per_page => 0
    );

    ORDS.define_handler(
        p_module_name    => 'studenthub',
        p_pattern        => 'progress/',
        p_method         => 'POST',
        p_source_type    => 'plsql/block',
        p_source         => 'BEGIN
            IF :checked = ''true'' THEN
                INSERT INTO progress (email, checkpoint_id)
                VALUES (:email, :checkpoint_id);
            ELSE
                DELETE FROM progress WHERE LOWER(email) = LOWER(:email) AND checkpoint_id = :checkpoint_id;
            END IF;
            :status_code := 200;
        EXCEPTION
            WHEN DUP_VAL_ON_INDEX THEN
                :status_code := 200;
            WHEN OTHERS THEN
                :status_code := 500;
        END;',
        p_items_per_page => 0
    );

    -- ------------------------------------------------------------------
    -- Template: chatbot-settings/
    -- ------------------------------------------------------------------
    ORDS.define_template(
        p_module_name    => 'studenthub',
        p_pattern        => 'chatbot-settings/'
    );

    ORDS.define_handler(
        p_module_name    => 'studenthub',
        p_pattern        => 'chatbot-settings/',
        p_method         => 'GET',
        p_source_type    => 'json/query',
        p_source         => 'SELECT aura_mode, aura_api_key, aura_user_name FROM chatbot_settings WHERE LOWER(email) = LOWER(:email)',
        p_items_per_page => 0
    );

    ORDS.define_handler(
        p_module_name    => 'studenthub',
        p_pattern        => 'chatbot-settings/',
        p_method         => 'POST',
        p_source_type    => 'plsql/block',
        p_source         => 'BEGIN
            MERGE INTO chatbot_settings c
            USING (SELECT :email AS email, :aura_mode AS aura_mode, :aura_api_key AS aura_api_key, :aura_user_name AS aura_user_name FROM dual) src
            ON (c.email = src.email)
            WHEN MATCHED THEN
                UPDATE SET c.aura_mode = src.aura_mode, c.aura_api_key = src.aura_api_key, c.aura_user_name = src.aura_user_name
            WHEN NOT MATCHED THEN
                INSERT (email, aura_mode, aura_api_key, aura_user_name)
                VALUES (src.email, src.aura_mode, src.aura_api_key, src.aura_user_name);
            :status_code := 200;
        END;',
        p_items_per_page => 0
    );

    -- ------------------------------------------------------------------
    -- Template: deleted-users/
    -- ------------------------------------------------------------------
    ORDS.define_template(
        p_module_name    => 'studenthub',
        p_pattern        => 'deleted-users/'
    );

    ORDS.define_handler(
        p_module_name    => 'studenthub',
        p_pattern        => 'deleted-users/',
        p_method         => 'POST',
        p_source_type    => 'plsql/block',
        p_source         => 'BEGIN
            INSERT INTO deleted_users (email, username, grade, dept)
            VALUES (:email, :username, :grade, :dept);
            :status_code := 201;
        EXCEPTION
            WHEN DUP_VAL_ON_INDEX THEN
                :status_code := 200;
            WHEN OTHERS THEN
                :status_code := 500;
        END;',
        p_items_per_page => 0
    );

    ORDS.define_handler(
        p_module_name    => 'studenthub',
        p_pattern        => 'deleted-users/',
        p_method         => 'GET',
        p_source_type    => 'json/query',
        p_source         => 'SELECT email, username, grade, dept FROM deleted_users',
        p_items_per_page => 0
    );

    COMMIT;
END;
/
