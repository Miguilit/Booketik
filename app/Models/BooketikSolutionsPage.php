<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

final class BooketikSolutionsPage extends Model
{
    protected $table = 'booketik_solutions_pages';
    protected $fillable = ['page_key', 'content_id', 'published_revision_id', 'published_by', 'published_at'];

    protected function casts(): array
    {
        return ['published_revision_id' => 'integer', 'published_at' => 'datetime'];
    }

    public function content(): BelongsTo
    {
        return $this->belongsTo(Content::class, 'content_id');
    }

    public function revisions(): HasMany
    {
        return $this->hasMany(BooketikSolutionsRevision::class, 'page_id');
    }
}
