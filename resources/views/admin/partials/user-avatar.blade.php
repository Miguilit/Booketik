{{-- The signed-in operator: their photo, or their initials on a Civic tint.
     Not Jetstream's default, which is an indigo ui-avatars.com image fetched
     from a third party on every page of the panel. --}}
@php
    $u = \Illuminate\Support\Facades\Auth::user();
    $initials = collect(preg_split('/\s+/', trim((string) $u?->name)))->filter()->take(2)->map(fn ($w) => mb_strtoupper(mb_substr($w, 0, 1)))->implode('');
@endphp
@if($u?->profile_photo_path)
    <img src="{{ $u->profile_photo_url }}" class="{{ $class }}" alt=""/>
@else
    <span class="{{ $class }} cl-initials" aria-hidden="true">{{ $initials ?: '?' }}</span>
@endif
