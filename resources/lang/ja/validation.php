<?php

/*
 | Only the rules the public site's forms use. Anything missing here falls back
 | to Laravel's English line for that key (fallback_locale), not to a blank.
 */
return [
    'accepted' => ':attributeに同意してください。',
    'confirmed' => ':attributeの確認が一致しません。',
    'email' => ':attributeには有効なメールアドレスを入力してください。',
    'max' => [
        'string' => ':attributeは:max文字以内で入力してください。',
    ],
    'min' => [
        'string' => ':attributeは:min文字以上で入力してください。',
    ],
    'required' => ':attributeは必須です。',
    'size' => [
        'string' => ':attributeは:size文字で入力してください。',
    ],
    'string' => ':attributeは文字列で入力してください。',
    'unique' => 'この:attributeはすでに使われています。',

    'attributes' => [
        'name' => '名前',
        'email' => 'メールアドレス',
        'password' => 'パスワード',
        'code' => 'コード',
        'current_password' => '現在のパスワード',
        'acceptPrivacy' => '利用規約',
        'token' => 'トークン',
    ],
];
