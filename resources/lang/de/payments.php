<?php

declare(strict_types=1);

/**
 * Checkout instructions (German), served with the charge rather than held in each client.
 */
return [
    'qris_step_1' => 'Öffne eine App, die QRIS scannen kann – GoPay, DANA, OVO, ShopeePay oder deine Banking-App.',
    'qris_step_2' => 'Scanne den Code und prüfe vor dem Bestätigen, ob der Betrag stimmt.',
    'qris_step_3' => 'Deine Tickets werden automatisch ausgestellt, sobald die Zahlung eingegangen ist. Lass diese Seite geöffnet.',

    'va_step_1' => 'Kopiere die Nummer des virtuellen Kontos unten.',
    'va_step_2' => 'Bezahle sie vor Ablauf der Frist über deine Banking-App, am Geldautomaten oder per Online-Banking.',
    'va_step_3' => 'Deine Tickets werden automatisch ausgestellt, sobald die Bank die Überweisung bestätigt.',

    'ewallet_step_1' => 'Tippe auf den Button, um deine E-Wallet-App zu öffnen.',
    'ewallet_step_2' => 'Prüfe den Betrag und bestätige dann die Zahlung.',
    'ewallet_step_3' => 'Komm hierher zurück – deine Tickets werden ausgestellt, sobald die Zahlung eingegangen ist.',

    'expired' => 'Dieser Zahlungscode ist abgelaufen. Erstelle einen neuen, um es noch einmal zu versuchen.',
    'pending' => 'Zahlung erhalten. Dein Konto wird aktualisiert, sobald die Bank sie bestätigt.',
];
