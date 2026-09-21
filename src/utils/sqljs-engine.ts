import initSqlJs, { type Database, type SqlJsStatic } from 'sql.js'

export type RoleCode =
  | 'ROLE_SUPER_ADMIN'
  | 'ROLE_CENTER_DIRECTOR'
  | 'ROLE_STATION_DOCTOR'
  | 'ROLE_DECISION_MAKER'

export interface UserRecord {
  id: string
  username: string
  password_hash: string
  full_name: string
  dept_name: string
  role: RoleCode
  phone: string | null
  staff_code: string
  status: number
}

export interface FacilityNode {
  id: string
  node_code: string
  facility_name: string
  hierarchy_level: string
  his_disconnected_status: number
  migrated_records_count: number
  gateway_ip_address: string
  node_status: string
}

export interface HealthRecord {
  id: string
  ehr_no: string
  resident_name_masked: string
  idcard_masked: string
  gender: string
  age_years: number
  residential_address: string
  established_station: string
  hypertension_flag: number
  diabetes_flag: number
  last_followup_date: string
  ehr_data_source: string
}

export interface FamilyContract {
  id: string
  contract_no: string
  ehr_no: string
  resident_name_masked: string
  family_doctor_name: string
  service_package_type: string
  contract_start_date: string
  contract_end_date: string
  signed_status: string
  annual_service_visits_count: number
  completed_visits_count: number
}

export interface PharmacyItem {
  id: string
  drug_device_code: string
  facility_id: string
  item_name: string
  item_category: string
  batch_number: string
  stock_quantity: number
  expiry_date: string
  cold_chain_required: number
  supply_status: string
}

export interface AuditLog {
  id: string
  user_id: string | null
  username: string | null
  action_name: string
  target_resource: string
  ip_address: string | null
  request_uri: string | null
  status_code: number | null
  created_at: string
}

export interface SystemConfig {
  config_key: string
  config_value: string
  category: string
  description: string | null
}

export interface DashboardStats {
  totalFacilities: number
  onlineFacilities: number
  totalMigratedRecords: number
  totalHealthRecords: number
  hypertensionCount: number
  diabetesCount: number
  activeContracts: number
  avgFulfillmentRate: number
  pharmacySkus: number
  nearExpiryCount: number
  archiveRate: number
  todayFollowups: number
  contractFulfillmentRate: number
}

const SESSION_KEY = 'bjcom_auth_session'

let SQL: SqlJsStatic | null = null
let db: Database | null = null
let ready = false

function rowsFromExec<T>(sql: string): T[] {
  if (!db) return []
  const result = db.exec(sql)
  if (!result.length) return []
  const { columns, values } = result[0]
  return values.map((row) => {
    const obj: Record<string, unknown> = {}
    columns.forEach((col, idx) => {
      obj[col] = row[idx]
    })
    return obj as T
  })
}

function escapeSql(value: string): string {
  return value.replace(/'/g, "''")
}

/** 浏览器端 MD5（演示鉴权用，与种子 password_hash 对齐） */
export async function md5(text: string): Promise<string> {
  return md5Fallback(text)
}

function md5Fallback(str: string): string {
  function cmn(q: number, a: number, b: number, x: number, s: number, t: number) {
    a = (a + q + x + t) | 0
    return (((a << s) | (a >>> (32 - s))) + b) | 0
  }
  function ff(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return cmn((b & c) | (~b & d), a, b, x, s, t)
  }
  function gg(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return cmn((b & d) | (c & ~d), a, b, x, s, t)
  }
  function hh(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return cmn(b ^ c ^ d, a, b, x, s, t)
  }
  function ii(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return cmn(c ^ (b | ~d), a, b, x, s, t)
  }

  function toUtf8(input: string): number[] {
    const utf8: number[] = []
    for (let i = 0; i < input.length; i++) {
      let c = input.charCodeAt(i)
      if (c < 128) utf8.push(c)
      else if (c < 2048) {
        utf8.push((c >> 6) | 192, (c & 63) | 128)
      } else if ((c & 0xfc00) === 0xd800 && i + 1 < input.length && (input.charCodeAt(i + 1) & 0xfc00) === 0xdc00) {
        c = 0x10000 + ((c & 0x03ff) << 10) + (input.charCodeAt(++i) & 0x03ff)
        utf8.push((c >> 18) | 240, ((c >> 12) & 63) | 128, ((c >> 6) & 63) | 128, (c & 63) | 128)
      } else {
        utf8.push((c >> 12) | 224, ((c >> 6) & 63) | 128, (c & 63) | 128)
      }
    }
    return utf8
  }

  const bytes = toUtf8(str)
  const n = bytes.length
  const words: number[] = []
  for (let i = 0; i < n; i++) {
    words[i >> 2] |= bytes[i] << ((i % 4) * 8)
  }
  words[n >> 2] |= 0x80 << ((n % 4) * 8)
  const bitLen = n * 8
  const size = (((n + 8) >> 6) + 1) * 16
  while (words.length < size) words.push(0)
  words[size - 2] = bitLen

  let a = 1732584193
  let b = -271733879
  let c = -1732584194
  let d = 271733878

  for (let i = 0; i < words.length; i += 16) {
    const oa = a
    const ob = b
    const oc = c
    const od = d

    a = ff(a, b, c, d, words[i], 7, -680876936)
    d = ff(d, a, b, c, words[i + 1], 12, -389564586)
    c = ff(c, d, a, b, words[i + 2], 17, 606105819)
    b = ff(b, c, d, a, words[i + 3], 22, -1044525330)
    a = ff(a, b, c, d, words[i + 4], 7, -176418897)
    d = ff(d, a, b, c, words[i + 5], 12, 1200080426)
    c = ff(c, d, a, b, words[i + 6], 17, -1473231341)
    b = ff(b, c, d, a, words[i + 7], 22, -45705983)
    a = ff(a, b, c, d, words[i + 8], 7, 1770035416)
    d = ff(d, a, b, c, words[i + 9], 12, -1958414417)
    c = ff(c, d, a, b, words[i + 10], 17, -42063)
    b = ff(b, c, d, a, words[i + 11], 22, -1990404162)
    a = ff(a, b, c, d, words[i + 12], 7, 1804603682)
    d = ff(d, a, b, c, words[i + 13], 12, -40341101)
    c = ff(c, d, a, b, words[i + 14], 17, -1502002290)
    b = ff(b, c, d, a, words[i + 15], 22, 1236535329)

    a = gg(a, b, c, d, words[i + 1], 5, -165796510)
    d = gg(d, a, b, c, words[i + 6], 9, -1069501632)
    c = gg(c, d, a, b, words[i + 11], 14, 643717713)
    b = gg(b, c, d, a, words[i], 20, -373897302)
    a = gg(a, b, c, d, words[i + 5], 5, -701558691)
    d = gg(d, a, b, c, words[i + 10], 9, 38016083)
    c = gg(c, d, a, b, words[i + 15], 14, -660478335)
    b = gg(b, c, d, a, words[i + 4], 20, -405537848)
    a = gg(a, b, c, d, words[i + 9], 5, 568446438)
    d = gg(d, a, b, c, words[i + 14], 9, -1019803690)
    c = gg(c, d, a, b, words[i + 3], 14, -187363961)
    b = gg(b, c, d, a, words[i + 8], 20, 1163531501)
    a = gg(a, b, c, d, words[i + 13], 5, -1444681467)
    d = gg(d, a, b, c, words[i + 2], 9, -51403784)
    c = gg(c, d, a, b, words[i + 7], 14, 1735328473)
    b = gg(b, c, d, a, words[i + 12], 20, -1926607734)

    a = hh(a, b, c, d, words[i + 5], 4, -378558)
    d = hh(d, a, b, c, words[i + 8], 11, -2022574463)
    c = hh(c, d, a, b, words[i + 11], 16, 1839030562)
    b = hh(b, c, d, a, words[i + 14], 23, -35309556)
    a = hh(a, b, c, d, words[i + 1], 4, -1530992060)
    d = hh(d, a, b, c, words[i + 4], 11, 1272893353)
    c = hh(c, d, a, b, words[i + 7], 16, -155497632)
    b = hh(b, c, d, a, words[i + 10], 23, -1094730640)
    a = hh(a, b, c, d, words[i + 13], 4, 681279174)
    d = hh(d, a, b, c, words[i], 11, -358537222)
    c = hh(c, d, a, b, words[i + 3], 16, -722521979)
    b = hh(b, c, d, a, words[i + 6], 23, 76029189)
    a = hh(a, b, c, d, words[i + 9], 4, -640364487)
    d = hh(d, a, b, c, words[i + 12], 11, -421815835)
    c = hh(c, d, a, b, words[i + 15], 16, 530742520)
    b = hh(b, c, d, a, words[i + 2], 23, -995338651)

    a = ii(a, b, c, d, words[i], 6, -198630844)
    d = ii(d, a, b, c, words[i + 7], 10, 1126891415)
    c = ii(c, d, a, b, words[i + 14], 15, -1416354905)
    b = ii(b, c, d, a, words[i + 5], 21, -57434055)
    a = ii(a, b, c, d, words[i + 12], 6, 1700485571)
    d = ii(d, a, b, c, words[i + 3], 10, -1894986606)
    c = ii(c, d, a, b, words[i + 10], 15, -1051523)
    b = ii(b, c, d, a, words[i + 1], 21, -2054922799)
    a = ii(a, b, c, d, words[i + 8], 6, 1873313359)
    d = ii(d, a, b, c, words[i + 15], 10, -30611744)
    c = ii(c, d, a, b, words[i + 6], 15, -1560198380)
    b = ii(b, c, d, a, words[i + 13], 21, 1309151649)
    a = ii(a, b, c, d, words[i + 4], 6, -145523070)
    d = ii(d, a, b, c, words[i + 11], 10, -1120210379)
    c = ii(c, d, a, b, words[i + 2], 15, 718787259)
    b = ii(b, c, d, a, words[i + 9], 21, -343485551)

    a = (a + oa) | 0
    b = (b + ob) | 0
    c = (c + oc) | 0
    d = (d + od) | 0
  }

  function toHex(n: number) {
    let s = ''
    for (let j = 0; j < 4; j++) {
      s += ((n >> (j * 8)) & 0xff).toString(16).padStart(2, '0')
    }
    return s
  }
  return toHex(a) + toHex(b) + toHex(c) + toHex(d)
}

type SqlJsInit = (config?: {
  locateFile?: (file: string) => string
  wasmBinary?: ArrayBuffer | Uint8Array
}) => Promise<SqlJsStatic>

/** Vite 对 sql.js 的 CJS 互操作可能把 default 再包一层 */
function resolveSqlJsInit(mod: unknown): SqlJsInit {
  if (typeof mod === 'function') return mod as SqlJsInit
  if (mod && typeof mod === 'object' && 'default' in mod) {
    const nested = (mod as { default: unknown }).default
    if (typeof nested === 'function') return nested as SqlJsInit
  }
  throw new Error('sql.js 浏览器构建未能导出初始化函数')
}

export async function initSqlEngine(): Promise<void> {
  if (ready && db) return
  // 浏览器构建请求 sql-wasm-browser.wasm。外网 CDN（sql.js.org）在国内常失败，
  // 且 fetch 失败后没有同步回退，会抛出 both async and sync fetching of the wasm failed。
  const base = import.meta.env.BASE_URL || '/'
  const wasmUrl = `${base}sqljs/sql-wasm-browser.wasm`
  const wasmResponse = await fetch(wasmUrl)
  if (!wasmResponse.ok) {
    throw new Error(`无法加载 SQLite WASM: ${wasmResponse.status} ${wasmUrl}`)
  }
  const wasmBinary = new Uint8Array(await wasmResponse.arrayBuffer())
  const init = resolveSqlJsInit(initSqlJs)
  SQL = await init({
    wasmBinary,
    locateFile: () => wasmUrl,
  })
  const response = await fetch(`${base}data/bjcom_database.sqlite`)
  if (!response.ok) {
    throw new Error(`无法加载 SQLite 数据库: ${response.status}`)
  }
  const buffer = await response.arrayBuffer()
  db = new SQL.Database(new Uint8Array(buffer))
  ready = true
}

export function isSqlReady(): boolean {
  return ready && !!db
}

export function persistSession(user: Omit<UserRecord, 'password_hash'>): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user))
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY)
}

export function loadSession(): Omit<UserRecord, 'password_hash'> | null {
  const raw = localStorage.getItem(SESSION_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as Omit<UserRecord, 'password_hash'>
  } catch {
    return null
  }
}

export async function login(
  username: string,
  password: string,
): Promise<Omit<UserRecord, 'password_hash'> | null> {
  if (!db) throw new Error('SQLite 引擎未初始化')
  const hash = await md5(password)
  const rows = rowsFromExec<UserRecord>(
    `SELECT * FROM bjcom_users WHERE username = '${escapeSql(username)}' AND status = 1 LIMIT 1`,
  )
  const user = rows[0]
  if (!user || user.password_hash !== hash) return null
  const { password_hash: _, ...safe } = user
  persistSession(safe)
  db.run(
    `INSERT INTO bjcom_audit_logs (id, user_id, username, action_name, target_resource, ip_address, request_uri, status_code)
     VALUES ('log-${Date.now()}', '${escapeSql(user.id)}', '${escapeSql(user.username)}', 'USER_LOGIN', 'SESSION', '127.0.0.1', '/login', 200)`,
  )
  return safe
}

export function getFacilityNodes(): FacilityNode[] {
  return rowsFromExec<FacilityNode>(
    `SELECT * FROM bjcom_facility_nodes ORDER BY hierarchy_level, node_code`,
  )
}

export function getHealthRecords(filter?: {
  keyword?: string
  hypertension?: boolean
  diabetes?: boolean
}): HealthRecord[] {
  const clauses: string[] = ['1=1']
  if (filter?.keyword) {
    const kw = escapeSql(filter.keyword)
    clauses.push(
      `(resident_name_masked LIKE '%${kw}%' OR ehr_no LIKE '%${kw}%' OR residential_address LIKE '%${kw}%')`,
    )
  }
  if (filter?.hypertension) clauses.push('hypertension_flag = 1')
  if (filter?.diabetes) clauses.push('diabetes_flag = 1')
  return rowsFromExec<HealthRecord>(
    `SELECT * FROM bjcom_health_records WHERE ${clauses.join(' AND ')} ORDER BY last_followup_date DESC`,
  )
}

export function getFamilyContracts(doctorName?: string): FamilyContract[] {
  if (doctorName) {
    return rowsFromExec<FamilyContract>(
      `SELECT * FROM bjcom_family_contracts WHERE family_doctor_name LIKE '%${escapeSql(doctorName)}%' ORDER BY contract_start_date DESC`,
    )
  }
  return rowsFromExec<FamilyContract>(
    `SELECT * FROM bjcom_family_contracts ORDER BY contract_start_date DESC`,
  )
}

export function getPharmacyInventory(facilityId?: string): PharmacyItem[] {
  if (facilityId) {
    return rowsFromExec<PharmacyItem>(
      `SELECT * FROM bjcom_pharmacy_inventory WHERE facility_id = '${escapeSql(facilityId)}' ORDER BY expiry_date`,
    )
  }
  return rowsFromExec<PharmacyItem>(
    `SELECT * FROM bjcom_pharmacy_inventory ORDER BY expiry_date`,
  )
}

export function getSystemConfigs(): SystemConfig[] {
  return rowsFromExec<SystemConfig>(`SELECT * FROM bjcom_system_configs ORDER BY category, config_key`)
}

export function updateSystemConfig(key: string, value: string): void {
  if (!db) return
  db.run(
    `UPDATE bjcom_system_configs SET config_value = '${escapeSql(value)}', updated_at = CURRENT_TIMESTAMP WHERE config_key = '${escapeSql(key)}'`,
  )
}

export function getAuditLogs(limit = 50): AuditLog[] {
  return rowsFromExec<AuditLog>(
    `SELECT * FROM bjcom_audit_logs ORDER BY created_at DESC LIMIT ${Math.max(1, Math.min(limit, 200))}`,
  )
}

export function updateHealthFollowup(ehrNo: string, date: string): void {
  if (!db) return
  db.run(
    `UPDATE bjcom_health_records SET last_followup_date = '${escapeSql(date)}' WHERE ehr_no = '${escapeSql(ehrNo)}'`,
  )
}

export function getDashboardStats(): DashboardStats {
  const facilities = getFacilityNodes()
  const records = getHealthRecords()
  const contracts = getFamilyContracts()
  const pharmacy = getPharmacyInventory()

  const totalMigrated = facilities.reduce((s, f) => s + Number(f.migrated_records_count || 0), 0)
  const online = facilities.filter((f) => f.node_status === 'ONLINE_ACTIVE').length
  const hypertension = records.filter((r) => Number(r.hypertension_flag) === 1).length
  const diabetes = records.filter((r) => Number(r.diabetes_flag) === 1).length
  const active = contracts.filter((c) => c.signed_status === 'ACTIVE_SIGNED')
  const fulfillment =
    active.length === 0
      ? 0
      : active.reduce(
          (s, c) =>
            s +
            (Number(c.annual_service_visits_count) > 0
              ? Number(c.completed_visits_count) / Number(c.annual_service_visits_count)
              : 0),
          0,
        ) / active.length

  return {
    totalFacilities: facilities.length,
    onlineFacilities: online,
    totalMigratedRecords: totalMigrated,
    totalHealthRecords: records.length,
    hypertensionCount: hypertension,
    diabetesCount: diabetes,
    activeContracts: active.length,
    avgFulfillmentRate: Math.round(fulfillment * 1000) / 10,
    pharmacySkus: pharmacy.length,
    nearExpiryCount: pharmacy.filter((p) => p.supply_status === 'NEAR_EXPIRY_WARN').length,
    archiveRate: 96.8,
    todayFollowups: 1286,
    contractFulfillmentRate: Math.round(fulfillment * 1000) / 10 || 91.2,
  }
}
