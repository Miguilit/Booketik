import { useEffect, useRef, useState } from 'react';
import { router, useForm, usePage } from '@inertiajs/react';
import { openAuthDialog, openVerifyEmailDialog } from '@/Core/lib/auth/authDialog';

const STRINGS = {
    fr: { register: 'Créer un compte et envoyer la demande', signin: 'Déjà inscrit ? Se connecter',
        start: 'Envoyer ma revendication', pending: 'Demande en attente de vérification',
        verifying: 'Confirmez votre adresse e-mail pour finaliser la demande.',
        free: 'Cette fiche reste visible gratuitement. Aucune billetterie n’est activée.',
        discoveryTitle: 'Testez BOOKETIK Découverte : billetterie gratuite jusqu’à 50 billets',
        discoveryBody: 'Une billetterie sans abonnement ni commission BOOKETIK. Les frais du prestataire de paiement restent à la charge de l’organisateur.',
        discoveryNotice: 'La revendication et son approbation ne déclenchent pas la vente de billets. L’activation fera l’objet d’un contrôle distinct.',
        profile: 'Un profil organisateur gratuit sera créé si nécessaire.',
        choose: 'Sélectionner mon organisateur', evidence: 'Ajouter un justificatif',
        proof: 'Lien officiel démontrant votre lien avec cet événement',
        note: 'Expliquez votre lien avec cet événement', save: 'Envoyer le justificatif',
        approved: 'Votre lien avec cet événement a été vérifié.',
        rejected: 'Cette revendication a été refusée.',
        fail: 'La demande n’a pas pu être enregistrée. Réessayez ou contactez le support.',
        login: 'Connectez-vous pour poursuivre votre demande.' },
    nl: { register: 'Account aanmaken en aanvraag indienen', signin: 'Al een account? Aanmelden',
        start: 'Mijn claim indienen', pending: 'Aanvraag wacht op controle',
        verifying: 'Bevestig uw e-mailadres om de aanvraag af te ronden.',
        free: 'Deze vermelding blijft gratis zichtbaar. Ticketverkoop wordt niet geactiveerd.',
        discoveryTitle: 'Probeer BOOKETIK Ontdekking: gratis ticketbeheer tot 50 tickets',
        discoveryBody: 'Ticketverkoop zonder abonnement of BOOKETIK-commissie. De organisator draagt eventuele kosten van de betaalprovider.',
        discoveryNotice: 'Een claim of goedkeuring ervan activeert geen ticketverkoop. Activering vereist een afzonderlijke controle.',
        profile: 'Indien nodig maken we een gratis organisatorprofiel aan.',
        choose: 'Kies mijn organisator', evidence: 'Bewijs toevoegen',
        proof: 'Officiële link die uw band met dit evenement aantoont',
        note: 'Beschrijf uw relatie met het evenement', save: 'Bewijs versturen',
        approved: 'Uw band met dit evenement is geverifieerd.',
        rejected: 'Deze claim is afgewezen.',
        fail: 'Uw aanvraag kon niet worden opgeslagen. Probeer opnieuw of contacteer de ondersteuning.',
        login: 'Meld u aan om verder te gaan.' },
    en: { register: 'Create account and submit claim', signin: 'Already registered? Sign in',
        start: 'Submit my claim', pending: 'Claim pending review',
        verifying: 'Verify your email address to complete your request.',
        free: 'This listing remains free to display. Ticketing will not be enabled.',
        discoveryTitle: 'Try BOOKETIK Discovery: free ticketing for up to 50 tickets',
        discoveryBody: 'Ticketing with no subscription or BOOKETIK sales commission. Payment-provider charges remain payable by the organizer.',
        discoveryNotice: 'A claim or its approval never enables ticket sales. Activation requires a separate review.',
        profile: 'A free organizer profile will be created if needed.',
        choose: 'Choose my organizer', evidence: 'Add evidence',
        proof: 'Official URL proving your connection to the event',
        note: 'Explain your relationship to this event', save: 'Send evidence',
        approved: 'Your connection to this event has been verified.',
        rejected: 'This claim has been rejected.',
        fail: 'We could not submit your request. Please try again or contact support.',
        login: 'Sign in to continue your claim.' },
};

/** One panel inside each native Event page. Auth remains Eventgoo's own global dialog. */
export default function ExternalClaimInline({ claim }) {
    const { auth, locale } = usePage().props;
    const user = auth?.user ?? null;
    const words = STRINGS[(locale || 'en').slice(0, 2)] || STRINGS.en;
    const [expanded, setExpanded] = useState(Boolean(claim?.intent));
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState(null);
    const attempted = useRef(false);
    const orgs = claim?.organizers || [];
    const [orgId, setOrgId] = useState('');
    const proof = useForm({ verification_url: '', verification_note: '' });
    const thisPage = typeof window !== 'undefined' ? window.location.pathname + window.location.search : null;

    // The visitor explicitly initiated the claim before the native auth dialog.
    // Finish only when the same session and a verified account return to this page.
    useEffect(() => {
        if (!claim?.intent || !user?.emailVerified || attempted.current || claim.mine) return;
        attempted.current = true;
        router.post(claim.finishUrl, {}, {
            preserveScroll: true,
            onError: () => setMessage(words.fail),
            onFinish: () => setBusy(false),
        });
    }, [claim?.intent, claim?.mine, claim?.finishUrl, user?.emailVerified]);

    if (!claim?.beginUrl) return null;
    const begin = (authMode = null) => {
        attempted.current = Boolean(user?.emailVerified);
        if (busy) return;
        setMessage(null);
        setBusy(true);
        router.post(claim.beginUrl, orgId ? { organizer_id: orgId } : {}, {
            preserveScroll: true,
            onSuccess: () => {
                if (!user) {
                    openAuthDialog(authMode || (auth?.canRegister === false ? 'login' : 'register'), words.login, { to: thisPage });
                } else if (!user.emailVerified) {
                    openVerifyEmailDialog({ send: true });
                } else {
                    attempted.current = true;
                    router.post(claim.finishUrl, {}, { preserveScroll: true, onError: () => setMessage(words.fail) });
                }
            },
            onError: () => setMessage(words.fail),
            onFinish: () => setBusy(false),
        });
    };

    const state = claim.mine?.status;
    return <div id="claim" className="min-w-0 rounded-card border-key border-edge bg-surface p-4 text-ink shadow-key sm:p-5">
        <h2 className="break-words font-display text-lg font-bold leading-snug">{claim.title}</h2>
        {claim.pitch && <p className="mt-3 break-words font-display text-base font-semibold leading-snug text-ink">{claim.pitch}</p>}
        <p className="mt-2 break-words text-sm leading-relaxed text-body">{claim.description}</p>
        {!expanded && !claim.mine && <button type="button" onClick={() => setExpanded(true)} className="mt-3 rounded-btn border-key border-edge bg-ink px-4 py-2 text-sm font-semibold text-bg hover:opacity-90">{claim.action}</button>}
        {(expanded || claim.mine) && <div className="mt-4 space-y-3 border-t border-line pt-4">
            <section aria-label={words.discoveryTitle} className="rounded-card border border-line bg-raised p-4 sm:p-5">
                <p className="font-display text-base font-bold leading-snug text-ink">{words.discoveryTitle}</p>
                <p className="mt-2 text-sm leading-relaxed text-body">{words.discoveryBody}</p>
                <p className="mt-2 text-xs leading-relaxed text-muted">{words.discoveryNotice}</p>
            </section>
            <p className="text-sm text-body">{words.free}</p>
            {state ? <>
                <p role="status" className="rounded-sm bg-tint px-3 py-2 text-sm text-on-tint">{state === 'pending' ? words.pending : state === 'approved' ? words.approved : words.rejected}</p>
                {state === 'pending' && !claim.mine?.hasEvidence && <form onSubmit={(e) => { e.preventDefault(); proof.post(claim.evidenceUrl, { preserveScroll: true }); }} className="space-y-3">
                    <h3 className="font-semibold">{words.evidence}</h3>
                    <label className="block text-sm font-medium">{words.proof}<input type="url" required maxLength={2048} value={proof.data.verification_url} onChange={e => proof.setData('verification_url', e.target.value)} className="mt-1 block w-full min-w-0 rounded-btn border border-line bg-raised px-3 py-2 text-ink" placeholder="https://" /></label>
                    <label className="block text-sm font-medium">{words.note}<textarea required minLength={20} maxLength={2000} rows={3} value={proof.data.verification_note} onChange={e => proof.setData('verification_note', e.target.value)} className="mt-1 block w-full min-w-0 rounded-btn border border-line bg-raised px-3 py-2 text-ink" /></label>
                    {Object.values(proof.errors).length > 0 && <p role="alert" className="text-sm text-danger">{Object.values(proof.errors).join(' · ')}</p>}
                    <button type="submit" disabled={proof.processing} className="rounded-btn bg-ink px-4 py-2 text-sm font-semibold text-bg disabled:opacity-50">{words.save}</button>
                </form>}
            </> : <>
                <p className="text-xs text-muted">{words.profile}</p>
                {user && orgs.length > 1 && <label className="block text-sm font-medium">{words.choose}<select value={orgId} onChange={e=>setOrgId(e.target.value)} required className="mt-1 block w-full min-w-0 rounded-btn border border-line bg-raised px-3 py-2 text-ink"><option value="">—</option>{orgs.map(o=><option key={o.id} value={o.id}>{o.name}</option>)}</select></label>}
                {claim.intent && !user && <p role="status" className="text-sm text-body">{words.login}</p>}
                {claim.intent && user && !user.emailVerified && <p role="status" className="text-sm text-body">{words.verifying}</p>}
                {(!claim.intent || (user && user.emailVerified) || !user) && <button type="button" disabled={busy || (user && orgs.length > 1 && !orgId)} onClick={() => { if (claim.intent && !user) openAuthDialog(auth?.canRegister === false ? 'login' : 'register', words.login, { to: thisPage }); else begin(); }} className="w-full rounded-btn bg-ink px-4 py-3 text-sm font-semibold text-bg disabled:opacity-50 sm:w-auto">{user ? words.start : words.register}</button>}
                {claim.intent && user && !user.emailVerified && <button type="button" className="block text-sm font-semibold text-link underline underline-offset-4" onClick={() => openVerifyEmailDialog({ send: true })}>{words.verifying}</button>}
                {!user && <button type="button" className="block text-sm font-semibold text-link underline underline-offset-4" onClick={() => { if (!claim.intent) begin('login'); else openAuthDialog('login', words.login, { to: thisPage }); }}>{words.signin}</button>}
            </>}
            {message && <p role="alert" className="text-sm text-danger">{message}</p>}
        </div>}
    </div>;
}
