const prepared = new WeakMap<File, Promise<File>>()

// Keep original resolution. Lossless compression is optional and never blocks upload.
// Larger files bypass the serverless request limit and upload directly as before.
export function prepareImageUpload(file: File): Promise<File> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 4 * 1024 * 1024 || file.size < 32 * 1024) return Promise.resolve(file)
  const existing = prepared.get(file)
  if (existing) return existing
  const task = (async () => {
    try {
      const response = await fetch('/api/media/prepare', { method: 'POST', headers: { 'Content-Type': file.type }, body: file, signal: AbortSignal.timeout(20_000) })
      if (!response.ok || response.status === 204) return file
      const blob = await response.blob()
      if (blob.type !== 'image/webp' || !blob.size || blob.size >= file.size) return file
      return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.webp', { type: blob.type, lastModified: file.lastModified })
    } catch { return file }
  })()
  prepared.set(file, task)
  return task
}
