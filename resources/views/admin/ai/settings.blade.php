@extends('admin.admin_master')
@section('admin')
    @php $locale = app()->getLocale(); $cents = fn ($v) => $v === null ? '—' : \App\Support\Money::format((int) $v, 'USD'); @endphp
    @include('admin.partials.flash')

    <div class="cl-page-head">
        <div>
            <p class="cl-eyebrow">Eventgoo AI</p> {{-- i18n-ignore --}}
            <h1>{{ __('AI settings') }}</h1>
            <p class="text-muted">{{ __('Which model each feature calls, and how much the platform may spend in a calendar month.') }}</p>
        </div>
    </div>

    @include('admin.ai._nav')

    @unless($enabled)
        <div class="alert alert-warning small">{!! __('AI is switched off for the whole platform (:flag). Nothing here runs until it is on again.', ['flag' => '<code>EVENTGOO_AI_ENABLED=false</code>']) !!}</div>
    @endunless

    <form method="POST" action="{{ route('admin.ai.settings.update', ['locale' => $locale]) }}">
        @csrf
        @include('admin.partials.form-lock-actions', ['saveLabel' => __('Save AI settings')])

        <div class="card card-default">
            <div class="card-header"><h2>{{ __('Monthly budget') }}</h2></div>
            <div class="card-body">
                <div class="row g-3 align-items-end">
                    <div class="col-md-4">
                        <label class="form-label" for="monthly_cents">{{ __('Platform cap (US cents per month)') }}</label>
                        <input type="number" min="0" step="1" class="form-control" id="monthly_cents" name="monthly_cents"
                               value="{{ old('monthly_cents', $monthlyCents) }}" placeholder="{{ __('No cap') }}">
                    </div>
                    <div class="col-md-8 small text-muted">
                        {!! __('Once this month\'s recorded cost reaches the cap, every AI call answers :code before the model is asked, and no organizer credit is spent.', ['code' => '<code>AI_DISABLED</code>']) !!}
                        {!! __('Empty uses the server\'s :variable (:amount).', ['variable' => '<code>EVENTGOO_AI_MONTHLY_BUDGET_CENTS</code>', 'amount' => e($cents($configCap))]) !!}
                        {!! __('Costs are estimates from the per-token prices in :file, not the provider\'s invoice.', ['file' => '<code>config/eventgoo-ai.php</code>']) !!}
                    </div>
                </div>
            </div>
        </div>

        <div class="card card-default">
            <div class="card-header"><h2>{{ __('Per feature') }}</h2></div>
            <div class="card-body">
                <p class="small text-muted mb-3">{!! __('Empty provider and model use the default: :provider · :model. A model must exist at that provider; a wrong name fails the call (the run is logged as failed and no credit is spent).', ['provider' => '<strong>'.e($defaultProvider).'</strong>', 'model' => '<code>'.e($defaultModel ?: __('provider default')).'</code>']) !!}</p>
                <div class="table-responsive">
                    <table class="table align-middle">
                        <thead><tr><th>{{ __('Feature') }}</th><th style="min-width:150px">{{ __('Provider') }}</th><th style="min-width:200px">{{ __('Model') }}</th><th style="min-width:150px">{{ __('Cap (¢ / month)') }}</th></tr></thead>
                        <tbody>
                        @foreach($features as $key => $label)
                            @php $row = $rows[$key]; @endphp
                            <tr>
                                <td><strong>{{ $label }}</strong><div class="small text-muted cl-mono">{{ $key }}</div></td>
                                <td>
                                    <select class="form-control" name="features[{{ $key }}][provider]" aria-label="{{ __('Provider for :feature', ['feature' => $label]) }}">
                                        <option value="">{{ __('Default') }}</option>
                                        @foreach($providers as $p)
                                            <option value="{{ $p }}" @selected(old("features.$key.provider", $row['provider']) === $p)>{{ $p }}</option>
                                        @endforeach
                                    </select>
                                </td>
                                <td><input type="text" class="form-control cl-mono" name="features[{{ $key }}][model]" value="{{ old("features.$key.model", $row['model']) }}" placeholder="{{ __('Default') }}" aria-label="{{ __('Model for :feature', ['feature' => $label]) }}"></td>
                                <td><input type="number" min="0" step="1" class="form-control" name="features[{{ $key }}][monthly_cents]" value="{{ old("features.$key.monthly_cents", $row['monthly_cents']) }}" placeholder="{{ __('No cap') }}" aria-label="{{ __('Monthly cap for :feature', ['feature' => $label]) }}"></td>
                            </tr>
                        @endforeach
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </form>
@endsection
