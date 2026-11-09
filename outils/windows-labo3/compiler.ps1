# ============================================================================
# compiler.ps1 — publication de « STI v2.0 version spéciale Labo 3 »
# ----------------------------------------------------------------------------
# À exécuter sur un poste de préparation Windows avec SDK .NET 8.
# La clé PUBLIQUE Ed25519 est embarquée dans l'exécutable : c'est elle qui
# décide quelles autorisations signées seront acceptées hors ligne.
# Ne jamais passer la clé privée, ni la copier sur le support distribué.
#
#   .\outils\windows-labo3\compiler.ps1 -ClePublique C:\Administration\publique.pem
#   .\outils\windows-labo3\compiler.ps1 -ClePublique C:\Administration\publique.pem -Tester
#
# Aucun artefact n'est publié sur GitHub par ce script.
# ==========================================================================
param(
    [Parameter(Mandatory = $true)][string]$ClePublique,
    [string]$Sortie = "$PSScriptRoot\..\..\dist-stipack\windows-labo3",
    [switch]$Tester
)
$ErrorActionPreference = 'Stop'
$ClePublique = (Resolve-Path -LiteralPath $ClePublique).Path
if ((Get-Content -Raw -LiteralPath $ClePublique) -notmatch '^-----BEGIN PUBLIC KEY-----') {
    throw 'Fournir uniquement la clé PUBLIQUE Ed25519 (SPKI), jamais la clé privée.'
}
# Contrôle avant compilation : une clé invalide produirait un installateur qui
# refuse toutes les autorisations, sans erreur visible.
if (Get-Command node -ErrorAction SilentlyContinue) {
    node (Join-Path $PSScriptRoot 'verifier-cle-publique.mjs') $ClePublique
    if ($LASTEXITCODE -ne 0) { throw 'Clé publique refusée : compilation annulée.' }
} else {
    # Apostrophe droite et guillemets doubles : PowerShell traite U+2019 comme un
    # délimiteur de chaîne, ce qui casse l'analyse du script.
    Write-Warning "Node.js absent : la clé publique n'a pas pu être vérifiée avant compilation."
}
if ($Tester) {
    $fixture = Join-Path $env:TEMP ("sti-labo3-fixture-" + [guid]::NewGuid().ToString('N'))
    $guid = (Get-ItemProperty 'HKLM:\SOFTWARE\Microsoft\Cryptography').MachineGuid
    node "$PSScriptRoot\..\windows-labo3-tests\preparer-fixture.mjs" $fixture $guid
    if ($LASTEXITCODE -ne 0) { throw 'Préparation de la fixture de test échouée.' }
    dotnet run --project "$PSScriptRoot\..\windows-labo3-tests\STILabo3.Tests.csproj" -c Release "-p:Labo3PublicKey=$fixture\publique.pem" -- $fixture
    if ($LASTEXITCODE -ne 0) { Remove-Item -Recurse -Force $fixture; throw 'Tests Windows échoués : ne pas publier.' }
    Remove-Item -Recurse -Force $fixture
}
dotnet publish "$PSScriptRoot\STILabo3.csproj" -c Release -r win-x64 --self-contained true `
    -p:PublishSingleFile=true -p:IncludeNativeLibrariesForSelfExtract=true `
    "-p:Labo3PublicKey=$ClePublique" -o $Sortie
if ($LASTEXITCODE -ne 0) { throw 'Publication échouée ; ne pas distribuer les fichiers partiels.' }
$exe = Join-Path $Sortie 'STI-Labo3-Installation.exe'
if (-not (Test-Path -LiteralPath $exe)) { throw 'Exécutable absent de la sortie de publication.' }
# Contrôle final : l'exécutable publié doit embarquer exactement la clé publique
# fournie, et doit pouvoir démarrer. L'empreinte est lue depuis le binaire lui-même.
$rapport = Join-Path $env:TEMP ("sti-labo3-cle-" + [guid]::NewGuid().ToString('N') + ".txt")
try {
    $processus = Start-Process -FilePath $exe -ArgumentList '--afficher-cle', "`"$rapport`"" -Wait -PassThru -WindowStyle Hidden
    if ($processus.ExitCode -ne 0 -or -not (Test-Path -LiteralPath $rapport)) {
        throw "L'exécutable publié n'a pas répondu au contrôle de clé (code $($processus.ExitCode))."
    }
    $embarquee = (Get-Content -Raw -LiteralPath $rapport).Trim()
    $attendue = (Get-FileHash -Algorithm SHA256 -LiteralPath $ClePublique).Hash.ToLowerInvariant()
    if ($embarquee -ne $attendue) {
        throw "Clé embarquée ($embarquee) différente de la clé fournie ($attendue) : publication refusée."
    }
    Write-Host "Clé publique embarquée vérifiée : $embarquee"
}
finally { if (Test-Path -LiteralPath $rapport) { Remove-Item -Force -LiteralPath $rapport } }
Write-Host "Publication autonome : $exe"
Write-Host 'Rappels avant diffusion : tester sur un poste autorisé ET sur un poste non autorisé ;'
Write-Host 'vérifier le refus sans Internet ; ne jamais joindre la clé privée au support USB.'
Get-FileHash -Algorithm SHA256 $exe
