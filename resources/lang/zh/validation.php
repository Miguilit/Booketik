<?php

/*
 | Only the rules the public site's forms use. Anything missing here falls back
 | to Laravel's English line for that key (fallback_locale), not to a blank.
 */
return [
    'accepted' => '请同意:attribute。',
    'confirmed' => ':attribute两次输入不一致。',
    'email' => ':attribute必须是有效的邮箱地址。',
    'max' => [
        'string' => ':attribute不能超过:max个字符。',
    ],
    'min' => [
        'string' => ':attribute至少需要:min个字符。',
    ],
    'required' => ':attribute不能为空。',
    'size' => [
        'string' => ':attribute必须是:size个字符。',
    ],
    'string' => ':attribute必须是文本。',
    'unique' => ':attribute已被使用。',

    'attributes' => [
        'name' => '名称',
        'email' => '邮箱',
        'password' => '密码',
        'code' => '验证码',
        'current_password' => '当前密码',
        'acceptPrivacy' => '服务条款',
        'token' => '令牌',
    ],
];
