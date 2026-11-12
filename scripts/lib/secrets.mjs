// Secrets recognisable by their shape alone: what must never be committed.

export const SECRET_KINDS = [
  { kind: 'a private key', pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ },
  {
    kind: 'a Slack webhook',
    pattern: /https:\/\/hooks\.slack\.com\/services\/T[A-Z0-9]+\/B[A-Z0-9]+\/[A-Za-z0-9]+/,
  },
  { kind: 'a Slack token', pattern: /\bxox[abposr]-[A-Za-z0-9-]{10,}/ },
  { kind: 'a Teams webhook', pattern: /https:\/\/[\w-]+\.webhook\.office\.com\/webhookb2\/\S+/ },
  { kind: 'a GitHub token', pattern: /\b(?:gh[pousr]_[A-Za-z0-9]{36,}|github_pat_\w{22,})/ },
  { kind: 'an AWS access key', pattern: /\bAKIA[0-9A-Z]{16}\b/ },
  { kind: 'a Google API key', pattern: /\bAIza[0-9A-Za-z_-]{35}\b/ },
  { kind: 'a Stripe live key', pattern: /\b[rs]k_live_[0-9A-Za-z]{20,}/ },
  { kind: 'an Azure storage key', pattern: /AccountKey=[A-Za-z0-9+/=]{40,}/ },
  { kind: 'a JSON Web Token', pattern: /\beyJ[\w-]{10,}\.eyJ[\w-]{10,}\.[\w-]{10,}/ },
];

/** The lines of a text that look like a secret, with what each looks like. Never the value. */
export function findSecrets(text) {
  return text.split('\n').flatMap((line, index) =>
    SECRET_KINDS.filter(({ pattern }) => pattern.test(line)).map(({ kind }) => ({
      line: index + 1,
      kind,
    })),
  );
}

/** A file that holds secrets by its very name: a .env other than the example, a session, a key. */
export function isSecretFile(file) {
  const normalized = file.replaceAll('\\', '/');
  const name = normalized.split('/').pop();
  return (
    (/^\.env(\.|$)/.test(name) && name !== '.env.example') ||
    /(^|\/)\.auth\//.test(normalized) ||
    /\.(pem|key|p12|pfx)$/.test(name)
  );
}
