@extends('admin.admin_master')
@section('admin')
    <div class="row">
        <div class="col-md-8">
            <div class="card card-default">
                <div class="card-header card-header-border-bottom">
                    <h2>{{ __('dashboard.change_password') }}</h2>
                </div>
                <div class="card-body">
                    <form method="POST" action="{{ route('update.user.password') }}" class="form-pill">
                        @csrf
                        <div class="form-group">
                            <label for="current_password">{{ __('dashboard.current_password') }}</label>
                            <input type="password" name="old_password" class="form-control" id="current_password"
                                   placeholder="{{ __('dashboard.current_password') }}">
                            @error('old_password')
                            <span class="text-danger">{{ $message }}</span>
                            @enderror
                        </div>
                        <div class="form-group">
                            <label for="password">{{ __('dashboard.new_password') }}</label>
                            <input type="password" name="password" class="form-control" id="password"
                                   placeholder="{{ __('dashboard.new_password') }}">
                            @error('password')
                            <span class="text-danger">{{ $message }}</span>
                            @enderror
                        </div>
                        <div class="form-group">
                            <label for="password_confirmation">{{ __('dashboard.confirm_password') }}</label>
                            <input type="password" name="password_confirmation" class="form-control" id="password_confirmation"
                                   placeholder="{{ __('dashboard.confirm_password') }}">
                        </div>
                        @error('password_confirmation')
                        <span class="text-danger">{{ $message }}</span>
                        @enderror
                        <button type="submit" class="btn btn-primary btn-default">{{ __('dashboard.save') }}</button>
                    </form>
                </div>
            </div>
        </div>
    </div>
@endsection
