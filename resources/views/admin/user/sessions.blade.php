@extends('admin.admin_master')

@section('admin')
    <div class="row">
        <div class="col-12">
            <div class="card card-default">

                @if(session('success'))
                    <div class="alert alert-success alert-dismissible fade show" role="alert">
                        <strong>{{ session('success') }}</strong>
                        <button type="button" class="btn-close" data-bs-dismiss="alert"
                                aria-label="{{ __('dashboard.close') }}"></button>
                    </div>
                @endif

                <div class="card-header card-header-border-bottom d-flex justify-content-between">
                    <h2>{{ __('dashboard.sessions') }}</h2>
                </div>

                <div class="card-body">
                    <div class="basic-data-table">
                        <div class="table-responsive">
                            <table id="basic-data-table" class="table nowrap" style="width:100%">
                                <thead>
                                <tr>
                                    <th>{{ __('dashboard.id') }}</th>
                                    <th>{{ __('dashboard.ip_address') }}</th>
                                    <th>{{ __('dashboard.user_agent') }}</th>
                                    <th>{{ __('dashboard.last_activity') }}</th>
                                    <x-row-actions-header />
                                </tr>
                                </thead>

                                <tbody>
                                @foreach($sessions as $session)
                                    <tr>
                                        <td>{{ $session->user_id }}</td>
                                        <td>{{ $session->ip_address }}</td>
                                        <td>{{ $session->user_agent }}</td>
                                        <td>
                                            @if($session->last_activity == NULL)
                                                <span class="text-danger">{{ __('dashboard.no_activity') }}</span>
                                            @else
                                                {{ \Carbon\Carbon::parse($session->last_activity)->diffForHumans() }}
                                            @endif
                                        </td>
                                        <td class="row-actions-col">
                                            <x-row-actions>
                                                <x-row-action-form icon="delete"
                                                                   :action="route('admin.sessions.delete', ['id' => $session->id, 'locale' => app()->getLocale()])"
                                                                   :confirm="__('dashboard.confirm_delete')">{{ __('dashboard.delete') }}</x-row-action-form>
                                            </x-row-actions>
                                        </td>
                                    </tr>
                                @endforeach
                                </tbody>
                            </table>
                        </div>

                        {{ $sessions->links() }}
                    </div>
                </div>
            </div>
        </div>
    </div>
@endsection
