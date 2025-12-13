export function getFileExtension(uri: string) {
  const clean = uri.split('?')[0] ?? uri
  const parts = clean.split('.')
  if (parts.length < 2) return null
  const ext = parts[parts.length - 1]?.toLowerCase()
  return ext || null
}

export function getMimeTypeFromExtension(ext: string | null) {
  switch (ext) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg'
    case 'png':
      return 'image/png'
    case 'webp':
      return 'image/webp'
    case 'heic':
      return 'image/heic'
    default:
      return 'application/octet-stream'
  }
}
