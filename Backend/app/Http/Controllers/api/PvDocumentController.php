<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Api\NotificationController;
use App\Models\ActivityLog;
use App\Models\PvDocument;
use App\Models\Filiere;
use App\Models\TrainingGroup;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PvDocumentController extends Controller
{
    /**
     * GET /api/pv-documents
     * List all PV documents with optional filters.
     */
    public function index(Request $request): JsonResponse
    {
        $query = PvDocument::with(['creator:id,name', 'validator:id,name'])
            ->withCount('files');

        // ── Filters ────────────────────────────────────────────────
        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }
        if ($request->filled('status')) {
            $statuses = $request->status;
            if (! is_array($statuses)) {
                $statuses = explode(',', $statuses);
            }
            $query->whereIn('status', $statuses);
        }
        if ($request->filled('academic_year')) {
            $query->where('academic_year', $request->academic_year);
        }
        if ($request->filled('year_from')) {
            $query->where('academic_year', '>=', $request->year_from);
        }
        if ($request->filled('year_to')) {
            $query->where('academic_year', '<=', $request->year_to);
        }
        if ($request->filled('filiere')) {
            $query->where('filiere', 'like', "%{$request->filiere}%");
        }
        if ($request->filled('niveau')) {
            $query->where('niveau', $request->niveau);
        }
        if ($request->filled('groupe')) {
            $query->where('groupe', $request->groupe);
        }

        // ── Search across multiple fields ──────────────────────────
        if ($request->filled('search')) {
            $term = $request->search;
            $query->where(function ($q) use ($term) {
                $q->where('filiere', 'like', "%{$term}%")
                  ->orWhere('module',  'like', "%{$term}%")
                  ->orWhere('groupe',  'like', "%{$term}%")
                  ->orWhere('niveau',  'like', "%{$term}%");
            });
        }

        // ── Sorting ────────────────────────────────────────────────
        $allowedSorts = ['created_at', 'academic_year', 'status', 'type'];
        $sortColumn   = in_array($request->get('sort'), $allowedSorts)
            ? $request->get('sort')
            : 'created_at';
        $sortDir = $request->get('direction') === 'asc' ? 'asc' : 'desc';

        $documents = $query
            ->orderBy($sortColumn, $sortDir)
            ->paginate($request->get('per_page', 15));

        return response()->json($documents);
    }

    /**
     * GET /api/pv-types/available
     * Return available PV types based on duration and year level.
     */
    public function availableTypes(Request $request): JsonResponse
    {
        $request->validate([
            'filiere_id' => 'required|exists:filieres,id',
            'training_group_id' => 'required|exists:training_groups,id',
        ]);

        $filiere = Filiere::findOrFail($request->filiere_id);
        $group = TrainingGroup::findOrFail($request->training_group_id);

        $duration = $filiere->duration ?? 2; // Default to 2
        
        $yearLevel = 1;
        if (preg_match('/([1-3])\d{2}$/', $group->code, $matches)) {
            $yearLevel = (int) $matches[1];
        }

        $types = ['PV_PASSAGE', 'PV_INTERMEDIAIRE'];

        if ($yearLevel == 1) {
            // 1st year: only PV_PASSAGE, PV_INTERMEDIAIRE
        } elseif ($yearLevel == 2 && $duration == 2) {
            // 2nd year (2-year track): add PV_FF
            $types[] = 'PV_FF';
        } elseif ($yearLevel == 2 && $duration == 3) {
            // 2nd year (3-year track): no PV_FF yet
        } elseif ($yearLevel == 3) {
            // 3rd year: add PV_FF
            $types[] = 'PV_FF';
        }

        return response()->json([
            'types' => $types,
            'meta' => [
                'filiere_duration' => $duration,
                'group_year_level' => $yearLevel,
            ]
        ]);
    }

    /**
     * POST /api/pv-documents
     * Create a new PV document.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'type' => ['required', Rule::in(['PV_FF', 'PV_PASSAGE', 'PV_INTERMEDIAIRE'])],
        ]);

        $validated = $request->validate($this->rules($request->type));

        $document = PvDocument::create([
            ...$validated,
            'created_by' => auth()->id(),
            'status'     => 'BROUILLON',
        ]);

        ActivityLog::record('CREATE', $document, $this->label($document));

        NotificationController::notifyManagers(
            'created',
            'Nouveau document créé',
            'Un nouveau ' . $document->type . ' a été créé par ' . auth()->user()->name . '.',
            $document->id,
            $this->label($document)
        );

        return response()->json($document->load('creator:id,name'), 201);
    }

    /**
     * GET /api/pv-documents/{id}
     * Show a single PV document with its files and history.
     */
    public function show(PvDocument $pvDocument): JsonResponse
    {
        $pvDocument->load([
            'creator:id,name',
            'validator:id,name',
            'files.uploader:id,name',
        ]);

        $history = ActivityLog::where('target_type', 'PvDocument')
            ->where('target_id', $pvDocument->id)
            ->with('user:id,name')
            ->orderBy('created_at', 'desc')
            ->get();

        ActivityLog::record('VIEW', $pvDocument, $this->label($pvDocument));

        return response()->json([
            'document' => $pvDocument,
            'history'  => $history,
        ]);
    }

    /**
     * PATCH /api/pv-documents/{id}
     * Update a PV document.
     */
    public function update(Request $request, PvDocument $pvDocument): JsonResponse
    {
        if (! in_array($pvDocument->status, ['BROUILLON', 'EN_ATTENTE'])) {
            return response()->json([
                'message' => 'Ce document ne peut plus être modifié (statut : ' . $pvDocument->status . ').',
            ], 422);
        }

        $validated = $request->validate($this->rules($pvDocument->type, update: true));

        $oldStatus = $pvDocument->status;
        $pvDocument->update($validated);

        ActivityLog::record('UPDATE', $pvDocument, $this->label($pvDocument), [
            'changed_fields' => array_keys($validated),
            'old_status'     => $oldStatus,
            'new_status'     => $pvDocument->fresh()->status,
        ]);

        return response()->json($pvDocument->load('creator:id,name'));
    }

    /**
     * PATCH /api/pv-documents/{id}/status
     * Advance the document through the lifecycle.
     */
    public function updateStatus(Request $request, PvDocument $pvDocument): JsonResponse
    {
        $request->validate([
            'status' => ['required', Rule::in([
                'BROUILLON', 'EN_ATTENTE', 'VALIDE_PAPIER', 'ARCHIVE_NUMERIQUE', 'ARCHIVE_COMPLET',
            ])],
        ]);

        $oldStatus = $pvDocument->status;
        $pvDocument->update([
            'status'       => $request->status,
            'validated_by' => auth()->id(),
            'validated_at' => now(),
        ]);

        ActivityLog::record('VALIDATE', $pvDocument, $this->label($pvDocument), [
            'old_status' => $oldStatus,
            'new_status' => $request->status,
        ]);

        $statusLabels = [
            'EN_ATTENTE'       => 'En attente de validation',
            'VALIDE_PAPIER'    => 'Validé (papier)',
            'ARCHIVE_NUMERIQUE'=> 'Archivé numériquement',
            'ARCHIVE_COMPLET'  => 'Archivage complet',
            'BROUILLON'        => 'Brouillon',
        ];
        NotificationController::notifyManagers(
            'status_changed',
            'Statut mis à jour',
            '"' . $this->label($pvDocument) . '" est maintenant : ' . ($statusLabels[$request->status] ?? $request->status) . '.',
            $pvDocument->id,
            $this->label($pvDocument)
        );

        return response()->json($pvDocument->fresh());
    }

    /**
     * DELETE /api/pv-documents/{id}
     * Soft delete a PV document.
     */
    public function destroy(PvDocument $pvDocument): JsonResponse
    {
        ActivityLog::record('DELETE', $pvDocument, $this->label($pvDocument));
        $pvDocument->delete();

        return response()->json(['message' => 'Document supprimé avec succès.']);
    }

    /**
     * GET /api/dashboard/stats
     * Returns aggregate stats for the dashboard.
     */
    public function dashboardStats(): JsonResponse
    {
        $total = PvDocument::count();

        $byType = PvDocument::selectRaw('type, COUNT(*) as count')
            ->groupBy('type')
            ->pluck('count', 'type');

        $byStatus = PvDocument::selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status');

        $monthly = PvDocument::selectRaw('MONTH(created_at) as month, COUNT(*) as count')
            ->whereYear('created_at', now()->year)
            ->groupBy('month')
            ->orderBy('month')
            ->get();

        return response()->json([
            'total'     => $total,
            'by_type'   => $byType,
            'by_status' => $byStatus,
            'monthly'   => $monthly,
        ]);
    }

    // ── Helpers ───────────────────────────────────────────────────

    /**
     * Validation rules based on PV type.
     */
    private function rules(string $type, bool $update = false): array
    {
        $required = $update ? 'sometimes' : 'required';

        $common = [
            'physical_location' => ['nullable', 'string', 'max:100'],
            'notes'             => ['nullable', 'string'],
            'academic_year'     => [$required, 'string', 'max:20'],
            'niveau'            => [$required, 'string', 'max:50'],
            'filiere'           => [$required, 'string', 'max:100'],
            'groupe'            => [$required, 'string', 'max:20'],
            'academic_year_id'  => ['nullable', 'exists:academic_years,id'],
            'filiere_id'        => ['nullable', 'exists:filieres,id'],
            'training_group_id' => ['nullable', 'exists:training_groups,id'],
        ];

        return match ($type) {
            'PV_FF' => [
                ...$common,
                'type'              => [$required, Rule::in(['PV_FF'])],
            ],
            'PV_PASSAGE' => [
                ...$common,
                'type'     => [$required, Rule::in(['PV_PASSAGE'])],
            ],
            'PV_INTERMEDIAIRE' => [
                ...$common,
                'type'     => [$required, Rule::in(['PV_INTERMEDIAIRE'])],
            ],
            default => [],
        };
    }

    /**
     * Build a human-readable label for activity logs.
     */
    private function label(PvDocument $doc): string
    {
        $baseLabel = "{$doc->type} — {$doc->filiere} / {$doc->groupe} ({$doc->academic_year})";
        return $baseLabel;
    }
}