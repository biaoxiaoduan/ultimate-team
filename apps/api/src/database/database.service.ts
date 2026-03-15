import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private readonly db: DatabaseSync;

  constructor(dbPath = resolveDatabasePath()) {
    if (dbPath !== ':memory:') {
      mkdirSync(dirname(dbPath), { recursive: true });
    }

    this.db = new DatabaseSync(dbPath);
    this.migrate();
    this.seedDefaults();
  }

  get connection() {
    return this.db;
  }

  onModuleDestroy() {
    this.db.close();
  }

  private migrate() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS workspaces (
        pk INTEGER PRIMARY KEY AUTOINCREMENT,
        id TEXT UNIQUE,
        name TEXT NOT NULL,
        root_path TEXT NOT NULL,
        description TEXT NOT NULL,
        is_default INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS providers (
        pk INTEGER PRIMARY KEY AUTOINCREMENT,
        id TEXT UNIQUE,
        name TEXT NOT NULL,
        provider_type TEXT NOT NULL,
        endpoint TEXT NOT NULL,
        model TEXT NOT NULL,
        api_key_masked TEXT NOT NULL,
        is_enabled INTEGER NOT NULL DEFAULT 1,
        workspace_id TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS requirements (
        pk INTEGER PRIMARY KEY AUTOINCREMENT,
        id TEXT UNIQUE,
        project_id TEXT NOT NULL,
        title TEXT NOT NULL,
        summary TEXT NOT NULL,
        goal TEXT NOT NULL,
        constraints TEXT NOT NULL,
        acceptance_criteria TEXT NOT NULL,
        current_version_id TEXT NOT NULL,
        current_version_number INTEGER NOT NULL,
        current_content TEXT NOT NULL,
        status TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS requirement_versions (
        pk INTEGER PRIMARY KEY AUTOINCREMENT,
        id TEXT UNIQUE,
        requirement_id TEXT NOT NULL,
        version INTEGER NOT NULL,
        content TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS iteration_plans (
        pk INTEGER PRIMARY KEY AUTOINCREMENT,
        id TEXT UNIQUE,
        requirement_id TEXT NOT NULL,
        source_version_id TEXT NOT NULL,
        status TEXT NOT NULL,
        title TEXT NOT NULL,
        summary TEXT NOT NULL,
        iterations_json TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS agent_instances (
        pk INTEGER PRIMARY KEY AUTOINCREMENT,
        id TEXT UNIQUE,
        template_id TEXT NOT NULL,
        name TEXT NOT NULL,
        provider_id TEXT NOT NULL,
        system_prompt TEXT NOT NULL,
        task_types_json TEXT NOT NULL,
        is_enabled INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS orchestration_runs (
        pk INTEGER PRIMARY KEY AUTOINCREMENT,
        id TEXT UNIQUE,
        plan_id TEXT NOT NULL,
        requirement_id TEXT NOT NULL,
        iteration_id TEXT NOT NULL,
        iteration_title TEXT NOT NULL,
        status TEXT NOT NULL,
        current_stage_id TEXT,
        last_error TEXT,
        stages_json TEXT NOT NULL,
        tasks_json TEXT NOT NULL,
        handoffs_json TEXT NOT NULL,
        started_at TEXT,
        completed_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);
  }

  private seedDefaults() {
    const workspaceCount = Number(
      this.db.prepare('SELECT COUNT(*) AS count FROM workspaces').get()?.count ?? 0
    );

    if (workspaceCount > 0) {
      return;
    }

    const now = new Date().toISOString();
    const insert = this.db.prepare(`
      INSERT INTO workspaces (name, root_path, description, is_default, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const result = insert.run(
      'Local Workspace',
      process.cwd(),
      'Default local workspace',
      1,
      now,
      now
    );
    const id = `ws_${result.lastInsertRowid}`;
    this.db.prepare('UPDATE workspaces SET id = ? WHERE pk = ?').run(id, result.lastInsertRowid);
  }
}

function resolveDatabasePath() {
  if (process.env.ULTIMATE_TEAM_DB_PATH?.trim()) {
    return resolve(process.cwd(), process.env.ULTIMATE_TEAM_DB_PATH.trim());
  }

  const cwd = process.cwd();
  if (cwd.endsWith('/apps/api')) {
    return resolve(cwd, 'data/ultimate-team.db');
  }

  return resolve(cwd, 'apps/api/data/ultimate-team.db');
}
