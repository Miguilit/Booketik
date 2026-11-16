@extends('admin.admin_master')
@section('admin')
    @php
        $locale = app()->getLocale();
        $isAdmin = auth()->user()?->isAdmin();

        /*
         | The kind filter. Video is offered only where video exists.
         |
         | An installation with no video rows is never told about a kind it
         | cannot have; one that holds legacy video still sees the tab, so its
         | files stay findable. See App\Models\Media::VIDEO.
         */
        $kinds = collect($kindLabels)
            ->reject(fn ($label, $key) => $key === \App\Models\Media::VIDEO && $legacyVideos < 1)
            ->all();
    @endphp

    @include('admin.partials.flash')

    <div class="row">
        @php
            $tiles = [
                ['label' => __('Files'), 'value' => number_format($summary['files']), 'tone' => 'primary'],
                ['label' => __('Documents'), 'value' => number_format($summary['documents']), 'tone' => 'info'],
                ['label' => __('Images'), 'value' => number_format($summary['images']), 'tone' => 'success'],
                ['label' => __('Stored'), 'value' => \Illuminate\Support\Number::fileSize($summary['bytes'], 1), 'tone' => 'warning'],
            ];

            if ($legacyVideos > 0) {
                $tiles[] = ['label' => __('Video (legacy)'), 'value' => number_format($legacyVideos), 'tone' => 'secondary'];
            }
        @endphp
        @foreach($tiles as $tile)
            <div class="col-xl-3 col-md-6">
                <div class="card card-default">
                    <div class="card-body">
                        <div class="text-muted text-uppercase small">{{ $tile['label'] }}</div>
                        <h3 class="mb-0 text-{{ $tile['tone'] }}">{{ $tile['value'] }}</h3>
                    </div>
                </div>
            </div>
        @endforeach
    </div>

    <div class="card card-default">
        <div class="card-header card-header-border-bottom d-flex justify-content-between align-items-center flex-wrap">
            <h2 class="mb-0">{{ __('Media library') }}</h2>
            <div class="d-flex align-items-center flex-wrap" style="gap:.5rem;">
                <span class="small text-muted">
                    <i class="mdi mdi-database"></i> {{ $activeProvider }}
                    · <i class="mdi mdi-earth"></i> {{ $activeNetwork }}
                </span>
                @if($isAdmin)
                    <form method="POST" action="{{ route('admin.media.import', ['locale' => $locale]) }}" class="d-inline">
                        @csrf
                        <button class="btn btn-sm btn-secondary"><i class="mdi mdi-cloud-download"></i> {{ __('Import from storage') }}</button>
                    </form>
                @endif
                <button type="button" class="btn btn-sm btn-primary" data-drawer="#media-upload">
                    <i class="mdi mdi-upload"></i> {{ __('Upload') }}
                </button>
            </div>
        </div>

        <div class="card-body">
            <form method="GET" class="row g-2 mb-4" data-auto-filter>
                <div class="col-md-4">
                    <input type="text" class="form-control" name="search" placeholder="{{ __('Name or path') }}"
                           value="{{ $filters['search'] ?? '' }}">
                </div>
                <div class="col-md-3">
                    <select class="form-control" name="folder">
                        <option value="">{{ __('All folders') }}</option>
                        @foreach($folders as $key => $label)
                            <option value="{{ $key }}" @selected(($filters['folder'] ?? '') === $key)>{{ $label }}</option>
                        @endforeach
                    </select>
                </div>
                <div class="col-md-2">
                    <select class="form-control" name="kind">
                        <option value="">{{ __('Any type') }}</option>
                        @foreach($kinds as $key => $label)
                            <option value="{{ $key }}" @selected(($filters['kind'] ?? '') === $key)>{{ $label }}</option>
                        @endforeach
                    </select>
                </div>
                <div class="col-md-2">
                    <select class="form-control" name="provider">
                        <option value="">{{ __('Any storage') }}</option>
                        @foreach($storageOptions as $key => $label)
                            <option value="{{ $key }}" @selected(($filters['provider'] ?? '') === $key)>{{ $label }}</option>
                        @endforeach
                    </select>
                </div>
                <div class="col-md-1">
                    @if(array_filter($filters))
                        <a href="{{ route('admin.media.index', ['locale' => $locale]) }}" class="btn btn-secondary w-100">{{ __('Clear') }}</a>
                    @else
                        <button class="btn btn-secondary w-100">{{ __('Filter') }}</button>
                    @endif
                </div>
            </form>

            @if(array_filter($filters))
                <p class="small text-muted mb-3">{{ trans_choice(':count file match.|:count files match.', $media->total(), ['count' => number_format($media->total())]) }}</p>
            @endif

            <form method="POST" action="{{ route('admin.media.destroy-many', ['locale' => $locale]) }}" id="media-bulk"
                  data-confirm="{{ __('Delete the selected files?') }}">
                @csrf
                @method('DELETE')
            </form>

            <div class="table-responsive">
                <table class="table align-middle">
                    <thead>
                    <tr>
                        @if($isAdmin)
                            <th style="width:32px;"><input type="checkbox" data-media-check-all aria-label="{{ __('Select all') }}"></th>
                        @endif
                        <th style="width:88px;"></th>
                        <th>{{ __('File') }}</th>
                        <th>{{ __('Folder') }}</th>
                        <th class="text-end">{{ __('Size') }}</th>
                        <th>{{ __('Storage') }}</th>
                        <th>{{ __('Used by') }}</th>
                        <x-row-actions-header />
                    </tr>
                    </thead>
                    <tbody>
                    @forelse($media as $item)
                        @php
                            $url = $item->url();
                            $uses = $usage[$item->id] ?? [];
                        @endphp
                        <tr>
                            @if($isAdmin)
                                <td><input type="checkbox" name="ids[]" value="{{ $item->id }}" form="media-bulk" data-media-check></td>
                            @endif
                            <td>
                                <a href="{{ $url }}" target="_blank" rel="noopener" class="cl-media-thumb">
                                    @if($item->isImage())
                                        <img src="{{ $url }}" alt="" loading="lazy">
                                    @elseif($item->isDocument())
                                        {{-- A document has no frame to show, so the card is the
                                             icon and what the file actually is. Its size is the
                                             column two to the right. --}}
                                        <i class="mdi mdi-file-document-outline"></i>
                                        <span class="cl-media-thumb__ext">{{ $item->extension() }}</span>
                                    @elseif($item->isAudio())
                                        <i class="mdi mdi-music-note"></i>
                                    @elseif($item->isVideo())
                                        {{-- Legacy rows only; see App\Models\Media::VIDEO. --}}
                                        <video src="{{ $url }}#t=1" preload="metadata" muted playsinline></video>
                                        <i class="mdi mdi-play-circle cl-media-thumb__badge"></i>
                                    @else
                                        <i class="mdi mdi-file-outline"></i>
                                        <span class="cl-media-thumb__ext">{{ $item->extension() }}</span>
                                    @endif
                                </a>
                            </td>
                            <td style="max-width:340px;">
                                <strong class="d-block text-truncate" title="{{ $item->name }}">{{ $item->name }}</strong>
                                <div class="small text-muted text-truncate"><code>{{ $item->path }}</code></div>
                                <div class="small text-muted">
                                    {{ $item->mime }}@if($item->width) · {{ $item->width }}×{{ $item->height }}@endif
                                </div>
                            </td>
                            <td class="small">{{ $folders[$item->folder] ?? ($item->folder ?: '—') }}</td>
                            <td class="text-end small text-nowrap">{{ \Illuminate\Support\Number::fileSize((int) $item->size, 1) }}</td>
                            <td class="small">{{ $providerLabels[$item->provider] ?? $item->provider ?? $item->disk }}</td>
                            <td class="small" style="max-width:260px;">
                                @if($uses === [])
                                    <span class="badge bg-secondary">{{ __('Unused') }}</span>
                                @else
                                    @foreach(array_slice($uses, 0, 3) as $use)
                                        <div class="text-truncate">
                                            @if($use['url'])
                                                <a href="{{ $use['url'] }}">{{ $use['label'] }}</a>
                                            @else
                                                {{ $use['label'] }}
                                            @endif
                                        </div>
                                    @endforeach
                                    @if(count($uses) > 3)
                                        <span class="text-muted">{{ __('+:count more', ['count' => count($uses) - 3]) }}</span>
                                    @endif
                                @endif
                            </td>
                            <td class="row-actions-col">
                                <x-row-actions>
                                    <x-row-action icon="open-in-new" :href="$url" target="_blank">{{ __('Open') }}</x-row-action>
                                    <a class="row-actions-item" role="menuitem" href="#" data-copy="{{ $url }}">
                                        <i class="mdi mdi-link-variant" aria-hidden="true"></i><span>{{ __('Copy URL') }}</span>
                                    </a>
                                    <a class="row-actions-item" role="menuitem" href="#" data-copy="{{ $item->path }}">
                                        <i class="mdi mdi-content-copy" aria-hidden="true"></i><span>{{ __('Copy path') }}</span>
                                    </a>
                                    <a class="row-actions-item" role="menuitem" data-drawer="#media-rename-{{ $item->id }}">
                                        <i class="mdi mdi-pencil" aria-hidden="true"></i><span>{{ __('Rename') }}</span>
                                    </a>
                                    @if($isAdmin)
                                        <a class="row-actions-item" role="menuitem" data-drawer="#media-move-{{ $item->id }}">
                                            <i class="mdi mdi-folder-move" aria-hidden="true"></i><span>{{ __('Move to folder') }}</span>
                                        </a>
                                        <x-row-action-form method="POST" icon="broom" tone=""
                                                           async="message" :async-label="__('Clearing the CDN cache')"
                                                           :action="route('admin.media.purge', ['locale' => $locale, 'media' => $item->id])">
                                            {{ __('Clear CDN cache') }}
                                        </x-row-action-form>
                                        <x-row-actions-divider />
                                        <x-row-action-form :action="route('admin.media.delete', ['locale' => $locale, 'media' => $item->id])"
                                                           icon="delete"
                                                           :confirm="__('Delete :name?', ['name' => $item->name])">
                                            {{ __('Delete') }}
                                        </x-row-action-form>
                                    @endif
                                </x-row-actions>
                            </td>
                        </tr>
                    @empty
                        <tr><td colspan="8" class="text-muted">{{ __('No files match that filter.') }}</td></tr>
                    @endforelse
                    </tbody>
                </table>
            </div>

            <div class="d-flex justify-content-between align-items-center flex-wrap">
                @if($isAdmin)
                    <form method="POST" action="{{ route('admin.media.move-many', ['locale' => $locale]) }}"
                          class="d-flex align-items-center flex-wrap" style="gap:.5rem;" data-media-bulk-move>
                        @csrf
                        <select name="folder" class="form-control form-control-sm" style="width:auto;" aria-label="{{ __('Move to folder') }}">
                            @foreach($folders as $key => $label)
                                <option value="{{ $key }}">{{ $label }}</option>
                            @endforeach
                        </select>
                        <button type="submit" class="btn btn-sm btn-secondary" data-media-bulk disabled>
                            <i class="mdi mdi-folder-move"></i> {{ __('Move selected') }}
                        </button>
                        <button type="submit" form="media-bulk" class="btn btn-sm btn-outline-danger" data-media-bulk disabled>
                            {{ __('Delete selected') }}
                        </button>
                    </form>
                @endif
                {{ $media->links() }}
            </div>
        </div>
    </div>

    @if($isAdmin)
        @foreach($media as $item)
            @php $inUse = count($usage[$item->id] ?? []); @endphp
            <x-drawer :id="'media-move-'.$item->id" :title="__('Move to folder')" :subtitle="$item->path">
                <form method="POST" action="{{ route('admin.media.move', ['locale' => $locale, 'media' => $item->id]) }}" id="media-move-form-{{ $item->id }}">
                    @csrf
                    <label class="form-label small" for="media-folder-{{ $item->id }}">{{ __('Folder') }}</label>
                    <select class="form-control" id="media-folder-{{ $item->id }}" name="folder">
                        @foreach($folders as $key => $label)
                            <option value="{{ $key }}" @selected($item->folder === $key)>{{ $label }}</option>
                        @endforeach
                    </select>
                    @if($inUse)
                        <p class="small text-muted mt-2 mb-0">{{ trans_choice('Used by :count item; links update automatically.|Used by :count items; links update automatically.', $inUse) }}</p>
                    @endif
                </form>
                <x-slot name="footer">
                    <button type="button" class="btn btn-sm btn-secondary" data-drawer-close>{{ __('Cancel') }}</button>
                    <button type="submit" form="media-move-form-{{ $item->id }}" class="btn btn-sm btn-primary">{{ __('Move') }}</button>
                </x-slot>
            </x-drawer>
        @endforeach
    @endif

    @foreach($media as $item)
        <x-drawer :id="'media-rename-'.$item->id" :title="__('Rename')" :subtitle="$item->path">
            <form method="POST" action="{{ route('admin.media.update', ['locale' => $locale, 'media' => $item->id]) }}" id="media-rename-form-{{ $item->id }}">
                @csrf
                <label class="form-label" for="media-name-{{ $item->id }}">{{ __('Name') }}</label>
                <input type="text" class="form-control" id="media-name-{{ $item->id }}" name="name" value="{{ $item->name }}" required maxlength="255">
            </form>
            <x-slot name="footer">
                <button type="button" class="btn btn-sm btn-secondary" data-drawer-close>{{ __('Cancel') }}</button>
                <button type="submit" form="media-rename-form-{{ $item->id }}" class="btn btn-sm btn-primary">{{ __('Save') }}</button>
            </x-slot>
        </x-drawer>
    @endforeach

    <x-drawer id="media-upload" :title="__('Upload')" :subtitle="__('To :provider', ['provider' => $activeProvider])" :wide="true">
        <div data-media-uploader
             data-upload-url="{{ route('admin.media.upload', ['locale' => $locale]) }}"
             data-max-bytes="{{ $maxBytes }}"
             data-limit-source="{{ $limitSource }}"
             data-reload="1">
            <div class="mb-3">
                <label class="form-label" for="media-upload-folder">{{ __('Folder') }}</label>
                <select class="form-control" id="media-upload-folder" data-media-folder>
                    @foreach($folders as $key => $label)
                        <option value="{{ $key }}" @selected($key === ($filters['folder'] ?? 'uploads'))>{{ $label }}</option>
                    @endforeach
                </select>
            </div>

            <label class="cl-dropzone" data-media-drop>
                <input type="file" multiple accept="{{ $accept }}" data-media-input hidden>
                <i class="mdi mdi-cloud-upload"></i>
                <span>{{ __('Drop files here or click to choose') }}</span>
                <small class="text-muted">{{ __('Up to :size MB each', ['size' => number_format($maxMegabytes)]) }}</small>
            </label>

            <div class="cl-upload-list" data-media-queue></div>
        </div>

        <x-slot name="footer">
            <button type="button" class="btn btn-sm btn-secondary" data-drawer-close>{{ __('Close') }}</button>
        </x-slot>
    </x-drawer>
@endsection
