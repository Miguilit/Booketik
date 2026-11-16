@php
    // R3B8M: scoped admin labels, never overriding shared application locale files.
    $beLocale = strtolower(substr(app()->getLocale(), 0, 2));
    $beLabels = [
        'fr' => [
            'Active' => 'Actif',
            'Add event source' => 'Ajouter une source',
            'Add source' => 'Ajouter la source',
            'Agenda Brussels synchronization' => 'Synchronisation Agenda Brussels',
            'All statuses' => 'Tous les statuts',
            'Approved' => 'Approuvé',
            'Automatic synchronization' => 'Synchronisation automatique',
            'Booketik editorial owner' => 'Responsable éditorial Booketik',
            'Create an active Booketik editorial organizer in the Organizers section first.' => 'Créez d’abord un organisateur éditorial Booketik actif dans la section Organisateurs.',
            'Create draft' => 'Créer le brouillon',
            'Create external draft' => 'Créer un brouillon externe',
            'Create sources and editorial drafts. External events never sell tickets through Booketik.' => 'Créez des sources et des brouillons éditoriaux. Les événements externes ne vendent jamais de billets via Booketik.',
            'Created' => 'Créés',
            'Cycle' => 'Cycle',
            'Disabled' => 'Désactivé',
            'Draft' => 'Brouillon',
            'Edit / review' => 'Modifier / examiner',
            'Editorial' => 'Éditorial',
            'Editorial status' => 'Statut éditorial',
            'Editorial workspace' => 'Espace éditorial',
            'Enabled' => 'Activé',
            'Errors' => 'Erreurs',
            'Event import' => 'Importation des événements',
            'Event title' => 'Titre de l’événement',
            'Exclude / hide' => 'Exclure / masquer',
            'Excluded' => 'Exclu',
            'External event listings' => 'Événements externes',
            'External events' => 'Événements externes',
            'External identifier' => 'Identifiant externe',
            'External listings' => 'Événements externes',
            'Filter' => 'Filtrer',
            'GPS enrichment' => 'Enrichissement GPS',
            'Homepage HTTPS' => 'Site web HTTPS',
            'Import sources' => 'Sources d’import',
            'Last GPS run' => 'Dernière mise à jour GPS',
            'Last committed sync' => 'Dernière synchronisation enregistrée',
            'Last result' => 'Dernier résultat',
            'Lift exclusion' => 'Lever l’exclusion',
            'Listings with GPS' => 'Événements géolocalisés',
            'Local start date' => 'Date locale de début',
            'Name' => 'Nom',
            'New sources start disabled. No provider request is made.' => 'Les nouvelles sources sont désactivées par défaut. Aucune requête fournisseur n’est effectuée.',
            'Next API page' => 'Prochaine page API',
            'No automatic import configured for this source.' => 'Aucun import automatique configuré pour cette source.',
            'No matching external events.' => 'Aucun événement ne correspond à la recherche.',
            'No source yet.' => 'Aucune source pour le moment.',
            'Not yet run' => 'Pas encore exécuté',
            'Official event URL (HTTPS)' => 'URL officielle de l’événement (HTTPS)',
            'Official venue GPS' => 'GPS des lieux officiels',
            'Pause import' => 'Suspendre l’import',
            'Paused' => 'En pause',
            'Provider' => 'Fournisseur',
            'Public catalogue' => 'Catalogue public',
            'Publication' => 'Publication',
            'Publication is controlled per listing. The global public gate remains separate.' => 'La publication est contrôlée pour chaque événement. L’activation globale du catalogue public reste indépendante.',
            'Read-only monitoring from private Laravel logs. Missing data does not mean an error. The scheduler is managed by the existing Laravel Cron.' => 'Suivi en lecture seule depuis les journaux privés Laravel. Une donnée absente ne signifie pas une erreur. Le planificateur est géré par le cron Laravel existant.',
            'Real organizer name' => 'Nom de l’organisateur réel',
            'Reset' => 'Réinitialiser',
            'Resume import' => 'Reprendre l’import',
            'Scheduled' => 'Planifiée',
            'Search events' => 'Rechercher des événements',
            'Source' => 'Source',
            'Source disabled. Global sync settings remain independent.' => 'Source désactivée. Les paramètres globaux de synchronisation restent indépendants.',
            'Source key' => 'Identifiant de source',
            'Summary' => 'Résumé',
            'Syndicated' => 'Importé',
            'The owner is internal; the real organizer is stored separately. Ticketing is disabled and the event stays a draft.' => 'Le responsable est interne ; l’organisateur réel est enregistré séparément. La billetterie est désactivée et l’événement reste en brouillon.',
            'Timezone' => 'Fuseau horaire',
            'Title or external ID' => 'Titre ou identifiant externe',
            'Untitled event' => 'Événement sans titre',
            'Updated' => 'Mis à jour',
            'listings' => 'événements',
        ],
        'nl' => [
            'Active' => 'Actief',
            'Add event source' => 'Evenementenbron toevoegen',
            'Add source' => 'Bron toevoegen',
            'Agenda Brussels synchronization' => 'Synchronisatie Agenda Brussels',
            'All statuses' => 'Alle statussen',
            'Approved' => 'Goedgekeurd',
            'Automatic synchronization' => 'Automatische synchronisatie',
            'Booketik editorial owner' => 'Redactionele beheerder Booketik',
            'Create an active Booketik editorial organizer in the Organizers section first.' => 'Maak eerst een actieve redactionele organisator aan in de sectie Organisatoren.',
            'Create draft' => 'Concept aanmaken',
            'Create external draft' => 'Extern concept aanmaken',
            'Create sources and editorial drafts. External events never sell tickets through Booketik.' => 'Maak bronnen en redactionele concepten aan. Externe evenementen verkopen nooit tickets via Booketik.',
            'Created' => 'Aangemaakt',
            'Cycle' => 'Cyclus',
            'Disabled' => 'Uitgeschakeld',
            'Draft' => 'Concept',
            'Edit / review' => 'Bewerken / beoordelen',
            'Editorial' => 'Redactioneel',
            'Editorial status' => 'Redactionele status',
            'Editorial workspace' => 'Redactionele werkruimte',
            'Enabled' => 'Ingeschakeld',
            'Errors' => 'Fouten',
            'Event import' => 'Evenementenimport',
            'Event title' => 'Evenementtitel',
            'Exclude / hide' => 'Uitsluiten / verbergen',
            'Excluded' => 'Uitgesloten',
            'External event listings' => 'Externe evenementen',
            'External events' => 'Externe evenementen',
            'External identifier' => 'Externe identificatie',
            'External listings' => 'Externe evenementen',
            'Filter' => 'Filteren',
            'GPS enrichment' => 'GPS-aanvulling',
            'Homepage HTTPS' => 'Website HTTPS',
            'Import sources' => 'Importbronnen',
            'Last GPS run' => 'Laatste GPS-verwerking',
            'Last committed sync' => 'Laatste vastgelegde synchronisatie',
            'Last result' => 'Laatste resultaat',
            'Lift exclusion' => 'Uitsluiting opheffen',
            'Listings with GPS' => 'Evenementen met GPS',
            'Local start date' => 'Lokale startdatum',
            'Name' => 'Naam',
            'New sources start disabled. No provider request is made.' => 'Nieuwe bronnen zijn standaard uitgeschakeld. Er wordt geen verzoek naar de aanbieder verzonden.',
            'Next API page' => 'Volgende API-pagina',
            'No automatic import configured for this source.' => 'Geen automatische import voor deze bron ingesteld.',
            'No matching external events.' => 'Geen overeenkomende externe evenementen.',
            'No source yet.' => 'Nog geen bron.',
            'Not yet run' => 'Nog niet uitgevoerd',
            'Official event URL (HTTPS)' => 'Officiële evenement-URL (HTTPS)',
            'Official venue GPS' => 'GPS van officiële locaties',
            'Pause import' => 'Import pauzeren',
            'Paused' => 'Gepauzeerd',
            'Provider' => 'Aanbieder',
            'Public catalogue' => 'Openbare catalogus',
            'Publication' => 'Publicatie',
            'Publication is controlled per listing. The global public gate remains separate.' => 'Publicatie wordt per evenement beheerd. De algemene schakelaar voor de openbare catalogus blijft onafhankelijk.',
            'Read-only monitoring from private Laravel logs. Missing data does not mean an error. The scheduler is managed by the existing Laravel Cron.' => 'Alleen-lezen bewaking op basis van privé-Laravel-logs. Ontbrekende gegevens betekenen niet noodzakelijk een fout. De planning wordt beheerd door de bestaande Laravel-cron.',
            'Real organizer name' => 'Naam werkelijke organisator',
            'Reset' => 'Herstellen',
            'Resume import' => 'Import hervatten',
            'Scheduled' => 'Gepland',
            'Search events' => 'Evenementen zoeken',
            'Source' => 'Bron',
            'Source disabled. Global sync settings remain independent.' => 'Bron uitgeschakeld. Algemene synchronisatie-instellingen blijven onafhankelijk.',
            'Source key' => 'Broncode',
            'Summary' => 'Samenvatting',
            'Syndicated' => 'Geïmporteerd',
            'The owner is internal; the real organizer is stored separately. Ticketing is disabled and the event stays a draft.' => 'De beheerder is intern; de werkelijke organisator wordt afzonderlijk opgeslagen. Ticketverkoop is uitgeschakeld en het evenement blijft een concept.',
            'Timezone' => 'Tijdzone',
            'Title or external ID' => 'Titel of externe ID',
            'Untitled event' => 'Evenement zonder titel',
            'Updated' => 'Bijgewerkt',
            'listings' => 'evenementen',
        ],
    ];
    $beT = static fn (string $label): string => $beLabels[$beLocale][$label] ?? __($label);
@endphp
@extends('admin.admin_master')
@section('admin')
@include('admin.partials.flash')
{{-- R3B8D - Read-only source sync supervision. No secrets, no control buttons. --}}
@if(isset($agendaSync))
<div class="card card-default mb-4">
    <div class="card-header card-header-border-bottom d-flex align-items-center justify-content-between flex-wrap gap-2">
        <h3 class="mb-0">{{ $beT('Agenda Brussels synchronization') }}</h3>
        <span class="badge {{ $agendaSync['sync_enabled'] ? 'badge-success' : 'badge-secondary' }}">{{ $agendaSync['sync_enabled'] ? $beT('Scheduled') : $beT('Paused') }}</span>
    </div>
    <div class="card-body">
        <div class="row">
            <div class="col-lg-3 col-sm-6 mb-3"><div class="small text-muted">{{ $beT('Next API page') }}</div><strong>{{ $agendaSync['next_page'] ?? '—' }}</strong></div>
            <div class="col-lg-3 col-sm-6 mb-3"><div class="small text-muted">{{ $beT('Last committed sync') }}</div><strong>{{ $agendaSync['last_sync_at'] ?? '—' }}</strong></div>
            <div class="col-lg-3 col-sm-6 mb-3"><div class="small text-muted">{{ $beT('External listings') }}</div><strong>{{ $agendaSync['listings_total'] ?? '—' }}</strong></div>
            <div class="col-lg-3 col-sm-6 mb-3"><div class="small text-muted">{{ $beT('Listings with GPS') }}</div><strong>{{ $agendaSync['listings_with_geo'] ?? '—' }}</strong></div>
        </div>
        <div class="small text-muted mb-2">{{ $beT('GPS enrichment') }}: {{ $agendaSync['geo_auto_enabled'] ? $beT('Scheduled') : $beT('Paused') }} · {{ $beT('Last GPS run') }}: {{ $agendaSync['geo_last_at'] ?? $beT('Not yet run') }} · {{ $beT('Provider') }}: agenda.brussels · {{ $beT('Public catalogue') }}: {{ $agendaSync['public_enabled'] ? $beT('Enabled') : $beT('Disabled') }}</div>
        <div class="table-responsive">
            <table class="table table-sm mb-0"><thead><tr><th>{{ $beT('Cycle') }}</th><th>{{ $beT('Last result') }}</th><th>{{ $beT('Created') }}</th><th>{{ $beT('Updated') }}</th><th>{{ $beT('Errors') }}</th></tr></thead><tbody>
                <tr><td>{{ $beT('Event import') }}</td><td>{{ $agendaSync['sync_result'] }}</td><td>{{ $agendaSync['last_created'] ?? '—' }}</td><td>{{ $agendaSync['last_updated'] ?? '—' }}</td><td>{{ $agendaSync['sync_last_error'] ?? '—' }}</td></tr>
                <tr><td>{{ $beT('Official venue GPS') }}</td><td>{{ $agendaSync['geo_result'] }}</td><td>—</td><td>{{ $agendaSync['geo_updated'] ?? '—' }}</td><td>{{ $agendaSync['geo_last_error'] ?? '—' }}</td></tr>
            </tbody></table>
        </div>
        <p class="small text-muted mb-0 mt-2">{{ $beT('Read-only monitoring from private Laravel logs. Missing data does not mean an error. The scheduler is managed by the existing Laravel Cron.') }}</p>
    </div>
</div>
@endif
<div class="card card-default mb-4">
    <div class="card-header card-header-border-bottom d-flex justify-content-between align-items-center flex-wrap gap-2">
        <h2 class="mb-0">{{ $beT('External events') }}</h2>
        <span class="badge badge-info">{{ $beT('Editorial workspace') }}</span>
    </div>
    <div class="card-body">
        <p class="mb-2">{{ $beT('Create sources and editorial drafts. External events never sell tickets through Booketik.') }}</p>
        <div class="alert alert-warning mb-0">
            {{ $beT('Public catalogue') }}: <strong>{{ $publicEnabled ? $beT('Enabled') : $beT('Disabled') }}</strong>
            · {{ $beT('Automatic synchronization') }}: <strong>{{ $syncEnabled ? $beT('Enabled') : $beT('Disabled') }}</strong>
            · {{ $beT('Publication is controlled per listing. The global public gate remains separate.') }}
        </div>
    </div>
</div>
<div class="row mb-4">
    <div class="col-xl-5 mb-3 mb-xl-0">
        <div class="card card-default h-100">
            <div class="card-header card-header-border-bottom"><h3>{{ $beT('Add event source') }}</h3></div>
            <div class="card-body">
                <form method="POST" action="{{ route('admin.external-events.sources.store',['locale'=>app()->getLocale()]) }}">
                    @csrf
                    <div class="mb-3"><label class="form-label">{{ $beT('Source key') }}</label><input class="form-control" name="key" placeholder="agenda-brussels" maxlength="64" required value="{{ old('key') }}"></div>
                    <div class="mb-3"><label class="form-label">{{ $beT('Name') }}</label><input class="form-control" name="name" required maxlength="255" value="{{ old('name') }}"></div>
                    <div class="mb-3"><label class="form-label">{{ $beT('Homepage HTTPS') }}</label><input class="form-control" type="url" name="homepage_url" placeholder="https://" value="{{ old('homepage_url') }}"></div>
                    
                    <p class="small text-muted">{{ $beT('New sources start disabled. No provider request is made.') }}</p>
                    <button class="btn btn-primary" type="submit">{{ $beT('Add source') }}</button>
                </form>
            </div>
        </div>
    </div>
    <div class="col-xl-7">
        <div class="card card-default h-100">
            <div class="card-header card-header-border-bottom"><h3>{{ $beT('Create external draft') }}</h3></div>
            <div class="card-body">
                <form method="POST" action="{{ route('admin.external-events.listings.store',['locale'=>app()->getLocale()]) }}">
                    @csrf
                    <div class="row">
                        <div class="col-md-6 mb-3"><label class="form-label">{{ $beT('Source') }}</label><select class="form-control" name="source_id" required><option value="">—</option>@foreach($sources as $source)<option value="{{ $source->id }}" @selected(old('source_id')===$source->id)>{{ $source->name }}</option>@endforeach</select></div>
                        <div class="col-md-6 mb-3"><label class="form-label">{{ $beT('Booketik editorial owner') }}</label><select class="form-control" name="organizer_id" required><option value="">—</option>@foreach($organizers as $org)<option value="{{ $org->id }}" @selected(old('organizer_id')===$org->id)>{{ $org->name }}</option>@endforeach</select></div>
                        <div class="col-md-6 mb-3"><label class="form-label">{{ $beT('External identifier') }}</label><input class="form-control" name="external_id" required maxlength="190" value="{{ old('external_id') }}"></div>
                        <div class="col-md-6 mb-3"><label class="form-label">{{ $beT('Real organizer name') }}</label><input class="form-control" name="organizer_name" maxlength="255" value="{{ old('organizer_name') }}"></div>
                        <div class="col-md-12 mb-3"><label class="form-label">{{ $beT('Event title') }}</label><input class="form-control" name="title" maxlength="255" required value="{{ old('title') }}"></div>
                        <div class="col-md-12 mb-3"><label class="form-label">{{ $beT('Summary') }}</label><textarea class="form-control" name="summary" rows="2" maxlength="1000">{{ old('summary') }}</textarea></div>
                        <div class="col-md-6 mb-3"><label class="form-label">{{ $beT('Local start date') }}</label><input type="datetime-local" class="form-control" name="starts_at" required value="{{ old('starts_at') }}"></div>
                        <div class="col-md-6 mb-3"><label class="form-label">{{ $beT('Timezone') }}</label><input class="form-control" name="timezone" required value="{{ old('timezone','Europe/Brussels') }}"></div>
                        <div class="col-md-12 mb-3"><label class="form-label">{{ $beT('Official event URL (HTTPS)') }}</label><input type="url" class="form-control" name="official_url" required maxlength="2048" placeholder="https://" value="{{ old('official_url') }}"></div>
                    </div>
                    @if($organizers->isEmpty())<p class="text-danger">{{ $beT('Create an active Booketik editorial organizer in the Organizers section first.') }}</p>@endif
                    <p class="small text-muted">{{ $beT('The owner is internal; the real organizer is stored separately. Ticketing is disabled and the event stays a draft.') }}</p>
                    <button type="submit" class="btn btn-primary" @disabled($sources->isEmpty() || $organizers->isEmpty())>{{ $beT('Create draft') }}</button>
                </form>
            </div>
        </div>
    </div>
</div>
<div class="card card-default mb-4">
    <div class="card-header card-header-border-bottom"><h3>{{ $beT('Import sources') }} ({{ $sources->count() }})</h3></div>
    <div class="card-body">
        <div class="row">
            @forelse($sources as $source)
                <div class="col-lg-6 mb-3">
                    <div class="border rounded p-3 h-100">
                        <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2"><div><strong>{{ $source->name }}</strong><div class="small text-muted">{{ $source->key }} · {{ $source->listings_count }} {{ $beT('listings') }}</div></div><span class="badge {{ $source->sync_enabled ? 'badge-success' : 'badge-secondary' }}">{{ $source->sync_enabled ? $beT('Active') : $beT('Paused') }}</span></div>
                        @if($source->key === 'agenda-brussels')
                            <form method="POST" action="{{ route('admin.external-events.sources.sync',['locale'=>app()->getLocale(),'source'=>$source->id]) }}">
                                @csrf
                                <input type="hidden" name="sync_enabled" value="{{ $source->sync_enabled ? '0' : '1' }}">
                                <button type="submit" class="btn btn-sm {{ $source->sync_enabled ? 'btn-outline-warning' : 'btn-outline-success' }}" @disabled(!$source->sync_enabled && !$source->enabled)>{{ $source->sync_enabled ? $beT('Pause import') : $beT('Resume import') }}</button>
                                @if(!$source->enabled)<div class="small text-muted mt-2">{{ $beT('Source disabled. Global sync settings remain independent.') }}</div>@endif
                            </form>
                        @else
                            <span class="small text-muted">{{ $beT('No automatic import configured for this source.') }}</span>
                        @endif
                    </div>
                </div>
            @empty
                <p>{{ $beT('No source yet.') }}</p>
            @endforelse
        </div>
    </div>
</div>
<div class="card card-default">
    <div class="card-header card-header-border-bottom"><h3>{{ $beT('External event listings') }} ({{ $listings->total() }})</h3></div>
    <div class="card-body">
        <form class="row align-items-end mb-3" method="GET" action="{{ route('admin.external-events.index',['locale'=>app()->getLocale()]) }}">
            <div class="col-lg-5 col-md-6 mb-2"><label class="form-label" for="external-search">{{ $beT('Search events') }}</label><input id="external-search" type="search" class="form-control" name="q" maxlength="120" value="{{ request('q') }}" placeholder="{{ $beT('Title or external ID') }}"></div>
            <div class="col-lg-4 col-md-4 mb-2"><label class="form-label" for="external-status">{{ $beT('Editorial status') }}</label><select id="external-status" class="form-control" name="status"><option value="">{{ $beT('All statuses') }}</option>@foreach(['syndicated','excluded','draft','approved'] as $status)<option value="{{ $status }}" @selected(request('status') === $status)>{{ $beT(ucfirst($status)) }}</option>@endforeach</select></div>
            <div class="col-lg-3 col-md-2 mb-2"><button class="btn btn-primary" type="submit">{{ $beT('Filter') }}</button> <a class="btn btn-outline-secondary" href="{{ route('admin.external-events.index',['locale'=>app()->getLocale()]) }}">{{ $beT('Reset') }}</a></div>
        </form>
        <style>
            .be-external-list{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,360px),1fr));gap:14px}
            .be-external-item{border:1px solid #ddd;border-radius:10px;padding:16px;min-width:0}
            .be-external-item h4{font-size:1rem;line-height:1.4;overflow-wrap:anywhere;margin:0 0 8px}
            .be-external-meta{font-size:.85rem;overflow-wrap:anywhere;color:#666;margin-bottom:10px}
            .be-external-actions{display:flex;gap:8px;flex-wrap:wrap}
            .be-external-actions .btn{white-space:normal}
        </style>
        <div class="be-external-list">
            @forelse($listings as $listing)
                <article class="be-external-item">
                    <h4>{{ $listing->event?->title ?: $beT('Untitled event') }}</h4>
                    <div class="be-external-meta">{{ $listing->source?->name }} · {{ $listing->event?->starts_at?->format('d/m/Y H:i') ?: '—' }}</div>
                    <div class="be-external-meta">{{ $beT('Editorial') }}: <strong>{{ $beT(ucfirst($listing->editorial_status)) }}</strong> · {{ $beT('Publication') }}: {{ $listing->event?->status?->value ?? '—' }}</div>
                    <div class="be-external-actions">
                        <a class="btn btn-sm btn-outline-primary" href="{{ route('admin.external-events.listings.edit',['locale'=>app()->getLocale(),'listing'=>$listing->id]) }}">{{ $beT('Edit / review') }}</a>
                        @if($listing->editorial_status === 'syndicated')
                            <form method="POST" action="{{ route('admin.external-events.listings.exclude',['locale'=>app()->getLocale(),'listing'=>$listing->id]) }}">@csrf<button class="btn btn-sm btn-outline-danger" type="submit">{{ $beT('Exclude / hide') }}</button></form>
                        @elseif($listing->editorial_status === 'excluded')
                            <form method="POST" action="{{ route('admin.external-events.listings.restore',['locale'=>app()->getLocale(),'listing'=>$listing->id]) }}">@csrf<button class="btn btn-sm btn-outline-secondary" type="submit">{{ $beT('Lift exclusion') }}</button></form>
                        @endif
                    </div>
                </article>
            @empty
                <p>{{ $beT('No matching external events.') }}</p>
            @endforelse
        </div>
        <div class="mt-3">{{ $listings->links() }}</div>
    </div>
</div>
@endsection
