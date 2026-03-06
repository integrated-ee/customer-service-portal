import { BlobServiceClient, BlobSASPermissions } from '@azure/storage-blob';

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING!;
const containerName = 'ticket-attachments';

function getBlobServiceClient() {
  return BlobServiceClient.fromConnectionString(connectionString);
}

export async function uploadFile(
  ticketNo: string,
  lineNo: number,
  fileName: string,
  buffer: Buffer,
  contentType: string
): Promise<string> {
  const blobServiceClient = getBlobServiceClient();
  const containerClient = blobServiceClient.getContainerClient(containerName);
  const blobPath = `${ticketNo}/${lineNo}/${fileName}`;
  const blockBlobClient = containerClient.getBlockBlobClient(blobPath);

  await blockBlobClient.upload(buffer, buffer.length, {
    blobHTTPHeaders: { blobContentType: contentType },
  });

  return blockBlobClient.url;
}

export async function getFileUrl(ticketNo: string, lineNo: number, fileName: string): Promise<string> {
  const blobServiceClient = getBlobServiceClient();
  const containerClient = blobServiceClient.getContainerClient(containerName);
  const blobPath = `${ticketNo}/${lineNo}/${fileName}`;
  const blockBlobClient = containerClient.getBlockBlobClient(blobPath);

  const sasUrl = await blockBlobClient.generateSasUrl({
    permissions: BlobSASPermissions.parse('r'),
    expiresOn: new Date(Date.now() + 3600 * 1000),
  });

  return sasUrl;
}
