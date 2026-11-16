@extends('admin.admin_master')
@section('admin')
    <div class="row">
        <div class="col-md-8">
            <div class="card card-default">
                <div class="card-header card-header-border-bottom">
                    <h2>
                        {{ __('dashboard.user_profile_update') }}
                    </h2>
                </div>
                @if(session('success'))
                    <div class="alert alert-success alert-dismissible fade show" role="alert">
                        <strong>{{ session('success') }}</strong>
                        <button type="button" class="btn-close" data-bs-dismiss="alert"
                                aria-label="{{ __('dashboard.close') }}"></button>
                    </div>
                @endif
                <div class="card-body">
                    <form method="POST" action="{{ route('update.user.profile', ['locale' => app()->getLocale()]) }}"
                          class="form-pill" enctype="multipart/form-data">
                        @csrf

                        @include('admin.partials.form-lock-actions', ['saveLabel' => __('Save profile')])
                        <div class="form-group">
                            <label for="userName">{{ __('dashboard.user_name') }}</label>
                            <input type="text" name="name" class="form-control" value="{{ $user->name }}">
                        </div>

                        <div class="form-group">
                            <label for="userEmail">{{ __('dashboard.user_email') }}</label>
                            <input type="email" name="email" class="form-control" value="{{ $user->email }}">
                        </div>

                        <div class="form-group">
                            <label for="profilePhoto">{{ __('dashboard.profile_photo') }}</label>
                            <input type="file" name="profile_photo" class="form-control">
                            {{-- profile_photo_url falls back to a generated
                                 initials avatar, so this never renders broken. --}}
                            <img src="{{ $user->profile_photo_url }}" alt="{{ __('dashboard.profile_photo') }}"
                                 width="100" class="mt-2 rounded">
                        </div>

                        {{--
                            There are no postal address fields here on purpose:
                            this panel has no `addresses` table and no use for a
                            staff member's street address.
                        --}}

                    </form>
                </div>
            </div>
        </div>
    </div>
@endsection
