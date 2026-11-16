@extends('admin.admin_master')
@section('admin')

    @if(session('success'))
        <div class="alert alert-success alert-dismissible fade show" role="alert">
            <strong>{{ session('success') }}</strong>
            <button type="button" class="btn-close" data-bs-dismiss="alert"
                    aria-label="{{ __('Close') }}"></button>
        </div>
    @endif

    <form action="{{ route('admin.save.web.settings', ['locale' => app()->getLocale()]) }}" method="POST" enctype="multipart/form-data">
        @csrf

        @include('admin.partials.form-lock-actions', ['saveLabel' => __('Save settings')])

        {{-- Branding: the one place the site's name, logo and favicon are set.
             Read everywhere through App\Support\SiteBrand; linked from the
             sidebar as Appearance → Branding (#branding). --}}
        @php
            $brandName = \App\Support\SiteBrand::name();
            $brandLogo = \App\Support\SiteBrand::logoUrl();
            $brandFavicon = \App\Support\SiteBrand::faviconUrl();
        @endphp
        <div class="row">
            <div class="col-md-8">
                <div class="card mb-4" id="branding" style="scroll-margin-top: 90px;">
                    <div class="card-header">
                        <i class="mdi mdi-tag-text-outline me-1"></i> {{ __('dashboard.branding') }}
                    </div>
                    <div class="card-body">
                        <p class="text-muted small mb-4">{{ __('dashboard.branding_help') }}</p>

                        <div class="form-group">
                            <label for="site_name" class="form-label">{{ __('dashboard.brand_site_name') }}</label>
                            <input type="text" id="site_name" name="site_name" class="form-control" maxlength="120"
                                   placeholder="{{ config('app.name') }}"
                                   value="{{ old('site_name', $webSettings->site_name) }}"
                                   aria-describedby="site_name_help">
                            <small id="site_name_help" class="form-text text-muted">{{ __('dashboard.brand_site_name_help') }}</small>
                            @error('site_name')
                            <span class="text-danger d-block">{{ $message }}</span>
                            @enderror
                        </div>

                        <div class="form-group">
                            <label for="logo_src" class="form-label">{{ __('dashboard.website_logo') }}</label>
                            <input type="file" id="logo_src" name="logo_src" class="form-control"
                                   accept="image/png,image/jpeg,image/webp,image/avif" aria-describedby="logo_src_help">
                            <small id="logo_src_help" class="form-text text-muted">{{ __('dashboard.brand_logo_help') }}</small>
                            @error('logo_src')
                            <span class="text-danger d-block">{{ $message }}</span>
                            @enderror
                            <div class="d-flex align-items-center gap-3 mt-2">
                                <span class="text-muted small">{{ __('dashboard.brand_current_logo') }}:</span>
                                @if($brandLogo)
                                    <img src="{{ $brandLogo }}" alt="{{ $brandName }}"
                                         style="height: 48px; width: auto; max-width: 240px; object-fit: contain; background: repeating-conic-gradient(#eee 0 25%, #fff 0 50%) 0 0 / 12px 12px; padding: 4px; border-radius: 6px;">
                                    <div class="form-check mb-0">
                                        <input class="form-check-input" type="checkbox" value="1" id="remove_logo" name="remove_logo">
                                        <label class="form-check-label small" for="remove_logo">{{ __('dashboard.brand_remove_logo') }}</label>
                                    </div>
                                @else
                                    <span class="small">{{ __('dashboard.brand_no_logo') }}</span>
                                @endif
                            </div>
                        </div>

                        <div class="form-group">
                            <label for="logo_display" class="form-label">{{ __('dashboard.brand_logo_display') }}</label>
                            <select id="logo_display" name="logo_display" class="form-control" aria-describedby="logo_display_help">
                                @foreach(\App\Support\SiteBrand::LOGO_DISPLAYS as $mode)
                                    <option value="{{ $mode }}" @selected(old('logo_display', $webSettings->logo_display ?? 'logo_text') === $mode)>
                                        {{ __('dashboard.brand_logo_display_'.$mode) }}
                                    </option>
                                @endforeach
                            </select>
                            <small id="logo_display_help" class="form-text text-muted">{{ __('dashboard.brand_logo_display_help') }}</small>
                            @error('logo_display')
                            <span class="text-danger d-block">{{ $message }}</span>
                            @enderror
                        </div>

                        <div class="form-group mb-0">
                            <label for="favicon_src" class="form-label">{{ __('dashboard.brand_favicon') }}</label>
                            <input type="file" id="favicon_src" name="favicon_src" class="form-control"
                                   accept="image/png,image/x-icon,image/vnd.microsoft.icon,image/webp,.ico" aria-describedby="favicon_src_help">
                            <small id="favicon_src_help" class="form-text text-muted">{{ __('dashboard.brand_favicon_help') }}</small>
                            @error('favicon_src')
                            <span class="text-danger d-block">{{ $message }}</span>
                            @enderror
                            <div class="d-flex align-items-center gap-3 mt-2">
                                <span class="text-muted small">{{ __('dashboard.brand_current_favicon') }}:</span>
                                <img src="{{ $brandFavicon }}" alt="" width="32" height="32"
                                     style="width: 32px; height: 32px; object-fit: contain;">
                                @if(filled($webSettings->favicon_src))
                                    <div class="form-check mb-0">
                                        <input class="form-check-input" type="checkbox" value="1" id="remove_favicon" name="remove_favicon">
                                        <label class="form-check-label small" for="remove_favicon">{{ __('dashboard.brand_remove_favicon') }}</label>
                                    </div>
                                @else
                                    <span class="small text-muted">{{ __('dashboard.brand_default_favicon') }}</span>
                                @endif
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="row">
            <div class="col-md-8">
                <div class="card">
                    <div class="card-header">{{ __('dashboard.web_settings') }}</div>
                    <div class="card-body">
                        <div class="form-group">
                            <label for="ipinfo_token" class="form-label">{{ __('dashboard.ipinfo_token') }}</label>
                            <input type="text" id="ipinfo_token" name="ipinfo_token" class="form-control"
                                   placeholder="{{ __('dashboard.ipinfo_token') }}" value="{{ $maskedIpInfoToken }}"/>
                            <input type="hidden" name="actual_ipinfo_token" value="{{ $webSettings->ipinfo_token }}">
                        </div>
                        <div class="form-group">
                            <label for="test_ip" class="form-label">{{ __('dashboard.test_ip') }}</label>
                            <input type="text" id="test_ip" name="test_ip" class="form-control"
                                   placeholder="{{ __('dashboard.test_ip') }}" value="{{ $maskedTestIp }}"/>
                            <input type="hidden" name="actual_test_ip" value="{{ $webSettings->test_ip }}">
                        </div>
                        <!-- Footer Description Input -->
                        <div class="form-group">
                            <label for="footer_description" class="form-label">{{ __('dashboard.footer_description') }}</label>
                            <textarea name="footer_description" class="form-control"
                                      placeholder="{{ __('dashboard.footer_description') }}">{{ $webSettings ? $webSettings->footer_description : '' }}</textarea>
                        </div>

                        <div class="form-group">
                            <label for="go_to_website_link" class="form-label">{{ __('dashboard.go_to_website_link') }}</label>
                            <input type="text" name="go_to_website_link" class="form-control"
                                   placeholder="{{ __('dashboard.go_to_website_link') }}" value="{{ $webSettings ? $webSettings->go_to_website_link : '' }}">
                        </div>

                        <div class="form-group">
                            <label for="footer_copyright_text" class="form-label">{{ __('dashboard.footer_copyright_text') }}</label>
                            <textarea name="footer_copyright_text" class="form-control"
                                      placeholder="{{ __('dashboard.footer_copyright_text') }}">{{ $webSettings ? $webSettings->footer_copyright_text : '' }}</textarea>
                        </div>

                        <div class="form-group">
                            <label for="footer_newsletter_text" class="form-label">{{ __('dashboard.footer_newsletter_text') }}</label>
                            <textarea name="footer_newsletter_text" class="form-control"
                                      placeholder="{{ __('dashboard.footer_newsletter_text') }}">{{ $webSettings ? $webSettings->footer_newsletter_text : '' }}</textarea>
                        </div>

                        <div class="pt-4 mt-4 border-top"></div>

                        <div class="form-group">
                            <label for="register_description" class="form-label">{{ __('dashboard.register_description') }}</label>
                            <textarea name="register_description" class="form-control"
                                      placeholder="{{ __('dashboard.register_description') }}">{{ $webSettings ? $webSettings->register_description : '' }}</textarea>
                        </div>

                        <div class="form-group">
                            <label for="register_page_image_link" class="form-label">{{ __('dashboard.register_page_image_link') }}</label>
                            <textarea name="register_page_image_link" class="form-control"
                                      placeholder="{{ __('dashboard.register_page_image_link') }}">{{ $webSettings ? $webSettings->register_page_image_link : '' }}</textarea>
                        </div>

                        <div class="form-group">
                            <div class="form-check form-switch">
                                <input class="form-check-input" type="checkbox" role="switch"
                                       id="is_facebook_login_enabled" name="is_facebook_login_enabled" {{ $webSettings->is_facebook_login_enabled == 1 ? 'checked' : '' }}>
                                <label class="form-check-label" for="is_facebook_login_enabled">{{ __('dashboard.facebook_login_enable') }}</label>
                            </div>
                        </div>

                        <div class="form-group">
                            <div class="form-check form-switch">
                                <input class="form-check-input" type="checkbox" role="switch"
                                       id="is_google_login_enabled" name="is_google_login_enabled" {{ $webSettings->is_google_login_enabled == 1 ? 'checked' : '' }}>
                                <label class="form-check-label" for="is_google_login_enabled">{{ __('dashboard.google_login_enable') }}</label>
                            </div>
                        </div>

                        <div class="form-group">
                            <div class="form-check form-switch">
                                <input class="form-check-input" type="checkbox" role="switch"
                                       id="is_cloudflare_turnstile_enabled" name="is_cloudflare_turnstile_enabled" {{ $webSettings->is_cloudflare_turnstile_enabled == 1 ? 'checked' : '' }}>
                                <label class="form-check-label" for="is_cloudflare_turnstile_enabled">{{ __('dashboard.cloudflare_turnstile_enable') }}</label>
                            </div>
                        </div>

                        <div class="form-group">
                            <div class="form-check form-switch">
                                <input class="form-check-input" type="checkbox" role="switch"
                                       id="is_google_recaptcha_enabled" name="is_google_recaptcha_enabled" {{ $webSettings->is_google_recaptcha_enabled == 1 ? 'checked' : '' }}>
                                <label class="form-check-label" for="is_google_recaptcha_enabled">{{ __('dashboard.google_recaptcha_enable') }}</label>
                            </div>
                        </div>

                        <div class="pt-4 mt-4 border-top"></div>

                        <div class="form-group">
                            <div class="form-check form-switch">
                                <input class="form-check-input" type="checkbox" role="switch"
                                       id="footer_newsletter_status" name="footer_newsletter_status" {{ $webSettings->footer_newsletter_status == 1 ? 'checked' : '' }}>
                                <label class="form-check-label" for="footer_newsletter_status">{{ __('dashboard.footer_newsletter_status') }}</label>
                            </div>
                        </div>

                        <div class="form-group">
                            <div class="form-check form-switch">
                                <input class="form-check-input" type="checkbox" role="switch"
                                       id="is_web_version_enabled" name="is_web_version_enabled" {{ $webSettings->is_web_version_enabled == 1 ? 'checked' : '' }}>
                                <label class="form-check-label" for="is_web_version_enabled">{{ __('dashboard.web_version_enabled') }}</label>
                            </div>
                        </div>

                        <div class="pt-4 mt-4 border-top"></div>
                        <br>
                        <div class="form-footer pt-4 mt-4">
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="card mb-2">
                    <div class="card-header">{{ __('dashboard.footer_support_pages') }}</div>
                    <div class="card-body">
                        <div id="footerPagesContainer">
                            @foreach($webSettings->footerPages as $footerPage)
                                <div class="form-group d-flex align-items-center">
                                    <input type="text" name="footerPages[{{$loop->index}}][title]" class="form-control"
                                           placeholder="{{ __('dashboard.footer_support_pages') }}" value="{{ $footerPage->title }}">
                                    <input type="text" name="footerPages[{{$loop->index}}][slug]"
                                           class="form-control mx-2"
                                           placeholder="{{ __('dashboard.footer_support_pages') }}" value="{{ $footerPage->slug }}">
                                    <button type="button" class="btn btn-danger remove-footer-page">{{ __('dashboard.delete') }}</button>
                                </div>
                            @endforeach
                        </div>
                        <button type="button" id="addFooterPage" class="btn btn-secondary mt-2">{{ __('dashboard.add_footer_page') }}</button>
                    </div>
                </div>
                <div class="card mb-2">
                    <div class="card-header">{{ __('dashboard.footer_service_pages') }}</div>
                    <div class="card-body">
                        <div id="footerServicePagesContainer">
                            @foreach($webSettings->servicePages as $servicePage)
                                <div class="form-group d-flex align-items-center">
                                    <input type="text" name="footerServicePages[{{$loop->index}}][title]" class="form-control"
                                           placeholder="{{ __('dashboard.footer_service_pages') }}" value="{{ $servicePage->title }}">
                                    <input type="text" name="footerServicePages[{{$loop->index}}][slug]"
                                           class="form-control mx-2"
                                           placeholder="{{ __('dashboard.footer_service_pages') }}" value="{{ $servicePage->slug }}">
                                    <button type="button" class="btn btn-danger remove-footer-service-page">{{ __('dashboard.delete') }}</button>
                                </div>
                            @endforeach
                        </div>
                        <button type="button" id="addFooterServicePage" class="btn btn-secondary mt-2">{{ __('dashboard.add_footer_service_page') }}</button>
                    </div>
                </div>
                <div class="card">
                    <div class="card-header">{{ __('dashboard.footer_social_links') }}</div>
                    <div class="card-body">
                        <div id="footerSocialLinksContainer">
                            @foreach($webSettings->footerSocialLinks as $footerSocialLink)
                                <div class="form-group d-flex align-items-center">
                                    <input type="text" name="footerSocialLinks[{{$loop->index}}][title]"
                                           class="form-control"
                                           placeholder="{{ __('dashboard.footer_social_links') }}" value="{{ $footerSocialLink->title }}">
                                    <input type="text" name="footerSocialLinks[{{$loop->index}}][link]"
                                           class="form-control mx-2"
                                           placeholder="{{ __('dashboard.footer_social_links') }}" value="{{ $footerSocialLink->link }}">
                                    <button type="button" class="btn btn-danger remove-footer-social-link">{{ __('dashboard.delete') }}</button>
                                </div>
                            @endforeach
                        </div>
                        <button type="button" id="addFooterSocialLink" class="btn btn-secondary mt-2">{{ __('dashboard.add_footer_social_link') }}</button>
                    </div>
                </div>
            </div>
        </div>
    </form>

    <script>
        document.addEventListener('DOMContentLoaded', function () {
            const footerPagesContainer = document.getElementById('footerPagesContainer');
            const addFooterPageBtn = document.getElementById('addFooterPage');

            const footerServicePagesContainer = document.getElementById('footerServicePagesContainer');
            const addFooterServicePageBtn = document.getElementById('addFooterServicePage');

            const addFooterSocialLinksContainer = document.getElementById('footerSocialLinksContainer');
            const addFooterSocialLinkBtn = document.getElementById('addFooterSocialLink');

            addFooterPageBtn.addEventListener('click', function () {
                const newIndex = footerPagesContainer.children.length;
                const stepHtml = `
                <div class="form-group d-flex align-items-center">
                    <input type="text" name="footerPages[${newIndex}][title]" class="form-control" placeholder="{{ __('dashboard.footer_support_pages') }}" value="">
                    <input type="text" name="footerPages[${newIndex}][slug]" class="form-control mx-2" placeholder="{{ __('dashboard.footer_support_pages') }}" value="">
                    <button type="button" class="btn btn-danger remove-footer-page">{{ __('dashboard.delete') }}</button>
                </div>
            `;
                footerPagesContainer.insertAdjacentHTML('beforeend', stepHtml);
            });

            footerPagesContainer.addEventListener('click', function (e) {
                if (e.target.classList.contains('remove-footer-page')) {
                    e.target.parentElement.remove();
                }
            });

            addFooterServicePageBtn.addEventListener('click', function () {
                const newIndex = footerServicePagesContainer.children.length;
                const stepHtml = `
                <div class="form-group d-flex align-items-center">
                    <input type="text" name="footerServicePages[${newIndex}][title]" class="form-control" placeholder="{{ __('dashboard.footer_service_pages') }}" value="">
                    <input type="text" name="footerServicePages[${newIndex}][slug]" class="form-control mx-2" placeholder="{{ __('dashboard.footer_service_pages') }}" value="">
                    <button type="button" class="btn btn-danger remove-service-footer-page">{{ __('dashboard.delete') }}</button>
                </div>
            `;
                footerServicePagesContainer.insertAdjacentHTML('beforeend', stepHtml);
            });

            footerServicePagesContainer.addEventListener('click', function (e) {
                if (e.target.classList.contains('remove-service-footer-page')) {
                    e.target.parentElement.remove();
                }
            });

            addFooterSocialLinkBtn.addEventListener('click', function () {
                const newIndex = addFooterSocialLinksContainer.children.length;
                const stepHtml = `
                <div class="form-group d-flex align-items-center">
                    <input type="text" name="footerSocialLinks[${newIndex}][title]" class="form-control" placeholder="{{ __('dashboard.footer_social_links') }}" value="">
                    <input type="text" name="footerSocialLinks[${newIndex}][link]" class="form-control mx-2" placeholder="{{ __('dashboard.footer_social_links') }}" value="">
                    <button type="button" class="btn btn-danger remove-footer-social-link">{{ __('dashboard.delete') }}</button>
                </div>
            `;
                addFooterSocialLinksContainer.insertAdjacentHTML('beforeend', stepHtml);
            });

            addFooterSocialLinksContainer.addEventListener('click', function (e) {
                if (e.target.classList.contains('remove-footer-social-link')) {
                    e.target.parentElement.remove();
                }
            });
        });
    </script>
@endsection
