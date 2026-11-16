{{--
    The shell for Fortify's own screens (two-factor challenge, confirm
    password): the sign-in card from login.blade.php, on the panel's static
    stylesheet. It used to load the old site stylesheet through Vite, which
    tied two security screens to a front-end build that no longer ships it.
--}}
<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    @include('layouts.admin-auth-head', ['title' => $attributes->get('title')])
</head>
<body class="bg-light-gray" id="body">
<div class="container d-flex flex-column justify-content-between vh-100">
    <div class="row justify-content-center mt-5">
        <div class="col-xl-5 col-lg-6 col-md-10">
            <div class="card">
                <div class="card-header bg-primary">
                    <div class="app-brand">
                        <a href="{{ route('login') }}"><span class="brand-name">{{ \App\Support\SiteBrand::name() }}</span></a>
                    </div>
                </div>
                @if($errors->any())
                    <div class="alert alert-danger m-3 mb-0" role="alert">
                        <ul class="mb-0">
                            @foreach($errors->all() as $error)<li>{{ $error }}</li>@endforeach
                        </ul>
                    </div>
                @endif
                <div class="card-body p-5">
                    {{ $slot }}
                </div>
            </div>
        </div>
    </div>
    <div class="copyright pl-0">
        <p class="text-center">&copy; {{ date('Y') }} {{ \App\Support\SiteBrand::name() }}</p>
    </div>
</div>
@include('partials.demo-frame-notice')
</body>
</html>
