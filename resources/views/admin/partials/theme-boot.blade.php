<script>
    (function () {
        try {
            var mode = localStorage.getItem('eg-admin-theme');
            if (mode === 'light' || mode === 'dark') document.documentElement.setAttribute('data-theme', mode);
        } catch (e) {}
    })();
</script>
