export interface PasswordGeneratorOptions {
  length: number;
  lowercase: boolean;
  numbers: boolean;
  symbols: boolean;
  uppercase: boolean;
}

const characterSets = {
  uppercase: "ABCDEFGHJKLMNPQRSTUVWXYZ",
  lowercase: "abcdefghijkmnopqrstuvwxyz",
  numbers: "23456789",
  symbols: "!@#$%^&*()-_=+[]{}:,.?",
};

function randomIndex(length: number) {
  const values = new Uint32Array(1);
  crypto.getRandomValues(values);
  return values[0] % length;
}

export function generatePassword(options: PasswordGeneratorOptions) {
  const selected = (Object.keys(characterSets) as Array<keyof typeof characterSets>)
    .filter((key) => options[key]);
  if (!selected.length) throw new Error("Choose at least one character group.");

  const requestedLength = Number.isFinite(options.length) ? Math.floor(options.length) : 8;
  const length = Math.min(64, Math.max(8, requestedLength, selected.length));
  const characters = selected.map((key) => characterSets[key]);
  const password = characters.map((set) => set[randomIndex(set.length)]);
  const pool = characters.join("");
  while (password.length < length) password.push(pool[randomIndex(pool.length)]);

  for (let index = password.length - 1; index > 0; index -= 1) {
    const swapIndex = randomIndex(index + 1);
    [password[index], password[swapIndex]] = [password[swapIndex], password[index]];
  }
  return password.join("");
}
