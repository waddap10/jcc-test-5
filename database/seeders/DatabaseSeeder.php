<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            VenueSeeder::class,
            DepartmentSeeder::class,
            CustomerSeeder::class,
            RoleSeeder::class,
            UserSeeder::class,
            PackageSeeder::class,
            EventSeeder::class,
        ]);
    }
}
