<?php

declare(strict_types=1);

/*
 | Email templates (German seed for email_templates rows), by key.
 | Placeholders are `{{ $name }}` and must stay exactly as written.
 */

return [
    'verification_code' => [
        'name' => 'Bestätigungscode',
        'subject' => '{{ $code }} ist dein {{ $app_name }}-Code',
        'template' => '<p>Hallo {{ $user_name }},</p><p>gib diesen Code bei {{ $app_name }} ein, um zu bestätigen, dass du es bist:</p><p style="font-size:28px;font-weight:700;letter-spacing:6px">{{ $code }}</p><p>Er läuft in {{ $minutes }} Minuten ab.</p><p>Wenn du das nicht warst, kannst du diese E-Mail ignorieren – ohne diesen Code kann niemand deine Adresse verwenden.</p><p>Bis bald,<br>{{ $app_name }}</p>',
    ],
    'reset_password' => [
        'name' => 'Passwort zurücksetzen',
        'subject' => 'Setze dein {{ $app_name }}-Passwort zurück',
        'template' => '<p>Hallo {{ $user_name }},</p><p>wir haben eine Anfrage erhalten, das Passwort deines {{ $app_name }}-Kontos zurückzusetzen.</p><p><a href="{{ $url }}">Neues Passwort festlegen</a></p><p>Der Link läuft in {{ $minutes }} Minuten ab. Wenn du das nicht angefordert hast, kannst du diese E-Mail ignorieren – dein Passwort bleibt, wie es ist, und deine Tickets sind sicher.</p><p style="font-size:12px;color:#6b7280">Falls sich der Link nicht öffnet, kopiere diese Adresse in deinen Browser:<br>{{ $url }}</p>',
    ],
    'welcome' => [
        'name' => 'Willkommen',
        'subject' => 'Willkommen bei {{ $app_name }}',
        'template' => '<p>Hallo {{ $user_name }},</p><p>dein Konto ist bereit. Deine Tickets, gespeicherten Events und die Veranstalter, denen du folgst, sind jetzt im Web und in der App immer dabei.</p><p><a href="{{ $read_url }}">Schau, was in deiner Nähe los ist</a></p><p>Folge ein paar Veranstaltern, die dir gefallen, dann finden dich ihre neuen Events von selbst.</p><p>Bis bald,<br>{{ $app_name }}</p>',
    ],
    'password_changed' => [
        'name' => 'Passwort geändert',
        'subject' => 'Dein {{ $app_name }}-Passwort wurde geändert',
        'template' => '<p>Hallo {{ $user_name }},</p><p>das Passwort deines {{ $app_name }}-Kontos wurde am {{ $when }} geändert, und alle anderen Geräte wurden abgemeldet.</p><p>Wenn du das warst, musst du nichts tun. Wenn nicht, <a href="{{ $reset_url }}">setze dein Passwort jetzt zurück</a> und kontaktiere den Support.</p><p>{{ $app_name }}</p>',
    ],
    'newsletter_confirm' => [
        'name' => 'Newsletter-Bestätigung',
        'subject' => 'Bestätige dein {{ $app_name }}-Abo',
        'template' => '<p>Jemand, hoffentlich du, möchte {{ $email }} für den {{ $app_name }}-Newsletter anmelden.</p><p><a href="{{ $confirm_url }}">Ja, anmelden</a></p><p>Warst du das nicht, ignoriere diese E-Mail. Die Adresse wird erst eingetragen, wenn der Link geöffnet wird.</p>',
    ],
    'subscription_started' => [
        'name' => 'Plus gestartet',
        'subject' => 'Willkommen bei {{ $app_name }} Plus',
        'template' => '<p>Hallo {{ $user_name }},</p><p>deine <strong>{{ $plan_name }}</strong>-Mitgliedschaft ist aktiv: keine Servicegebühr auf Tickets bis 30 €, früher Zugang zu Vorverkäufen und der erste Platz auf Wartelisten.</p><p><strong>Bezahlt:</strong> {{ $price }}<br><strong>Verlängert sich automatisch:</strong> {{ $renews }}</p><p><a href="{{ $billing_url }}">Mitgliedschaft verwalten</a></p><p>Bis bald,<br>{{ $app_name }}</p>',
    ],
    'subscription_ended' => [
        'name' => 'Plus endet',
        'subject' => 'Dein {{ $app_name }} Plus verlängert sich nicht',
        'template' => '<p>Hallo {{ $user_name }},</p><p>deine <strong>{{ $plan_name }}</strong>-Mitgliedschaft verlängert sich nicht. Plus bleibt bis {{ $ends_at }} aktiv.</p><p>Deine Tickets und gespeicherten Events bleiben genau da, wo sie sind, und du kannst Plus jederzeit wieder holen.</p><p><a href="{{ $pricing_url }}">Tarife ansehen</a></p><p>{{ $app_name }}</p>',
    ],
    'purchase_receipt' => [
        'name' => 'Kaufbeleg',
        'subject' => 'Dein Kauf bei {{ $app_name }}',
        'template' => '<p>Hallo {{ $user_name }},</p><p>danke – <strong>{{ $item_name }}</strong> ist jetzt in deinem Konto.</p><p><strong>Bezahlt:</strong> {{ $amount }}<br><strong>Hinzugefügt:</strong> {{ $granted }}</p><p><a href="{{ $shop_url }}">Dein Konto</a></p><p>Bis bald,<br>{{ $app_name }}</p>',
    ],
    'ticket_created' => [
        'name' => 'Bestätigung der Support-Anfrage',
        'subject' => 'Wir haben deine Anfrage erhalten',
        'template' => '<p>Hallo {{ $user_name }},</p><p>wir haben deine Anfrage „{{ $subject }}“ erhalten und melden uns in Kürze.</p><p>– Dein {{ $app_name }}-Support</p>',
    ],
    'support_reply' => [
        'name' => 'Antwort vom Support',
        'subject' => 'Re: {{ $subject }}',
        'template' => '<p>Hallo {{ $user_name }},</p><p style="white-space:pre-line">{{ $reply }}</p><p>– {{ $agent_name }}, {{ $app_name }}-Support</p><p style="font-size:12px;color:#6b7280">Anfrage #{{ $ticket_id }}. Antworte einfach auf diese E-Mail, wenn du noch etwas brauchst.</p>',
    ],
    'ticket_status_update' => [
        'name' => 'Statusänderung der Support-Anfrage',
        'subject' => 'Neuigkeiten zu deiner Support-Anfrage',
        'template' => '<p>Hallo {{ $user_name }},</p><p>deine Anfrage „{{ $subject }}“ hat jetzt den Status <strong>{{ $status }}</strong>.</p><p>– Dein {{ $app_name }}-Support</p>',
    ],
    'ticket_resolved' => [
        'name' => 'Support-Anfrage gelöst',
        'subject' => 'Deine Support-Anfrage ist gelöst',
        'template' => '<p>Hallo {{ $user_name }},</p><p>deine Anfrage „{{ $subject }}“ wurde gelöst.</p><p>– Dein {{ $app_name }}-Support</p>',
    ],
    'ticket_feedback_request' => [
        'name' => 'Feedback-Anfrage zum Support',
        'subject' => 'Wie waren wir?',
        'template' => '<p>Hallo {{ $user_name }},</p><p>danke, dass du dich an den {{ $app_name }}-Support gewandt hast. <a href="{{ $feedback_link }}">Erzähl uns, wie es gelaufen ist</a>.</p>',
    ],
    'organizer_payout_sent' => [
        'name' => 'Auszahlung gesendet',
        'subject' => 'Deine {{ $app_name }}-Auszahlung ist unterwegs',
        'template' => '<p>Hallo {{ $organizer_name }},</p><p>wir haben <strong>{{ $amount }}</strong> überwiesen. {{ $body }}</p><p><a href="{{ $dashboard_url }}" style="display:inline-block;background:#FF6B2C;color:#13201F;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:14px">Guthaben ansehen</a></p><p>&mdash; {{ $app_name }}</p>',
    ],
    'order_confirmed' => [
        'name' => 'Bestellung bestätigt (Tickets)',
        'subject' => 'Deine Tickets für {{ $event_title }}',
        'template' => '<p>Hallo {{ $user_name }},</p><p>du bist bei <strong>{{ $event_title }}</strong> dabei – {{ $when }}{{ $where }}.</p><p><a href="{{ $ticket_url }}" style="display:inline-block;background:#FF6B2C;color:#13201F;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:14px">Deine Tickets öffnen</a></p><p><img src="{{ $qr_url }}" width="180" height="180" alt="QR-Code, der deine Tickets öffnet" style="display:block;border:0"></p><p style="font-size:12px;color:#59625F">{{ $qr_note }}</p><p><strong>Tickets:</strong> {{ $ticket_codes }}<br><strong>Bezahlt:</strong> {{ $amount }} · Bestellung {{ $order_number }}</p><p>Bis dann,<br>{{ $app_name }}</p>',
    ],
    'approval_result' => [
        'name' => 'Ergebnis der Bestätigung',
        'subject' => '{{ $title }}',
        'template' => '<p>Hallo {{ $user_name }},</p><p>{{ $body }}</p><p><a href="{{ $link }}" style="display:inline-block;background:#FF6B2C;color:#13201F;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:14px">Event öffnen</a></p><p>{{ $app_name }}</p>',
    ],
    'waitlist_offer' => [
        'name' => 'Angebot von der Warteliste',
        'subject' => 'Ein Platz ist frei geworden: {{ $event_title }}',
        'template' => '<p>Hallo {{ $user_name }},</p><p>bei <strong>{{ $event_title }}</strong> ist ein Platz frei geworden. Er gehört dir, wenn du ihn dir bis {{ $expires }} sicherst; danach geht er an die nächste Person auf der Warteliste.</p><p><a href="{{ $link }}" style="display:inline-block;background:#FF6B2C;color:#13201F;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:14px">Sichere dir deinen Platz</a></p><p>{{ $app_name }}</p>',
    ],
    'event_changed' => [
        'name' => 'Event geändert',
        'subject' => 'Änderung bei {{ $event_title }}',
        'template' => '<p>Hallo {{ $user_name }},</p><p>{{ $body }}</p><p>Deine Tickets bleiben gültig.</p><p><a href="{{ $link }}" style="display:inline-block;background:#FF6B2C;color:#13201F;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:14px">Details ansehen</a></p><p>{{ $app_name }}</p>',
    ],
    'event_cancelled' => [
        'name' => 'Event abgesagt',
        'subject' => '{{ $event_title }} ist abgesagt',
        'template' => '<p>Hallo {{ $user_name }},</p><p>{{ $body }}</p><p>Falls du bezahlt hast, ist die Erstattung auf dem Weg zu deiner ursprünglichen Zahlungsmethode – du musst nichts tun.</p><p>{{ $app_name }}</p>',
    ],
    'announcement' => [
        'name' => 'Ankündigung des Veranstalters',
        'subject' => '{{ $title }}',
        'template' => '<p>Hallo {{ $user_name }},</p><p style="white-space:pre-line">{{ $body }}</p><p><a href="{{ $link }}" style="display:inline-block;background:#FF6B2C;color:#13201F;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:14px">Event öffnen</a></p><p style="font-size:12px;color:#59625F">Du bekommst diese E-Mail, weil du auf der Gästeliste stehst. Benachrichtigungen verwaltest du in der {{ $app_name }}-App.</p>',
    ],
    'event_reminder' => [
        'name' => 'Event-Erinnerung',
        'subject' => 'Morgen: {{ $event_title }}',
        'template' => '<p>Hallo {{ $user_name }},</p><p><strong>{{ $event_title }}</strong> ist morgen – {{ $when }}{{ $where }}.</p><p>{{ $body }}</p><p><a href="{{ $link }}" style="display:inline-block;background:#FF6B2C;color:#13201F;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:14px">Dein Ticket</a></p><p style="font-size:12px;color:#59625F">Dein Ticket funktioniert in der {{ $app_name }}-App auch offline. Event-Erinnerungen kannst du in deinen Benachrichtigungseinstellungen ausschalten.</p>',
    ],
    'event_thank_you' => [
        'name' => 'Dankeschön (nach dem Event)',
        'subject' => '{{ $title }}',
        'template' => '<p>Hallo {{ $user_name }},</p><p style="white-space:pre-line">{{ $body }}</p><p><a href="{{ $link }}" style="display:inline-block;background:#FF6B2C;color:#13201F;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:14px">Fotos ansehen und Bewertung abgeben</a></p><p style="font-size:12px;color:#59625F">Du bekommst diese E-Mail, weil du bei {{ $event_title }} warst. Benachrichtigungen verwaltest du in der {{ $app_name }}-App.</p>',
    ],
    'team_invite' => [
        'name' => 'Team-Einladung',
        'subject' => 'Werde Teil von {{ $organizer_name }} auf {{ $app_name }}',
        'template' => '<p>{{ $invited_by }} – ins Team <strong>{{ $organizer_name }}</strong> als <strong>{{ $role }}</strong>.</p><p><a href="{{ $accept_url }}" style="display:inline-block;background:#FF6B2C;color:#13201F;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:14px">Einladung annehmen</a></p><p>Melde dich mit dieser E-Mail-Adresse an (oder erstelle ein Konto), um anzunehmen. Der Link ist {{ $days }} Tage gültig.</p>',
    ],
    'refund_processed' => [
        'name' => 'Erstattung durchgeführt',
        'subject' => '{{ $title }}',
        'template' => '<p>Hallo {{ $user_name }},</p><p>{{ $body }}</p><p><strong>Bestellung:</strong> {{ $order_number }} · {{ $event_title }}<br><strong>Erstattet:</strong> {{ $amount }}</p><p><a href="{{ $link }}" style="display:inline-block;background:#FF6B2C;color:#13201F;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:14px">Deine Tickets</a></p><p>{{ $app_name }}</p>',
    ],
];
