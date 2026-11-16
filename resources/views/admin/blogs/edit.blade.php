@extends('admin.admin_master')
@section('admin')
    @php $locale = app()->getLocale(); @endphp
    <div class="card card-default">
        <div class="card-header card-header-border-bottom"><h2>{{ __('Edit :title', ['title' => $post->title]) }}</h2></div>
        <div class="card-body">
            @include('admin.partials.flash')
            <form method="POST" action="{{ route('admin.blogs.update', ['locale' => $locale, 'id' => $post->id]) }}">
                @include('admin.blogs._form')
            </form>
        </div>
    </div>
@endsection
