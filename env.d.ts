/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<object, object, unknown>
  export default component
}

declare module '*.wasm?url' {
  const src: string
  export default src
}

declare module 'sql.js' {
  export interface SqlValue {
    [key: string]: string | number | null | Uint8Array
  }
  export interface QueryExecResult {
    columns: string[]
    values: (string | number | null | Uint8Array)[][]
  }
  export interface Database {
    run(sql: string, params?: (string | number | null)[]): void
    exec(sql: string): QueryExecResult[]
    export(): Uint8Array
    close(): void
  }
  export interface SqlJsStatic {
    Database: new (data?: ArrayLike<number> | Buffer | null) => Database
  }
  export default function initSqlJs(config?: {
    locateFile?: (file: string) => string
    wasmBinary?: ArrayBuffer | Uint8Array
  }): Promise<SqlJsStatic>
}
