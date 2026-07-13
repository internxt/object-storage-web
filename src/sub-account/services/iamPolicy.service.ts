export interface BucketOption {
  name: string
  region: string
}

export const ALL_BUCKETS = '*'

export const S3_ACTIONS = {
  getObject: 's3:GetObject',
  putObject: 's3:PutObject',
  deleteObject: 's3:DeleteObject',
  abortMultipartUpload: 's3:AbortMultipartUpload',
  listMultipartUploadParts: 's3:ListMultipartUploadParts',
  listBucketMultipartUploads: 's3:ListBucketMultipartUploads',
  listBucket: 's3:ListBucket',
  listAllMyBuckets: 's3:ListAllMyBuckets',
  deleteBucket: 's3:DeleteBucket',
  getBucketObjectLockConfiguration: 's3:GetBucketObjectLockConfiguration',
  getBucketVersioning: 's3:GetBucketVersioning',
  getBucketLocation: 's3:GetBucketLocation',
  getBucketLogging: 's3:GetBucketLogging',
  getBucketAcl: 's3:GetBucketAcl',
  getObjectRetention: 's3:GetObjectRetention',
  getObjectVersion: 's3:GetObjectVersion',
  deleteObjectVersion: 's3:DeleteObjectVersion',
  listBucketVersions: 's3:ListBucketVersions',
  all: 's3:*'
} as const

const READ_ACTIONS: string[] = [
  S3_ACTIONS.getObject,
  S3_ACTIONS.listBucket,
  S3_ACTIONS.getBucketObjectLockConfiguration,
  S3_ACTIONS.getBucketVersioning,
  S3_ACTIONS.getBucketLocation,
  S3_ACTIONS.getBucketLogging,
  S3_ACTIONS.getBucketAcl,
  S3_ACTIONS.getObjectRetention,
  S3_ACTIONS.getObjectVersion,
  S3_ACTIONS.listBucketVersions
]

export type AccessLevel = 'read' | 'write' | 'full' | 'full-limited'

interface AccessLevelDefinition {
  label: string
  actions: string[]
  deniedActions?: string[]
  // Account-level actions can't be scoped to a bucket, so they go in a '*' statement.
  accountActions: string[]
}

export const ACCESS_LEVEL_CONFIG: Record<AccessLevel, AccessLevelDefinition> = {
  read: {
    label: 'Read',
    actions: READ_ACTIONS,
    accountActions: [S3_ACTIONS.listAllMyBuckets]
  },
  write: {
    label: 'Write',
    actions: [
      ...READ_ACTIONS,
      S3_ACTIONS.putObject,
      S3_ACTIONS.deleteObject,
      S3_ACTIONS.deleteObjectVersion,
      S3_ACTIONS.abortMultipartUpload,
      S3_ACTIONS.listMultipartUploadParts,
      S3_ACTIONS.listBucketMultipartUploads
    ],
    accountActions: [S3_ACTIONS.listAllMyBuckets]
  },
  'full-limited': {
    label: 'Full limited',
    actions: [S3_ACTIONS.all],
    deniedActions: [S3_ACTIONS.deleteBucket],
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

export interface BucketRule {
  bucketName: string
  accessLevel: AccessLevel
}

export interface PolicyStatement {
  Effect: 'Allow' | 'Deny'
  Action: string[]
  Resource: string[]
}

// The builder only knows how to produce these fields.
const SUPPORTED_STATEMENT_FIELDS = new Set(['Sid', 'Effect', 'Action', 'Resource'])

const hasUnsupportedFields = (statement: PolicyStatement): boolean =>
  Object.keys(statement).some(field => !SUPPORTED_STATEMENT_FIELDS.has(field))

export interface PolicyDocument {
  Version: '2012-10-17'
  Statement: PolicyStatement[]
}

const BUCKET_NAME = '[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]'
const S3_ARN_RE = new RegExp(`^arn:aws:s3:::(${BUCKET_NAME})(?:\\/(.*))?$`)

const isAllBucketsResource = (resource: string): boolean =>
  resource === '*' || resource === 'arn:aws:s3:::*' || resource === 'arn:aws:s3:::*/*'

// ─── Builder rules → policy JSON ─────────────────────────────────────────────

export class BucketRulesToPolicy {
  static toDocument(rules: BucketRule[]): PolicyDocument {
    const bucketStatements = rules.flatMap(rule => BucketRulesToPolicy.toStatements(rule))

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

  static toJson(rules: BucketRule[]): string {
    return JSON.stringify(BucketRulesToPolicy.toDocument(rules), null, 2)
  }

  // 'full-limited' adds a Deny on top of its Allow.
  static toStatements(rule: BucketRule): PolicyStatement[] {
    const bucketAndObjectsResource =
      rule.bucketName === ALL_BUCKETS
        ? ['arn:aws:s3:::*', 'arn:aws:s3:::*/*']
        : [`arn:aws:s3:::${rule.bucketName}`, `arn:aws:s3:::${rule.bucketName}/*`]

    const { actions, deniedActions } = ACCESS_LEVEL_CONFIG[rule.accessLevel]
    const statements: PolicyStatement[] = [
      { Effect: 'Allow', Action: actions, Resource: bucketAndObjectsResource }
    ]

    if (deniedActions?.length) {
      statements.push({ Effect: 'Deny', Action: deniedActions, Resource: bucketAndObjectsResource })
    }

    return statements
  }
}

// ─── Policy JSON → builder rules (read-only, best-effort) ────────────────────
export class PolicyToBucketRules {
  static parseJson(raw: string): PolicyStatement[] | null {
    try {
      const parsed = JSON.parse(raw)
      if (!parsed || !Array.isArray(parsed.Statement)) {
        return null
      }
      return (parsed.Statement as PolicyStatement[]).map(statement => ({
        ...statement,
        Action: toStringArray(statement.Action),
        Resource: toStringArray(statement.Resource)
      }))
    } catch {
      return null
    }
  }

  // Custom = builder can't represent it
  static isCustom(statements: PolicyStatement[]): boolean {
    const { rules, hasCustomStatement } = PolicyToBucketRules.parse(statements)
    if (hasCustomStatement || rules.length === 0) {
      return true
    }

    const spansAllBuckets = rules.some(rule => rule.bucketName === ALL_BUCKETS)
    return spansAllBuckets && rules.length > 1
  }

  static toRules(statements: PolicyStatement[]): BucketRule[] {
    return PolicyToBucketRules.parse(statements).rules
  }

  private static parse(statements: PolicyStatement[]): { rules: BucketRule[]; hasCustomStatement: boolean } {
    const accountActions = accountActionsFor(ACCESS_LEVELS)
    // The '*' account-level statement isn't a bucket rule, so skip it.
    const isAccountStatement = (statement: PolicyStatement): boolean =>
      statement.Effect === 'Allow' &&
      statement.Resource.length === 1 &&
      isAllBucketsResource(statement.Resource[0]) &&
      statement.Action.length > 0 &&
      statement.Action.every(action => accountActions.includes(action))

    const normalised = statements.map(rawStatement => ({
      ...rawStatement,
      Action: toStringArray(rawStatement.Action),
      Resource: toStringArray(rawStatement.Resource)
    }))

    // Group by Resource so an Allow and its paired Deny ('full-limited') become one rule.
    const groups = new Map<string, PolicyStatement[]>()
    let hasCustomStatement = false
    for (const statement of normalised) {
      if (hasUnsupportedFields(statement)) {
        hasCustomStatement = true
        continue
      }
      if (isAccountStatement(statement)) {
        continue
      }
      const resourceKey = canonical(statement.Resource)
      const group = groups.get(resourceKey) ?? []
      group.push(statement)
      groups.set(resourceKey, group)
    }

    const rules: BucketRule[] = []
    for (const group of groups.values()) {
      const rule = PolicyToBucketRules.toRule(group)
      if (rule) {
        rules.push(rule)
      } else {
        hasCustomStatement = true
      }
    }

    return { rules, hasCustomStatement }
  }

  // Matches a group against each level's serialised form; no match (or a Resource
  // that isn't one whole bucket) = custom.
  private static toRule(group: PolicyStatement[]): BucketRule | null {
    const resource = group[0].Resource
    let bucketName: string | null
    if (resource.length > 0 && resource.every(isAllBucketsResource)) {
      bucketName = ALL_BUCKETS
    } else {
      const arns = resource.map(r => S3_ARN_RE.exec(r))
      const buckets = new Set(arns.map(arn => arn?.[1]))
      const hasObjectPrefix = arns.some(arn => (arn?.[2] ?? '').replace(/\*$/, '') !== '')
      const spansOneParsableBucket = !buckets.has(undefined) && buckets.size === 1
      bucketName = spansOneParsableBucket && !hasObjectPrefix ? [...buckets][0]! : null
    }
    if (bucketName === null) {
      return null
    }

    const key = groupKey(group)
    const accessLevel = ACCESS_LEVELS.find(
      accessLevel => groupKey(BucketRulesToPolicy.toStatements({ bucketName, accessLevel })) === key
    )
    return accessLevel ? { bucketName, accessLevel } : null
  }
}

// ─── Helpers ──────────────────────────────────────

// IAM policies allow a single string where an array is expected; normalise both.
const toStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value : value != null ? [value as string] : []

// A stable, order-insensitive string for a list, usable as a Map key or fingerprint.
const canonical = (values: string[]): string => [...values].sort().join('|')

const groupKey = (statements: PolicyStatement[]): string =>
  canonical(statements.map(s => [s.Effect, canonical(s.Action), canonical(s.Resource)].join('#')))

const accountActionsFor = (levels: AccessLevel[]): string[] => [
  ...new Set(levels.flatMap(level => ACCESS_LEVEL_CONFIG[level].accountActions))
]
