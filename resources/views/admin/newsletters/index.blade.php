@php use Carbon\Carbon; @endphp
@extends('admin.admin_master')
@section('admin')
    <div class="row">
        <div class="col-md-6">
            <div class="card">
                @if(session('success'))
                    <div class="alert alert-success alert-dismissible fade show" role="alert">
                        <strong>{{ session('success') }}</strong>
                        <button type="button" class="btn-close" data-bs-dismiss="alert"
                                aria-label="{{ __('dashboard.close') }}"></button>
                    </div>
                @endif

                <div class="card-header">{{ __('dashboard.newsletters_via_mailchimp') }}</div>

                <div class="card-body">
                    <div class="basic-data-table">
                        <div class="table-responsive">
                            <table id="basic-data-table" class="table nowrap" style="width:100%">
                                <thead>
                                <tr>
                                    <th scope="col">{{ __('dashboard.email') }}</th>
                                    <th scope="col">{{ __('dashboard.subscribed_at') }}</th>
                                    <x-row-actions-header />
                                </tr>
                                </thead>
                                <tbody>
                                @foreach($newsletters as $newsletter)
                                    <tr>
                                        <td>{{ $newsletter->email }}</td>
                                        <td>{{ $newsletter->isSubscribed() ? Carbon::parse($newsletter->subscribed_at ?? $newsletter->created_at)->diffForHumans() : __('Pending confirmation') }}</td>
                                        <td class="row-actions-col">
                                            <x-row-actions>
                                                <x-row-action-form icon="delete"
                                                                   :action="route('admin.newsletters.delete', ['id' => $newsletter->id, 'locale' => app()->getLocale()])"
                                                                   :confirm="__('dashboard.are_you_sure_to_delete')">{{ __('dashboard.delete') }}</x-row-action-form>
                                            </x-row-actions>
                                        </td>
                                    </tr>
                                @endforeach
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-md-6">
            <div class="card">
                <div class="card-header">{{ __('dashboard.update_mailchimp_settings') }}</div>
                <div class="card-body">
                    <form action="{{ route('update.env.mailchimp', ['locale' => app()->getLocale()]) }}" method="POST">
                        @csrf

                        @include('admin.partials.form-lock-actions', ['saveLabel' => __('dashboard.update_mailchimp'), 'sticky' => false])
                        <div class="form-group">
                            <label for="api_key">{{ __('dashboard.api_key') }}</label>
                            <input type="text" class="form-control" id="api_key" name="api_key" value="********" required>
                        </div>
                        <div class="form-group">
                            <label for="list_id">{{ __('dashboard.list_id') }}</label>
                            <input type="text" class="form-control" id="list_id" name="list_id" value="********" required>
                        </div>
                        <div class="form-group">
                            <label for="endpoint">{{ __('dashboard.server_url') }}</label>
                            <input type="text" class="form-control" id="endpoint" name="endpoint" value="********" required>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
@endsection
