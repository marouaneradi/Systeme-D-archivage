<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\PvDocument;
use App\Models\PvFile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class PvFileController extends Controller
{
    /**
     * POST /api/pv-documents/{pvDocument}/files
     * Upload one or more files for a PV document.
     */
    public function store(Request $request, PvDocument $pvDocument): JsonResponse
    {
        $request->validate([
            'files'             => ['required', 'array', 'min:1'],
            'files.*'           => [
                'required',
                'file',
                'mimes:pdf,jpg,jpeg,png',
                'max:10240', // 10 MB per file
            ],
        ]);

        $uploaded = [];

        $index = $pvDocument->files()->count() + 1;

        foreach ($request->file('files') as $file) {
            $extension   = $file->getClientOriginalExtension();
            
            $safeType    = preg_replace('/[^A-Za-z0-9]/', '_', $pvDocument->type ?? 'PV');
            $safeYear    = preg_replace('/[^A-Za-z0-9]/', '_', $pvDocument->academic_year ?? 'annee');
            $safeFiliere = preg_replace('/[^A-Za-z0-9]/', '_', $pvDocument->filiere ?? 'filiere');
            $safeGroupe  = preg_replace('/[^A-Za-z0-9]/', '_', $pvDocument->groupe ?? 'groupe');
            
            $baseName = strtoupper("{$safeType}_{$safeYear}_{$safeFiliere}_{$safeGroupe}");
            $baseName = preg_replace('/_+/', '_', $baseName); // clean up double underscores
            
            $newName = "{$baseName}_{$index}.{$extension}";
            
            // Use the descriptive name for the physical file too, appending a unique id to avoid collisions
            $storedName  = "{$baseName}_{$index}_" . uniqid() . '.' . $extension;
            $storagePath = "pv_files/{$pvDocument->id}";

            // Store in storage/app/private/pv_files/{pvDocument->id}/
            $path = $file->storeAs($storagePath, $storedName, 'local');

            $pvFile = PvFile::create([
                'pv_document_id' => $pvDocument->id,
                'original_name'  => $newName,
                'stored_name'    => $storedName,
                'file_path'      => $path,
                'file_type'      => strtolower($extension),
                'file_size'      => $file->getSize(),
                'uploaded_by'    => auth()->id(),
            ]);

            $uploaded[] = $pvFile->load('uploader:id,name');
            $index++;
        }

        ActivityLog::record(
            'UPLOAD',
            $pvDocument,
            "PV #{$pvDocument->id} — " . count($uploaded) . " fichier(s)",
            ['files' => collect($uploaded)->pluck('original_name')]
        );

        return response()->json([
            'message' => count($uploaded) . ' fichier(s) uploadé(s) avec succès.',
            'files'   => $uploaded,
        ], 201);
    }

    /**
     * GET /api/pv-files/{pvFile}/download
     * Download or preview a file.
     */
    public function download(PvFile $pvFile): mixed
    {
        if (! Storage::disk('local')->exists($pvFile->file_path)) {
            return response()->json(['message' => 'Fichier introuvable sur le serveur.'], 404);
        }

        ActivityLog::record(
            'VIEW',
            $pvFile->pvDocument,
            "Téléchargement : {$pvFile->original_name}"
        );

        return Storage::disk('local')->download(
            $pvFile->file_path,
            $pvFile->original_name
        );
    }

    /**
     * DELETE /api/pv-files/{pvFile}
     * Delete a file from storage and database.
     */
    public function destroy(PvFile $pvFile): JsonResponse
    {
        $name = $pvFile->original_name;

        // Delete physical file from storage
        if (Storage::disk('local')->exists($pvFile->file_path)) {
            Storage::disk('local')->delete($pvFile->file_path);
        }

        $pvDocument = $pvFile->pvDocument;
        $pvFile->delete();

        ActivityLog::record(
            'DELETE',
            $pvDocument,
            "Fichier supprimé : {$name}"
        );

        return response()->json(['message' => "Fichier « {$name} » supprimé avec succès."]);
    }
}
