import 'vitest';

declare module 'jest-axe' {
  export function axe(container: Element | DocumentFragment): Promise<{ violations: unknown[] }>;
  export const toHaveNoViolations: unknown;
}

declare module 'vitest' {
  interface Assertion<T = any> {
    toHaveNoViolations(): T;
  }
}
