import "dotenv/config";
import * as Minio from "minio";
import crypto from "node:crypto";

// Number of parts to compose, adjust as needed
// Keep in mind S3 has a limit of 10,000 parts per multipart upload
const partCount = 1000;

// This is minimum part size for S3 multipart uploads
const partSize = 5 * 1024 * 1024;

const partPrefix = "test/part-";
const mergedObjectName = "test.merged";

const endPoint = new URL(process.env.AWS_ENDPOINT_URL_S3);
const bucketName = process.env.BUCKET_NAME;

const generateObjectName = (i) =>
  partPrefix.concat(String(i + 1).padStart(5, "0"));

const minioClient = new Minio.Client({
  endPoint: endPoint.hostname,
  port: endPoint.port,
  useSSL: endPoint.protocol === "https:",
  accessKey: process.env.AWS_ACCESS_KEY_ID,
  secretKey: process.env.AWS_SECRET_ACCESS_KEY,
});

if (process.argv[2] === "prepare") {
  let randomBuffer;

  const currentParts = await new Promise((resolve, reject) => {
    const objects = {};
    const stream = minioClient.listObjectsV2(bucketName, partPrefix, true);
    stream.on("data", (obj) => {
      objects[obj.name] = obj.size;
    });
    stream.on("error", (err) => {
      reject(err);
    });
    stream.on("end", () => {
      resolve(objects);
    });
  });

  for (let i = 0; i < partCount; i++) {
    const objectName = generateObjectName(i);

    if (objectName in currentParts && currentParts[objectName] === partSize) {
      console.debug(`Part ${i + 1} already exists, skipping: ${objectName}`);
    } else {
      console.debug(`Uploading part ${i + 1} / ${partCount}: ${objectName}`);

      randomBuffer ??= Buffer.from(crypto.randomBytes(partSize));

      const writable = minioClient.putObject(
        bucketName,
        objectName,
        randomBuffer,
        randomBuffer.length
      );
      const partUploadResponse = await writable;
      console.debug(
        ` - part uploaded (%o bytes): %o`,
        randomBuffer.length,
        partUploadResponse
      );
    }
  }
} else {
  console.log(
    `Composing ${partCount} parts into single object: ${mergedObjectName}`
  );

  const destOption = new Minio.CopyDestinationOptions({
    Bucket: bucketName,
    Object: mergedObjectName,
    MetadataDirective: "REPLACE",
  });

  const res = await minioClient.composeObject(
    destOption,
    Array.from(
      { length: partCount },
      (_, v) =>
        new Minio.CopySourceOptions({
          Bucket: bucketName,
          Object: generateObjectName(v),
        })
    )
  );

  console.debug(`Compose object response: %O`, res);
}
