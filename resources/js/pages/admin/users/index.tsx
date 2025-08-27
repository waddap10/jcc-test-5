import React, { useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Search, Edit, Trash2, UserCheck, UserX, Users, Shield, Building2 } from 'lucide-react';

interface Department {
    id: number;
    name: string;
}

interface Role {
    id: number;
    name: string;
}

interface User {
    id: number;
    name: string;
    username: string;
    phone?: string;
    department?: Department;
    roles: Role[];
    is_active?: boolean;
    created_at: string;
    updated_at: string;
}

interface UsersPageProps {
    users: {
        data: User[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number;
        to: number;
        links: Array<{
            url: string | null;
            label: string;
            active: boolean;
        }>;
    };
    filters?: {
        search?: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Users',
        href: route('admin.users.index'),
    },
];

export default function UsersIndex({ users, filters = {} }: UsersPageProps) {
    const [searchTerm, setSearchTerm] = useState(filters?.search || '');
    const [deleteUser, setDeleteUser] = useState<User | null>(null);
    const [toggleUser, setToggleUser] = useState<User | null>(null);
    const { delete: destroy, patch, processing } = useForm();

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route('admin.users.index'), { search: searchTerm }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleDelete = () => {
        if (deleteUser) {
            destroy(route('admin.users.destroy', deleteUser.id), {
                onSuccess: () => {
                    setDeleteUser(null);
                },
            });
        }
    };

    const handleToggleStatus = () => {
        if (toggleUser) {
            patch(route('admin.users.toggle-status', toggleUser.id), {}, {
                onSuccess: () => {
                    setToggleUser(null);
                },
            });
        }
    };

    const handlePageChange = (url: string) => {
        router.get(url);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getRoleBadgeVariant = (role: string) => {
        const variants = {
            'admin': 'destructive',
            'manager': 'default',
            'staff': 'secondary',
            'user': 'outline'
        };
        return variants[role.toLowerCase()] || 'outline';
    };

    const activeUsers = users.data.filter(u => u.is_active !== false).length;
    const usersWithDepartment = users.data.filter(u => u.department).length;
    const adminUsers = users.data.filter(u => u.roles.some(r => r.name.toLowerCase() === 'admin')).length;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Users" />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-2">
                                <Users className="h-8 w-8 text-blue-600" />
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                                    <p className="text-2xl font-bold text-blue-600">{users.total}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-2">
                                <UserCheck className="h-8 w-8 text-green-600" />
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                                    <p className="text-2xl font-bold text-green-600">{activeUsers}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-2">
                                <Building2 className="h-8 w-8 text-purple-600" />
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">With Department</p>
                                    <p className="text-2xl font-bold text-purple-600">{usersWithDepartment}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-2">
                                <Shield className="h-8 w-8 text-red-600" />
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Admin Users</p>
                                    <p className="text-2xl font-bold text-red-600">{adminUsers}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-2xl font-bold">Users</CardTitle>
                            <p className="text-muted-foreground">
                                Showing {users.from} to {users.to} of {users.total} users
                            </p>
                        </div>
                        <Link href={route('admin.users.create')}>
                            <Button variant="outline">
                                <Plus className="mr-2 h-4 w-4" />
                                New User
                            </Button>
                        </Link>
                    </CardHeader>

                    <CardContent>
                        {/* Search Form */}
                        <form onSubmit={handleSearch} className="mb-6">
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        type="text"
                                        placeholder="Search by name, username, or department..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                                <Button type="submit" variant="outline">
                                    Search
                                </Button>
                                {filters?.search && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() => {
                                            setSearchTerm('');
                                            router.get(route('admin.users.index'));
                                        }}
                                    >
                                        Clear
                                    </Button>
                                )}
                            </div>
                        </form>

                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>User</TableHead>
                                        <TableHead>Username</TableHead>
                                        <TableHead>Department</TableHead>
                                        <TableHead>Roles</TableHead>
                                        <TableHead>Phone</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Joined</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {users.data.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={8} className="h-24 text-center">
                                                No users found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        users.data.map((user) => (
                                            <TableRow key={user.id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-8 w-8">
                                                            <AvatarFallback className="bg-blue-600 text-white text-sm font-medium">
                                                                {user.name.charAt(0).toUpperCase()}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div className="font-medium">
                                                            {user.name}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="font-mono text-sm text-muted-foreground">
                                                        @{user.username}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    {user.department ? (
                                                        <Badge variant="outline">
                                                            {user.department.name}
                                                        </Badge>
                                                    ) : (
                                                        <span className="text-sm text-muted-foreground">No department</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-wrap gap-1">
                                                        {user.roles.map((role) => (
                                                            <Badge
                                                                key={role.id}
                                                                variant={getRoleBadgeVariant(role.name)}
                                                                className="text-xs"
                                                            >
                                                                {role.name}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {user.phone || '—'}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant={user.is_active !== false ? "default" : "secondary"}
                                                        className={user.is_active !== false ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                                                    >
                                                        {user.is_active !== false ? 'Active' : 'Inactive'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {formatDate(user.created_at)}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Link href={route('admin.users.edit', user.id)}>
                                                            <Button variant="outline" size="sm">
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                        </Link>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => setToggleUser(user)}
                                                            disabled={processing}
                                                        >
                                                            {user.is_active !== false ? (
                                                                <UserX className="h-4 w-4" />
                                                            ) : (
                                                                <UserCheck className="h-4 w-4" />
                                                            )}
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => setDeleteUser(user)}
                                                            disabled={processing}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination */}
                        {users.last_page > 1 && (
                            <div className="mt-6 flex justify-center">
                                <Pagination>
                                    <PaginationContent>
                                        {/* Previous Button */}
                                        <PaginationItem>
                                            <PaginationPrevious
                                                href="#"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    if (users.current_page > 1) {
                                                        const prevUrl = users.links.find(link =>
                                                            link.label.includes('Previous')
                                                        )?.url;
                                                        if (prevUrl) handlePageChange(prevUrl);
                                                    }
                                                }}
                                                className={users.current_page === 1 ? 'pointer-events-none opacity-50' : ''}
                                            />
                                        </PaginationItem>

                                        {/* Page Numbers */}
                                        {users.links
                                            .filter(link => !link.label.includes('Previous') && !link.label.includes('Next'))
                                            .map((link, index) => (
                                                <PaginationItem key={index}>
                                                    {link.label === '...' ? (
                                                        <PaginationEllipsis />
                                                    ) : (
                                                        <PaginationLink
                                                            href="#"
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                if (link.url) handlePageChange(link.url);
                                                            }}
                                                            isActive={link.active}
                                                        >
                                                            {link.label}
                                                        </PaginationLink>
                                                    )}
                                                </PaginationItem>
                                            ))}

                                        {/* Next Button */}
                                        <PaginationItem>
                                            <PaginationNext
                                                href="#"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    if (users.current_page < users.last_page) {
                                                        const nextUrl = users.links.find(link =>
                                                            link.label.includes('Next')
                                                        )?.url;
                                                        if (nextUrl) handlePageChange(nextUrl);
                                                    }
                                                }}
                                                className={users.current_page === users.last_page ? 'pointer-events-none opacity-50' : ''}
                                            />
                                        </PaginationItem>
                                    </PaginationContent>
                                </Pagination>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!deleteUser} onOpenChange={() => setDeleteUser(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action will permanently delete the user "{deleteUser?.name}" (@{deleteUser?.username}).
                            This action cannot be undone and will remove all associated data.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={processing}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {processing ? 'Deleting...' : 'Delete User'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Toggle Status Confirmation Dialog */}
            <AlertDialog open={!!toggleUser} onOpenChange={() => setToggleUser(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {toggleUser?.is_active !== false ? 'Deactivate' : 'Activate'} User
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to {toggleUser?.is_active !== false ? 'deactivate' : 'activate'} the user "{toggleUser?.name}"?
                            {toggleUser?.is_active !== false ? (
                                <span className="block mt-2 text-amber-600">
                                    The user will lose access to the system until reactivated.
                                </span>
                            ) : (
                                <span className="block mt-2 text-green-600">
                                    The user will regain access to the system.
                                </span>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleToggleStatus}
                            disabled={processing}
                        >
                            {processing ? 'Processing...' : toggleUser?.is_active !== false ? 'Deactivate' : 'Activate'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}