<?php

namespace Database\Seeders;

use App\Models\Department;
use Illuminate\Database\Seeder;

class DepartmentSeeder extends Seeder
{
    public function run(): void
    {
        $departments = [
            'Front Desk',
            'Housekeeping',
            'Maintenance',
            'Security',
            'Food & Beverage',
            'Sales & Marketing',
            'Accounting & Finance',
            'Human Resources',
            'IT Support',
            'Events',
            'Engineering',
        ];

        foreach ($departments as $departmentName) {
            Department::create([
                'name' => $departmentName,
            ]);
        }
    }
}