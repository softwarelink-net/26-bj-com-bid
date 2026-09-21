-- 1. 用户与社区卫生服务医务人员表 (Users)
CREATE TABLE IF NOT EXISTS bjcom_users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    dept_name TEXT NOT NULL,           -- 东城区社管中心信息科, 朝阳门社区卫生服务中心, 安定门服务站全科诊室, 卫健委医政科
    role TEXT NOT NULL CHECK(role IN ('ROLE_SUPER_ADMIN', 'ROLE_CENTER_DIRECTOR', 'ROLE_STATION_DOCTOR', 'ROLE_DECISION_MAKER')),
    phone TEXT,
    staff_code TEXT NOT NULL UNIQUE,   -- 医疗机构执业人员编码 / 工号
    status INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. 系统全局配置与 Feature Flags (System Configs)
CREATE TABLE IF NOT EXISTS bjcom_system_configs (
    config_key TEXT PRIMARY KEY,
    config_value TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. 区域一体化机构与 HIS 非临床业务剥离台账主表 (Regional Facilities & HIS De-coupling)
CREATE TABLE IF NOT EXISTS bjcom_facility_nodes (
    id TEXT PRIMARY KEY,
    node_code TEXT NOT NULL UNIQUE,    -- 节点编号 (如 FAC-BJ-CYM-01)
    facility_name TEXT NOT NULL,       -- 北京市东城区朝阳门社区卫生服务中心 / 安定门街道服务站
    hierarchy_level TEXT NOT NULL CHECK(hierarchy_level IN ('DISTRICT_HQ', 'COMMUNITY_CENTER', 'STATION_CLINIC')), -- 区社管中心/社区中心/基层服务站
    his_disconnected_status INTEGER DEFAULT 1, -- 1: 非临床管理数据已成功从底层HIS剥离
    migrated_records_count INTEGER NOT NULL, -- 已迁移历史健康档案数
    gateway_ip_address TEXT NOT NULL,
    node_status TEXT DEFAULT 'ONLINE_ACTIVE' CHECK(node_status IN ('ONLINE_ACTIVE', 'MIGRATING_SYNC', 'OFFLINE_ERR')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 4. 居民电子健康档案与基本公卫协同主表 (EHR & Public Health Synergy)
CREATE TABLE IF NOT EXISTS bjcom_health_records (
    id TEXT PRIMARY KEY,
    ehr_no TEXT NOT NULL UNIQUE,       -- 电子健康档案卡号 (如 EHR-110101-2026-088)
    resident_name_masked TEXT NOT NULL,-- 居民姓名脱敏 (如 孙*芳)
    idcard_masked TEXT NOT NULL,       -- 身份证脱敏
    gender TEXT NOT NULL CHECK(gender IN ('MALE', 'FEMALE')),
    age_years INTEGER NOT NULL,
    residential_address TEXT NOT NULL, -- 居住地址 (朝阳门内大街188号)
    established_station TEXT NOT NULL, -- 建档服务站 (朝阳门社区卫生服务中心主中心)
    hypertension_flag INTEGER DEFAULT 0, -- 1: 确诊高血压纳入公卫慢病管理
    diabetes_flag INTEGER DEFAULT 0,     -- 1: 确诊糖尿病纳入公卫慢病管理
    last_followup_date DATE NOT NULL,  -- 最近一次公卫随访日期
    ehr_data_source TEXT NOT NULL CHECK(ehr_data_source IN ('MIGRATED_FROM_HIS', 'NEW_COMMUNITY_REG', 'MOBILE_APP_SYNC')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 5. 家庭医生签约服务与重点人群履约台账表 (Family Doctor Contracts)
CREATE TABLE IF NOT EXISTS bjcom_family_contracts (
    id TEXT PRIMARY KEY,
    contract_no TEXT NOT NULL UNIQUE,  -- 签约编号 (如 CTR-BJ-202610-001)
    ehr_no TEXT NOT NULL,
    resident_name_masked TEXT NOT NULL,
    family_doctor_name TEXT NOT NULL,  -- 签约全科医生 (王主治医师)
    service_package_type TEXT NOT NULL CHECK(service_package_type IN ('STANDARD_PACK', 'ELDERLY_CARE_PACK', 'CHRONIC_DISEASE_PACK', 'VIP_FAMILY_PACK')), -- 标准包/老年人包/慢病包/VIP家庭包
    contract_start_date DATE NOT NULL,
    contract_end_date DATE NOT NULL,
    signed_status TEXT DEFAULT 'ACTIVE_SIGNED' CHECK(signed_status IN ('PENDING_REVIEW', 'ACTIVE_SIGNED', 'EXPIRED_RENEW', 'TERMINATED')),
    annual_service_visits_count INTEGER DEFAULT 4, -- 年度约定随访次数
    completed_visits_count INTEGER DEFAULT 2,      -- 已实际履约次数
    FOREIGN KEY(ehr_no) REFERENCES bjcom_health_records(ehr_no)
);

-- 6. 社区药械全链条闭环监管与效期预警表 (Pharmacy & Supply Chain)
CREATE TABLE IF NOT EXISTS bjcom_pharmacy_inventory (
    id TEXT PRIMARY KEY,
    drug_device_code TEXT NOT NULL UNIQUE, -- 药械编码 (如 DRG-BS-01088)
    facility_id TEXT NOT NULL,
    item_name TEXT NOT NULL,           -- 苯磺酸氨氯地平片(施慧达) / 盐酸二甲双胍缓释片 / 一次性真空采血管
    item_category TEXT NOT NULL CHECK(item_category IN ('WESTERN_MEDICINE', 'CHINESE_PATENT_MEDICINE', 'MEDICAL_CONSUMABLE')), -- 西药/中成药/医疗耗材
    batch_number TEXT NOT NULL,        -- 生产批号 (批号: 260812)
    stock_quantity INTEGER NOT NULL,   -- 库存余量
    expiry_date DATE NOT NULL,         -- 有效期至
    cold_chain_required INTEGER DEFAULT 0, -- 1: 冷链温控药品
    supply_status TEXT DEFAULT 'IN_STOCK_SAFE' CHECK(supply_status IN ('IN_STOCK_SAFE', 'NEAR_EXPIRY_WARN', 'STOCKOUT_ALERT')),
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(facility_id) REFERENCES bjcom_facility_nodes(id)
);

-- 7. 社区卫生系统操作与涉密医疗审计日志表 (Security Audit Trail)
CREATE TABLE IF NOT EXISTS bjcom_audit_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    username TEXT,
    action_name TEXT NOT NULL,         -- HIS_DATA_MIGRATE / EHR_EXPORT / CONTRACT_SIGN / MASK_OVERRIDE
    target_resource TEXT NOT NULL,
    ip_address TEXT,
    request_uri TEXT,
    status_code INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 种子数据初始化 (Seed Data)
-- ==============================================================================

-- 注入演示用户 (密码哈希对应 README 演示账号)
INSERT OR REPLACE INTO bjcom_users (id, username, password_hash, full_name, dept_name, role, phone, staff_code) VALUES
('u-01', 'admin', 'ce5dec5f7d5cda41bd625bd6a23bb9aa', '系统管理员', '东城区社管中心信息科', 'ROLE_SUPER_ADMIN', '010-65127717', 'BJ-COM-TECH01'),
('u-02', 'director', 'f038c74d382fe8da1f410e4db5250a52', '王主任', '朝阳门社区卫生服务中心', 'ROLE_CENTER_DIRECTOR', '010-65127718', 'BJ-COM-DIR08'),
('u-03', 'doctor', '441b8dc2fa9a73fab4c4492545006095', '李全科医师', '安定门街道服务站全科诊室', 'ROLE_STATION_DOCTOR', '15510317005', 'BJ-COM-DOC016'),
('u-04', 'leader', '5fa3c1e40a221e46fbabb44790283fc9', '区卫健委分管主任', '东城区卫生健康委员会', 'ROLE_DECISION_MAKER', '010-64010000', 'BJ-COM-LEAD01');

-- 注入 Feature Flags 与系统全局配置
INSERT OR REPLACE INTO bjcom_system_configs (config_key, config_value, category, description) VALUES
('FEATURE_AUTO_HIS_DECOUPLING_SYNC', 'true', 'MIGRATE_ENGINE', '系统是否自动执行非临床业务与既有HIS底层数据库的定时双向增量数据同步'),
('FEATURE_SM4_PATIENT_MASKING', 'true', 'SECURITY', '对东城辖区居民电子健康档案中的身份证号、慢病病历及家医签约手机号启用国密 SM4 动态列级脱敏'),
('FAMILY_DOCTOR_CONTRACT_YEARS', '1', 'POLICY', '家庭医生签约服务协议默认有效服务周期 (年)');

-- 注入机构节点台账
INSERT OR REPLACE INTO bjcom_facility_nodes (id, node_code, facility_name, hierarchy_level, his_disconnected_status, migrated_records_count, gateway_ip_address, node_status) VALUES
('fac-01', 'FAC-BJ-CYM-01', '北京市东城区朝阳门社区卫生服务中心', 'COMMUNITY_CENTER', 1, 45200, '10.110.1.50', 'ONLINE_ACTIVE'),
('fac-02', 'FAC-BJ-ADM-02', '东城区安定门街道社区卫生服务站', 'STATION_CLINIC', 1, 12800, '10.110.2.15', 'ONLINE_ACTIVE'),
('fac-03', 'FAC-BJ-JGL-03', '东城区建国门社区卫生服务中心', 'COMMUNITY_CENTER', 1, 38900, '10.110.3.22', 'ONLINE_ACTIVE');

-- 注入居民健康档案
INSERT OR REPLACE INTO bjcom_health_records (id, ehr_no, resident_name_masked, idcard_masked, gender, age_years, residential_address, established_station, hypertension_flag, diabetes_flag, last_followup_date, ehr_data_source) VALUES
('ehr-01', 'EHR-110101-2026-088', '孙*芳', '110101195805******', 'FEMALE', 68, '朝阳门内大街188号', '朝阳门社区卫生服务中心主中心', 1, 1, '2026-09-10', 'MIGRATED_FROM_HIS'),
('ehr-02', 'EHR-110101-2026-089', '赵*强', '110101197211******', 'MALE', 54, '安定门外大街45号', '安定门街道服务站', 1, 0, '2026-09-12', 'NEW_COMMUNITY_REG'),
('ehr-03', 'EHR-110101-2026-090', '刘*秀', '110101196502******', 'FEMALE', 61, '东直门南大街12号', '建国门社区卫生服务中心', 0, 1, '2026-09-14', 'MIGRATED_FROM_HIS');

-- 注入家医签约台账 (ehr_no 外键对齐档案卡号)
INSERT OR REPLACE INTO bjcom_family_contracts (id, contract_no, ehr_no, resident_name_masked, family_doctor_name, service_package_type, contract_start_date, contract_end_date, signed_status, annual_service_visits_count, completed_visits_count) VALUES
('ctr-01', 'CTR-BJ-202610-001', 'EHR-110101-2026-088', '孙*芳', '李全科医师', 'ELDERLY_CARE_PACK', '2026-01-01', '2026-12-31', 'ACTIVE_SIGNED', 6, 4),
('ctr-02', 'CTR-BJ-202610-002', 'EHR-110101-2026-089', '赵*强', '王主治医师', 'CHRONIC_DISEASE_PACK', '2026-03-01', '2027-02-28', 'ACTIVE_SIGNED', 4, 2);

-- 注入药械库存数据
INSERT OR REPLACE INTO bjcom_pharmacy_inventory (id, drug_device_code, facility_id, item_name, item_category, batch_number, stock_quantity, expiry_date, cold_chain_required, supply_status) VALUES
('ph-01', 'DRG-BS-01088', 'fac-01', '苯磺酸氨氯地平片(施慧达)', 'WESTERN_MEDICINE', '260812', 1450, '2027-12-31', 0, 'IN_STOCK_SAFE'),
('ph-02', 'DRG-BS-02045', 'fac-01', '盐酸二甲双胍缓释片(格华止)', 'WESTERN_MEDICINE', '260718', 880, '2027-08-30', 0, 'IN_STOCK_SAFE'),
('ph-03', 'CNS-NC-03102', 'fac-02', '一次性使用无菌真空采血管(肝素锂)', 'MEDICAL_CONSUMABLE', '260901', 3200, '2028-09-01', 0, 'IN_STOCK_SAFE');

-- 注入审计日志
INSERT OR REPLACE INTO bjcom_audit_logs (id, user_id, username, action_name, target_resource, ip_address, request_uri, status_code) VALUES
('log-01', 'u-02', 'director', 'HIS_DATA_MIGRATE', 'FAC-BJ-CYM-01', '10.110.1.15', '/api/migrate/sync-his-data', 200),
('log-02', 'u-03', 'doctor', 'CONTRACT_SIGN', 'CTR-BJ-202610-001', '10.110.2.88', '/api/family-doctor/sign-contract', 200);
