<?php

declare(strict_types=1);

return [
    'verification_code' => [
        'name' => '確認コード',
        'subject' => '{{ $app_name }} の確認コードは {{ $code }} です',
        'template' => '<p>{{ $user_name }} さん</p><p>ご本人確認のため、{{ $app_name }} で次のコードを入力してください：</p><p style="font-size:28px;font-weight:700;letter-spacing:6px">{{ $code }}</p><p>有効期限は{{ $minutes }}分です。</p><p>お心当たりがない場合は、このメールを無視してください。このコードがなければ、誰もあなたのメールアドレスを使うことはできません。</p><p>イベントでお会いしましょう。<br>{{ $app_name }}</p>',
    ],
    'reset_password' => [
        'name' => 'パスワードのリセット',
        'subject' => '{{ $app_name }} のパスワードをリセット',
        'template' => '<p>{{ $user_name }} さん</p><p>{{ $app_name }} アカウントのパスワードリセットのリクエストを受け付けました。</p><p><a href="{{ $url }}">新しいパスワードを設定する</a></p><p>リンクの有効期限は{{ $minutes }}分です。お心当たりがない場合は、このメールを無視してください。パスワードは変更されず、チケットも安全です。</p><p style="font-size:12px;color:#6b7280">リンクが開かない場合は、次のアドレスをブラウザにコピーしてください：<br>{{ $url }}</p>',
    ],
    'welcome' => [
        'name' => 'ようこそ',
        'subject' => '{{ $app_name }} へようこそ',
        'template' => '<p>{{ $user_name }} さん</p><p>アカウントの準備ができました。チケット、保存したイベント、フォロー中の主催者を、ウェブでもアプリでも利用できます。</p><p><a href="{{ $read_url }}">近くで開催中のイベントを見る</a></p><p>気になる主催者をフォローすると、新しいイベントの情報が届きます。</p><p>イベントでお会いしましょう。<br>{{ $app_name }}</p>',
    ],
    'password_changed' => [
        'name' => 'パスワード変更',
        'subject' => '{{ $app_name }} のパスワードが変更されました',
        'template' => '<p>{{ $user_name }} さん</p><p>{{ $when }}に {{ $app_name }} アカウントのパスワードが変更され、他の端末からはログアウトされました。</p><p>ご自身で変更した場合は、何もする必要はありません。お心当たりがない場合は、<a href="{{ $reset_url }}">今すぐパスワードをリセット</a>し、サポートにご連絡ください。</p><p>{{ $app_name }}</p>',
    ],
    'newsletter_confirm' => [
        'name' => 'ニュースレターの確認',
        'subject' => '{{ $app_name }} の購読を確認してください',
        'template' => '<p>{{ $email }} を {{ $app_name }} のニュースレターに登録するリクエストがありました。</p><p><a href="{{ $confirm_url }}">はい、登録します</a></p><p>心当たりがない場合は、このメールを無視してください。リンクを開かない限り、どのリストにも追加されません。</p>',
    ],
    'subscription_started' => [
        'name' => 'Plus開始',
        'subject' => '{{ $app_name }} Plus へようこそ',
        'template' => '<p>{{ $user_name }} さん</p><p><strong>{{ $plan_name }}</strong> メンバーシップが有効になりました。€30までのチケットはサービス手数料無料、先行販売への早期アクセス、キャンセル待ちでの優先をご利用いただけます。</p><p><strong>お支払い額：</strong> {{ $price }}<br><strong>自動更新：</strong> {{ $renews }}</p><p><a href="{{ $billing_url }}">メンバーシップを管理</a></p><p>イベントでお会いしましょう。<br>{{ $app_name }}</p>',
    ],
    'subscription_ended' => [
        'name' => 'Plus終了',
        'subject' => '{{ $app_name }} Plus は更新されません',
        'template' => '<p>{{ $user_name }} さん</p><p><strong>{{ $plan_name }}</strong> メンバーシップは更新されません。Plusは{{ $ends_at }}までご利用いただけます。</p><p>チケットや保存したイベントはそのまま残ります。Plusはいつでも再開できます。</p><p><a href="{{ $pricing_url }}">プランを見る</a></p><p>{{ $app_name }}</p>',
    ],
    'purchase_receipt' => [
        'name' => '購入の領収書',
        'subject' => '{{ $app_name }} でのご購入',
        'template' => '<p>{{ $user_name }} さん</p><p>ありがとうございます。<strong>{{ $item_name }}</strong> がアカウントに追加されました。</p><p><strong>お支払い額：</strong> {{ $amount }}<br><strong>追加内容：</strong> {{ $granted }}</p><p><a href="{{ $shop_url }}">アカウントを見る</a></p><p>イベントでお会いしましょう。<br>{{ $app_name }}</p>',
    ],
    'ticket_created' => [
        'name' => '問い合わせ受付の確認',
        'subject' => 'お問い合わせを受け付けました',
        'template' => '<p>{{ $user_name }} さん</p><p>お問い合わせ「{{ $subject }}」を受け付けました。まもなくご返信します。</p><p>— {{ $app_name }} サポート</p>',
    ],
    'support_reply' => [
        'name' => 'サポートからの返信',
        'subject' => 'Re: {{ $subject }}',
        'template' => '<p>{{ $user_name }} さん</p><p style="white-space:pre-line">{{ $reply }}</p><p>— {{ $agent_name }}、{{ $app_name }} サポート</p><p style="font-size:12px;color:#6b7280">お問い合わせ番号 #{{ $ticket_id }}。ほかにご用件があれば、このメールに返信してください。</p>',
    ],
    'ticket_status_update' => [
        'name' => '問い合わせステータスの更新',
        'subject' => 'お問い合わせの状況が更新されました',
        'template' => '<p>{{ $user_name }} さん</p><p>お問い合わせ「{{ $subject }}」のステータスが <strong>{{ $status }}</strong> になりました。</p><p>— {{ $app_name }} サポート</p>',
    ],
    'ticket_resolved' => [
        'name' => '問い合わせ解決のお知らせ',
        'subject' => 'お問い合わせが解決しました',
        'template' => '<p>{{ $user_name }} さん</p><p>お問い合わせ「{{ $subject }}」は解決済みになりました。</p><p>— {{ $app_name }} サポート</p>',
    ],
    'ticket_feedback_request' => [
        'name' => 'サポートへのフィードバックのお願い',
        'subject' => 'サポートはいかがでしたか？',
        'template' => '<p>{{ $user_name }} さん</p><p>{{ $app_name }} サポートへのお問い合わせありがとうございました。<a href="{{ $feedback_link }}">ご感想をお聞かせください</a>。</p>',
    ],
    'organizer_payout_sent' => [
        'name' => '出金完了',
        'subject' => '{{ $app_name }} からの出金を送金しました',
        'template' => '<p>{{ $organizer_name }} さん</p><p><strong>{{ $amount }}</strong> を送金しました。{{ $body }}</p><p><a href="{{ $dashboard_url }}" style="display:inline-block;background:#FF6B2C;color:#13201F;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:14px">残高を見る</a></p><p>&mdash; {{ $app_name }}</p>',
    ],
    'order_confirmed' => [
        'name' => '注文確定（チケット）',
        'subject' => '{{ $event_title }} のチケット',
        'template' => '<p>{{ $user_name }} さん</p><p><strong>{{ $event_title }}</strong> への参加が決まりました — {{ $when }}{{ $where }}。</p><p><a href="{{ $ticket_url }}" style="display:inline-block;background:#FF6B2C;color:#13201F;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:14px">チケットを開く</a></p><p><img src="{{ $qr_url }}" width="180" height="180" alt="チケットを開くQRコード" style="display:block;border:0"></p><p style="font-size:12px;color:#59625F">{{ $qr_note }}</p><p><strong>チケット：</strong> {{ $ticket_codes }}<br><strong>お支払い額：</strong> {{ $amount }} · 注文番号 {{ $order_number }}</p><p>会場でお会いしましょう。<br>{{ $app_name }}</p>',
    ],
    'approval_result' => [
        'name' => '承認結果',
        'subject' => '{{ $title }}',
        'template' => '<p>{{ $user_name }} さん</p><p>{{ $body }}</p><p><a href="{{ $link }}" style="display:inline-block;background:#FF6B2C;color:#13201F;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:14px">イベントを開く</a></p><p>{{ $app_name }}</p>',
    ],
    'waitlist_offer' => [
        'name' => 'キャンセル待ちのご案内',
        'subject' => '空きが出ました: {{ $event_title }}',
        'template' => '<p>{{ $user_name }} さん</p><p><strong>{{ $event_title }}</strong> に空きが出ました。{{ $expires }}までに確保すればあなたの参加枠になります。それ以降はキャンセル待ちの次の方にご案内します。</p><p><a href="{{ $link }}" style="display:inline-block;background:#FF6B2C;color:#13201F;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:14px">参加枠を確保する</a></p><p>{{ $app_name }}</p>',
    ],
    'event_changed' => [
        'name' => 'イベント内容の変更',
        'subject' => '{{ $event_title }} の変更のお知らせ',
        'template' => '<p>{{ $user_name }} さん</p><p>{{ $body }}</p><p>お持ちのチケットは引き続き有効です。</p><p><a href="{{ $link }}" style="display:inline-block;background:#FF6B2C;color:#13201F;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:14px">詳細を見る</a></p><p>{{ $app_name }}</p>',
    ],
    'event_cancelled' => [
        'name' => 'イベント中止',
        'subject' => '{{ $event_title }} は中止になりました',
        'template' => '<p>{{ $user_name }} さん</p><p>{{ $body }}</p><p>お支払い済みの場合は、元のお支払い方法に返金されます。お手続きは不要です。</p><p>{{ $app_name }}</p>',
    ],
    'announcement' => [
        'name' => '主催者からのお知らせ',
        'subject' => '{{ $title }}',
        'template' => '<p>{{ $user_name }} さん</p><p style="white-space:pre-line">{{ $body }}</p><p><a href="{{ $link }}" style="display:inline-block;background:#FF6B2C;color:#13201F;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:14px">イベントを開く</a></p><p style="font-size:12px;color:#59625F">ゲストリストに登録されているため、このメールをお送りしています。通知の設定は {{ $app_name }} アプリで変更できます。</p>',
    ],
    'event_reminder' => [
        'name' => 'イベントのリマインダー',
        'subject' => '明日: {{ $event_title }}',
        'template' => '<p>{{ $user_name }} さん</p><p><strong>{{ $event_title }}</strong> は明日です — {{ $when }}{{ $where }}。</p><p>{{ $body }}</p><p><a href="{{ $link }}" style="display:inline-block;background:#FF6B2C;color:#13201F;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:14px">チケットを見る</a></p><p style="font-size:12px;color:#59625F">チケットは {{ $app_name }} アプリでオフラインでも使えます。イベントのリマインダーは通知設定でオフにできます。</p>',
    ],
    'event_thank_you' => [
        'name' => 'お礼（イベント後）',
        'subject' => '{{ $title }}',
        'template' => '<p>{{ $user_name }} さん</p><p style="white-space:pre-line">{{ $body }}</p><p><a href="{{ $link }}" style="display:inline-block;background:#FF6B2C;color:#13201F;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:14px">写真を見てレビューを書く</a></p><p style="font-size:12px;color:#59625F">{{ $event_title }} にご参加いただいたため、このメールをお送りしています。通知の設定は {{ $app_name }} アプリで変更できます。</p>',
    ],
    'team_invite' => [
        'name' => 'チームへの招待',
        'subject' => '{{ $app_name }} で {{ $organizer_name }} に参加しましょう',
        'template' => '<p>{{ $invited_by }}：<strong>{{ $organizer_name }}</strong> チームに <strong>{{ $role }}</strong> として参加してください。</p><p><a href="{{ $accept_url }}" style="display:inline-block;background:#FF6B2C;color:#13201F;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:14px">招待を承認する</a></p><p>承認するには、このメールアドレスでログイン（またはアカウントを作成）してください。リンクの有効期限は{{ $days }}日間です。</p>',
    ],
    'refund_processed' => [
        'name' => '返金完了',
        'subject' => '{{ $title }}',
        'template' => '<p>{{ $user_name }} さん</p><p>{{ $body }}</p><p><strong>注文：</strong> {{ $order_number }} · {{ $event_title }}<br><strong>返金額：</strong> {{ $amount }}</p><p><a href="{{ $link }}" style="display:inline-block;background:#FF6B2C;color:#13201F;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:14px">チケットを見る</a></p><p>{{ $app_name }}</p>',
    ],
];
