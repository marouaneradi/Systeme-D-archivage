<?php

namespace App\Services;

use App\Models\AcademicYear;
use App\Models\Creneau;
use App\Models\Filiere;
use App\Models\Level;
use App\Models\Sector;
use App\Models\TrainingGroup;
use Illuminate\Support\Facades\DB;
use Shuchkin\SimpleXLSX;
use Throwable;

class TrainingCatalogImportService
{
    public function import(string $filePath, int $academicYearId = null): array
    {
        $xlsx = SimpleXLSX::parse($filePath);
        if (! $xlsx) {
            throw new \RuntimeException('Unable to parse Excel file: ' . SimpleXLSX::parseError());
        }

        $rows = $xlsx->rows();
        if (count($rows) < 2) {
            throw new \RuntimeException('Excel file must contain a header row and at least one data row.');
        }

        $headers = $this->normalizeHeaders(array_shift($rows));
        $requiredColumns = ['creneau', 'annee', 'niveau', 'secteur', 'code_filiere', 'filiere', 'groupe'];

        foreach ($requiredColumns as $column) {
            if (! array_key_exists($column, $headers)) {
                throw new \RuntimeException("Missing required column: {$column}");
            }
        }

        $data = [];
        foreach ($rows as $rowIndex => $row) {
            $rowData = [];
            foreach ($requiredColumns as $column) {
                $value = $row[$headers[$column]] ?? null;
                $rowData[$column] = $this->normalizeCellValue($value);
            }

            if (empty($rowData['groupe'])) {
                continue;
            }

            $data[] = $rowData;
        }

        if (empty($data)) {
            throw new \RuntimeException('No valid rows found in the Excel file.');
        }

        $yearValues = collect(array_column($data, 'annee'))
            ->filter()
            ->unique()
            ->values();

        if ($yearValues->count() !== 1) {
            throw new \RuntimeException('Excel file must contain exactly one academic year in the Année column.');
        }

        $year = (int) $yearValues->first();
        if ($year <= 0) {
            throw new \RuntimeException('Academic year must be a valid number.');
        }

        if ($academicYearId !== null) {
            $existingYear = AcademicYear::find($academicYearId);
            if (! $existingYear) {
                throw new \RuntimeException('Academic year record not found.');
            }
            if ($existingYear->year !== $year) {
                throw new \RuntimeException(sprintf('L\'année du fichier (%d) ne correspond pas à la promotion sélectionnée (%d).', $year, $existingYear->year));
            }
        }

        $label = sprintf('%d-%d', $year, $year + 1);

        return DB::transaction(function () use ($data, $year, $label, $academicYearId) {
            $academicYear = AcademicYear::firstOrCreate(
                ['year' => $year],
                ['label' => $label, 'status' => 'active']
            );

            if ($academicYear->id !== $academicYearId && $academicYearId !== null) {
                throw new \RuntimeException('Mismatch between created and provided academic year IDs.');
            }

            if ($academicYear->label !== $label) {
                $academicYear->update(['label' => $label]);
            }

            $created = [
                'sectors'      => 0,
                'levels'       => 0,
                'filieres'     => 0,
                'creneaux'     => 0,
                'trainingGroups' => 0,
            ];

            $creneauxCache = [];
            $sectorCache = [];
            $levelCache = [];
            $filiereCache = [];
            $groupCache = [];

            foreach ($data as $row) {
                $creneau = $this->findOrCreateCreneau($academicYear, $row['creneau']);
                $sector  = $this->findOrCreateSector($academicYear, $row['secteur']);
                $level   = $this->findOrCreateLevel($academicYear, $row['niveau']);
                $filiere = $this->findOrCreateFiliere($academicYear, $sector, $level, $row['code_filiere'], $row['filiere']);
                $group   = $this->findOrCreateTrainingGroup($academicYear, $filiere, $creneau, $row['groupe']);

                $this->incrementCache($creneauxCache, $creneau->id, $created, 'creneaux');
                $this->incrementCache($sectorCache, $sector->id, $created, 'sectors');
                $this->incrementCache($levelCache, $level->id, $created, 'levels');
                $this->incrementCache($filiereCache, $filiere->id, $created, 'filieres');
                $this->incrementCache($groupCache, $group->id, $created, 'trainingGroups');
            }

            return [
                'academic_year_id' => $academicYear->id,
                'year' => $academicYear->year,
                'label' => $academicYear->label,
                'counts' => $created,
            ];
        });
    }

    private function normalizeHeaders(array $headers): array
    {
        $map = [];
        foreach ($headers as $index => $header) {
            $normalized = mb_strtolower(trim((string) $header));
            $normalized = str_replace([' ', 'é', 'è', 'ê', 'à', 'â', 'û', 'î', 'ô', 'ï', 'ç', '-'], ['_', 'e', 'e', 'e', 'a', 'a', 'u', 'i', 'o', 'i', 'c', '_'], $normalized);
            $normalized = preg_replace('/_+/', '_', $normalized);
            $map[$normalized] = $index;
        }

        $acceptedColumns = [
            'creneau'      => 'creneau',
            'annee'        => 'annee',
            'niveau'       => 'niveau',
            'secteur'      => 'secteur',
            'code_filiere' => 'code_filiere',
            'filiere'      => 'filiere',
            'groupe'       => 'groupe',
        ];

        $normalizedHeaders = [];
        foreach ($map as $header => $index) {
            if (isset($acceptedColumns[$header])) {
                $normalizedHeaders[$acceptedColumns[$header]] = $index;
            }
        }

        return $normalizedHeaders;
    }

    private function normalizeCellValue($value): string
    {
        if (is_null($value)) {
            return '';
        }

        return trim((string) $value);
    }

    private function findOrCreateCreneau(AcademicYear $year, string $code): Creneau
    {
        $code = strtoupper($code);
        $name = match ($code) {
            'CDJ' => 'Créneaux Diurne Jour',
            'CDS' => 'Créneaux Diurne Soir',
            default => $code,
        };

        return Creneau::updateOrCreate(
            ['academic_year_id' => $year->id, 'code' => $code],
            ['name' => $name, 'order_value' => $this->orderForCreneau($code)]
        );
    }

    private function findOrCreateSector(AcademicYear $year, string $name): Sector
    {
        $name = trim($name);

        return Sector::updateOrCreate(
            ['academic_year_id' => $year->id, 'name' => $name],
            ['name' => $name]
        );
    }

    private function findOrCreateLevel(AcademicYear $year, string $code): Level
    {
        $code = strtoupper(trim($code));
        $names = [
            'BP' => 'Baccalauréat Professionnel',
            'FQ' => 'Formation Qualifiante',
            'Q'  => 'Qualification',
            'S'  => 'Spécialisation',
            'T'  => 'Technicien',
            'TS' => 'Technicien Spécialisé',
        ];

        return Level::updateOrCreate(
            ['academic_year_id' => $year->id, 'code' => $code],
            ['name' => $names[$code] ?? $code, 'order_value' => $this->orderForLevel($code)]
        );
    }

    private function findOrCreateFiliere(AcademicYear $year, Sector $sector, Level $level, string $code, string $name): Filiere
    {
        $code = trim($code);
        $name = trim($name);

        return Filiere::updateOrCreate(
            ['academic_year_id' => $year->id, 'code' => $code],
            [
                'sector_id' => $sector->id,
                'level_id' => $level->id,
                'name' => $name,
                'description' => $name,
            ]
        );
    }

    private function findOrCreateTrainingGroup(AcademicYear $year, Filiere $filiere, Creneau $creneau, string $code): TrainingGroup
    {
        $code = trim($code);

        return TrainingGroup::updateOrCreate(
            ['academic_year_id' => $year->id, 'code' => $code],
            [
                'filiere_id' => $filiere->id,
                'creneau_id' => $creneau->id,
                'name' => $code,
                'status' => 'active',
            ]
        );
    }

    private function orderForCreneau(string $code): int
    {
        return match ($code) {
            'CDJ' => 1,
            'CDS' => 2,
            default => 99,
        };
    }

    private function orderForLevel(string $code): int
    {
        return match ($code) {
            'BP' => 10,
            'FQ' => 20,
            'Q'  => 30,
            'S'  => 40,
            'T'  => 50,
            'TS' => 60,
            default => 99,
        };
    }

    private function incrementCache(array &$cache, int $id, array &$created, string $key): void
    {
        if (! isset($cache[$id])) {
            $cache[$id] = true;
            $created[$key]++;
        }
    }
}
