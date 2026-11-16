<?php

declare(strict_types=1);

/*
 | Email templates (email_templates rows), by key: the French seed.
 | Placeholders are `{{ $name }}` and must stay exactly as written — the
 | i18n test fails on a missing or extra one.
 */

return [
    'verification_code' => [
        'name' => 'Code de vérification',
        'subject' => '{{ $code }} est votre code {{ $app_name }}',
        'template' => '<p>Bonjour {{ $user_name }},</p><p>Saisissez ce code sur {{ $app_name }} pour confirmer qu’il s’agit bien de vous :</p><p style="font-size:28px;font-weight:700;letter-spacing:6px">{{ $code }}</p><p>Il expire dans {{ $minutes }} minutes.</p><p>Si ce n’était pas vous, vous pouvez ignorer cet e-mail — personne ne peut utiliser votre adresse sans ce code.</p><p>À bientôt,<br>{{ $app_name }}</p>',
    ],
    'reset_password' => [
        'name' => 'Réinitialisation du mot de passe',
        'subject' => 'Réinitialisez votre mot de passe {{ $app_name }}',
        'template' => '<p>Bonjour {{ $user_name }},</p><p>Nous avons reçu une demande de réinitialisation du mot de passe de votre compte {{ $app_name }}.</p><p><a href="{{ $url }}">Choisir un nouveau mot de passe</a></p><p>Le lien expire dans {{ $minutes }} minutes. Si vous n’êtes pas à l’origine de cette demande, vous pouvez ignorer cet e-mail — votre mot de passe reste inchangé et vos billets sont en sécurité.</p><p style="font-size:12px;color:#6b7280">Si le lien ne s’ouvre pas, copiez cette adresse dans votre navigateur :<br>{{ $url }}</p>',
    ],
    'welcome' => [
        'name' => 'Bienvenue',
        'subject' => 'Bienvenue sur {{ $app_name }}',
        'template' => '<p>Bonjour {{ $user_name }},</p><p>Votre compte est prêt. Vos billets, vos événements enregistrés et les organisateurs que vous suivez vous accompagnent désormais sur le web et dans l’application.</p><p><a href="{{ $read_url }}">Découvrir ce qui se passe près de chez vous</a></p><p>Suivez quelques organisateurs que vous aimez et leurs nouveaux événements viendront à vous.</p><p>À bientôt,<br>{{ $app_name }}</p>',
    ],
    'password_changed' => [
        'name' => 'Mot de passe modifié',
        'subject' => 'Votre mot de passe {{ $app_name }} a été modifié',
        'template' => '<p>Bonjour {{ $user_name }},</p><p>Le mot de passe de votre compte {{ $app_name }} a été modifié le {{ $when }}, et tous vos autres appareils ont été déconnectés.</p><p>Si c’était vous, vous n’avez rien à faire. Sinon, <a href="{{ $reset_url }}">réinitialisez votre mot de passe dès maintenant</a> et contactez l’assistance.</p><p>{{ $app_name }}</p>',
    ],
    'newsletter_confirm' => [
        'name' => 'Confirmation de la newsletter',
        'subject' => 'Confirme ton abonnement à {{ $app_name }}',
        'template' => '<p>Quelqu’un, toi on l’espère, a demandé à inscrire {{ $email }} à la newsletter de {{ $app_name }}.</p><p><a href="{{ $confirm_url }}">Oui, m’inscrire</a></p><p>Si ce n’était pas toi, ignore cet e-mail. L’adresse n’est ajoutée à aucune liste tant que le lien n’est pas ouvert.</p>',
    ],
    'subscription_started' => [
        'name' => 'Début de Plus',
        'subject' => 'Bienvenue dans {{ $app_name }} Plus',
        'template' => '<p>Bonjour {{ $user_name }},</p><p>Votre abonnement <strong>{{ $plan_name }}</strong> est actif : pas de frais de service sur les billets jusqu’à 30 €, accès anticipé aux préventes et première place sur les listes d’attente.</p><p><strong>Payé :</strong> {{ $price }}<br><strong>Renouvellement automatique :</strong> {{ $renews }}</p><p><a href="{{ $billing_url }}">Gérer votre abonnement</a></p><p>À bientôt,<br>{{ $app_name }}</p>',
    ],
    'subscription_ended' => [
        'name' => 'Fin de Plus',
        'subject' => 'Votre abonnement {{ $app_name }} Plus ne sera pas renouvelé',
        'template' => '<p>Bonjour {{ $user_name }},</p><p>Votre abonnement <strong>{{ $plan_name }}</strong> ne sera pas renouvelé. Plus reste actif jusqu’au {{ $ends_at }}.</p><p>Vos billets et événements enregistrés restent exactement où ils sont, et vous pouvez reprendre Plus quand vous le souhaitez.</p><p><a href="{{ $pricing_url }}">Voir les formules</a></p><p>{{ $app_name }}</p>',
    ],
    'purchase_receipt' => [
        'name' => 'Reçu d’achat',
        'subject' => 'Votre achat sur {{ $app_name }}',
        'template' => '<p>Bonjour {{ $user_name }},</p><p>Merci — <strong>{{ $item_name }}</strong> a été ajouté à votre compte.</p><p><strong>Payé :</strong> {{ $amount }}<br><strong>Ajouté :</strong> {{ $granted }}</p><p><a href="{{ $shop_url }}">Votre compte</a></p><p>À bientôt,<br>{{ $app_name }}</p>',
    ],
    'ticket_created' => [
        'name' => 'Confirmation de création de demande',
        'subject' => 'Nous avons bien reçu votre demande',
        'template' => '<p>Bonjour {{ $user_name }},</p><p>Nous avons bien reçu votre demande « {{ $subject }} » et vous répondrons rapidement.</p><p>— L’assistance {{ $app_name }}</p>',
    ],
    'support_reply' => [
        'name' => 'Réponse de l’assistance',
        'subject' => 'Re : {{ $subject }}',
        'template' => '<p>Bonjour {{ $user_name }},</p><p style="white-space:pre-line">{{ $reply }}</p><p>— {{ $agent_name }}, assistance {{ $app_name }}</p><p style="font-size:12px;color:#6b7280">Demande n° {{ $ticket_id }}. Répondez à cet e-mail si vous avez besoin d’autre chose.</p>',
    ],
    'ticket_status_update' => [
        'name' => 'Mise à jour du statut de la demande',
        'subject' => 'Du nouveau sur votre demande d’assistance',
        'template' => '<p>Bonjour {{ $user_name }},</p><p>Votre demande « {{ $subject }} » est désormais <strong>{{ $status }}</strong>.</p><p>— L’assistance {{ $app_name }}</p>',
    ],
    'ticket_resolved' => [
        'name' => 'Notification de demande résolue',
        'subject' => 'Votre demande d’assistance est résolue',
        'template' => '<p>Bonjour {{ $user_name }},</p><p>Votre demande « {{ $subject }} » a été résolue.</p><p>— L’assistance {{ $app_name }}</p>',
    ],
    'ticket_feedback_request' => [
        'name' => 'Demande d’avis sur l’assistance',
        'subject' => 'Comment cela s’est-il passé ?',
        'template' => '<p>Bonjour {{ $user_name }},</p><p>Merci d’avoir contacté l’assistance {{ $app_name }}. <a href="{{ $feedback_link }}">Dites-nous comment cela s’est passé</a>.</p>',
    ],
    'organizer_payout_sent' => [
        'name' => 'Versement envoyé',
        'subject' => 'Votre versement {{ $app_name }} est en route',
        'template' => '<p>Bonjour {{ $organizer_name }},</p><p>Nous avons envoyé <strong>{{ $amount }}</strong>. {{ $body }}</p><p><a href="{{ $dashboard_url }}" style="display:inline-block;background:#FF6B2C;color:#13201F;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:14px">Voir votre solde</a></p><p>&mdash; {{ $app_name }}</p>',
    ],
    'order_confirmed' => [
        'name' => 'Commande confirmée (billets)',
        'subject' => 'Vos billets pour {{ $event_title }}',
        'template' => '<p>Bonjour {{ $user_name }},</p><p>Vous allez à <strong>{{ $event_title }}</strong> — {{ $when }}{{ $where }}.</p><p><a href="{{ $ticket_url }}" style="display:inline-block;background:#FF6B2C;color:#13201F;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:14px">Ouvrir vos billets</a></p><p><img src="{{ $qr_url }}" width="180" height="180" alt="QR code qui ouvre vos billets" style="display:block;border:0"></p><p style="font-size:12px;color:#59625F">{{ $qr_note }}</p><p><strong>Billets :</strong> {{ $ticket_codes }}<br><strong>Payé :</strong> {{ $amount }} · commande {{ $order_number }}</p><p>À bientôt sur place,<br>{{ $app_name }}</p>',
    ],
    'approval_result' => [
        'name' => 'Résultat de l’approbation',
        'subject' => '{{ $title }}',
        'template' => '<p>Bonjour {{ $user_name }},</p><p>{{ $body }}</p><p><a href="{{ $link }}" style="display:inline-block;background:#FF6B2C;color:#13201F;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:14px">Ouvrir l’événement</a></p><p>{{ $app_name }}</p>',
    ],
    'waitlist_offer' => [
        'name' => 'Offre de la liste d’attente',
        'subject' => 'Une place s’est libérée : {{ $event_title }}',
        'template' => '<p>Bonjour {{ $user_name }},</p><p>Une place s’est libérée pour <strong>{{ $event_title }}</strong>. Elle est à vous si vous la réservez avant {{ $expires }} ; passé ce délai, elle sera proposée à la personne suivante sur la liste d’attente.</p><p><a href="{{ $link }}" style="display:inline-block;background:#FF6B2C;color:#13201F;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:14px">Réserver ma place</a></p><p>{{ $app_name }}</p>',
    ],
    'event_changed' => [
        'name' => 'Événement modifié',
        'subject' => 'Modification : {{ $event_title }}',
        'template' => '<p>Bonjour {{ $user_name }},</p><p>{{ $body }}</p><p>Vos billets restent valables.</p><p><a href="{{ $link }}" style="display:inline-block;background:#FF6B2C;color:#13201F;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:14px">Voir les détails</a></p><p>{{ $app_name }}</p>',
    ],
    'event_cancelled' => [
        'name' => 'Événement annulé',
        'subject' => '{{ $event_title }} est annulé',
        'template' => '<p>Bonjour {{ $user_name }},</p><p>{{ $body }}</p><p>Si vous avez payé, le remboursement est en route vers votre moyen de paiement d’origine — vous n’avez rien à faire.</p><p>{{ $app_name }}</p>',
    ],
    'announcement' => [
        'name' => 'Annonce de l’organisateur',
        'subject' => '{{ $title }}',
        'template' => '<p>Bonjour {{ $user_name }},</p><p style="white-space:pre-line">{{ $body }}</p><p><a href="{{ $link }}" style="display:inline-block;background:#FF6B2C;color:#13201F;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:14px">Ouvrir l’événement</a></p><p style="font-size:12px;color:#59625F">Vous recevez ce message car vous figurez sur la liste des participants. Gérez vos notifications dans l’application {{ $app_name }}.</p>',
    ],
    'event_reminder' => [
        'name' => 'Rappel d’événement',
        'subject' => 'Demain : {{ $event_title }}',
        'template' => '<p>Bonjour {{ $user_name }},</p><p><strong>{{ $event_title }}</strong>, c’est demain — {{ $when }}{{ $where }}.</p><p>{{ $body }}</p><p><a href="{{ $link }}" style="display:inline-block;background:#FF6B2C;color:#13201F;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:14px">Votre billet</a></p><p style="font-size:12px;color:#59625F">Votre billet fonctionne hors ligne dans l’application {{ $app_name }}. Désactivez les rappels d’événements dans vos paramètres de notification.</p>',
    ],
    'event_thank_you' => [
        'name' => 'Remerciement (après l’événement)',
        'subject' => '{{ $title }}',
        'template' => '<p>Bonjour {{ $user_name }},</p><p style="white-space:pre-line">{{ $body }}</p><p><a href="{{ $link }}" style="display:inline-block;background:#FF6B2C;color:#13201F;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:14px">Voir les photos et laisser un avis</a></p><p style="font-size:12px;color:#59625F">Vous recevez ce message car vous avez participé à {{ $event_title }}. Gérez vos notifications dans l’application {{ $app_name }}.</p>',
    ],
    'team_invite' => [
        'name' => 'Invitation dans l’équipe',
        'subject' => 'Rejoignez {{ $organizer_name }} sur {{ $app_name }}',
        'template' => '<p>{{ $invited_by }} à rejoindre l’équipe <strong>{{ $organizer_name }}</strong> en tant que <strong>{{ $role }}</strong>.</p><p><a href="{{ $accept_url }}" style="display:inline-block;background:#FF6B2C;color:#13201F;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:14px">Accepter l’invitation</a></p><p>Connectez-vous (ou créez un compte) avec cette adresse e-mail pour accepter. Le lien est valable {{ $days }} jours.</p>',
    ],
    'refund_processed' => [
        'name' => 'Remboursement effectué',
        'subject' => '{{ $title }}',
        'template' => '<p>Bonjour {{ $user_name }},</p><p>{{ $body }}</p><p><strong>Commande :</strong> {{ $order_number }} · {{ $event_title }}<br><strong>Remboursé :</strong> {{ $amount }}</p><p><a href="{{ $link }}" style="display:inline-block;background:#FF6B2C;color:#13201F;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:14px">Vos billets</a></p><p>{{ $app_name }}</p>',
    ],
];
