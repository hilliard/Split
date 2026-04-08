/**
 * Augment Astro's type-utils with missing KebabKeys type
 * This type converts camelCase property names to kebab-case
 */

import 'astro';

declare module 'astro/dist/type-utils' {
  /**
   * Convert camelCase property names to kebab-case
   * Example: { backgroundColor: 'red' } becomes { 'background-color': 'red' }
   */
  type KebabCase<S extends string> = S extends `${infer T}${infer U}`
    ? U extends Uncapitalize<U>
      ? `${T}${KebabCase<U>}`
      : `${T}-${Lowercase<U>}${KebabCase<Uncapitalize<U>>}`
    : S;

  export type KebabKeys<T> = {
    [K in keyof T as K extends string ? KebabCase<K> : K]: T[K];
  };
}
