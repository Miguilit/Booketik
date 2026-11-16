@extends('admin.admin_master')
@section('admin')
    @php
        $locale = app()->getLocale();

        // Every write on this screen is admin-only (CurrencyController::middleware);
        // staff get the list and a read-only view of each currency.
        $isAdmin = auth()->user()?->isAdmin();

        /*
         | Every drawer form posts a hidden `_drawer` naming itself. A failed
         | validation flashes the input back, so the drawer that was being
         | edited reopens with what was typed instead of the saved values.
         */
        $reopen = $errors->any() ? old('_drawer') : null;
        $val = fn (string $drawer, string $field, $saved) => $reopen === $drawer ? old($field, $saved) : $saved;
        $live = fn (string $drawer, $saved) => $reopen === $drawer ? (bool) old('is_active') : (bool) $saved;
    @endphp

    @include('admin.partials.flash')

    <div class="card card-default">
        <div class="card-header card-header-border-bottom d-flex justify-content-between align-items-center">
            <h2 class="mb-0">{{ __('Currencies') }}</h2>
            @if($isAdmin)
                <button type="button" class="btn btn-sm btn-primary" data-drawer="#new-currency">{{ __('Add currency') }}</button>
            @endif
        </div>

        <div class="card-body">
            <div class="table-responsive">
                <table class="table align-middle">
                    <thead>
                    <tr>
                        <th>{{ __('Currency') }}</th>
                        <th>{{ __('Example') }}</th>
                        <th class="text-end">{{ __('Decimals') }}</th>
                        <th class="text-end" title="{{ __('1 unit of this = N :base', ['base' => $baseCode]) }}">{{ __('Rate to :base', ['base' => $baseCode]) }}</th>
                        <th class="text-end" title="{{ __('Round suggested prices to a multiple of this') }}">{{ __('Round') }}</th>
                        <th>{{ __('Status') }}</th>
                        <x-row-actions-header />
                    </tr>
                    </thead>
                    <tbody>
                    @forelse($currencies as $currency)
                        @php
                            $isPriced = in_array(strtoupper($currency->code), $pricedCodes, true);
                            $needsRate = ! $currency->is_base && $currency->rate_to_base === null;
                        @endphp
                        <tr class="{{ $currency->is_active ? '' : 'text-muted' }}">
                            <td>
                                <strong>{{ $currency->code }}</strong>
                                @if($currency->symbol)
                                    <span class="text-muted">{{ $currency->symbol }}</span>
                                @endif
                                <div class="small text-muted">{{ $currency->name }}</div>
                            </td>
                            <td class="text-nowrap">
                                {{-- How 1,500,000 minor units reads with the saved rules. --}}
                                <span class="badge bg-light text-dark">{{ \App\Support\Money::format(1500000, $currency->code) }}</span>
                            </td>
                            <td class="text-end">{{ $currency->exponent }}</td>
                            <td class="text-end text-nowrap">
                                @if($currency->is_base)
                                    <span class="text-muted">{{ __('base') }}</span>
                                @elseif($currency->rate_to_base !== null)
                                    {{ rtrim(rtrim(number_format((float) $currency->rate_to_base, 8, '.', ''), '0'), '.') }}
                                @else
                                    <span class="text-muted">—</span>
                                @endif
                            </td>
                            <td class="text-end">{{ $currency->rounding_step ?: '—' }}</td>
                            <td style="min-width: 180px">
                                @if($currency->is_active)
                                    <span class="badge bg-success">{{ __('Live') }}</span>
                                @else
                                    <span class="badge bg-secondary">{{ __('Off') }}</span>
                                @endif
                                @if($currency->is_default)
                                    <span class="badge bg-primary">{{ __('Default') }}</span>
                                @endif
                                @if($currency->is_base)
                                    <span class="badge bg-dark">{{ __('Base') }}</span>
                                @endif

                                @if($currency->is_active && ! $isPriced && $productCount > 0)
                                    <div><span class="badge bg-warning text-dark">{{ __('No prices set') }}</span></div>
                                @endif
                                @if($currency->is_active && $needsRate)
                                    <div><span class="badge bg-warning text-dark">{{ __('No exchange rate') }}</span></div>
                                @endif
                            </td>
                            <td class="row-actions-col">
                                <x-row-actions>
                                    <a class="row-actions-item" role="menuitem" data-drawer="#currency-{{ $currency->id }}">
                                        <i class="mdi mdi-{{ $isAdmin ? 'pencil' : 'eye-outline' }}" aria-hidden="true"></i>
                                        <span>{{ $isAdmin ? __('Edit currency') : __('View currency') }}</span>
                                    </a>
                                    @if($isAdmin)
                                        @unless($currency->is_default)
                                            <x-row-action-form icon="star-outline" tone="" method="POST"
                                                               :action="route('admin.settings.currencies.default', ['locale' => $locale, 'currency' => $currency->id])">
                                                {{ __('Make default') }}
                                            </x-row-action-form>
                                        @endunless
                                        @unless($currency->is_base)
                                            <x-row-action-form icon="scale-balance" tone="warning" method="POST"
                                                               :action="route('admin.settings.currencies.base', ['locale' => $locale, 'currency' => $currency->id])"
                                                               :confirm="__('Make :code the base? All rates will be cleared.', ['code' => $currency->code])">
                                                {{ __('Make base') }}
                                            </x-row-action-form>
                                        @endunless
                                        @unless($currency->is_default || $currency->is_base)
                                            <x-row-actions-divider />
                                            <x-row-action-form icon="delete" tone="danger"
                                                               :action="route('admin.settings.currencies.delete', ['locale' => $locale, 'currency' => $currency->id])"
                                                               :confirm="__('Delete :code?', ['code' => $currency->code])">
                                                {{ __('Delete currency') }}
                                            </x-row-action-form>
                                        @endunless
                                    @endif
                                </x-row-actions>
                            </td>
                        </tr>
                    @empty
                        <tr><td colspan="7" class="text-muted">{{ __('No currencies yet.') }}</td></tr>
                    @endforelse
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    <p class="text-muted small">
        {!! __('Plan prices are set on :link. Ticket prices are set by each organizer, per tier.', ['link' => '<a href="'.e(route('admin.billing.plans.prices', ['locale' => $locale])).'">'.e(__('Prices by currency')).'</a>']) !!}
    </p>

    {{-- One panel per currency. Staff see the same panel read-only. --}}
    @foreach($currencies as $currency)
        @php $d = 'currency-'.$currency->id; @endphp

        <x-drawer :id="$d" :title="$currency->code.' — '.$currency->name"
                  :subtitle="\App\Support\Money::format(1500000, $currency->code)"
                  :autoopen="$reopen === $d">
            <form id="{{ $d }}-form" method="POST"
                  action="{{ route('admin.settings.currencies.update', ['locale' => $locale, 'currency' => $currency->id]) }}">
                @csrf
                <input type="hidden" name="_drawer" value="{{ $d }}">

                <fieldset @disabled(! $isAdmin)>
                    <div class="cl-drawer__section">
                        <div class="cl-drawer__section-title">{{ __('Currency') }}</div>
                        <div class="row g-2">
                            <div class="col-4 mb-2">
                                <label class="form-label small" for="{{ $d }}-code">{{ __('Code') }}</label>
                                <input type="text" class="form-control text-uppercase" id="{{ $d }}-code" name="code"
                                       value="{{ $val($d, 'code', $currency->code) }}" maxlength="3" required>
                            </div>
                            <div class="col-8 mb-2">
                                <label class="form-label small" for="{{ $d }}-name">{{ __('Name') }}</label>
                                <input type="text" class="form-control" id="{{ $d }}-name" name="name"
                                       value="{{ $val($d, 'name', $currency->name) }}" required>
                            </div>
                        </div>
                    </div>

                    <div class="cl-drawer__section">
                        <div class="cl-drawer__section-title">{{ __('How it is written') }}</div>
                        <div class="row g-2">
                            <div class="col-6 mb-2">
                                <label class="form-label small" for="{{ $d }}-exponent">{{ __('Decimal places') }}</label>
                                <select class="form-control" id="{{ $d }}-exponent" name="exponent">
                                    @foreach([0, 2, 3] as $exp)
                                        <option value="{{ $exp }}" @selected((int) $val($d, 'exponent', $currency->exponent) === $exp)>{{ $exp }}</option>
                                    @endforeach
                                </select>
                            </div>
                            <div class="col-6 mb-2">
                                <label class="form-label small" for="{{ $d }}-symbol">{{ __('Symbol') }}</label>
                                <input type="text" class="form-control" id="{{ $d }}-symbol" name="symbol"
                                       value="{{ $val($d, 'symbol', $currency->symbol) }}" maxlength="8">
                            </div>
                            <div class="col-6 mb-2">
                                <label class="form-label small" for="{{ $d }}-position">{{ __('Symbol position') }}</label>
                                <select class="form-control" id="{{ $d }}-position" name="symbol_position">
                                    <option value="before" @selected($val($d, 'symbol_position', $currency->symbol_position) === 'before')>{{ __('Before — $9.99') }}</option>
                                    <option value="after" @selected($val($d, 'symbol_position', $currency->symbol_position) === 'after')>{{ __('After — 9,99 €') }}</option>
                                </select>
                            </div>
                            <div class="col-3 mb-2">
                                <label class="form-label small" for="{{ $d }}-thousands" title="{{ __('Thousands separator') }}">1,000</label>
                                <input type="text" class="form-control" id="{{ $d }}-thousands" name="thousands_sep"
                                       value="{{ $val($d, 'thousands_sep', $currency->thousands_sep) }}" maxlength="4">
                            </div>
                            <div class="col-3 mb-2">
                                <label class="form-label small" for="{{ $d }}-decimal" title="{{ __('Decimal separator') }}">0.00</label>
                                <input type="text" class="form-control" id="{{ $d }}-decimal" name="decimal_sep"
                                       value="{{ $val($d, 'decimal_sep', $currency->decimal_sep) }}" maxlength="4">
                            </div>
                        </div>
                    </div>

                    <div class="cl-drawer__section">
                        <div class="cl-drawer__section-title">{{ __('Pricing & reporting') }}</div>
                        <div class="row g-2">
                            <div class="col-6 mb-2">
                                <label class="form-label small" for="{{ $d }}-rounding">{{ __('Round prices to') }}</label>
                                <input type="number" min="0" class="form-control" id="{{ $d }}-rounding" name="rounding_step"
                                       value="{{ $val($d, 'rounding_step', $currency->rounding_step) }}">
                            </div>
                            <div class="col-6 mb-2">
                                <label class="form-label small" for="{{ $d }}-rate" title="{{ __('1 unit of this = N :base', ['base' => $baseCode]) }}">{{ __('Rate to :base', ['base' => $baseCode]) }}</label>
                                <input type="number" step="0.00000001" min="0" class="form-control" id="{{ $d }}-rate"
                                       name="rate_to_base" value="{{ $val($d, 'rate_to_base', $currency->rate_to_base) }}"
                                       @readonly($currency->is_base)>
                                <small class="text-muted">{{ $currency->is_base ? __('Base currency.') : __('Used for reporting only.') }}</small>
                            </div>
                        </div>
                        <div class="form-check form-switch">
                            <input class="form-check-input" type="checkbox" role="switch" value="1" name="is_active"
                                   id="{{ $d }}-active" @checked($live($d, $currency->is_active))>
                            <label class="form-check-label small" for="{{ $d }}-active">{{ __('Live') }}</label>
                        </div>
                        @if($currency->is_default || $currency->is_base)
                            <small class="text-muted">{{ __('Default and base currencies can\'t be switched off.') }}</small>
                        @endif
                    </div>
                </fieldset>
            </form>

            <x-slot name="footer">
                <button type="button" class="btn btn-sm btn-secondary" data-drawer-close>{{ $isAdmin ? __('Cancel') : __('Close') }}</button>
                @if($isAdmin)
                    <button class="btn btn-sm btn-primary" form="{{ $d }}-form">{{ __('Save currency') }}</button>
                @endif
            </x-slot>
        </x-drawer>
    @endforeach

    @if($isAdmin)
        <x-drawer id="new-currency" :title="__('New currency')" :autoopen="$reopen === 'new-currency'">
            <form id="new-currency-form" method="POST" action="{{ route('admin.settings.currencies.store', ['locale' => $locale]) }}">
                @csrf
                <input type="hidden" name="_drawer" value="new-currency">

                <div class="cl-drawer__section">
                    <div class="cl-drawer__section-title">{{ __('Currency') }}</div>
                    <div class="row g-2">
                        <div class="col-4 mb-2">
                            <label class="form-label small" for="new-code">{{ __('Code') }}</label>
                            <input type="text" class="form-control text-uppercase" id="new-code" name="code"
                                   value="{{ $val('new-currency', 'code', '') }}" maxlength="3" placeholder="IDR" required>
                        </div>
                        <div class="col-8 mb-2">
                            <label class="form-label small" for="new-name">{{ __('Name') }}</label>
                            <input type="text" class="form-control" id="new-name" name="name"
                                   value="{{ $val('new-currency', 'name', '') }}" placeholder="{{ __('Indonesian Rupiah') }}" required>
                        </div>
                    </div>
                </div>

                <div class="cl-drawer__section">
                    <div class="cl-drawer__section-title">{{ __('How it is written') }}</div>
                    <div class="row g-2">
                        <div class="col-6 mb-2">
                            <label class="form-label small" for="new-exponent">{{ __('Decimal places') }}</label>
                            <select class="form-control" id="new-exponent" name="exponent">
                                <option value="2" @selected((string) $val('new-currency', 'exponent', '2') === '2')>{{ __('2 — dollars, euros, lira') }}</option>
                                <option value="0" @selected((string) $val('new-currency', 'exponent', '2') === '0')>{{ __('0 — rupiah, yen, won, dong') }}</option>
                                <option value="3" @selected((string) $val('new-currency', 'exponent', '2') === '3')>{{ __('3 — dinars') }}</option>
                            </select>
                        </div>
                        <div class="col-6 mb-2">
                            <label class="form-label small" for="new-symbol">{{ __('Symbol') }}</label>
                            <input type="text" class="form-control" id="new-symbol" name="symbol"
                                   value="{{ $val('new-currency', 'symbol', '') }}" maxlength="8" placeholder="Rp">
                        </div>
                        <div class="col-6 mb-2">
                            <label class="form-label small" for="new-symbol-position">{{ __('Symbol position') }}</label>
                            <select class="form-control" id="new-symbol-position" name="symbol_position">
                                <option value="before" @selected($val('new-currency', 'symbol_position', 'before') === 'before')>{{ __('Before — $9.99') }}</option>
                                <option value="after" @selected($val('new-currency', 'symbol_position', 'before') === 'after')>{{ __('After — 9,99 €') }}</option>
                            </select>
                        </div>
                        <div class="col-3 mb-2">
                            <label class="form-label small" for="new-thousands">1,000</label>
                            <input type="text" class="form-control" id="new-thousands" name="thousands_sep"
                                   value="{{ $val('new-currency', 'thousands_sep', ',') }}" maxlength="4">
                        </div>
                        <div class="col-3 mb-2">
                            <label class="form-label small" for="new-decimal">0.00</label>
                            <input type="text" class="form-control" id="new-decimal" name="decimal_sep"
                                   value="{{ $val('new-currency', 'decimal_sep', '.') }}" maxlength="4">
                        </div>
                    </div>
                </div>

                <div class="cl-drawer__section">
                    <div class="cl-drawer__section-title">{{ __('Pricing & reporting') }}</div>
                    <div class="row g-2">
                        <div class="col-6 mb-2">
                            <label class="form-label small" for="new-rounding">{{ __('Round prices to') }}</label>
                            <input type="number" min="0" class="form-control" id="new-rounding"
                                   name="rounding_step" value="{{ $val('new-currency', 'rounding_step', 0) }}">
                        </div>
                        <div class="col-6 mb-2">
                            <label class="form-label small" for="new-rate">{{ __('Rate to :base', ['base' => $baseCode]) }}</label>
                            <input type="number" step="0.00000001" min="0" class="form-control"
                                   id="new-rate" name="rate_to_base" value="{{ $val('new-currency', 'rate_to_base', '') }}">
                            <small class="text-muted">{{ __('Used for reporting only.') }}</small>
                        </div>
                    </div>
                    <div class="form-check form-switch">
                        <input class="form-check-input" type="checkbox" role="switch" value="1" name="is_active"
                               id="new-active" @checked($live('new-currency', true))>
                        <label class="form-check-label small" for="new-active">{{ __('Live') }}</label>
                    </div>
                </div>
            </form>

            <x-slot name="footer">
                <button type="button" class="btn btn-sm btn-secondary" data-drawer-close>{{ __('Cancel') }}</button>
                <button class="btn btn-sm btn-primary" form="new-currency-form">{{ __('Add currency') }}</button>
            </x-slot>
        </x-drawer>
    @endif
@endsection
