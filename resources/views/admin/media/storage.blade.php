@extends('admin.admin_master')
@section('admin')
    @php
        $locale = app()->getLocale();
        $active = collect($providers)->firstWhere('isActive', true);
        $network = collect($networks)->firstWhere('isActive', true);
    @endphp

    @include('admin.partials.flash')

    <div class="row">
        <div class="col-md-3">
            <div class="card card-default"><div class="card-body">
                <div class="text-muted text-uppercase small">{{ __('Uploads go to') }}</div>
                <h3 class="mb-0 text-success">{{ $active['label'] ?? $activeProvider }}</h3>
            </div></div>
        </div>
        <div class="col-md-3">
            <div class="card card-default"><div class="card-body">
                <div class="text-muted text-uppercase small">{{ __('Served by') }}</div>
                <h3 class="mb-0 text-info">{{ $network['label'] ?? $activeNetwork }}</h3>
            </div></div>
        </div>
        <div class="col-md-3">
            <div class="card card-default"><div class="card-body">
                <div class="text-muted text-uppercase small">{{ __('Configured') }}</div>
                <h3 class="mb-0">{{ collect($providers)->where('configured', true)->count() }}
                    <span class="text-muted small">{{ __('of :total', ['total' => count($providers)]) }}</span></h3>
            </div></div>
        </div>
        <div class="col-md-3">
            <div class="card card-default"><div class="card-body">
                <div class="text-muted text-uppercase small">{{ __('Max upload') }}</div>
                <h3 class="mb-0">{{ number_format($maxMegabytes) }} <span class="text-muted small">MB</span></h3>
            </div></div>
        </div>
    </div>

    <div class="card card-default">
        <div class="card-header card-header-border-bottom">
            <h2 class="mb-0">{{ __('media.providers.heading') }}</h2>
        </div>
        <div class="card-body">
            <div class="table-responsive">
                <table class="table align-middle">
                    <thead>
                    <tr>
                        <th>{{ __('Provider') }}</th>
                        <th>{{ __('Credentials') }}</th>
                        <th>{{ __('Public address') }}</th>
                        <th class="text-end">{{ __('media.providers.files') }}</th>
                        <th class="text-end">{{ __('media.providers.size') }}</th>
                        <x-row-actions-header />
                    </tr>
                    </thead>
                    <tbody>
                    @foreach($providers as $row)
                        <tr class="{{ $row['configured'] ? '' : 'text-muted' }}">
                            <td class="text-nowrap">
                                <strong>{{ $row['label'] }}</strong>
                                @if($row['isActive'])
                                    <span class="badge bg-success ms-1">{{ __('media.providers.active') }}</span>
                                @endif
                                <div class="small text-muted"><code>{{ $row['disk'] }}</code></div>
                            </td>
                            <td class="small">
                                @if($row['configured'])
                                    <span class="badge bg-success">{{ __('media.providers.configured') }}</span>
                                @elseif(! $row['requirementsMet'])
                                    <span class="badge bg-warning">{{ __('media.providers.requirements_missing') }}</span>
                                @else
                                    <span class="badge bg-secondary">{{ __('media.providers.not_configured') }}</span>
                                    @if($row['missing'])
                                        <div class="text-muted">{{ __('media.providers.missing', ['keys' => implode(', ', $row['missing'])]) }}</div>
                                    @endif
                                @endif
                            </td>
                            <td class="small" style="max-width:320px;">
                                @if($row['publicUrl'])
                                    <code class="text-truncate d-block">{{ $row['publicUrl'] }}</code>
                                @elseif($row['configured'] && $row['serveHint'])
                                    <span class="text-warning">{{ $row['serveHint'] }}</span>
                                @else
                                    <span class="text-muted">—</span>
                                @endif
                            </td>
                            <td class="text-end">{{ number_format($row['files']) }}</td>
                            <td class="text-end text-nowrap">{{ \Illuminate\Support\Number::fileSize($row['bytes'], 1) }}</td>
                            <td class="row-actions-col">
                                <x-row-actions>
                                    <x-row-action-form method="POST" icon="lan-connect" tone=""
                                                       async="verify"
                                                       :async-label="__('Testing :name', ['name' => $row['label']])"
                                                       :action="route('admin.media.storage.verify', ['locale' => $locale, 'provider' => $row['name']])">
                                        {{ __('media.providers.verify') }}
                                    </x-row-action-form>
                                    @if($row['configured'] && ! $row['isActive'])
                                        <x-row-action-form method="POST" icon="check-circle" tone=""
                                                           :action="route('admin.media.storage.activate', ['locale' => $locale, 'provider' => $row['name']])"
                                                           :confirm="__('Send new uploads to :name? Files already stored stay where they are.', ['name' => $row['label']])">
                                            {{ __('media.providers.activate') }}
                                        </x-row-action-form>
                                    @endif
                                    <x-row-actions-divider />
                                    <x-row-action icon="folder-multiple-image"
                                                  :href="route('admin.media.index', ['locale' => $locale, 'provider' => $row['name']])">{{ __('Browse files') }}</x-row-action>
                                    <a class="row-actions-item" role="menuitem" data-drawer="#storage-{{ $row['name'] }}">
                                        <i class="mdi mdi-key-variant" aria-hidden="true"></i>
                                        <span>{{ __('Environment keys') }}</span>
                                    </a>
                                </x-row-actions>
                            </td>
                        </tr>
                    @endforeach
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    <div class="card card-default">
        <div class="card-header card-header-border-bottom d-flex justify-content-between align-items-center flex-wrap">
            <h2 class="mb-0">{{ __('media.cdn.heading') }}</h2>
            <div class="d-flex" style="gap:.5rem;">
                <form method="POST" action="{{ route('admin.media.storage.cdn.verify', ['locale' => $locale]) }}"
                      data-async="verify" data-async-label="{{ __('Checking :name', ['name' => $network['label'] ?? __('the network')]) }}">
                    @csrf
                    <button class="btn btn-sm btn-secondary"><i class="mdi mdi-lan-connect"></i> {{ __('media.cdn.verify') }}</button>
                </form>
                @if($network['supportsPurge'] ?? false)
                    <form method="POST" action="{{ route('admin.media.storage.cdn.purge', ['locale' => $locale]) }}"
                          data-async="message" data-async-label="{{ __('Clearing the cache') }}"
                          data-confirm="{{ __('Clear the 50 most recent files from the CDN cache?') }}">
                        @csrf
                        <button class="btn btn-sm btn-secondary"><i class="mdi mdi-broom"></i> {{ __('media.cdn.purge') }}</button>
                    </form>
                @endif
            </div>
        </div>
        <div class="card-body">
            <div class="table-responsive">
                <table class="table align-middle">
                    <thead>
                    <tr>
                        <th>{{ __('Network') }}</th>
                        <th>{{ __('Credentials') }}</th>
                        <th>{{ __('Hostname') }}</th>
                        <th>{{ __('Features') }}</th>
                        <x-row-actions-header />
                    </tr>
                    </thead>
                    <tbody>
                    @foreach($networks as $row)
                        <tr class="{{ $row['configured'] ? '' : 'text-muted' }}">
                            <td class="text-nowrap">
                                <strong>{{ $row['label'] }}</strong>
                                @if($row['isActive'])
                                    <span class="badge bg-success ms-1">{{ __('media.providers.active') }}</span>
                                @endif
                                <div class="small text-muted"><code>{{ $row['name'] }}</code></div>
                            </td>
                            <td class="small">
                                @if($row['configured'])
                                    <span class="badge bg-success">{{ __('media.providers.configured') }}</span>
                                @else
                                    <span class="badge bg-secondary">{{ __('media.providers.not_configured') }}</span>
                                @endif
                            </td>
                            <td class="small"><code>{{ $row['baseUrl'] ?? '—' }}</code></td>
                            <td class="small">
                                @if($row['supportsPurge'])<span class="badge bg-info">{{ __('media.cdn.purge_supported') }}</span>@endif
                                @if($row['supportsSignedUrls'])<span class="badge bg-info">{{ __('media.cdn.signed') }}</span>@endif
                            </td>
                            <td class="row-actions-col">
                                <x-row-actions>
                                    @if($row['configured'] && ! $row['isActive'])
                                        <x-row-action-form method="POST" icon="check-circle" tone=""
                                                           :action="route('admin.media.storage.cdn.activate', ['locale' => $locale, 'network' => $row['name']])"
                                                           :confirm="__('Serve every file through :name?', ['name' => $row['label']])">
                                            {{ __('media.cdn.activate') }}
                                        </x-row-action-form>
                                    @endif
                                    <a class="row-actions-item" role="menuitem" data-drawer="#cdn-{{ $row['name'] }}">
                                        <i class="mdi mdi-key-variant" aria-hidden="true"></i>
                                        <span>{{ __('Environment keys') }}</span>
                                    </a>
                                </x-row-actions>
                            </td>
                        </tr>
                    @endforeach
                    </tbody>
                </table>
            </div>

            <form method="POST" action="{{ route('admin.media.storage.options', ['locale' => $locale]) }}" class="row g-2 align-items-end mt-3">
                @csrf
                <div class="col-md-6">
                    <label class="form-label" for="cdn_url">{{ __('media.cdn.hostname') }}</label>
                    <input type="url" class="form-control" id="cdn_url" name="cdn_url" value="{{ $cdnUrl }}"
                           placeholder="{{ $network['baseUrl'] ?? 'https://cdn.example.com' }}">
                </div>
                <div class="col-md-2">
                    <button class="btn btn-primary w-100">{{ __('Save') }}</button>
                </div>
            </form>
        </div>
    </div>

    @foreach([['storage', $providers], ['cdn', $networks]] as [$prefix, $rows])
        @foreach($rows as $row)
            <x-drawer :id="$prefix.'-'.$row['name']" :title="$row['label']" :subtitle="__('Environment keys')">
                <div class="cl-drawer__section">
                    <div class="cl-drawer__section-title">{{ __('Environment keys') }}</div>
                    @forelse($row['credentials'] as $key)
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <code>{{ $key['env'] }}</code>
                            <span class="small">
                                @if($key['set'])
                                    <span class="text-muted">{{ $key['hint'] }}</span>
                                    <span class="badge bg-success">{{ __('Set') }}</span>
                                @elseif($key['required'])
                                    <span class="badge bg-warning">{{ __('Missing') }}</span>
                                @else
                                    <span class="badge bg-secondary">{{ __('Optional') }}</span>
                                @endif
                            </span>
                        </div>
                    @empty
                        <p class="small text-muted mb-0">—</p>
                    @endforelse
                </div>
                <x-slot name="footer">
                    <a class="btn btn-sm btn-secondary" data-drawer-close href="#">{{ __('Close') }}</a>
                </x-slot>
            </x-drawer>
        @endforeach
    @endforeach
@endsection
