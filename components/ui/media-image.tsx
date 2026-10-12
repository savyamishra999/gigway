"use client"

import { useState, type ImgHTMLAttributes } from 'react'
import { IMAGE_WIDTHS, imageVariantUrl } from '@/lib/media/image-policy'

type Props = ImgHTMLAttributes<HTMLImageElement> & { original?: boolean }
export function MediaImage({ src, original = false, sizes = '(max-width: 768px) 100vw, 1024px', onError, loading = 'lazy', decoding = 'async', ...props }: Props) {
  const [failed, setFailed] = useState<string | null>(null)
  const optimize = !!src && !original && failed !== src && !!imageVariantUrl(src, 384)
  // srcSet is present on the first render; never fetch original then replace in an effect.
  return <img {...props} loading={loading} decoding={decoding}
    src={optimize ? imageVariantUrl(src!, 1280)! : src}
    srcSet={optimize ? IMAGE_WIDTHS.map(width => `${imageVariantUrl(src!, width)} ${width}w`).join(', ') : props.srcSet}
    sizes={sizes}
    onError={event => { if (optimize) setFailed(src!); else onError?.(event) }} />
}
