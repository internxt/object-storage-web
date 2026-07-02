export interface BucketOption {
  name: string
  region: string
}

export type AccessLevel = 'read' | 'write' | 'full'

export const ALL_BUCKETS = '*'

// A single access rule: which bucket (or '*' = all buckets) and the access
// level granted on it. Object-prefix scoping isn't modelled here — a policy that
// uses prefixes is treated as custom and edited as raw JSON instead.
export interface BucketRule {
  bucketName: string
  accessLevel: AccessLevel
}

export const ACCESS_LEVEL_LABELS: Record<AccessLevel, string> = {
  read: 'Read',
  write: 'Write',
  full: 'Full'
}
export const ACCESS_LEVELS = Object.keys(ACCESS_LEVEL_LABELS) as AccessLevel[]

// Rules the builder can't represent, so the policy must be edited as raw JSON:
// a mix of '*' with concrete buckets. An empty set is also custom (nothing to
// build). Callers pair this with droppedCount for statements policyToRules
// couldn't parse at all (prefixes, Deny, unknown actions).
export const isCustomPolicy = (rules: BucketRule[]): boolean => {
  if (rules.length === 0) return true
  const hasAllBuckets = rules.some(r => r.bucketName === ALL_BUCKETS)
  return hasAllBuckets && rules.length > 1
}

export const ACCESS_LEVEL_ACTIONS: Record<AccessLevel, string[]> = {
  read: ['s3:GetObject', 's3:ListBucket'],
  write: ['s3:GetObject', 's3:PutObject', 's3:ListBucket'],
  full: ['s3:GetObject', 's3:ListBucket', 's3:PutObject', 's3:DeleteObject']
}

export interface PolicyStatement {
  Effect: 'Allow' | 'Deny'
  Action: string[]
  Resource: string[]
}

export interface PolicyDocument {
  Version: '2012-10-17'
  Statement: PolicyStatement[]
}

const BUCKET_NAME = '[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]'
const S3_ARN_RE = new RegExp(`^arn:aws:s3:::(${BUCKET_NAME})(?:\\/(.*))?$`)

const isAllBucketsResource = (resource: string): boolean =>
  resource === '*' || resource === 'arn:aws:s3:::*'

// ─── Rules → policy (the only direction we serialise) ───────────────────────

export const rulesToPolicy = (rules: BucketRule[]): PolicyDocument => ({
  Version: '2012-10-17',
  Statement: rules.map(ruleToStatement)
})

export const rulesToJson = (rules: BucketRule[]): string =>
  JSON.stringify(rulesToPolicy(rules), null, 2)

// One statement per rule. Resource carries the bucket ARN (for bucket-level
// actions like s3:ListBucket) plus every object in it.
const ruleToStatement = (rule: BucketRule): PolicyStatement => {
  if (rule.bucketName === ALL_BUCKETS) {
    return { Effect: 'Allow', Action: ACCESS_LEVEL_ACTIONS[rule.accessLevel], Resource: ['arn:aws:s3:::*'] }
  }

  const bucketArn = `arn:aws:s3:::${rule.bucketName}`
  return {
    Effect: 'Allow',
    Action: ACCESS_LEVEL_ACTIONS[rule.accessLevel],
    Resource: [bucketArn, `${bucketArn}/*`]
  }
}

// ─── Policy → rules (read-only, best-effort) ────────────────────────────────

export interface ParsedPolicy {
  rules: BucketRule[]
  // Statements we couldn't turn into an editable rule (Deny, unknown actions,
  // prefixes, unparsable ARNs). Kept as a count so the UI can warn they'll be
  // dropped if the policy is rebuilt from the builder.
  droppedCount: number
}

// Best-effort read of an IAM policy into editable rules. Anything that doesn't
// map cleanly is counted in droppedCount rather than represented, so the builder
// only ever shows rules it can round-trip.
export const policyToRules = (statements: PolicyStatement[]): ParsedPolicy => {
  const rules: BucketRule[] = []
  let droppedCount = 0

  for (const stmt of statements) {
    const rule = statementToRule(stmt)
    if (rule) rules.push(rule)
    else droppedCount++
  }

  return { rules, droppedCount }
}

const statementToRule = (stmt: PolicyStatement): BucketRule | null => {
  if (stmt.Effect !== 'Allow') return null

  const accessLevel = actionsToAccessLevel(stmt.Action)
  if (!accessLevel) return null

  if (stmt.Resource.length === 1 && isAllBucketsResource(stmt.Resource[0])) {
    return { bucketName: ALL_BUCKETS, accessLevel }
  }

  const matches = stmt.Resource.map(r => S3_ARN_RE.exec(r))
  if (matches.some(m => !m)) return null

  // A rule is a single bucket; a statement spanning several buckets can't be
  // one editable row.
  const bucketNames = [...new Set(matches.map(m => m![1]))]
  if (bucketNames.length !== 1) return null

  // The builder grants the whole bucket. Any object-prefix scoping means we
  // can't represent this as a rule — leave it for raw-JSON (custom) editing.
  const hasPrefix = matches.some(m => {
    const objectPath = (m![2] ?? '').replace(/\*$/, '')
    return objectPath !== ''
  })
  if (hasPrefix) return null

  return { bucketName: bucketNames[0], accessLevel }
}

// A statement maps to an access level only when its actions are EXACTLY a
// level's action set. Any extra (or missing) action makes it unrepresentable
// by the builder, so it's rejected here and surfaces as a custom policy — that
// way rebuilding from the builder never silently drops actions we don't model.
const actionsToAccessLevel = (actions: string[]): AccessLevel | null => {
  const set = new Set(actions)
  const matches = (expected: string[]) =>
    set.size === expected.length && expected.every((a) => set.has(a))

  for (const accessLevel of ACCESS_LEVELS) {
    if (matches(ACCESS_LEVEL_ACTIONS[accessLevel])) return accessLevel
  }
  return null
}
