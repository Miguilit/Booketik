{{-- Light / dark. Remembered in this browser only; with nothing stored the
     panel follows the OS (see theme-boot). --}}
<button type="button" class="cl-theme-toggle" id="cl-theme-toggle"
        aria-label="{{ __('Switch between light and dark') }}" title="{{ __('Light or dark') }}">
    <i class="mdi mdi-white-balance-sunny cl-theme-light" aria-hidden="true"></i>
    <i class="mdi mdi-brightness-2 cl-theme-dark" aria-hidden="true"></i>
</button>
<script>
    (function () {
        var button = document.getElementById('cl-theme-toggle');
        if (!button) return;
        button.addEventListener('click', function () {
            var root = document.documentElement;
            var current = root.getAttribute('data-theme')
                || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
            var next = current === 'dark' ? 'light' : 'dark';
            root.setAttribute('data-theme', next);
            try { localStorage.setItem('eg-admin-theme', next); } catch (e) {}
            // Charts read the colour tokens when drawn; this tells them to redraw.
            window.dispatchEvent(new CustomEvent('eg-theme-change'));
        });
        if (window.matchMedia) {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () {
                window.dispatchEvent(new CustomEvent('eg-theme-change'));
            });
        }
    })();
</script>
