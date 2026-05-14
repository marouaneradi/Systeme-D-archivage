<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Api\NotificationController;
use App\Models\ActivityLog;
use App\Models\PvDocument;
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
        if ($request->filled('pv_ff_id')) {
            $query->where('pv_ff_id', $request->pv_ff_id);
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
     * POST /api/pv-documents
     * Create a new PV document.
     */
    public function store(Request $request): JsonResponse
    {
        // Pre-validate the type before loading type-specific rules
        $request->validate([
            'type' => ['required', Rule::in(['PV_FF', 'PV_CC', 'PV_EFM'])],
        ]);

        $validated = $request->validate($this->rules($request->type));

        $document = PvDocument::create([
            ...$validated,
            'created_by' => auth()->id(),
            'status'     => 'BROUILLON',
        ]);

        ActivityLog::record('CREATE', $document, $this->label($document));

        // Notify managers that a new document has been created
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

        // Attach activity history for this specific document
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
        // Only BROUILLON and EN_ATTENTE can be edited
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

        // Notify managers about status change
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
        // Total count
        $total = PvDocument::count();

        // Count by type
        $byType = PvDocument::selectRaw('type, COUNT(*) as count')
            ->groupBy('type')
            ->pluck('count', 'type');

        // Count by status
        $byStatus = PvDocument::selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status');

        // Monthly activity for current year
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
        ];

        return match ($type) {
            'PV_FF' => [
                ...$common,
                'type'              => [$required, Rule::in(['PV_FF'])],
                'academic_year'     => [$required, 'string', 'max:20'],
                'niveau'            => [$required, 'string', 'max:50'],
                'filiere'           => [$required, 'string', 'max:100'],
                'groupe'            => [$required, 'string', 'max:20'],
                'academic_year_id'  => ['nullable', 'exists:academic_years,id'],
                'filiere_id'        => ['nullable', 'exists:filieres,id'],
                'training_group_id' => ['nullable', 'exists:training_groups,id'],
            ],
            'PV_CC' => [
                ...$common,
                'type'     => [$required, Rule::in(['PV_CC'])],
                'pv_ff_id' => [$required, 'exists:pv_documents,id'],
                'module'   => [$required, 'string', 'max:100'],
                'semester' => [$required, 'string', 'max:20'],
            ],
            'PV_EFM' => [
                ...$common,
                'type'     => [$required, Rule::in(['PV_EFM'])],
                'pv_ff_id' => [$required, 'exists:pv_documents,id'],
                'module'   => [$required, 'string', 'max:100'],
                'session'  => [$required, Rule::in(['Ordinaire', 'Rattrapage'])],
            ],
            default => [],
        };
    }

    /**
     * Build a human-readable label for activity logs.
     */
    private function label(PvDocument $doc): string
    {
        return match ($doc->type) {
            'PV_FF'  => "PV-FF — {$doc->filiere} / {$doc->groupe} ({$doc->academic_year})",
            'PV_CC'  => "PV-CC — {$doc->module} / {$doc->semester}",
            'PV_EFM' => "PV-EFM — {$doc->module} / {$doc->session}",
            default  => "PV #{$doc->id}",
        };
    }
}