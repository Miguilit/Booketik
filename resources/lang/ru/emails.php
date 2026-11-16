<?php

declare(strict_types=1);

return [
    'verification_code' => [
        'name' => 'Код подтверждения',
        'subject' => '{{ $code }} — ваш код для {{ $app_name }}',
        'template' => '<p>Здравствуйте, {{ $user_name }}!</p><p>Введите этот код в {{ $app_name }}, чтобы подтвердить, что это вы:</p><p style="font-size:28px;font-weight:700;letter-spacing:6px">{{ $code }}</p><p>Код действует {{ $minutes }} мин.</p><p>Если это были не вы, просто проигнорируйте письмо — без этого кода никто не сможет использовать ваш адрес.</p><p>До встречи,<br>{{ $app_name }}</p>',
    ],
    'reset_password' => [
        'name' => 'Сброс пароля',
        'subject' => 'Сброс пароля {{ $app_name }}',
        'template' => '<p>Здравствуйте, {{ $user_name }}!</p><p>Мы получили запрос на сброс пароля для вашего аккаунта {{ $app_name }}.</p><p><a href="{{ $url }}">Выбрать новый пароль</a></p><p>Ссылка действует {{ $minutes }} мин. Если вы ничего не запрашивали, просто проигнорируйте письмо — пароль останется прежним, а ваши билеты в безопасности.</p><p style="font-size:12px;color:#6b7280">Если ссылка не открывается, скопируйте этот адрес в браузер:<br>{{ $url }}</p>',
    ],
    'welcome' => [
        'name' => 'Добро пожаловать',
        'subject' => 'Добро пожаловать в {{ $app_name }}',
        'template' => '<p>Здравствуйте, {{ $user_name }}!</p><p>Ваш аккаунт готов. Билеты, сохранённые события и организаторы, на которых вы подписаны, теперь всегда с вами — на сайте и в приложении.</p><p><a href="{{ $read_url }}">Посмотреть, что происходит рядом</a></p><p>Подпишитесь на нескольких любимых организаторов — и их новые события сами вас найдут.</p><p>До встречи,<br>{{ $app_name }}</p>',
    ],
    'password_changed' => [
        'name' => 'Пароль изменён',
        'subject' => 'Пароль {{ $app_name }} изменён',
        'template' => '<p>Здравствуйте, {{ $user_name }}!</p><p>Пароль вашего аккаунта {{ $app_name }} был изменён {{ $when }}, и на всех остальных устройствах выполнен выход.</p><p>Если это были вы, ничего делать не нужно. Если нет — <a href="{{ $reset_url }}">сбросьте пароль прямо сейчас</a> и свяжитесь с поддержкой.</p><p>{{ $app_name }}</p>',
    ],
    'newsletter_confirm' => [
        'name' => 'Подтверждение рассылки',
        'subject' => 'Подтвердите подписку на {{ $app_name }}',
        'template' => '<p>Кто-то, надеемся, вы, хочет подписать {{ $email }} на рассылку {{ $app_name }}.</p><p><a href="{{ $confirm_url }}">Да, подписаться</a></p><p>Если это были не вы, просто проигнорируйте письмо. Адрес не будет добавлен ни в один список, пока ссылка не открыта.</p>',
    ],
    'subscription_started' => [
        'name' => 'Plus подключён',
        'subject' => 'Добро пожаловать в {{ $app_name }} Plus',
        'template' => '<p>Здравствуйте, {{ $user_name }}!</p><p>Подписка <strong>{{ $plan_name }}</strong> активна: без сервисного сбора на билеты до €30, ранний доступ к предпродажам и первое место в листах ожидания.</p><p><strong>Оплачено:</strong> {{ $price }}<br><strong>Автопродление:</strong> {{ $renews }}</p><p><a href="{{ $billing_url }}">Управление подпиской</a></p><p>До встречи,<br>{{ $app_name }}</p>',
    ],
    'subscription_ended' => [
        'name' => 'Plus заканчивается',
        'subject' => 'Ваш {{ $app_name }} Plus не будет продлён',
        'template' => '<p>Здравствуйте, {{ $user_name }}!</p><p>Подписка <strong>{{ $plan_name }}</strong> не будет продлена. Plus действует до {{ $ends_at }}.</p><p>Ваши билеты и сохранённые события останутся на месте, а подключить Plus снова можно в любой момент.</p><p><a href="{{ $pricing_url }}">Посмотреть тарифы</a></p><p>{{ $app_name }}</p>',
    ],
    'purchase_receipt' => [
        'name' => 'Чек о покупке',
        'subject' => 'Ваша покупка в {{ $app_name }}',
        'template' => '<p>Здравствуйте, {{ $user_name }}!</p><p>Спасибо! <strong>{{ $item_name }}</strong> уже в вашем аккаунте.</p><p><strong>Оплачено:</strong> {{ $amount }}<br><strong>Начислено:</strong> {{ $granted }}</p><p><a href="{{ $shop_url }}">Ваш аккаунт</a></p><p>До встречи,<br>{{ $app_name }}</p>',
    ],
    'ticket_created' => [
        'name' => 'Подтверждение создания обращения',
        'subject' => 'Мы получили ваше обращение',
        'template' => '<p>Здравствуйте, {{ $user_name }}!</p><p>Мы получили ваше обращение «{{ $subject }}» и скоро ответим.</p><p>— Поддержка {{ $app_name }}</p>',
    ],
    'support_reply' => [
        'name' => 'Ответ поддержки',
        'subject' => 'Re: {{ $subject }}',
        'template' => '<p>Здравствуйте, {{ $user_name }}!</p><p style="white-space:pre-line">{{ $reply }}</p><p>— {{ $agent_name }}, поддержка {{ $app_name }}</p><p style="font-size:12px;color:#6b7280">Обращение №{{ $ticket_id }}. Если нужно что-то ещё, просто ответьте на это письмо.</p>',
    ],
    'ticket_status_update' => [
        'name' => 'Изменение статуса обращения',
        'subject' => 'Новости по вашему обращению',
        'template' => '<p>Здравствуйте, {{ $user_name }}!</p><p>Статус вашего обращения «{{ $subject }}»: <strong>{{ $status }}</strong>.</p><p>— Поддержка {{ $app_name }}</p>',
    ],
    'ticket_resolved' => [
        'name' => 'Уведомление о решении обращения',
        'subject' => 'Ваше обращение решено',
        'template' => '<p>Здравствуйте, {{ $user_name }}!</p><p>Ваше обращение «{{ $subject }}» решено.</p><p>— Поддержка {{ $app_name }}</p>',
    ],
    'ticket_feedback_request' => [
        'name' => 'Запрос отзыва о поддержке',
        'subject' => 'Как мы справились?',
        'template' => '<p>Здравствуйте, {{ $user_name }}!</p><p>Спасибо, что обратились в поддержку {{ $app_name }}. <a href="{{ $feedback_link }}">Расскажите, как всё прошло</a>.</p>',
    ],
    'organizer_payout_sent' => [
        'name' => 'Выплата отправлена',
        'subject' => 'Выплата {{ $app_name }} уже в пути',
        'template' => '<p>Здравствуйте, {{ $organizer_name }}!</p><p>Мы отправили <strong>{{ $amount }}</strong>. {{ $body }}</p><p><a href="{{ $dashboard_url }}" style="display:inline-block;background:#FF6B2C;color:#13201F;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:14px">Посмотреть баланс</a></p><p>&mdash; {{ $app_name }}</p>',
    ],
    'order_confirmed' => [
        'name' => 'Заказ подтверждён (билеты)',
        'subject' => 'Ваши билеты на {{ $event_title }}',
        'template' => '<p>Здравствуйте, {{ $user_name }}!</p><p>Вы идёте на <strong>{{ $event_title }}</strong> — {{ $when }}{{ $where }}.</p><p><a href="{{ $ticket_url }}" style="display:inline-block;background:#FF6B2C;color:#13201F;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:14px">Открыть билеты</a></p><p><img src="{{ $qr_url }}" width="180" height="180" alt="QR-код, который открывает ваши билеты" style="display:block;border:0"></p><p style="font-size:12px;color:#59625F">{{ $qr_note }}</p><p><strong>Билеты:</strong> {{ $ticket_codes }}<br><strong>Оплачено:</strong> {{ $amount }} · заказ {{ $order_number }}</p><p>До встречи на месте,<br>{{ $app_name }}</p>',
    ],
    'approval_result' => [
        'name' => 'Решение по заявке',
        'subject' => '{{ $title }}',
        'template' => '<p>Здравствуйте, {{ $user_name }}!</p><p>{{ $body }}</p><p><a href="{{ $link }}" style="display:inline-block;background:#FF6B2C;color:#13201F;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:14px">Открыть событие</a></p><p>{{ $app_name }}</p>',
    ],
    'waitlist_offer' => [
        'name' => 'Предложение из листа ожидания',
        'subject' => 'Освободилось место: {{ $event_title }}',
        'template' => '<p>Здравствуйте, {{ $user_name }}!</p><p>На <strong>{{ $event_title }}</strong> освободилось место. Оно ваше, если вы займёте его до {{ $expires }}; после этого оно перейдёт следующему в листе ожидания.</p><p><a href="{{ $link }}" style="display:inline-block;background:#FF6B2C;color:#13201F;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:14px">Занять место</a></p><p>{{ $app_name }}</p>',
    ],
    'event_changed' => [
        'name' => 'Изменение события',
        'subject' => 'Изменение: {{ $event_title }}',
        'template' => '<p>Здравствуйте, {{ $user_name }}!</p><p>{{ $body }}</p><p>Ваши билеты остаются действительными.</p><p><a href="{{ $link }}" style="display:inline-block;background:#FF6B2C;color:#13201F;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:14px">Подробности</a></p><p>{{ $app_name }}</p>',
    ],
    'event_cancelled' => [
        'name' => 'Событие отменено',
        'subject' => '{{ $event_title }} отменено',
        'template' => '<p>Здравствуйте, {{ $user_name }}!</p><p>{{ $body }}</p><p>Если вы платили, деньги уже возвращаются на исходный способ оплаты — ничего делать не нужно.</p><p>{{ $app_name }}</p>',
    ],
    'announcement' => [
        'name' => 'Объявление организатора',
        'subject' => '{{ $title }}',
        'template' => '<p>Здравствуйте, {{ $user_name }}!</p><p style="white-space:pre-line">{{ $body }}</p><p><a href="{{ $link }}" style="display:inline-block;background:#FF6B2C;color:#13201F;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:14px">Открыть событие</a></p><p style="font-size:12px;color:#59625F">Вы получили это письмо, потому что вы в списке гостей. Настроить уведомления можно в приложении {{ $app_name }}.</p>',
    ],
    'event_reminder' => [
        'name' => 'Напоминание о событии',
        'subject' => 'Завтра: {{ $event_title }}',
        'template' => '<p>Здравствуйте, {{ $user_name }}!</p><p><strong>{{ $event_title }}</strong> уже завтра — {{ $when }}{{ $where }}.</p><p>{{ $body }}</p><p><a href="{{ $link }}" style="display:inline-block;background:#FF6B2C;color:#13201F;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:14px">Ваш билет</a></p><p style="font-size:12px;color:#59625F">В приложении {{ $app_name }} билет работает без интернета. Отключить напоминания о событиях можно в настройках уведомлений.</p>',
    ],
    'event_thank_you' => [
        'name' => 'Благодарность (после события)',
        'subject' => '{{ $title }}',
        'template' => '<p>Здравствуйте, {{ $user_name }}!</p><p style="white-space:pre-line">{{ $body }}</p><p><a href="{{ $link }}" style="display:inline-block;background:#FF6B2C;color:#13201F;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:14px">Посмотреть фото и оставить отзыв</a></p><p style="font-size:12px;color:#59625F">Вы получили это письмо, потому что были на {{ $event_title }}. Настроить уведомления можно в приложении {{ $app_name }}.</p>',
    ],
    'team_invite' => [
        'name' => 'Приглашение в команду',
        'subject' => 'Присоединяйтесь к {{ $organizer_name }} в {{ $app_name }}',
        'template' => '<p>{{ $invited_by }} в команду <strong>{{ $organizer_name }}</strong> в роли <strong>{{ $role }}</strong>.</p><p><a href="{{ $accept_url }}" style="display:inline-block;background:#FF6B2C;color:#13201F;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:14px">Принять приглашение</a></p><p>Чтобы принять приглашение, войдите (или создайте аккаунт) с этим email. Ссылка действует {{ $days }} дн.</p>',
    ],
    'refund_processed' => [
        'name' => 'Возврат оформлен',
        'subject' => '{{ $title }}',
        'template' => '<p>Здравствуйте, {{ $user_name }}!</p><p>{{ $body }}</p><p><strong>Заказ:</strong> {{ $order_number }} · {{ $event_title }}<br><strong>Возвращено:</strong> {{ $amount }}</p><p><a href="{{ $link }}" style="display:inline-block;background:#FF6B2C;color:#13201F;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:14px">Ваши билеты</a></p><p>{{ $app_name }}</p>',
    ],
];
