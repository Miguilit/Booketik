<?php

declare(strict_types=1);

/**
 * Checkout instructions, served with the charge rather than held in each client.
 * French translation of resources/lang/en/payments.php — keep the keys in sync.
 */
return [
    'qris_step_1' => 'Ouvrez n’importe quelle application qui scanne les QRIS — GoPay, DANA, OVO, ShopeePay ou l’application de votre banque.',
    'qris_step_2' => 'Scannez le code et vérifiez que le montant correspond avant de confirmer.',
    'qris_step_3' => 'Vos billets sont émis automatiquement dès que le paiement est validé. Gardez cette page ouverte.',

    'va_step_1' => 'Copiez le numéro de compte virtuel ci-dessous.',
    'va_step_2' => 'Payez-le depuis l’application de votre banque, un distributeur ou votre banque en ligne avant la date limite.',
    'va_step_3' => 'Vos billets sont émis automatiquement dès que la banque confirme le virement.',

    'ewallet_step_1' => 'Appuyez sur le bouton pour ouvrir votre application de portefeuille électronique.',
    'ewallet_step_2' => 'Vérifiez le montant, puis confirmez le paiement.',
    'ewallet_step_3' => 'Revenez ici — vos billets sont émis dès que le paiement est validé.',

    'expired' => 'Ce code de paiement a expiré. Générez-en un nouveau pour réessayer.',
    'pending' => 'Paiement reçu. Votre compte sera mis à jour dès que la banque l’aura confirmé.',
];
