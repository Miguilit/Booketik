{{--
    Demo only: shown when the site runs inside another site's frame, e.g. the
    CodeCanyon live preview, and never on the full site in its own tab.
    Browsers block a framed site's own cookies there (Safari, Firefox, Chrome
    with third-party cookies off), so sign-in and checkout can fail
    inside the frame; the button opens the real site in a new tab and × closes
    the notice. Self-contained: no build step, works on the site and the admin.
--}}
@if (config('eventgoo.demo_mode'))
<div id="demo-frame-notice"
     style="display:none;position:fixed;top:12px;left:50%;transform:translateX(-50%);z-index:2147483647;max-width:calc(100% - 24px);align-items:center;gap:12px;padding:10px 10px 10px 16px;border-radius:14px;background:rgba(19,32,31,.95);color:#fff;font:500 14px/1.35 system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;box-shadow:0 8px 28px rgba(0,0,0,.35);">
    <span>You're viewing the live demo inside a preview frame. To sign in or buy a ticket, open the full demo.</span>
    <a id="demo-frame-open" href="{{ url()->current() }}" target="_blank" rel="noopener"
       style="flex:none;padding:8px 14px;border-radius:10px;background:#FF6B2C;color:#13201F;font-weight:700;text-decoration:none;white-space:nowrap;">Open full demo ↗</a>
    <button type="button" id="demo-frame-close" aria-label="Close"
            style="flex:none;width:30px;height:30px;border:0;border-radius:8px;background:transparent;color:#bbb;font-size:22px;line-height:1;cursor:pointer;">×</button>
</div>
<script>
    (function () {
        var framed;
        try { framed = window.self !== window.top; } catch (e) { framed = true; }
        if (!framed) return; // the full site in its own tab: never shown

        // Closed with ×: stays closed while the visitor browses the preview.
        var KEY = 'demo-frame-notice';
        try { if (sessionStorage.getItem(KEY) === 'closed') return; } catch (e) {}

        var notice = document.getElementById('demo-frame-notice');
        var open = document.getElementById('demo-frame-open');
        // After <body> in the tree: overlays portalled into the body later (the
        // theme switcher uses the maximum z-index too) then paint underneath.
        document.documentElement.appendChild(notice);
        // An inline display beats the `hidden` attribute, so visibility is
        // driven through style.display only.
        notice.style.display = 'flex';

        // Single-page navigation changes the URL without reloading this markup,
        // so the full demo opens on the page the visitor is looking at.
        open.addEventListener('click', function () { open.href = window.location.href; });
        document.getElementById('demo-frame-close').addEventListener('click', function () {
            notice.style.display = 'none';
            try { sessionStorage.setItem(KEY, 'closed'); } catch (e) {}
        });
    })();
</script>
@endif
