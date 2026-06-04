<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\TrainingImportRequest;
use App\Services\TrainingCatalogImportService;
use Illuminate\Http\JsonResponse;

class TrainingImportController extends Controller
{
    public function __construct(private TrainingCatalogImportService $importService)
    {
    }

    public function store(TrainingImportRequest $request): JsonResponse
    {
        $file = $request->file('file');
        
        if ($request->has('year')) {
            $year = (int) $request->input('year');
            $label = sprintf('%d-%d', $year, $year + 1);

            $academicYear = \App\Models\AcademicYear::firstOrCreate(
                ['year' => $year],
                ['label' => $label, 'status' => 'draft']
            );
            $academicYearId = $academicYear->id;
        } else {
            $academicYearId = $request->input('academic_year_id');
        }

        $result = $this->importService->import($file->getPathname(), $academicYearId);

        return response()->json([
            'message' => 'Importation de la promotion terminée avec succès.',
            'data' => $result,
        ]);
    }
}
