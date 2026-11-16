@extends('admin.admin_master')
@section('admin')
@php
  $nl = app()->getLocale() === 'nl';
  $s = fn($fr,$nlText) => $nl ? $nlText : $fr;
  $statusLabels = ['pending'=>$s('En attente','In afwachting'), 'in_review'=>$s('En examen','In behandeling'), 'closed'=>$s('Clôturée','Gesloten'), 'rejected'=>$s('Refusée','Afgewezen')];
  $actionLabels = ['start_review'=>$s('Prendre en examen','In behandeling nemen'), 'approve_in_principle'=>$s('Accepter la demande (sans activer la billetterie)','Aanvraag aanvaarden (zonder ticketverkoop)'), 'close_quote'=>$s('Clôturer le devis (sans paiement)','Offerte afsluiten (zonder betaling)'), 'reject'=>$s('Refuser','Afwijzen')];
@endphp
<div class="container-fluid py-4">
  <div class="d-flex justify-content-between align-items-start flex-wrap gap-3 mb-4">
    <div>
      <h2 class="mb-1">BOOKETIK · {{ $s('Demandes commerciales','Commerciële aanvragen') }}</h2>
      <p class="text-muted mb-0">{{ $s('Découverte et devis · traitement manuel audité','Ontdekking en offertes · gecontroleerde handmatige beoordeling') }}</p>
    </div>
    <a class="btn btn-outline-secondary" href="{{ route('admin.solutions.edit', ['locale'=>app()->getLocale()]) }}">{{ $s('Retour à Solutions','Terug naar Solutions') }}</a>
  </div>
  @if(session('success'))<div class="alert alert-success">{{ session('success') }}</div>@endif
  @if($errors->any())<div class="alert alert-danger">{{ $errors->first() }}</div>@endif
  <form class="card p-3 mb-3" method="GET" action="{{ route('admin.solutions.inquiries.index', ['locale'=>app()->getLocale()]) }}">
    <div class="row g-2 align-items-end">
      <div class="col-sm-5"><label class="form-label" for="bks-inquiry-kind">{{ $s('Type','Type') }}</label>
        <select id="bks-inquiry-kind" name="kind" class="form-select">
          <option value="all" @selected($kind==='all')>{{ $s('Tous','Alle') }}</option>
          <option value="discovery_review" @selected($kind==='discovery_review')>{{ $s('Découverte','Ontdekking') }}</option>
          <option value="quote" @selected($kind==='quote')>{{ $s('Devis','Offerte') }}</option>
        </select></div>
      <div class="col-sm-5"><label class="form-label" for="bks-inquiry-status">{{ $s('Statut','Status') }}</label>
        <select id="bks-inquiry-status" name="status" class="form-select">
          <option value="all" @selected($status==='all')>{{ $s('Tous','Alle') }}</option>
          @foreach($statusLabels as $value=>$label)<option value="{{ $value }}" @selected($status===$value)>{{ $label }}</option>@endforeach
        </select></div>
      <div class="col-sm-2"><button type="submit" class="btn btn-success w-100">{{ $s('Filtrer','Filteren') }}</button></div>
    </div>
  </form>
  <div class="small text-muted mb-2">{{ $items->total() }} {{ $s('demande(s)','aanvra(a)g(en)') }}</div>
  @forelse($items as $item)
    <article class="card p-3 mb-3">
      <div class="d-flex flex-wrap justify-content-between gap-2 align-items-center mb-2">
        <div><strong>{{ $item->kind === 'discovery_review' ? $s('Découverte','Ontdekking') : $s('Devis','Offerte') }}</strong>
          <span class="badge bg-secondary ms-2">{{ $statusLabels[$item->status] ?? $item->status }}</span></div>
        <small class="text-muted">{{ optional($item->created_at)->format('d/m/Y H:i') }}</small>
      </div>
      <dl class="row mb-1 small">
        <dt class="col-sm-3">{{ $s('Organisateur','Organisator') }}</dt><dd class="col-sm-9 text-break">{{ $item->organizer_id }}</dd>
        <dt class="col-sm-3">{{ $s('Demandeur (ID)','Aanvrager (ID)') }}</dt><dd class="col-sm-9">{{ $item->requested_by }}</dd>
        @if($item->event_id)<dt class="col-sm-3">{{ $s('Événement','Evenement') }}</dt><dd class="col-sm-9 text-break">{{ $item->event_id }}</dd>@endif
        @if($item->offer_code)<dt class="col-sm-3">{{ $s('Offre','Aanbod') }}</dt><dd class="col-sm-9">{{ $item->offer_code }}</dd>@endif
      </dl>
      @if($item->message)<div class="border rounded p-3 mt-2" style="white-space:pre-wrap;overflow-wrap:anywhere">{{ $item->message }}</div>@endif
      @if($decisionsEnabled)
        @php
          $allowed = $item->status === 'pending' ? ['start_review','reject'] : ($item->status === 'in_review' ? [$item->kind === 'quote' ? 'close_quote' : 'approve_in_principle','reject'] : []);
        @endphp
        @if(count($allowed))
          <form class="border rounded p-3 mt-3" method="POST" action="{{ route('admin.solutions.inquiries.decision', ['locale'=>app()->getLocale(),'inquiry'=>$item->id]) }}">
            @csrf
            <input type="hidden" name="expected_status" value="{{ $item->status }}">
            <input type="hidden" name="expected_updated_at" value="{{ $item->updated_at?->format('Y-m-d H:i:s') }}">
            <label class="form-label" for="act-{{ $item->id }}">{{ $s('Décision','Beslissing') }}</label>
            <select id="act-{{ $item->id }}" class="form-select mb-2" name="decision_action" required>
              @foreach($allowed as $act)<option value="{{ $act }}">{{ $actionLabels[$act] }}</option>@endforeach
            </select>
            <label class="form-label" for="reason-{{ $item->id }}">{{ $s('Motif (obligatoire)','Motivering (verplicht)') }}</label>
            <textarea id="reason-{{ $item->id }}" class="form-control mb-2" name="reason" required minlength="8" maxlength="2000" rows="2"></textarea>
            <button class="btn btn-primary" type="submit">{{ $s('Enregistrer la décision','Beslissing opslaan') }}</button>
            <p class="small text-muted mt-2 mb-0">{{ $s('L’acceptation de la demande ne crée ni droit de billetterie ni paiement.','Aanvaarding van de aanvraag verleent geen ticketrecht en start geen betaling.') }}</p>
          </form>
        @endif
        @if(($history[$item->id] ?? collect())->isNotEmpty())
          <div class="mt-3 small"><strong>{{ $s('Historique des décisions','Beslissingsgeschiedenis') }}</strong>
            <ul class="mb-0 mt-2">
              @foreach($history[$item->id] as $decision)
                <li>{{ $decision->created_at }} — {{ $actionLabels[$decision->action] ?? $decision->action }}
                  ({{ $decision->from_status }} → {{ $decision->to_status }}) — {{ $s('administrateur','beheerder') }} #{{ $decision->acted_by }}:
                  {{ $decision->reason }}</li>
              @endforeach
            </ul>
          </div>
        @endif
      @endif
    </article>
  @empty
    <div class="card p-4 text-center text-muted">{{ $s('Aucune demande pour ces filtres.','Geen aanvragen voor deze filters.') }}</div>
  @endforelse
  <div class="mt-3">{{ $items->links() }}</div>
</div>
@endsection
