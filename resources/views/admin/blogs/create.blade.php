@extends('admin.admin_master')
@section('admin')
    @php $locale = app()->getLocale(); @endphp
    <div class="card card-default">
        <div class="card-header card-header-border-bottom"><h2>{{ __('New post') }}</h2></div>
        <div class="card-body">
            @include('admin.partials.flash')
            <form method="POST" action="{{ route('admin.blogs.store', ['locale' => $locale]) }}">
                @include('admin.blogs._form', ['post' => null])
            </form>
        </div>
    </div>
@endsection
