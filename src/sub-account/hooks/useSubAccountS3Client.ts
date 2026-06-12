import { useEffect, useRef, useState } from 'react';
import { S3Client } from '@aws-sdk/client-s3';
import { subAccountS3CredentialsService, S3Credentials } from '../services/sub-account-s3-credentials.service';

interface S3ClientState {
  client: S3Client | null;
  credentials: S3Credentials | null;
  isLoading: boolean;
  error: Error | null;
}

export const useSubAccountS3Client = (entityId: string | null, memberId: string | null): S3ClientState => {
  const [state, setState] = useState<S3ClientState>({
    client: null,
    credentials: null,
    isLoading: true,
    error: null,
  });
  const clientRef = useRef<S3Client | null>(null);

  useEffect(() => {
    if (!entityId || !memberId) {
      setState({ client: null, credentials: null, isLoading: false, error: null });
      return;
    }

    subAccountS3CredentialsService
      .getCredentials(entityId, memberId)
      .then((credentials) => {
        if (import.meta.env.DEV) {
          console.log('[sub-account] s3 credentials', { accessKeyId: credentials.accessKeyId, secretAccessKey: credentials.secretAccessKey, endpoint: credentials.endpoint });
        }
        if (clientRef.current) {
          clientRef.current.destroy();
        }
        const client = new S3Client({
          endpoint: credentials.endpoint,
          region: credentials.region,
          credentials: {
            accessKeyId: credentials.accessKeyId,
            secretAccessKey: credentials.secretAccessKey,
          },
          forcePathStyle: true,
        });
        clientRef.current = client;
        setState({ client, credentials, isLoading: false, error: null });
      })
      .catch((error) => {
        setState({ client: null, credentials: null, isLoading: false, error });
      });

    return () => {
      clientRef.current?.destroy();
    };
  }, [entityId, memberId]);

  return state;
};
