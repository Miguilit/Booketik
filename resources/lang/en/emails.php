<?php

declare(strict_types=1);

/*
 | Email templates (email_templates rows), by key: the seed for this
 | language. `EmailTemplateSeeder` writes one row per key and locale; an
 | operator edits them in Admin → Content → Email templates, and a language
 | without a row falls back to English (EmailTemplate::byKey).
 |
 | Placeholders are `{{ $name }}` and must stay exactly as written — the
 | i18n test fails on a missing or extra one. `{{ $app_name }}` is always
 | given; guest mail also gets `{{ $user_name }}`, `{{ $title }}`, `{{ $body }}`
 | and `{{ $link }}` from NotificationService.
 */

return [
    'verification_code' => [
        'name' => 'Verification Code',
        'subject' => '{{ $code }} is your {{ $app_name }} code',
        'template' => '<p>Hi {{ $user_name }},</p><p>Enter this code on {{ $app_name }} to confirm it is you:</p><p style="font-size:28px;font-weight:700;letter-spacing:6px">{{ $code }}</p><p>It expires in {{ $minutes }} minutes.</p><p>If this was not you, you can ignore this email — nobody can use your address without this code.</p><p>See you out there,<br>{{ $app_name }}</p>',
    ],
    'reset_password' => [
        'name' => 'Reset Password',
        'subject' => 'Reset your {{ $app_name }} password',
        'template' => '<p>Hi {{ $user_name }},</p><p>We received a request to reset the password on your {{ $app_name }} account.</p><p><a href="{{ $url }}">Choose a new password</a></p><p>The link expires in {{ $minutes }} minutes. If you did not ask for it, you can ignore this email — your password stays as it is and your tickets are safe.</p><p style="font-size:12px;color:#6b7280">If the link does not open, copy this address into your browser:<br>{{ $url }}</p>',
    ],
    'welcome' => [
        'name' => 'Welcome',
        'subject' => 'Welcome to {{ $app_name }}',
        'template' => '<p>Hi {{ $user_name }},</p><p>Your account is ready. Your tickets, saved events and the organizers you follow now come with you across the web and the app.</p><p><a href="{{ $read_url }}">See what is on near you</a></p><p>Follow a few organizers you like and their new events will find you.</p><p>See you out there,<br>{{ $app_name }}</p>',
    ],
    'password_changed' => [
        'name' => 'Password Changed',
        'subject' => 'Your {{ $app_name }} password was changed',
        'template' => '<p>Hi {{ $user_name }},</p><p>The password on your {{ $app_name }} account was changed on {{ $when }}, and any other devices were signed out.</p><p>If this was you, there is nothing to do. If it was not, <a href="{{ $reset_url }}">reset your password now</a> and contact support.</p><p>{{ $app_name }}</p>',
    ],
    'newsletter_confirm' => [
        'name' => 'Newsletter Confirmation',
        'subject' => 'Confirm your {{ $app_name }} subscription',
        'template' => '<p>Someone, hopefully you, asked to subscribe {{ $email }} to the {{ $app_name }} newsletter.</p><p><a href="{{ $confirm_url }}">Yes, subscribe me</a></p><p>If this was not you, ignore this email. The address is not added to any list unless the link is opened.</p>',
    ],
    'subscription_started' => [
        'name' => 'Plus Started',
        'subject' => 'Welcome to {{ $app_name }} Plus',
        'template' => '<p>Hi {{ $user_name }},</p><p>Your <strong>{{ $plan_name }}</strong> membership is active: no service fee on tickets up to €30, early access to presales and first place on waitlists.</p><p><strong>Paid:</strong> {{ $price }}<br><strong>Renews automatically:</strong> {{ $renews }}</p><p><a href="{{ $billing_url }}">Manage your membership</a></p><p>See you out there,<br>{{ $app_name }}</p>',
    ],
    'subscription_ended' => [
        'name' => 'Plus Ending',
        'subject' => 'Your {{ $app_name }} Plus will not renew',
        'template' => '<p>Hi {{ $user_name }},</p><p>Your <strong>{{ $plan_name }}</strong> membership will not renew. Plus stays on until {{ $ends_at }}.</p><p>Your tickets and saved events stay exactly where they are, and you can pick Plus up again whenever you like.</p><p><a href="{{ $pricing_url }}">See the plans</a></p><p>{{ $app_name }}</p>',
    ],
    'purchase_receipt' => [
        'name' => 'Purchase Receipt',
        'subject' => 'Your {{ $app_name }} purchase',
        'template' => '<p>Hi {{ $user_name }},</p><p>Thanks — <strong>{{ $item_name }}</strong> is in your account.</p><p><strong>Paid:</strong> {{ $amount }}<br><strong>Added:</strong> {{ $granted }}</p><p><a href="{{ $shop_url }}">Your account</a></p><p>See you out there,<br>{{ $app_name }}</p>',
    ],
    'ticket_created' => [
        'name' => 'Ticket Creation Confirmation',
        'subject' => 'We received your request',
        'template' => '<p>Hi {{ $user_name }},</p><p>We received your request "{{ $subject }}" and will reply shortly.</p><p>— {{ $app_name }} Support</p>',
    ],
    'support_reply' => [
        'name' => 'Support Reply',
        'subject' => 'Re: {{ $subject }}',
        'template' => '<p>Hi {{ $user_name }},</p><p style="white-space:pre-line">{{ $reply }}</p><p>— {{ $agent_name }}, {{ $app_name }} Support</p><p style="font-size:12px;color:#6b7280">Request #{{ $ticket_id }}. Reply to this email if you need anything else.</p>',
    ],
    'ticket_status_update' => [
        'name' => 'Ticket Status Update',
        'subject' => 'Update on your support request',
        'template' => '<p>Hi {{ $user_name }},</p><p>Your request "{{ $subject }}" is now <strong>{{ $status }}</strong>.</p><p>— {{ $app_name }} Support</p>',
    ],
    'ticket_resolved' => [
        'name' => 'Ticket Resolved Notification',
        'subject' => 'Your support request is resolved',
        'template' => '<p>Hi {{ $user_name }},</p><p>Your request "{{ $subject }}" has been resolved.</p><p>— {{ $app_name }} Support</p>',
    ],
    'ticket_feedback_request' => [
        'name' => 'Support Feedback Request',
        'subject' => 'How did we do?',
        'template' => '<p>Hi {{ $user_name }},</p><p>Thanks for contacting {{ $app_name }} support. <a href="{{ $feedback_link }}">Tell us how it went</a>.</p>',
    ],
    'organizer_payout_sent' => [
        'name' => 'Payout Sent',
        'subject' => 'Your {{ $app_name }} payout is on its way',
        'template' => '<p>Hi {{ $organizer_name }},</p><p>We have sent <strong>{{ $amount }}</strong>. {{ $body }}</p><p><a href="{{ $dashboard_url }}" style="display:inline-block;background:#FF6B2C;color:#13201F;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:14px">See your balance</a></p><p>&mdash; {{ $app_name }}</p>',
    ],
    'order_confirmed' => [
        'name' => 'Order Confirmed (tickets)',
        'subject' => 'Your tickets for {{ $event_title }}',
        'template' => '<p>Hi {{ $user_name }},</p><p>You are going to <strong>{{ $event_title }}</strong> — {{ $when }}{{ $where }}.</p><p><a href="{{ $ticket_url }}" style="display:inline-block;background:#FF6B2C;color:#13201F;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:14px">Open your tickets</a></p><p><img src="{{ $qr_url }}" width="180" height="180" alt="QR code that opens your tickets" style="display:block;border:0"></p><p style="font-size:12px;color:#59625F">{{ $qr_note }}</p><p><strong>Tickets:</strong> {{ $ticket_codes }}<br><strong>Paid:</strong> {{ $amount }} · order {{ $order_number }}</p><p>See you there,<br>{{ $app_name }}</p>',
    ],
    'approval_result' => [
        'name' => 'Approval Result',
        'subject' => '{{ $title }}',
        'template' => '<p>Hi {{ $user_name }},</p><p>{{ $body }}</p><p><a href="{{ $link }}" style="display:inline-block;background:#FF6B2C;color:#13201F;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:14px">Open the event</a></p><p>{{ $app_name }}</p>',
    ],
    'waitlist_offer' => [
        'name' => 'Waitlist Offer',
        'subject' => 'A spot opened up: {{ $event_title }}',
        'template' => '<p>Hi {{ $user_name }},</p><p>A place opened up at <strong>{{ $event_title }}</strong>. It is yours if you claim it by {{ $expires }}; after that it goes to the next person on the waitlist.</p><p><a href="{{ $link }}" style="display:inline-block;background:#FF6B2C;color:#13201F;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:14px">Claim your spot</a></p><p>{{ $app_name }}</p>',
    ],
    'event_changed' => [
        'name' => 'Event Changed',
        'subject' => 'Change to {{ $event_title }}',
        'template' => '<p>Hi {{ $user_name }},</p><p>{{ $body }}</p><p>Your tickets stay valid.</p><p><a href="{{ $link }}" style="display:inline-block;background:#FF6B2C;color:#13201F;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:14px">See the details</a></p><p>{{ $app_name }}</p>',
    ],
    'event_cancelled' => [
        'name' => 'Event Cancelled',
        'subject' => '{{ $event_title }} is cancelled',
        'template' => '<p>Hi {{ $user_name }},</p><p>{{ $body }}</p><p>If you paid, the refund is on its way to your original payment method — you do not need to do anything.</p><p>{{ $app_name }}</p>',
    ],
    'announcement' => [
        'name' => 'Organizer Announcement',
        'subject' => '{{ $title }}',
        'template' => '<p>Hi {{ $user_name }},</p><p style="white-space:pre-line">{{ $body }}</p><p><a href="{{ $link }}" style="display:inline-block;background:#FF6B2C;color:#13201F;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:14px">Open the event</a></p><p style="font-size:12px;color:#59625F">You are receiving this because you are on the guest list. Manage notifications in the {{ $app_name }} app.</p>',
    ],
    'event_reminder' => [
        'name' => 'Event Reminder',
        'subject' => 'Tomorrow: {{ $event_title }}',
        'template' => '<p>Hi {{ $user_name }},</p><p><strong>{{ $event_title }}</strong> is tomorrow — {{ $when }}{{ $where }}.</p><p>{{ $body }}</p><p><a href="{{ $link }}" style="display:inline-block;background:#FF6B2C;color:#13201F;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:14px">Your ticket</a></p><p style="font-size:12px;color:#59625F">Your ticket works offline in the {{ $app_name }} app. Turn off event reminders in your notification settings.</p>',
    ],
    'event_thank_you' => [
        'name' => 'Thank You (after the event)',
        'subject' => '{{ $title }}',
        'template' => '<p>Hi {{ $user_name }},</p><p style="white-space:pre-line">{{ $body }}</p><p><a href="{{ $link }}" style="display:inline-block;background:#FF6B2C;color:#13201F;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:14px">See the photos and leave a review</a></p><p style="font-size:12px;color:#59625F">You are receiving this because you went to {{ $event_title }}. Manage notifications in the {{ $app_name }} app.</p>',
    ],
    'team_invite' => [
        'name' => 'Team Invite',
        'subject' => 'Join {{ $organizer_name }} on {{ $app_name }}',
        'template' => '<p>{{ $invited_by }} to the <strong>{{ $organizer_name }}</strong> team as <strong>{{ $role }}</strong>.</p><p><a href="{{ $accept_url }}" style="display:inline-block;background:#FF6B2C;color:#13201F;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:14px">Accept the invitation</a></p><p>Sign in (or create an account) with this email address to accept. The link works for {{ $days }} days.</p>',
    ],
    'refund_processed' => [
        'name' => 'Refund Processed',
        'subject' => '{{ $title }}',
        'template' => '<p>Hi {{ $user_name }},</p><p>{{ $body }}</p><p><strong>Order:</strong> {{ $order_number }} · {{ $event_title }}<br><strong>Refunded:</strong> {{ $amount }}</p><p><a href="{{ $link }}" style="display:inline-block;background:#FF6B2C;color:#13201F;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:14px">Your tickets</a></p><p>{{ $app_name }}</p>',
    ],
];
