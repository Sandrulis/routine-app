/** Cryptographically random password with lower, upper, digit, and special chars. */
export function generateStrongPassword(length = 16): string {
  const len = Math.max(12, Math.floor(length));
  const lower = "abcdefghijklmnopqrstuvwxyz";
  const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const digits = "0123456789";
  const special = "!@#$%^&*-_=+";
  const all = lower + upper + digits + special;

  function randMax(max: number): number {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    return buf[0]! % max;
  }

  const chars: string[] = [
    lower.charAt(randMax(lower.length)),
    upper.charAt(randMax(upper.length)),
    digits.charAt(randMax(digits.length)),
    special.charAt(randMax(special.length)),
  ];

  const rest = new Uint32Array(len - 4);
  crypto.getRandomValues(rest);
  for (let i = 0; i < rest.length; i += 1) {
    chars.push(all.charAt(rest[i]! % all.length));
  }

  for (let j = chars.length - 1; j > 0; j -= 1) {
    const k = randMax(j + 1);
    const tmp = chars[j]!;
    chars[j] = chars[k]!;
    chars[k] = tmp;
  }
  return chars.join("");
}
