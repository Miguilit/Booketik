@php
    // R3B8M: scoped admin labels, never overriding shared application locale files.
    $beLocale = strtolower(substr(app()->getLocale(), 0, 2));
    $beLabels = [
        'fr' => [
            'Actual organizer' => 'Organisateur réel',
            'Approve editorial draft' => 'Approuver le brouillon',
            'Approved' => 'Approuvé',
            'Attribution text' => 'Mention de la source',
            'Back' => 'Retour',
            'Check the event relevance, details, organizer and source. External events have no Booketik ticketing.' => 'Vérifiez la pertinence, les détails, l’organisateur et la source. Les événements externes ne disposent pas de billetterie Booketik.',
            'Draft' => 'Brouillon',
            'Editorial approval' => 'Approbation éditoriale',
            'Editorial review and publication are separate actions. The global public catalogue gate remains independent.' => 'L’examen éditorial et la publication sont deux actions distinctes. L’activation globale du catalogue public reste indépendante.',
            'Editorial status' => 'Statut éditorial',
            'Event state' => 'État de l’événement',
            'Exclude from catalogue' => 'Exclure du catalogue',
            'Excluded' => 'Exclu',
            'External ID' => 'Identifiant externe',
            'External ticketing and automatic synchronization remain disabled.' => 'La billetterie externe et la synchronisation automatique restent désactivées.',
            'I reviewed the event and authorize informational publication without Booketik ticketing.' => 'J’ai vérifié l’événement et autorise sa publication informative sans billetterie Booketik.',
            'I reviewed the event details and confirm this is relevant for the cultural catalogue.' => 'J’ai vérifié les détails de l’événement et confirme sa pertinence pour le catalogue culturel.',
            'Imported events are managed with Exclude / hide and Lift exclusion. This approval workflow is for manual editorial drafts.' => 'Les événements importés se gèrent avec Exclure / masquer et Lever l’exclusion. Cette approbation concerne uniquement les brouillons éditoriaux manuels.',
            'Imported listing: excluding hides it and prevents the importer from restoring it.' => 'Événement importé : l’exclusion le masque et empêche sa restauration automatique par l’importateur.',
            'Lift exclusion' => 'Lever l’exclusion',
            'OFF' => 'DÉSACTIVÉ',
            'ON' => 'ACTIVÉ',
            'Official event URL' => 'URL officielle de l’événement',
            'Prerequisites: enabled source, editorial approval, organizer and source attribution, future date, and no ticketing or registrations.' => 'Prérequis : source activée, approbation éditoriale, organisateur et mention de source, date future, sans billetterie ni inscriptions.',
            'Publication control' => 'Contrôle de publication',
            'Publish editorially' => 'Publier dans le catalogue',
            'Review external event' => 'Examiner un événement externe',
            'Revoke approval' => 'Révoquer l’approbation',
            'Save draft' => 'Enregistrer le brouillon',
            'Saving changes resets editorial approval. Ticketing remains disabled.' => 'L’enregistrement des modifications annule l’approbation éditoriale. La billetterie reste désactivée.',
            'Source' => 'Source',
            'Source event URL' => 'URL de l’événement chez la source',
            'Start date / local time' => 'Date de début / heure locale',
            'Summary' => 'Résumé',
            'Syndicated' => 'Importé',
            'The public gate is' => 'Le catalogue public est',
            'This imported event is excluded and protected from the automatic importer.' => 'Cet événement importé est exclu et protégé contre toute réimportation automatique.',
            'This listing is published editorially. Editing is available after withdrawal.' => 'Cet événement est publié. Retirez-le avant de le modifier.',
            'Timezone' => 'Fuseau horaire',
            'Title' => 'Titre',
            'Withdraw external event' => 'Retirer l’événement externe',
        ],
        'nl' => [
            'Actual organizer' => 'Werkelijke organisator',
            'Approve editorial draft' => 'Redactioneel concept goedkeuren',
            'Approved' => 'Goedgekeurd',
            'Attribution text' => 'Bronvermelding',
            'Back' => 'Terug',
            'Check the event relevance, details, organizer and source. External events have no Booketik ticketing.' => 'Controleer relevantie, details, organisator en bron. Externe evenementen hebben geen Booketik-ticketverkoop.',
            'Draft' => 'Concept',
            'Editorial approval' => 'Redactionele goedkeuring',
            'Editorial review and publication are separate actions. The global public catalogue gate remains independent.' => 'Redactionele beoordeling en publicatie zijn afzonderlijke acties. De algemene schakelaar voor de openbare catalogus blijft onafhankelijk.',
            'Editorial status' => 'Redactionele status',
            'Event state' => 'Evenementstatus',
            'Exclude from catalogue' => 'Uitsluiten van catalogus',
            'Excluded' => 'Uitgesloten',
            'External ID' => 'Externe ID',
            'External ticketing and automatic synchronization remain disabled.' => 'Externe ticketverkoop en automatische synchronisatie blijven uitgeschakeld.',
            'I reviewed the event and authorize informational publication without Booketik ticketing.' => 'Ik heb het evenement beoordeeld en geef toestemming voor informatieve publicatie zonder Booketik-ticketverkoop.',
            'I reviewed the event details and confirm this is relevant for the cultural catalogue.' => 'Ik heb de details gecontroleerd en bevestig dat dit relevant is voor de culturele catalogus.',
            'Imported events are managed with Exclude / hide and Lift exclusion. This approval workflow is for manual editorial drafts.' => 'Geïmporteerde evenementen worden beheerd met Uitsluiten / verbergen en Uitsluiting opheffen. Deze goedkeuring is alleen voor handmatige redactionele concepten.',
            'Imported listing: excluding hides it and prevents the importer from restoring it.' => 'Geïmporteerd evenement: uitsluiten verbergt het en voorkomt dat de import het herstelt.',
            'Lift exclusion' => 'Uitsluiting opheffen',
            'OFF' => 'UIT',
            'ON' => 'AAN',
            'Official event URL' => 'Officiële evenement-URL',
            'Prerequisites: enabled source, editorial approval, organizer and source attribution, future date, and no ticketing or registrations.' => 'Vereisten: actieve bron, redactionele goedkeuring, organisator en bronvermelding, toekomstige datum en geen ticketverkoop of inschrijvingen.',
            'Publication control' => 'Publicatiebeheer',
            'Publish editorially' => 'Redactioneel publiceren',
            'Review external event' => 'Extern evenement beoordelen',
            'Revoke approval' => 'Goedkeuring intrekken',
            'Save draft' => 'Concept opslaan',
            'Saving changes resets editorial approval. Ticketing remains disabled.' => 'Wijzigingen opslaan trekt de redactionele goedkeuring in. Ticketverkoop blijft uitgeschakeld.',
            'Source' => 'Bron',
            'Source event URL' => 'Evenement-URL bij de bron',
            'Start date / local time' => 'Startdatum / lokale tijd',
            'Summary' => 'Samenvatting',
            'Syndicated' => 'Geïmporteerd',
            'The public gate is' => 'De openbare catalogus is',
            'This imported event is excluded and protected from the automatic importer.' => 'Dit geïmporteerde evenement is uitgesloten en beschermd tegen automatische herimport.',
            'This listing is published editorially. Editing is available after withdrawal.' => 'Dit evenement is gepubliceerd. Trek het eerst in om het te bewerken.',
            'Timezone' => 'Tijdzone',
            'Title' => 'Titel',
            'Withdraw external event' => 'Extern evenement intrekken',
        ],
    ];
    $beLabels['fr'] += [
        'Keep the published event visible while you prepare a revision. Changes take effect only after explicit approval.' => 'L’événement reste visible pendant la préparation. Les modifications ne sont appliquées qu’après validation.',
        'Pending changes' => 'Modifications en attente',
        'Review and apply changes' => 'Valider et appliquer les modifications',
        'I reviewed these changes and want to update the published event.' => 'J’ai vérifié les modifications et souhaite mettre à jour l’événement publié.',
        'Discard pending changes' => 'Abandonner les modifications',
        'Save proposed changes' => 'Enregistrer les modifications proposées',
        'Pending review; the public version has not changed.' => 'En attente de validation ; la version publique est inchangée.',
    ];
    $beLabels['nl'] += [
        'Keep the published event visible while you prepare a revision. Changes take effect only after explicit approval.' => 'Het evenement blijft zichtbaar tijdens de bewerking. Wijzigingen worden pas na goedkeuring toegepast.',
        'Pending changes' => 'Wijzigingen in afwachting',
        'Review and apply changes' => 'Wijzigingen goedkeuren en toepassen',
        'I reviewed these changes and want to update the published event.' => 'Ik heb deze wijzigingen nagekeken en wil het gepubliceerde evenement bijwerken.',
        'Discard pending changes' => 'Wijzigingen verwerpen',
        'Save proposed changes' => 'Voorgestelde wijzigingen opslaan',
        'Pending review; the public version has not changed.' => 'Wacht op goedkeuring; de openbare versie is niet gewijzigd.',
    ];
    $bePending = $pendingEdit?->fields ?? [];
    $beT = static fn (string $label): string => $beLabels[$beLocale][$label] ?? __($label);
@endphp
@extends('admin.admin_master')
@section('admin')
@include('admin.partials.flash')
@if($listing->editorial_status === 'syndicated')
<div class="alert alert-info">{{ $beT('Imported listing: excluding hides it and prevents the importer from restoring it.') }}
<form class="mt-2" method="POST" action="{{ route('admin.external-events.listings.exclude',['locale'=>app()->getLocale(),'listing'=>$listing->id]) }}">@csrf<button type="submit" class="btn btn-sm btn-outline-danger">{{ $beT('Exclude from catalogue') }}</button></form></div>
@elseif($listing->editorial_status === 'excluded')
<div class="alert alert-warning">{{ $beT('This imported event is excluded and protected from the automatic importer.') }}
<form class="mt-2" method="POST" action="{{ route('admin.external-events.listings.restore',['locale'=>app()->getLocale(),'listing'=>$listing->id]) }}">@csrf<button type="submit" class="btn btn-sm btn-outline-secondary">{{ $beT('Lift exclusion') }}</button></form></div>
@endif
<div class="card card-default mb-4">
    <div class="card-header card-header-border-bottom d-flex align-items-center justify-content-between">
        <h2 class="mb-0">{{ $beT('Review external event') }}</h2>
        <a class="btn btn-sm btn-secondary" href="{{ route('admin.external-events.index',['locale'=>app()->getLocale()]) }}">{{ $beT('Back') }}</a>
    </div>
    <div class="card-body">
        <div class="alert alert-warning">{{ $beT('Editorial review and publication are separate actions. The global public catalogue gate remains independent.') }}</div>
        <p>{{ $beT('Source') }}: <strong>{{ $listing->source?->name }}</strong> · {{ $beT('External ID') }}: <code>{{ $listing->external_id }}</code></p>
        <p>{{ $beT('Editorial status') }}: {{ $beT(ucfirst($listing->editorial_status)) }} · {{ $beT('Event state') }}: {{ $listing->event?->status?->value }}</p>
        @if($listing->event?->status === \App\Enums\EventStatus::Published)
            <div class="alert alert-info">{{ $beT('Keep the published event visible while you prepare a revision. Changes take effect only after explicit approval.') }}</div>
        @endif
        <form method="POST" action="{{ route('admin.external-events.listings.update',['locale'=>app()->getLocale(),'listing'=>$listing->id]) }}">
            @csrf @method('PUT')
            <div class="row">
                <div class="col-lg-8 mb-3"><label class="form-label">{{ $beT('Title') }}</label><input class="form-control" name="title" required maxlength="255" value="{{ old('title',$bePending['title'] ?? $listing->event?->title) }}"></div>
                <div class="col-lg-4 mb-3"><label class="form-label">{{ $beT('Actual organizer') }}</label><input class="form-control" name="organizer_name" value="{{ old('organizer_name',$bePending['organizer_name'] ?? $listing->organizer_name) }}"></div>
                <div class="col-12 mb-3"><label class="form-label">{{ $beT('Summary') }}</label><textarea class="form-control" rows="3" name="summary" maxlength="1000">{{ old('summary',$bePending['summary'] ?? $listing->event?->summary) }}</textarea></div>
                <div class="col-lg-6 mb-3"><label class="form-label">{{ $beT('Start date / local time') }}</label><input class="form-control" type="datetime-local" name="starts_at" required value="{{ old('starts_at',$bePending['starts_at'] ?? $listing->event?->starts_at?->timezone($listing->event->timezone)->format('Y-m-d\TH:i')) }}"></div>
                <div class="col-lg-6 mb-3"><label class="form-label">{{ $beT('Timezone') }}</label><input class="form-control" name="timezone" required value="{{ old('timezone',$bePending['timezone'] ?? $listing->event?->timezone) }}"></div>
                <div class="col-12 mb-3"><label class="form-label">{{ $beT('Official event URL') }}</label><input class="form-control" type="url" name="official_url" required value="{{ old('official_url',$bePending['official_url'] ?? $listing->official_url) }}"></div>
                <div class="col-12 mb-3"><label class="form-label">{{ $beT('Source event URL') }}</label><input class="form-control" type="url" name="source_url" value="{{ old('source_url',$bePending['source_url'] ?? $listing->source_url) }}"></div>
                <div class="col-12 mb-3"><label class="form-label">{{ $beT('Attribution text') }}</label><textarea class="form-control" rows="2" name="attribution_text">{{ old('attribution_text',$bePending['attribution_text'] ?? $listing->attribution_text) }}</textarea></div>
            </div>
            <p class="small text-muted">{{ $listing->event?->status === \App\Enums\EventStatus::Published ? $beT('Pending review; the public version has not changed.') : $beT('Saving changes resets editorial approval. Ticketing remains disabled.') }}</p>
            <button class="btn btn-primary" type="submit">{{ $listing->event?->status === \App\Enums\EventStatus::Published ? $beT('Save proposed changes') : $beT('Save draft') }}</button>
        </form>
    </div>
</div>
<div class="card card-default">
    <div class="card-header card-header-border-bottom"><h3>{{ $beT('Editorial approval') }}</h3></div>
    <div class="card-body">
        <p class="small text-muted">{{ $beT('Check the event relevance, details, organizer and source. External events have no Booketik ticketing.') }}</p>
        @if($listing->event?->status === \App\Enums\EventStatus::Published && $pendingEdit)
            <div class="alert alert-info">{{ $beT('Pending changes') }} — {{ $beT('Pending review; the public version has not changed.') }}</div>
            <form method="POST" action="{{ route('admin.external-events.listings.revision.apply',['locale'=>app()->getLocale(),'listing'=>$listing->id]) }}">@csrf
                <label class="d-block mb-3"><input type="checkbox" name="review_confirmed" value="1" required> {{ $beT('I reviewed these changes and want to update the published event.') }}</label>
                <button type="submit" class="btn btn-success">{{ $beT('Review and apply changes') }}</button>
            </form>
            <form class="mt-2" method="POST" action="{{ route('admin.external-events.listings.revision.cancel',['locale'=>app()->getLocale(),'listing'=>$listing->id]) }}">@csrf
                <button type="submit" class="btn btn-outline-secondary">{{ $beT('Discard pending changes') }}</button>
            </form>
        @elseif($listing->editorial_status === 'excluded' || $listing->editorial_status === 'syndicated')
            <p class="small text-muted">{{ $beT('Imported events are managed with Exclude / hide and Lift exclusion. This approval workflow is for manual editorial drafts.') }}</p>
        @elseif($listing->editorial_status === 'approved')
            <form method="POST" action="{{ route('admin.external-events.listings.revoke',['locale'=>app()->getLocale(),'listing'=>$listing->id]) }}">@csrf
                <button class="btn btn-outline-danger" type="submit">{{ $beT('Revoke approval') }}</button>
            </form>
        @else
            <form method="POST" action="{{ route('admin.external-events.listings.approve',['locale'=>app()->getLocale(),'listing'=>$listing->id]) }}">@csrf
                <label class="d-block mb-3"><input type="checkbox" name="editorial_confirmed" value="1" required> {{ $beT('I reviewed the event details and confirm this is relevant for the cultural catalogue.') }}</label>
                <button class="btn btn-success" type="submit" @disabled(!$listing->source?->enabled || $listing->event?->status !== \App\Enums\EventStatus::Draft)>{{ $beT('Approve editorial draft') }}</button>
            </form>
        @endif
    </div>
</div>
<div class="card card-default mt-4">
    <div class="card-header card-header-border-bottom"><h3>{{ $beT('Publication control') }}</h3></div>
    <div class="card-body">
        <p>{{ $beT('The public gate is') }} <strong>{{ $publicEnabled ? $beT('ON') : $beT('OFF') }}</strong>. {{ $beT('External ticketing and automatic synchronization remain disabled.') }}</p>
        @if($listing->event?->status === \App\Enums\EventStatus::Published)
            <form method="POST" action="{{ route('admin.external-events.listings.withdraw',['locale'=>app()->getLocale(),'listing'=>$listing->id]) }}">
                @csrf
                <button type="submit" class="btn btn-outline-danger">{{ $beT('Withdraw external event') }}</button>
            </form>
        @else
            <p class="small text-muted">{{ $beT('Prerequisites: enabled source, editorial approval, organizer and source attribution, future date, and no ticketing or registrations.') }}</p>
            <form method="POST" action="{{ route('admin.external-events.listings.publish',['locale'=>app()->getLocale(),'listing'=>$listing->id]) }}">
                @csrf
                <label class="d-block mb-2"><input type="checkbox" name="publish_confirmed" value="1" required> {{ $beT('I reviewed the event and authorize informational publication without Booketik ticketing.') }}</label>
                <button type="submit" class="btn btn-primary" @disabled($listing->editorial_status !== 'approved')>{{ $beT('Publish editorially') }}</button>
            </form>
        @endif
    </div>
</div>
@endsection
