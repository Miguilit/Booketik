<?php

declare(strict_types=1);

return [
    'verification_code' => [
        'name' => 'رمز التحقق',
        'subject' => '{{ $code }} هو رمزك في {{ $app_name }}',
        'template' => '<p>مرحبًا {{ $user_name }}،</p><p>أدخل هذا الرمز في {{ $app_name }} لتأكيد هويتك:</p><p style="font-size:28px;font-weight:700;letter-spacing:6px">{{ $code }}</p><p>تنتهي صلاحيته خلال {{ $minutes }} دقيقة.</p><p>إن لم تكن أنت، تجاهل هذه الرسالة — لا يمكن لأحد استخدام بريدك دون هذا الرمز.</p><p>نراك قريبًا،<br>{{ $app_name }}</p>',
    ],
    'reset_password' => [
        'name' => 'إعادة تعيين كلمة المرور',
        'subject' => 'أعد تعيين كلمة مرورك في {{ $app_name }}',
        'template' => '<p>مرحبًا {{ $user_name }}،</p><p>تلقّينا طلبًا لإعادة تعيين كلمة المرور لحسابك في {{ $app_name }}.</p><p><a href="{{ $url }}">اختر كلمة مرور جديدة</a></p><p>تنتهي صلاحية الرابط خلال {{ $minutes }} دقيقة. إن لم تطلب ذلك، تجاهل هذه الرسالة — ستبقى كلمة مرورك كما هي وتذاكرك في أمان.</p><p style="font-size:12px;color:#6b7280">إن لم يُفتح الرابط، انسخ هذا العنوان في متصفحك:<br>{{ $url }}</p>',
    ],
    'welcome' => [
        'name' => 'الترحيب',
        'subject' => 'مرحبًا بك في {{ $app_name }}',
        'template' => '<p>مرحبًا {{ $user_name }}،</p><p>حسابك جاهز. تذاكرك وفعالياتك المحفوظة والمنظِّمون الذين تتابعهم أصبحوا معك على الويب وفي التطبيق.</p><p><a href="{{ $read_url }}">اكتشف ما يجري بالقرب منك</a></p><p>تابع بعض المنظِّمين الذين يعجبونك، وستصلك فعالياتهم الجديدة.</p><p>نراك قريبًا،<br>{{ $app_name }}</p>',
    ],
    'password_changed' => [
        'name' => 'تم تغيير كلمة المرور',
        'subject' => 'تم تغيير كلمة مرورك في {{ $app_name }}',
        'template' => '<p>مرحبًا {{ $user_name }}،</p><p>تم تغيير كلمة المرور لحسابك في {{ $app_name }} بتاريخ {{ $when }}، وتم تسجيل الخروج من جميع الأجهزة الأخرى.</p><p>إن كنت أنت، فلا داعي لأي إجراء. وإن لم تكن أنت، <a href="{{ $reset_url }}">أعد تعيين كلمة مرورك الآن</a> وتواصل مع الدعم.</p><p>{{ $app_name }}</p>',
    ],
    'newsletter_confirm' => [
        'name' => 'تأكيد النشرة البريدية',
        'subject' => 'أكّد اشتراكك في {{ $app_name }}',
        'template' => '<p>طلب أحدهم، ونأمل أن تكون أنت، اشتراك {{ $email }} في النشرة البريدية لـ {{ $app_name }}.</p><p><a href="{{ $confirm_url }}">نعم، اشترك</a></p><p>إن لم تكن أنت، فتجاهل هذه الرسالة. لن يُضاف العنوان إلى أي قائمة ما لم يُفتح الرابط.</p>',
    ],
    'subscription_started' => [
        'name' => 'بدء اشتراك Plus',
        'subject' => 'مرحبًا بك في {{ $app_name }} Plus',
        'template' => '<p>مرحبًا {{ $user_name }}،</p><p>عضويتك <strong>{{ $plan_name }}</strong> مفعّلة: بلا رسوم خدمة على التذاكر حتى 30 €، ووصول مبكر إلى البيع المسبق، وأولوية في قوائم الانتظار.</p><p><strong>المبلغ المدفوع:</strong> {{ $price }}<br><strong>تتجدد تلقائيًا:</strong> {{ $renews }}</p><p><a href="{{ $billing_url }}">إدارة عضويتك</a></p><p>نراك قريبًا،<br>{{ $app_name }}</p>',
    ],
    'subscription_ended' => [
        'name' => 'انتهاء اشتراك Plus',
        'subject' => 'لن يتجدد اشتراكك في {{ $app_name }} Plus',
        'template' => '<p>مرحبًا {{ $user_name }}،</p><p>لن تتجدد عضويتك <strong>{{ $plan_name }}</strong>. ستبقى مزايا Plus مفعّلة حتى {{ $ends_at }}.</p><p>تبقى تذاكرك وفعالياتك المحفوظة في مكانها تمامًا، ويمكنك العودة إلى Plus متى شئت.</p><p><a href="{{ $pricing_url }}">اطّلع على الخطط</a></p><p>{{ $app_name }}</p>',
    ],
    'purchase_receipt' => [
        'name' => 'إيصال الشراء',
        'subject' => 'عملية الشراء في {{ $app_name }}',
        'template' => '<p>مرحبًا {{ $user_name }}،</p><p>شكرًا — أصبح <strong>{{ $item_name }}</strong> في حسابك.</p><p><strong>المبلغ المدفوع:</strong> {{ $amount }}<br><strong>المُضاف:</strong> {{ $granted }}</p><p><a href="{{ $shop_url }}">حسابك</a></p><p>نراك قريبًا،<br>{{ $app_name }}</p>',
    ],
    'ticket_created' => [
        'name' => 'تأكيد إنشاء طلب الدعم',
        'subject' => 'تلقّينا طلبك',
        'template' => '<p>مرحبًا {{ $user_name }}،</p><p>تلقّينا طلبك "{{ $subject }}" وسنرد عليك قريبًا.</p><p>— فريق دعم {{ $app_name }}</p>',
    ],
    'support_reply' => [
        'name' => 'رد الدعم',
        'subject' => 'رد: {{ $subject }}',
        'template' => '<p>مرحبًا {{ $user_name }}،</p><p style="white-space:pre-line">{{ $reply }}</p><p>— {{ $agent_name }}، فريق دعم {{ $app_name }}</p><p style="font-size:12px;color:#6b7280">الطلب رقم {{ $ticket_id }}#. رُدّ على هذه الرسالة إن احتجت إلى أي شيء آخر.</p>',
    ],
    'ticket_status_update' => [
        'name' => 'تحديث حالة طلب الدعم',
        'subject' => 'مستجدات طلب الدعم الخاص بك',
        'template' => '<p>مرحبًا {{ $user_name }}،</p><p>أصبحت حالة طلبك "{{ $subject }}" الآن <strong>{{ $status }}</strong>.</p><p>— فريق دعم {{ $app_name }}</p>',
    ],
    'ticket_resolved' => [
        'name' => 'إشعار حل طلب الدعم',
        'subject' => 'تم حل طلب الدعم الخاص بك',
        'template' => '<p>مرحبًا {{ $user_name }}،</p><p>تم حل طلبك "{{ $subject }}".</p><p>— فريق دعم {{ $app_name }}</p>',
    ],
    'ticket_feedback_request' => [
        'name' => 'طلب تقييم الدعم',
        'subject' => 'كيف كانت تجربتك معنا؟',
        'template' => '<p>مرحبًا {{ $user_name }}،</p><p>شكرًا لتواصلك مع دعم {{ $app_name }}. <a href="{{ $feedback_link }}">أخبرنا كيف سارت الأمور</a>.</p>',
    ],
    'organizer_payout_sent' => [
        'name' => 'تم إرسال الدفعة',
        'subject' => 'دفعتك من {{ $app_name }} في الطريق إليك',
        'template' => '<p>مرحبًا {{ $organizer_name }}،</p><p>أرسلنا <strong>{{ $amount }}</strong>. {{ $body }}</p><p><a href="{{ $dashboard_url }}" style="display:inline-block;background:#FF6B2C;color:#13201F;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:14px">اطّلع على رصيدك</a></p><p>&mdash; {{ $app_name }}</p>',
    ],
    'order_confirmed' => [
        'name' => 'تأكيد الطلب (التذاكر)',
        'subject' => 'تذاكرك لـ {{ $event_title }}',
        'template' => '<p>مرحبًا {{ $user_name }}،</p><p>أنت ذاهب إلى <strong>{{ $event_title }}</strong> — {{ $when }}{{ $where }}.</p><p><a href="{{ $ticket_url }}" style="display:inline-block;background:#FF6B2C;color:#13201F;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:14px">افتح تذاكرك</a></p><p><img src="{{ $qr_url }}" width="180" height="180" alt="رمز QR يفتح تذاكرك" style="display:block;border:0"></p><p style="font-size:12px;color:#59625F">{{ $qr_note }}</p><p><strong>التذاكر:</strong> {{ $ticket_codes }}<br><strong>المبلغ المدفوع:</strong> {{ $amount }} · الطلب {{ $order_number }}</p><p>نراك هناك،<br>{{ $app_name }}</p>',
    ],
    'approval_result' => [
        'name' => 'نتيجة طلب الموافقة',
        'subject' => '{{ $title }}',
        'template' => '<p>مرحبًا {{ $user_name }}،</p><p>{{ $body }}</p><p><a href="{{ $link }}" style="display:inline-block;background:#FF6B2C;color:#13201F;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:14px">افتح الفعالية</a></p><p>{{ $app_name }}</p>',
    ],
    'waitlist_offer' => [
        'name' => 'عرض من قائمة الانتظار',
        'subject' => 'توفّر مكان: {{ $event_title }}',
        'template' => '<p>مرحبًا {{ $user_name }}،</p><p>توفّر مكان في <strong>{{ $event_title }}</strong>. إنه لك إن حجزته قبل {{ $expires }}؛ وبعد ذلك ينتقل إلى الشخص التالي في قائمة الانتظار.</p><p><a href="{{ $link }}" style="display:inline-block;background:#FF6B2C;color:#13201F;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:14px">احجز مكانك</a></p><p>{{ $app_name }}</p>',
    ],
    'event_changed' => [
        'name' => 'تغيير في الفعالية',
        'subject' => 'تغيير في {{ $event_title }}',
        'template' => '<p>مرحبًا {{ $user_name }}،</p><p>{{ $body }}</p><p>تبقى تذاكرك صالحة.</p><p><a href="{{ $link }}" style="display:inline-block;background:#FF6B2C;color:#13201F;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:14px">اطّلع على التفاصيل</a></p><p>{{ $app_name }}</p>',
    ],
    'event_cancelled' => [
        'name' => 'إلغاء الفعالية',
        'subject' => 'أُلغيت {{ $event_title }}',
        'template' => '<p>مرحبًا {{ $user_name }}،</p><p>{{ $body }}</p><p>إن كنت قد دفعت، فالمبلغ المسترد في طريقه إلى وسيلة الدفع الأصلية — لا داعي لأي إجراء منك.</p><p>{{ $app_name }}</p>',
    ],
    'announcement' => [
        'name' => 'إعلان من المنظِّم',
        'subject' => '{{ $title }}',
        'template' => '<p>مرحبًا {{ $user_name }}،</p><p style="white-space:pre-line">{{ $body }}</p><p><a href="{{ $link }}" style="display:inline-block;background:#FF6B2C;color:#13201F;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:14px">افتح الفعالية</a></p><p style="font-size:12px;color:#59625F">تصلك هذه الرسالة لأنك على قائمة الضيوف. يمكنك إدارة الإشعارات من تطبيق {{ $app_name }}.</p>',
    ],
    'event_reminder' => [
        'name' => 'تذكير بالفعالية',
        'subject' => 'غدًا: {{ $event_title }}',
        'template' => '<p>مرحبًا {{ $user_name }}،</p><p><strong>{{ $event_title }}</strong> غدًا — {{ $when }}{{ $where }}.</p><p>{{ $body }}</p><p><a href="{{ $link }}" style="display:inline-block;background:#FF6B2C;color:#13201F;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:14px">تذكرتك</a></p><p style="font-size:12px;color:#59625F">تعمل تذكرتك دون اتصال في تطبيق {{ $app_name }}. يمكنك إيقاف تذكيرات الفعاليات من إعدادات الإشعارات.</p>',
    ],
    'event_thank_you' => [
        'name' => 'شكر (بعد الفعالية)',
        'subject' => '{{ $title }}',
        'template' => '<p>مرحبًا {{ $user_name }}،</p><p style="white-space:pre-line">{{ $body }}</p><p><a href="{{ $link }}" style="display:inline-block;background:#FF6B2C;color:#13201F;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:14px">شاهد الصور واترك تقييمًا</a></p><p style="font-size:12px;color:#59625F">تصلك هذه الرسالة لأنك حضرت {{ $event_title }}. يمكنك إدارة الإشعارات من تطبيق {{ $app_name }}.</p>',
    ],
    'team_invite' => [
        'name' => 'دعوة إلى الفريق',
        'subject' => 'انضم إلى {{ $organizer_name }} على {{ $app_name }}',
        'template' => '<p>{{ $invited_by }} إلى فريق <strong>{{ $organizer_name }}</strong> بدور <strong>{{ $role }}</strong>.</p><p><a href="{{ $accept_url }}" style="display:inline-block;background:#FF6B2C;color:#13201F;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:14px">اقبل الدعوة</a></p><p>سجّل الدخول (أو أنشئ حسابًا) بهذا البريد الإلكتروني لقبول الدعوة. يعمل الرابط لمدة {{ $days }} يوم.</p>',
    ],
    'refund_processed' => [
        'name' => 'تمت معالجة الاسترداد',
        'subject' => '{{ $title }}',
        'template' => '<p>مرحبًا {{ $user_name }}،</p><p>{{ $body }}</p><p><strong>الطلب:</strong> {{ $order_number }} · {{ $event_title }}<br><strong>المبلغ المسترد:</strong> {{ $amount }}</p><p><a href="{{ $link }}" style="display:inline-block;background:#FF6B2C;color:#13201F;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:14px">تذاكرك</a></p><p>{{ $app_name }}</p>',
    ],
];
