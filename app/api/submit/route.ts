import { NextResponse } from 'next/server';
import { Storage } from '@google-cloud/storage';
import { Readable } from 'stream';

const storage = new Storage({
  projectId: process.env.GCLOUD_PROJECT,
  credentials: {
    client_email: process.env.GCLOUD_CLIENT_EMAIL,
    private_key: process.env.GCLOUD_PRIVATE_KEY!.replace(/\\n/g, '\n'), // Replace escaped newlines with actual newlines
  },
});
const bucket = storage.bucket(process.env.GCLOUD_BUCKET_NAME!);

export const runtime = 'nodejs';

export async function POST(req: Request): Promise<Response> {
  try {
    console.log('Processing file upload request...');
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      console.error('No file uploaded.');
      return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
    }

    console.log('Received file:', file.name);

    // Convert the file stream from the browser to a Node.js readable stream
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
    console.log('Creating write stream to Google Cloud Storage...');
    const blobStream = blob.createWriteStream({
      resumable: false,
    });

    return new Promise<Response>((resolve, reject) => {
      nodeStream.pipe(blobStream);

      blobStream.on('finish', () => {
        console.log('File uploaded successfully to Google Cloud Storage.');
        resolve(NextResponse.json({ message: 'Submission successful!' }));
      });

      blobStream.on('error', (err) => {
        console.error('Error uploading file to Google Cloud Storage:', err);
        reject(NextResponse.json({ error: 'File upload to Google Cloud failed.' }, { status: 500 }));
      });
    });
  } catch (error) {
    console.error('Unexpected error occurred:', error);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}
