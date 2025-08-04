'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Upload, FileImage, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface UploadStatus {
  status: 'idle' | 'uploading' | 'processing' | 'success' | 'error'
  message?: string
  data?: any
}

export function ReceiptUploadForm() {
  const router = useRouter()
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>({ status: 'idle' })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      setSelectedFile(file)
      setUploadStatus({ status: 'idle' })
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp']
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024, // 5MB
  })

  const handleUpload = async () => {
    if (!selectedFile) return

    setUploadStatus({ status: 'uploading', message: 'Uploading image...' })

    try {
      // Create FormData for file upload
      const formData = new FormData()
      formData.append('receipt', selectedFile)

      const response = await fetch('/api/receipts/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Failed to upload receipt')
      }

      setUploadStatus({ status: 'processing', message: 'Processing receipt with OCR...' })

      const result = await response.json()

      setUploadStatus({ 
        status: 'success', 
        message: 'Receipt processed successfully!',
        data: result
      })

      // Redirect to receipts page after a short delay
      setTimeout(() => {
        router.push('/receipts')
      }, 2000)

    } catch (error) {
      console.error('Upload error:', error)
      setUploadStatus({ 
        status: 'error', 
        message: 'Failed to process receipt. Please try again.' 
      })
    }
  }

  const resetUpload = () => {
    setSelectedFile(null)
    setUploadStatus({ status: 'idle' })
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Upload Receipt</CardTitle>
          <CardDescription>
            Upload an image of your grocery receipt to automatically extract and organize the data
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* File Upload Area */}
          <div
            {...getRootProps()}
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
              isDragActive ? "border-blue-400 bg-blue-50" : "border-gray-300",
              selectedFile ? "border-green-400 bg-green-50" : ""
            )}
          >
            <input {...getInputProps()} />
            
            {selectedFile ? (
              <div className="space-y-4">
                <FileImage className="mx-auto h-12 w-12 text-green-600" />
                <div>
                  <p className="text-lg font-medium text-green-700">File Selected</p>
                  <p className="text-sm text-gray-600">{selectedFile.name}</p>
                  <p className="text-xs text-gray-500">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={resetUpload}>
                  Choose Different File
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div>
                  <p className="text-lg font-medium">
                    {isDragActive ? "Drop your receipt here" : "Upload receipt image"}
                  </p>
                  <p className="text-sm text-gray-500">
                    Drag and drop your receipt image, or click to browse
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    Supports PNG, JPG, JPEG, WebP (max 5MB)
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Upload Status */}
          {uploadStatus.status !== 'idle' && (
            <div className="mt-6">
              <Card className={cn(
                "border-l-4",
                uploadStatus.status === 'success' ? "border-l-green-500 bg-green-50" :
                uploadStatus.status === 'error' ? "border-l-red-500 bg-red-50" :
                "border-l-blue-500 bg-blue-50"
              )}>
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-3">
                    {uploadStatus.status === 'uploading' || uploadStatus.status === 'processing' ? (
                      <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                    ) : uploadStatus.status === 'success' ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    )}
                    
                    <div>
                      <p className={cn(
                        "font-medium",
                        uploadStatus.status === 'success' ? "text-green-800" :
                        uploadStatus.status === 'error' ? "text-red-800" :
                        "text-blue-800"
                      )}>
                        {uploadStatus.message}
                      </p>
                      
                      {uploadStatus.status === 'success' && uploadStatus.data && (
                        <p className="text-sm text-gray-600 mt-1">
                          Processed {uploadStatus.data.itemsCount} items from {uploadStatus.data.vendor}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-6 flex justify-end space-x-3">
            <Button variant="outline" onClick={() => router.push('/receipts')}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpload}
              disabled={!selectedFile || uploadStatus.status === 'uploading' || uploadStatus.status === 'processing'}
            >
              {uploadStatus.status === 'uploading' || uploadStatus.status === 'processing' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Process Receipt'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tips for Better Results</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="text-sm text-gray-600 space-y-2">
            <li>• Ensure the receipt is well-lit and clearly visible</li>
            <li>• Avoid shadows, glare, or blurry images</li>
            <li>• Include the entire receipt including vendor name and date</li>
            <li>• Make sure text is straight and not at an angle</li>
            <li>• Higher resolution images provide better OCR accuracy</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}