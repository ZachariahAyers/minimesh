/**
 * Get an env.
 * @description - Any ENV prefixed with 'MINIMESH_' will be available on the client or browser using this method.
 * @param {string} env - The env to get.
 * @return {string | undefined} - The env value or undefined if not found.
 * @author Zach Ayers
 */
export function getEnv(env: string): string | undefined {
  try {
    return import.meta.env[env];
  } catch {
    return undefined;
  }
}
