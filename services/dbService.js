/**
 * ClauseGuard - MySQL Database Service
 * Manages the Supported Standards Registry and Document Validation Logs.
 * Reusable with MySQL2, environment configuration, and auto-initialization.
 */

import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BACKEND_DIR = path.resolve(__dirname, '..');
const FALLBACK_REGISTRY_FILE = path.join(BACKEND_DIR, 'data', 'supported_standards_registry.json');
const VALIDATION_LOGS_FILE = path.join(BACKEND_DIR, 'data', 'document_validation_logs.json');

// Default initial standards registry seed data
export const INITIAL_REGISTRY = [
  {
    standard_code: 'OSHA',
    standard_name: 'OSHA 1910 - Walking-Working Surfaces & Stairways',
    identifier: '29 CFR 1910.25',
    publisher: 'Occupational Safety and Health Administration (US Department of Labor)',
    verified_versions: ['2016', '2017', '2019', '2021', '2024'],
    default_version: '2021',
    scope_description: 'Occupational safety requirements for fixed industrial stairways, treads, risers, and railing systems.',
    is_active: 1
  },
  {
    standard_code: 'IBC',
    standard_name: 'International Building Code - Chapter 10 Means of Egress',
    identifier: 'IBC 1011.5 / ICC IBC',
    publisher: 'International Code Council (ICC)',
    verified_versions: ['2015', '2018', '2021', '2024'],
    default_version: '2021',
    scope_description: 'Commercial building codes governing stair geometry, occupant load, clear width, and headroom clearance.',
    is_active: 1
  },
  {
    standard_code: 'ISO',
    standard_name: 'Safety of machinery — Permanent means of access to machinery — Part 3',
    identifier: 'ISO 14122-3',
    publisher: 'International Organization for Standardization (ISO)',
    verified_versions: ['2001', '2016', '2022'],
    default_version: '2016',
    scope_description: 'International mechanical safety specifications for industrial stairs, step ladders, and guardrails.',
    is_active: 1
  },
  {
    standard_code: 'ASTM',
    standard_name: 'Standard Specification for Performance of Exterior Walking Surfaces',
    identifier: 'ASTM F1637 / E985',
    publisher: 'ASTM International',
    verified_versions: ['2018', '2019', '2021', '2023'],
    default_version: '2021',
    scope_description: 'Material specifications and permanent guardrail loading tests for pedestrian walkways.',
    is_active: 1
  },
  {
    standard_code: 'NFPA',
    standard_name: 'NFPA 101: Life Safety Code - Means of Egress Stairs',
    identifier: 'NFPA 101',
    publisher: 'National Fire Protection Association (NFPA)',
    verified_versions: ['2018', '2021', '2024'],
    default_version: '2021',
    scope_description: 'Fire and emergency egress criteria governing stair dimensions and landing uniformity.',
    is_active: 1
  },
  {
    standard_code: 'ADA',
    standard_name: 'ADA Standards for Accessible Design - Section 504 Stairways',
    identifier: 'ADA-2010 / DOJ',
    publisher: 'U.S. Department of Justice / Access Board',
    verified_versions: ['2010', '2016'],
    default_version: '2010',
    scope_description: 'Accessibility standards for riser heights, open riser restrictions, and nosing profiles.',
    is_active: 1
  },
  {
    standard_code: 'STD-A',
    standard_name: 'Special Enclosure Standard A (Industrial Machinery Enclosures)',
    identifier: 'STD-A-4.2',
    publisher: 'Engineering Standards Consortium',
    verified_versions: ['2020', '2022', '2024'],
    default_version: '2022',
    scope_description: 'Enclosure clearance and boundary thresholds for high-risk equipment housing.',
    is_active: 1
  },
  {
    standard_code: 'STD-B',
    standard_name: 'Special Enclosure Standard B (Heavy Industry Enclosures)',
    identifier: 'STD-B-6.1',
    publisher: 'Engineering Standards Consortium',
    verified_versions: ['2020', '2022', '2024'],
    default_version: '2022',
    scope_description: 'Equipment boundary tolerances and operational clearances across industrial compartments.',
    is_active: 1
  }
];

class DatabaseService {
  constructor() {
    this.pool = null;
    this.isMySQLConnected = false;
    this.connectionConfig = {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306', 10),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'clauseguard',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    };
  }

  /**
   * Initializes MySQL connection, creates database and tables if needed,
   * and populates default Supported Standards Registry.
   */
  async initialize() {
    // Ensure fallback data directory exists
    const dataDir = path.dirname(FALLBACK_REGISTRY_FILE);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Always maintain persistent fallback JSON sync
    if (!fs.existsSync(FALLBACK_REGISTRY_FILE)) {
      fs.writeFileSync(FALLBACK_REGISTRY_FILE, JSON.stringify(INITIAL_REGISTRY, null, 2), 'utf8');
    }

    try {
      // 1. First connect without database to ensure database exists
      const tempConnection = await mysql.createConnection({
        host: this.connectionConfig.host,
        port: this.connectionConfig.port,
        user: this.connectionConfig.user,
        password: this.connectionConfig.password,
        connectTimeout: 2000
      });

      await tempConnection.query(`CREATE DATABASE IF NOT EXISTS \`${this.connectionConfig.database}\`;`);
      await tempConnection.end();

      // 2. Connect with target database
      this.pool = mysql.createPool(this.connectionConfig);

      // 3. Create supported_standards_registry table
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS supported_standards_registry (
          id INT AUTO_INCREMENT PRIMARY KEY,
          standard_code VARCHAR(50) NOT NULL UNIQUE,
          standard_name VARCHAR(255) NOT NULL,
          identifier VARCHAR(100) NOT NULL,
          publisher VARCHAR(150) NOT NULL,
          verified_versions JSON NOT NULL,
          default_version VARCHAR(50) NOT NULL,
          scope_description TEXT,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);

      // 4. Create document_validation_logs table
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS document_validation_logs (
          id INT AUTO_INCREMENT PRIMARY KEY,
          filename VARCHAR(255) NOT NULL,
          slot VARCHAR(10) NOT NULL,
          identified_standard VARCHAR(50),
          identified_version VARCHAR(50),
          identified_publisher VARCHAR(150),
          validation_status VARCHAR(50) NOT NULL,
          confidence_score FLOAT,
          matched_registry_id INT,
          manual_override BOOLEAN DEFAULT FALSE,
          notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);

      // 5. Seed registry if empty
      const [rows] = await this.pool.query('SELECT COUNT(*) as count FROM supported_standards_registry');
      if (rows[0].count === 0) {
        for (const item of INITIAL_REGISTRY) {
          await this.pool.query(
            `INSERT INTO supported_standards_registry
             (standard_code, standard_name, identifier, publisher, verified_versions, default_version, scope_description, is_active)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              item.standard_code,
              item.standard_name,
              item.identifier,
              item.publisher,
              JSON.stringify(item.verified_versions),
              item.default_version,
              item.scope_description,
              item.is_active
            ]
          );
        }
        console.log('[ClauseGuard MySQL] Successfully seeded Supported Standards Registry in MySQL');
      }

      this.isMySQLConnected = true;
      console.log(`[ClauseGuard MySQL] Connected to MySQL database "${this.connectionConfig.database}" at ${this.connectionConfig.host}:${this.connectionConfig.port}`);
    } catch (err) {
      this.isMySQLConnected = false;
      console.log(`[ClauseGuard MySQL Notice] MySQL not connected (${err.message}). Using synchronized standards registry storage with full MySQL schema compatibility.`);
    }
  }

  /**
   * Retrieves all active standards from the Supported Standards Registry
   */
  async getStandardsRegistry() {
    if (this.isMySQLConnected && this.pool) {
      try {
        const [rows] = await this.pool.query(
          'SELECT * FROM supported_standards_registry WHERE is_active = 1 ORDER BY standard_code ASC'
        );
        return rows.map(r => ({
          ...r,
          verified_versions: typeof r.verified_versions === 'string'
            ? JSON.parse(r.verified_versions)
            : r.verified_versions
        }));
      } catch (err) {
        console.warn('[ClauseGuard MySQL] Query error, falling back to cached registry:', err.message);
      }
    }

    // Fallback persistent storage
    try {
      if (fs.existsSync(FALLBACK_REGISTRY_FILE)) {
        return JSON.parse(fs.readFileSync(FALLBACK_REGISTRY_FILE, 'utf8'));
      }
    } catch (_) {}
    return INITIAL_REGISTRY;
  }

  /**
   * Look up a standard in registry by code (OSHA, IBC, ISO, etc.)
   */
  async getStandardByCode(code) {
    if (!code) return null;
    const clean = code.trim().toUpperCase();
    const registry = await this.getStandardsRegistry();
    return registry.find(s => s.standard_code.toUpperCase() === clean) || null;
  }

  /**
   * Records document validation audit log in MySQL (or fallback)
   */
  async logValidation(entry) {
    const logItem = {
      filename: entry.filename || 'unknown.pdf',
      slot: entry.slot || 'A',
      identified_standard: entry.identified_standard || null,
      identified_version: entry.identified_version || null,
      identified_publisher: entry.identified_publisher || null,
      validation_status: entry.validation_status || 'Unable to Verify',
      confidence_score: entry.confidence_score || 0.0,
      matched_registry_id: entry.matched_registry_id || null,
      manual_override: entry.manual_override ? 1 : 0,
      notes: entry.notes || '',
      created_at: new Date().toISOString()
    };

    if (this.isMySQLConnected && this.pool) {
      try {
        await this.pool.query(
          `INSERT INTO document_validation_logs
           (filename, slot, identified_standard, identified_version, identified_publisher, validation_status, confidence_score, matched_registry_id, manual_override, notes)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            logItem.filename,
            logItem.slot,
            logItem.identified_standard,
            logItem.identified_version,
            logItem.identified_publisher,
            logItem.validation_status,
            logItem.confidence_score,
            logItem.matched_registry_id,
            logItem.manual_override,
            logItem.notes
          ]
        );
        return { success: true, storage: 'mysql' };
      } catch (err) {
        console.warn('[ClauseGuard MySQL] Log insert error:', err.message);
      }
    }

    // Fallback file logging
    try {
      let logs = [];
      if (fs.existsSync(VALIDATION_LOGS_FILE)) {
        logs = JSON.parse(fs.readFileSync(VALIDATION_LOGS_FILE, 'utf8'));
      }
      logs.unshift(logItem);
      fs.writeFileSync(VALIDATION_LOGS_FILE, JSON.stringify(logs.slice(0, 500), null, 2), 'utf8');
      return { success: true, storage: 'fallback' };
    } catch (_) {
      return { success: false };
    }
  }

  /**
   * Retrieves validation logs from MySQL or fallback storage
   */
  async getValidationLogs(limit = 50) {
    if (this.isMySQLConnected && this.pool) {
      try {
        const [rows] = await this.pool.query(
          `SELECT * FROM document_validation_logs ORDER BY id DESC LIMIT ?`,
          [limit]
        );
        return rows;
      } catch (err) {
        console.warn('[ClauseGuard MySQL] Log select error:', err.message);
      }
    }

    try {
      if (fs.existsSync(VALIDATION_LOGS_FILE)) {
        const logs = JSON.parse(fs.readFileSync(VALIDATION_LOGS_FILE, 'utf8'));
        return logs.slice(0, limit);
      }
    } catch (_) {}
    return [];
  }

  /**
   * Status reporter
   */
  getStatus() {
    return {
      connected: this.isMySQLConnected,
      host: this.connectionConfig.host,
      port: this.connectionConfig.port,
      database: this.connectionConfig.database,
      engine: this.isMySQLConnected ? 'MySQL 8.x / MariaDB' : 'Synchronized Storage Engine'
    };
  }
}

export const dbService = new DatabaseService();
