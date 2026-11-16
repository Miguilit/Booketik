<?php

declare(strict_types=1);

return [
    'verification_code' => [
        'name' => 'Codice di verifica',
        'subject' => '{{ $code }} è il tuo codice {{ $app_name }}',
        'template' => '<p>Ciao {{ $user_name }},</p><p>Inserisci questo codice su {{ $app_name }} per confermare che sei tu:</p><p style="font-size:28px;font-weight:700;letter-spacing:6px">{{ $code }}</p><p>Scade tra {{ $minutes }} minuti.</p><p>Se non sei stato tu, puoi ignorare questa email: nessuno può usare il tuo indirizzo senza questo codice.</p><p>Ci vediamo in giro,<br>{{ $app_name }}</p>',
    ],
    'reset_password' => [
        'name' => 'Reimposta password',
        'subject' => 'Reimposta la tua password {{ $app_name }}',
        'template' => '<p>Ciao {{ $user_name }},</p><p>Abbiamo ricevuto una richiesta per reimpostare la password del tuo account {{ $app_name }}.</p><p><a href="{{ $url }}">Scegli una nuova password</a></p><p>Il link scade tra {{ $minutes }} minuti. Se non l\'hai chiesto tu, puoi ignorare questa email: la tua password resta com\'è e i tuoi biglietti sono al sicuro.</p><p style="font-size:12px;color:#6b7280">Se il link non si apre, copia questo indirizzo nel browser:<br>{{ $url }}</p>',
    ],
    'welcome' => [
        'name' => 'Benvenuto',
        'subject' => 'Benvenuto su {{ $app_name }}',
        'template' => '<p>Ciao {{ $user_name }},</p><p>Il tuo account è pronto. I tuoi biglietti, gli eventi salvati e gli organizzatori che segui ora ti accompagnano tra web e app.</p><p><a href="{{ $read_url }}">Scopri cosa c\'è vicino a te</a></p><p>Segui qualche organizzatore che ti piace e i suoi nuovi eventi ti troveranno.</p><p>Ci vediamo in giro,<br>{{ $app_name }}</p>',
    ],
    'password_changed' => [
        'name' => 'Password modificata',
        'subject' => 'La tua password {{ $app_name }} è stata modificata',
        'template' => '<p>Ciao {{ $user_name }},</p><p>La password del tuo account {{ $app_name }} è stata modificata il {{ $when }} e tutti gli altri dispositivi sono stati disconnessi.</p><p>Se sei stato tu, non devi fare nulla. Altrimenti <a href="{{ $reset_url }}">reimposta subito la password</a> e contatta l\'assistenza.</p><p>{{ $app_name }}</p>',
    ],
    'newsletter_confirm' => [
        'name' => 'Conferma newsletter',
        'subject' => 'Conferma la tua iscrizione a {{ $app_name }}',
        'template' => '<p>Qualcuno, speriamo tu, ha chiesto di iscrivere {{ $email }} alla newsletter di {{ $app_name }}.</p><p><a href="{{ $confirm_url }}">Sì, iscrivimi</a></p><p>Se non sei stato tu, ignora questa email. L’indirizzo non viene aggiunto a nessuna lista se il link non viene aperto.</p>',
    ],
    'subscription_started' => [
        'name' => 'Plus attivato',
        'subject' => 'Benvenuto in {{ $app_name }} Plus',
        'template' => '<p>Ciao {{ $user_name }},</p><p>Il tuo abbonamento <strong>{{ $plan_name }}</strong> è attivo: nessuna commissione di servizio sui biglietti fino a 30 €, accesso anticipato alle prevendite e primo posto nelle liste d\'attesa.</p><p><strong>Pagato:</strong> {{ $price }}<br><strong>Rinnovo automatico:</strong> {{ $renews }}</p><p><a href="{{ $billing_url }}">Gestisci il tuo abbonamento</a></p><p>Ci vediamo in giro,<br>{{ $app_name }}</p>',
    ],
    'subscription_ended' => [
        'name' => 'Plus in scadenza',
        'subject' => 'Il tuo {{ $app_name }} Plus non si rinnoverà',
        'template' => '<p>Ciao {{ $user_name }},</p><p>Il tuo abbonamento <strong>{{ $plan_name }}</strong> non si rinnoverà. Plus resta attivo fino al {{ $ends_at }}.</p><p>I tuoi biglietti e gli eventi salvati restano esattamente dove sono, e puoi riattivare Plus quando vuoi.</p><p><a href="{{ $pricing_url }}">Vedi i piani</a></p><p>{{ $app_name }}</p>',
    ],
    'purchase_receipt' => [
        'name' => 'Ricevuta d\'acquisto',
        'subject' => 'Il tuo acquisto su {{ $app_name }}',
        'template' => '<p>Ciao {{ $user_name }},</p><p>Grazie: <strong>{{ $item_name }}</strong> è nel tuo account.</p><p><strong>Pagato:</strong> {{ $amount }}<br><strong>Aggiunto:</strong> {{ $granted }}</p><p><a href="{{ $shop_url }}">Il tuo account</a></p><p>Ci vediamo in giro,<br>{{ $app_name }}</p>',
    ],
    'ticket_created' => [
        'name' => 'Conferma apertura richiesta',
        'subject' => 'Abbiamo ricevuto la tua richiesta',
        'template' => '<p>Ciao {{ $user_name }},</p><p>Abbiamo ricevuto la tua richiesta "{{ $subject }}" e ti risponderemo a breve.</p><p>— Assistenza {{ $app_name }}</p>',
    ],
    'support_reply' => [
        'name' => 'Risposta dell\'assistenza',
        'subject' => 'Re: {{ $subject }}',
        'template' => '<p>Ciao {{ $user_name }},</p><p style="white-space:pre-line">{{ $reply }}</p><p>— {{ $agent_name }}, Assistenza {{ $app_name }}</p><p style="font-size:12px;color:#6b7280">Richiesta n. {{ $ticket_id }}. Rispondi a questa email se ti serve altro.</p>',
    ],
    'ticket_status_update' => [
        'name' => 'Aggiornamento stato richiesta',
        'subject' => 'Aggiornamento sulla tua richiesta di assistenza',
        'template' => '<p>Ciao {{ $user_name }},</p><p>La tua richiesta "{{ $subject }}" ora è <strong>{{ $status }}</strong>.</p><p>— Assistenza {{ $app_name }}</p>',
    ],
    'ticket_resolved' => [
        'name' => 'Notifica richiesta risolta',
        'subject' => 'La tua richiesta di assistenza è stata risolta',
        'template' => '<p>Ciao {{ $user_name }},</p><p>La tua richiesta "{{ $subject }}" è stata risolta.</p><p>— Assistenza {{ $app_name }}</p>',
    ],
    'ticket_feedback_request' => [
        'name' => 'Richiesta di feedback sull\'assistenza',
        'subject' => 'Come ce la siamo cavata?',
        'template' => '<p>Ciao {{ $user_name }},</p><p>Grazie per aver contattato l\'assistenza {{ $app_name }}. <a href="{{ $feedback_link }}">Raccontaci com\'è andata</a>.</p>',
    ],
    'organizer_payout_sent' => [
        'name' => 'Pagamento inviato',
        'subject' => 'Il tuo pagamento {{ $app_name }} è in arrivo',
        'template' => '<p>Ciao {{ $organizer_name }},</p><p>Abbiamo inviato <strong>{{ $amount }}</strong>. {{ $body }}</p><p><a href="{{ $dashboard_url }}" style="display:inline-block;background:#FF6B2C;color:#13201F;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:14px">Vedi il tuo saldo</a></p><p>&mdash; {{ $app_name }}</p>',
    ],
    'order_confirmed' => [
        'name' => 'Ordine confermato (biglietti)',
        'subject' => 'I tuoi biglietti per {{ $event_title }}',
        'template' => '<p>Ciao {{ $user_name }},</p><p>Partecipi a <strong>{{ $event_title }}</strong>: {{ $when }}{{ $where }}.</p><p><a href="{{ $ticket_url }}" style="display:inline-block;background:#FF6B2C;color:#13201F;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:14px">Apri i tuoi biglietti</a></p><p><img src="{{ $qr_url }}" width="180" height="180" alt="QR code che apre i tuoi biglietti" style="display:block;border:0"></p><p style="font-size:12px;color:#59625F">{{ $qr_note }}</p><p><strong>Biglietti:</strong> {{ $ticket_codes }}<br><strong>Pagato:</strong> {{ $amount }} · ordine {{ $order_number }}</p><p>Ci vediamo lì,<br>{{ $app_name }}</p>',
    ],
    'approval_result' => [
        'name' => 'Esito dell\'approvazione',
        'subject' => '{{ $title }}',
        'template' => '<p>Ciao {{ $user_name }},</p><p>{{ $body }}</p><p><a href="{{ $link }}" style="display:inline-block;background:#FF6B2C;color:#13201F;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:14px">Apri l\'evento</a></p><p>{{ $app_name }}</p>',
    ],
    'waitlist_offer' => [
        'name' => 'Offerta dalla lista d\'attesa',
        'subject' => 'Si è liberato un posto: {{ $event_title }}',
        'template' => '<p>Ciao {{ $user_name }},</p><p>Si è liberato un posto a <strong>{{ $event_title }}</strong>. È tuo se lo prendi entro {{ $expires }}; dopo passa alla persona successiva in lista d\'attesa.</p><p><a href="{{ $link }}" style="display:inline-block;background:#FF6B2C;color:#13201F;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:14px">Prendi il tuo posto</a></p><p>{{ $app_name }}</p>',
    ],
    'event_changed' => [
        'name' => 'Evento modificato',
        'subject' => 'Modifica a {{ $event_title }}',
        'template' => '<p>Ciao {{ $user_name }},</p><p>{{ $body }}</p><p>I tuoi biglietti restano validi.</p><p><a href="{{ $link }}" style="display:inline-block;background:#FF6B2C;color:#13201F;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:14px">Vedi i dettagli</a></p><p>{{ $app_name }}</p>',
    ],
    'event_cancelled' => [
        'name' => 'Evento cancellato',
        'subject' => '{{ $event_title }} è stato cancellato',
        'template' => '<p>Ciao {{ $user_name }},</p><p>{{ $body }}</p><p>Se hai pagato, il rimborso sta tornando sul metodo di pagamento originale: non devi fare nulla.</p><p>{{ $app_name }}</p>',
    ],
    'announcement' => [
        'name' => 'Annuncio dell\'organizzatore',
        'subject' => '{{ $title }}',
        'template' => '<p>Ciao {{ $user_name }},</p><p style="white-space:pre-line">{{ $body }}</p><p><a href="{{ $link }}" style="display:inline-block;background:#FF6B2C;color:#13201F;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:14px">Apri l\'evento</a></p><p style="font-size:12px;color:#59625F">Ricevi questa email perché sei nella lista ospiti. Gestisci le notifiche nell\'app {{ $app_name }}.</p>',
    ],
    'event_reminder' => [
        'name' => 'Promemoria evento',
        'subject' => 'Domani: {{ $event_title }}',
        'template' => '<p>Ciao {{ $user_name }},</p><p><strong>{{ $event_title }}</strong> è domani: {{ $when }}{{ $where }}.</p><p>{{ $body }}</p><p><a href="{{ $link }}" style="display:inline-block;background:#FF6B2C;color:#13201F;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:14px">Il tuo biglietto</a></p><p style="font-size:12px;color:#59625F">Il tuo biglietto funziona anche offline nell\'app {{ $app_name }}. Puoi disattivare i promemoria degli eventi nelle impostazioni delle notifiche.</p>',
    ],
    'event_thank_you' => [
        'name' => 'Ringraziamento (dopo l\'evento)',
        'subject' => '{{ $title }}',
        'template' => '<p>Ciao {{ $user_name }},</p><p style="white-space:pre-line">{{ $body }}</p><p><a href="{{ $link }}" style="display:inline-block;background:#FF6B2C;color:#13201F;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:14px">Guarda le foto e lascia una recensione</a></p><p style="font-size:12px;color:#59625F">Ricevi questa email perché sei stato a {{ $event_title }}. Gestisci le notifiche nell\'app {{ $app_name }}.</p>',
    ],
    'team_invite' => [
        'name' => 'Invito nel team',
        'subject' => 'Unisciti a {{ $organizer_name }} su {{ $app_name }}',
        'template' => '<p>{{ $invited_by }} nel team <strong>{{ $organizer_name }}</strong> come <strong>{{ $role }}</strong>.</p><p><a href="{{ $accept_url }}" style="display:inline-block;background:#FF6B2C;color:#13201F;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:14px">Accetta l\'invito</a></p><p>Accedi (o crea un account) con questo indirizzo email per accettare. Il link è valido per {{ $days }} giorni.</p>',
    ],
    'refund_processed' => [
        'name' => 'Rimborso effettuato',
        'subject' => '{{ $title }}',
        'template' => '<p>Ciao {{ $user_name }},</p><p>{{ $body }}</p><p><strong>Ordine:</strong> {{ $order_number }} · {{ $event_title }}<br><strong>Rimborsato:</strong> {{ $amount }}</p><p><a href="{{ $link }}" style="display:inline-block;background:#FF6B2C;color:#13201F;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:14px">I tuoi biglietti</a></p><p>{{ $app_name }}</p>',
    ],
];
