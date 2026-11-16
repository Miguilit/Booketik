{{--
    Eventgoo pagination.

    Replaces Laravel's `bootstrap-5` paginator, which was mismatched against
    sleek's Bootstrap *4* build:

      * it emits BS5-only utilities (`fw-semibold`, `flex-sm-fill`) that
        resolve to nothing here;
      * it renders the control set twice — a mobile Previous/Next pair and a
        separate desktop block — relying on `d-sm-none` / `d-sm-flex` to show
        one of them;
      * BS4 sizes `.page-link` purely from its padding and content, so
        "Previous", "1" and "Next" each ended up a different height.

    One set of controls here, with the height fixed in CSS rather than implied
    by the text inside each button.
--}}
@if ($paginator->hasPages())
    <nav class="cl-pagination-bar" role="navigation" aria-label="{{ __('Pagination Navigation') }}">
        <div class="cl-pagination-summary">
            @if ($paginator->total() > 0)
                Showing <strong>{{ $paginator->firstItem() }}</strong>–<strong>{{ $paginator->lastItem() }}</strong>
                of <strong>{{ number_format($paginator->total()) }}</strong>
            @endif
        </div>

        <ul class="pagination">
            {{-- Previous --}}
            @if ($paginator->onFirstPage())
                <li class="page-item disabled" aria-disabled="true">
                    <span class="page-link" aria-hidden="true">&lsaquo;</span>
                </li>
            @else
                <li class="page-item">
                    <a class="page-link" href="{{ $paginator->previousPageUrl() }}" rel="prev"
                       aria-label="{{ __('Previous') }}">&lsaquo;</a>
                </li>
            @endif

            {{-- Page numbers --}}
            @foreach ($elements as $element)
                @if (is_string($element))
                    <li class="page-item disabled" aria-disabled="true">
                        <span class="page-link cl-page-gap">{{ $element }}</span>
                    </li>
                @endif

                @if (is_array($element))
                    @foreach ($element as $page => $url)
                        @if ($page == $paginator->currentPage())
                            <li class="page-item active" aria-current="page">
                                <span class="page-link">{{ $page }}</span>
                            </li>
                        @else
                            <li class="page-item">
                                <a class="page-link" href="{{ $url }}">{{ $page }}</a>
                            </li>
                        @endif
                    @endforeach
                @endif
            @endforeach

            {{-- Next --}}
            @if ($paginator->hasMorePages())
                <li class="page-item">
                    <a class="page-link" href="{{ $paginator->nextPageUrl() }}" rel="next"
                       aria-label="{{ __('Next') }}">&rsaquo;</a>
                </li>
            @else
                <li class="page-item disabled" aria-disabled="true">
                    <span class="page-link" aria-hidden="true">&rsaquo;</span>
                </li>
            @endif
        </ul>
    </nav>
@endif
