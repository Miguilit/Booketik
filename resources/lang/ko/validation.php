<?php

/*
 | Only the rules the public site's forms use. Anything missing here falls back
 | to Laravel's English line for that key (fallback_locale), not to a blank.
 */
return [
    'accepted' => ':attribute에 동의해야 해요.',
    'confirmed' => ':attribute 확인이 일치하지 않아요.',
    'email' => ':attribute은(는) 올바른 이메일 주소여야 해요.',
    'max' => [
        'string' => ':attribute은(는) :max자 이하여야 해요.',
    ],
    'min' => [
        'string' => ':attribute은(는) :min자 이상이어야 해요.',
    ],
    'required' => ':attribute을(를) 입력하세요.',
    'size' => [
        'string' => ':attribute은(는) :size자여야 해요.',
    ],
    'string' => ':attribute은(는) 문자여야 해요.',
    'unique' => '이미 사용 중인 :attribute이에요.',

    'attributes' => [
        'name' => '이름',
        'email' => '이메일',
        'password' => '비밀번호',
        'code' => '코드',
        'current_password' => '현재 비밀번호',
        'acceptPrivacy' => '이용약관',
        'token' => '토큰',
    ],
];
