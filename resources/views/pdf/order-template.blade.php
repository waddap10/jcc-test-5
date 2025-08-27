<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>{{ $title ?? 'BEO Document' }}</title>
    
    {{-- Include external CSS file for cleaner code --}}
    <style>
        {!! file_get_contents(resource_path('css/pdf-styles.css')) !!}
    </style>
</head>
<body>
    <!-- Static Header -->
    <div class="page-header">
        <table class="header-table">
            <tr>
                <td class="header-left">
                    <strong>PUSAT PENGELOLAAN KOMPLEK</strong><br>
                    <strong>GELORA BUNG KARNO</strong>
                </td>
                <td class="header-center">
                    <strong>BANQUET EVENT ORDER</strong>
                </td>
                <td class="header-right">
                    <strong>DEPARTEMEN</strong><br>
                    <strong>BIDANG SALES MAKETING</strong>
                </td>
            </tr>
            <tr>
                <td class="header-left">
                    @if(isset($logo_gbk_base64) && $logo_gbk_base64)
                        <img src="{{ $logo_gbk_base64 }}" alt="Logo GBK" class="header-logo">
                    @else
                        <div style="text-align: center; font-size: 10px; padding: 15px;">GBK Logo</div>
                    @endif
                </td>
                <td class="header-center">
                    <strong>UNIT USAHA: JAKARTA INTERNATIONAL CONVENTION CENTER</strong>
                </td>
                <td class="header-right">
                    @if(isset($logo_jicc_base64) && $logo_jicc_base64)
                        <img src="{{ $logo_jicc_base64 }}" alt="Logo JICC" class="header-logo">
                    @else
                        <div style="text-align: center; font-size: 10px; padding: 15px;">JICC Logo</div>
                    @endif
                </td>
            </tr>
        </table>
    </div>

    <!-- Main Content Area -->
    <div class="page-content">
        <div class="content-area">
            <!-- Title Section - Now Centered -->
            <div class="title-section">
                <h2>BANQUET EVENT ORDER "{{ $order->event_name ?? 'N/A' }}"</h2>
                <h3>Nomor : {{ $file_code }}</h3>
            </div>

            <!-- Basic Information -->
            <div class="content-section">
                <table class="info-table">
                    <tr>
                        <td class="info-label">Pengirim</td>
                        <td>TIM Sales</td>
                    </tr>
                    <tr>
                        <td class="info-label">Tanggal Dibuat</td>
                        <td>
                            @if(isset($order->created_at) && $order->created_at)
                                {{ is_string($order->created_at) ? 
                                   \Carbon\Carbon::parse($order->created_at)->format('d-m-Y H:i') : 
                                   $order->created_at->format('d-m-Y H:i') }}
                            @else
                                N/A
                            @endif
                        </td>
                    </tr>
                    <tr>
                        <td class="info-label">Kepada</td>
                        <td>
                            @if(isset($order->beos) && count($order->beos) > 0)
                                @foreach($order->beos as $index => $beo)
                                    {{ $beo['department']['name'] ?? 'Unknown Department' }}@if($index < count($order->beos) - 1), @endif
                                @endforeach
                            @else
                                All Departments
                            @endif
                        </td>
                    </tr>
                    <tr>
                        <td class="info-label">Event</td>
                        <td>{{ $order->event_name ?? 'N/A' }}</td>
                    </tr>
                    <tr>
                        <td class="info-label">Lampiran</td>
                        <td>*Data dukung informasi event</td>
                    </tr>
                </table>
            </div>

            <!-- Customer Information -->
            <div class="content-section">
                <div class="section-title">Customer Information</div>
                <table class="info-table">
                    <tr>
                        <td class="info-label">Penyelenggara</td>
                        <td>{{ $order->customer['organizer'] ?? 'N/A' }}</td>
                    </tr>
                    <tr>
                        <td class="info-label">Event</td>
                        <td>{{ $order->event_name ?? 'N/A' }}</td>
                    </tr>
                    <tr>
                        <td class="info-label">Alamat</td>
                        <td>{{ $order->customer['address'] ?? 'N/A' }}</td>
                    </tr>
                    <tr>
                        <td class="info-label">Informasi Kontak</td>
                        <td>{{ $order->customer['contact_person'] ?? 'N/A' }}</td>
                    </tr>
                    <tr>
                        <td class="info-label">No Telepon</td>
                        <td>{{ $order->customer['phone'] ?? 'N/A' }}</td>
                    </tr>
                    <tr>
                        <td class="info-label">Email</td>
                        <td>{{ $order->customer['email'] ?? 'N/A' }}</td>
                    </tr>
                </table>
            </div>

            <!-- Schedule Section -->
            @if(isset($order->schedules) && count($order->schedules) > 0)
                <div class="content-section">
                    <div class="section-title">Schedule</div>
                    <table class="schedule-table">
                        <thead>
                            <tr>
                                <th>Date Range</th>
                                <th>Time Range</th>
                                <th>Function</th>
                                <th>People</th>
                            </tr>
                        </thead>
                        <tbody>
                            @foreach($order->schedules as $schedule)
                                <tr>
                                    <td>
                                        @if(isset($schedule['date_range']) && $schedule['date_range'])
                                            {{ $schedule['date_range'] }}
                                        @elseif(isset($schedule['start_date']) && isset($schedule['end_date']))
                                            @php
                                                $startDate = \Carbon\Carbon::parse($schedule['start_date'])->format('d/m/y');
                                                $endDate = \Carbon\Carbon::parse($schedule['end_date'])->format('d/m/y');
                                            @endphp
                                            {{ $startDate === $endDate ? $startDate : $startDate . ' – ' . $endDate }}
                                        @else
                                            N/A
                                        @endif
                                    </td>
                                    <td>
                                        @if(isset($schedule['time_start']) && isset($schedule['time_end']))
                                            {{ \Carbon\Carbon::parse($schedule['time_start'])->format('H:i') }} –
                                            {{ \Carbon\Carbon::parse($schedule['time_end'])->format('H:i') }}
                                        @else
                                            N/A
                                        @endif
                                    </td>
                                    <td>
                                        @if(isset($schedule['function']))
                                            @php
                                                $functionLabels = ['1' => 'Loading In', '2' => 'Show', '3' => 'Loading Out'];
                                            @endphp
                                            {{ $functionLabels[$schedule['function']] ?? $schedule['function'] }}
                                        @else
                                            —
                                        @endif
                                    </td>
                                    <td>{{ isset($schedule['people']) ? $schedule['people'] . ' people' : '—' }}</td>
                                </tr>
                            @endforeach
                        </tbody>
                    </table>

                    {{-- Schedule Notes --}}
                    @foreach($order->schedules as $schedule)
                        @if(isset($schedule['notes']) && $schedule['notes'])
                            <div style="margin-top: 10px; padding: 8px; background-color: #fff3cd; border-left: 4px solid #000; font-size: 10px;">
                                <strong>Schedule Notes:</strong> {{ $schedule['notes'] }}
                            </div>
                        @endif
                    @endforeach
                </div>
            @endif

            <!-- BEO Departments -->
            @if(isset($order->beos) && count($order->beos) > 0)
                <div class="content-section">
                    <div class="section-title">BEO Departments</div>
                    @foreach($order->beos as $beo)
                        <div class="beo-item-two-column">
                            <div class="beo-left-column">
                                <div class="beo-info">
                                    <div class="beo-header">
                                        {{ $beo['department']['name'] ?? 'Unknown Department' }}
                                        @if(isset($beo['user']['name']))
                                            - PIC: {{ $beo['user']['name'] }}
                                            @if(isset($beo['user']['phone']))
                                                ({{ $beo['user']['phone'] }})
                                            @endif
                                        @endif
                                    </div>

                                    <div class="beo-content">
                                        @if(isset($beo['package']))
                                            <div class="package-info">
                                                {{ $beo['package']['name'] }}
                                            </div>
                                            @if(isset($beo['package']['description']) && $beo['package']['description'])
                                                <p style="margin: 5px 0; font-size: 10px;">
                                                    <strong>Package Description:</strong> {{ $beo['package']['description'] }}
                                                </p>
                                            @endif
                                        @endif

                                        @if(isset($beo['notes']) && $beo['notes'])
                                            <p style="margin: 5px 0; font-size: 10px;">
                                                <strong>Notes:</strong> {{ $beo['notes'] }}
                                            </p>
                                        @endif
                                    </div>
                                </div>
                            </div>

                            <div class="beo-right-column">
                                @if(isset($beo['attachments']) && count($beo['attachments']) > 0)
                                    @php
                                        $imageAttachments = collect($beo['attachments'])->filter(function ($attachment) {
                                            return isset($attachment['base64_data']) && $attachment['base64_data'];
                                        });
                                    @endphp

                                    @if($imageAttachments->count() > 0)
                                        <div class="beo-images-enlarged">
                                            <strong style="font-size: 11px; display: block; margin-bottom: 10px;">
                                                Images ({{ $imageAttachments->count() }}):
                                            </strong>
                                            @foreach($imageAttachments->take(3) as $attachment)
                                                <div class="beo-image-item-large">
                                                    <img src="{{ $attachment['base64_data'] }}" 
                                                        alt="{{ basename($attachment['file_name']) }}"
                                                        class="beo-attachment-image-large">
                                                    <div class="image-filename-large">
                                                        {{ Str::limit(basename($attachment['file_name']), 20) }}
                                                    </div>
                                                </div>
                                            @endforeach
                                            @if($imageAttachments->count() > 3)
                                                <div style="font-size: 10px; color: #666; margin-top: 10px; text-align: center;">
                                                    +{{ $imageAttachments->count() - 3 }} more images
                                                </div>
                                            @endif
                                        </div>
                                    @else
                                        <div class="no-images-message">
                                            Images available but not displayed (format/size issues)
                                        </div>
                                    @endif
                                @else
                                    <div class="no-images-message">No images</div>
                                @endif
                            </div>
                        </div>
                    @endforeach
                </div>
            @endif

            <!-- Order Images Section -->
            @if(isset($order->attachments) && count($order->attachments) > 0)
                @php
                    $orderImageAttachments = collect($order->attachments)->filter(function ($attachment) {
                        return isset($attachment['base64_data']) && $attachment['base64_data'];
                    });
                @endphp
                @if($orderImageAttachments->count() > 0)
                    <div class="content-section">
                        <div class="section-title">Order Images</div>
                        <div class="order-images-fullwidth">
                            @foreach($orderImageAttachments->take(8) as $attachment)
                                <div class="order-image-item-fullwidth">
                                    <div class="order-image-container">
                                        <img src="{{ $attachment['base64_data'] }}"
                                            alt="{{ basename($attachment['file_name']) }}"
                                            class="order-attachment-image-fullwidth">
                                    </div>
                                    <div class="order-image-details">
                                        <div class="image-filename-fullwidth">
                                            {{ Str::limit(basename($attachment['file_name']), 40) }}
                                        </div>
                                        <div class="image-date-fullwidth">
                                            @if(isset($attachment['created_at']) && $attachment['created_at'])
                                                {{ \Carbon\Carbon::parse($attachment['created_at'])->format('d/m/Y H:i') }}
                                            @else
                                                {{ date('d/m/Y H:i') }}
                                            @endif
                                        </div>
                                    </div>
                                </div>
                            @endforeach
                            @if($orderImageAttachments->count() > 8)
                                <div class="more-images-notice">
                                    +{{ $orderImageAttachments->count() - 8 }} more images not displayed
                                </div>
                            @endif
                        </div>
                    </div>
                @endif
            @endif

            <!-- Document Information -->
            <div class="content-section">
                <div class="section-title">Document Information</div>
                <table class="info-table">
                    <tr>
                        <td class="info-label">Generated</td>
                        <td>{{ $date }} {{ $time }}</td>
                    </tr>
                    <tr>
                        <td class="info-label">Prepared By</td>
                        <td>Sales</td>
                    </tr>
                    <tr>
                        <td class="info-label">Status</td>
                        <td>{{ $status }}</td>
                    </tr>
                    <tr>
                        <td class="info-label">File Code</td>
                        <td>{{ $file_code }}</td>
                    </tr>
                </table>
            </div>
        </div>
    </div>
</body>
</html>