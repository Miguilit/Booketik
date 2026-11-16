<?php

/*
 | Only the rules the public site's forms use. Anything missing here falls back
 | to Laravel's English line for that key (fallback_locale), not to a blank.
 */
return [
    'accepted' => 'يجب قبول :attribute.',
    'confirmed' => 'تأكيد :attribute غير متطابق.',
    'email' => 'يجب أن يكون :attribute بريدًا إلكترونيًا صالحًا.',
    'max' => [
        'string' => 'يجب ألا يتجاوز :attribute :max حرفًا.',
    ],
    'min' => [
        'string' => 'يجب أن يحتوي :attribute على :min أحرف على الأقل.',
    ],
    'required' => 'حقل :attribute مطلوب.',
    'size' => [
        'string' => 'يجب أن يتكون :attribute من :size أحرف.',
    ],
    'string' => 'يجب أن يكون :attribute نصًا.',
    'unique' => ':attribute مستخدم بالفعل.',

    'attributes' => [
        'name' => 'الاسم',
        'email' => 'البريد الإلكتروني',
        'password' => 'كلمة المرور',
        'code' => 'الرمز',
        'current_password' => 'كلمة المرور الحالية',
        'acceptPrivacy' => 'الشروط',
        'token' => 'الرمز المميز',
    ],
];
