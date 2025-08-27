<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Venue;

class VenueSeeder extends Seeder
{
    public function run(): void
    {
        $venues = [
            ['name' => 'Exhibition Hall A', 'short' => 'Hall A'],
            ['name' => 'Connecting Corridor', 'short' => 'Corridor'],
            ['name' => 'Exhibition Hall B', 'short' => 'Hall B'],
            ['name' => 'Cendrawasih Room', 'short' => 'Cendrawasih'],
            ['name' => 'Plenary Hall', 'short' => 'Plenary'],
            ['name' => 'Assembly Hall', 'short' => 'Assembly'],
            ['name' => 'Merak Room', 'short' => 'Merak'],
            ['name' => 'Nuri Room', 'short' => 'Nuri'],
            ['name' => 'Kakaktua Room', 'short' => 'Kakaktua'],
            ['name' => 'Kenari Room', 'short' => 'Kenari'],
            ['name' => 'Murai Room', 'short' => 'Murai'],
            ['name' => 'Maleo Room', 'short' => 'Maleo'],
            ['name' => 'Summit Room', 'short' => 'Summit'],
            ['name' => 'Kasuari Lounge', 'short' => 'Kasuari'],
            ['name' => 'Meeting Room 1', 'short' => 'Meeting 1'],
            ['name' => 'Meeting Room 2', 'short' => 'Meeting 2'],
        ];

        foreach ($venues as $venue) {
            Venue::create([
                'name' => $venue['name'],
                'short' => $venue['short'],
                'photo' => 'venues/photos/sample-' . fake()->uuid() . '.jpg',
                'description' => fake()->paragraph(3),
                'dimension_m' => fake()->randomElement(['10 x 20', '15 x 25', '20 x 30', '12 x 18', '25 x 40']),
                'dimension_f' => fake()->randomElement(['32 x 65', '49 x 82', '65 x 98', '39 x 59', '82 x 131']),
                'setup_banquet' => fake()->numberBetween(50, 300),
                'setup_classroom' => fake()->numberBetween(30, 200),
                'setup_theater' => fake()->numberBetween(50, 400),
                'setup_reception' => fake()->numberBetween(60, 350),
                'floor_plan' => 'venues/floor-plans/plan-' . fake()->uuid() . '.pdf',
            ]);
        }
    }
}