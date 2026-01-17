declare module 'rollup-plugin-string' {
  export function string(options?: {
    include?: string | string[];
  }): import('rollup').Plugin;
}
