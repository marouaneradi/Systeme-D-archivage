<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_list_users(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        User::factory()->count(3)->create();

        $response = $this->actingAs($admin)->getJson('/api/users');

        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'data' => [
                         '*' => ['id', 'name', 'email', 'role']
                     ]
                 ]);
    }

    public function test_admin_can_create_user(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $response = $this->actingAs($admin)->postJson('/api/users', [
            'name' => 'New User',
            'email' => 'newuser@example.com',
            'role' => 'gestionnaire',
        ]);

        $response->assertStatus(201)
                 ->assertJson(['name' => 'New User', 'email' => 'newuser@example.com', 'role' => 'gestionnaire']);
                 
        $this->assertDatabaseHas('users', ['email' => 'newuser@example.com']);
    }

    public function test_non_admin_cannot_create_user(): void
    {
        $gestionnaire = User::factory()->create(['role' => 'gestionnaire']);

        $response = $this->actingAs($gestionnaire)->postJson('/api/users', [
            'name' => 'New User',
            'email' => 'newuser@example.com',
            'role' => 'archiviste',
        ]);

        $response->assertStatus(403);
    }

    public function test_admin_can_toggle_user_status(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $user = User::factory()->create(['role' => 'consultant', 'is_active' => true]);

        $response = $this->actingAs($admin)->patchJson("/api/users/{$user->id}/toggle-active");

        $response->assertStatus(200);
        $this->assertDatabaseHas('users', ['id' => $user->id, 'is_active' => 0]);
    }
}
