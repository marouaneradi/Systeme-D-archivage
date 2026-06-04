<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\PvDocument;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PvDocumentTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_list_pv_documents(): void
    {
        $user = User::factory()->create(['role' => 'consultant']);
        
        $response = $this->actingAs($user)->getJson('/api/pv-documents');

        $response->assertStatus(200)
                 ->assertJsonStructure(['data']);
    }

    public function test_admin_can_create_pv(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $payload = [
            'type' => 'PV_FF',
            'academic_year' => '2023/2024',
            'niveau' => 'Technicien Spécialisé',
            'filiere' => 'Développement Digital',
            'groupe' => 'DEV101',
        ];

        $response = $this->actingAs($admin)->postJson('/api/pv-documents', $payload);

        $response->assertStatus(201)
                 ->assertJsonFragment(['type' => 'PV_FF', 'groupe' => 'DEV101']);
                 
        $this->assertDatabaseHas('pv_documents', ['groupe' => 'DEV101', 'status' => 'BROUILLON']);
    }

    public function test_consultant_cannot_create_pv(): void
    {
        $consultant = User::factory()->create(['role' => 'consultant']);

        $payload = [
            'type' => 'PV_FF',
            'academic_year' => '2023/2024',
            'niveau' => 'Technicien Spécialisé',
            'filiere' => 'Développement Digital',
            'groupe' => 'DEV101',
        ];

        $response = $this->actingAs($consultant)->postJson('/api/pv-documents', $payload);

        $response->assertStatus(403);
    }
}
