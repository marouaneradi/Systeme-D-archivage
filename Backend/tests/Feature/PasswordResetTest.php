<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class PasswordResetTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_request_password_reset_code(): void
    {
        $user = User::factory()->create(['email' => 'test@example.com']);

        $response = $this->postJson('/api/auth/forgot-password', [
            'email' => 'test@example.com',
        ]);

        $response->assertStatus(200)
                 ->assertJson(['message' => 'Un code a été envoyé à votre adresse email.']);
                 
        $this->assertDatabaseHas('password_reset_tokens', ['email' => 'test@example.com']);
    }

    public function test_user_can_reset_password_with_valid_code(): void
    {
        $user = User::factory()->create(['email' => 'test@example.com', 'password' => bcrypt('oldpassword')]);
        
        $code = '123456';
        DB::table('password_reset_tokens')->insert([
            'email' => 'test@example.com',
            'token' => Hash::make($code),
            'created_at' => now(),
        ]);

        $response = $this->postJson('/api/auth/reset-password', [
            'email' => 'test@example.com',
            'code' => $code,
            'password' => 'newpassword123',
            'password_confirmation' => 'newpassword123',
        ]);

        $response->assertStatus(200);
        
        // Ensure password was actually changed
        $user->refresh();
        $this->assertTrue(Hash::check('newpassword123', $user->password));
        
        // Ensure token was deleted
        $this->assertDatabaseMissing('password_reset_tokens', ['email' => 'test@example.com']);
    }
}
