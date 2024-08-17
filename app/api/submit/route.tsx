import { NextRequest, NextResponse } from 'next/server';
import { Storage } from '@google-cloud/storage';
import multer from 'multer';
import { Readable } from 'stream';
import { promisify } from 'util';

const storage = new Storage({ projectId: process.env.GCLOUD_PROJECT });
const bucket = storage.bucket(process.env.GCLOUD_BUCKET_NAME!);

const upload = multer({
  storage: multer.memoryStorage(),
});

export const config = {
  api: {
    bodyParser: false,
  },
};

const pipeline = promisify(Readable.pipeline);

export async function POST(req: NextRequest) {
  return new Promise((resolve, reject) => {
    upload.single('file')(req as any, {} as any, async (err: any) => {
      if (err) {
        return resolve(NextResponse.json({ error: 'File upload failed.' }, { status: 500 }));
      }

      const { name, email } = req.body as unknown as { name: string; email: string };
      const file = (req as any).file;

      if (file) {
        const blob = bucket.file(file.originalname);
        const blobStream = blob.createWriteStream({
          resumable: false,
        });

        try {
          await pipeline(Readable.from(file.buffer), blobStream);
          return resolve(NextResponse.json({ message: 'Submission successful!' }));
        } catch (error) {
          return resolve(NextResponse.json({ error: 'File upload to Google Cloud failed.' }, { status: 500 }));
        }
      }

      return resolve(NextResponse.json({ error: 'No file uploaded.' }, { status: 400 }));
    });
  });
}
