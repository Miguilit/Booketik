{{-- The three AI screens, as pill tabs. --}}
@php $locale = app()->getLocale(); @endphp
<ul class="nav nav-pills mb-3 flex-wrap gap-1" aria-label="AI">
    <li class="nav-item"><a class="nav-link {{ request()->routeIs('admin.ai.usage') ? 'active' : '' }}" href="{{ route('admin.ai.usage', ['locale' => $locale]) }}">{{ __('Usage & cost') }}</a></li>
    @if(auth()->user()?->isAdmin())
        <li class="nav-item"><a class="nav-link {{ request()->routeIs('admin.ai.settings*') ? 'active' : '' }}" href="{{ route('admin.ai.settings', ['locale' => $locale]) }}">{{ __('Settings') }}</a></li>
    @endif
    <li class="nav-item"><a class="nav-link {{ request()->routeIs('admin.ai.moderation') ? 'active' : '' }}" href="{{ route('admin.ai.moderation', ['locale' => $locale]) }}">{{ __('Moderation log') }}</a></li>
</ul>
