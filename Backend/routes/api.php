<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\PvDocumentController;
use App\Http\Controllers\Api\PvFileController;
use App\Http\Controllers\Api\ActivityLogController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\TrainingCatalogController;
use App\Http\Controllers\Api\TrainingImportController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| PV Archiving System — API Routes
|--------------------------------------------------------------------------
*/

// ── Public routes ─────────────────────────────────────────────────

Route::get('/ping', fn () => response()->json([
    'status'  => 'ok',
    'message' => 'PV Archiving System API is running',
    'version' => '1.0.0',
]));

use App\Http\Controllers\Api\PasswordResetController;

Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/forgot-password', [PasswordResetController::class, 'forgotPassword']);
    Route::post('/verify-code', [PasswordResetController::class, 'verifyCode']);
    Route::post('/reset-password', [PasswordResetController::class, 'resetPassword']);
});

// ── Protected routes ──────────────────────────────────────────────

Route::middleware('auth:sanctum')->group(function () {

    // Auth
    Route::prefix('auth')->group(function () {
        Route::post('/logout',          [AuthController::class, 'logout']);
        Route::get('/me',               [AuthController::class, 'me']);
        Route::patch('/me',             [AuthController::class, 'updateProfile']);
        Route::post('/change-password', [AuthController::class, 'changePassword']);
    });

    // ── PV Documents ──────────────────────────────────────────────
    // Search + filters handled via index() params:
    // GET /api/pv-documents?search=...&type=...&status=...&niveau=...&filiere=...&groupe=...&academic_year=...

    Route::get('pv-types/available', [PvDocumentController::class, 'availableTypes']);

    // Read: all authenticated roles
    Route::get('pv-documents',              [PvDocumentController::class, 'index']);
    Route::get('pv-documents/{pvDocument}', [PvDocumentController::class, 'show']);

    // Create: admin + gestionnaire
    Route::middleware('role:admin,gestionnaire')->group(function () {
        Route::post('pv-documents',                      [PvDocumentController::class, 'store']);
    });

    // Update: admin + gestionnaire + archiviste
    Route::middleware('role:admin,gestionnaire,archiviste')->group(function () {
        Route::put('pv-documents/{pvDocument}',          [PvDocumentController::class, 'update']);
        Route::patch('pv-documents/{pvDocument}',        [PvDocumentController::class, 'update']);
        Route::patch('pv-documents/{pvDocument}/status', [PvDocumentController::class, 'updateStatus']);
    });

    // Delete: admin only
    Route::middleware('role:admin')->group(function () {
        Route::delete('pv-documents/{pvDocument}', [PvDocumentController::class, 'destroy']);
    });

    // ── File Upload & Download ─────────────────────────────────────
    Route::middleware('role:admin,gestionnaire,archiviste')->group(function () {
        Route::post('pv-documents/{pvDocument}/files', [PvFileController::class, 'store']);
        Route::delete('pv-files/{pvFile}',             [PvFileController::class, 'destroy']);
    });

    Route::get('pv-files/{pvFile}/download', [PvFileController::class, 'download']);

    // ── Activity Log ──────────────────────────────────────────────
    // Stats (all authenticated roles — used by dashboard)
    Route::get('activity-logs/stats', [ActivityLogController::class, 'stats']);

    // Full log: admin + gestionnaire only
    Route::middleware('role:admin,gestionnaire')->group(function () {
        Route::get('activity-logs', [ActivityLogController::class, 'index']);
    });

    // ── Dashboard stats — all roles ───────────────────────────────
    Route::get('dashboard/stats', [PvDocumentController::class, 'dashboardStats']);

    // ── Training catalog — read: all authenticated roles ─────────────
    Route::get('training/academic-years', [TrainingCatalogController::class, 'academicYears']);
    Route::get('training/sectors',        [TrainingCatalogController::class, 'sectors']);
    Route::get('training/levels',         [TrainingCatalogController::class, 'levels']);
    Route::get('training/filieres',       [TrainingCatalogController::class, 'filieres']);
    Route::get('training/creneaux',       [TrainingCatalogController::class, 'creneaux']);
    Route::get('training/groups',         [TrainingCatalogController::class, 'groups']);

    // ── Training write — admin & gestionnaire ──────────────────────
    Route::middleware('role:admin,gestionnaire')->group(function () {
        Route::post('training/academic-years', [TrainingCatalogController::class, 'store']);
        Route::post('training/import',         [TrainingImportController::class, 'store']);
    });

    // ── User Management (Phase 8) — admin only ────────────────────
    Route::middleware('role:admin')->group(function () {
        Route::apiResource('users', UserController::class);
        Route::patch('users/{user}/toggle-active', [UserController::class, 'toggleActive']);
    });

    // ── Notifications — all authenticated roles ────────────────────
    Route::get ('notifications',             [NotificationController::class, 'index']);
    Route::patch('notifications/read-all',   [NotificationController::class, 'markAllRead']);
    Route::patch('notifications/{id}/read',  [NotificationController::class, 'markRead']);
});