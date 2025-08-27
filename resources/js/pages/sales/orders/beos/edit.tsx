import React from 'react'
import { Head, useForm, usePage, Link, router } from '@inertiajs/react'
import AppLayout from '@/layouts/app-layout'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Megaphone, Upload, X, Download, Image } from 'lucide-react'
import { route } from 'ziggy-js'
import { type BreadcrumbItem } from '@/types'

interface User {
  id: number
  name: string
}

interface Department {
  id: number
  name: string
  users: User[]
  packages: Package[]
}

interface Package {
  id: number
  name: string
}

interface BeoAttachment {
  id: number
  beo_id: number
  file_name: string
  file_name_url?: string
  created_at: string
}

interface BeoRow {
  id?: number
  department_id: number | null
  package_id: number | null
  user_id: number | null
  notes: string
  existing_attachments: BeoAttachment[]
}

interface PageProps {
  order: { id: number; event_name: string }
  departments: Department[]
  beos: BeoRow[]
  flash?: { message?: string }
}

interface BeoForm {
  beos: BeoRow[]
}

export default function Edit() {
  const { order, departments, beos, flash = {} } = usePage<PageProps>().props
  const { data, setData, processing, errors } = useForm<BeoForm>({
    beos: beos.map(beo => ({
      id: beo.id,
      department_id: beo.department_id,
      package_id: beo.package_id,
      user_id: beo.user_id,
      notes: beo.notes || '',
      existing_attachments: beo.existing_attachments || []
    }))
  })

  const [newAttachments, setNewAttachments] = React.useState<Record<number, File[]>>({})
  const [attachmentsToDelete, setAttachmentsToDelete] = React.useState<number[]>([])

  const updateRow = (idx: number, updates: Partial<BeoRow>) => {
    const newEntries = data.beos.map((row, i) =>
      i === idx ? { ...row, ...updates } : row
    )
    setData('beos', newEntries)
  }

  const validateFiles = (files: File[]) => {
    const maxFileSize = 10 * 1024 * 1024; // 10MB
    // Strict image-only validation
    const allowedTypes = [
      'image/jpeg', 
      'image/jpg', 
      'image/png', 
      'image/webp', 
      'image/gif'
    ];
    
    return files.filter(file => {
      // Check file size
      if (file.size > maxFileSize) {
        alert(`Image "${file.name}" is too large. Maximum size is 10MB.`);
        return false;
      }
      
      // Strict MIME type validation
      if (!allowedTypes.includes(file.type.toLowerCase())) {
        alert(`File "${file.name}" is not a valid image format. Only JPEG, PNG, WebP, and GIF images are allowed.`);
        return false;
      }
      
      // Additional file extension check as backup
      const fileExtension = file.name.toLowerCase().split('.').pop();
      const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
      if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
        alert(`File "${file.name}" has an invalid extension. Only image files are allowed.`);
        return false;
      }
      
      return true;
    });
  };

  const handleFileChange = (idx: number, files: FileList | null) => {
    if (files) {
      const fileArray = Array.from(files);
      const validFiles = validateFiles(fileArray);
      
      if (validFiles.length > 0) {
        setNewAttachments(prev => ({
          ...prev,
          [idx]: [...(prev[idx] || []), ...validFiles]
        }));
      }
      
      // Clear the input
      const input = document.querySelector(`input[type="file"]`) as HTMLInputElement;
      if (input) input.value = '';
    }
  }

  const removeNewAttachment = (idx: number, fileIdx: number) => {
    setNewAttachments(prev => ({
      ...prev,
      [idx]: (prev[idx] || []).filter((_, i) => i !== fileIdx)
    }))
  }

  const removeExistingAttachment = (idx: number, attachmentId: number) => {
    setAttachmentsToDelete(prev => [...prev, attachmentId])
    
    const updatedRow = { 
      ...data.beos[idx], 
      existing_attachments: data.beos[idx].existing_attachments.filter(att => att.id !== attachmentId)
    }
    updateRow(idx, updatedRow)
  }

  const getImagePreview = (file: File) => {
    return URL.createObjectURL(file);
  };

  const formatFileSize = (bytes: number) => {
    return (bytes / 1024 / 1024).toFixed(2);
  };

  const isImageFile = (filename: string) => {
    const ext = filename.toLowerCase().split('.').pop();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '');
  };

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    const formData = new FormData()
    
    data.beos.forEach((entry, index) => {
      formData.append(`beos[${index}][id]`, entry.id?.toString() || '')
      formData.append(`beos[${index}][department_id]`, entry.department_id?.toString() || '')
      formData.append(`beos[${index}][package_id]`, entry.package_id?.toString() || '')
      formData.append(`beos[${index}][user_id]`, entry.user_id?.toString() || '')
      formData.append(`beos[${index}][notes]`, entry.notes || '')
    })
    
    Object.keys(newAttachments).forEach((indexStr) => {
      const index = parseInt(indexStr)
      const files = newAttachments[index]
      if (files && files.length > 0) {
        files.forEach((file) => {
          formData.append(`new_attachments[${index}][]`, file)
        })
      }
    })
    
    attachmentsToDelete.forEach((attachmentId, index) => {
      formData.append(`delete_attachments[${index}]`, attachmentId.toString())
    })
    
    formData.append('_method', 'PUT')
    
    router.post(route('sales.orders.beos.update', order.id), formData, {
      onSuccess: () => {
        router.visit(route('sales.orders.show', order.id))
      },
      onError: (errors) => {
        console.error('Update errors:', errors)
      }
    })
  }

  const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Orders', href: route('sales.orders.index') },
    { title: order.event_name, href: route('sales.orders.show', order.id) },
    { title: 'Edit BEO', href: '#' },
  ]

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Edit Assignments" />

      {flash.message && (
        <Alert className="mb-4">
          <Megaphone className="h-4 w-4" />
          <AlertTitle>Notice</AlertTitle>
          <AlertDescription>{flash.message}</AlertDescription>
        </Alert>
      )}

      <div className="mb-6 px-4 pt-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-blue-900 mb-2">
            Edit Existing BEO Assignments
          </h2>
          <p className="text-blue-700 text-sm">
            You are editing {data.beos.length} existing BEO assignment{data.beos.length !== 1 ? 's' : ''} for <strong>{order.event_name}</strong>. 
            Make your changes below and click "Update All Assignments" to save.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 px-4 pb-6">
        {data.beos.map((row, idx) => {
          const usersForDept = departments.find(d => d.id === row.department_id)?.users ?? []
          const packagesForDept = departments.find(d => d.id === row.department_id)?.packages ?? []

          return (
            <div key={row.id || idx} className="border rounded-lg p-4 space-y-4 bg-white shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-900 flex items-center space-x-2">
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-semibold">
                    BEO #{row.id || idx + 1}
                  </span>
                  <span className="text-gray-600">Assignment {idx + 1} of {data.beos.length}</span>
                </h3>
              </div>

              <div className="grid grid-cols-12 gap-4 items-end">
                <div className="col-span-4">
                  <Label>Department</Label>
                  <select
                    value={row.department_id ?? ''}
                    onChange={e =>
                      updateRow(idx, {
                        department_id: e.target.value ? Number(e.target.value) : null,
                        user_id: null,
                        package_id: null,
                      })
                    }
                    className="mt-1 block w-full border px-2 py-1 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">— Select Department —</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                  {errors[`beos.${idx}.department_id`] && (
                    <p className="text-red-600 text-sm mt-1">
                      {errors[`beos.${idx}.department_id`]}
                    </p>
                  )}
                </div>

                <div className="col-span-4">
                  <Label>Package</Label>
                  <select
                    value={row.package_id ?? ''}
                    onChange={e =>
                      updateRow(idx, {
                        package_id: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                    disabled={!row.department_id}
                    className="mt-1 block w-full border px-2 py-1 rounded bg-white disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">— Select Package —</option>
                    {packagesForDept.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  {!row.department_id && (
                    <p className="text-gray-500 text-xs mt-1">Select a department first</p>
                  )}
                  {errors[`beos.${idx}.package_id`] && (
                    <p className="text-red-600 text-sm mt-1">
                      {errors[`beos.${idx}.package_id`]}
                    </p>
                  )}
                </div>

                <div className="col-span-4">
                  <Label>Person In Charge</Label>
                  <select
                    value={row.user_id ?? ''}
                    onChange={e =>
                      updateRow(idx, {
                        user_id: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                    disabled={!row.department_id}
                    className="mt-1 block w-full border px-2 py-1 rounded bg-white disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">— Select Person —</option>
                    {usersForDept.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                  {!row.department_id && (
                    <p className="text-gray-500 text-xs mt-1">Select a department first</p>
                  )}
                  {errors[`beos.${idx}.user_id`] && (
                    <p className="text-red-600 text-sm mt-1">
                      {errors[`beos.${idx}.user_id`]}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <Label>Notes</Label>
                <Textarea
                  rows={3}
                  value={row.notes}
                  onChange={e => updateRow(idx, { notes: e.target.value })}
                  placeholder="Add any special notes or instructions..."
                  className="mt-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {errors[`beos.${idx}.notes`] && (
                  <p className="text-red-600 text-sm mt-1">
                    {errors[`beos.${idx}.notes`]}
                  </p>
                )}
              </div>

              {/* Existing Attachments */}
              {row.existing_attachments && row.existing_attachments.length > 0 && (
                <div>
                  <Label>Current Images ({row.existing_attachments.length})</Label>
                  <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {row.existing_attachments.map((attachment) => (
                      <div key={attachment.id} className="relative group">
                        <div className="aspect-square rounded-lg overflow-hidden border-2 border-gray-200 bg-gray-50">
                          {isImageFile(attachment.file_name) && attachment.file_name_url ? (
                            <img
                              src={attachment.file_name_url}
                              alt={attachment.file_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-100">
                              <Image className="h-8 w-8 text-gray-400" />
                            </div>
                          )}
                        </div>
                        
                        {/* File Info Overlay */}
                        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white p-2 rounded-b-lg">
                          <p className="text-xs truncate font-medium">{attachment.file_name}</p>
                          <p className="text-xs text-gray-300">
                            {new Date(attachment.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        
                        {/* Remove Button */}
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => removeExistingAttachment(idx, attachment.id)}
                          className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Remove this image"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                        
                        {/* Download Link */}
                        <a 
                          href={attachment.file_name_url || `/storage/beo-attachments/${attachment.file_name}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="absolute top-2 left-2 bg-black bg-opacity-70 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                          title="View full size"
                        >
                          <Download className="h-3 w-3" />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add New Images */}
              <div>
                <Label className="flex items-center gap-2">
                  <Image className="h-4 w-4" />
                  Add New Images
                </Label>
                <div className="mt-2 space-y-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="file"
                      multiple
                      accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                      onChange={(e) => handleFileChange(idx, e.target.files)}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-green-50 file:text-green-700 hover:file:bg-green-100 focus:outline-none"
                    />
                    <Upload className="h-4 w-4 text-gray-400" />
                  </div>
                  
                  <p className="text-xs text-muted-foreground">
                    <strong>Images only:</strong> JPEG, PNG, WebP, GIF formats supported (Max: 10MB each)
                  </p>
                  
                  {newAttachments[idx] && newAttachments[idx].length > 0 && (
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-green-700">New images to upload ({newAttachments[idx].length}):</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                        {newAttachments[idx].map((file, fileIdx) => (
                          <div key={fileIdx} className="relative group">
                            <div className="aspect-square rounded-lg overflow-hidden border-2 border-green-200 bg-gray-50">
                              <img
                                src={getImagePreview(file)}
                                alt={file.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            
                            {/* File Info Overlay */}
                            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white p-1 rounded-b-lg">
                              <p className="text-xs truncate font-medium">{file.name}</p>
                              <p className="text-xs text-gray-300">
                                {formatFileSize(file.size)} MB
                              </p>
                            </div>
                            
                            {/* Remove Button */}
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => removeNewAttachment(idx, fileIdx)}
                              className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Remove this image"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Empty State */}
                  {(!newAttachments[idx] || newAttachments[idx].length === 0) && (
                    <div className="text-center py-4 border-2 border-dashed border-gray-300 rounded-lg">
                      <Image className="mx-auto h-6 w-6 text-gray-400" />
                      <p className="mt-1 text-sm text-gray-500">No new images selected</p>
                      <p className="text-xs text-gray-400">Only image files are accepted</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}

        <div className="flex justify-between pt-6 border-t bg-gray-50 px-4 py-4 -mx-4">
          <Link
            href={route('sales.orders.show', order.id)}
            className="text-gray-600 hover:text-gray-800 underline font-medium"
          >
            ← Back to BEO List
          </Link>
          <Button 
            type="submit" 
            disabled={processing}
            className="px-6 py-2"
          >
            {processing ? 'Updating…' : 'Update All Assignments'}
          </Button>
        </div>
      </form>
    </AppLayout>
  )
}