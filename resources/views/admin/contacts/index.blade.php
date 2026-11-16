@extends('admin.admin_master')
@section('admin')
    <div class="row">
        <div class="col-md-10">
            <div class="card">

                @if(session('success'))
                    <div class="alert alert-success alert-dismissible fade show" role="alert">
                        <strong>{{ session('success') }}</strong>
                        <button type="button" class="btn-close" data-bs-dismiss="alert"
                                aria-label="{{ __('dashboard.close') }}"></button>
                    </div>
                @endif

                <div class="card-header">{{ __('dashboard.contact_messages') }}</div>

                <div class="card-body">
                    <div class="basic-data-table">
                        <div class="table-responsive">
                            <table id="basic-data-table" class="table nowrap" style="width:100%">
                                <thead>
                                <tr>
                                    <th scope="col">{{ __('dashboard.name') }}</th>
                                    <th scope="col">{{ __('dashboard.email') }}</th>
                                    <th scope="col">{{ __('dashboard.message') }}</th>
                                    <x-row-actions-header />
                                </tr>
                                </thead>
                                <tbody>

                                @foreach($contactMessages as $contactMessage)
                                    <tr>
                                        <td>{{ $contactMessage->name }}</td>
                                        <td>{{ $contactMessage->email }}</td>
                                        <td>{{ $contactMessage->message }}</td>
                                        <td class="row-actions-col">
                                            <x-row-actions>
                                                <x-row-action icon="email-outline" :href="'mailto:'.$contactMessage->email">{{ __('Reply by email') }}</x-row-action>
                                                <x-row-actions-divider />
                                                <x-row-action-form icon="delete"
                                                                   :action="route('admin.contactMessages.delete', ['id' => $contactMessage->id, 'locale' => app()->getLocale()])"
                                                                   :confirm="__('dashboard.confirm_delete')">{{ __('dashboard.delete') }}</x-row-action-form>
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
    </div>
@endsection
