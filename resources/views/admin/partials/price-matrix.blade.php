{{-- One product's price in every active currency.

     Used by the plan price matrix.

     Inputs take **major units** — 15000 for rupiah, 9.99 for dollars — exactly
     as the price is written on the site. A minor-unit field is how somebody
     eventually types 9.99 for a $9.99 plan and charges nine cents.

     Expects: $product, $type ('subscription-plan'), $currencies. --}}
@php
    $locale = app()->getLocale();
    $book = \App\Support\Pricing::book($product);
    $matrixId = $type.'-'.$product->id;
@endphp

<form method="POST"
      action="{{ route('admin.pricing.update', ['locale' => $locale, 'type' => $type, 'id' => $product->id]) }}"
      class="border rounded p-2 mt-2 bg-light">
    @csrf

    <div class="d-flex align-items-center justify-content-between mb-2">
        <span class="small fw-bold">{{ __('Prices by currency') }}</span>
        <span class="small text-muted">
            {{ __('Empty fields use conversion.') }}
        </span>
    </div>

    @include('admin.partials.form-lock-actions', ['saveLabel' => __('Save prices'), 'sticky' => false])

    <div class="row g-2">
        @foreach($currencies as $currency)
            @php
                $row = $book[strtoupper($currency->code)] ?? null;
                $step = $currency->exponent === 0 ? '1' : '0.'.str_repeat('0', $currency->exponent - 1).'1';

                /* Prefill the currency the product is already denominated in from its
                   own price, so the matrix opens showing what the product actually
                   costs rather than an empty field an operator might save over. Only
                   that one currency: filling the rest from conversion would present a
                   derived figure as a decision, which is what the Suggest button is
                   for. */
                $ownCurrency = strtoupper((string) ($product->currency ?: ''));
                $value = $row?->major();

                if ($value === null && $currency->code === $ownCurrency) {
                    $value = \App\Support\Money::fromMinor((int) $product->price_cents, $currency->code);
                }
            @endphp
            <div class="col-md-3">
                <label class="form-label small mb-0" for="price-{{ $matrixId }}-{{ $currency->code }}">
                    {{ $currency->code }}
                    <span class="text-muted">{{ $currency->symbol }}</span>
                    @if($currency->is_default)
                        <span class="badge bg-primary">{{ __('default') }}</span>
                    @endif
                </label>
                <input type="hidden" name="prices[{{ $currency->code }}][currency]" value="{{ $currency->code }}">
                <input type="number"
                       id="price-{{ $matrixId }}-{{ $currency->code }}"
                       class="form-control form-control-sm"
                       name="prices[{{ $currency->code }}][price]"
                       data-price-for="{{ $currency->code }}"
                       step="{{ $step }}"
                       min="0"
                       value="{{ $value }}"
                       placeholder="{{ $currency->exponent === 0 ? '15000' : '9.99' }}">
                @if($row?->compare_at_minor !== null)
                    <small class="text-muted">{{ __('was :price', ['price' => $row->formattedCompareAt()]) }}</small>
                @endif
            </div>
        @endforeach
    </div>

    <div class="d-flex align-items-center gap-2 mt-2">
        {{-- Fills the empty fields from the exchange rates. A suggestion in a
             form, never a price a customer sees — the operator still presses
             save, and can overwrite every figure first. --}}
        <button type="button" class="btn btn-sm btn-outline-secondary"
                data-suggest-url="{{ route('admin.pricing.suggest', ['locale' => $locale, 'type' => $type, 'id' => $product->id]) }}"
                data-matrix="{{ $matrixId }}"
                data-i18n="{{ json_encode([
                    'converting' => __('Converting…'),
                    'filled' => __('Empty fields filled: :count.'),
                    'missing' => __('Currencies with no exchange rate: :count.'),
                    'check' => __('Check them, then save.'),
                    'offline' => __('Could not reach the server. Enter the prices by hand.'),
                ]) }}"
                onclick="suggestPrices(this)">
            {{ __('Suggest from exchange rates') }}
        </button>

        <span class="small text-muted" id="suggest-note-{{ $matrixId }}"></span>
    </div>
</form>

{{-- @once, because this partial repeats per product on both pricing screens.
     Inline rather than a Vite entry: this panel is Blade and loads plain script
     tags — vite.config.js builds only the Inertia site's app.jsx. --}}
@once
    <script>
        /**
         * "Suggest from exchange rates" — fills only the *empty* fields.
         *
         * A price the operator typed is never overwritten by a converted
         * figure. Silently replacing a deliberate 16.999 with 16.000 would be
         * the panel overruling them about their own business, which is worse
         * than offering no suggestion at all.
         */
        async function suggestPrices(button) {
            const form = button.closest('form');
            const note = document.getElementById('suggest-note-' + button.dataset.matrix);
            const t = JSON.parse(button.dataset.i18n);

            button.disabled = true;
            note.textContent = t.converting;

            try {
                const response = await fetch(button.dataset.suggestUrl, {
                    headers: { Accept: 'application/json' },
                    credentials: 'same-origin',
                });

                if (!response.ok) {
                    throw new Error('HTTP ' + response.status);
                }

                const suggestions = await response.json();
                let filled = 0;
                let missingRate = 0;

                for (const code of Object.keys(suggestions)) {
                    const input = form.querySelector('[data-price-for="' + code + '"]');

                    if (!input || input.value !== '') {
                        continue;
                    }

                    if (suggestions[code] === null) {
                        // No exchange rate for this currency. Say so, rather
                        // than leaving the operator wondering why one field
                        // stayed empty.
                        missingRate++;
                        continue;
                    }

                    input.value = suggestions[code];
                    filled++;
                }

                const parts = [t.filled.replace(':count', filled)];

                if (missingRate > 0) {
                    parts.push(t.missing.replace(':count', missingRate));
                }

                parts.push(t.check);
                note.textContent = parts.join(' ');
            } catch (error) {
                note.textContent = t.offline;
            } finally {
                button.disabled = false;
            }
        }
    </script>
@endonce
