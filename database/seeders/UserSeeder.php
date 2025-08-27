<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Department;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $this->createAdminUsers();
        $this->createDepartmentPics();
    }

    private function createAdminUsers(): void
    {
        $adminUsers = [
            ['username' => 'admin', 'name' => 'Administrator', 'role' => 'admin'],
            ['username' => 'kanit', 'name' => 'Kanit', 'role' => 'kanit'],
            ['username' => 'sales', 'name' => 'Sales', 'role' => 'sales'],
        ];

        foreach ($adminUsers as $userData) {
            $user = User::firstOrCreate(
                ['username' => $userData['username']],
                [
                    'name' => $userData['name'],
                    'password' => bcrypt('qwerty123'),
                    'phone' => fake()->phoneNumber(),
                    'department_id' => null,
                ]
            );

            $user->assignRole($userData['role']);

            if (empty($user->phone)) {
                $user->update(['phone' => fake()->phoneNumber()]);
            }
        }
    }

    private function createDepartmentPics(): void
    {
        Department::all()->each(function (Department $department) {
            for ($i = 1; $i <= 3; $i++) {
                $firstName = fake()->unique()->firstName();
                
                $username = Str::slug($firstName);

                $user = User::create([
                    'name' => $firstName,
                    'username' => $username,
                    'password' => bcrypt('qwerty123'),
                    'phone' => fake()->phoneNumber(),
                    'department_id' => $department->id,
                ]);

                $user->assignRole('pic');
            }
        });
    }
}