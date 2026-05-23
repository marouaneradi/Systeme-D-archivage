<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class PasswordResetController extends Controller
{
    public function forgotPassword(Request $request)
    {
        $request->validate(['email' => 'required|email|exists:users,email']);

        // Generate 6-digit code
        $code = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        // Store or update in password_reset_tokens
        \Illuminate\Support\Facades\DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $request->email],
            [
                'token' => \Illuminate\Support\Facades\Hash::make($code),
                'created_at' => now(),
            ]
        );

        // Send email
        \Illuminate\Support\Facades\Mail::to($request->email)
            ->send(new \App\Mail\PasswordResetCodeMail($code));

        return response()->json(['message' => 'Un code a été envoyé à votre adresse email.']);
    }

    public function verifyCode(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'code' => 'required|string|size:6',
        ]);

        $reset = \Illuminate\Support\Facades\DB::table('password_reset_tokens')
            ->where('email', $request->email)
            ->first();

        if (!$reset || !\Illuminate\Support\Facades\Hash::check($request->code, $reset->token)) {
            return response()->json(['message' => 'Code invalide.'], 400);
        }

        // Optional: Check if expired (e.g. 15 minutes)
        if (\Carbon\Carbon::parse($reset->created_at)->addMinutes(15)->isPast()) {
            return response()->json(['message' => 'Le code a expiré.'], 400);
        }

        return response()->json(['message' => 'Code vérifié avec succès.']);
    }

    public function resetPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'code' => 'required|string|size:6',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $reset = \Illuminate\Support\Facades\DB::table('password_reset_tokens')
            ->where('email', $request->email)
            ->first();

        if (!$reset || !\Illuminate\Support\Facades\Hash::check($request->code, $reset->token)) {
            return response()->json(['message' => 'Code invalide ou expiré.'], 400);
        }

        if (\Carbon\Carbon::parse($reset->created_at)->addMinutes(15)->isPast()) {
            return response()->json(['message' => 'Le code a expiré.'], 400);
        }

        // Update the user's password
        $user = \App\Models\User::where('email', $request->email)->first();
        if ($user) {
            $user->password = \Illuminate\Support\Facades\Hash::make($request->password);
            $user->save();
        }

        // Clear the reset token
        \Illuminate\Support\Facades\DB::table('password_reset_tokens')
            ->where('email', $request->email)
            ->delete();

        return response()->json(['message' => 'Mot de passe réinitialisé avec succès.']);
    }
}
