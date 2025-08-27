<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Event;

class EventSeeder extends Seeder
{
    public function run(): void
    {
        $eventTypes = [
            'Conference',
            'Workshop', 
            'Seminar',
            'Webinar',
            'Training',
            'Meeting',
            'Exhibition',
            'Competition',
            'Festival',
            'Concert',
            'Sports',
            'Networking',
        ];

        foreach ($eventTypes as $eventType) {
            Event::updateOrCreate(
                ['event_type' => $eventType],
                ['event_type' => $eventType]
            );
        }
    }
}