import { randomUUID } from "node:crypto";

import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

import type { Environment } from "./env";

const createR2Client = (env: Environment) => {
  return new S3Client({
    region: "auto",
    endpoint: `https://${env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: env.CLOUDFLARE_R2_ACCESS_KEY_ID,
      secretAccessKey: env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
    },
  });
};

export const uploadImageToR2 = async (
  file: File,
  env: Environment,
  folder = "products",
) => {
  const r2Client = createR2Client(env);

  const fileExtension = file.name.split(".").pop();
  const fileName = `${folder}/${randomUUID()}.${fileExtension}`;

  const command = new PutObjectCommand({
    Bucket: env.CLOUDFLARE_R2_BUCKET_NAME,
    Key: fileName,
    Body: Buffer.from(await file.arrayBuffer()),
    ContentType: file.type,
  });

  await r2Client.send(command);

  return {
    url: `${process.env.CLOUDFLARE_R2_PUBLIC_URL}/${fileName}`,
    key: fileName,
  };
};

export const deleteImageFromR2 = async (key: string, env: Environment) => {
  const r2Client = createR2Client(env);

  const command = new DeleteObjectCommand({
    Bucket: env.CLOUDFLARE_R2_BUCKET_NAME,
    Key: key,
  });

  await r2Client.send(command);
};

export { createR2Client };
