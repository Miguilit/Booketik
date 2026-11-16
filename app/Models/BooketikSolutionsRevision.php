<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class BooketikSolutionsRevision extends Model
{
    protected $table = 'booketik_solutions_revisions';
    public $timestamps = false;
    protected $fillable = ['page_id', 'version', 'schema_version', 'payload', 'created_by', 'created_at'];

    protected function casts(): array
    {
        return ['payload' => 'array', 'version' => 'integer', 'schema_version' => 'integer', 'created_at' => 'datetime'];
    }

    public function page(): BelongsTo
    {
        return $this->belongsTo(BooketikSolutionsPage::class, 'page_id');
    }
}
