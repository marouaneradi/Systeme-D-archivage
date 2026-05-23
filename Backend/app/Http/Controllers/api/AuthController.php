<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * POST /api/auth/login
     * Authenticate user and return a Sanctum token.
     */
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email'    => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', $request->email)->first();

        // Check credentials
        if (! $user || ! Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Les identifiants sont incorrects.'],
            ]);
        }

        // Check if account is active
        if (! $user->is_active) {
            return response()->json([
                'message' => 'Votre compte a été désactivé. Contactez un administrateur.',
            ], 403);
        }

        // Revoke old tokens (single-session policy)
        $user->tokens()->delete();

        // Create new token with abilities based on role
        $token = $user->createToken(
            name: 'auth_token',
            abilities: $this->abilitiesFor($user->role)
        );

        // Log the login action
        ActivityLog::record('LOGIN', $user, $user->name, ['action' => 'login']);

        return response()->json([
            'token' => $token->plainTextToken,
            'user'  => [
                'id'    => $user->id,
                'name'  => $user->name,
                'email' => $user->email,
                'role'  => $user->role,
            ],
        ]);
    }

    /**
     * POST /api/auth/logout
     * Revoke the current user's token.
     */
    public function logout(Request $request): JsonResponse
    {
        ActivityLog::record('LOGOUT', $request->user(), $request->user()->name, ['action' => 'logout']);

        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Déconnecté avec succès.']);
    }

    /**
     * GET /api/auth/me
     * Return the currently authenticated user.
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'id'         => $user->id,
            'name'       => $user->name,
            'email'      => $user->email,
            'role'       => $user->role,
            'is_active'  => $user->is_active,
            'created_at' => $user->created_at?->toDateString(),
        ]);
    }

    /**
     * POST /api/auth/change-password
     * Change the authenticated user's password.
     */
    public function changePassword(Request $request): JsonResponse
    {
        $request->validate([
            'current_password' => ['required', 'string'],
            'new_password'     => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $user = $request->user();

        if (! Hash::check($request->current_password, $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['Le mot de passe actuel est incorrect.'],
            ]);
        }

        $user->update([
            'password' => Hash::make($request->new_password),
        ]);

        ActivityLog::record('UPDATE', $user, 'Mot de passe modifié par l\'utilisateur', ['action' => 'change_password']);

        return response()->json(['message' => 'Mot de passe modifié avec succès.']);
    }

    /**
     * Map roles to Sanctum token abilities.
     */
    private function abilitiesFor(string $role): array
    {
        return match ($role) {
            'admin'        => ['*'],
            'gestionnaire' => ['pv:read', 'pv:create', 'pv:update'],
            'archiviste'   => ['pv:read', 'pv:upload', 'pv:validate'],
            'consultant'   => ['pv:read'],
            default        => ['pv:read'],
        };
    }
}
