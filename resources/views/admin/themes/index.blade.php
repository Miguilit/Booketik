@extends('admin.admin_master')
@section('admin')
    @php $locale = app()->getLocale(); @endphp
    @include('admin.partials.flash')

    <div class="card card-default mb-4">
        <div class="card-header card-header-border-bottom d-flex flex-wrap justify-content-between align-items-center gap-2">
            <div>
                <h2>{{ __('Storefront themes') }}</h2>
                <p class="text-muted small mb-0">
                    {{ __('Three looks for the public site, each with light and dark. Daylight Civic is the default and the fallback for any page another theme has not drawn; the organizer dashboard and this panel are not themed. Organizers on Pro and Business can also pick a look for their own hub and event pages (Organizers › edit › Page look).') }}
                </p>
            </div>
            @if($switcherAllowed)
                <span class="badge bg-success-subtle text-success-emphasis border border-success-subtle px-3 py-2">
                    {{ __('Visitor switcher: on (demo mode / local)') }}
                </span>
            @else
                <span class="badge bg-secondary-subtle text-secondary-emphasis border px-3 py-2">
                    {{ __('Visitor switcher: off (production) — visitors see the active theme') }}
                </span>
            @endif
        </div>

        <div class="card-body">
            @if($errors->any())
                <div class="alert alert-danger">{{ $errors->first() }}</div>
            @endif

            <form method="POST" action="{{ route('admin.themes.update', ['locale' => $locale]) }}">
                @csrf

                @include('admin.partials.form-lock-actions', ['saveLabel' => __('Save themes')])

                <p class="text-muted small mb-4">
                    {!! __(':active is what every visitor gets in production.', ['active' => '<strong>'.e(__('Active')).'</strong>']) !!}
                    {!! __(':enabled themes appear in the demo switcher.', ['enabled' => '<strong>'.e(__('Enabled')).'</strong>']) !!}
                    {{ __('Themes still being built can be previewed privately — only you will see them.') }}
                </p>

                <div class="row g-4">
                    @foreach($themes as $key => $theme)
                        @php
                            $isActive = $active === $key;
                            $isEnabled = in_array($key, $enabled, true);
                            $built = $theme['built'];
                        @endphp
                        <div class="col-md-6 col-xl-4">
                            <div @class(['thm-card card h-100', 'thm-card--active' => $isActive, 'thm-card--soon' => ! $built])>
                                <div class="thm-minis">
                                    @foreach(['light', 'dark'] as $mode)
                                        @php $s = $theme['swatches'][$mode]; @endphp
                                        <div class="thm-mini thm-mini--{{ $key }}"
                                             style="--m-bg: {{ $s['bg'] }}; --m-surface: {{ $s['surface'] }}; --m-ink: {{ $s['ink'] }}; --m-muted: {{ $s['muted'] }}; --m-line: {{ $s['line'] }}; --m-accent: {{ $s['accent'] }}; --m-accent2: {{ $s['accent2'] }}; --m-radius: {{ $s['radius'] }};"
                                             title="{{ $mode === 'light' ? __('Light') : __('Dark') }}">
                                            <span class="thm-mini__nav"><i></i><i></i><i></i></span>
                                            <span class="thm-mini__hero"><b></b><em></em></span>
                                            <span class="thm-mini__row"><i></i><i></i><i></i><i></i></span>
                                            <span class="thm-mini__mode">{{ $mode === 'light' ? __('Light') : __('Dark') }}</span>
                                        </div>
                                    @endforeach
                                </div>

                                <div class="card-body d-flex flex-column">
                                    <div class="d-flex align-items-center gap-2 mb-1">
                                        <span class="text-muted small fw-bold">{{ str_pad((string) $theme['number'], 2, '0', STR_PAD_LEFT) }}</span>
                                        <h5 class="mb-0">{{ $theme['name'] }}</h5>
                                        @if($isActive)
                                            <span class="badge bg-primary ms-auto">{{ __('Active') }}</span>
                                        @elseif(! $built)
                                            <span class="badge bg-light text-muted border ms-auto">{{ __('Coming soon') }}</span>
                                        @elseif($isEnabled)
                                            <span class="badge bg-success-subtle text-success-emphasis ms-auto">{{ __('Enabled') }}</span>
                                        @endif
                                    </div>
                                    <p class="small fst-italic mb-2">{{ $theme['tagline'] }}</p>
                                    <p class="small text-muted mb-2">{{ $theme['description'] }}</p>
                                    <div class="mb-3">
                                        @foreach($theme['tags'] as $tag)
                                            <span class="badge rounded-pill bg-light text-muted border fw-normal">{{ $tag }}</span>
                                        @endforeach
                                    </div>

                                    <div class="mt-auto d-flex flex-wrap align-items-center gap-3">
                                        <div class="form-check form-switch mb-0">
                                            @if($key === \App\Support\Themes\ThemeRegistry::DEFAULT)
                                                {{-- Disabled inputs are not submitted, so Civic's
                                                     always-on state travels as a hidden field. --}}
                                                <input type="hidden" name="enabled[]" value="{{ $key }}">
                                                <input class="form-check-input" type="checkbox" role="switch" checked disabled
                                                       id="enabled_{{ $key }}">
                                            @else
                                                <input class="form-check-input" type="checkbox" role="switch"
                                                       name="enabled[]" value="{{ $key }}" id="enabled_{{ $key }}"
                                                       @checked($isEnabled && $built) @disabled(! $built)>
                                            @endif
                                            <label class="form-check-label small" for="enabled_{{ $key }}">{{ __('Enabled') }}</label>
                                        </div>

                                        <div class="form-check mb-0">
                                            <input class="form-check-input" type="radio" name="active" value="{{ $key }}"
                                                   id="active_{{ $key }}" @checked($isActive) @disabled(! $built)>
                                            <label class="form-check-label small" for="active_{{ $key }}">{{ __('Active for visitors') }}</label>
                                        </div>

                                        <a class="btn btn-sm btn-outline-secondary ms-auto" target="_blank" rel="noopener"
                                           href="{{ url($locale) }}?preview_theme={{ $key }}">
                                            {{ __('Preview') }}
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    @endforeach
                </div>
            </form>

            <p class="text-muted small mt-4 mb-0">
                {{ __('Preview opens the site in a new tab in that theme, for you only, until you choose “Exit preview” on the yellow chip.') }}
            </p>
        </div>
    </div>
@endsection

@push('styles')
    <style>
        .thm-card { overflow: hidden; transition: box-shadow .2s, transform .2s; }
        .thm-card:hover { transform: translateY(-2px); box-shadow: 0 10px 30px -12px rgba(0, 0, 0, .25); }
        .thm-card--active { outline: 2px solid var(--bs-primary, #3d5afe); outline-offset: -2px; }
        .thm-card--soon .thm-minis { filter: grayscale(.35); opacity: .8; }

        .thm-minis { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; padding: 12px; background: #f3f2ef; }
        .thm-mini {
            position: relative; display: flex; flex-direction: column; gap: 7px;
            aspect-ratio: 4 / 3; padding: 8px; overflow: hidden;
            background: var(--m-bg); border-radius: 8px; box-shadow: inset 0 0 0 1px var(--m-line);
        }
        .thm-mini span, .thm-mini i, .thm-mini b, .thm-mini em { display: block; }
        .thm-mini__nav { display: flex !important; gap: 5px; align-items: center; height: 12px; padding: 0 5px;
            background: var(--m-surface); border-radius: min(var(--m-radius), 6px); box-shadow: inset 0 0 0 1px var(--m-line); }
        .thm-mini__nav i { width: 6px; height: 6px; border-radius: 2px; background: var(--m-accent); }
        .thm-mini__nav i + i { width: 18px; height: 3px; border-radius: 2px; background: var(--m-muted); opacity: .6; }
        .thm-mini__hero { flex: 1; display: flex !important; gap: 6px; align-items: center; }
        .thm-mini__hero b { width: 30%; aspect-ratio: 2 / 3; border-radius: min(var(--m-radius), 4px);
            background: var(--m-accent); box-shadow: inset 0 -40% 0 var(--m-accent2); }
        .thm-mini__hero em { flex: 1; height: 10px; border-radius: 2px; background: var(--m-ink);
            box-shadow: 0 8px 0 -3px var(--m-muted); }
        .thm-mini__row { display: grid !important; grid-template-columns: repeat(4, 1fr); gap: 4px; }
        .thm-mini__row i { aspect-ratio: 2 / 3; border-radius: min(var(--m-radius), 3px); background: var(--m-accent2); opacity: .85; }
        .thm-mini__row i:nth-child(odd) { background: var(--m-accent); }
        .thm-mini__mode { position: absolute; right: 5px; bottom: 4px; font-size: 9px; font-weight: 700;
            letter-spacing: .06em; text-transform: uppercase; color: var(--m-muted); }

        /* A hint of each theme's signature, so the cards differ by more than colour. */
        /* Civic: chunky radius, ink edge and a hard sticker shadow on the poster. */
        .thm-mini--civic .thm-mini__hero b { border: 1.5px solid var(--m-ink); box-shadow: 2px 2px 0 var(--m-ink); background: var(--m-accent2); }
        .thm-mini--civic .thm-mini__hero em { height: 14px; }
        /* Marquee: a full-bleed black band, condensed caps, square corners, lime only on the CTA. */
        .thm-mini--marquee .thm-mini__nav { background: var(--m-ink); box-shadow: none; border-radius: 0; margin: -8px -8px 0; height: 16px; }
        .thm-mini--marquee .thm-mini__nav i { background: var(--m-accent2); border-radius: 0; }
        .thm-mini--marquee .thm-mini__hero b { border-radius: 0; background: var(--m-muted); box-shadow: none; }
        .thm-mini--marquee .thm-mini__hero em { height: 22px; transform: scaleX(.8); transform-origin: left; }
        .thm-mini--marquee .thm-mini__row i { border-radius: 0; background: var(--m-line); }
        .thm-mini--marquee .thm-mini__row i:nth-child(odd) { background: var(--m-ink); }
        /* Almanac: a masthead between rules, column rules, an italic dateline. */
        .thm-mini--almanac .thm-mini__nav { background: transparent; box-shadow: none; border-top: 2px solid var(--m-ink); border-bottom: 1px solid var(--m-line); border-radius: 0; justify-content: center; }
        .thm-mini--almanac .thm-mini__row { gap: 0; }
        .thm-mini--almanac .thm-mini__row i { aspect-ratio: auto; height: 22px; background: transparent !important; border-inline-start: 1px solid var(--m-line); box-shadow: inset 0 6px 0 -3px var(--m-ink); }
        .thm-mini--almanac .thm-mini__hero b { border-radius: 6px; box-shadow: 0 4px 10px -4px rgba(60, 40, 20, .35); }
    </style>
@endpush
