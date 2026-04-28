export const uploadImageChunks = async (
  file: File,
  token: string,
): Promise<string> => {
  const CHUNK_SIZE = 512 * 1024; // 512KB
  if (file.size <= CHUNK_SIZE) {
    // normal upload
    const formDataUpload = new FormData();
    formDataUpload.append("image", file);
    const res = await fetch("/api/upload", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formDataUpload,
    });
    if (!res.ok) throw new Error(`Ошибка при загрузке ${file.name}`);
    const data = await res.json();
    return data.url;
  }

  // chunked upload
  const uploadId =
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

  const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  };

  let finalUrl = "";
  for (let i = 0; i < totalChunks; i++) {
    const start = i * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, file.size);
    const chunk = file.slice(start, end);
    const arrayBuffer = await chunk.arrayBuffer();
    const base64Chunk = arrayBufferToBase64(arrayBuffer);

    const res = await fetch("/api/upload/chunk", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        uploadId,
        chunkIndex: i,
        totalChunks,
        chunkData: base64Chunk,
        filename: file.name,
      }),
    });

    if (!res.ok)
      throw new Error(
        `Ошибка при загрузке части ${i + 1}/${totalChunks} для ${file.name}`,
      );
    const data = await res.json();
    if (data.url) finalUrl = data.url;
  }
  return finalUrl;
};
