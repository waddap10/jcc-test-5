import React, { useState } from 'react';
import { Head, useForm, usePage, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Upload, X, Image, Trash2 } from 'lucide-react';

interface Order {
    id: number;
    event_name: string;
    custom_code: string;
}

interface OrderAttachment {
    id: number;
    file_name: string;
    file_name_url: string;
    created_at: string;
}

interface PageProps {
    order: Order;
    attachments: OrderAttachment[];
    flash?: { message?: string };
    errors: Record<string, string>;
}

export default function OrderAttachmentEdit() {
    const { order, attachments, flash, errors } = usePage<PageProps>().props;
    
    const { processing } = useForm();
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [deleteAttachments, setDeleteAttachments] = useState<number[]>([]);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Orders', href: route('sales.orders.index') },
        { title: order.event_name, href: route('sales.orders.show', order.id) },
        { title: 'Edit Images', href: '#' },
    ];

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

    const handleFileChange = (files: FileList | null) => {
        if (files) {
            const fileArray = Array.from(files);
            const validFiles = validateFiles(fileArray);
            
            if (validFiles.length > 0) {
                setSelectedFiles(prev => [...prev, ...validFiles]);
            }
            
            // Clear the input
            const input = document.querySelector('input[type="file"]') as HTMLInputElement;
            if (input) input.value = '';
        }
    };

    const removeNewFile = (index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const toggleDeleteAttachment = (attachmentId: number) => {
        setDeleteAttachments(prev => 
            prev.includes(attachmentId)
                ? prev.filter(id => id !== attachmentId)
                : [...prev, attachmentId]
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        const formData = new FormData();
        
        // Add new attachments
        selectedFiles.forEach((file) => {
            formData.append('attachments[]', file);
        });
        
        // Add attachments to delete
        deleteAttachments.forEach((id) => {
            formData.append('delete_attachments[]', id.toString());
        });
        
        router.put(route('sales.orders.attachments.update', order.id), formData, {
            forceFormData: true,
            preserveScroll: true,
            onProgress: (progress) => {
                console.log('Upload progress:', progress);
            },
            onSuccess: () => {
                router.visit(route('sales.orders.show', order.id));
            },
            onError: (errors) => {
                console.log('Validation errors:', errors);
            }
        });
    };

    const formatFileSize = (bytes: number) => {
        return (bytes / 1024 / 1024).toFixed(2);
    };

    const getImagePreview = (file: File) => {
        return URL.createObjectURL(file);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString();
    };

    const remainingAttachments = attachments.filter(att => !deleteAttachments.includes(att.id));
    const totalImages = remainingAttachments.length + selectedFiles.length;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit Images - ${order.event_name}`} />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                {flash?.message && (
                    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                        {flash.message}
                    </div>
                )}

                {errors.error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                        {errors.error}
                    </div>
                )}

                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Edit Images</h1>
                        <p className="text-muted-foreground">{order.event_name} ({order.custom_code})</p>
                    </div>
                    <Link href={route('sales.orders.show', order.id)}>
                        <Button variant="outline">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Order
                        </Button>
                    </Link>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Existing Images */}
                    {attachments.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Image className="h-5 w-5" />
                                    Current Images ({attachments.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {attachments.map((attachment) => {
                                        const isMarkedForDeletion = deleteAttachments.includes(attachment.id);
                                        
                                        return (
                                            <div key={attachment.id} className="relative group">
                                                <div className={`aspect-square rounded-lg overflow-hidden border-2 bg-gray-50 ${
                                                    isMarkedForDeletion ? 'border-red-300 opacity-50' : 'border-gray-200'
                                                }`}>
                                                    <img
                                                        src={attachment.file_name_url}
                                                        alt={attachment.file_name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                    
                                                    {isMarkedForDeletion && (
                                                        <div className="absolute inset-0 bg-[#C38154] bg-opacity-20 flex items-center justify-center">
                                                            <Trash2 className="h-8 w-8 text-red-600" />
                                                        </div>
                                                    )}
                                                </div>
                                                
                                                {/* File Info */}
                                                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white p-2 rounded-b-lg">
                                                    <p className="text-xs truncate font-medium">{attachment.file_name}</p>
                                                    <p className="text-xs text-gray-300">
                                                        Added {formatDate(attachment.created_at)}
                                                    </p>
                                                </div>
                                                
                                                {/* Delete Checkbox */}
                                                <div className="absolute top-2 right-2">
                                                    <div className="flex items-center space-x-2 bg-white rounded p-1 shadow-md">
                                                        <Checkbox
                                                            id={`delete-${attachment.id}`}
                                                            checked={isMarkedForDeletion}
                                                            onCheckedChange={() => toggleDeleteAttachment(attachment.id)}
                                                        />
                                                        <Label 
                                                            htmlFor={`delete-${attachment.id}`}
                                                            className="text-xs cursor-pointer"
                                                        >
                                                            Delete
                                                        </Label>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                
                                {deleteAttachments.length > 0 && (
                                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                                        <p className="text-sm text-red-700">
                                            {deleteAttachments.length} image{deleteAttachments.length !== 1 ? 's' : ''} will be deleted
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Add New Images */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Upload className="h-5 w-5" />
                                Add New Images
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* File Upload Area */}
                            <div>
                                <Label className="text-base font-semibold">Select Additional Images</Label>
                                <div className="mt-2 space-y-3">
                                    <div className="flex items-center gap-2">
                                        <Input
                                            type="file"
                                            multiple
                                            accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                                            onChange={(e) => handleFileChange(e.target.files)}
                                            className="file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                        />
                                        <Upload className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    
                                    <p className="text-xs text-muted-foreground">
                                        <strong>Images only:</strong> JPEG, PNG, WebP, GIF formats supported (Max: 10MB each)
                                    </p>
                                </div>
                            </div>

                            {/* New Images Preview */}
                            {selectedFiles.length > 0 && (
                                <div>
                                    <Label className="text-base font-semibold">
                                        New Images to Upload ({selectedFiles.length})
                                    </Label>
                                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-h-64 overflow-y-auto">
                                        {selectedFiles.map((file, index) => (
                                            <div key={index} className="relative group">
                                                <div className="aspect-square rounded-lg overflow-hidden border-2 border-green-200 bg-gray-50">
                                                    <img
                                                        src={getImagePreview(file)}
                                                        alt={file.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                                
                                                {/* File Info */}
                                                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white p-2 rounded-b-lg">
                                                    <p className="text-xs truncate font-medium">{file.name}</p>
                                                    <p className="text-xs text-gray-300">
                                                        {formatFileSize(file.size)} MB • {file.type}
                                                    </p>
                                                </div>
                                                
                                                {/* Remove Button */}
                                                <Button
                                                    type="button"
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => removeNewFile(index)}
                                                    className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <X className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Upload Instructions */}
                            {selectedFiles.length === 0 && (
                                <div className="text-center py-6 border-2 border-dashed border-gray-300 rounded-lg">
                                    <Image className="mx-auto h-10 w-10 text-gray-400" />
                                    <h3 className="mt-2 text-sm font-medium text-gray-900">No new images selected</h3>
                                    <p className="mt-1 text-sm text-gray-500">
                                        Click "Choose Files" above to add more images
                                    </p>
                                    <p className="mt-1 text-xs text-gray-400">
                                        Only image files (JPEG, PNG, WebP, GIF) are accepted
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Submit Buttons */}
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                            Total after changes: {totalImages} image{totalImages !== 1 ? 's' : ''}
                            {deleteAttachments.length > 0 && (
                                <span className="text-red-600 block">
                                    ({deleteAttachments.length} to be deleted)
                                </span>
                            )}
                            {selectedFiles.length > 0 && (
                                <span className="text-green-600 block">
                                    ({selectedFiles.length} to be added)
                                </span>
                            )}
                        </div>

                        <div className="flex items-center gap-3">
                            <Link href={route('sales.orders.show', order.id)}>
                                <Button variant="outline" disabled={processing}>
                                    Cancel
                                </Button>
                            </Link>
                            <Button 
                                type="submit" 
                                disabled={processing || (selectedFiles.length === 0 && deleteAttachments.length === 0)}
                            >
                                {processing ? 'Updating...' : 'Update Images'}
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}