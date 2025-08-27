import React, { useState } from 'react';
import { Head, useForm, usePage, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Upload, X, Image, AlertCircle } from 'lucide-react';

interface Order {
    id: number;
    event_name: string;
    custom_code: string;
}

interface PageProps {
    order: Order;
    flash?: { message?: string };
    errors: Record<string, string>;
}

export default function OrderAttachmentCreate() {
    const { order, flash, errors } = usePage<PageProps>().props;
    
    const { processing } = useForm();
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [uploadErrors, setUploadErrors] = useState<string[]>([]);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Orders', href: route('sales.orders.index') },
        { title: order.event_name, href: route('sales.orders.show', order.id) },
        { title: 'Add Images', href: '#' },
    ];

    const validateFiles = (files: File[]) => {
        const maxFileSize = 10 * 1024 * 1024; // 10MB
        const allowedTypes = [
            'image/jpeg', 
            'image/jpg', 
            'image/png', 
            'image/webp', 
            'image/gif'
        ];
        
        const validFiles: File[] = [];
        const errorMessages: string[] = [];
        
        files.forEach(file => {
            // Check file size
            if (file.size > maxFileSize) {
                errorMessages.push(`"${file.name}" is too large (${(file.size / 1024 / 1024).toFixed(2)}MB). Maximum size is 10MB.`);
                return;
            }
            
            // Strict MIME type validation
            if (!allowedTypes.includes(file.type.toLowerCase())) {
                errorMessages.push(`"${file.name}" is not a valid image format. Only JPEG, PNG, WebP, and GIF images are allowed.`);
                return;
            }
            
            // Additional file extension check as backup
            const fileExtension = file.name.toLowerCase().split('.').pop();
            const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
            if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
                errorMessages.push(`"${file.name}" has an invalid extension. Only image files are allowed.`);
                return;
            }
            
            validFiles.push(file);
        });
        
        return { validFiles, errorMessages };
    };

    const handleFileChange = (files: FileList | null) => {
        if (files) {
            const fileArray = Array.from(files);
            const { validFiles, errorMessages } = validateFiles(fileArray);
            
            // Clear previous upload errors
            setUploadErrors([]);
            
            if (errorMessages.length > 0) {
                setUploadErrors(errorMessages);
            }
            
            if (validFiles.length > 0) {
                setSelectedFiles(prev => [...prev, ...validFiles]);
            }
            
            // Clear the input
            const input = document.querySelector('input[type="file"]') as HTMLInputElement;
            if (input) input.value = '';
        }
    };

    const removeFile = (index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
        // Clear upload errors when files are removed
        if (selectedFiles.length === 1) {
            setUploadErrors([]);
        }
    };

    const clearAllErrors = () => {
        setUploadErrors([]);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Clear any existing upload errors
        setUploadErrors([]);
        
        if (selectedFiles.length === 0) {
            setUploadErrors(['Please select at least one image to upload.']);
            return;
        }
        
        const formData = new FormData();
        
        selectedFiles.forEach((file) => {
            formData.append('attachments[]', file);
        });
        
        router.post(route('sales.orders.attachments.store', order.id), formData, {
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
                
                // Handle different types of server errors
                const errorMessages: string[] = [];
                
                if (errors.attachments) {
                    if (Array.isArray(errors.attachments)) {
                        errorMessages.push(...errors.attachments);
                    } else {
                        errorMessages.push(errors.attachments);
                    }
                }
                
                if (errors.error) {
                    errorMessages.push(errors.error);
                }
                
                // Handle individual file errors
                Object.keys(errors).forEach(key => {
                    if (key.startsWith('attachments.')) {
                        errorMessages.push(errors[key]);
                    }
                });
                
                if (errorMessages.length === 0 && Object.keys(errors).length > 0) {
                    errorMessages.push('An error occurred while uploading the images. Please try again.');
                }
                
                setUploadErrors(errorMessages);
            }
        });
    };

    const formatFileSize = (bytes: number) => {
        return (bytes / 1024 / 1024).toFixed(2);
    };

    const getImagePreview = (file: File) => {
        return URL.createObjectURL(file);
    };

    // Combine all error sources
    const allErrors = [
        ...uploadErrors,
        ...(errors.error ? [errors.error] : []),
        ...(errors.attachments ? (Array.isArray(errors.attachments) ? errors.attachments : [errors.attachments]) : [])
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Add Images - ${order.event_name}`} />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                {/* Success Message */}
                {flash?.message && (
                    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                        {flash.message}
                    </div>
                )}

                {/* Error Messages */}
                {allErrors.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3">
                                <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
                                <div className="flex-1">
                                    <h3 className="text-sm font-medium text-red-800">
                                        {allErrors.length === 1 ? 'Error uploading image' : `${allErrors.length} errors occurred`}
                                    </h3>
                                    <div className="mt-2 text-sm text-red-700">
                                        {allErrors.length === 1 ? (
                                            <p>{allErrors[0]}</p>
                                        ) : (
                                            <ul className="list-disc list-inside space-y-1">
                                                {allErrors.map((error, index) => (
                                                    <li key={index}>{error}</li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={clearAllErrors}
                                className="text-red-400 hover:text-red-600 p-1"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}

                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Add Images</h1>
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
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Image className="h-5 w-5" />
                                Upload Images
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* File Upload Area */}
                            <div>
                                <Label className="text-base font-semibold">Select Images</Label>
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
                                        <strong>Images only:</strong> JPEG, PNG, WebP, GIF formats supported (Max: 10MB each) • You can select multiple images at once
                                    </p>
                                </div>
                            </div>

                            {/* Selected Images Preview */}
                            {selectedFiles.length > 0 && (
                                <div>
                                    <Label className="text-base font-semibold">
                                        Selected Images ({selectedFiles.length})
                                    </Label>
                                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-h-96 overflow-y-auto">
                                        {selectedFiles.map((file, index) => (
                                            <div key={index} className="relative group">
                                                <div className="aspect-square rounded-lg overflow-hidden border-2 border-gray-200 bg-gray-50">
                                                    <img
                                                        src={getImagePreview(file)}
                                                        alt={file.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                                
                                                {/* File Info Overlay */}
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
                                                    onClick={() => removeFile(index)}
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
                                <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                                    <Image className="mx-auto h-12 w-12 text-gray-400" />
                                    <h3 className="mt-2 text-sm font-medium text-gray-900">No images selected</h3>
                                    <p className="mt-1 text-sm text-gray-500">
                                        Click "Choose Files" above to select images for this order
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
                            {selectedFiles.length > 0 && (
                                <span>
                                    Ready to upload {selectedFiles.length} image{selectedFiles.length !== 1 ? 's' : ''}
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
                                disabled={processing || selectedFiles.length === 0}
                            >
                                {processing ? 'Uploading...' : `Upload ${selectedFiles.length} Image${selectedFiles.length !== 1 ? 's' : ''}`}
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}