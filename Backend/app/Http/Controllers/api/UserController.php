<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Mail;
use App\Mail\UserCreatedMail;

class UserController extends Controller
{
    /**
     * GET /api/users
     * List all users with optional filters.
     */
    public function index(Request $request): JsonResponse
    {
        $query = User::orderBy('created_at', 'desc');

        if ($request->filled('role')) {
            $query->where('role', $request->role);
        }

        if ($request->filled('search')) {
            $term = $request->search;
            $query->where(function ($q) use ($term) {
                $q->where('name',  'like', "%{$term}%")
                  ->orWhere('email', 'like', "%{$term}%");
            });
        }

        $users = $query->paginate($request->get('per_page', 50));

        return response()->json($users);
    }

    /**
     * POST /api/users
     * Create a new user.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'     => ['required', 'string', 'max:100'],
            'email'    => ['required', 'email', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            'role'     => ['required', Rule::in(['admin', 'gestionnaire', 'archiviste', 'consultant'])],
        ]);

        $user = User::create([
            'name'      => $validated['name'],
            'email'     => $validated['email'],
            'password'  => Hash::make($validated['password']),
            'role'      => $validated['role'],
            'is_active' => true,
        ]);

        try {
            Mail::to($user->email)->send(new UserCreatedMail($user, $validated['password']));
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error("Failed to send user creation email to {$user->email}: " . $e->getMessage());
        }

        ActivityLog::record('CREATE', $user, "Nouvel utilisateur : {$user->name} ({$user->role})");

        return response()->json($user, 201);
    }

    /**
     * GET /api/users/{user}
     * Show a single user.
     */
    public function show(User $user): JsonResponse
    {
        return response()->json($user);
    }

    /**
     * PUT /api/users/{user}
     * Update a user.
     */
    public function update(Request $request, User $user): JsonResponse
    {
        $validated = $request->validate([
            'name'     => ['sometimes', 'string', 'max:100'],
            'email'    => ['sometimes', 'email', Rule::unique('users')->ignore($user->id)],
            'role'     => ['sometimes', Rule::in(['admin', 'gestionnaire', 'archiviste', 'consultant'])],
            'password' => ['sometimes', 'nullable', 'string', 'min:8'],
        ]);

        if (isset($validated['password']) && $validated['password']) {
            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']);
        }

        $user->update($validated);

        ActivityLog::record('UPDATE', $user, "Utilisateur modifié : {$user->name}");

        return response()->json($user->fresh());
    }

    /**
     * PATCH /api/users/{user}/toggle-active
     * Toggle the is_active flag.
     */
    public function toggleActive(User $user): JsonResponse
    {
        // Prevent admin from deactivating themselves
        if ($user->id === auth()->id()) {
            return response()->json([
                'message' => 'Vous ne pouvez pas désactiver votre propre compte.',
            ], 422);
        }

        $user->update(['is_active' => ! $user->is_active]);

        $action = $user->is_active ? 'activé' : 'désactivé';
        ActivityLog::record('UPDATE', $user, "Compte {$action} : {$user->name}");

        return response()->json($user->fresh());
    }

    /**
     * DELETE /api/users/{user}
     * Delete a user.
     */
    public function destroy(User $user): JsonResponse
    {
        // Prevent self-deletion
        if ($user->id === auth()->id()) {
            return response()->json([
                'message' => 'Vous ne pouvez pas supprimer votre propre compte.',
            ], 422);
        }

        $name = $user->name;

        // Log BEFORE deletion so the target model still exists
        ActivityLog::record('DELETE', $user, "Utilisateur supprimé : {$name}");

        // Revoke all tokens
        $user->tokens()->delete();
        $user->delete();

        return response()->json(['message' => "Utilisateur « {$name} » supprimé avec succès."]);
    }
}