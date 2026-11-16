<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;

// Required from within the {locale}, auth + staff group; explicit admin middleware.
Route::post('/admin/solutions/inquiries/{inquiry}/decision',
    [\App\Http\Controllers\Admin\BooketikCommercialInquiryDecisionController::class, 'store'])
    ->whereUuid('inquiry')
    ->middleware(['admin', 'throttle:10,1'])
    ->name('admin.solutions.inquiries.decision');
