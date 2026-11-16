import { useState } from 'react';
import { Head } from '@inertiajs/react';
import { ExternalLink, Plus, Trash2 } from 'lucide-react';
import { useAction, useDashboard, dashboardHref } from '@/Core/dashboard';
import { t } from '@/Core/i18n';
import { dashLayout } from '@/Themes/civic/components/dashboard/Shell';
import { Hint, PageHead, Panel } from '@/Themes/civic/components/dashboard/kit';
import { CoverUpload } from '@/Themes/civic/components/dashboard/tabs/basicsParts';
import { Button, Field, IconButton, Input, Textarea } from '@/Themes/civic/components/ui';
import CityPicker from '@/Themes/civic/components/CityPicker';

/** The organizer's public hub: name, address, bio, pictures, links and city. */
export default function Profile({ profile, cities = [] }) {
    const { api } = useDashboard();
    const { run, busy, errors } = useAction();
    const [form, setForm] = useState({
        name: profile.name, slug: profile.slug, bio: profile.bio ?? '', contact_email: profile.contact_email ?? '',
        city_slug: profile.city_slug ?? '', links: profile.links?.length ? profile.links : [],
    });
    const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

    const save = (e) => {
        e.preventDefault();
        const body = { ...form, city_slug: form.city_slug || null, contact_email: form.contact_email || null, links: form.links.filter((l) => l.label && l.url) };
        run(() => api.org.patch('/profile', body), { key: 'save', success: t('Saved.') }).then((data) => {
            if (data?.slug && data.slug !== profile.slug) window.location.assign(dashboardHref(data.slug, '/profile'));
        });
    };
    const picture = (field) => (image) => run(() => api.org.patch('/profile', { [field]: Number(image.id) }), { success: t('Picture saved.'), reload: ['profile', 'frame'] });

    return (
        <>
            <Head title={t('Organizer profile')} />
            <PageHead title={t('Organizer profile')} actions={<Button variant="secondary" icon={ExternalLink} href={profile.public_url} external>{t('View hub')}</Button>} />
            <form onSubmit={save} className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
                <Panel title={t('About')}>
                    <div className="grid gap-4">
                        <Field label={t('Name')} htmlFor="p-name" error={errors.name} required><Input id="p-name" value={form.name} onChange={(e) => set('name', e.target.value)} required maxLength={120} /></Field>
                        <Field label={t('Address of your hub')} htmlFor="p-slug" error={errors.slug} hint={<span className="font-mono text-xs text-muted">/o/{form.slug}</span>}>
                            <Input id="p-slug" value={form.slug} onChange={(e) => set('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))} pattern="[a-z0-9]+(-[a-z0-9]+)*" minLength={3} maxLength={60} />
                        </Field>
                        <Hint>{t('Changing it breaks links people already have to your hub (event links keep working).')}</Hint>
                        <Field label={t('Bio')} htmlFor="p-bio" error={errors.bio}><Textarea id="p-bio" rows={5} maxLength={2000} value={form.bio} onChange={(e) => set('bio', e.target.value)} /></Field>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Field label={t('City')}><CityPicker cities={cities} value={form.city_slug} onChange={(slug) => set('city_slug', slug)} allowNone noneLabel={t('None')} buttonClassName="h-11 w-full justify-between rounded-md border-key border-edge bg-surface px-3 text-[15px] text-ink hover:bg-raised" /></Field>
                            <Field label={t('Contact email')} htmlFor="p-email" error={errors.contact_email}><Input id="p-email" type="email" value={form.contact_email} onChange={(e) => set('contact_email', e.target.value)} /></Field>
                        </div>
                        <div>
                            <p className="mb-2 text-sm font-semibold text-ink">{t('Links')}</p>
                            <div className="space-y-2">
                                {form.links.map((l, i) => (
                                    <div key={i} className="grid grid-cols-[1fr_1.6fr_auto] gap-2">
                                        <Input aria-label={t('Label')} placeholder={t('Instagram')} value={l.label} onChange={(e) => set('links', form.links.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} />
                                        <Input aria-label={t('Address')} type="url" placeholder="https://" value={l.url} onChange={(e) => set('links', form.links.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))} />
                                        <IconButton label={t('Remove link')} icon={Trash2} onClick={() => set('links', form.links.filter((_, j) => j !== i))} />
                                    </div>
                                ))}
                                {form.links.length < 8 && <Button size="sm" variant="secondary" icon={Plus} onClick={() => set('links', [...form.links, { label: '', url: '' }])}>{t('Add a link')}</Button>}
                            </div>
                        </div>
                        <div><Button type="submit" variant="cta" loading={busy === 'save'}>{t('Save profile')}</Button></div>
                    </div>
                </Panel>
                <div className="space-y-5">
                    <Panel title={t('Avatar')}><CoverUpload cover={profile.avatar} onUploaded={picture('avatar_media_id')} /></Panel>
                    <Panel title={t('Banner')}><CoverUpload cover={profile.banner} onUploaded={picture('banner_media_id')} /></Panel>
                </div>
            </form>
        </>
    );
}

Profile.layout = dashLayout;
