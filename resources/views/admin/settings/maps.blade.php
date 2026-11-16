@extends('admin.admin_master')
@section('admin')
    @php $locale = app()->getLocale(); @endphp
    @include('admin.partials.flash')

    <div class="cl-page-head">
        <div>
            <p class="cl-eyebrow">{{ __('Settings') }}</p>
            <h1>{{ __('Maps') }}</h1>
            <p class="text-muted">{{ __('Where the Discover map and event maps get their tiles, and how venue search introduces itself to OpenStreetMap.') }}</p>
        </div>
    </div>

    <form method="POST" action="{{ route('admin.settings.maps.update', ['locale' => $locale]) }}">
        @csrf
        @include('admin.partials.form-lock-actions', ['saveLabel' => __('Save map settings')])

        <div class="row">
            <div class="col-xl-7">
                <div class="card card-default">
                    <div class="card-header"><h2>{{ __('Tiles') }}</h2></div>
                    <div class="card-body">
                        <div class="mb-3">
                            <label class="form-label" for="maps_tile_url">{{ __('Tile URL template') }}</label>
                            <input type="url" class="form-control cl-mono" id="maps_tile_url" name="maps_tile_url" value="{{ old('maps_tile_url', $tileUrl) }}" placeholder="{{ \App\Support\MapsSettings::DEFAULT_TILES }}">
                            <div class="form-text">{!! __('Leaflet format with :placeholders. Empty uses OpenStreetMap\'s own tiles, whose usage policy asks heavy sites to move to a provider or their own server.', ['placeholders' => '<code>{z}</code>, <code>{x}</code>, <code>{y}</code>']) !!}</div>
                        </div>
                        <div class="mb-0">
                            <label class="form-label" for="maps_attribution">{{ __('Attribution') }}</label>
                            <input type="text" class="form-control" id="maps_attribution" name="maps_attribution" value="{{ old('maps_attribution', $attribution) }}" placeholder="© {{ __('OpenStreetMap contributors') }}">
                            <div class="form-text">{!! __('Shown on every map. Links (:tag) are kept; other HTML is removed.', ['tag' => '<code>&lt;a&gt;</code>']) !!}</div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-xl-5">
                <div class="card card-default">
                    <div class="card-header"><h2>{{ __('Venue search (Nominatim)') }}</h2></div>
                    <div class="card-body">
                        <label class="form-label" for="nominatim_email">{{ __('Contact email') }}</label>
                        <input type="email" class="form-control" id="nominatim_email" name="nominatim_email" value="{{ old('nominatim_email', $nominatimEmail) }}" placeholder="{{ config('eventgoo.admin.email') }}">
                        <div class="form-text">{{ __('Sent in the User-Agent so the OpenStreetMap Foundation can reach you about your traffic. Searches go through the server, one a second at most, and are cached.') }}</div>
                    </div>
                </div>
            </div>
        </div>
    </form>

    <div class="card card-default">
        <div class="card-header"><h2>{{ __('In effect now') }}</h2></div>
        <div class="card-body">
            <dl class="row mb-0">
                <dt class="col-sm-3">{{ __('Tiles') }}</dt><dd class="col-sm-9 cl-mono small text-break">{{ $effective['tile_url'] }}</dd>
                <dt class="col-sm-3">{{ __('Attribution') }}</dt><dd class="col-sm-9 small">{!! strip_tags($effective['attribution'], '<a>') !!}</dd>
                <dt class="col-sm-3">{{ __('Geocoder') }}</dt><dd class="col-sm-9 cl-mono small text-break">{{ $effective['nominatim_url'] }}</dd>
                <dt class="col-sm-3">{{ __('Contact') }}</dt><dd class="col-sm-9 small">{{ $effective['nominatim'] ?? __('None — set one before going live') }}</dd>
            </dl>
        </div>
    </div>
@endsection
