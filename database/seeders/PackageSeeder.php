<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Package;
use App\Models\Department;

class PackageSeeder extends Seeder
{
    public function run(): void
    {
        $departmentMapping = [
            'Front Desk' => 'front_desk',
            'Housekeeping' => 'housekeeping',
            'Maintenance' => 'maintenance',
            'Security' => 'security',
            'Food & Beverage' => 'food_and_beverage',
            'Sales & Marketing' => 'sales_and_marketing',
            'Accounting & Finance' => 'accounting_finance',
            'Human Resources' => 'human_resources',
            'IT Support' => 'it_support',
            'Events' => 'events',
            'Engineering' => 'engineering',
        ];

        $departments = [];
        foreach ($departmentMapping as $name => $key) {
            $dept = Department::where('name', $name)->first();
            if ($dept) {
                $departments[$key] = $dept->id;
            }
        }

        $packages = [
            ['name' => 'Paket Resepsionis Dasar', 'description' => 'Layanan front desk standar termasuk check-in/out tamu, menjawab telepon, dan layanan concierge dasar.', 'department_id' => $departments['front_desk']],
            ['name' => 'Paket Layanan Tamu Premium', 'description' => 'Layanan front desk yang ditingkatkan dengan bantuan tamu yang dipersonalisasi, penanganan VIP, dan dukungan concierge 24/7.', 'department_id' => $departments['front_desk']],
            ['name' => 'Paket Resepsionis Eksekutif', 'description' => 'Manajemen front desk layanan penuh dengan staf multibahasa, koordinasi akses lounge eksekutif, dan hubungan tamu premium.', 'department_id' => $departments['front_desk']],

            ['name' => 'Paket Kebersihan Standar', 'description' => 'Pembersihan kamar dasar, penggantian linen, dan perawatan toilet untuk ruang venue.', 'department_id' => $departments['housekeeping']],
            ['name' => 'Paket Pembersihan Menyeluruh', 'description' => 'Pembersihan komprehensif termasuk cuci karpet, pembersihan jendela, dan sanitasi detail semua permukaan.', 'department_id' => $departments['housekeeping']],
            ['name' => 'Paket Housekeeping Mewah', 'description' => 'Layanan pembersihan premium dengan produk ramah lingkungan, pengaturan dekoratif, dan perawatan khusus untuk perlengkapan high-end.', 'department_id' => $departments['housekeeping']],

            ['name' => 'Paket Maintenance Dasar', 'description' => 'Pemeriksaan maintenance rutin, perbaikan kecil, dan servis peralatan selama acara venue.', 'department_id' => $departments['maintenance']],
            ['name' => 'Paket Maintenance Komprehensif', 'description' => 'Dukungan maintenance penuh termasuk monitoring HVAC, pemeriksaan sistem listrik, dan layanan perbaikan darurat.', 'department_id' => $departments['maintenance']],
            ['name' => 'Paket Dukungan Teknis Premium', 'description' => 'Maintenance lanjutan dengan teknisi spesialis, penjadwalan maintenance preventif, dan respons darurat prioritas.', 'department_id' => $departments['maintenance']],

            ['name' => 'Paket Keamanan Dasar', 'description' => 'Cakupan keamanan standar dengan petugas berseragam dan kontrol akses dasar untuk pintu masuk venue.', 'department_id' => $departments['security']],
            ['name' => 'Paket Keamanan Tingkat Lanjut', 'description' => 'Keamanan komprehensif dengan monitoring CCTV, kontrol kerumunan, dan layanan perlindungan VIP.', 'department_id' => $departments['security']],
            ['name' => 'Paket Keamanan Elite', 'description' => 'Layanan keamanan premium dengan petugas berpakaian sipil, sistem surveillance canggih, dan protokol keamanan acara khusus.', 'department_id' => $departments['security']],

            ['name' => 'Paket Penyegaran Continental', 'description' => 'Penyegaran ringan termasuk kopi, teh, pastry, dan snack dasar untuk tamu venue.', 'department_id' => $departments['food_and_beverage']],
            ['name' => 'Paket Katering Lengkap', 'description' => 'Layanan makan lengkap dengan appetizer, hidangan utama, dessert, dan layanan minuman termasuk setup bar.', 'department_id' => $departments['food_and_beverage']],
            ['name' => 'Paket Pengalaman Kuliner Gourmet', 'description' => 'Pengalaman kuliner premium dengan hidangan yang disiapkan chef, wine pairing, dan layanan pelayan profesional.', 'department_id' => $departments['food_and_beverage']],

            ['name' => 'Paket Promosi Dasar', 'description' => 'Dukungan marketing standar termasuk posting media sosial, flyer dasar, dan pengumuman email untuk acara venue Anda.', 'department_id' => $departments['sales_and_marketing']],
            ['name' => 'Paket Marketing Komprehensif', 'description' => 'Kampanye marketing penuh dengan fotografi profesional, manajemen media sosial, siaran pers, dan iklan bertarget.', 'department_id' => $departments['sales_and_marketing']],
            ['name' => 'Paket Pengalaman Brand Premium', 'description' => 'Solusi branding lengkap dengan materi acara custom, kemitraan influencer, liputan media, dan analitik pasca-acara.', 'department_id' => $departments['sales_and_marketing']],

            ['name' => 'Paket Pelacakan Keuangan Dasar', 'description' => 'Pelacakan pengeluaran sederhana dan pelaporan keuangan dasar untuk biaya dan pembayaran acara venue Anda.', 'department_id' => $departments['accounting_finance']],
            ['name' => 'Paket Manajemen Keuangan Komprehensif', 'description' => 'Pengawasan keuangan penuh termasuk perencanaan anggaran, manajemen pengeluaran, pemrosesan pembayaran vendor, dan pelaporan detail.', 'department_id' => $departments['accounting_finance']],
            ['name' => 'Paket Konsultasi Keuangan Eksekutif', 'description' => 'Konsultasi keuangan strategis dengan analisis ROI, rekomendasi optimasi biaya, dan perencanaan keuangan komprehensif.', 'department_id' => $departments['accounting_finance']],

            ['name' => 'Paket Koordinasi Staf Dasar', 'description' => 'Penjadwalan dan koordinasi staf sederhana untuk personel acara venue dan dukungan HR dasar.', 'department_id' => $departments['human_resources']],
            ['name' => 'Paket Manajemen SDM Komprehensif', 'description' => 'Layanan HR penuh termasuk rekrutmen staf, koordinasi pelatihan, manajemen payroll, dan hubungan karyawan.', 'department_id' => $departments['human_resources']],
            ['name' => 'Paket Solusi Tenaga Kerja Strategis', 'description' => 'Konsultasi HR lanjutan dengan akuisisi talenta, manajemen kinerja, pengawasan kepatuhan, dan pengembangan organisasi.', 'department_id' => $departments['human_resources']],

            ['name' => 'Paket Dukungan Teknis Dasar', 'description' => 'Dukungan IT esensial termasuk setup WiFi, peralatan AV dasar, dan troubleshooting teknis selama acara.', 'department_id' => $departments['it_support']],
            ['name' => 'Paket Teknologi Lanjutan', 'description' => 'Layanan IT komprehensif dengan internet berkecepatan tinggi, sistem AV profesional, kemampuan live streaming, dan dukungan teknis khusus.', 'department_id' => $departments['it_support']],
            ['name' => 'Paket Solusi IT Enterprise', 'description' => 'Infrastruktur teknologi premium dengan solusi software custom, langkah-langkah cybersecurity, layanan cloud, dan dukungan IT 24/7.', 'department_id' => $departments['it_support']],

            ['name' => 'Paket Koordinasi Acara Dasar', 'description' => 'Layanan perencanaan acara esensial termasuk pembuatan timeline, koordinasi vendor, dan manajemen acara hari-H.', 'department_id' => $departments['events']],
            ['name' => 'Paket Manajemen Acara Layanan Penuh', 'description' => 'Perencanaan acara komprehensif dengan konsultasi desain, booking hiburan, manajemen logistik, dan eksekusi acara lengkap.', 'department_id' => $departments['events']],
            ['name' => 'Paket Pengalaman Acara Mewah', 'description' => 'Perencanaan acara premium dengan tema custom, hiburan selebriti, jaringan vendor eksklusif, dan layanan white-glove sepanjang acara.', 'department_id' => $departments['events']],

            ['name' => 'Paket Dukungan Engineering Dasar', 'description' => 'Layanan engineering standar termasuk penilaian struktural, instalasi dasar, dan pemeriksaan kepatuhan keselamatan.', 'department_id' => $departments['engineering']],
            ['name' => 'Paket Engineering Komprehensif', 'description' => 'Dukungan engineering penuh dengan instalasi custom, pekerjaan listrik, optimasi sistem mekanik, dan manajemen proyek.', 'department_id' => $departments['engineering']],
            ['name' => 'Paket Solusi Engineering Lanjutan', 'description' => 'Layanan engineering khusus dengan solusi desain inovatif, integrasi sistem berkelanjutan, dan implementasi teknologi mutakhir.', 'department_id' => $departments['engineering']],
        ];

        foreach ($packages as $package) {
            Package::create($package);
        }
    }
}