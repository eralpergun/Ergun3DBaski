/**
 * Simple SHA-256 implementation in pure TypeScript for secure hashing without dependencies.
 */
export async function hashPasscode(passcode: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(passcode);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Synchronous hash helper as a fallback or fast hash
 */
export function hashPasscodeSync(passcode: string): string {
  let hash = 0;
  for (let i = 0; i < passcode.length; i++) {
    const char = passcode.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return 'h_' + Math.abs(hash).toString(16);
}
