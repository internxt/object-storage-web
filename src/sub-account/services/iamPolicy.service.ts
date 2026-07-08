export interface BucketOption {
  name: string
  region: string
}

export const ALL_BUCKETS = '*'

export const S3_ACTIONS = {
  getObject: 's3:GetObject',
  putObject: 's3:PutObject',
  deleteObject: 's3:DeleteObject',
  listBucket: 's3:ListBucket',
  listAllMyBuckets: 's3:ListAllMyBuckets',
  all: 's3:*'
} as const

export type AccessLevel = 'read' | 'write' | 'full'

interface AccessLevelDefinition {
  label: string
  actions: string[]
  // Account-level actions can't be scoped to a bucket, so they go in a '*' statement.
  accountActions: string[]
}

export const ACCESS_LEVEL_CONFIG: Record<AccessLevel, AccessLevelDefinition> = {
  read: {
    label: 'Read',
    actions: [S3_ACTIONS.getObject, S3_ACTIONS.listBucket],
    accountActions: [S3_ACTIONS.listAllMyBuckets]
  },
  write: {
    label: 'Write',
    actions: [
      S3_ACTIONS.getObject,
      S3_ACTIONS.putObject,
      S3_ACTIONS.listBucket
    ],
    accountActions: [S3_ACTIONS.listAllMyBuckets]
  },
  full: {
    label: 'Full',
    actions: [S3_ACTIONS.all],
    accountActions: [S3_ACTIONS.listAllMyBuckets]
  }
}

export const ACCESS_LEVELS = Object.keys(ACCESS_LEVEL_CONFIG) as AccessLevel[]

export const accessLevelLabel = (level: AccessLevel): string =>
  ACCESS_LEVEL_CONFIG[level].label

export const accessLevelActions = (level: AccessLevel): string[] =>
  ACCESS_LEVEL_CONFIG[level].actions

export interface BucketRule {
  bucketName: string
  accessLevel: AccessLevel
}

// Custom = the builder can't represent it, so it must be edited as raw JSON
export const isCustomPolicy = (rules: BucketRule[]): boolean => {
  if (rules.length === 0) return true
  const hasAllBuckets = rules.some(r => r.bucketName === ALL_BUCKETS)
  return hasAllBuckets && rules.length > 1
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

export const rulesToPolicy = (rules: BucketRule[]): PolicyDocument => {
  const bucketStatements = rules.map(ruleToStatement)

  const accountActions = accountActionsFor(rules.map(rule => rule.accessLevel))
  const statements =
    accountActions.length > 0
      ? [
          { Effect: 'Allow' as const, Action: accountActions, Resource: ['*'] },
          ...bucketStatements
        ]
      : bucketStatements

  return { Version: '2012-10-17', Statement: statements }
}

export const rulesToJson = (rules: BucketRule[]): string =>
  JSON.stringify(rulesToPolicy(rules), null, 2)

// Resource carries the bucket ARN (for actions like s3:ListBucket) plus its objects.
const ruleToStatement = (rule: BucketRule): PolicyStatement => {
  if (rule.bucketName === ALL_BUCKETS) {
    return {
      Effect: 'Allow',
      Action: accessLevelActions(rule.accessLevel),
      Resource: ['arn:aws:s3:::*']
    }
  }

  const bucketArn = `arn:aws:s3:::${rule.bucketName}`
  return {
    Effect: 'Allow',
    Action: accessLevelActions(rule.accessLevel),
    Resource: [bucketArn, `${bucketArn}/*`]
  }
}

// ─── Policy → rules (read-only, best-effort) ────────────────────────────────

// Normalise Action/Resource to arrays as IAM policies allow single strings too.
const toStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value : value != null ? [value as string] : []

export interface ParsedPolicy {
  rules: BucketRule[]
  // Statements the builder can't represent (Deny, unknown actions, prefixes,
  // unparsable ARNs), counted so the UI can warn they'd be dropped on a rebuild.
  droppedCount: number
}

export const policyToRules = (statements: PolicyStatement[]): ParsedPolicy => {
  const rules: BucketRule[] = []
  let droppedCount = 0

  for (const rawStatement of statements) {
    const statement = {
      ...rawStatement,
      Action: toStringArray(rawStatement.Action),
      Resource: toStringArray(rawStatement.Resource)
    }
    if (isAccountStatement(statement)) {
      continue
    }
    const rule = statementToRule(statement)
    if (rule) {
      rules.push(rule)
    } else droppedCount++
  }

  return { rules, droppedCount }
}

// The '*' statement rulesToPolicy emits for account-level actions; skipped on
// parse so it isn't mistaken for a bucket rule or an unknown statement.
const isAccountStatement = (statement: PolicyStatement): boolean => {
  const knownActions = accountActionsFor(ACCESS_LEVELS)
  return (
    statement.Effect === 'Allow' &&
    statement.Resource.length === 1 &&
    isAllBucketsResource(statement.Resource[0]) &&
    statement.Action.length > 0 &&
    statement.Action.every(action => knownActions.includes(action))
  )
}

// Raw editor text → statements, or null if it isn't a policy with a Statement array.
export const parseStatements = (raw: string): PolicyStatement[] | null => {
  try {
    const parsed = JSON.parse(raw)
    if (!parsed || !Array.isArray(parsed.Statement)) return null
    return (parsed.Statement as PolicyStatement[]).map((statement) => ({
      ...statement,
      Action: toStringArray(statement.Action),
      Resource: toStringArray(statement.Resource)
    }))
  } catch {
    return null
  }
}

// Whether the builder can show these statements losslessly (used to decide if
// switching to it is safe): nothing dropped and not a custom policy.
export const builderCanRepresent = (statements: PolicyStatement[]): boolean => {
  const { rules, droppedCount } = policyToRules(statements)
  return droppedCount === 0 && !isCustomPolicy(rules)
}

const statementToRule = (statement: PolicyStatement): BucketRule | null => {
  if (statement.Effect !== 'Allow') return null

  const accessLevel = actionsToAccessLevel(statement.Action)
  if (!accessLevel) return null

  if (statement.Resource.length === 1 && isAllBucketsResource(statement.Resource[0])) {
    return { bucketName: ALL_BUCKETS, accessLevel }
  }

  const arnMatches = statement.Resource.map(resource => S3_ARN_RE.exec(resource))
  if (arnMatches.some(match => !match)) return null

  // One rule = one bucket; a statement spanning several can't be one row.
  const bucketNames = [...new Set(arnMatches.map(match => match![1]))]
  if (bucketNames.length !== 1) return null

  // The builder grants the whole bucket, so any object-prefix scoping is custom.
  const hasPrefix = arnMatches.some(match => {
    const objectPath = (match![2] ?? '').replace(/\*$/, '')
    return objectPath !== ''
  })
  if (hasPrefix) return null

  return { bucketName: bucketNames[0], accessLevel }
}

// Matches only on an EXACT action set — any extra/missing action is rejected so
// rebuilding from the builder never silently drops actions we don't model.
const actionsToAccessLevel = (actions: string[]): AccessLevel | null => {
  const actionSet = new Set(actions)
  const matches = (expected: string[]) =>
    actionSet.size === expected.length && expected.every(action => actionSet.has(action))

  for (const accessLevel of ACCESS_LEVELS) {
    if (matches(accessLevelActions(accessLevel))) return accessLevel
  }
  return null
}

const accountActionsFor = (levels: AccessLevel[]): string[] => [
  ...new Set(levels.flatMap(level => ACCESS_LEVEL_CONFIG[level].accountActions))
]
