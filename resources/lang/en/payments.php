<?php

declare(strict_types=1);

/**
 * Checkout instructions, served with the charge rather than held in each client.
 *
 * The steps differ per channel and per gateway, and there are three clients —
 * the site, the app, and the admin preview. Keeping the wording here
 * means changing it is a deploy rather than an app release, and that the three
 * cannot drift into telling a buyer three different things.
 *
 * Locales without their own file fall back to this one.
 *
 * **English only, for now, and deliberately.** A `resources/lang/id/` directory
 * is a claim that the whole panel renders in Indonesian — LocaleSetsTest
 * asserts that the directories on disk and the panel's offered locales are the
 * same set, precisely because a half-translated locale changes the URL to
 * `/id/` and leaves the page in English. Add Indonesian only with the full
 * string set behind it.
 */
return [
    'qris_step_1' => 'Open any app that scans QRIS — GoPay, DANA, OVO, ShopeePay, or your bank app.',
    'qris_step_2' => 'Scan the code and check that the amount matches before you confirm.',
    'qris_step_3' => 'Your tickets are issued automatically once the payment clears. Keep this page open.',

    'va_step_1' => 'Copy the virtual account number below.',
    'va_step_2' => 'Pay it from your bank app, ATM, or internet banking before the deadline.',
    'va_step_3' => 'Your tickets are issued automatically once the bank confirms the transfer.',

    'ewallet_step_1' => 'Tap the button to open your e-wallet app.',
    'ewallet_step_2' => 'Check the amount, then confirm the payment.',
    'ewallet_step_3' => 'Come back here — your tickets are issued as soon as the payment clears.',

    'expired' => 'This payment code has expired. Generate a new one to try again.',
    'pending' => 'Payment received. Your account will update as soon as the bank confirms it.',
];
