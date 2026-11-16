<?php

declare(strict_types=1);

/*
 | Email templates (email_templates rows), by key: the Simplified Chinese seed.
 | Keys mirror resources/lang/en/emails.php. Placeholders are `{{ $name }}`
 | and must stay exactly as written.
 */

return [
    'verification_code' => [
        'name' => '验证码',
        'subject' => '{{ $code }} 是你的 {{ $app_name }} 验证码',
        'template' => '<p>{{ $user_name }}，你好：</p><p>在 {{ $app_name }} 输入以下验证码，确认是你本人：</p><p style="font-size:28px;font-weight:700;letter-spacing:6px">{{ $code }}</p><p>验证码将在 {{ $minutes }} 分钟后失效。</p><p>如果这不是你本人操作，忽略这封邮件即可。没有这个验证码，任何人都无法使用你的邮箱地址。</p><p>活动现场见，<br>{{ $app_name }}</p>',
    ],
    'reset_password' => [
        'name' => '重置密码',
        'subject' => '重置你的 {{ $app_name }} 密码',
        'template' => '<p>{{ $user_name }}，你好：</p><p>我们收到了重置你 {{ $app_name }} 账户密码的请求。</p><p><a href="{{ $url }}">设置新密码</a></p><p>该链接将在 {{ $minutes }} 分钟后失效。如果你没有发出这个请求，忽略这封邮件即可，你的密码不会改变，门票也安然无恙。</p><p style="font-size:12px;color:#6b7280">如果链接无法打开，请将以下地址复制到浏览器中：<br>{{ $url }}</p>',
    ],
    'welcome' => [
        'name' => '欢迎',
        'subject' => '欢迎来到 {{ $app_name }}',
        'template' => '<p>{{ $user_name }}，你好：</p><p>你的账户已准备就绪。你的门票、收藏的活动和关注的主办方，现在在网页和应用上都能随时查看。</p><p><a href="{{ $read_url }}">看看你附近有什么活动</a></p><p>关注几个你喜欢的主办方，他们的新活动就会主动来找你。</p><p>活动现场见，<br>{{ $app_name }}</p>',
    ],
    'password_changed' => [
        'name' => '密码已修改',
        'subject' => '你的 {{ $app_name }} 密码已修改',
        'template' => '<p>{{ $user_name }}，你好：</p><p>你的 {{ $app_name }} 账户密码已于 {{ $when }} 修改，其他设备均已退出登录。</p><p>如果是你本人操作，无需任何处理。如果不是，请<a href="{{ $reset_url }}">立即重置密码</a>并联系客服。</p><p>{{ $app_name }}</p>',
    ],
    'newsletter_confirm' => [
        'name' => '新闻通讯确认',
        'subject' => '确认订阅 {{ $app_name }}',
        'template' => '<p>有人（希望是你）请求将 {{ $email }} 订阅 {{ $app_name }} 的新闻通讯。</p><p><a href="{{ $confirm_url }}">是的，订阅</a></p><p>如果不是你本人，请忽略此邮件。除非打开链接，否则该地址不会被加入任何列表。</p>',
    ],
    'subscription_started' => [
        'name' => 'Plus 已开通',
        'subject' => '欢迎加入 {{ $app_name }} Plus',
        'template' => '<p>{{ $user_name }}，你好：</p><p>你的 <strong>{{ $plan_name }}</strong> 会员已生效：€30 以内的门票免服务费，抢先参与预售，候补名单优先排第一。</p><p><strong>已支付：</strong>{{ $price }}<br><strong>自动续费：</strong>{{ $renews }}</p><p><a href="{{ $billing_url }}">管理你的会员</a></p><p>活动现场见，<br>{{ $app_name }}</p>',
    ],
    'subscription_ended' => [
        'name' => 'Plus 即将到期',
        'subject' => '你的 {{ $app_name }} Plus 将不再续费',
        'template' => '<p>{{ $user_name }}，你好：</p><p>你的 <strong>{{ $plan_name }}</strong> 会员将不再续费。Plus 权益会保留到 {{ $ends_at }}。</p><p>你的门票和收藏的活动都会原样保留，你随时可以重新开通 Plus。</p><p><a href="{{ $pricing_url }}">查看会员方案</a></p><p>{{ $app_name }}</p>',
    ],
    'purchase_receipt' => [
        'name' => '购买收据',
        'subject' => '你在 {{ $app_name }} 的购买',
        'template' => '<p>{{ $user_name }}，你好：</p><p>谢谢！<strong>{{ $item_name }}</strong> 已添加到你的账户。</p><p><strong>已支付：</strong>{{ $amount }}<br><strong>已添加：</strong>{{ $granted }}</p><p><a href="{{ $shop_url }}">你的账户</a></p><p>活动现场见，<br>{{ $app_name }}</p>',
    ],
    'ticket_created' => [
        'name' => '工单创建确认',
        'subject' => '我们已收到你的请求',
        'template' => '<p>{{ $user_name }}，你好：</p><p>我们已收到你的请求“{{ $subject }}”，会尽快回复你。</p><p>—— {{ $app_name }} 客服团队</p>',
    ],
    'support_reply' => [
        'name' => '客服回复',
        'subject' => '回复：{{ $subject }}',
        'template' => '<p>{{ $user_name }}，你好：</p><p style="white-space:pre-line">{{ $reply }}</p><p>—— {{ $agent_name }}，{{ $app_name }} 客服团队</p><p style="font-size:12px;color:#6b7280">请求编号 #{{ $ticket_id }}。如还需要其他帮助，直接回复这封邮件即可。</p>',
    ],
    'ticket_status_update' => [
        'name' => '工单状态更新',
        'subject' => '你的客服请求有更新',
        'template' => '<p>{{ $user_name }}，你好：</p><p>你的请求“{{ $subject }}”当前状态为 <strong>{{ $status }}</strong>。</p><p>—— {{ $app_name }} 客服团队</p>',
    ],
    'ticket_resolved' => [
        'name' => '工单已解决通知',
        'subject' => '你的客服请求已解决',
        'template' => '<p>{{ $user_name }}，你好：</p><p>你的请求“{{ $subject }}”已解决。</p><p>—— {{ $app_name }} 客服团队</p>',
    ],
    'ticket_feedback_request' => [
        'name' => '客服反馈邀请',
        'subject' => '我们做得怎么样？',
        'template' => '<p>{{ $user_name }}，你好：</p><p>感谢你联系 {{ $app_name }} 客服。<a href="{{ $feedback_link }}">告诉我们你的体验</a>。</p>',
    ],
    'organizer_payout_sent' => [
        'name' => '结算款已发出',
        'subject' => '你的 {{ $app_name }} 结算款已发出',
        'template' => '<p>{{ $organizer_name }}，你好：</p><p>我们已发出 <strong>{{ $amount }}</strong>。{{ $body }}</p><p><a href="{{ $dashboard_url }}" style="display:inline-block;background:#FF6B2C;color:#13201F;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:14px">查看你的余额</a></p><p>&mdash; {{ $app_name }}</p>',
    ],
    'order_confirmed' => [
        'name' => '订单已确认（门票）',
        'subject' => '你的 {{ $event_title }} 门票',
        'template' => '<p>{{ $user_name }}，你好：</p><p>你将参加 <strong>{{ $event_title }}</strong>：{{ $when }}{{ $where }}。</p><p><a href="{{ $ticket_url }}" style="display:inline-block;background:#FF6B2C;color:#13201F;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:14px">打开你的门票</a></p><p><img src="{{ $qr_url }}" width="180" height="180" alt="打开你门票的二维码" style="display:block;border:0"></p><p style="font-size:12px;color:#59625F">{{ $qr_note }}</p><p><strong>门票：</strong>{{ $ticket_codes }}<br><strong>已支付：</strong>{{ $amount }} · 订单 {{ $order_number }}</p><p>现场见，<br>{{ $app_name }}</p>',
    ],
    'approval_result' => [
        'name' => '审核结果',
        'subject' => '{{ $title }}',
        'template' => '<p>{{ $user_name }}，你好：</p><p>{{ $body }}</p><p><a href="{{ $link }}" style="display:inline-block;background:#FF6B2C;color:#13201F;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:14px">打开活动</a></p><p>{{ $app_name }}</p>',
    ],
    'waitlist_offer' => [
        'name' => '候补名额通知',
        'subject' => '有空位了：{{ $event_title }}',
        'template' => '<p>{{ $user_name }}，你好：</p><p><strong>{{ $event_title }}</strong> 空出了一个名额。在 {{ $expires }} 前领取就归你；逾期将留给候补名单上的下一位。</p><p><a href="{{ $link }}" style="display:inline-block;background:#FF6B2C;color:#13201F;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:14px">领取名额</a></p><p>{{ $app_name }}</p>',
    ],
    'event_changed' => [
        'name' => '活动变更',
        'subject' => '{{ $event_title }} 有变更',
        'template' => '<p>{{ $user_name }}，你好：</p><p>{{ $body }}</p><p>你的门票依然有效。</p><p><a href="{{ $link }}" style="display:inline-block;background:#FF6B2C;color:#13201F;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:14px">查看详情</a></p><p>{{ $app_name }}</p>',
    ],
    'event_cancelled' => [
        'name' => '活动已取消',
        'subject' => '{{ $event_title }} 已取消',
        'template' => '<p>{{ $user_name }}，你好：</p><p>{{ $body }}</p><p>如果你已付款，退款正在退回你的原支付方式，你无需做任何操作。</p><p>{{ $app_name }}</p>',
    ],
    'announcement' => [
        'name' => '主办方公告',
        'subject' => '{{ $title }}',
        'template' => '<p>{{ $user_name }}，你好：</p><p style="white-space:pre-line">{{ $body }}</p><p><a href="{{ $link }}" style="display:inline-block;background:#FF6B2C;color:#13201F;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:14px">打开活动</a></p><p style="font-size:12px;color:#59625F">你收到这封邮件，是因为你在嘉宾名单上。可在 {{ $app_name }} 应用中管理通知。</p>',
    ],
    'event_reminder' => [
        'name' => '活动提醒',
        'subject' => '明天：{{ $event_title }}',
        'template' => '<p>{{ $user_name }}，你好：</p><p><strong>{{ $event_title }}</strong> 就在明天：{{ $when }}{{ $where }}。</p><p>{{ $body }}</p><p><a href="{{ $link }}" style="display:inline-block;background:#FF6B2C;color:#13201F;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:14px">你的门票</a></p><p style="font-size:12px;color:#59625F">在 {{ $app_name }} 应用中，你的门票离线也能使用。可在通知设置中关闭活动提醒。</p>',
    ],
    'event_thank_you' => [
        'name' => '感谢参加（活动结束后）',
        'subject' => '{{ $title }}',
        'template' => '<p>{{ $user_name }}，你好：</p><p style="white-space:pre-line">{{ $body }}</p><p><a href="{{ $link }}" style="display:inline-block;background:#FF6B2C;color:#13201F;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:14px">看照片，写评价</a></p><p style="font-size:12px;color:#59625F">你收到这封邮件，是因为你参加了 {{ $event_title }}。可在 {{ $app_name }} 应用中管理通知。</p>',
    ],
    'team_invite' => [
        'name' => '团队邀请',
        'subject' => '在 {{ $app_name }} 上加入 {{ $organizer_name }}',
        'template' => '<p>{{ $invited_by }}以 <strong>{{ $role }}</strong> 身份加入 <strong>{{ $organizer_name }}</strong> 团队。</p><p><a href="{{ $accept_url }}" style="display:inline-block;background:#FF6B2C;color:#13201F;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:14px">接受邀请</a></p><p>请使用此邮箱地址登录（或创建账户）以接受邀请。链接 {{ $days }} 天内有效。</p>',
    ],
    'refund_processed' => [
        'name' => '退款已处理',
        'subject' => '{{ $title }}',
        'template' => '<p>{{ $user_name }}，你好：</p><p>{{ $body }}</p><p><strong>订单：</strong>{{ $order_number }} · {{ $event_title }}<br><strong>已退款：</strong>{{ $amount }}</p><p><a href="{{ $link }}" style="display:inline-block;background:#FF6B2C;color:#13201F;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:14px">你的门票</a></p><p>{{ $app_name }}</p>',
    ],
];
