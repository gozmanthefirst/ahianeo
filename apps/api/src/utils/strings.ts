/**
 * Generates a random password.
 * @param length - The length of the password.
 * @returns A random password.
 */
export const generatePassword = (length = 16) => {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from(crypto.getRandomValues(new Uint32Array(length)))
    .map((x) => chars[x % chars.length])
    .join("");
};
