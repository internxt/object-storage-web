import {
  S3Client,
  ListBucketsCommand,
  ListObjectsV2Command,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetBucketVersioningCommand,
  PutBucketVersioningCommand,
  GetBucketLoggingCommand,
  PutBucketLoggingCommand,
  GetObjectLockConfigurationCommand,
  PutObjectLockConfigurationCommand,
  DeleteBucketCommand,
  CreateBucketCommand,
  GetBucketLocationCommand,
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { GetObjectCommand } from '@aws-sdk/client-s3';

export interface S3Bucket {
  name: string;
  creationDate: Date;
  region?: string;
}

export interface S3Object {
  key: string;
  size: number;
  lastModified: Date;
  isFolder: boolean;
}

export interface ListObjectsResult {
  objects: S3Object[];
  continuationToken?: string;
  isTruncated: boolean;
}

export const s3Service = {
  listBuckets: async (client: S3Client): Promise<S3Bucket[]> => {
    const { Buckets = [] } = await client.send(new ListBucketsCommand({}));
    return Buckets.map((b) => ({
      name: b.Name!,
      creationDate: b.CreationDate!,
    }));
  },

  getBucketLocation: async (client: S3Client, bucket: string): Promise<string> => {
    const { LocationConstraint } = await client.send(
      new GetBucketLocationCommand({ Bucket: bucket }),
    );
    return LocationConstraint ?? 'us-east-1';
  },

  createBucket: async (client: S3Client, name: string, region: string): Promise<void> => {
    if (import.meta.env.DEV) console.log('[s3] createBucket', { name, region });
    await client.send(new CreateBucketCommand({
      Bucket: name,
      ...(region !== 'us-east-1' && {
        CreateBucketConfiguration: { LocationConstraint: region as never },
      }),
    }));
    if (import.meta.env.DEV) console.log('[s3] createBucket success', { name, region });
  },

  listObjects: async (
    client: S3Client,
    bucket: string,
    prefix = '',
    continuationToken?: string,
    maxKeys = 100,
  ): Promise<ListObjectsResult> => {
    const { Contents = [], CommonPrefixes = [], NextContinuationToken, IsTruncated } =
      await client.send(new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
        Delimiter: '/',
        ContinuationToken: continuationToken,
        MaxKeys: maxKeys,
      }));

    const folders: S3Object[] = CommonPrefixes.map((p) => ({
      key: p.Prefix!,
      size: 0,
      lastModified: new Date(0),
      isFolder: true,
    }));

    const files: S3Object[] = Contents
      .filter((c) => c.Key !== prefix)
      .map((c) => ({
        key: c.Key!,
        size: c.Size ?? 0,
        lastModified: c.LastModified ?? new Date(0),
        isFolder: false,
      }));

    return {
      objects: [...folders, ...files],
      continuationToken: NextContinuationToken,
      isTruncated: IsTruncated ?? false,
    };
  },

  uploadObject: async (
    client: S3Client,
    bucket: string,
    key: string,
    file: File,
    onProgress?: (percent: number) => void,
  ): Promise<void> => {
    const upload = new Upload({
      client,
      params: { Bucket: bucket, Key: key, Body: file, ContentType: file.type },
    });

    if (onProgress) {
      upload.on('httpUploadProgress', (progress) => {
        if (progress.loaded && progress.total) {
          onProgress(Math.round((progress.loaded / progress.total) * 100));
        }
      });
    }

    await upload.done();
  },

  getDownloadUrl: async (client: S3Client, bucket: string, key: string): Promise<string> => {
    const filename = key.split('/').pop() ?? key;
    return getSignedUrl(client, new GetObjectCommand({
      Bucket: bucket,
      Key: key,
      ResponseContentDisposition: `attachment; filename="${filename}"`,
    }), { expiresIn: 900 });
  },

  deleteObject: async (client: S3Client, bucket: string, key: string): Promise<void> => {
    await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  },

  deleteObjects: async (client: S3Client, bucket: string, keys: string[]): Promise<void> => {
    await client.send(new DeleteObjectsCommand({
      Bucket: bucket,
      Delete: { Objects: keys.map((Key) => ({ Key })) },
    }));
  },

  getBucketVersioning: async (client: S3Client, bucket: string) => {
    const { Status, MFADelete } = await client.send(
      new GetBucketVersioningCommand({ Bucket: bucket }),
    );
    return { enabled: Status === 'Enabled', mfaDelete: MFADelete === 'Enabled' };
  },

  setBucketVersioning: async (client: S3Client, bucket: string, enabled: boolean): Promise<void> => {
    await client.send(new PutBucketVersioningCommand({
      Bucket: bucket,
      VersioningConfiguration: { Status: enabled ? 'Enabled' : 'Suspended' },
    }));
  },

  getBucketLogging: async (client: S3Client, bucket: string) => {
    const { LoggingEnabled } = await client.send(
      new GetBucketLoggingCommand({ Bucket: bucket }),
    );
    return {
      enabled: !!LoggingEnabled,
      targetBucket: LoggingEnabled?.TargetBucket,
      targetPrefix: LoggingEnabled?.TargetPrefix,
    };
  },

  setBucketLogging: async (
    client: S3Client,
    bucket: string,
    enabled: boolean,
    targetBucket?: string,
    targetPrefix?: string,
  ): Promise<void> => {
    await client.send(new PutBucketLoggingCommand({
      Bucket: bucket,
      BucketLoggingStatus: enabled && targetBucket
        ? { LoggingEnabled: { TargetBucket: targetBucket, TargetPrefix: targetPrefix ?? '' } }
        : {},
    }));
  },

  getObjectLockConfig: async (client: S3Client, bucket: string) => {
    try {
      const { ObjectLockConfiguration } = await client.send(
        new GetObjectLockConfigurationCommand({ Bucket: bucket }),
      );
      return {
        enabled: ObjectLockConfiguration?.ObjectLockEnabled === 'Enabled',
        mode: ObjectLockConfiguration?.Rule?.DefaultRetention?.Mode,
        days: ObjectLockConfiguration?.Rule?.DefaultRetention?.Days,
        years: ObjectLockConfiguration?.Rule?.DefaultRetention?.Years,
      };
    } catch {
      return { enabled: false };
    }
  },

  setObjectLockConfig: async (
    client: S3Client,
    bucket: string,
    mode: 'GOVERNANCE' | 'COMPLIANCE',
    days?: number,
    years?: number,
  ): Promise<void> => {
    await client.send(new PutObjectLockConfigurationCommand({
      Bucket: bucket,
      ObjectLockConfiguration: {
        ObjectLockEnabled: 'Enabled',
        Rule: { DefaultRetention: { Mode: mode, Days: days, Years: years } },
      },
    }));
  },

  deleteBucket: async (client: S3Client, bucket: string): Promise<void> => {
    await client.send(new DeleteBucketCommand({ Bucket: bucket }));
  },
};
