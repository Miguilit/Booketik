{{--
    A media field: paste a URL, or upload a file.

    Both halves write the same input, and that is the point. The column holds
    either an absolute URL (a CDN the operator already runs) or a relative path
    (something uploaded here); `App\Support\MediaUrl` resolves both, so the form
    does not need to know which it has and neither does anything downstream.

    Uploads post to `admin.media.store` and write the returned **relative** path
    back into the field. Relative, not absolute: an absolute URL would bake
    today's hostname into the row, and every uploaded image would 404 the first
    time the site moved behind a real domain.

    @param string $name  Form field name, e.g. `cover_image_url`
    @param string $label
    @param string $kind  One of MediaController::KINDS — cover|portrait|pdf|audio|icon
    @param mixed  $value
    @param string $help  Optional hint under the control
    @param string $uid   Optional DOM suffix. A list screen that renders one of
                         these per row, all posting the same field name, needs
                         the *name* to repeat while the ids must not — passing the
                         row id here keeps the upload wired to the right box.
--}}
@php
    $handle = $name.(isset($uid) ? '_'.$uid : '');
    $fieldId = $handle.'_field';
    $current = old($name, $value ?? null);
@endphp

<label class="form-label" for="{{ $fieldId }}">{{ $label }}</label>

<div class="input-group">
    <input type="text" class="form-control" id="{{ $fieldId }}" name="{{ $name }}"
           value="{{ $current }}" placeholder="{{ __('https://… or upload a file') }}"
           data-media-input="{{ $handle }}">
    <button class="btn btn-secondary" type="button" data-media-pick="{{ $handle }}">{{ __('Upload') }}</button>
</div>

{{-- Outside the form's own submit path: this input is never named, so the file
     never rides along with the save. It is uploaded on selection instead. --}}
<input type="file" class="d-none" data-media-file="{{ $handle }}" data-media-kind="{{ $kind ?? 'cover' }}">

<small class="text-muted d-block mt-1" data-media-status="{{ $handle }}">
    {{ $help ?? __('Paste a URL or upload a file.') }}
</small>

@once
    @push('scripts')
        <script>
            /*
             | One delegated listener for every media field on the page.
             |
             | Delegated rather than per-field: a list screen may render one
             | inside every collapsed row, and binding fifty listeners to rows
             | nobody opens is work for nothing.
             */
            document.addEventListener('click', function (event) {
                const trigger = event.target.closest('[data-media-pick]');
                if (!trigger) return;

                const name = trigger.getAttribute('data-media-pick');
                document.querySelector('[data-media-file="' + CSS.escape(name) + '"]')?.click();
            });

            document.addEventListener('change', async function (event) {
                const input = event.target.closest('[data-media-file]');
                if (!input || !input.files || input.files.length === 0) return;

                const name = input.getAttribute('data-media-file');
                const status = document.querySelector('[data-media-status="' + CSS.escape(name) + '"]');
                const target = document.querySelector('[data-media-input="' + CSS.escape(name) + '"]');

                const body = new FormData();
                body.append('file', input.files[0]);
                body.append('kind', input.getAttribute('data-media-kind') || 'cover');

                if (status) {
                    status.textContent = @json(__('Uploading…'));
                    status.classList.remove('text-danger');
                }

                try {
                    const response = await fetch(@json(route('admin.media.store', ['locale' => app()->getLocale()])), {
                        method: 'POST',
                        headers: {
                            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || '',
                            'Accept': 'application/json',
                        },
                        body: body,
                    });

                    const data = await response.json();

                    if (!response.ok) {
                        throw new Error(data.message || @json(__('Upload failed.')));
                    }

                    if (target) target.value = data.path;

                    if (status) {
                        /*
                         | The field now holds a path, which looks like nothing
                         | to an operator who pasted a URL a moment ago. Saying
                         | what landed — and that it still needs saving — is the
                         | difference between "did that work?" and knowing.
                         */
                        status.textContent = @json(__('Uploaded :name. Save to keep it.')).replace(':name', data.name);
                    }
                } catch (error) {
                    if (status) {
                        status.textContent = error.message;
                        status.classList.add('text-danger');
                    }
                } finally {
                    // Cleared so choosing the same file twice fires again.
                    input.value = '';
                }
            });
        </script>
    @endpush
@endonce
