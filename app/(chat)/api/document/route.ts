import { BlockKind } from '@/components/block';
import {
  deleteDocumentsByIdAfterTimestamp,
  getDocumentsById,
  getUserByClerkId,
  saveDocument,
} from '@/lib/db/queries';
import { auth } from '@clerk/nextjs/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return new Response('Missing id', { status: 400 });
  }

  const session = await auth();

  if (!session || !session.userId) {
    return new Response('Unauthorized', { status: 401 });
  }

  const [user] = await getUserByClerkId(session.userId)

  const documents = await getDocumentsById({ id });

  const [document] = documents;

  if (!document) {
    return new Response('Not Found', { status: 404 });
  }

  if (document.userId !== user.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  return Response.json(documents, { status: 200 });
}

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return new Response('Missing id', { status: 400 });
  }

  const session = await auth();

  if (!session.userId) {
    return new Response('Unauthorized', { status: 401 });
  }

  const [user] = await getUserByClerkId(session.userId)


  const {
    content,
    title,
    kind,
  }: { content: string; title: string; kind: BlockKind } = await request.json();

  if (session.userId) {
    const document = await saveDocument({
      id,
      content,
      title,
      kind,
      userId: user.id,
    });

    return Response.json(document, { status: 200 });
  }
  return new Response('Unauthorized', { status: 401 });
}

export async function PATCH(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  const { timestamp }: { timestamp: string } = await request.json();

  if (!id) {
    return new Response('Missing id', { status: 400 });
  }

  const session = await auth();

  if (!session || !session.userId) {
    return new Response('Unauthorized', { status: 401 });
  }
  

  const documents = await getDocumentsById({ id });

  const [document] = documents;

  if (document.userId !== session.userId) {
    return new Response('Unauthorized', { status: 401 });
  }

  await deleteDocumentsByIdAfterTimestamp({
    id,
    timestamp: new Date(timestamp),
  });

  return new Response('Deleted', { status: 200 });
}