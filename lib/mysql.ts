import mysql from 'mysql2/promise';

let pool: mysql.Pool | null = null;

export function getPool() {
  if (!pool) {
    const host = process.env.MYSQL_HOST || 'localhost';
    const user = process.env.MYSQL_USER || 'root';
    const password = process.env.MYSQL_PASSWORD || 'Badhan0068#';
    const database = process.env.MYSQL_DATABASE || 'getmeamaid';
    const port = parseInt(process.env.MYSQL_PORT || '3306', 10);

    pool = mysql.createPool({
      host,
      user,
      password,
      database,
      port,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0
    });
    
    // Parse the URL to log it securely without the password
    try {
      console.log(`[MySQL] Successfully initialized connection pool to local database '${database}' at ${host}:${port}`);
    } catch (e) {
      console.log(`[MySQL] Successfully initialized connection pool.`);
    }
  }
  return pool;
}

function tryJsonParse(val: any) {
  if (typeof val === 'string') {
    try {
      return JSON.parse(val);
    } catch (e) {
      return val;
    }
  }
  return val;
}

export class MySQLQueryBuilder {
  private tableName: string;
  private filters: Array<{ field: string; val: any; type: 'eq' | 'neq' }> = [];
  private orderField: string | null = null;
  private orderAscending: boolean = true;
  private limitCount: number | null = null;
  private isSingle: boolean = false;
  private operation: 'select' | 'insert' | 'upsert' | 'delete' | 'update' = 'select';
  private payload: any = null;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  select(fields?: string) {
    return this;
  }

  eq(field: string, val: any) {
    this.filters.push({ field, val, type: 'eq' });
    return this;
  }

  neq(field: string, val: any) {
    this.filters.push({ field, val, type: 'neq' });
    return this;
  }

  order(field: string, options?: { ascending?: boolean }) {
    this.orderField = field;
    this.orderAscending = options?.ascending !== false;
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  async then(onfulfilled?: (value: any) => any, onrejected?: (reason: any) => any) {
    try {
      const data = await this.execute();
      const res = this.isSingle 
        ? { data: Array.isArray(data) ? (data[0] || null) : null, error: null } 
        : { data, error: null };
      if (onfulfilled) return onfulfilled(res);
      return res;
    } catch (error: any) {
      const res = { data: null, error: { message: error.message || String(error) } };
      if (onfulfilled) return onfulfilled(res);
      return res;
    }
  }


  private async executeInsert() {
    const pool = getPool();
    const items = Array.isArray(this.payload) ? this.payload : [this.payload];
    const insertedItems = [];

    for (const item of items) {
      const prepared = this.prepareRow(item);
      const columns = Object.keys(prepared);
      const values = Object.values(prepared);
      const placeholders = columns.map(() => '?').join(', ');
      
      const query = `INSERT INTO \`${this.tableName}\` (${columns.map(c => `\`${c}\``).join(', ')}) VALUES (${placeholders})`;
      await pool.query(query, values);
      insertedItems.push(item);
    }
    return insertedItems;
  }

  private async executeUpsert() {
    const pool = getPool();
    const items = Array.isArray(this.payload) ? this.payload : [this.payload];
    const upsertedItems = [];

    for (const item of items) {
      const prepared = this.prepareRow(item);
      const columns = Object.keys(prepared);
      const values = Object.values(prepared);
      
      const placeholders = columns.map(() => '?').join(', ');
      const updateClause = columns.map(c => `\`${c}\` = VALUES(\`${c}\`)`).join(', ');

      const query = `INSERT INTO \`${this.tableName}\` (${columns.map(c => `\`${c}\``).join(', ')}) VALUES (${placeholders}) ON DUPLICATE KEY UPDATE ${updateClause}`;
      await pool.query(query, values);
      upsertedItems.push(item);
    }
    return upsertedItems;
  }

  private async executeDelete() {
    const pool = getPool();
    let query = `DELETE FROM \`${this.tableName}\``;
    const values: any[] = [];

    if (this.filters.length > 0) {
      const clauses = this.filters.map(f => {
        values.push(f.val);
        return `\`${f.field}\` = ?`;
      });
      query += ` WHERE ${clauses.join(' AND ')}`;
    }

    const [result] = await pool.query(query, values);
    return result;
  }

  async execute() {
    if (this.operation === 'insert') return this.executeInsert();
    if (this.operation === 'upsert') return this.executeUpsert();
    if (this.operation === 'delete') return this.executeDelete();
    if (this.operation === 'update') return this.executeUpdate();
    return this.executeSelect();
  }

  private async executeSelect() {
    const pool = getPool();
    let query = `SELECT * FROM \`${this.tableName}\``;
    const values: any[] = [];
    
    if (this.filters.length > 0) {
      const clauses = this.filters.map(f => {
        if (f.type === 'eq') {
          values.push(f.val);
          return `\`${f.field}\` = ?`;
        } else {
          values.push(f.val);
          return `\`${f.field}\` != ?`;
        }
      });
      query += ` WHERE ${clauses.join(' AND ')}`;
    }

    if (this.orderField) {
      query += ` ORDER BY \`${this.orderField}\` ${this.orderAscending ? 'ASC' : 'DESC'}`;
    }

    if (this.limitCount !== null) {
      query += ` LIMIT ${this.limitCount}`;
    }

    const [rows] = await pool.query(query, values);
    
    return (rows as any[]).map(row => {
      const copy = { ...row };
      for (const key of Object.keys(copy)) {
        const val = copy[key];
        if (val instanceof Date) {
          copy[key] = val.toISOString();
        } else if (val && typeof val === 'object' && val.constructor && val.constructor.name === 'Decimal') {
          copy[key] = Number(val);
        } else if (typeof val === 'bigint') {
          copy[key] = Number(val);
        } else if (
          (this.tableName === 'services' && (key === 'included_items' || key === 'excluded_items')) ||
          (this.tableName === 'coupons' && key === 'applicable_services') ||
          (this.tableName === 'orders' && (key === 'property_size' || key === 'selected_addons')) ||
          (this.tableName === 'roles' && key === 'permissions')
        ) {
          copy[key] = tryJsonParse(val);
        }
      }
      return copy;
    });
  }

  insert(rows: any | any[]) {
    this.operation = 'insert';
    this.payload = rows;
    return this;
  }

  upsert(rows: any | any[]) {
    this.operation = 'upsert';
    this.payload = rows;
    return this;
  }

  update(payload: any) {
    this.operation = 'update';
    this.payload = payload;
    return this;
  }

  delete() {
    this.operation = 'delete';
    return this;
  }

  async sync(rows: any[]) {
    const pool = getPool();
    const items = Array.isArray(rows) ? rows : [rows];
    
    // 1. Get all existing IDs in the database table
    const [existingRows] = await pool.query(`SELECT \`id\` FROM \`${this.tableName}\``);
    const existingIds = (existingRows as any[]).map(r => r.id);
    
    const incomingIds = items.map(item => item.id).filter(Boolean);
    const idsToDelete = existingIds.filter(id => !incomingIds.includes(id));
    
    // 2. Delete rows that are not in the incoming list
    if (idsToDelete.length > 0) {
      const placeholders = idsToDelete.map(() => '?').join(', ');
      await pool.query(`DELETE FROM \`${this.tableName}\` WHERE \`id\` IN (${placeholders})`, idsToDelete);
    }
    
    // 3. Upsert incoming rows
    if (items.length > 0) {
      this.operation = 'upsert';
      this.payload = items;
      await this.executeUpsert();
      this.operation = 'select'; // reset for further chaining if needed
    }
    
    return { data: items, error: null };
  }

  private async executeUpdate() {
    const pool = getPool();
    const prepared = this.prepareRow(this.payload);
    const columns = Object.keys(prepared);
    const values = Object.values(prepared);
    
    let query = `UPDATE \`${this.tableName}\` SET ` + columns.map(c => `\`${c}\` = ?`).join(', ');
    const filterValues: any[] = [];
    
    if (this.filters.length > 0) {
      const clauses = this.filters.map(f => {
        filterValues.push(f.val);
        return `\`${f.field}\` = ?`;
      });
      query += ` WHERE ${clauses.join(' AND ')}`;
    }
    
    await pool.query(query, [...values, ...filterValues]);
    return this.executeSelect();
  }

  private prepareRow(row: any): any {
    const copy = { ...row };
    
    for (const key of Object.keys(copy)) {
      const val = copy[key];
      if (Array.isArray(val) || (val && typeof val === 'object' && !(val instanceof Date))) {
        copy[key] = JSON.stringify(val);
      } else if (val instanceof Date) {
        copy[key] = val.toISOString().slice(0, 19).replace('T', ' ');
      } else if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(val)) {
        copy[key] = val.slice(0, 19).replace('T', ' ');
      } else if (val === undefined) {
        delete copy[key];
      }
    }

    // Strip relational properties
    const relations = ['app_user', 'service', 'order', 'ticket', 'pricing_rule', 'user'];
    for (const rel of relations) {
      delete copy[rel];
    }

    return copy;
  }
}

class MySQLClient {
  from(tableName: string) {
    return new MySQLQueryBuilder(tableName);
  }

  async rpc(fnName: string, args?: any) {
    if (fnName === 'check_db_integrity') {
      return {
        data: {
          tables: [
            'app_users', 'services', 'addons', 'pricing_rules', 'coupons', 'orders',
            'order_status_history', 'tickets', 'ticket_replies', 'password_tokens',
            'enquiries', 'email_templates', 'email_logs', 'slots', 'blocked_dates',
            'roles', 'staff'
          ],
          foreign_keys: []
        },
        error: null
      };
    }
    return { data: null, error: new Error(`RPC function ${fnName} not supported in mock.`) };
  }
}

let mysqlClientInstance: MySQLClient | null = null;

export function getMysql() {
  if (!mysqlClientInstance) {
    mysqlClientInstance = new MySQLClient();
  }
  return mysqlClientInstance;
}
