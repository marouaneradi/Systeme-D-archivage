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
        $academicYearId = $request->input('academic_year_id');
        $result = $this->importService->import($file->getPathname(), $academicYearId);

        return response()->json([
            'message' => 'Importation de la promotion terminée avec succès.',
            'data' => $result,
        ]);
    }
}
