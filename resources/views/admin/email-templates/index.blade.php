@extends('admin.admin_master')
@section('admin')
    @php
        $locale = app()->getLocale();

        // Built from pieces: a literal {{ in a Blade string is compiled as an echo.
        $placeholder = fn (string $name) => '{'.'{ $'.$name.' }'.'}';

        // Deleting one of these keeps the mail going with built-in wording;
        // deleting any other switches that mail off.
        $builtIn = \App\Http\Controllers\AdminEmailTemplatesController::BUILT_IN_FALLBACK;
    @endphp

    @include('admin.partials.flash')

    {{-- Every one of these renders inside the same mail wrapper — header, framing,
         footer — so the body stored here is the body only. Preview shows the
         result with the placeholders filled in, which is the only way a wrong placeholder is
         caught before somebody receives it. --}}

    <div class="card card-default">
        <div class="card-header card-header-border-bottom d-flex justify-content-between align-items-center">
            <h2 class="mb-0">{{ __('dashboard.email_templates') }}</h2>
            <button class="btn btn-sm btn-primary" data-drawer="#new-template">{{ __('dashboard.add_template') }}</button>
        </div>

        <div class="card-body">
            <div class="table-responsive">
                <table class="table align-middle">
                    <thead>
                        <tr>
                            <th>{{ __('dashboard.name') }}</th>
                            <th>{{ __('Key') }}</th>
                            <th>{{ __('Subject') }}</th>
                            <th>{{ __('Placeholders') }}</th>
                            <x-row-actions-header />
                        </tr>
                    </thead>
                    <tbody>
                    @forelse($templates as $template)
                        <tr data-template="{{ $template->id }}">
                            <td class="text-nowrap"><strong>{{ $template->name }}</strong></td>
                            {{-- The key is what code looks the template up by. --}}
                            <td class="small"><code>{{ $template->key }}</code> <span class="badge bg-secondary" title="{{ __('Language') }}">{{ $template->locale }}</span></td>
                            <td class="small text-muted">{{ $template->subject }}</td>
                            <td class="small">
                                @forelse(array_keys($samples[$template->key] ?? []) as $name)
                                    <code class="mr-1">{{ $placeholder($name) }}</code>
                                @empty
                                    <span class="text-muted">{{ __('none') }}</span>
                                @endforelse
                            </td>
                            <td class="row-actions-col">
                                <x-row-actions>
                                    <a class="row-actions-item" role="menuitem" data-drawer="#template-{{ $template->id }}">
                                        <i class="mdi mdi-pencil" aria-hidden="true"></i>
                                        <span>{{ __('dashboard.edit') }}</span>
                                    </a>
                                    <a class="row-actions-item" role="menuitem" data-drawer="#preview-{{ $template->id }}">
                                        <i class="mdi mdi-eye-outline" aria-hidden="true"></i>
                                        <span>{{ __('Preview') }}</span>
                                    </a>
                                    <x-row-actions-divider />
                                    <x-row-action-form icon="delete" tone="danger"
                                                       :action="route('admin.email-templates.delete', ['locale' => $locale, 'id' => $template->id])"
                                                       :confirm="in_array($template->key, $builtIn, true)
                                                           ? __('Delete this template? Built-in wording will be used.')
                                                           : __('Delete this template? This mail will stop.')">{{ __('dashboard.delete') }}</x-row-action-form>
                                </x-row-actions>
                            </td>
                        </tr>
                    @empty
                        <tr><td colspan="5" class="text-muted">{{ __('No templates yet.') }}</td></tr>
                    @endforelse
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    @foreach($templates as $template)
        <x-drawer :id="'template-'.$template->id" :title="$template->name" :subtitle="$template->key" :wide="true">
            <form id="template-form-{{ $template->id }}" method="POST"
                  action="{{ route('admin.email-templates.update', ['locale' => $locale, 'id' => $template->id]) }}">
                @csrf
                <input type="hidden" name="id" value="{{ $template->id }}">

                <div class="cl-drawer__section">
                    <div class="cl-drawer__section-title">{{ __('Template') }}</div>
                    <div class="form-row">
                        <div class="col-6 mb-3">
                            <label class="form-label small">{{ __('dashboard.template_name') }}</label>
                            <input type="text" name="name" class="form-control" value="{{ $template->name }}" required>
                        </div>
                        <div class="col-6 mb-3">
                            <label class="form-label small">{{ __('Subject') }}</label>
                            <input type="text" name="subject" class="form-control" value="{{ $template->subject }}">
                        </div>
                    </div>
                </div>

                <div class="cl-drawer__section">
                    <div class="cl-drawer__section-title">{{ __('Body') }}</div>
                    @if($samples[$template->key] ?? false)
                        <div class="small mb-2">
                            @foreach(array_keys($samples[$template->key]) as $name)
                                <code class="mr-1">{{ $placeholder($name) }}</code>
                            @endforeach
                        </div>
                    @endif
                    {{-- A plain HTML field rather than a rich-text editor: the editor
                         stripped inline styles and rewrote markup on every save. --}}
                    <textarea name="template" class="form-control" rows="12" style="font-family:monospace; font-size:12px" required>{{ $template->template }}</textarea>
                </div>
            </form>

            <x-slot name="footer">
                <button type="button" class="btn btn-sm btn-secondary" data-drawer-close>{{ __('Cancel') }}</button>
                <button class="btn btn-sm btn-primary" form="template-form-{{ $template->id }}">{{ __('Save template') }}</button>
            </x-slot>
        </x-drawer>

        <x-drawer :id="'preview-'.$template->id" :title="$template->name" :subtitle="__('as it will arrive')" :wide="true">
            <div class="cl-drawer__section">
                <div class="cl-drawer__section-title">{{ $template->subject }}</div>
                {{-- Its own document: mail HTML rendered inside the panel would inherit the
                     panel's stylesheet and flatter itself. --}}
                <iframe src="{{ route('admin.email-templates.preview', ['locale' => $locale, 'id' => $template->id]) }}"
                        title="{{ __('Email preview') }}" loading="lazy"
                        style="width:100%; height:560px; border:1px solid rgba(0,0,0,.1); border-radius:6px; background:#fff"></iframe>
            </div>

            <x-slot name="footer">
                <button type="button" class="btn btn-sm btn-secondary" data-drawer-close>{{ __('Close') }}</button>
                <a class="btn btn-sm btn-primary" target="_blank" rel="noopener"
                   href="{{ route('admin.email-templates.preview', ['locale' => $locale, 'id' => $template->id]) }}">{{ __('Open in a tab') }}</a>
            </x-slot>
        </x-drawer>
    @endforeach

    <x-drawer id="new-template" :title="__('New template')">
        <form id="new-template-form" method="POST" action="{{ route('admin.email-templates.store', ['locale' => $locale]) }}">
            @csrf
            <div class="cl-drawer__section">
                <div class="cl-drawer__section-title">{{ __('Template') }}</div>
                <div class="form-row">
                    <div class="col-6 mb-3">
                        <label class="form-label small" for="nt-key">{{ __('Key') }}</label>
                        <input type="text" class="form-control" id="nt-key" name="key" placeholder="cashout_approved" pattern="[a-z0-9_]+"
                               value="{{ old('key') }}" required>
                        @error('key')<div class="text-danger small">{{ $message }}</div>@enderror
                    </div>
                    <div class="col-6 mb-3">
                        <label class="form-label small" for="nt-name">{{ __('dashboard.template_name') }}</label>
                        <input type="text" class="form-control" id="nt-name" name="name" value="{{ old('name') }}" required>
                    </div>
                    <div class="col-12 mb-3">
                        <label class="form-label small" for="nt-subject">{{ __('Subject') }}</label>
                        <input type="text" class="form-control" id="nt-subject" name="subject" value="{{ old('subject') }}" required>
                    </div>
                </div>
            </div>

            <div class="cl-drawer__section">
                <div class="cl-drawer__section-title">{{ __('Body') }}</div>
                <textarea name="template" class="form-control" rows="10"
                          style="font-family:monospace; font-size:12px">{{ old('template') }}</textarea>
            </div>
        </form>

        <x-slot name="footer">
            <button type="button" class="btn btn-sm btn-secondary" data-drawer-close>{{ __('Cancel') }}</button>
            <button class="btn btn-sm btn-primary" form="new-template-form">{{ __('dashboard.add_template') }}</button>
        </x-slot>
    </x-drawer>
@endsection
