<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CreateAcademicYearRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check();
    }

    public function rules(): array
    {
        return [
            'year' => ['required', 'integer', 'between:2000,2100'],
            'description' => ['nullable', 'string', 'max:255'],
        ];
    }

    public function messages(): array
    {
        return [
            'year.required' => "L'année académique est requise.",
            'year.integer'  => "L'année académique doit être un nombre.",
            'year.between'  => "L'année académique doit être comprise entre 2000 et 2100.",
            'description.string' => 'La description doit être du texte valide.',
            'description.max' => 'La description ne peut pas dépasser 255 caractères.',
        ];
    }
}
