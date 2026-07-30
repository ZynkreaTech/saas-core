# Usage: .\scripts\generate-barrels.ps1 -TargetDir packages/ui/src/components/ui
param(
    [Parameter(Mandatory = $true)][string]$TargetDir
)

$FolderName = Split-Path $TargetDir -Leaf
$OutFile = Join-Path (Split-Path $TargetDir -Parent) "index.ts"

$lines = @("// Auto-generated barrel - do not edit by hand, re-run generate-barrels.ps1 instead.
// after adding new components via `shadcn add`. Two example entries shown;
// every other generated component follows the same one-line pattern.")

# NOTE: -Include requires the path to end in \* (or -Recurse) to actually
# filter anything - passing it a plain folder path silently no-ops instead
# of erroring, which is why this previously produced an empty file.
Get-ChildItem -Path (Join-Path $TargetDir "*") -Include *.ts, *.tsx -File |
    Where-Object { $_.BaseName -ne "index" } |
    ForEach-Object {
        $lines += "export * from `"./$FolderName/$($_.BaseName)`";"
    }

$lines | Set-Content -Path $OutFile -Encoding UTF8
Write-Host "Barrel written to $OutFile"