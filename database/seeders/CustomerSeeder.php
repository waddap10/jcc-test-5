<?php

namespace Database\Seeders;

use App\Models\Customer;
use Illuminate\Database\Seeder;

class CustomerSeeder extends Seeder
{
    public function run(): void
    {
        // Create 20 random customers
        for ($i = 1; $i <= 20; $i++) {
            Customer::create([
                'organizer' => fake()->company() . ' ' . fake()->randomElement(['Corp', 'Inc', 'LLC', 'Foundation', 'Institute']),
                'address' => fake()->address(),
                'contact_person' => fake()->name(),
                'phone' => fake()->phoneNumber(),
                'email' => fake()->unique()->safeEmail(),
            ]);
        }

        // Create VIP test customer
        Customer::create([
            'organizer' => 'VIP Events International',
            'contact_person' => 'Sarah Johnson',
            'email' => 'sarah@vipevents.com',
            'phone' => '+1-555-0123',
            'address' => fake()->address(),
        ]);

        // Create additional test customers
        Customer::create([
            'organizer' => 'ABC Corporation',
            'contact_person' => 'John Smith',
            'email' => 'john@abccorp.com',
            'phone' => fake()->phoneNumber(),
            'address' => fake()->address(),
        ]);

        Customer::create([
            'organizer' => 'XYZ Foundation',
            'contact_person' => 'Jane Doe',
            'email' => 'jane@xyzfoundation.org',
            'phone' => fake()->phoneNumber(),
            'address' => fake()->address(),
        ]);
    }
}