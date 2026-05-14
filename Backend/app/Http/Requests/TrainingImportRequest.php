<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class TrainingImportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check();
    }

    public function rules(): array
    {
        return [
            'file' => ['required', 'file', 'mimes:xlsx'],
            'academic_year_id' => ['required', 'integer', 'exists:academic_years,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'file.required' => 'Un fichier Excel est requis.',
            'file.file'     => 'Le fichier téléchargé doit être un document valide.',
            'file.mimes'    => 'Le fichier doit être au format XLSX.',
            'academic_year_id.required' => "L'année académique est requise.",
            'academic_year_id.exists'   => "L'année académique sélectionnée est invalide.",
        ];
    }
}
