import type { ColumnType } from 'typeorm'

const isSqlJs = process.env.DATABASE_DRIVER === 'sqljs'

export const jsonColumnType: ColumnType = isSqlJs ? 'simple-json' : 'jsonb'

// sql.js (the dev driver) does not support 'timestamptz'. Use 'datetime' there;
// Postgres production uses 'timestamptz'.
export const timestampColumnType: ColumnType = isSqlJs ? 'datetime' : 'timestamptz'

// sql.js has no real CHAR/VARCHAR distinction with length enforcement; we still
// pass a length for documentation and Postgres correctness.
export const varcharColumnType: ColumnType = isSqlJs ? 'varchar' : 'varchar'
