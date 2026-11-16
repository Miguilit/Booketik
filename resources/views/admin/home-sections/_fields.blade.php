{{-- The rail's own settings, shared by the create drawer and the edit screen. --}}
<div class="mb-3">
    <label class="form-label" for="{{ $prefix }}-title">{{ __('Title') }}</label>
    <input type="text" class="form-control" id="{{ $prefix }}-title" name="title" value="{{ old('title', $section?->title) }}" required>
</div>
<div class="mb-3">
    <label class="form-label" for="{{ $prefix }}-subtitle">{{ __('Subtitle') }}</label>
    <input type="text" class="form-control" id="{{ $prefix }}-subtitle" name="subtitle" value="{{ old('subtitle', $section?->subtitle) }}">
</div>
<div class="row g-2">
    <div class="col-md-6 mb-3">
        <label class="form-label" for="{{ $prefix }}-layout">{{ __('Layout') }}</label>
        <select class="form-control" id="{{ $prefix }}-layout" name="layout">
            @foreach(\App\Models\HomeSection::LAYOUTS as $layout)
                <option value="{{ $layout }}" @selected(old('layout', $section?->layout ?? 'rail') === $layout)>{{ $layout }}</option>
            @endforeach
        </select>
        <div class="form-text small">{!! __('An :code rail lists organizers; every other layout lists events.', ['code' => '<code>organizers</code>']) !!}</div>
    </div>
    <div class="col-md-6 mb-3">
        <label class="form-label" for="{{ $prefix }}-city">{{ __('City') }}</label>
        <select class="form-control" id="{{ $prefix }}-city" name="city_id">
            <option value="">{{ __('Every city') }}</option>
            @foreach(\App\Models\City::query()->orderBy('sort_order')->get(['id', 'name']) as $city)
                <option value="{{ $city->id }}" @selected((string) old('city_id', $section?->city_id) === (string) $city->id)>{{ $city->name }}</option>
            @endforeach
        </select>
    </div>
    <div class="col-md-4 mb-3">
        <label class="form-label" for="{{ $prefix }}-locale">{{ __('Locale') }}</label>
        <select class="form-control" id="{{ $prefix }}-locale" name="locale">
            @foreach(config('eventgoo.locales', ['en']) as $code)
                <option value="{{ $code }}" @selected(old('locale', $section?->locale) === $code)>{{ $code }}</option>
            @endforeach
        </select>
    </div>
    <div class="col-md-4 mb-3">
        <label class="form-label" for="{{ $prefix }}-order">{{ __('Sort order') }}</label>
        <input type="number" min="0" class="form-control" id="{{ $prefix }}-order" name="sort_order" value="{{ old('sort_order', $section?->sort_order ?? ($nextOrder ?? 0)) }}">
    </div>
    <div class="col-md-4 mb-3">
        <label class="form-label" for="{{ $prefix }}-slug">{{ __('Slug') }}</label>
        <input type="text" class="form-control" id="{{ $prefix }}-slug" name="slug" value="{{ old('slug', $section?->slug) }}">
    </div>
    {{-- The window is what makes a takeover safe to queue ahead: it starts and
         stops on its own, with nothing to remember to switch off. --}}
    <div class="col-md-6 mb-3">
        <label class="form-label" for="{{ $prefix }}-starts">{{ __('Shows from') }}</label>
        <input type="datetime-local" class="form-control" id="{{ $prefix }}-starts" name="starts_at" value="{{ old('starts_at', $section?->starts_at?->format('Y-m-d\TH:i')) }}">
    </div>
    <div class="col-md-6 mb-3">
        <label class="form-label" for="{{ $prefix }}-ends">{{ __('Until') }}</label>
        <input type="datetime-local" class="form-control" id="{{ $prefix }}-ends" name="ends_at" value="{{ old('ends_at', $section?->ends_at?->format('Y-m-d\TH:i')) }}">
    </div>
</div>
<div class="form-check mb-3">
    <input class="form-check-input" type="checkbox" value="1" name="is_active" id="{{ $prefix }}-active" @checked(old('is_active', $section?->is_active ?? true))>
    <label class="form-check-label" for="{{ $prefix }}-active">{{ __('Live') }}</label>
</div>
