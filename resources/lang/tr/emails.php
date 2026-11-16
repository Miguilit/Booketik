<?php

declare(strict_types=1);

/*
 | Email templates (email_templates rows), by key: the seed for this
 | language. `EmailTemplateSeeder` writes one row per key and locale; an
 | operator edits them in Admin → Content → Email templates, and a language
 | without a row falls back to English (EmailTemplate::byKey).
 |
 | Placeholders are `{{ $name }}` and must stay exactly as written — the
 | i18n test fails on a missing or extra one.
 */

return [
    'verification_code' => [
        'name' => 'Doğrulama Kodu',
        'subject' => '{{ $app_name }} kodun: {{ $code }}',
        'template' => '<p>Merhaba {{ $user_name }},</p><p>Sen olduğunu onaylamak için bu kodu {{ $app_name }} üzerinde gir:</p><p style="font-size:28px;font-weight:700;letter-spacing:6px">{{ $code }}</p><p>Kodun süresi {{ $minutes }} dakika içinde doluyor.</p><p>Bu işlemi sen yapmadıysan bu e-postayı görmezden gelebilirsin — bu kod olmadan kimse adresini kullanamaz.</p><p>Etkinliklerde görüşmek üzere,<br>{{ $app_name }}</p>',
    ],
    'reset_password' => [
        'name' => 'Şifre Sıfırlama',
        'subject' => '{{ $app_name }} şifreni sıfırla',
        'template' => '<p>Merhaba {{ $user_name }},</p><p>{{ $app_name }} hesabının şifresini sıfırlamak için bir talep aldık.</p><p><a href="{{ $url }}">Yeni bir şifre belirle</a></p><p>Bağlantının süresi {{ $minutes }} dakika içinde doluyor. Bu talebi sen yapmadıysan bu e-postayı görmezden gelebilirsin — şifren aynı kalır, biletlerin de güvende.</p><p style="font-size:12px;color:#6b7280">Bağlantı açılmazsa bu adresi kopyalayıp tarayıcına yapıştır:<br>{{ $url }}</p>',
    ],
    'welcome' => [
        'name' => 'Hoş Geldin',
        'subject' => '{{ $app_name }} dünyasına hoş geldin',
        'template' => '<p>Merhaba {{ $user_name }},</p><p>Hesabın hazır. Biletlerin, kaydettiğin etkinlikler ve takip ettiğin organizatörler artık web\'de ve uygulamada hep seninle.</p><p><a href="{{ $read_url }}">Yakınında neler olduğuna bak</a></p><p>Sevdiğin birkaç organizatörü takip et, yeni etkinlikleri seni bulsun.</p><p>Etkinliklerde görüşmek üzere,<br>{{ $app_name }}</p>',
    ],
    'password_changed' => [
        'name' => 'Şifre Değiştirildi',
        'subject' => '{{ $app_name }} şifren değiştirildi',
        'template' => '<p>Merhaba {{ $user_name }},</p><p>{{ $app_name }} hesabının şifresi değiştirildi ({{ $when }}) ve diğer tüm cihazlarda oturum kapatıldı.</p><p>Bunu sen yaptıysan yapman gereken bir şey yok. Sen yapmadıysan <a href="{{ $reset_url }}">şifreni hemen sıfırla</a> ve destek ekibiyle iletişime geç.</p><p>{{ $app_name }}</p>',
    ],
    'newsletter_confirm' => [
        'name' => 'Bülten Onayı',
        'subject' => '{{ $app_name }} aboneliğini onayla',
        'template' => '<p>Birisi, umarız sen, {{ $email }} adresini {{ $app_name }} bültenine abone etmek istedi.</p><p><a href="{{ $confirm_url }}">Evet, abone ol</a></p><p>Bu sen değilsen bu e-postayı yok say. Bağlantı açılmadıkça adres hiçbir listeye eklenmez.</p>',
    ],
    'subscription_started' => [
        'name' => 'Plus Başladı',
        'subject' => '{{ $app_name }} Plus\'a hoş geldin',
        'template' => '<p>Merhaba {{ $user_name }},</p><p><strong>{{ $plan_name }}</strong> üyeliğin aktif: 30 €\'ya kadar biletlerde hizmet bedeli yok, ön satışlara erken erişim ve bekleme listelerinde ilk sıra senin.</p><p><strong>Ödenen:</strong> {{ $price }}<br><strong>Otomatik yenileme:</strong> {{ $renews }}</p><p><a href="{{ $billing_url }}">Üyeliğini yönet</a></p><p>Etkinliklerde görüşmek üzere,<br>{{ $app_name }}</p>',
    ],
    'subscription_ended' => [
        'name' => 'Plus Sona Eriyor',
        'subject' => '{{ $app_name }} Plus üyeliğin yenilenmeyecek',
        'template' => '<p>Merhaba {{ $user_name }},</p><p><strong>{{ $plan_name }}</strong> üyeliğin yenilenmeyecek. Plus şu tarihe kadar açık kalır: {{ $ends_at }}.</p><p>Biletlerin ve kaydettiğin etkinlikler olduğu yerde kalır; Plus\'a istediğin zaman yeniden geçebilirsin.</p><p><a href="{{ $pricing_url }}">Planlara göz at</a></p><p>{{ $app_name }}</p>',
    ],
    'purchase_receipt' => [
        'name' => 'Satın Alma Makbuzu',
        'subject' => '{{ $app_name }} satın alman',
        'template' => '<p>Merhaba {{ $user_name }},</p><p>Teşekkürler — <strong>{{ $item_name }}</strong> hesabına eklendi.</p><p><strong>Ödenen:</strong> {{ $amount }}<br><strong>Eklenen:</strong> {{ $granted }}</p><p><a href="{{ $shop_url }}">Hesabın</a></p><p>Etkinliklerde görüşmek üzere,<br>{{ $app_name }}</p>',
    ],
    'ticket_created' => [
        'name' => 'Destek Talebi Onayı',
        'subject' => 'Talebini aldık',
        'template' => '<p>Merhaba {{ $user_name }},</p><p>"{{ $subject }}" başlıklı talebini aldık, kısa süre içinde yanıtlayacağız.</p><p>— {{ $app_name }} Destek</p>',
    ],
    'support_reply' => [
        'name' => 'Destek Yanıtı',
        'subject' => 'Ynt: {{ $subject }}',
        'template' => '<p>Merhaba {{ $user_name }},</p><p style="white-space:pre-line">{{ $reply }}</p><p>— {{ $agent_name }}, {{ $app_name }} Destek</p><p style="font-size:12px;color:#6b7280">Talep #{{ $ticket_id }}. Başka bir şeye ihtiyacın olursa bu e-postayı yanıtla.</p>',
    ],
    'ticket_status_update' => [
        'name' => 'Destek Talebi Durum Güncellemesi',
        'subject' => 'Destek talebinle ilgili güncelleme',
        'template' => '<p>Merhaba {{ $user_name }},</p><p>"{{ $subject }}" başlıklı talebinin yeni durumu: <strong>{{ $status }}</strong>.</p><p>— {{ $app_name }} Destek</p>',
    ],
    'ticket_resolved' => [
        'name' => 'Destek Talebi Çözüldü Bildirimi',
        'subject' => 'Destek talebin çözüldü',
        'template' => '<p>Merhaba {{ $user_name }},</p><p>"{{ $subject }}" başlıklı talebin çözüldü.</p><p>— {{ $app_name }} Destek</p>',
    ],
    'ticket_feedback_request' => [
        'name' => 'Destek Geri Bildirim İsteği',
        'subject' => 'Nasıl yardımcı olduk?',
        'template' => '<p>Merhaba {{ $user_name }},</p><p>{{ $app_name }} destek ekibine ulaştığın için teşekkürler. <a href="{{ $feedback_link }}">Nasıl geçtiğini bize anlat</a>.</p>',
    ],
    'organizer_payout_sent' => [
        'name' => 'Ödeme Aktarımı Gönderildi',
        'subject' => '{{ $app_name }} ödeme aktarımın yolda',
        'template' => '<p>Merhaba {{ $organizer_name }},</p><p><strong>{{ $amount }}</strong> tutarını gönderdik. {{ $body }}</p><p><a href="{{ $dashboard_url }}" style="display:inline-block;background:#FF6B2C;color:#13201F;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:14px">Bakiyeni gör</a></p><p>&mdash; {{ $app_name }}</p>',
    ],
    'order_confirmed' => [
        'name' => 'Sipariş Onaylandı (biletler)',
        'subject' => 'Biletlerin hazır: {{ $event_title }}',
        'template' => '<p>Merhaba {{ $user_name }},</p><p>Katılıyorsun: <strong>{{ $event_title }}</strong> — {{ $when }}{{ $where }}.</p><p><a href="{{ $ticket_url }}" style="display:inline-block;background:#FF6B2C;color:#13201F;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:14px">Biletlerini aç</a></p><p><img src="{{ $qr_url }}" width="180" height="180" alt="Biletlerini açan QR kod" style="display:block;border:0"></p><p style="font-size:12px;color:#59625F">{{ $qr_note }}</p><p><strong>Biletler:</strong> {{ $ticket_codes }}<br><strong>Ödenen:</strong> {{ $amount }} · sipariş {{ $order_number }}</p><p>Orada görüşmek üzere,<br>{{ $app_name }}</p>',
    ],
    'approval_result' => [
        'name' => 'Onay Sonucu',
        'subject' => '{{ $title }}',
        'template' => '<p>Merhaba {{ $user_name }},</p><p>{{ $body }}</p><p><a href="{{ $link }}" style="display:inline-block;background:#FF6B2C;color:#13201F;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:14px">Etkinliği aç</a></p><p>{{ $app_name }}</p>',
    ],
    'waitlist_offer' => [
        'name' => 'Bekleme Listesi Teklifi',
        'subject' => 'Yer açıldı: {{ $event_title }}',
        'template' => '<p>Merhaba {{ $user_name }},</p><p><strong>{{ $event_title }}</strong> etkinliğinde bir yer açıldı. Şu zamana kadar alırsan senin: {{ $expires }}. Sonrasında bekleme listesindeki sıradaki kişiye geçer.</p><p><a href="{{ $link }}" style="display:inline-block;background:#FF6B2C;color:#13201F;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:14px">Yerini al</a></p><p>{{ $app_name }}</p>',
    ],
    'event_changed' => [
        'name' => 'Etkinlik Değişti',
        'subject' => 'Değişiklik: {{ $event_title }}',
        'template' => '<p>Merhaba {{ $user_name }},</p><p>{{ $body }}</p><p>Biletlerin geçerliliğini koruyor.</p><p><a href="{{ $link }}" style="display:inline-block;background:#FF6B2C;color:#13201F;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:14px">Ayrıntıları gör</a></p><p>{{ $app_name }}</p>',
    ],
    'event_cancelled' => [
        'name' => 'Etkinlik İptal Edildi',
        'subject' => 'İptal edildi: {{ $event_title }}',
        'template' => '<p>Merhaba {{ $user_name }},</p><p>{{ $body }}</p><p>Ödeme yaptıysan iaden orijinal ödeme yöntemine gönderiliyor — senin bir şey yapmana gerek yok.</p><p>{{ $app_name }}</p>',
    ],
    'announcement' => [
        'name' => 'Organizatör Duyurusu',
        'subject' => '{{ $title }}',
        'template' => '<p>Merhaba {{ $user_name }},</p><p style="white-space:pre-line">{{ $body }}</p><p><a href="{{ $link }}" style="display:inline-block;background:#FF6B2C;color:#13201F;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:14px">Etkinliği aç</a></p><p style="font-size:12px;color:#59625F">Bu e-postayı misafir listesinde olduğun için alıyorsun. Bildirimlerini {{ $app_name }} uygulamasından yönetebilirsin.</p>',
    ],
    'event_reminder' => [
        'name' => 'Etkinlik Hatırlatması',
        'subject' => 'Yarın: {{ $event_title }}',
        'template' => '<p>Merhaba {{ $user_name }},</p><p><strong>{{ $event_title }}</strong> yarın — {{ $when }}{{ $where }}.</p><p>{{ $body }}</p><p><a href="{{ $link }}" style="display:inline-block;background:#FF6B2C;color:#13201F;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:14px">Biletin</a></p><p style="font-size:12px;color:#59625F">Biletin {{ $app_name }} uygulamasında çevrimdışı da çalışır. Etkinlik hatırlatmalarını bildirim ayarlarından kapatabilirsin.</p>',
    ],
    'event_thank_you' => [
        'name' => 'Teşekkürler (etkinlik sonrası)',
        'subject' => '{{ $title }}',
        'template' => '<p>Merhaba {{ $user_name }},</p><p style="white-space:pre-line">{{ $body }}</p><p><a href="{{ $link }}" style="display:inline-block;background:#FF6B2C;color:#13201F;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:14px">Fotoğraflara bak, yorum bırak</a></p><p style="font-size:12px;color:#59625F">Bu e-postayı şu etkinliğe katıldığın için alıyorsun: {{ $event_title }}. Bildirimlerini {{ $app_name }} uygulamasından yönetebilirsin.</p>',
    ],
    'team_invite' => [
        'name' => 'Ekip Daveti',
        'subject' => '{{ $app_name }} üzerinde ekibe katıl: {{ $organizer_name }}',
        'template' => '<p>{{ $invited_by }} — ekip: <strong>{{ $organizer_name }}</strong>, rol: <strong>{{ $role }}</strong>.</p><p><a href="{{ $accept_url }}" style="display:inline-block;background:#FF6B2C;color:#13201F;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:14px">Daveti kabul et</a></p><p>Kabul etmek için bu e-posta adresiyle giriş yap (ya da hesap oluştur). Bağlantı {{ $days }} gün geçerli.</p>',
    ],
    'refund_processed' => [
        'name' => 'İade İşlendi',
        'subject' => '{{ $title }}',
        'template' => '<p>Merhaba {{ $user_name }},</p><p>{{ $body }}</p><p><strong>Sipariş:</strong> {{ $order_number }} · {{ $event_title }}<br><strong>İade edilen:</strong> {{ $amount }}</p><p><a href="{{ $link }}" style="display:inline-block;background:#FF6B2C;color:#13201F;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:14px">Biletlerin</a></p><p>{{ $app_name }}</p>',
    ],
];
