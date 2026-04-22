<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Must stay aligned with `frontend/src/lib/password-policy.ts` (passwordPolicyStringSchema).
 */
class PasswordPolicyRule implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! is_string($value)) {
            $fail('Invalid password.');

            return;
        }

        if (strlen($value) < 6) {
            $fail('Minimum 6 characters');

            return;
        }

        if (! preg_match('/[A-Z]/', $value)) {
            $fail('At least 1 uppercase letter');

            return;
        }

        if (! preg_match('/[0-9]/', $value)) {
            $fail('At least 1 number');

            return;
        }

        if (! preg_match('/[!@#$%^&*.,;:\/|\\\\}{"\'\]\[]/u', $value)) {
            $fail("At least 1 special character (!@#$%^&*.,;:/|\\}{\"'[])");

            return;
        }
    }
}
