<?php

declare(strict_types=1);

return [
    'verification_code' => [
        'name' => 'Código de verificación',
        'subject' => '{{ $code }} es tu código de {{ $app_name }}',
        'template' => '<p>Hola, {{ $user_name }}:</p><p>Introduce este código en {{ $app_name }} para confirmar que eres tú:</p><p style="font-size:28px;font-weight:700;letter-spacing:6px">{{ $code }}</p><p>Caduca en {{ $minutes }} minutos.</p><p>Si no has sido tú, puedes ignorar este correo: nadie puede usar tu dirección sin este código.</p><p>¡Nos vemos por ahí!<br>{{ $app_name }}</p>',
    ],
    'reset_password' => [
        'name' => 'Restablecer contraseña',
        'subject' => 'Restablece tu contraseña de {{ $app_name }}',
        'template' => '<p>Hola, {{ $user_name }}:</p><p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta de {{ $app_name }}.</p><p><a href="{{ $url }}">Elige una nueva contraseña</a></p><p>El enlace caduca en {{ $minutes }} minutos. Si no lo has pedido, puedes ignorar este correo: tu contraseña sigue igual y tus entradas están a salvo.</p><p style="font-size:12px;color:#6b7280">Si el enlace no se abre, copia esta dirección en tu navegador:<br>{{ $url }}</p>',
    ],
    'welcome' => [
        'name' => 'Bienvenida',
        'subject' => 'Te damos la bienvenida a {{ $app_name }}',
        'template' => '<p>Hola, {{ $user_name }}:</p><p>Tu cuenta está lista. Tus entradas, tus eventos guardados y los organizadores que sigues ahora van contigo en la web y en la app.</p><p><a href="{{ $read_url }}">Descubre qué hay cerca de ti</a></p><p>Sigue a algunos organizadores que te gusten y sus nuevos eventos te encontrarán.</p><p>¡Nos vemos por ahí!<br>{{ $app_name }}</p>',
    ],
    'password_changed' => [
        'name' => 'Contraseña cambiada',
        'subject' => 'Se ha cambiado tu contraseña de {{ $app_name }}',
        'template' => '<p>Hola, {{ $user_name }}:</p><p>La contraseña de tu cuenta de {{ $app_name }} se cambió el {{ $when }} y se cerró la sesión en los demás dispositivos.</p><p>Si has sido tú, no tienes que hacer nada. Si no, <a href="{{ $reset_url }}">restablece tu contraseña ahora</a> y contacta con soporte.</p><p>{{ $app_name }}</p>',
    ],
    'newsletter_confirm' => [
        'name' => 'Confirmación del boletín',
        'subject' => 'Confirma tu suscripción a {{ $app_name }}',
        'template' => '<p>Alguien, esperamos que tú, pidió suscribir {{ $email }} al boletín de {{ $app_name }}.</p><p><a href="{{ $confirm_url }}">Sí, suscribirme</a></p><p>Si no fuiste tú, ignora este correo. La dirección no se añade a ninguna lista si no se abre el enlace.</p>',
    ],
    'subscription_started' => [
        'name' => 'Plus activado',
        'subject' => 'Te damos la bienvenida a {{ $app_name }} Plus',
        'template' => '<p>Hola, {{ $user_name }}:</p><p>Tu suscripción <strong>{{ $plan_name }}</strong> está activa: sin gastos de gestión en entradas de hasta 30 €, acceso anticipado a preventas y primer puesto en las listas de espera.</p><p><strong>Pagado:</strong> {{ $price }}<br><strong>Se renueva automáticamente:</strong> {{ $renews }}</p><p><a href="{{ $billing_url }}">Gestiona tu suscripción</a></p><p>¡Nos vemos por ahí!<br>{{ $app_name }}</p>',
    ],
    'subscription_ended' => [
        'name' => 'Fin de Plus',
        'subject' => 'Tu {{ $app_name }} Plus no se renovará',
        'template' => '<p>Hola, {{ $user_name }}:</p><p>Tu suscripción <strong>{{ $plan_name }}</strong> no se renovará. Plus seguirá activo hasta el {{ $ends_at }}.</p><p>Tus entradas y eventos guardados se quedan exactamente donde están, y puedes volver a Plus cuando quieras.</p><p><a href="{{ $pricing_url }}">Ver los planes</a></p><p>{{ $app_name }}</p>',
    ],
    'purchase_receipt' => [
        'name' => 'Recibo de compra',
        'subject' => 'Tu compra en {{ $app_name }}',
        'template' => '<p>Hola, {{ $user_name }}:</p><p>Gracias: <strong>{{ $item_name }}</strong> ya está en tu cuenta.</p><p><strong>Pagado:</strong> {{ $amount }}<br><strong>Añadido:</strong> {{ $granted }}</p><p><a href="{{ $shop_url }}">Tu cuenta</a></p><p>¡Nos vemos por ahí!<br>{{ $app_name }}</p>',
    ],
    'ticket_created' => [
        'name' => 'Confirmación de consulta creada',
        'subject' => 'Hemos recibido tu consulta',
        'template' => '<p>Hola, {{ $user_name }}:</p><p>Hemos recibido tu consulta «{{ $subject }}» y te responderemos en breve.</p><p>— Soporte de {{ $app_name }}</p>',
    ],
    'support_reply' => [
        'name' => 'Respuesta de soporte',
        'subject' => 'Re: {{ $subject }}',
        'template' => '<p>Hola, {{ $user_name }}:</p><p style="white-space:pre-line">{{ $reply }}</p><p>— {{ $agent_name }}, soporte de {{ $app_name }}</p><p style="font-size:12px;color:#6b7280">Consulta n.º {{ $ticket_id }}. Responde a este correo si necesitas algo más.</p>',
    ],
    'ticket_status_update' => [
        'name' => 'Actualización del estado de la consulta',
        'subject' => 'Novedades sobre tu consulta de soporte',
        'template' => '<p>Hola, {{ $user_name }}:</p><p>Tu consulta «{{ $subject }}» ahora está <strong>{{ $status }}</strong>.</p><p>— Soporte de {{ $app_name }}</p>',
    ],
    'ticket_resolved' => [
        'name' => 'Aviso de consulta resuelta',
        'subject' => 'Tu consulta de soporte está resuelta',
        'template' => '<p>Hola, {{ $user_name }}:</p><p>Tu consulta «{{ $subject }}» se ha resuelto.</p><p>— Soporte de {{ $app_name }}</p>',
    ],
    'ticket_feedback_request' => [
        'name' => 'Solicitud de opinión sobre soporte',
        'subject' => '¿Qué tal lo hemos hecho?',
        'template' => '<p>Hola, {{ $user_name }}:</p><p>Gracias por contactar con el soporte de {{ $app_name }}. <a href="{{ $feedback_link }}">Cuéntanos qué tal fue</a>.</p>',
    ],
    'organizer_payout_sent' => [
        'name' => 'Pago enviado',
        'subject' => 'Tu pago de {{ $app_name }} va de camino',
        'template' => '<p>Hola, {{ $organizer_name }}:</p><p>Hemos enviado <strong>{{ $amount }}</strong>. {{ $body }}</p><p><a href="{{ $dashboard_url }}" style="display:inline-block;background:#FF6B2C;color:#13201F;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:14px">Ver tu saldo</a></p><p>&mdash; {{ $app_name }}</p>',
    ],
    'order_confirmed' => [
        'name' => 'Pedido confirmado (entradas)',
        'subject' => 'Tus entradas para {{ $event_title }}',
        'template' => '<p>Hola, {{ $user_name }}:</p><p>Vas a <strong>{{ $event_title }}</strong>: {{ $when }}{{ $where }}.</p><p><a href="{{ $ticket_url }}" style="display:inline-block;background:#FF6B2C;color:#13201F;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:14px">Abrir tus entradas</a></p><p><img src="{{ $qr_url }}" width="180" height="180" alt="Código QR que abre tus entradas" style="display:block;border:0"></p><p style="font-size:12px;color:#59625F">{{ $qr_note }}</p><p><strong>Entradas:</strong> {{ $ticket_codes }}<br><strong>Pagado:</strong> {{ $amount }} · pedido {{ $order_number }}</p><p>¡Nos vemos allí!<br>{{ $app_name }}</p>',
    ],
    'approval_result' => [
        'name' => 'Resultado de la aprobación',
        'subject' => '{{ $title }}',
        'template' => '<p>Hola, {{ $user_name }}:</p><p>{{ $body }}</p><p><a href="{{ $link }}" style="display:inline-block;background:#FF6B2C;color:#13201F;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:14px">Abrir el evento</a></p><p>{{ $app_name }}</p>',
    ],
    'waitlist_offer' => [
        'name' => 'Oferta de la lista de espera',
        'subject' => 'Se ha liberado una plaza: {{ $event_title }}',
        'template' => '<p>Hola, {{ $user_name }}:</p><p>Se ha liberado una plaza en <strong>{{ $event_title }}</strong>. Es tuya si la reservas antes del {{ $expires }}; después pasará a la siguiente persona de la lista de espera.</p><p><a href="{{ $link }}" style="display:inline-block;background:#FF6B2C;color:#13201F;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:14px">Reserva tu plaza</a></p><p>{{ $app_name }}</p>',
    ],
    'event_changed' => [
        'name' => 'Evento modificado',
        'subject' => 'Cambio en {{ $event_title }}',
        'template' => '<p>Hola, {{ $user_name }}:</p><p>{{ $body }}</p><p>Tus entradas siguen siendo válidas.</p><p><a href="{{ $link }}" style="display:inline-block;background:#FF6B2C;color:#13201F;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:14px">Ver los detalles</a></p><p>{{ $app_name }}</p>',
    ],
    'event_cancelled' => [
        'name' => 'Evento cancelado',
        'subject' => '{{ $event_title }} se ha cancelado',
        'template' => '<p>Hola, {{ $user_name }}:</p><p>{{ $body }}</p><p>Si pagaste, el reembolso va de camino a tu método de pago original: no tienes que hacer nada.</p><p>{{ $app_name }}</p>',
    ],
    'announcement' => [
        'name' => 'Anuncio del organizador',
        'subject' => '{{ $title }}',
        'template' => '<p>Hola, {{ $user_name }}:</p><p style="white-space:pre-line">{{ $body }}</p><p><a href="{{ $link }}" style="display:inline-block;background:#FF6B2C;color:#13201F;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:14px">Abrir el evento</a></p><p style="font-size:12px;color:#59625F">Recibes este correo porque estás en la lista de asistentes. Gestiona las notificaciones en la app de {{ $app_name }}.</p>',
    ],
    'event_reminder' => [
        'name' => 'Recordatorio del evento',
        'subject' => 'Mañana: {{ $event_title }}',
        'template' => '<p>Hola, {{ $user_name }}:</p><p><strong>{{ $event_title }}</strong> es mañana: {{ $when }}{{ $where }}.</p><p>{{ $body }}</p><p><a href="{{ $link }}" style="display:inline-block;background:#FF6B2C;color:#13201F;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:14px">Tu entrada</a></p><p style="font-size:12px;color:#59625F">Tu entrada funciona sin conexión en la app de {{ $app_name }}. Desactiva los recordatorios de eventos en tus ajustes de notificaciones.</p>',
    ],
    'event_thank_you' => [
        'name' => 'Agradecimiento (después del evento)',
        'subject' => '{{ $title }}',
        'template' => '<p>Hola, {{ $user_name }}:</p><p style="white-space:pre-line">{{ $body }}</p><p><a href="{{ $link }}" style="display:inline-block;background:#FF6B2C;color:#13201F;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:14px">Ver las fotos y dejar una reseña</a></p><p style="font-size:12px;color:#59625F">Recibes este correo porque fuiste a {{ $event_title }}. Gestiona las notificaciones en la app de {{ $app_name }}.</p>',
    ],
    'team_invite' => [
        'name' => 'Invitación al equipo',
        'subject' => 'Únete a {{ $organizer_name }} en {{ $app_name }}',
        'template' => '<p>{{ $invited_by }} al equipo de <strong>{{ $organizer_name }}</strong> como <strong>{{ $role }}</strong>.</p><p><a href="{{ $accept_url }}" style="display:inline-block;background:#FF6B2C;color:#13201F;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:14px">Aceptar la invitación</a></p><p>Inicia sesión (o crea una cuenta) con esta dirección de correo para aceptarla. El enlace funciona durante {{ $days }} días.</p>',
    ],
    'refund_processed' => [
        'name' => 'Reembolso procesado',
        'subject' => '{{ $title }}',
        'template' => '<p>Hola, {{ $user_name }}:</p><p>{{ $body }}</p><p><strong>Pedido:</strong> {{ $order_number }} · {{ $event_title }}<br><strong>Reembolsado:</strong> {{ $amount }}</p><p><a href="{{ $link }}" style="display:inline-block;background:#FF6B2C;color:#13201F;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:14px">Tus entradas</a></p><p>{{ $app_name }}</p>',
    ],
];
