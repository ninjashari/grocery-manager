import { ReceiptUploadForm } from '@/components/receipts/ReceiptUploadForm'

export default function ReceiptUploadPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Upload Receipt</h1>
        <p className="text-gray-600 mt-2">
          Process your grocery receipt automatically with smart OCR technology
        </p>
      </div>
      
      <ReceiptUploadForm />
    </div>
  )
}