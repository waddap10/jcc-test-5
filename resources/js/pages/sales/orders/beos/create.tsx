import React, { useState } from 'react';
import { Head, useForm, usePage, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Plus, Trash2, Upload, X, Image } from 'lucide-react';

interface User {
    id: number;
    name: string;
}

interface Package {
    id: number;
    name: string;
    description?: string;
}

interface Department {
    id: number;
    name: string;
    users: User[];
    packages: Package[];
}

interface Order {
    id: number;
    event_name: string;
    custom_code: string;
}

interface BeoRow {
    department_id: number | null;
    package_id: number | null;
    user_id: number | null;
    notes: string;
}

interface PageProps {
    order: Order;
    departments: Department[];
    flash?: { message?: string };
    errors: Record<string, string>;
}

export default function BeoCreate() {
    const { order, departments, flash, errors } = usePage<PageProps>().props;
    
    const { data, setData, processing } = useForm<{
        beos: BeoRow[];
    }>({
        beos: [{
            department_id: null,
            package_id: null,
            user_id: null,
            notes: '',
        }],
    });

    const [attachments, setAttachments] = useState<Record<number, File[]>>({});

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Orders', href: route('sales.orders.index') },
        { title: order.event_name, href: route('sales.orders.show', order.id) },
        { title: 'Add BEO', href: '#' },
    ];

    const updateBeo = (idx: number, updates: Partial<BeoRow>) => {
        const newBeos = data.beos.map((row, i) =>
            i === idx ? { ...row, ...updates } : row
        );
        setData('beos', newBeos);
    };

    const addBeo = () => {
        setData('beos', [
            ...data.beos,
            { department_id: null, package_id: null, user_id: null, notes: '' },
        ]);
    };

    const removeBeo = (idx: number) => {
        if (data.beos.length <= 1) return; // Minimum 1 row required
        
        const filtered = data.beos.filter((_, i) => i !== idx);
        setData('beos', filtered);
        
        // Reindex attachments
        const newAttachments = { ...attachments };
        delete newAttachments[idx];
        const reindexed: Record<number, File[]> = {};
        Object.keys(newAttachments).forEach((key) => {
            const oldIdx = parseInt(key);
            const newIdx = oldIdx > idx ? oldIdx - 1 : oldIdx;
            reindexed[newIdx] = newAttachments[oldIdx];
        });
        setAttachments(reindexed);
    };

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
                setAttachments(prev => ({
                    ...prev,
                    [idx]: [...(prev[idx] || []), ...validFiles]
                }));
            }
            
            // Clear the input
            const input = document.querySelector(`input[type="file"]`) as HTMLInputElement;
            if (input) input.value = '';
        }
    };

    const removeAttachment = (idx: number, fileIdx: number) => {
        setAttachments(prev => ({
            ...prev,
            [idx]: (prev[idx] || []).filter((_, i) => i !== fileIdx)
        }));
    };

    const validateAllFiles = () => {
        const maxFileSize = 10 * 1024 * 1024; // 10MB
        const allowedTypes = [
            'image/jpeg', 
            'image/jpg', 
            'image/png', 
            'image/webp', 
            'image/gif'
        ];
        
        for (const [index, files] of Object.entries(attachments)) {
            for (const file of files) {
                if (file.size > maxFileSize) {
                    alert(`Image "${file.name}" is too large. Maximum size is 10MB.`);
                    return false;
                }
                if (!allowedTypes.includes(file.type.toLowerCase())) {
                    alert(`File "${file.name}" is not a valid image format.`);
                    return false;
                }
            }
        }
        return true;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!validateAllFiles()) {
            return;
        }
        
        const formData = new FormData();
        
        // Add BEO data - ensure proper formatting
        data.beos.forEach((beo, index) => {
            formData.append(`beos[${index}][department_id]`, beo.department_id?.toString() || '');
            formData.append(`beos[${index}][package_id]`, beo.package_id?.toString() || '');
            formData.append(`beos[${index}][user_id]`, beo.user_id?.toString() || '');
            formData.append(`beos[${index}][notes]`, beo.notes || '');
        });
        
        // Add attachments with proper indexing
        Object.keys(attachments).forEach((indexStr) => {
            const index = parseInt(indexStr);
            const files = attachments[index];
            if (files && files.length > 0) {
                files.forEach((file, fileIndex) => {
                    formData.append(`attachments[${index}][]`, file);
                });
            }
        });
        
        // Debug: Log form data
        console.log('Submitting BEOs:', data.beos);
        console.log('Submitting attachments count:', Object.keys(attachments).length);
        
        router.post(route('sales.orders.beos.store', order.id), formData, {
            forceFormData: true,
            preserveScroll: true,
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            onProgress: (progress) => {
                console.log('Upload progress:', progress);
            },
            onSuccess: (page) => {
                console.log('Success:', page);
                router.visit(route('sales.orders.show', order.id));
            },
            onError: (errors) => {
                console.log('Validation errors:', errors);
            },
            onFinish: () => {
                console.log('Request finished');
            }
        });
    };

    const getImagePreview = (file: File) => {
        return URL.createObjectURL(file);
    };

    const formatFileSize = (bytes: number) => {
        return (bytes / 1024 / 1024).toFixed(2);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Add BEO - ${order.event_name}`} />

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
                        <h1 className="text-3xl font-bold">Add BEO</h1>
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
                    {data.beos.map((beo, idx) => {
                        const selectedDept = departments.find(d => d.id === beo.department_id);
                        const availableUsers = selectedDept?.users || [];
                        const availablePackages = selectedDept?.packages || [];

                        return (
                            <Card key={idx}>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <CardTitle>BEO #{idx + 1}</CardTitle>
                                    {data.beos.length > 1 && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => removeBeo(idx)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {/* Step 1: Department Selection */}
                                    <div>
                                        <Label className="text-base font-semibold">1. Select Department</Label>
                                        <Select
                                            value={beo.department_id?.toString() || ''}
                                            onValueChange={(value) => {
                                                updateBeo(idx, {
                                                    department_id: value ? Number(value) : null,
                                                    user_id: null,
                                                    package_id: null,
                                                });
                                            }}
                                        >
                                            <SelectTrigger className="mt-2">
                                                <SelectValue placeholder="Choose a department" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {departments.map(dept => (
                                                    <SelectItem key={dept.id} value={dept.id.toString()}>
                                                        {dept.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors[`beos.${idx}.department_id`] && (
                                            <p className="text-red-600 text-sm mt-1">
                                                {errors[`beos.${idx}.department_id`]}
                                            </p>
                                        )}
                                    </div>

                                    {/* Step 2: Package and User Selection */}
                                    {beo.department_id && (
                                        <div className="space-y-4">
                                            {/* Package Selection */}
                                            <div>
                                                <Label className="text-base font-semibold">2. Select Package</Label>
                                                <Select
                                                    value={beo.package_id?.toString() || ''}
                                                    onValueChange={(value) => {
                                                        updateBeo(idx, {
                                                            package_id: value ? Number(value) : null,
                                                        });
                                                    }}
                                                >
                                                    <SelectTrigger className="mt-2">
                                                        <SelectValue placeholder={
                                                            availablePackages.length === 0 
                                                                ? "No packages available" 
                                                                : "Choose a package (optional)"
                                                        } />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {availablePackages.length > 0 ? (
                                                            availablePackages.map(pkg => (
                                                                <SelectItem key={pkg.id} value={pkg.id.toString()}>
                                                                    {pkg.name}
                                                                </SelectItem>
                                                            ))
                                                        ) : (
                                                            <div className="px-2 py-1 text-sm text-muted-foreground">
                                                                No packages available for this department
                                                            </div>
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                                
                                                {/* Package Description Display */}
                                                {beo.package_id && (
                                                    (() => {
                                                        const selectedPackage = availablePackages.find(pkg => pkg.id === beo.package_id);
                                                        return selectedPackage?.description ? (
                                                            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                                                                <h4 className="text-sm font-medium text-blue-900 mb-1">Package Description:</h4>
                                                                <p className="text-sm text-blue-800">{selectedPackage.description}</p>
                                                            </div>
                                                        ) : null;
                                                    })()
                                                )}
                                                
                                                {availablePackages.length === 0 && (
                                                    <p className="text-muted-foreground text-xs mt-1">
                                                        No packages available for this department
                                                    </p>
                                                )}
                                            </div>

                                            {/* User Selection */}
                                            <div>
                                                <Label className="text-base font-semibold">3. Select Person in Charge</Label>
                                                <Select
                                                    value={beo.user_id?.toString() || ''}
                                                    onValueChange={(value) => {
                                                        updateBeo(idx, {
                                                            user_id: value ? Number(value) : null,
                                                        });
                                                    }}
                                                >
                                                    <SelectTrigger className="mt-2">
                                                        <SelectValue placeholder={
                                                            availableUsers.length === 0
                                                                ? "No users available"
                                                                : "Choose a person (optional)"
                                                        } />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {availableUsers.length > 0 ? (
                                                            availableUsers.map(user => (
                                                                <SelectItem key={user.id} value={user.id.toString()}>
                                                                    {user.name}
                                                                </SelectItem>
                                                            ))
                                                        ) : (
                                                            <div className="px-2 py-1 text-sm text-muted-foreground">
                                                                No users available for this department
                                                            </div>
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                                {availableUsers.length === 0 && (
                                                    <p className="text-muted-foreground text-xs mt-1">
                                                        No users available for this department
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Step 3: Notes */}
                                    <div>
                                        <Label className="text-base font-semibold">4. Notes</Label>
                                        <Textarea
                                            value={beo.notes}
                                            onChange={(e) => updateBeo(idx, { notes: e.target.value })}
                                            placeholder="Add any special notes or instructions..."
                                            rows={3}
                                            className="mt-2"
                                            maxLength={1000}
                                        />
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {beo.notes.length}/1000 characters
                                        </p>
                                    </div>

                                    {/* Step 4: Image Attachments */}
                                    <div>
                                        <Label className="text-base font-semibold flex items-center gap-2">
                                            <Image className="h-4 w-4" />
                                            5. Image Attachments
                                        </Label>
                                        <div className="space-y-3 mt-2">
                                            <div className="flex items-center gap-2">
                                                <Input
                                                    type="file"
                                                    multiple
                                                    accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                                                    onChange={(e) => handleFileChange(idx, e.target.files)}
                                                    className="file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                                />
                                                <Upload className="h-4 w-4 text-muted-foreground" />
                                            </div>
                                            
                                            <p className="text-xs text-muted-foreground">
                                                <strong>Images only:</strong> JPEG, PNG, WebP, GIF formats supported (Max: 10MB each)
                                            </p>
                                            
                                            {attachments[idx] && attachments[idx].length > 0 && (
                                                <div className="space-y-3">
                                                    <p className="text-sm font-medium">Selected images ({attachments[idx].length}):</p>
                                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 max-h-64 overflow-y-auto">
                                                        {attachments[idx].map((file, fileIdx) => (
                                                            <div key={fileIdx} className="relative group">
                                                                <div className="aspect-square rounded-lg overflow-hidden border-2 border-gray-200 bg-gray-50">
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
                                                                    onClick={() => removeAttachment(idx, fileIdx)}
                                                                    className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                >
                                                                    <X className="h-3 w-3" />
                                                                </Button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Empty State */}
                                            {(!attachments[idx] || attachments[idx].length === 0) && (
                                                <div className="text-center py-6 border-2 border-dashed border-gray-300 rounded-lg">
                                                    <Image className="mx-auto h-8 w-8 text-gray-400" />
                                                    <p className="mt-1 text-sm text-gray-500">No images selected</p>
                                                    <p className="text-xs text-gray-400">Only image files are accepted</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}

                    <div className="flex items-center justify-between">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={addBeo}
                            disabled={processing}
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Add Another BEO
                        </Button>

                        <div className="flex items-center gap-3">
                            <Link href={route('sales.orders.show', order.id)}>
                                <Button variant="outline" disabled={processing}>
                                    Cancel
                                </Button>
                            </Link>
                            <Button type="submit" disabled={processing}>
                                {processing ? 'Creating...' : 'Create BEOs'}
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}