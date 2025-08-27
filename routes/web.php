<?php

use App\Http\Controllers\BeoController;
use App\Http\Controllers\CalendarController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\DepartmentController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\KanitController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\OrderAttachmentController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\OrderPdfController;
use App\Http\Controllers\PackageController;
use App\Http\Controllers\PicController;
use App\Http\Controllers\ScheduleController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\VenueController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth', 'role:admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::prefix('venues')->name('venues.')->group(function () {
        Route::get('/', [VenueController::class, 'index'])->name('index');
        Route::get('/create', [VenueController::class, 'create'])->name('create');
        Route::post('/', [VenueController::class, 'store'])->name('store');
        Route::get('/{venue}', [VenueController::class, 'show'])->name('show');
        Route::get('/{venue}/edit', [VenueController::class, 'edit'])->name('edit');
        Route::put('/{venue}', [VenueController::class, 'update'])->name('update');
        Route::patch('/{venue}', [VenueController::class, 'update'])->name('update');
        Route::delete('/{venue}', [VenueController::class, 'destroy'])->name('destroy');
    });

    Route::prefix('events')->name('events.')->group(function () {
        Route::get('/', [EventController::class, 'index'])->name('index');
        Route::get('/create', [EventController::class, 'create'])->name('create');
        Route::post('/', [EventController::class, 'store'])->name('store');
        Route::get('/{event}/edit', [EventController::class, 'edit'])->name('edit');
        Route::put('/{event}', [EventController::class, 'update'])->name('update');
        Route::patch('/{event}', [EventController::class, 'update'])->name('update');
        Route::delete('/{event}', [EventController::class, 'destroy'])->name('destroy');
    });

    // Departments Routes
    Route::prefix('departments')->name('departments.')->group(function () {
        Route::get('/', [DepartmentController::class, 'index'])->name('index');
        Route::get('/create', [DepartmentController::class, 'create'])->name('create');
        Route::post('/', [DepartmentController::class, 'store'])->name('store');
        Route::get('/{department}', [DepartmentController::class, 'show'])->name('show');
        Route::get('/{department}/edit', [DepartmentController::class, 'edit'])->name('edit');
        Route::put('/{department}', [DepartmentController::class, 'update'])->name('update');
        Route::patch('/{department}', [DepartmentController::class, 'update'])->name('update');
        Route::delete('/{department}', [DepartmentController::class, 'destroy'])->name('destroy');

        // Additional department-specific routes
        Route::get('/{department}/users', [DepartmentController::class, 'users'])->name('users');
        Route::patch('/{department}/toggle-status', [DepartmentController::class, 'toggleStatus'])->name('toggle-status');
        Route::post('/{department}/assign-user', [DepartmentController::class, 'assignUser'])->name('assign-user');
        Route::delete('/{department}/remove-user/{user}', [DepartmentController::class, 'removeUser'])->name('remove-user');
    });

    // Users Routes
    Route::prefix('users')->name('users.')->group(function () {
        Route::get('/', [UserController::class, 'index'])->name('index');
        Route::get('/create', [UserController::class, 'create'])->name('create');
        Route::post('/', [UserController::class, 'store'])->name('store');
        Route::get('/{user}', [UserController::class, 'show'])->name('show');
        Route::get('/{user}/edit', [UserController::class, 'edit'])->name('edit');
        Route::put('/{user}', [UserController::class, 'update'])->name('update');
        Route::patch('/{user}', [UserController::class, 'update'])->name('update');
        Route::delete('/{user}', [UserController::class, 'destroy'])->name('destroy');

        Route::patch('/{user}/toggle-status', [UserController::class, 'toggleStatus'])
            ->name('toggle-status');
    });

    Route::prefix('packages')->name('packages.')->group(function () {
        Route::get('/', [PackageController::class, 'index'])->name('index');
        Route::get('/create', [PackageController::class, 'create'])->name('create');
        Route::post('/', [PackageController::class, 'store'])->name('store');
        Route::get('/{package}', [PackageController::class, 'show'])->name('show');
        Route::get('/{package}/edit', [PackageController::class, 'edit'])->name('edit');
        Route::put('/{package}', [PackageController::class, 'update'])->name('update');
        Route::patch('/{package}', [PackageController::class, 'update'])->name('update');
        Route::delete('/{package}', [PackageController::class, 'destroy'])->name('destroy');
    });

});

Route::middleware(['auth', 'role:sales'])->prefix('sales')->name('sales.')->group(function () {
    Route::prefix('customers')->name('customers.')->group(function () {
        Route::get('/', [CustomerController::class, 'index'])->name('index');
        Route::get('/{customer}/edit', [CustomerController::class, 'edit'])->name('edit');
        Route::delete('/{customer}', [CustomerController::class, 'destroy'])->name('destroy');
    });
    Route::prefix('orders')->name('orders.')->group(function () {
        // Main order CRUD
        Route::get('/', [OrderController::class, 'index'])->name('index');
        Route::get('/create', [OrderController::class, 'create'])->name('create');
        Route::post('/', [OrderController::class, 'store'])->name('store');

        Route::prefix('{order}')->group(function () {
            Route::get('/', [OrderController::class, 'show'])->name('show');
            Route::delete('/', [OrderController::class, 'destroy'])->name('destroy');

            // Custom order actions
            Route::patch('/status', [OrderController::class, 'updateStatus'])->name('status.update');
            Route::patch('/acc-kanit', [OrderController::class, 'accKanit'])->name('acc-kanit');
            Route::patch('/selesai', [OrderController::class, 'markSelesai'])->name('selesai');

            // Schedule routes (bulk operations)
            Route::prefix('schedules')->name('schedules.')->group(function () {
                Route::get('/create', [ScheduleController::class, 'create'])->name('create');
                Route::post('/', [ScheduleController::class, 'store'])->name('store');
                Route::get('/edit', [ScheduleController::class, 'edit'])->name('edit');
                Route::put('/', [ScheduleController::class, 'update'])->name('update');
                Route::delete('/{schedule}', [ScheduleController::class, 'destroy'])->name('destroy');
            });

            // BEO routes (bulk operations)
            Route::prefix('beos')->name('beos.')->group(function () {
                Route::get('/create', [BeoController::class, 'create'])->name('create');
                Route::post('/', [BeoController::class, 'store'])->name('store');
                Route::get('/edit', [BeoController::class, 'edit'])->name('edit');
                Route::put('/', [BeoController::class, 'update'])->name('update');
                Route::delete('/{beo}', [BeoController::class, 'destroy'])->name('destroy');
            });

            // Order Attachment routes
            Route::prefix('/attachments')->name('attachments.')->group(function () {
                Route::get('/create', [OrderAttachmentController::class, 'create'])->name('create');
                Route::post('/', [OrderAttachmentController::class, 'store'])->name('store');
                Route::get('/edit', [OrderAttachmentController::class, 'edit'])->name('edit');
                Route::put('/', [OrderAttachmentController::class, 'update'])->name('update');
                Route::delete('/{attachment}', [OrderAttachmentController::class, 'destroy'])->name('destroy');
            });

            Route::prefix('pdf')->name('pdf.')->group(function () {
                Route::get('/download', [OrderPdfController::class, 'downloadOrderPdf'])->name('download');
                Route::get('/preview', [OrderPdfController::class, 'previewOrderPdf'])->name('preview');
                Route::get('/info', [OrderPdfController::class, 'getPdfInfo'])->name('info');
            });
        });
    });
});


Route::middleware(['auth', 'role:kanit'])->prefix('kanit')->name('kanit.')->group(function () {
    Route::get('dashboard', [KanitController::class, 'index'])->name('dashboard');
    Route::get('orders/{order}', [KanitController::class, 'show'])->name('orders.show');
    Route::patch('{order}/acc-kanit', [KanitController::class, 'accKanit'])->name('acc-kanit');
});

Route::middleware(['auth', 'role:pic'])->prefix('pic')->name('pic.')->group(function () {
    Route::get('dashboard', [PicController::class, 'index'])->name('dashboard');
    Route::get('orders/{order}', [PicController::class, 'show'])->name('orders.show');
});

Route::middleware(['auth', 'role:admin|sales|kanit'])->group(function () {
    Route::get('calendars', [CalendarController::class, 'index'])->name('calendars.index');
});

Route::middleware(['auth'])->group(function () {
    Route::get('/orders/{order}/pdf', [OrderController::class, 'downloadPdf'])->name('orders.pdf.download');
});

// In routes/web.php
// Notification routes
Route::middleware(['auth'])->group(function () {
    Route::patch('/notifications/{notification}/mark-read', [NotificationController::class, 'markAsRead']);
    Route::post('/notifications/mark-all-read', [NotificationController::class, 'markAllAsRead']);
    Route::get('/notifications', [NotificationController::class, 'index']);
});

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
