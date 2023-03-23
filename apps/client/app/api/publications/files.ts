import { DeleteObjectsCommand, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { env } from "../../../src/env/server.mjs";
import { s3Client } from "../../../src/server/client";
import { S3Path } from "../../../src/utils/s3Paths";

export const expiresIn = 600; // 10 minutes

export const PUBLICATION_FILE = {
  IMAGE: "image",
  MODEL: "model",
  METADATA: "metadata",
} as const;

export type PublicationFile = (typeof PUBLICATION_FILE)[keyof typeof PUBLICATION_FILE];

export async function getUpload(id: string, type: PublicationFile) {
  const Key = S3Path.publication(id)[type];
  const ContentType = getContentType(type);
  const command = new PutObjectCommand({ Bucket: env.S3_BUCKET, Key, ContentType });
  const url = await getSignedUrl(s3Client, command, { expiresIn });
  return url;
}

export async function getDownload(id: string, type: PublicationFile) {
  const Key = S3Path.publication(id)[type];
  const command = new GetObjectCommand({ Bucket: env.S3_BUCKET, Key });
  const url = await getSignedUrl(s3Client, command, { expiresIn });
  return url;
}

export async function deleteFiles(id: string) {
  const paths = S3Path.publication(id);

  const command = new DeleteObjectsCommand({
    Bucket: env.S3_BUCKET,
    Delete: { Objects: Object.values(paths).map((Key) => ({ Key })) },
  });

  await s3Client.send(command);
}

export function getContentType(type: PublicationFile) {
  switch (type) {
    case PUBLICATION_FILE.IMAGE: {
      return "image/jpeg";
    }

    case PUBLICATION_FILE.MODEL: {
      return "model/gltf-binary";
    }

    case PUBLICATION_FILE.METADATA: {
      return "application/json";
    }
  }
}
