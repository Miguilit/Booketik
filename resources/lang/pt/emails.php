<?php

declare(strict_types=1);

/*
 | Email templates (Portuguese seed). Placeholders `{{ $name }}` must stay
 | exactly as written. See resources/lang/en/emails.php.
 */

return [
    'verification_code' => [
        'name' => 'Código de verificação',
        'subject' => '{{ $code }} é seu código do {{ $app_name }}',
        'template' => '<p>Oi, {{ $user_name }},</p><p>Digite este código no {{ $app_name }} para confirmar que é você:</p><p style="font-size:28px;font-weight:700;letter-spacing:6px">{{ $code }}</p><p>Ele expira em {{ $minutes }} minutos.</p><p>Se não foi você, pode ignorar este e-mail — ninguém consegue usar seu endereço sem este código.</p><p>Até a próxima,<br>{{ $app_name }}</p>',
    ],
    'reset_password' => [
        'name' => 'Redefinição de senha',
        'subject' => 'Redefina sua senha do {{ $app_name }}',
        'template' => '<p>Oi, {{ $user_name }},</p><p>Recebemos um pedido para redefinir a senha da sua conta no {{ $app_name }}.</p><p><a href="{{ $url }}">Escolher uma nova senha</a></p><p>O link expira em {{ $minutes }} minutos. Se você não pediu, pode ignorar este e-mail — sua senha continua a mesma e seus ingressos estão seguros.</p><p style="font-size:12px;color:#6b7280">Se o link não abrir, copie este endereço no seu navegador:<br>{{ $url }}</p>',
    ],
    'welcome' => [
        'name' => 'Boas-vindas',
        'subject' => 'Boas-vindas ao {{ $app_name }}',
        'template' => '<p>Oi, {{ $user_name }},</p><p>Sua conta está pronta. Seus ingressos, eventos salvos e os organizadores que você segue agora vão com você na web e no app.</p><p><a href="{{ $read_url }}">Veja o que está rolando perto de você</a></p><p>Siga alguns organizadores de que você gosta e os novos eventos deles vão chegar até você.</p><p>Até a próxima,<br>{{ $app_name }}</p>',
    ],
    'password_changed' => [
        'name' => 'Senha alterada',
        'subject' => 'Sua senha do {{ $app_name }} foi alterada',
        'template' => '<p>Oi, {{ $user_name }},</p><p>A senha da sua conta no {{ $app_name }} foi alterada em {{ $when }}, e os outros dispositivos foram desconectados.</p><p>Se foi você, não precisa fazer nada. Se não foi, <a href="{{ $reset_url }}">redefina sua senha agora</a> e fale com o suporte.</p><p>{{ $app_name }}</p>',
    ],
    'newsletter_confirm' => [
        'name' => 'Confirmação da newsletter',
        'subject' => 'Confirme sua inscrição em {{ $app_name }}',
        'template' => '<p>Alguém, esperamos que você, pediu para inscrever {{ $email }} na newsletter de {{ $app_name }}.</p><p><a href="{{ $confirm_url }}">Sim, quero me inscrever</a></p><p>Se não foi você, ignore este e-mail. O endereço não entra em nenhuma lista a menos que o link seja aberto.</p>',
    ],
    'subscription_started' => [
        'name' => 'Plus ativado',
        'subject' => 'Boas-vindas ao {{ $app_name }} Plus',
        'template' => '<p>Oi, {{ $user_name }},</p><p>Sua assinatura <strong>{{ $plan_name }}</strong> está ativa: sem taxa de serviço em ingressos de até €30, acesso antecipado às pré-vendas e primeiro lugar nas listas de espera.</p><p><strong>Pago:</strong> {{ $price }}<br><strong>Renova automaticamente:</strong> {{ $renews }}</p><p><a href="{{ $billing_url }}">Gerenciar sua assinatura</a></p><p>Até a próxima,<br>{{ $app_name }}</p>',
    ],
    'subscription_ended' => [
        'name' => 'Plus terminando',
        'subject' => 'Seu {{ $app_name }} Plus não será renovado',
        'template' => '<p>Oi, {{ $user_name }},</p><p>Sua assinatura <strong>{{ $plan_name }}</strong> não será renovada. O Plus continua ativo até {{ $ends_at }}.</p><p>Seus ingressos e eventos salvos continuam exatamente onde estão, e você pode voltar para o Plus quando quiser.</p><p><a href="{{ $pricing_url }}">Ver os planos</a></p><p>{{ $app_name }}</p>',
    ],
    'purchase_receipt' => [
        'name' => 'Recibo de compra',
        'subject' => 'Sua compra no {{ $app_name }}',
        'template' => '<p>Oi, {{ $user_name }},</p><p>Obrigado — <strong>{{ $item_name }}</strong> já está na sua conta.</p><p><strong>Pago:</strong> {{ $amount }}<br><strong>Adicionado:</strong> {{ $granted }}</p><p><a href="{{ $shop_url }}">Sua conta</a></p><p>Até a próxima,<br>{{ $app_name }}</p>',
    ],
    'ticket_created' => [
        'name' => 'Confirmação de abertura de chamado',
        'subject' => 'Recebemos seu pedido',
        'template' => '<p>Oi, {{ $user_name }},</p><p>Recebemos seu pedido "{{ $subject }}" e responderemos em breve.</p><p>— Suporte {{ $app_name }}</p>',
    ],
    'support_reply' => [
        'name' => 'Resposta do suporte',
        'subject' => 'Re: {{ $subject }}',
        'template' => '<p>Oi, {{ $user_name }},</p><p style="white-space:pre-line">{{ $reply }}</p><p>— {{ $agent_name }}, Suporte {{ $app_name }}</p><p style="font-size:12px;color:#6b7280">Pedido nº {{ $ticket_id }}. Responda a este e-mail se precisar de mais alguma coisa.</p>',
    ],
    'ticket_status_update' => [
        'name' => 'Atualização de status do chamado',
        'subject' => 'Atualização do seu pedido de suporte',
        'template' => '<p>Oi, {{ $user_name }},</p><p>Seu pedido "{{ $subject }}" agora está <strong>{{ $status }}</strong>.</p><p>— Suporte {{ $app_name }}</p>',
    ],
    'ticket_resolved' => [
        'name' => 'Notificação de chamado resolvido',
        'subject' => 'Seu pedido de suporte foi resolvido',
        'template' => '<p>Oi, {{ $user_name }},</p><p>Seu pedido "{{ $subject }}" foi resolvido.</p><p>— Suporte {{ $app_name }}</p>',
    ],
    'ticket_feedback_request' => [
        'name' => 'Pedido de feedback do suporte',
        'subject' => 'Como nos saímos?',
        'template' => '<p>Oi, {{ $user_name }},</p><p>Obrigado por falar com o suporte do {{ $app_name }}. <a href="{{ $feedback_link }}">Conte para nós como foi</a>.</p>',
    ],
    'organizer_payout_sent' => [
        'name' => 'Repasse enviado',
        'subject' => 'Seu repasse do {{ $app_name }} está a caminho',
        'template' => '<p>Oi, {{ $organizer_name }},</p><p>Enviamos <strong>{{ $amount }}</strong>. {{ $body }}</p><p><a href="{{ $dashboard_url }}" style="display:inline-block;background:#FF6B2C;color:#13201F;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:14px">Ver seu saldo</a></p><p>&mdash; {{ $app_name }}</p>',
    ],
    'order_confirmed' => [
        'name' => 'Pedido confirmado (ingressos)',
        'subject' => 'Seus ingressos para {{ $event_title }}',
        'template' => '<p>Oi, {{ $user_name }},</p><p>Você vai a <strong>{{ $event_title }}</strong> — {{ $when }}{{ $where }}.</p><p><a href="{{ $ticket_url }}" style="display:inline-block;background:#FF6B2C;color:#13201F;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:14px">Abrir seus ingressos</a></p><p><img src="{{ $qr_url }}" width="180" height="180" alt="QR code que abre seus ingressos" style="display:block;border:0"></p><p style="font-size:12px;color:#59625F">{{ $qr_note }}</p><p><strong>Ingressos:</strong> {{ $ticket_codes }}<br><strong>Pago:</strong> {{ $amount }} · pedido {{ $order_number }}</p><p>Até lá,<br>{{ $app_name }}</p>',
    ],
    'approval_result' => [
        'name' => 'Resultado da aprovação',
        'subject' => '{{ $title }}',
        'template' => '<p>Oi, {{ $user_name }},</p><p>{{ $body }}</p><p><a href="{{ $link }}" style="display:inline-block;background:#FF6B2C;color:#13201F;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:14px">Abrir o evento</a></p><p>{{ $app_name }}</p>',
    ],
    'waitlist_offer' => [
        'name' => 'Oferta da lista de espera',
        'subject' => 'Abriu uma vaga: {{ $event_title }}',
        'template' => '<p>Oi, {{ $user_name }},</p><p>Abriu uma vaga em <strong>{{ $event_title }}</strong>. Ela é sua se você garantir até {{ $expires }}; depois disso, passa para a próxima pessoa da lista de espera.</p><p><a href="{{ $link }}" style="display:inline-block;background:#FF6B2C;color:#13201F;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:14px">Garantir sua vaga</a></p><p>{{ $app_name }}</p>',
    ],
    'event_changed' => [
        'name' => 'Evento alterado',
        'subject' => 'Mudança em {{ $event_title }}',
        'template' => '<p>Oi, {{ $user_name }},</p><p>{{ $body }}</p><p>Seus ingressos continuam válidos.</p><p><a href="{{ $link }}" style="display:inline-block;background:#FF6B2C;color:#13201F;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:14px">Ver os detalhes</a></p><p>{{ $app_name }}</p>',
    ],
    'event_cancelled' => [
        'name' => 'Evento cancelado',
        'subject' => '{{ $event_title }} foi cancelado',
        'template' => '<p>Oi, {{ $user_name }},</p><p>{{ $body }}</p><p>Se você pagou, o reembolso está a caminho da sua forma de pagamento original — você não precisa fazer nada.</p><p>{{ $app_name }}</p>',
    ],
    'announcement' => [
        'name' => 'Comunicado do organizador',
        'subject' => '{{ $title }}',
        'template' => '<p>Oi, {{ $user_name }},</p><p style="white-space:pre-line">{{ $body }}</p><p><a href="{{ $link }}" style="display:inline-block;background:#FF6B2C;color:#13201F;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:14px">Abrir o evento</a></p><p style="font-size:12px;color:#59625F">Você está recebendo isto porque está na lista de convidados. Gerencie as notificações no app {{ $app_name }}.</p>',
    ],
    'event_reminder' => [
        'name' => 'Lembrete do evento',
        'subject' => 'Amanhã: {{ $event_title }}',
        'template' => '<p>Oi, {{ $user_name }},</p><p><strong>{{ $event_title }}</strong> é amanhã — {{ $when }}{{ $where }}.</p><p>{{ $body }}</p><p><a href="{{ $link }}" style="display:inline-block;background:#FF6B2C;color:#13201F;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:14px">Seu ingresso</a></p><p style="font-size:12px;color:#59625F">Seu ingresso funciona offline no app {{ $app_name }}. Desative os lembretes de eventos nas suas configurações de notificação.</p>',
    ],
    'event_thank_you' => [
        'name' => 'Agradecimento (após o evento)',
        'subject' => '{{ $title }}',
        'template' => '<p>Oi, {{ $user_name }},</p><p style="white-space:pre-line">{{ $body }}</p><p><a href="{{ $link }}" style="display:inline-block;background:#FF6B2C;color:#13201F;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:14px">Ver as fotos e deixar uma avaliação</a></p><p style="font-size:12px;color:#59625F">Você está recebendo isto porque foi a {{ $event_title }}. Gerencie as notificações no app {{ $app_name }}.</p>',
    ],
    'team_invite' => [
        'name' => 'Convite para a equipe',
        'subject' => 'Entre na equipe {{ $organizer_name }} no {{ $app_name }}',
        'template' => '<p>{{ $invited_by }} para a equipe <strong>{{ $organizer_name }}</strong> como <strong>{{ $role }}</strong>.</p><p><a href="{{ $accept_url }}" style="display:inline-block;background:#FF6B2C;color:#13201F;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:14px">Aceitar o convite</a></p><p>Entre (ou crie uma conta) com este e-mail para aceitar. O link vale por {{ $days }} dias.</p>',
    ],
    'refund_processed' => [
        'name' => 'Reembolso processado',
        'subject' => '{{ $title }}',
        'template' => '<p>Oi, {{ $user_name }},</p><p>{{ $body }}</p><p><strong>Pedido:</strong> {{ $order_number }} · {{ $event_title }}<br><strong>Reembolsado:</strong> {{ $amount }}</p><p><a href="{{ $link }}" style="display:inline-block;background:#FF6B2C;color:#13201F;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:14px">Seus ingressos</a></p><p>{{ $app_name }}</p>',
    ],
];
