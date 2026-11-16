@extends('admin.admin_master')
@section('admin')
<div class="container-fluid py-4">
    <div class="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
        <div>
            <h2>BOOKETIK · Prestations par événement</h2>
            <p class="text-muted">Forfaits par événement, sans abonnement.</p>
        </div>
        <a class="btn btn-outline-secondary" href="{{ route('admin.solutions.edit', ['locale'=>app()->getLocale()]) }}">← Éditeur Solutions</a>
    </div>
    @include('admin.partials.flash')
    @if ($errors->any()) <div class="alert alert-danger" role="alert">@foreach($errors->all() as $error)<div>{{ $error }}</div>@endforeach</div>@endif
    <p class="text-muted small mb-3">Brouillons privés · achats désactivés · TVA à confirmer avant publication.</p>
    @if($offers->count() >= 2)
    <form method="POST" action="{{ route('admin.solutions.offers.update', ['locale'=>app()->getLocale(), 'code'=>$offers->first()->code]) }}" class="card p-3 p-md-4 mb-3">
        @csrf
        <input type="hidden" name="_pricing_action" value="thresholds">
        <h3 class="h5">Plafonds des forfaits</h3>
        <p class="text-muted">Les tranches suivantes se recalculent automatiquement.</p>
        <div class="row g-3">
        @foreach ($offers as $index => $offer)
            <input type="hidden" name="expected_versions[{{ $offer->code }}]" value="{{ $offer->version }}">
            <div class="col-md-6 col-xl-4">
                <label class="form-label" for="bks-tier-end-{{ $offer->id }}"><strong>{{ $offer->code }}</strong></label>
                @if($loop->last)
                    <input class="form-control" id="bks-tier-end-{{ $offer->id }}" value="Sans limite (dernier palier)" disabled>
                @else
                    <div class="input-group"><span class="input-group-text">Jusqu'à</span>
                        <input class="form-control" id="bks-tier-end-{{ $offer->id }}" type="number" inputmode="numeric"
                            min="1" max="10000000" step="1" required
                            name="upper_bounds[{{ $offer->code }}]" value="{{ old('upper_bounds.'.$offer->code, $offer->max_tickets) }}">
                        <span class="input-group-text">billets</span>
                    </div>
                @endif
                <small class="text-muted">Actuellement : {{ $offer->min_tickets }}–{{ $offer->max_tickets ?? '∞' }} · révision {{ $offer->version }}</small>
            </div>
        @endforeach
        </div>
        <div class="form-check mt-4">
            <input class="form-check-input" type="checkbox" name="confirm_free_tier_change" value="1" id="bks-confirm-free-tier">
            <label class="form-check-label" for="bks-confirm-free-tier">Je confirme la modification du plafond de l'offre gratuite.</label>
        </div>
        <div class="mt-3"><button type="submit" class="btn btn-success">Enregistrer les plafonds</button></div>
    </form>
    @endif
    @forelse ($offers as $offer)
        @php
            $texts = (array) $offer->translations;
            $major = $offer->price_minor === null ? '' : number_format($offer->price_minor / 100, ($offer->price_minor % 100 === 0 ? 0 : 2), '.', '');
        @endphp
        <form method="POST" action="{{ route('admin.solutions.offers.update', ['locale'=>app()->getLocale(), 'code'=>$offer->code]) }}" class="card p-3 p-md-4 mb-3">
            @csrf
            <input type="hidden" name="expected_version" value="{{ $offer->version }}">
            <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
                <h3 class="h5 mb-0">{{ $texts['fr']['title'] ?? $offer->code }} <small class="text-muted">· v{{ $offer->version }}</small></h3>
                <span class="badge bg-secondary">{{ $offer->status }}</span>
            </div>
            <p><strong>{{ $offer->min_tickets }} à {{ $offer->max_tickets ?? '∞' }} billets</strong> · {{ $offer->pricing_mode === 'quote' ? 'sur devis' : 'prix fixe' }} · EUR</p>
            <div class="row g-3 mb-3">
                <div class="col-lg-3"><label class="form-label" for="bks-price-{{ $offer->id }}">Prix en €</label>
                    <input class="form-control" id="bks-price-{{ $offer->id }}" name="price_eur" value="{{ $major }}" {{ $offer->pricing_mode === 'quote' ? 'readonly' : '' }} inputmode="decimal" aria-describedby="bks-price-info-{{ $offer->id }}">
                    <small id="bks-price-info-{{ $offer->id }}" class="text-muted">TVA et frais de paiement distincts.</small></div>
                <div class="col-lg-3"><label class="form-label" for="bks-vat-{{ $offer->id }}">Statut TVA</label>
                    <select class="form-select" name="vat_mode" id="bks-vat-{{ $offer->id }}">
                        @foreach(['pending'=>'À qualifier','inclusive'=>'TTC','exclusive'=>'HTVA','exempt'=>'Exonéré'] as $value=>$label)
                            <option value="{{ $value }}" @selected($offer->vat_mode===$value)>{{ $label }}</option>
                        @endforeach
                    </select></div>
                <div class="col-lg-3"><label class="form-label" for="bks-status-{{ $offer->id }}">Statut</label>
                    <select class="form-select" name="status" id="bks-status-{{ $offer->id }}">
                        <option value="draft" @selected($offer->status==='draft')>Brouillon</option>
                        <option value="approved" @selected($offer->status==='approved')>Approuvé</option>
                    </select></div>
                <div class="col-lg-3 d-flex flex-column justify-content-center gap-2">
                    <label><input type="hidden" name="visible" value="0"><input type="checkbox" name="visible" value="1" @checked($offer->visible)> Visible (après approbation)</label>
                    <label><input type="hidden" name="featured" value="0"><input type="checkbox" name="featured" value="1" @checked($offer->featured)> Mettre en avant</label>
                </div>
            </div>
            <div class="row g-3">
                @foreach(['fr'=>'Français','nl'=>'Nederlands','en'=>'English'] as $lang=>$label)
                    <div class="col-lg-4"><fieldset class="border rounded p-3 h-100">
                        <legend class="float-none w-auto px-1 h6">{{ $label }}</legend>
                        <label class="form-label">Nom</label><input class="form-control mb-2" name="title[{{ $lang }}]" maxlength="100" value="{{ $texts[$lang]['title'] ?? '' }}">
                        <label class="form-label">Description</label><textarea class="form-control mb-2" rows="3" maxlength="500" name="description[{{ $lang }}]">{{ $texts[$lang]['description'] ?? '' }}</textarea>
                        <label class="form-label">Texte du bouton</label><input class="form-control" maxlength="100" name="cta_label[{{ $lang }}]" value="{{ $texts[$lang]['cta_label'] ?? '' }}">
                    </fieldset></div>
                @endforeach
            </div>
            <div class="mt-3"><button type="submit" class="btn btn-success">Enregistrer le forfait</button></div>
        </form>
    @empty
        <div class="alert alert-info">Aucun forfait enregistré.</div>
    @endforelse
</div>
@endsection
