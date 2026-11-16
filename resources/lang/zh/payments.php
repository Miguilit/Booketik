<?php

declare(strict_types=1);

/**
 * Checkout instructions, served with the charge rather than held in each client.
 * Simplified Chinese; keys mirror resources/lang/en/payments.php.
 */
return [
    'qris_step_1' => '打开任意支持扫描 QRIS 的应用，例如 GoPay、DANA、OVO、ShopeePay 或你的银行应用。',
    'qris_step_2' => '扫描二维码，确认前请核对金额是否一致。',
    'qris_step_3' => '付款到账后，门票会自动发放。请保持此页面打开。',

    'va_step_1' => '复制下方的虚拟账号。',
    'va_step_2' => '请在截止时间前通过银行应用、ATM 或网上银行完成付款。',
    'va_step_3' => '银行确认转账后，门票会自动发放。',

    'ewallet_step_1' => '点按按钮，打开你的电子钱包应用。',
    'ewallet_step_2' => '核对金额，然后确认付款。',
    'ewallet_step_3' => '付款完成后回到这里，到账后门票会立即发放。',

    'expired' => '此付款码已过期。请生成新的付款码后重试。',
    'pending' => '已收到付款。银行确认后，你的账户会立即更新。',
];
