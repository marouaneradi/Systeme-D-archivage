<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AcademicYear;
use App\Models\Creneau;
use App\Models\Filiere;
use App\Models\Level;
use App\Models\Sector;
use App\Models\TrainingGroup;
use App\Http\Requests\CreateAcademicYearRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TrainingCatalogController extends Controller
{
    public function academicYears(Request $request): JsonResponse
    {
        $years = AcademicYear::orderBy('year', 'desc')->get();

        return response()->json($years);
    }

    public function sectors(Request $request): JsonResponse
    {
        $query = Sector::query();

        if ($request->filled('academic_year_id')) {
            $query->where('academic_year_id', $request->academic_year_id);
        }

        return response()->json($query->orderBy('name')->get());
    }

    public function levels(Request $request): JsonResponse
    {
        $query = Level::query();

        if ($request->filled('academic_year_id')) {
            $query->where('academic_year_id', $request->academic_year_id);
        }

        return response()->json($query->orderBy('order_value')->orderBy('code')->get());
    }

    public function filieres(Request $request): JsonResponse
    {
        $query = Filiere::with(['sector', 'level']);

        if ($request->filled('academic_year_id')) {
            $query->where('academic_year_id', $request->academic_year_id);
        }
        if ($request->filled('sector_id')) {
            $query->where('sector_id', $request->sector_id);
        }
        if ($request->filled('level_id')) {
            $query->where('level_id', $request->level_id);
        }

        return response()->json($query->orderBy('name')->get());
    }

    public function creneaux(Request $request): JsonResponse
    {
        $query = Creneau::query();

        if ($request->filled('academic_year_id')) {
            $query->where('academic_year_id', $request->academic_year_id);
        }

        return response()->json($query->orderBy('order_value')->orderBy('code')->get());
    }

    public function groups(Request $request): JsonResponse
    {
        $query = TrainingGroup::with(['filiere', 'creneau']);

        if ($request->filled('academic_year_id')) {
            $query->where('academic_year_id', $request->academic_year_id);
        }
        if ($request->filled('filiere_id')) {
            $query->where('filiere_id', $request->filiere_id);
        }
        if ($request->filled('creneau_id')) {
            $query->where('creneau_id', $request->creneau_id);
        }

        return response()->json($query->orderBy('code')->get());
    }

    public function store(CreateAcademicYearRequest $request): JsonResponse
    {
        $year = (int) $request->input('year');
        $label = sprintf('%d-%d', $year, $year + 1);

        $academicYear = AcademicYear::firstOrCreate(
            ['year' => $year],
            ['label' => $label, 'description' => $request->input('description'), 'status' => 'draft']
        );

        if ($academicYear->wasRecentlyCreated === false) {
            $academicYear->fill([
                'label' => $label,
                'description' => $request->input('description'),
            ]);
            if ($academicYear->isDirty()) {
                $academicYear->save();
            }
        }

        return response()->json([
            'message' => 'Promotion créée avec succès.',
            'data' => $academicYear,
        ]);
    }
}
