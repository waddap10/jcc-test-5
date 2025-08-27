<?php

namespace App\Http\Controllers;

use Illuminate\Http\Controller;
use Barryvdh\DomPDF\Facade\Pdf;

class PDFController extends Controller
{
    public function generateMultiPagePDF()
    {
        // Example with long content that will span multiple pages
        $longContent = $this->generateLongContent();
        
        $data = [
            // Header data (appears on every page)
            'document_id' => 'RPT-2025-001',
            'document_type' => 'Financial Report',
            'date' => date('Y-m-d'),
            'time' => date('H:i'),
            'department' => 'Finance Department',
            'prepared_by' => 'John Doe',
            'status' => 'Final',
            'title' => 'Annual Financial Analysis Report 2024',
            
            // Method 1: Use sections array for structured content
            'sections' => [
                [
                    'title' => 'Executive Summary',
                    'content' => '<p>' . str_repeat('This is the executive summary content. ', 50) . '</p>',
                    'page_break' => false
                ],
                [
                    'title' => 'Financial Overview',
                    'content' => $this->getFinancialTables(),
                    'page_break' => true // Force new page after this section
                ],
                [
                    'title' => 'Detailed Analysis',
                    'content' => '<p>' . str_repeat('Detailed analysis content goes here. ', 100) . '</p>',
                    'page_break' => false
                ],
                [
                    'title' => 'Market Trends',
                    'content' => '<p>' . str_repeat('Market trends and analysis. ', 80) . '</p>',
                    'page_break' => true
                ],
                [
                    'title' => 'Risk Assessment',
                    'content' => '<p>' . str_repeat('Risk assessment details. ', 60) . '</p>',
                    'page_break' => false
                ],
                [
                    'title' => 'Conclusions',
                    'content' => '<p>' . str_repeat('Final conclusions and recommendations. ', 40) . '</p>',
                    'page_break' => false
                ]
            ]
        ];
        
        // Configure PDF options for multi-page
        $pdf = Pdf::loadView('pdf.multipage-template', $data)
            ->setPaper('A4', 'portrait')
            ->setOptions([
                'dpi' => 150,
                'defaultFont' => 'Arial',
                'isRemoteEnabled' => true, // For Bootstrap CDN
                'isHtml5ParserEnabled' => true,
                'isPhpEnabled' => true
            ]);
        
        return $pdf->download('multi-page-report.pdf');
    }
    
    // Alternative method: Simple long content
    public function generateSimpleLongPDF()
    {
        $data = [
            'document_id' => 'DOC-001',
            'date' => date('Y-m-d'),
            'department' => 'Operations',
            'title' => 'Long Document Example',
            
            // Method 2: Single long content block
            'content' => $this->generateVeryLongContent()
        ];
        
        $pdf = Pdf::loadView('pdf.multipage-template', $data);
        return $pdf->download('long-document.pdf');
    }
    
    private function generateLongContent()
    {
        $content = '<h3>Introduction</h3>';
        $content .= '<p>' . str_repeat('This is sample content that will create a very long document. ', 100) . '</p>';
        
        for ($i = 1; $i <= 10; $i++) {
            $content .= "<h4>Section {$i}</h4>";
            $content .= '<p>' . str_repeat("Content for section {$i}. This will make the document longer. ", 50) . '</p>';
            
            if ($i % 3 == 0) {
                $content .= '<div class="page-break"></div>'; // Force page break
            }
        }
        
        return $content;
    }
    
    private function getFinancialTables()
    {
        return '
            <table class="table table-bordered">
                <thead>
                    <tr><th>Item</th><th>Q1</th><th>Q2</th><th>Q3</th><th>Q4</th></tr>
                </thead>
                <tbody>
                    <tr><td>Revenue</td><td>$100K</td><td>$120K</td><td>$140K</td><td>$160K</td></tr>
                    <tr><td>Expenses</td><td>$80K</td><td>$90K</td><td>$100K</td><td>$110K</td></tr>
                    <tr><td>Profit</td><td>$20K</td><td>$30K</td><td>$40K</td><td>$50K</td></tr>
                </tbody>
            </table>
            <p>' . str_repeat('Additional financial analysis content. ', 30) . '</p>';
    }
    
    private function generateVeryLongContent()
    {
        $content = '';
        for ($page = 1; $page <= 5; $page++) {
            $content .= "<h2>Page {$page} Content</h2>";
            $content .= '<p>' . str_repeat("This is content for page {$page}. It contains detailed information that spans multiple lines and paragraphs. ", 80) . '</p>';
            
            if ($page < 5) {
                $content .= '<div class="page-break"></div>';
            }
        }
        return $content;
    }
}