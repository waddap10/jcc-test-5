<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    public function index(Request $request)
{
    $customers = Customer::query()
        ->when($request->search, function ($query, $search) {
            $query->where('organizer', 'like', "%{$search}%")
                  ->orWhere('contact_person', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%");
        })
        ->withCount('orders') // Optional: include order counts
        ->paginate(15);

    return inertia('sales/customers/index', [
        'customers' => $customers,
        'filters' => $request->only(['search'])
    ]);
}
}
