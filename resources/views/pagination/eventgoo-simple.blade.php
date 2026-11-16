{{--
    Simple (previous/next only) variant, used when a query is paginated with
    `simplePaginate()`. Nothing calls it today, but `Paginator::defaultView()`
    and `defaultSimpleView()` are set together — leaving the simple one on the
    Bootstrap 5 view would reintroduce the mismatch the moment it is used.
--}}
@if ($paginator->hasPages())
    <nav class="cl-pagination-bar" role="navigation" aria-label="{{ __('Pagination Navigation') }}">
        <div class="cl-pagination-summary"></div>

        <ul class="pagination">
            @if ($paginator->onFirstPage())
                <li class="page-item disabled" aria-disabled="true">
                    <span class="page-link">{!! __('pagination.previous') !!}</span>
                </li>
            @else
                <li class="page-item">
                    <a class="page-link" href="{{ $paginator->previousPageUrl() }}" rel="prev">
                        {!! __('pagination.previous') !!}
                    </a>
                </li>
            @endif

            @if ($paginator->hasMorePages())
                <li class="page-item">
                    <a class="page-link" href="{{ $paginator->nextPageUrl() }}" rel="next">
                        {!! __('pagination.next') !!}
                    </a>
                </li>
            @else
                <li class="page-item disabled" aria-disabled="true">
                    <span class="page-link">{!! __('pagination.next') !!}</span>
                </li>
            @endif
        </ul>
    </nav>
@endif
