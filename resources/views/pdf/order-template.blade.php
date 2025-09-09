<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <title>{{ $title ?? 'BEO Document' }}</title>
    <style>
        @page {
            margin: 25mm 8mm 13mm 8mm;
            /* Convert all to mm */
            size: A4;
        }

        body {
            font-family: DejaVu Sans, Arial, sans-serif;
            font-size: 9px;
            margin: 0;
            padding: 0;
            line-height: 1.3;
            color: #000;
        }

        .page-header {
            position: fixed;
            top: -21mm;
            left: 0;
            right: 0;
            width: 100%;
            height: 21mm;
            border: 1px solid #000;
            background: white;
            z-index: 1000;
        }

        .header-table {
            width: 100%;
            margin: 0;
            height: 100%;
            border-collapse: collapse;
            border: none;
        }

        .header-table td {
            border-right: 1px solid #000;
            border-bottom: 1px solid #000;
            padding: 1mm 1.5mm;
            vertical-align: middle;
            font-size: 9px;
            color: #000;
            text-align: center;
        }

        .header-table td:last-child {
            border-right: none;
        }

        .header-table .header-left {
            width: 25%;
        }

        .header-table .header-center {
            width: 50%;
        }

        .header-table .header-right {
            width: 25%;
        }

        .header-logo {
            max-width: 60px;
            max-height: 40px;
            width: auto;
            height: auto;
            display: block;
            margin: 0 auto;
        }

        .logo-placeholder {
            text-align: center;
            font-size: 9px;
            padding: 10px;
        }

        /* Fixed Footer with Page Numbers */
        .page-footer {
            position: fixed;
            bottom: -11mm;
            /* Convert 40px ≈ 11mm */
            left: 0;
            right: 0;
            height: 8mm;
            /* Convert 30px ≈ 8mm */
            text-align: center;
            font-size: 9px;
            border-top: 1px solid #000;
            background: white;
            padding: 2mm 0;
            /* Convert 8px ≈ 2mm */
        }

        /* Title Section */
        .title-section {
            text-align: center;
            padding: 5px 0;
            margin-bottom: 0;
        }

        .title-section h2 {
            text-decoration: underline;
            margin-bottom: 5px;
            font-size: 12px;
        }

        .title-section h3 {
            text-decoration: underline;
            font-size: 10px;
            margin: 0;
        }

        /* Main Content */
        .page-content {
            padding: 0;
            margin: 0;
        }

        .content-area {
            border-left: 1px solid #000;
            border-right: 1px solid #000;
            border-bottom: 1px solid #000;
            /* Add this line */
            padding: 0;
            width: 100%;

        }

        .content-section {
            border-bottom: 1px solid #000;
            padding: 1mm 1.5mm;
            margin-bottom: 0;
            page-break-inside: avoid;
            min-height: 40px;
        }



        .content-section:last-child {
            border-bottom: none;
        }

        /* Section Titles */
        .section-title {
            font-size: 10px;
            font-weight: bold;
            color: #000;
            margin: 4px 0 2px 0;
            padding-bottom: 1px;
            border-bottom: 1px solid #000;
        }

        /* Tables */
        .info-table {
            width: 100%;
            margin-bottom: 4px;
            border-collapse: collapse;
        }

        .info-table td {
            padding: 1mm 1.5mm;
            border: 1px solid #000;
            vertical-align: top;
            font-size: 9px;
            color: #000;
            line-height: 1.2;
        }

        .info-label {
            font-weight: bold;
            background-color: #f5f5f5;
            width: 25%;
        }

        .schedule-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 4px;
            font-size: 9px;
            page-break-inside: avoid;
            margin-bottom: 4px;
        }

        .schedule-table th,
        .schedule-table td {
            border: 1px solid #000;
            padding: 4px;
            text-align: left;
            color: #000;
        }

        .schedule-table th {
            background-color: #f5f5f5;
            font-weight: bold;
        }

        /* Schedule Notes */
        .schedule-notes {
            margin-top: 4px;
            padding: 4px;
            background-color: #fff3cd;
            border-left: 4px solid #000;
            font-size: 9px;
        }

        /* BEO Section - Two Column Layout */
        .beo-item-two-column {
            border: 1px solid #000;
            margin-bottom: 4px;
            background-color: #fafafa;
            padding: 0;
            display: table;
            width: 100%;
            table-layout: fixed;
            min-height: 100px;
            page-break-inside: avoid;
        }

        .beo-left-column {
            display: table-cell;
            width: 45%;
            vertical-align: top;
            padding: 8px;
            border-right: 1px solid #ddd;
        }

        .beo-right-column {
            display: table-cell;
            width: 55%;
            vertical-align: top;
            padding: 8px;
        }

        .beo-info {
            margin-bottom: 0;
        }

        .beo-header {
            font-weight: bold;
            color: #000;
            margin-bottom: 4px;
            font-size: 9px;
            line-height: 1.2;
        }

        .beo-content {
            font-size: 9px;
            line-height: 1.2;
            color: #000;
        }

        .package-info {
            background-color: #000;
            color: white;
            padding: 2px 4px;
            display: inline-block;
            margin-bottom: 4px;
            font-size: 9px;
            border-radius: 2px;
        }

        /* BEO Content Paragraphs */
        .beo-description {
            margin: 2px 0;
            font-size: 9px;
        }

        .beo-notes {
            margin: 2px 0;
            font-size: 9px;
        }

        /* BEO Images */
        .beo-images-enlarged {
            width: 100%;
        }

        .beo-image-item-large {
            margin-bottom: 8px;
            text-align: center;
            page-break-inside: avoid;
        }

        .beo-attachment-image-large {
            max-width: 100%;
            width: auto;
            height: auto;
            max-height: 150px;
            border: 1px solid #ddd;
            display: block;
            margin: 0 auto 3px auto;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        }

        .image-filename-large {
            font-size: 9px;
            margin-top: 2px;
            color: #666;
            text-align: center;
            font-weight: bold;
        }

        .images-label {
            font-size: 9px;
            display: block;
            margin-bottom: 5px;
        }

        .more-images-count {
            font-size: 9px;
            color: #666;
            margin-top: 5px;
            text-align: center;
        }

        .no-images-message {
            font-size: 9px;
            color: #666;
            font-style: italic;
            text-align: center;
            padding: 15px 0;
            border: 1px dashed #ccc;
            background-color: #f9f9f9;
        }

        /* Order Images - Full Width WITHOUT borders */
        .order-images-fullwidth {
            width: 100%;
            margin: 0;
            padding: 0;
        }

        .order-image-item-fullwidth {
            width: 100%;
            margin-bottom: 10px;
            background-color: #fff;
            page-break-inside: avoid;
            overflow: hidden;
        }

        .order-image-container {
            width: 100%;
            text-align: center;
            padding: 5px;
            background-color: #f9f9f9;
        }

        .order-attachment-image-fullwidth {
            width: 100%;
            height: auto;
            display: block;
            margin: 0 auto;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .order-image-details {
            padding: 4px 6px;
            background-color: #fff;
            border-top: 1px solid #eee;
        }

        .image-filename-fullwidth {
            font-size: 9px;
            font-weight: bold;
            color: #333;
            margin-bottom: 2px;
            word-break: break-word;
        }

        .image-date-fullwidth {
            font-size: 9px;
            color: #666;
            font-style: italic;
        }

        .more-images-notice {
            font-size: 9px;
            color: #666;
            text-align: center;
            padding: 8px;
            background-color: #f5f5f5;
            border: 1px dashed #ccc;
            border-radius: 3px;
            font-style: italic;
        }

        /* 3-Column Catatan Tambahan Layout */
        .catatan-container {
            display: table;
            width: 100%;
            table-layout: fixed;
            border-collapse: separate;
            border-spacing: 0;
        }

        .catatan-left {
            display: table-cell;
            width: 50%;
            vertical-align: top;
            font-size: 9px;
            line-height: 1.3;
            padding: 4px 8px 4px 0;
        }

        .catatan-center {
            display: table-cell;
            width: 25%;
            vertical-align: top;
            font-size: 9px;
            line-height: 1.3;
            padding: 4px;
            text-align: center;
        }

        .catatan-right {
            display: table-cell;
            width: 25%;
            vertical-align: top;
            font-size: 9px;
            line-height: 1.3;
            padding: 4px 0 4px 8px;
            text-align: center;
        }

        .catatan-left strong {
            font-weight: bold;
        }

        .signature-space {
            height: 30px;
            margin-bottom: 3px;
        }

        /* Page break utilities */
        .page-break {
            page-break-before: always;
        }
    </style>
</head>

<body>
    <!-- Fixed Header - Will appear on every page automatically -->
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
                        <div class="logo-placeholder">GBK Logo</div>
                    @endif
                </td>
                <td class="header-center">
                    <strong>UNIT USAHA: JAKARTA INTERNATIONAL CONVENTION CENTER</strong>
                </td>
                <td class="header-right">
                    @if(isset($logo_jicc_base64) && $logo_jicc_base64)
                        <img src="{{ $logo_jicc_base64 }}" alt="Logo JICC" class="header-logo">
                    @else
                        <div class="logo-placeholder">JICC Logo</div>
                    @endif
                </td>
            </tr>
        </table>
    </div>

    <!-- Fixed Footer with Page Numbers -->
    <div class="page-footer">
        <script type="text/php">
            if (isset($pdf)) {
                $text = "Page {PAGE_NUM}";
                $size = 9;
                $font = $fontMetrics->getFont("DejaVu Sans");
                $width = $fontMetrics->get_text_width($text, $font, $size) / 2;
                $x = ($pdf->get_width() - $width) / 2;
                $y = $pdf->get_height() - 35;
                $pdf->page_text($x, $y, $text, $font, $size);
            }
        </script>
    </div>

    <!-- Main Content Area -->
    <div class="page-content">
        <div class="content-area">
            <!-- Title Section -->
            <div class="title-section">
                <h2>BANQUET EVENT ORDER "{{ $order->event_name ?? 'N/A' }}"</h2>
                <h3>Nomor : {{ $file_code }}</h3>
            </div>

            <!-- Basic Information -->
            <div class="content-section" style="border-top: 1px solid #000;">
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
                                    {{ $beo['department']['name'] ?? 'Unknown Department' }}@if($index < count($order->beos) - 1),
                                    @endif
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

                    @foreach($order->schedules as $schedule)
                        @if(isset($schedule['notes']) && $schedule['notes'])
                            <div class="schedule-notes">
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
                                                <p class="beo-description">
                                                    <strong>Package Description:</strong> {{ $beo['package']['description'] }}
                                                </p>
                                            @endif
                                        @endif

                                        @if(isset($beo['notes']) && $beo['notes'])
                                            <p class="beo-notes">
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
                                            <strong class="images-label">
                                                Images ({{ $imageAttachments->count() }}):
                                            </strong>
                                            @foreach($imageAttachments->take(3) as $attachment)
                                                <div class="beo-image-item-large">
                                                    <img src="{{ $attachment['base64_data'] }}"
                                                        alt="{{ basename($attachment['file_name']) }}" class="beo-attachment-image-large">
                                                    <div class="image-filename-large">
                                                        {{ Str::limit(basename($attachment['file_name']), 20) }}
                                                    </div>
                                                </div>
                                            @endforeach
                                            @if($imageAttachments->count() > 3)
                                                <div class="more-images-count">
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
            @endiff 

            <!-- Additional Notes Section -->
            <div class="content-section">
                <div class="catatan-container">
                    <div class="catatan-left">
                        <strong>Catatan Tambahan :</strong><br>
                        *Untuk menjadi perhatian seluruh Departemen apabila terdapat perubahan dan additional
                        request<br>
                        *Diharapkan membaca rundown yang terlampir<br>
                        <strong>Diketahui dan didistribusikan kepada :</strong><br>
                        *Seluruh Departemen
                    </div>
                    <div class="catatan-center">
                        <div class="signature-space"></div>
                        <div>Dibuat oleh,<br>Sales Marketing<br>Unit Gedung Konvensi</div>
                    </div>
                    <div class="catatan-right">
                        <div class="signature-space"></div>
                        <div>Disetujui oleh,<br>Plt. Kepala Unit<br>Gedung Konvensi</div>
                    </div>
                </div>
            </div>

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
                                        <img src="{{ $attachment['base64_data'] }}" alt="{{ basename($attachment['file_name']) }}"
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
        </div>
    </div>
</body>

</html>