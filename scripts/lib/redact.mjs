// Hides what could sign someone in: the passwords and accounts of .env, tokens, cookies, keys.

const HEADER =
  /^(\s*["']?(?:authorization|proxy-authorization|cookie|set-cookie|x-api-key|api-key|x-auth-token|x-access-token|x-csrf-token|x-xsrf-token)["']?\s*[:=]\s*).+$/gim;
const JSON_FIELD =
  /("(?:authorization|cookie|set-cookie|x-api-key|access_?token|refresh_?token|id_?token|token|password|passwd|secret|client_?secret|api_?key)"\s*:\s*)"(?:[^"\\]|\\.)*"/gi;
const QUERY =
  /([?&#](?:code|token|access_token|id_token|refresh_token|password|key|sig|signature)=)[^&\s"'#]+/gi;
const JWT = /\beyJ[\w-]{4,}\.[\w-]{4,}\.[\w-]{4,}/g;
const SCHEME = /\b(Bearer|Basic)\s+[\w.~+/=-]{8,}/g;

const SECRET_NAME = /PASSWORD|SECRET|TOKEN|KEY|EMAIL|USERNAME|LOGIN/;

/** The values of a .env file worth hiding, with the name each is replaced by. */
export function secretsOfDotenv(text) {
  return text.split(/\r?\n/).flatMap((line) => {
    const match = /^\s*(?:export\s+)?([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line);
    if (!match || !SECRET_NAME.test(match[1])) return [];
    const value = match[2].trim().replace(/^(["'])(.*)\1$/, '$2');
    return value.length >= 4 ? [{ name: match[1], value }] : [];
  });
}

/** The text without the known values, and without anything shaped like a credential. */
export function redact(text, known = []) {
  let out = text;
  const values = known
    .flatMap(({ name, value }) => [
      { name, value },
      { name, value: encodeURIComponent(value) },
    ])
    .sort((a, b) => b.value.length - a.value.length);
  for (const { name, value } of values) out = out.split(value).join(`<${name}>`);
  return out
    .replace(HEADER, '$1<redacted>')
    .replace(JSON_FIELD, '$1"<redacted>"')
    .replace(QUERY, '$1<redacted>')
    .replace(JWT, '<jwt>')
    .replace(SCHEME, '$1 <redacted>');
}
