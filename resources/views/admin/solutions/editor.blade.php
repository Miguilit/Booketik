@extends('admin.admin_master')
@section('admin')
    {{-- BOOKETIK Solutions R1C visual editor. Routed only behind auth+staff+admin and a config gate. --}}
    <link rel="stylesheet" href="{{ asset('assets/booketik-solutions-editor-r1c.css') }}">
    <div class="container-fluid py-4">
        <div class="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-3">
            <div>
                <h2>BOOKETIK · Solutions</h2>
                <p class="text-muted mb-0">Éditeur éditorial multilingue · FR / NL / EN · révisions immuables</p>
            </div>
            <div class="d-flex flex-wrap gap-2 align-items-center">
                @if($revision)
                    <a href="{{ route('admin.solutions.preview', ['locale' => app()->getLocale()]) }}"
                       target="_blank" rel="noopener noreferrer"
                       class="btn btn-success" aria-label="Prévisualiser la dernière révision enregistrée (nouvel onglet)">
                        👁 Prévisualiser la page
                    </a>
                @else
                    <span class="btn btn-outline-secondary disabled" aria-disabled="true" title="Enregistrez d’abord un brouillon">Prévisualiser la page</span>
                @endif
                @if(config('booketik_solutions.pricing_admin_enabled') === true)
                    <a href="{{ route('admin.solutions.offers', ['locale' => app()->getLocale()]) }}" class="btn btn-outline-primary">Prestations &amp; tarifs</a>
                @endif
                <a href="{{ route('admin.content.pages', ['locale' => app()->getLocale()]) }}" class="btn btn-outline-secondary">← Pages</a>
            </div>
        </div>
        @include('admin.partials.flash')
        @if ($errors->any())
            <div class="alert alert-danger" role="alert">
                @foreach ($errors->all() as $error) <p class="mb-1">{{ $error }}</p> @endforeach
            </div>
        @endif
        <div class="alert alert-info" role="status">
            Le contenu peut être enregistré en brouillon même si une traduction manque.
            La publication exige FR, NL et EN. Les autres langues utilisent l'anglais.
            <strong>La page publique Solutions et la vente des forfaits restent désactivées.</strong>
        </div>
        <div class="card p-3 mb-3">
            <div class="d-flex flex-wrap align-items-center justify-content-between gap-2">
                <p class="mb-1">Dernière révision : <strong>{{ $currentVersion }}</strong></p>
                @if($revision)
                    <small class="text-muted">Identifiant de révision : {{ $revision->id }}</small>
                @else
                    <small class="text-muted">Aucun brouillon enregistré</small>
                @endif
            </div>
            <form id="bks-editor-form" method="POST" action="{{ route('admin.solutions.draft', ['locale' => app()->getLocale()]) }}">
                @csrf
                <input type="hidden" name="expected_version" value="{{ $currentVersion }}">
                <div id="bks-editor" aria-label="Éditeur visuel de la page Solutions"></div>
                <details class="bks-editor-advanced mb-3">
                    <summary>Mode expert : document JSON</summary>
                    <p class="text-muted small mt-2">Ne modifiez pas les tarifs ici. Le document JSON est validé par Laravel lors de l’enregistrement.</p>
                    <label for="bks-document" class="form-label">Document structuré</label>
                    <textarea class="form-control font-monospace" id="bks-document" name="document" rows="16" spellcheck="false">{{ old('document', $json) }}</textarea>
                </details>
                <button class="btn btn-success" type="submit">Enregistrer un brouillon</button>
            </form>
        </div>
        @if($revision)
            <div class="card p-3">
                <h3 class="h5">Publication éditoriale interne</h3>
                <p class="text-muted small">Cette opération vérifie les traductions et sélectionne la révision publiée en interne. Elle n'active ni la page publique, ni les prix, ni les paiements.</p>
                <form method="POST" action="{{ route('admin.solutions.publish', ['locale' => app()->getLocale()]) }}">
                    @csrf
                    <input type="hidden" name="revision_id" value="{{ $revision->id }}">
                    <input type="hidden" name="expected_version" value="{{ $currentVersion }}">
                    <button class="btn btn-outline-success" type="submit">Valider et publier la révision en interne</button>
                </form>
            </div>
        @endif
    </div>
    <script defer src="{{ asset('assets/booketik-solutions-editor-r1g.js') }}"></script>
@endsection
