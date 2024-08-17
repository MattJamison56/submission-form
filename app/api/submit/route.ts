import { NextResponse } from 'next/server';
import { Storage } from '@google-cloud/storage';
import { Readable } from 'stream';
import { promisify } from 'util';

// Initialize Google Cloud Storage
const storage = new Storage({ projectId: process.env.GCLOUD_PROJECT });
const bucket = storage.bucket(process.env.GCLOUD_BUCKET_NAME!);

export const runtime = 'nodejs';

const pipeline = promisify(Readable.pipeline);

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
    }

    // Manual conversion of ReadableStream to Node.js Readable stream
    const reader = file.stream().getReader();
    const nodeStream = new Readable({
      async read() {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            this.push(null);
            break;
          }
          this.push(Buffer.from(value));
        }
      },
    });

    const blob = bucket.file(file.name);
    const blobStream = blob.createWriteStream({
      resumable: false,
    });

    nodeStream.pipe(blobStream);

    return new Promise((resolve, reject) => {
      blobStream.on('finish', () => {
        resolve(NextResponse.json({ message: 'Submission successful!' }));
      });

      blobStream.on('error', (err) => {
        reject(NextResponse.json({ error: 'File upload to Google Cloud failed.' }, { status: 500 }));
      });
    });
  } catch (error) {
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}
