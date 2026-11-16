<?php

declare(strict_types=1);

return [
    'verification_code' => [
        'name' => '인증 코드',
        'subject' => '{{ $app_name }} 인증 코드: {{ $code }}',
        'template' => '<p>{{ $user_name }}님, 안녕하세요.</p><p>본인 확인을 위해 {{ $app_name }}에 이 코드를 입력하세요:</p><p style="font-size:28px;font-weight:700;letter-spacing:6px">{{ $code }}</p><p>코드는 {{ $minutes }}분 후 만료돼요.</p><p>본인이 요청하지 않았다면 이 이메일은 무시하셔도 돼요. 이 코드 없이는 누구도 회원님의 주소를 사용할 수 없어요.</p><p>곧 만나요,<br>{{ $app_name }}</p>',
    ],
    'reset_password' => [
        'name' => '비밀번호 재설정',
        'subject' => '{{ $app_name }} 비밀번호 재설정',
        'template' => '<p>{{ $user_name }}님, 안녕하세요.</p><p>{{ $app_name }} 계정의 비밀번호 재설정 요청을 받았어요.</p><p><a href="{{ $url }}">새 비밀번호 설정하기</a></p><p>링크는 {{ $minutes }}분 후 만료돼요. 요청하지 않았다면 이 이메일은 무시하셔도 돼요. 비밀번호는 그대로이고 티켓도 안전해요.</p><p style="font-size:12px;color:#6b7280">링크가 열리지 않으면 아래 주소를 브라우저에 복사해 붙여 넣으세요:<br>{{ $url }}</p>',
    ],
    'welcome' => [
        'name' => '환영',
        'subject' => '{{ $app_name }}에 오신 걸 환영해요',
        'template' => '<p>{{ $user_name }}님, 안녕하세요.</p><p>계정이 준비됐어요. 이제 티켓, 저장한 이벤트, 팔로우하는 주최자를 웹과 앱 어디서든 볼 수 있어요.</p><p><a href="{{ $read_url }}">내 주변 이벤트 보기</a></p><p>좋아하는 주최자 몇 곳을 팔로우하면 새 이벤트 소식이 찾아와요.</p><p>곧 만나요,<br>{{ $app_name }}</p>',
    ],
    'password_changed' => [
        'name' => '비밀번호 변경됨',
        'subject' => '{{ $app_name }} 비밀번호가 변경됐어요',
        'template' => '<p>{{ $user_name }}님, 안녕하세요.</p><p>{{ $when }}에 {{ $app_name }} 계정의 비밀번호가 변경됐고, 다른 기기에서는 모두 로그아웃됐어요.</p><p>본인이 변경했다면 따로 할 일은 없어요. 본인이 아니라면 <a href="{{ $reset_url }}">지금 비밀번호를 재설정</a>하고 고객지원에 문의하세요.</p><p>{{ $app_name }}</p>',
    ],
    'newsletter_confirm' => [
        'name' => '뉴스레터 확인',
        'subject' => '{{ $app_name }} 구독을 확인해 주세요',
        'template' => '<p>{{ $email }} 주소로 {{ $app_name }} 뉴스레터 구독 요청이 들어왔습니다.</p><p><a href="{{ $confirm_url }}">네, 구독할게요</a></p><p>본인이 요청하지 않았다면 이 메일을 무시하세요. 링크를 열지 않으면 어떤 목록에도 추가되지 않습니다.</p>',
    ],
    'subscription_started' => [
        'name' => 'Plus 시작',
        'subject' => '{{ $app_name }} Plus에 오신 걸 환영해요',
        'template' => '<p>{{ $user_name }}님, 안녕하세요.</p><p><strong>{{ $plan_name }}</strong> 멤버십이 시작됐어요. €30 이하 티켓 서비스 수수료 면제, 선예매 우선 참여, 대기자 명단 우선권을 누리세요.</p><p><strong>결제 금액:</strong> {{ $price }}<br><strong>자동 갱신:</strong> {{ $renews }}</p><p><a href="{{ $billing_url }}">멤버십 관리</a></p><p>곧 만나요,<br>{{ $app_name }}</p>',
    ],
    'subscription_ended' => [
        'name' => 'Plus 종료 예정',
        'subject' => '{{ $app_name }} Plus가 갱신되지 않아요',
        'template' => '<p>{{ $user_name }}님, 안녕하세요.</p><p><strong>{{ $plan_name }}</strong> 멤버십이 갱신되지 않아요. Plus는 {{ $ends_at }}까지 유지돼요.</p><p>티켓과 저장한 이벤트는 그대로 남아 있고, 언제든 다시 Plus를 시작할 수 있어요.</p><p><a href="{{ $pricing_url }}">요금제 보기</a></p><p>{{ $app_name }}</p>',
    ],
    'purchase_receipt' => [
        'name' => '구매 영수증',
        'subject' => '{{ $app_name }} 구매 내역',
        'template' => '<p>{{ $user_name }}님, 안녕하세요.</p><p>감사해요. <strong>{{ $item_name }}</strong>이(가) 계정에 추가됐어요.</p><p><strong>결제 금액:</strong> {{ $amount }}<br><strong>추가됨:</strong> {{ $granted }}</p><p><a href="{{ $shop_url }}">내 계정</a></p><p>곧 만나요,<br>{{ $app_name }}</p>',
    ],
    'ticket_created' => [
        'name' => '문의 접수 확인',
        'subject' => '문의를 접수했어요',
        'template' => '<p>{{ $user_name }}님, 안녕하세요.</p><p>“{{ $subject }}” 문의를 접수했어요. 곧 답변드릴게요.</p><p>— {{ $app_name }} 고객지원</p>',
    ],
    'support_reply' => [
        'name' => '고객지원 답변',
        'subject' => 'Re: {{ $subject }}',
        'template' => '<p>{{ $user_name }}님, 안녕하세요.</p><p style="white-space:pre-line">{{ $reply }}</p><p>— {{ $agent_name }}, {{ $app_name }} 고객지원</p><p style="font-size:12px;color:#6b7280">문의 #{{ $ticket_id }}. 더 필요한 것이 있으면 이 이메일에 답장하세요.</p>',
    ],
    'ticket_status_update' => [
        'name' => '문의 상태 업데이트',
        'subject' => '고객지원 문의 업데이트',
        'template' => '<p>{{ $user_name }}님, 안녕하세요.</p><p>“{{ $subject }}” 문의가 이제 <strong>{{ $status }}</strong> 상태예요.</p><p>— {{ $app_name }} 고객지원</p>',
    ],
    'ticket_resolved' => [
        'name' => '문의 해결 알림',
        'subject' => '고객지원 문의가 해결됐어요',
        'template' => '<p>{{ $user_name }}님, 안녕하세요.</p><p>“{{ $subject }}” 문의가 해결됐어요.</p><p>— {{ $app_name }} 고객지원</p>',
    ],
    'ticket_feedback_request' => [
        'name' => '고객지원 피드백 요청',
        'subject' => '상담은 어떠셨나요?',
        'template' => '<p>{{ $user_name }}님, 안녕하세요.</p><p>{{ $app_name }} 고객지원에 문의해 주셔서 감사해요. <a href="{{ $feedback_link }}">상담이 어땠는지 알려 주세요</a>.</p>',
    ],
    'organizer_payout_sent' => [
        'name' => '정산 지급',
        'subject' => '{{ $app_name }} 정산금이 지급되고 있어요',
        'template' => '<p>{{ $organizer_name }}님, 안녕하세요.</p><p><strong>{{ $amount }}</strong>을(를) 보냈어요. {{ $body }}</p><p><a href="{{ $dashboard_url }}" style="display:inline-block;background:#FF6B2C;color:#13201F;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:14px">잔액 보기</a></p><p>&mdash; {{ $app_name }}</p>',
    ],
    'order_confirmed' => [
        'name' => '주문 확인 (티켓)',
        'subject' => '{{ $event_title }} 티켓',
        'template' => '<p>{{ $user_name }}님, 안녕하세요.</p><p><strong>{{ $event_title }}</strong>에 참석해요 — {{ $when }}{{ $where }}.</p><p><a href="{{ $ticket_url }}" style="display:inline-block;background:#FF6B2C;color:#13201F;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:14px">티켓 열기</a></p><p><img src="{{ $qr_url }}" width="180" height="180" alt="티켓을 여는 QR 코드" style="display:block;border:0"></p><p style="font-size:12px;color:#59625F">{{ $qr_note }}</p><p><strong>티켓:</strong> {{ $ticket_codes }}<br><strong>결제 금액:</strong> {{ $amount }} · 주문 {{ $order_number }}</p><p>그곳에서 만나요,<br>{{ $app_name }}</p>',
    ],
    'approval_result' => [
        'name' => '승인 결과',
        'subject' => '{{ $title }}',
        'template' => '<p>{{ $user_name }}님, 안녕하세요.</p><p>{{ $body }}</p><p><a href="{{ $link }}" style="display:inline-block;background:#FF6B2C;color:#13201F;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:14px">이벤트 열기</a></p><p>{{ $app_name }}</p>',
    ],
    'waitlist_offer' => [
        'name' => '대기자 자리 제안',
        'subject' => '자리가 났어요: {{ $event_title }}',
        'template' => '<p>{{ $user_name }}님, 안녕하세요.</p><p><strong>{{ $event_title }}</strong>에 자리가 났어요. {{ $expires }}까지 신청하면 회원님의 자리가 되고, 그 이후에는 대기자 명단의 다음 사람에게 넘어가요.</p><p><a href="{{ $link }}" style="display:inline-block;background:#FF6B2C;color:#13201F;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:14px">자리 신청하기</a></p><p>{{ $app_name }}</p>',
    ],
    'event_changed' => [
        'name' => '이벤트 변경',
        'subject' => '{{ $event_title }} 변경 안내',
        'template' => '<p>{{ $user_name }}님, 안녕하세요.</p><p>{{ $body }}</p><p>티켓은 계속 유효해요.</p><p><a href="{{ $link }}" style="display:inline-block;background:#FF6B2C;color:#13201F;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:14px">자세히 보기</a></p><p>{{ $app_name }}</p>',
    ],
    'event_cancelled' => [
        'name' => '이벤트 취소',
        'subject' => '{{ $event_title }}이(가) 취소됐어요',
        'template' => '<p>{{ $user_name }}님, 안녕하세요.</p><p>{{ $body }}</p><p>결제하셨다면 원래 결제 수단으로 환불이 진행 중이에요. 따로 하실 일은 없어요.</p><p>{{ $app_name }}</p>',
    ],
    'announcement' => [
        'name' => '주최자 공지',
        'subject' => '{{ $title }}',
        'template' => '<p>{{ $user_name }}님, 안녕하세요.</p><p style="white-space:pre-line">{{ $body }}</p><p><a href="{{ $link }}" style="display:inline-block;background:#FF6B2C;color:#13201F;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:14px">이벤트 열기</a></p><p style="font-size:12px;color:#59625F">게스트 목록에 있어서 이 메일을 받으셨어요. 알림은 {{ $app_name }} 앱에서 관리할 수 있어요.</p>',
    ],
    'event_reminder' => [
        'name' => '이벤트 리마인더',
        'subject' => '내일: {{ $event_title }}',
        'template' => '<p>{{ $user_name }}님, 안녕하세요.</p><p><strong>{{ $event_title }}</strong>이(가) 내일이에요 — {{ $when }}{{ $where }}.</p><p>{{ $body }}</p><p><a href="{{ $link }}" style="display:inline-block;background:#FF6B2C;color:#13201F;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:14px">내 티켓</a></p><p style="font-size:12px;color:#59625F">티켓은 {{ $app_name }} 앱에서 오프라인으로도 쓸 수 있어요. 이벤트 리마인더는 알림 설정에서 끌 수 있어요.</p>',
    ],
    'event_thank_you' => [
        'name' => '감사 인사 (이벤트 후)',
        'subject' => '{{ $title }}',
        'template' => '<p>{{ $user_name }}님, 안녕하세요.</p><p style="white-space:pre-line">{{ $body }}</p><p><a href="{{ $link }}" style="display:inline-block;background:#FF6B2C;color:#13201F;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:14px">사진 보고 리뷰 남기기</a></p><p style="font-size:12px;color:#59625F">{{ $event_title }}에 참석하셔서 이 메일을 받으셨어요. 알림은 {{ $app_name }} 앱에서 관리할 수 있어요.</p>',
    ],
    'team_invite' => [
        'name' => '팀 초대',
        'subject' => '{{ $app_name }}에서 {{ $organizer_name }} 팀에 합류하세요',
        'template' => '<p>{{ $invited_by }} — <strong>{{ $organizer_name }}</strong> 팀의 <strong>{{ $role }}</strong>(으)로 초대받았어요.</p><p><a href="{{ $accept_url }}" style="display:inline-block;background:#FF6B2C;color:#13201F;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:14px">초대 수락하기</a></p><p>수락하려면 이 이메일 주소로 로그인하거나 계정을 만드세요. 링크는 {{ $days }}일 동안 유효해요.</p>',
    ],
    'refund_processed' => [
        'name' => '환불 처리 완료',
        'subject' => '{{ $title }}',
        'template' => '<p>{{ $user_name }}님, 안녕하세요.</p><p>{{ $body }}</p><p><strong>주문:</strong> {{ $order_number }} · {{ $event_title }}<br><strong>환불 금액:</strong> {{ $amount }}</p><p><a href="{{ $link }}" style="display:inline-block;background:#FF6B2C;color:#13201F;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:14px">내 티켓</a></p><p>{{ $app_name }}</p>',
    ],
];
