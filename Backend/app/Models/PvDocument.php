<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\AcademicYear;
use App\Models\Filiere;
use App\Models\TrainingGroup;

class PvDocument extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'type',
        'status',
        'academic_year',
        'niveau',
        'filiere',
        'groupe',
        'academic_year_id',
        'filiere_id',
        'training_group_id',
        'pv_ff_id',
        'semester',
        'session',
        'module',
        'physical_location',
        'notes',
        'created_by',
        'validated_by',
        'validated_at',
    ];

    protected $casts = [
        'validated_at' => 'datetime',
    ];

    // ── Relationships ──────────────────────────────────────────────

    /** The user who created this PV */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /** The user who validated this PV */
    public function validator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'validated_by');
    }

    /** Parent PV-FF document (for PV-CC and PV-EFM only) */
    public function parentPvFf(): BelongsTo
    {
        return $this->belongsTo(PvDocument::class, 'pv_ff_id');
    }

    /** Child PV-CC and PV-EFM documents (for PV-FF only) */
    public function children(): HasMany
    {
        return $this->hasMany(PvDocument::class, 'pv_ff_id');
    }

    public function academicYearRelation(): BelongsTo
    {
        return $this->belongsTo(AcademicYear::class, 'academic_year_id');
    }

    public function filiereRelation(): BelongsTo
    {
        return $this->belongsTo(Filiere::class, 'filiere_id');
    }

    public function trainingGroup(): BelongsTo
    {
        return $this->belongsTo(TrainingGroup::class, 'training_group_id');
    }

    /** All uploaded scan files for this PV */
    public function files(): HasMany
    {
        return $this->hasMany(PvFile::class);
    }
}
