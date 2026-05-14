<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AcademicYear extends Model
{
    protected $fillable = [
        'year',
        'label',
        'description',
        'status',
    ];

    public function sectors(): HasMany
    {
        return $this->hasMany(Sector::class);
    }

    public function levels(): HasMany
    {
        return $this->hasMany(Level::class);
    }

    public function filieres(): HasMany
    {
        return $this->hasMany(Filiere::class);
    }

    public function creneaux(): HasMany
    {
        return $this->hasMany(Creneau::class);
    }

    public function trainingGroups(): HasMany
    {
        return $this->hasMany(TrainingGroup::class);
    }
}
