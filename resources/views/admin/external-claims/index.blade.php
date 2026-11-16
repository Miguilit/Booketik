@extends('admin.admin_master')

@section('admin')
@php
    // Scoped translations: Eventgoo's active translation loader can differ from Laravel's lang/ path.
    // Do not change the global translator or any other admin pages.
    $bcLocale = strtolower(substr((string) app()->getLocale(), 0, 2));
    $bcLabels = [
        'fr' => [
            'title' => 'Revendications d’événements',
            'external_events' => 'Événements externes',
            'scope' => 'La vérification confirme uniquement le lien avec un organisateur. Elle ne transfère pas la fiche, n’active aucune billetterie, n’attribue aucune formule et ne déclenche aucun paiement.',
            'pending' => 'En attente', 'approved' => 'Approuvées', 'rejected' => 'Refusées',
            'organizer' => 'Organisateur demandeur', 'requester' => 'Demandeur',
            'status' => 'Statut', 'source' => 'Source externe', 'created' => 'Soumise le',
            'no_proof' => 'Justificatif à fournir', 'proof' => 'Voir le justificatif officiel', 'explanation' => 'Explication',
            'review_notes' => 'Notes de vérification',
            'confirmation' => 'J’ai vérifié indépendamment le lien avec cet organisateur.',
            'approve' => 'Approuver le lien', 'rejection_reason' => 'Motif du refus',
            'reject' => 'Refuser la demande', 'review' => 'Décision de vérification',
            'none' => 'Aucune revendication pour ce statut.',
            'instructions' => 'Vérifiez les justificatifs avant toute décision. L’approbation ne change pas les événements importés.',
        ],
        'nl' => [
            'title' => 'Claims van evenementen',
            'external_events' => 'Externe evenementen',
            'scope' => 'Deze controle bevestigt alleen de band met een organisator. Ze draagt het evenement niet over, activeert geen ticketverkoop, kent geen abonnement toe en start geen betaling.',
            'pending' => 'In behandeling', 'approved' => 'Goedgekeurd', 'rejected' => 'Afgewezen',
            'organizer' => 'Aanvragende organisator', 'requester' => 'Aanvrager',
            'status' => 'Status', 'source' => 'Externe bron', 'created' => 'Ingediend op',
            'no_proof' => 'Bewijsstuk ontbreekt', 'proof' => 'Officieel bewijs bekijken', 'explanation' => 'Toelichting',
            'review_notes' => 'Verificatienotities',
            'confirmation' => 'Ik heb de band met deze organisator onafhankelijk gecontroleerd.',
            'approve' => 'Band goedkeuren', 'rejection_reason' => 'Reden van afwijzing',
            'reject' => 'Aanvraag afwijzen', 'review' => 'Verificatiebeslissing',
            'none' => 'Geen claims met deze status.',
            'instructions' => 'Controleer de bewijsstukken voordat je beslist. Goedkeuring wijzigt geen geïmporteerde evenementen.',
        ],
        'en' => [
            'title' => 'Event ownership claims',
            'external_events' => 'External events',
            'scope' => 'Verification only confirms the connection to an organizer. It does not transfer the listing, enable ticketing, assign a plan, or start payments.',
            'pending' => 'Pending', 'approved' => 'Approved', 'rejected' => 'Rejected',
            'organizer' => 'Claiming organizer', 'requester' => 'Requester',
            'status' => 'Status', 'source' => 'External source', 'created' => 'Submitted on',
            'no_proof' => 'Evidence still required', 'proof' => 'View official evidence', 'explanation' => 'Explanation',
            'review_notes' => 'Verification notes',
            'confirmation' => 'I independently checked the connection to this organizer.',
            'approve' => 'Approve connection', 'rejection_reason' => 'Reason for rejection',
            'reject' => 'Reject claim', 'review' => 'Verification decision',
            'none' => 'No claims with this status.',
            'instructions' => 'Check the evidence before deciding. Approval does not modify imported events.',
        ],
    ];
    $bcT = fn (string $key): string => $bcLabels[$bcLocale][$key] ?? $bcLabels['en'][$key] ?? $key;
    $bcStatusStyle = ['pending' => 'warning', 'approved' => 'success', 'rejected' => 'danger'];
@endphp

<div class="d-flex flex-wrap align-items-center justify-content-between mb-4" style="gap:12px">
    <div>
        <h2 class="mb-1">{{ $bcT('title') }}</h2>
        <a class="text-muted" href="{{ route('admin.external-events.index', ['locale' => $locale]) }}">
            <i class="mdi mdi-arrow-left" aria-hidden="true"></i> {{ $bcT('external_events') }}
        </a>
    </div>
</div>

<div class="alert alert-info" role="note">{{ $bcT('scope') }}</div>

@if(session('success'))
    <div class="alert alert-success" role="status">{{ session('success') }}</div>
@endif
@if($errors->any())
    <div class="alert alert-danger" role="alert">
        <ul class="mb-0">@foreach($errors->all() as $message)<li>{{ $message }}</li>@endforeach</ul>
    </div>
@endif

<div class="card card-default">
    <div class="card-header card-header-border-bottom">
        <div class="d-flex flex-wrap align-items-center justify-content-between" style="gap:12px">
            <h2 class="mb-0">{{ $bcT($status) }}</h2>
            <div class="d-flex flex-wrap" style="gap:8px" role="group" aria-label="{{ $bcT('status') }}">
                @foreach(['pending', 'approved', 'rejected'] as $item)
                    <a href="{{ route('admin.external-claims.index', ['locale' => $locale, 'status' => $item]) }}"
                       class="btn btn-sm {{ $status === $item ? 'btn-primary' : 'btn-outline-secondary' }}"
                       @if($status === $item) aria-current="page" @endif>{{ $bcT($item) }}</a>
                @endforeach
            </div>
        </div>
    </div>
    <div class="card-body">
        @if($status === 'pending')
            <p class="text-muted small mb-4">{{ $bcT('instructions') }}</p>
        @endif
        @forelse($claims as $claim)
            <div class="card mb-3" style="border:1px solid #dee2e6">
                <div class="card-body">
                    <div class="d-flex flex-wrap justify-content-between align-items-start mb-3" style="gap:10px">
                        <div style="min-width:0;overflow-wrap:anywhere">
                            <h3 class="h5 mb-1">{{ $claim->listing?->event?->title ?? '—' }}</h3>
                            <div class="text-muted small">{{ $bcT('source') }}: {{ $claim->listing?->source?->name ?? '—' }}</div>
                        </div>
                        <span class="badge badge-{{ $bcStatusStyle[$claim->status] ?? 'secondary' }}">{{ $bcT($claim->status) }}</span>
                    </div>
                    <div class="row mb-3">
                        <div class="col-md-6 mb-2">
                            <div class="text-muted small">{{ $bcT('organizer') }}</div>
                            <strong>{{ $claim->organizer?->name ?? '—' }}</strong>
                        </div>
                        <div class="col-md-6 mb-2" style="overflow-wrap:anywhere">
                            <div class="text-muted small">{{ $bcT('requester') }}</div>
                            <strong>{{ $claim->requester?->email ?? '—' }}</strong>
                        </div>
                        <div class="col-md-6 mb-2">
                            <div class="text-muted small">{{ $bcT('created') }}</div>
                            <span>{{ $claim->created_at?->format('d/m/Y H:i') ?? '—' }}</span>
                        </div>
                    </div>
                    <p style="overflow-wrap:anywhere"><strong>{{ $bcT('explanation') }}:</strong> {{ $claim->verification_note }}</p>
                    @if($claim->verification_url)
                        <p><a href="{{ $claim->verification_url }}" target="_blank" rel="noopener noreferrer nofollow" class="btn btn-sm btn-outline-primary">
                            <i class="mdi mdi-open-in-new" aria-hidden="true"></i> {{ $bcT('proof') }}
                        </a></p>
                    @else
                        <p class="text-warning small">{{ $bcT('no_proof') }}</p>
                    @endif
                    @if($claim->status === 'pending')
                        <div class="row">
                            <div class="col-lg-6 mb-3">
                                <form method="POST" action="{{ route('admin.external-claims.approve', ['locale' => $locale, 'claim' => $claim->id]) }}">
                                    @csrf
                                    <label class="form-label" for="approve-note-{{ $claim->id }}">{{ $bcT('review_notes') }}</label>
                                    <textarea class="form-control" id="approve-note-{{ $claim->id }}" name="review_note" rows="3" minlength="10" maxlength="2000" required></textarea>
                                    <div class="form-check mt-3 mb-3">
                                        <input class="form-check-input" type="checkbox" name="review_confirmed" value="1" id="confirm-{{ $claim->id }}" required>
                                        <label class="form-check-label" for="confirm-{{ $claim->id }}">{{ $bcT('confirmation') }}</label>
                                    </div>
                                    <button class="btn btn-success" type="submit">{{ $bcT('approve') }}</button>
                                </form>
                            </div>
                            <div class="col-lg-6 mb-3">
                                <form method="POST" action="{{ route('admin.external-claims.reject', ['locale' => $locale, 'claim' => $claim->id]) }}">
                                    @csrf
                                    <label class="form-label" for="reject-note-{{ $claim->id }}">{{ $bcT('rejection_reason') }}</label>
                                    <textarea class="form-control" id="reject-note-{{ $claim->id }}" name="review_note" rows="3" minlength="10" maxlength="2000" required></textarea>
                                    <button class="btn btn-outline-danger mt-3" type="submit">{{ $bcT('reject') }}</button>
                                </form>
                            </div>
                        </div>
                    @else
                        <div class="alert alert-secondary mb-0" role="note"><strong>{{ $bcT('review') }}:</strong> {{ $claim->review_note ?: '—' }}</div>
                    @endif
                </div>
            </div>
        @empty
            <div class="text-center py-4 text-muted">{{ $bcT('none') }}</div>
        @endforelse
        <div class="mt-4">{{ $claims->links() }}</div>
    </div>
</div>
@endsection
