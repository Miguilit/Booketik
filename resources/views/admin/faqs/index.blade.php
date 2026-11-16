@extends('admin.admin_master')
@section('admin')
    @php $locale = app()->getLocale(); @endphp

    @include('admin.partials.flash')

    <div class="card card-default">
        <div class="card-header card-header-border-bottom d-flex justify-content-between align-items-center">
            <h2>{{ __('FAQs') }}</h2>
            <button type="button" class="btn btn-sm btn-primary" data-drawer="#faq-new">{{ __('Add FAQ') }}</button>
        </div>

        <div class="card-body">
            <div class="table-responsive">
                <table class="table">
                    <thead>
                    <tr>
                        <th>{{ __('Question') }}</th>
                        <th>{{ __('Category') }}</th>
                        <th>{{ __('Order') }}</th>
                        <th>{{ __('Active') }}</th>
                        <x-row-actions-header />
                    </tr>
                    </thead>
                    <tbody>
                    @forelse($faqs as $faq)
                        <tr>
                            <td>
                                <a href="#" data-drawer="#faq-{{ $faq->id }}">{{ $faq->question }}</a>
                                <div class="small text-muted">{{ Str::limit($faq->answer, 110) }}</div>
                            </td>
                            <td>{{ $faq->category ?? '—' }}</td>
                            <td>{{ $faq->sort_order }}</td>
                            <td>{!! $faq->is_active
                                ? '<span class="badge bg-success">'.e(__('Yes')).'</span>'
                                : '<span class="badge bg-secondary">'.e(__('No')).'</span>' !!}</td>
                            <td class="row-actions-col">
                                <x-row-actions>
                                    <a href="#" class="row-actions-item" role="menuitem" data-drawer="#faq-{{ $faq->id }}">
                                        <i class="mdi mdi-pencil" aria-hidden="true"></i>
                                        <span>{{ __('Edit') }}</span>
                                    </a>
                                    <x-row-actions-divider />
                                    <x-row-action-form icon="delete"
                                                       :action="route('admin.faqs.delete', ['locale' => $locale, 'id' => $faq->id])"
                                                       :confirm="__('Delete this FAQ?')">{{ __('Delete') }}</x-row-action-form>
                                </x-row-actions>
                            </td>
                        </tr>
                    @empty
                        <tr><td colspan="5" class="text-muted">{{ __('No FAQs yet.') }}</td></tr>
                    @endforelse
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    @foreach($faqs as $faq)
        <x-drawer :id="'faq-'.$faq->id" :title="__('Edit FAQ')">
            <form id="faq-form-{{ $faq->id }}" method="POST" action="{{ route('admin.faqs.update', ['locale' => $locale, 'id' => $faq->id]) }}">
                @csrf
                @include('admin.faqs._fields', ['faq' => $faq, 'prefix' => 'faq-'.$faq->id])
            </form>
            <x-slot name="footer">
                <button type="button" class="btn btn-sm btn-secondary" data-drawer-close>{{ __('Cancel') }}</button>
                <button class="btn btn-sm btn-primary" form="faq-form-{{ $faq->id }}">{{ __('Save FAQ') }}</button>
            </x-slot>
        </x-drawer>
    @endforeach

    <x-drawer id="faq-new" :title="__('Add FAQ')" :autoopen="$errors->any()">
        <form id="faq-new-form" method="POST" action="{{ route('admin.faqs.store', ['locale' => $locale]) }}">
            @csrf
            @include('admin.faqs._fields', ['faq' => new \App\Models\Faq(['is_active' => true, 'sort_order' => 0]), 'prefix' => 'faq-new'])
        </form>
        <x-slot name="footer">
            <button type="button" class="btn btn-sm btn-secondary" data-drawer-close>{{ __('Cancel') }}</button>
            <button class="btn btn-sm btn-primary" form="faq-new-form">{{ __('Add FAQ') }}</button>
        </x-slot>
    </x-drawer>
@endsection
