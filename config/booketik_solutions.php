<?php

declare(strict_types=1);

/**
 * Admin editor enabled through guarded R1F; public remains OFF. No env flag may silently expose this page;
 * public activation requires a separate reviewed integration release.
 */
return [
    'public_enabled' => false, // Legacy commercial integration remains OFF.
    // BOOKETIK_SOLUTIONS_R4: independent read-only public editorial landing gate.
    'presentation_public_enabled' => true,
    'admin_enabled' => true,
    'page_key' => 'solutions',
    'schema_version' => 1,
    // R1M: strictly private catalog gates. NEVER expose prices through /plus.
    'pricing_admin_enabled' => true,
    'pricing_preview_enabled' => true,
    'pricing_public_enabled' => false,
    // R1N1: private organizer-dashboard navigation only, not a commercial checkout.
    'commercial_preview_navigation_enabled' => true,
    'commercial_checkout_enabled' => false,
    'quote_intake_enabled' => false,
    'miguil_pay_enabled' => false,
];
