import { supabase } from '@/integrations/supabase/client'

export interface FileLoadResult {
  url: string | null
  error: string | null
  success: boolean
}

/**
 * Extracts the storage path from a full URL or returns the path as-is
 */
export function extractStoragePath(filePath: string): string {
  console.log('[fileUtils] Original file path:', filePath)
  
  // If it's not a URL, assume it's already a storage path
  if (!filePath.startsWith('http')) {
    console.log('[fileUtils] Path is not a URL, returning as-is:', filePath)
    return filePath
  }
  
  try {
    const url = new URL(filePath)
    const pathParts = url.pathname.split('/').filter(part => part.length > 0)
    
    console.log('[fileUtils] URL path parts:', pathParts)
    
    // Look for the bucket name in the path
    const bucketIndex = pathParts.findIndex(part => part === 'student-files')
    
    if (bucketIndex !== -1 && bucketIndex < pathParts.length - 1) {
      // Extract everything after the bucket name
      const storagePath = pathParts.slice(bucketIndex + 1).join('/')
      const decodedPath = decodeURIComponent(storagePath)
      console.log('[fileUtils] Extracted storage path:', decodedPath)
      return decodedPath
    }
    
    // Fallback: try to get the last significant part of the path
    // Look for patterns like /object/public/student-files/...
    const publicIndex = pathParts.findIndex(part => part === 'public')
    if (publicIndex !== -1 && publicIndex < pathParts.length - 2) {
      const bucketAfterPublic = pathParts[publicIndex + 1]
      if (bucketAfterPublic === 'student-files') {
        const storagePath = pathParts.slice(publicIndex + 2).join('/')
        const decodedPath = decodeURIComponent(storagePath)
        console.log('[fileUtils] Extracted storage path (public pattern):', decodedPath)
        return decodedPath
      }
    }
    
    // Another fallback: just take the filename
    const lastPart = pathParts[pathParts.length - 1]
    const decodedPath = decodeURIComponent(lastPart)
    console.log('[fileUtils] Fallback storage path (filename only):', decodedPath)
    return decodedPath
    
  } catch (error) {
    console.error('[fileUtils] Error parsing file path:', error)
    return filePath
  }
}

/**
 * Attempts to get a file URL with multiple fallback strategies
 */
export async function getFileUrl(filePath: string, expiresInSeconds: number = 3600): Promise<FileLoadResult> {
  const storagePath = extractStoragePath(filePath)
  console.log('[fileUtils] Getting file URL for storage path:', storagePath)
  
  try {
    // Strategy 1: Try to create a signed URL
    const { data: signedData, error: signedError } = await supabase.storage
      .from('student-files')
      .createSignedUrl(storagePath, expiresInSeconds)
    
    if (!signedError && signedData?.signedUrl) {
      console.log('[fileUtils] Successfully created signed URL')
      
      // Test if the URL is accessible
      try {
        const testResponse = await fetch(signedData.signedUrl, { 
          method: 'HEAD',
          mode: 'cors'
        })
        
        if (testResponse.ok) {
          return {
            url: signedData.signedUrl,
            error: null,
            success: true
          }
        } else {
          console.warn('[fileUtils] Signed URL not accessible, status:', testResponse.status)
        }
      } catch (fetchError) {
        console.warn('[fileUtils] Signed URL fetch test failed:', fetchError)
      }
    } else {
      console.warn('[fileUtils] Failed to create signed URL:', signedError?.message)
    }
    
    // Strategy 2: Try public URL
    const { data: publicData } = supabase.storage
      .from('student-files')
      .getPublicUrl(storagePath)
    
    if (publicData?.publicUrl) {
      console.log('[fileUtils] Using public URL')
      
      // Test if the public URL is accessible
      try {
        const testResponse = await fetch(publicData.publicUrl, { 
          method: 'HEAD',
          mode: 'cors' 
        })
        
        if (testResponse.ok) {
          return {
            url: publicData.publicUrl,
            error: null,
            success: true
          }
        } else {
          console.warn('[fileUtils] Public URL not accessible, status:', testResponse.status)
        }
      } catch (fetchError) {
        console.warn('[fileUtils] Public URL fetch test failed:', fetchError)
      }
    }
    
    // Strategy 3: Try alternative path formats
    const altPaths = [
      `student_files/${storagePath}`, // Alternative naming
      storagePath.replace(/^student_files\//, ''), // Remove prefix if exists
      storagePath.replace(/^.*\//, ''), // Just filename
    ].filter(path => path !== storagePath) // Remove duplicates
    
    for (const altPath of altPaths) {
      console.log('[fileUtils] Trying alternative path:', altPath)
      
      const { data: altSignedData, error: altSignedError } = await supabase.storage
        .from('student-files')
        .createSignedUrl(altPath, expiresInSeconds)
      
      if (!altSignedError && altSignedData?.signedUrl) {
        try {
          const testResponse = await fetch(altSignedData.signedUrl, { 
            method: 'HEAD',
            mode: 'cors'
          })
          
          if (testResponse.ok) {
            console.log('[fileUtils] Alternative path worked:', altPath)
            return {
              url: altSignedData.signedUrl,
              error: null,
              success: true
            }
          }
        } catch (fetchError) {
          console.warn('[fileUtils] Alternative path fetch test failed:', fetchError)
        }
      }
    }
    
    return {
      url: null,
      error: 'Unable to access file. The file may have been moved or deleted.',
      success: false
    }
    
  } catch (error) {
    console.error('[fileUtils] Error in getFileUrl:', error)
    return {
      url: null,
      error: `File access error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      success: false
    }
  }
}

/**
 * Downloads a file with proper error handling
 */
export async function downloadFile(filePath: string, fileName: string): Promise<boolean> {
  try {
    const result = await getFileUrl(filePath, 300) // Shorter expiry for downloads
    
    if (!result.success || !result.url) {
      console.error('[fileUtils] Cannot download file:', result.error)
      return false
    }
    
    try {
      const response = await fetch(result.url, {
        method: 'GET',
        headers: {
          'Accept': '*/*',
          'Cache-Control': 'no-cache'
        },
        mode: 'cors'
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const blob = await response.blob()
      const blobUrl = URL.createObjectURL(blob)
      
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = fileName
      a.style.display = 'none'
      a.target = '_blank'
      a.rel = 'noopener noreferrer'
      
      document.body.appendChild(a)
      a.click()
      
      setTimeout(() => {
        document.body.removeChild(a)
        URL.revokeObjectURL(blobUrl)
      }, 100)
      
      console.log('[fileUtils] Download completed successfully')
      return true
      
    } catch (fetchError) {
      console.warn('[fileUtils] Fetch failed, trying direct link:', fetchError)
      // Fallback: open in new tab
      window.open(result.url, '_blank', 'noopener,noreferrer')
      return true
    }
    
  } catch (error) {
    console.error('[fileUtils] Download failed:', error)
    return false
  }
}

/**
 * Gets file category for rendering appropriate preview
 */
export function getFileCategory(type: string): string {
  // Normalize the type - handle both extensions and MIME types
  let normalizedType = type.toLowerCase().trim()
  
  // Handle MIME types (e.g., "image/png", "IMAGE/PNG")
  if (normalizedType.includes('/')) {
    const parts = normalizedType.split('/')
    if (parts.length >= 2) {
      const mimeType = parts[0]
      const subType = parts[1]
      
      // Map MIME types to categories
      switch (mimeType) {
        case 'image':
          return 'image'
        case 'video':
          return 'video'
        case 'audio':
          return 'audio'
        case 'application':
          // Handle specific application types
          if (subType === 'pdf') return 'pdf'
          if (['msword', 'vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(subType)) return 'office'
          if (['vnd.ms-excel', 'vnd.openxmlformats-officedocument.spreadsheetml.sheet'].includes(subType)) return 'office'
          if (['vnd.ms-powerpoint', 'vnd.openxmlformats-officedocument.presentationml.presentation'].includes(subType)) return 'office'
          if (['zip', 'x-rar-compressed', 'x-7z-compressed'].includes(subType)) return 'other'
          if (['json', 'xml'].includes(subType)) return 'text'
          break
        case 'text':
          return 'text'
      }
      
      // Also check the subtype as extension
      normalizedType = subType
    }
  }
  
  // Remove any dots from extensions
  normalizedType = normalizedType.replace(/^\.+/, '')
  
  // Check by extension
  if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp', 'tiff', 'ico'].includes(normalizedType)) return 'image'
  if (['mp4', 'avi', 'mov', 'webm', 'mkv', 'flv', 'wmv', 'm4v'].includes(normalizedType)) return 'video'
  if (['mp3', 'wav', 'flac', 'ogg', 'aac', 'm4a', 'wma'].includes(normalizedType)) return 'audio'
  if (['pdf'].includes(normalizedType)) return 'pdf'
  if (['txt', 'md', 'markdown', 'json', 'xml', 'csv', 'log', 'rtf'].includes(normalizedType)) return 'text'
  if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'odt', 'ods', 'odp'].includes(normalizedType)) return 'office'
  
  return 'other'
} 